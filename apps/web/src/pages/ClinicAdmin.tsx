import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, Plus } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  Input,
  PageHeader,
  RoleGuard,
  Tabs,
  useToast,
} from "@dentistes/ui";
import { useSession } from "../lib/session";
import { UsersPage } from "./Users";
import { BillingPage } from "./Billing";

export function ClinicAdminPage() {
  const { sdk, me, logout } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("billing");
  const [cabinetName, setCabinetName] = useState("");
  const [cabinetColor, setCabinetColor] = useState("#0D9488");
  const [confirmSubdomain, setConfirmSubdomain] = useState("");
  const [cancelAccountOpen, setCancelAccountOpen] = useState(false);

  const cabinetsQuery = useQuery({
    queryKey: ["cabinets"],
    queryFn: () => sdk.listCabinets(),
    enabled: Boolean(me?.features?.agenda),
  });

  const createCabinetMutation = useMutation({
    mutationFn: () => sdk.createCabinet({ name: cabinetName, color_code: cabinetColor }),
    onSuccess: async () => {
      setCabinetName("");
      notify({ tone: "success", title: "Gabinete añadido" });
      await queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo crear el gabinete",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const cancelAccountMutation = useMutation({
    mutationFn: () => sdk.clinic.cancel(confirmSubdomain),
    onSuccess: async () => {
      setCancelAccountOpen(false);
      notify({ tone: "info", title: "Cuenta de clínica cancelada" });
      await logout();
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo cancelar la cuenta",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  return (
    <RoleGuard
      me={me}
      roles={["OWNER", "ADMIN"]}
      fallback={
        <Alert tone="danger" title="Acceso restringido">
          Solo los titulares y administradores de la clínica pueden acceder a esta configuración.
        </Alert>
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Administración de la clínica"
          description={`${me?.active_tenant.name ?? ""} · Gestión de clínica, usuarios y facturación`}
        />

        <Tabs
          activeId={activeTab}
          onChange={setActiveTab}
          items={[
            {
              id: "billing",
              label: "Facturación y Facturas",
              content: <BillingPage embedded />,
            },
            {
              id: "users",
              label: "Equipo y Roles",
              content: <UsersPage />,
            },
            {
              id: "cabinets",
              label: "Gabinetes",
              content: (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card title="Gabinetes activos" description="Boxes disponibles en la agenda">
                    <ul className="space-y-2">
                      {(cabinetsQuery.data?.cabinets ?? []).map((cab) => (
                        <li key={cab.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                          <span className="flex items-center gap-2 font-medium text-slate-900">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cab.color_code }} />
                            {cab.name}
                          </span>
                          <Building2 className="h-4 w-4 text-slate-400" />
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card title="Añadir gabinete">
                    <form
                      className="space-y-3"
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        createCabinetMutation.mutate();
                      }}
                    >
                      <Input
                        label="Nombre del gabinete"
                        value={cabinetName}
                        onChange={(e) => setCabinetName(e.target.value)}
                        placeholder="Box Cirugía"
                        required
                      />
                      <Input
                        label="Color identificativo"
                        type="color"
                        value={cabinetColor}
                        onChange={(e) => setCabinetColor(e.target.value)}
                      />
                      <Button type="submit" loading={createCabinetMutation.isPending} className="w-full">
                        <Plus className="h-4 w-4" />
                        Crear gabinete
                      </Button>
                    </form>
                  </Card>
                </div>
              ),
            },
            ...(me?.role === "OWNER"
              ? [
                  {
                    id: "danger",
                    label: "Cancelación de cuenta",
                    content: (
                      <Card
                        title="Cerrar y cancelar cuenta de la clínica"
                        description="Acción irreversible: cancela inmediatamente la suscripción en Stripe, revoca los accesos del equipo y archiva la cuenta."
                      >
                        <div className="space-y-4">
                          <Alert tone="danger" title="Zona de baja de clínica (solo titular)">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                Para confirmar la baja definitiva, escribe el identificador de la clínica:{" "}
                                <strong>{me.active_tenant.subdomain}</strong>
                              </span>
                            </div>
                          </Alert>
                          <div className="max-w-sm">
                            <Input
                              label="Identificador de confirmación"
                              value={confirmSubdomain}
                              onChange={(e) => setConfirmSubdomain(e.target.value)}
                              placeholder={me.active_tenant.subdomain}
                            />
                          </div>
                          <Button
                            variant="destructive"
                            disabled={confirmSubdomain.trim() !== me.active_tenant.subdomain}
                            onClick={() => setCancelAccountOpen(true)}
                          >
                            Cancelar cuenta definitivamente
                          </Button>
                        </div>
                      </Card>
                    ),
                  },
                ]
              : []),
          ]}
        />

        <ConfirmDialog
          open={cancelAccountOpen}
          onClose={() => setCancelAccountOpen(false)}
          onConfirm={() => cancelAccountMutation.mutate()}
          loading={cancelAccountMutation.isPending}
          danger
          title="¿Cancelar cuenta de la clínica?"
          description="Se cancelará la suscripción en Stripe inmediatamente y se revocarán todas las sesiones activas."
          confirmLabel="Sí, cerrar cuenta"
        />
      </div>
    </RoleGuard>
  );
}
