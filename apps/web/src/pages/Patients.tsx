import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CriticalAlertBanner,
  EmptyState,
  Input,
  PageHeader,
  PermissionGate,
  Sheet,
  Skeleton,
  useToast,
} from "@dentistes/ui";
import type { Patient } from "@dentistes/sdk";
import { useSession } from "../lib/session";

const createPatientSchema = z.object({
  first_name: z.string().trim().min(1, "El nombre es obligatorio"),
  last_name: z.string().trim().min(1, "Los apellidos son obligatorios"),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  phone: z.string().trim().min(6, "El teléfono es obligatorio"),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
});

type CreatePatientValues = z.infer<typeof createPatientSchema>;

export function PatientsPage() {
  const { sdk, me } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["patients", me?.active_tenant.id, query],
    queryFn: () => sdk.listPatients({ q: query || undefined, limit: 50 }),
    enabled: Boolean(me),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePatientValues>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: { first_name: "", last_name: "", birth_date: "", phone: "", email: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreatePatientValues) =>
      sdk.createPatient({
        first_name: values.first_name,
        last_name: values.last_name,
        birth_date: values.birth_date,
        phone: values.phone,
        email: values.email || undefined,
      }),
    onSuccess: async (created) => {
      reset();
      notify({
        tone: "success",
        title: "Paciente creado",
        description: `${created.last_name}, ${created.first_name}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "Error al crear paciente",
        description: err instanceof Error ? err.message : "No se pudo crear el paciente",
      });
    },
  });

  const patients = data?.patients ?? [];

  return (
    <div>
      <PageHeader title="Pacientes" description="Ficha básica de pacientes del tenant activo" />

      {error ? (
        <div className="mb-4">
          <Alert tone="danger">{error instanceof Error ? error.message : "No se pudieron cargar los pacientes"}</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Buscar" description="Nombre, apellido o teléfono" className="lg:col-span-2">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(searchInput.trim());
            }}
          >
            <div className="flex-1">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onClear={searchInput ? () => { setSearchInput(""); setQuery(""); } : undefined}
                prefixIcon={<Search className="h-4 w-4" />}
                placeholder="Buscar paciente"
              />
            </div>
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </form>
          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
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
                    <tr
                      key={patient.id}
                      onClick={() => setSelected(patient)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="py-3 font-medium text-slate-900">
                        <Link to={`/patients/${patient.id}`} className="text-brand-700 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {patient.last_name}, {patient.first_name}
                        </Link>
                      </td>
                      <td className="py-3 tabular-nums text-slate-600">{patient.phone}</td>
                      <td className="py-3 tabular-nums text-slate-600">{patient.birth_date}</td>
                      <td className="py-3">
                        {patient.high_risk ? (
                          <Badge tone="danger">Riesgo alto</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <PermissionGate me={me} permission="patients:write">
          <Card title="Nuevo paciente" description="Datos mínimos para abrir la ficha">
            <form className="space-y-3" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
              <Input label="Nombre" error={errors.first_name?.message} {...register("first_name")} />
              <Input label="Apellidos" error={errors.last_name?.message} {...register("last_name")} />
              <Input label="Fecha de nacimiento" type="date" error={errors.birth_date?.message} {...register("birth_date")} />
              <Input label="Teléfono" error={errors.phone?.message} {...register("phone")} />
              <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
              <Button type="submit" loading={createMutation.isPending} className="w-full">
                Crear paciente
              </Button>
            </form>
          </Card>
        </PermissionGate>
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.last_name}, ${selected.first_name}` : ""}
        description={selected ? `Teléfono: ${selected.phone}` : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            <CriticalAlertBanner
              alerts={{ high_risk: selected.high_risk }}
              hideDetails={me?.role === "RECEPTIONIST"}
            />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">Nacimiento</dt>
                <dd className="tabular-nums font-medium text-slate-900">{selected.birth_date}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{selected.email || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">WhatsApp opt-in</dt>
                <dd>
                  <Badge tone={selected.whatsapp_opt_in ? "success" : "neutral"}>
                    {selected.whatsapp_opt_in ? "Autorizado" : "No autorizado"}
                  </Badge>
                </dd>
              </div>
            </dl>
            <Link to={`/patients/${selected.id}`} className="block pt-2">
              <Button className="w-full">Abrir ficha clínica completa</Button>
            </Link>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
