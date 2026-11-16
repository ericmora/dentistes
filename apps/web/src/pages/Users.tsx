import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  PermissionGate,
} from "@dentistes/ui";
import type { TenantUser } from "@dentistes/sdk";
import { useSession } from "../lib/session";

export const ASSIGNABLE_ROLES = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Control total de la clínica, gestión de equipo y finanzas",
  },
  {
    value: "DENTIST",
    label: "Profesional de clínica",
    description: "Acceso operativo a agenda, pacientes, odontograma e historial",
  },
] as const;

export function normalizeUserRole(role: string): string {
  if (role === "ADMIN" || role === "OWNER") return role;
  return "DENTIST";
}

export function getRoleDisplayName(role: string): string {
  if (role === "OWNER") return "Propietario";
  const match = ASSIGNABLE_ROLES.find((r) => r.value === role);
  return match ? match.label : "Profesional de clínica";
}

export function UsersPage() {
  const { sdk, me } = useSession();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "DENTIST" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sdk.users.list();
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await sdk.users.create(form);
      setForm({ email: "", full_name: "", password: "", role: "DENTIST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(user: TenantUser, role: string) {
    setError(null);
    try {
      await sdk.users.update(user.membership_id, { role });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el rol");
    }
  }

  async function toggleActive(user: TenantUser) {
    setError(null);
    try {
      await sdk.users.update(user.membership_id, { is_active: !user.is_active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    }
  }

  return (
    <div>
      <PageHeader title="Equipo y roles" description="Gestión del personal y permisos simplificados de acceso a la clínica" />
      {error ? (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Miembros" className="lg:col-span-2">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : users.length === 0 ? (
            <EmptyState title="Sin usuarios" description="Añade el primer miembro del equipo." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Usuario</th>
                    <th className="py-2">Rol</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.membership_id}>
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="py-3">
                        {user.role === "OWNER" ? (
                          <Badge tone="info">Propietario</Badge>
                        ) : (
                          <select
                            aria-label={`Rol de ${user.full_name}`}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                            value={normalizeUserRole(user.role)}
                            onChange={(e) => void updateRole(user, e.target.value)}
                          >
                            {ASSIGNABLE_ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge tone={user.is_active ? "success" : "neutral"}>{user.is_active ? "Activo" : "Inactivo"}</Badge>
                      </td>
                      <td className="py-3">
                        {user.role === "OWNER" ? (
                          <span className="text-xs text-slate-400">Propietario</span>
                        ) : (
                          <Button size="sm" variant={user.is_active ? "outline" : "secondary"} onClick={() => void toggleActive(user)}>
                            {user.is_active ? "Desactivar" : "Activar"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <PermissionGate
          me={me}
          permission="users:manage"
          fallback={
            <Card title="Añadir usuario">
              <p className="text-sm text-slate-500">Solo OWNER o ADMIN pueden gestionar usuarios.</p>
            </Card>
          }
        >
          <Card title="Añadir usuario" description="Crea la cuenta o añade un usuario existente por email">
            <form className="space-y-3" onSubmit={onCreate}>
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Nombre completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} hint="Requerido si el usuario es nuevo" />
              <Input label="Contraseña temporal" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint="Mínimo 10 caracteres; se ignora si el usuario ya existe" required />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Rol en la clínica</span>
                <select
                  aria-label="Rol en la clínica"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-brand-500 focus:outline-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} — {role.description}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" loading={saving} className="w-full">
                Añadir miembro
              </Button>
            </form>
          </Card>
        </PermissionGate>
      </div>
    </div>
  );
}
