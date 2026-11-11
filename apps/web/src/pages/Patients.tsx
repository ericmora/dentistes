import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Card, EmptyState, Input, PageHeader, PermissionGate } from "@dentistes/ui";
import type { Patient } from "@dentistes/sdk";
import { useSession } from "../lib/session";

const emptyForm = {
  first_name: "",
  last_name: "",
  birth_date: "",
  phone: "",
  email: "",
};

export function PatientsPage() {
  const { sdk, me } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.listPatients({ q: q || undefined, limit: 50 });
        setPatients(res.patients);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los pacientes");
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await sdk.createPatient({
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
        phone: form.phone,
        email: form.email || undefined,
      });
      setForm(emptyForm);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el paciente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Pacientes" description="Ficha básica de pacientes del tenant activo" />

      {error ? (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Buscar" description="Nombre, apellido o teléfono" className="lg:col-span-2">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void load(query);
            }}
          >
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar paciente" />
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </form>
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <p className="text-sm text-slate-500">Cargando…</p>
            ) : patients.length === 0 ? (
              <EmptyState title="Sin pacientes" description="Crea el primer paciente o cambia la búsqueda." />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Paciente</th>
                    <th className="py-2">Teléfono</th>
                    <th className="py-2">Nacimiento</th>
                    <th className="py-2">Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="py-3 font-medium text-slate-900">
                        {patient.last_name}, {patient.first_name}
                      </td>
                      <td className="py-3 text-slate-600">{patient.phone}</td>
                      <td className="py-3 text-slate-600">{patient.birth_date}</td>
                      <td className="py-3">{patient.high_risk ? <span className="text-critical">Riesgo alto</span> : <span className="text-slate-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <PermissionGate me={me} permission="patients:write">
          <Card title="Nuevo paciente" description="Datos mínimos para abrir la ficha">
            <form className="space-y-3" onSubmit={onCreate}>
              <Input label="Nombre" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
              <Input label="Apellidos" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
              <Input label="Fecha de nacimiento" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
              <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Button type="submit" loading={saving} className="w-full">
                Crear paciente
              </Button>
            </form>
          </Card>
        </PermissionGate>
      </div>
    </div>
  );
}
