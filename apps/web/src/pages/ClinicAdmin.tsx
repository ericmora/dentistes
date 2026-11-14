import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, Clock, Edit2, Plus, Sparkles, Stethoscope, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Input,
  Modal,
  PageHeader,
  RoleGuard,
  Select,
  Tabs,
  useToast,
  formatMoney,
} from "@dentistes/ui";
import type { Treatment } from "@dentistes/sdk";
import { useSession } from "../lib/session";
import { UsersPage } from "./Users";
import { BillingPage } from "./Billing";

const TREATMENT_CATEGORIES = [
  { value: "PREVENCION", label: "Diagnóstico y Prevención" },
  { value: "CONSERVADORA", label: "Odontología Conservadora" },
  { value: "ENDODONCIA", label: "Endodoncia" },
  { value: "CIRUGIA", label: "Cirugía e Implantes" },
  { value: "PERIODONCIA", label: "Periodoncia" },
  { value: "PROTESIS", label: "Prótesis" },
  { value: "ORTODONCIA", label: "Ortodoncia" },
  { value: "ESTETICA", label: "Estética dental" },
  { value: "GENERAL", label: "General" },
];

export function ClinicAdminPage() {
  const { sdk, me, logout } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("billing");
  const [cabinetName, setCabinetName] = useState("");
  const [cabinetColor, setCabinetColor] = useState("#0D9488");
  const [confirmSubdomain, setConfirmSubdomain] = useState("");
  const [cancelAccountOpen, setCancelAccountOpen] = useState(false);
  const [cabinetToDelete, setCabinetToDelete] = useState<{ id: string; name: string } | null>(null);

  // Treatments state
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [treatmentToDelete, setTreatmentToDelete] = useState<Treatment | null>(null);
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [treatmentForm, setTreatmentForm] = useState({
    name: "",
    category: "CONSERVADORA",
    estimated_minutes: "30",
    default_price: "50",
    color: "#3B82F6",
  });

  const cabinetsQuery = useQuery({
    queryKey: ["cabinets"],
    queryFn: () => sdk.listCabinets(),
    enabled: Boolean(me?.features?.agenda),
  });

  const treatmentsQuery = useQuery({
    queryKey: ["treatments"],
    queryFn: () => sdk.listTreatments({ all: true }),
    enabled: Boolean(me?.features?.agenda),
  });

  const saveTreatmentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: treatmentForm.name.trim(),
        category: treatmentForm.category,
        estimated_minutes: Number(treatmentForm.estimated_minutes) || 30,
        default_price: Number(treatmentForm.default_price) || 0,
        color: treatmentForm.color,
      };
      if (editingTreatment) {
        return sdk.updateTreatment(editingTreatment.id, payload);
      }
      return sdk.createTreatment(payload);
    },
    onSuccess: async () => {
      setTreatmentModalOpen(false);
      setEditingTreatment(null);
      notify({ tone: "success", title: editingTreatment ? "Tratamiento actualizado" : "Tratamiento creado" });
      await queryClient.invalidateQueries({ queryKey: ["treatments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo guardar el tratamiento",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const deleteTreatmentMutation = useMutation({
    mutationFn: (id: string) => sdk.deleteTreatment(id),
    onSuccess: async () => {
      setTreatmentToDelete(null);
      notify({ tone: "success", title: "Tratamiento desactivado con éxito" });
      await queryClient.invalidateQueries({ queryKey: ["treatments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo desactivar el tratamiento",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  function openCreateTreatment() {
    setEditingTreatment(null);
    setTreatmentForm({
      name: "",
      category: "CONSERVADORA",
      estimated_minutes: "30",
      default_price: "60",
      color: "#3B82F6",
    });
    setTreatmentModalOpen(true);
  }

  function openEditTreatment(t: Treatment) {
    setEditingTreatment(t);
    setTreatmentForm({
      name: t.name,
      category: t.category,
      estimated_minutes: String(t.estimated_minutes),
      default_price: String(t.default_price),
      color: t.color || "#3B82F6",
    });
    setTreatmentModalOpen(true);
  }

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

  const deleteCabinetMutation = useMutation({
    mutationFn: (id: string) => sdk.deleteCabinet(id),
    onSuccess: async () => {
      setCabinetToDelete(null);
      notify({ tone: "success", title: "Gabinete eliminado con éxito" });
      await queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo eliminar el gabinete",
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

  const allTreatments = treatmentsQuery.data?.treatments ?? [];
  const filteredTreatments = allTreatments.filter((t) => {
    if (!treatmentSearch.trim()) return true;
    const q = treatmentSearch.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
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
                        <li key={cab.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2 font-medium text-slate-900">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cab.color_code }} />
                            {cab.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-critical"
                              title="Eliminar gabinete (desactivación lógica)"
                              onClick={() => setCabinetToDelete({ id: cab.id, name: cab.name })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
            {
              id: "treatments",
              label: "Tratamientos",
              content: (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Catálogo de tratamientos</h3>
                      <p className="text-sm text-slate-500">
                        Gestiona los tratamientos propios de la clínica, precios base y duraciones estimadas.
                      </p>
                    </div>
                    <Button onClick={openCreateTreatment}>
                      <Plus className="h-4 w-4" />
                      Nuevo tratamiento
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 max-w-sm">
                    <Input
                      placeholder="Buscar por tratamiento o especialidad..."
                      value={treatmentSearch}
                      onChange={(e) => setTreatmentSearch(e.target.value)}
                    />
                  </div>

                  {treatmentsQuery.isLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500">Cargando catálogo...</div>
                  ) : filteredTreatments.length === 0 ? (
                    <Card>
                      <div className="py-8 text-center">
                        <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-2 text-sm font-medium text-slate-900">No se encontraron tratamientos</p>
                        <p className="text-xs text-slate-500">
                          {treatmentSearch ? "Prueba con otro término de búsqueda" : "Crea tu primer tratamiento personalizado"}
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Tratamiento</th>
                            <th className="px-4 py-3">Especialidad</th>
                            <th className="px-4 py-3">Duración</th>
                            <th className="px-4 py-3 text-right">Precio base</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredTreatments.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: t.color || "#0EA5E9" }}
                                    title={t.color}
                                  />
                                  <span className="font-medium text-slate-900">{t.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge tone="neutral">{t.category}</Badge>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{t.estimated_minutes} min</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium text-slate-900">
                                {formatMoney(Math.round(t.default_price * 100), me?.active_tenant.billing_currency ?? "EUR")}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Editar tratamiento"
                                    onClick={() => openEditTreatment(t)}
                                  >
                                    <Edit2 className="h-4 w-4 text-slate-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-critical"
                                    title="Desactivar tratamiento"
                                    onClick={() => setTreatmentToDelete(t)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
          open={Boolean(cabinetToDelete)}
          onClose={() => setCabinetToDelete(null)}
          onConfirm={() => cabinetToDelete && deleteCabinetMutation.mutate(cabinetToDelete.id)}
          loading={deleteCabinetMutation.isPending}
          danger
          title={`¿Eliminar gabinete "${cabinetToDelete?.name}"?`}
          description="El gabinete se desactivará mediante un eliminado lógico y dejará de aparecer en la agenda, pero conservará el historial de todas las citas pasadas asociadas."
          confirmLabel="Sí, eliminar gabinete"
        />

        <Modal
          open={treatmentModalOpen}
          onClose={() => setTreatmentModalOpen(false)}
          title={editingTreatment ? "Editar tratamiento" : "Nuevo tratamiento"}
          description="Configura el nombre, categoría, duración en agenda y tarifa base."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTreatmentModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                loading={saveTreatmentMutation.isPending}
                onClick={() => saveTreatmentMutation.mutate()}
                disabled={!treatmentForm.name.trim()}
              >
                Guardar tratamiento
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <Input
              label="Nombre del tratamiento"
              placeholder="Ej. Limpieza dental y profilaxis"
              value={treatmentForm.name}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
              required
            />
            <Select
              label="Especialidad o categoría"
              value={treatmentForm.category}
              onChange={(v) => setTreatmentForm({ ...treatmentForm, category: v })}
              options={TREATMENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Duración estimada (minutos)"
                type="number"
                min="5"
                max="300"
                step="5"
                value={treatmentForm.estimated_minutes}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, estimated_minutes: e.target.value })}
              />
              <Input
                label={`Precio base (${me?.active_tenant.billing_currency ?? "EUR"})`}
                type="number"
                min="0"
                step="0.01"
                value={treatmentForm.default_price}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, default_price: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Color identificativo"
                type="color"
                value={treatmentForm.color}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, color: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-400">
                Este color se usará para distinguir las citas de este tratamiento en la agenda.
              </p>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          open={Boolean(treatmentToDelete)}
          onClose={() => setTreatmentToDelete(null)}
          onConfirm={() => treatmentToDelete && deleteTreatmentMutation.mutate(treatmentToDelete.id)}
          loading={deleteTreatmentMutation.isPending}
          danger
          title={`¿Desactivar tratamiento "${treatmentToDelete?.name}"?`}
          description="El tratamiento dejará de estar disponible para agendar nuevas citas o presupuestos, pero se mantendrá en el histórico clínico."
          confirmLabel="Sí, desactivar tratamiento"
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
