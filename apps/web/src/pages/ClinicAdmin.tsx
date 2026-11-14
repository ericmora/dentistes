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
import { defaultCabinetAvailability, type Cabinet, type CabinetDayAvailability, type Treatment } from "@dentistes/sdk";
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

  // Cabinets state
  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);
  const [cabinetAvailability, setCabinetAvailability] = useState<CabinetDayAvailability[]>(defaultCabinetAvailability());

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

  function openCreateCabinet() {
    setEditingCabinet(null);
    setCabinetName("");
    setCabinetColor("#0D9488");
    setCabinetAvailability(defaultCabinetAvailability());
    setCabinetModalOpen(true);
  }

  function openEditCabinet(cab: Cabinet) {
    setEditingCabinet(cab);
    setCabinetName(cab.name);
    setCabinetColor(cab.color_code || "#0D9488");
    setCabinetAvailability(cab.availability && cab.availability.length > 0 ? cab.availability : defaultCabinetAvailability());
    setCabinetModalOpen(true);
  }

  function formatCabinetScheduleSummary(avail?: CabinetDayAvailability[]): string {
    if (!avail || avail.length === 0) return "Lun–Vie 09:00–20:00 (Estándar)";
    const openDays = avail.filter((d) => d.is_open);
    if (openDays.length === 0) return "Cerrado todos los días";
    if (openDays.length === 7) {
      const p = openDays[0].break_start ? ` (Pausa ${openDays[0].break_start}–${openDays[0].break_end})` : "";
      return `Abierto los 7 días · ${openDays[0].start_time}–${openDays[0].end_time}${p}`;
    }
    const daysStr = openDays.map((d) => d.day_name?.slice(0, 3) || `Día ${d.day_of_week}`).join(", ");
    const p = openDays[0].break_start ? ` (Pausa ${openDays[0].break_start}–${openDays[0].break_end})` : "";
    return `${daysStr} · ${openDays[0].start_time}–${openDays[0].end_time}${p}`;
  }

  const saveCabinetMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: cabinetName.trim(),
        color_code: cabinetColor,
        availability: cabinetAvailability,
      };
      if (editingCabinet) {
        return sdk.updateCabinet(editingCabinet.id, payload);
      }
      return sdk.createCabinet(payload);
    },
    onSuccess: async () => {
      setCabinetModalOpen(false);
      setEditingCabinet(null);
      notify({ tone: "success", title: editingCabinet ? "Gabinete actualizado" : "Gabinete creado" });
      await queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo guardar el gabinete",
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
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Gabinetes dentales y disponibilidad</h3>
                      <p className="text-sm text-slate-500">
                        Gestiona los boxes de la clínica, colores distintivos y los horarios o franjas bloqueadas por día de la semana.
                      </p>
                    </div>
                    <Button onClick={openCreateCabinet}>
                      <Plus className="h-4 w-4" />
                      Nuevo gabinete
                    </Button>
                  </div>

                  <Card>
                    <div className="divide-y divide-slate-100">
                      {(cabinetsQuery.data?.cabinets ?? []).map((cab) => (
                        <div key={cab.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
                              style={{ backgroundColor: cab.color_code || "#0D9488" }}
                              title={cab.color_code}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{cab.name}</span>
                                <Badge tone="info" className="text-[10px]">Box Activo</Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>{formatCabinetScheduleSummary(cab.availability)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              title="Configurar horario y disponibilidad"
                              onClick={() => openEditCabinet(cab)}
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-600" />
                              Editar horario
                            </Button>
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
                        </div>
                      ))}
                      {(cabinetsQuery.data?.cabinets ?? []).length === 0 && (
                        <div className="py-8 text-center text-sm text-slate-500">
                          No hay gabinetes configurados. Pulsa en "Nuevo gabinete" para crear el primero.
                        </div>
                      )}
                    </div>
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

        <Modal
          open={cabinetModalOpen}
          onClose={() => setCabinetModalOpen(false)}
          title={editingCabinet ? "Editar gabinete y disponibilidad" : "Nuevo gabinete"}
          description="Configura el nombre del box, su color distintivo y los días y horas de disponibilidad semanal."
          maxWidth="max-w-2xl"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCabinetModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                loading={saveCabinetMutation.isPending}
                onClick={() => saveCabinetMutation.mutate()}
                disabled={!cabinetName.trim()}
              >
                Guardar gabinete
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nombre del gabinete"
                placeholder="Ej. Box 1 (Cirugía)"
                value={cabinetName}
                onChange={(e) => setCabinetName(e.target.value)}
                required
              />
              <Input
                label="Color identificativo"
                type="color"
                value={cabinetColor}
                onChange={(e) => setCabinetColor(e.target.value)}
              />
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Disponibilidad y bloqueos por día de la semana
                </h4>
                <p className="text-[11px] text-slate-500">
                  Los días desmarcados y las franjas de pausa o fuera de horario aparecerán bloqueados automáticamente en la agenda.
                </p>
              </div>

              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50">
                {cabinetAvailability.map((d, index) => (
                  <div key={d.day_of_week} className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                    <div className="flex items-center gap-2.5 w-28">
                      <input
                        type="checkbox"
                        id={`day-${d.day_of_week}`}
                        checked={d.is_open}
                        onChange={(e) => {
                          const next = [...cabinetAvailability];
                          next[index] = { ...d, is_open: e.target.checked };
                          setCabinetAvailability(next);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <label htmlFor={`day-${d.day_of_week}`} className="font-semibold text-slate-900 cursor-pointer">
                        {d.day_name || `Día ${d.day_of_week}`}
                      </label>
                    </div>

                    {d.is_open ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-medium">Horario:</span>
                          <input
                            type="time"
                            value={d.start_time}
                            onChange={(e) => {
                              const next = [...cabinetAvailability];
                              next[index] = { ...d, start_time: e.target.value };
                              setCabinetAvailability(next);
                            }}
                            className="h-7 rounded border border-slate-300 bg-white px-1.5 text-xs text-slate-800"
                          />
                          <span className="text-slate-400">–</span>
                          <input
                            type="time"
                            value={d.end_time}
                            onChange={(e) => {
                              const next = [...cabinetAvailability];
                              next[index] = { ...d, end_time: e.target.value };
                              setCabinetAvailability(next);
                            }}
                            className="h-7 rounded border border-slate-300 bg-white px-1.5 text-xs text-slate-800"
                          />
                        </div>

                        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                          <span className="text-[10px] text-slate-500 font-medium">Pausa/Bloqueo:</span>
                          <input
                            type="time"
                            value={d.break_start || ""}
                            onChange={(e) => {
                              const next = [...cabinetAvailability];
                              next[index] = { ...d, break_start: e.target.value };
                              setCabinetAvailability(next);
                            }}
                            placeholder="14:00"
                            className="h-7 rounded border border-slate-300 bg-white px-1.5 text-xs text-slate-800"
                          />
                          <span className="text-slate-400">–</span>
                          <input
                            type="time"
                            value={d.break_end || ""}
                            onChange={(e) => {
                              const next = [...cabinetAvailability];
                              next[index] = { ...d, break_end: e.target.value };
                              setCabinetAvailability(next);
                            }}
                            placeholder="15:00"
                            className="h-7 rounded border border-slate-300 bg-white px-1.5 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Cerrado / Bloqueado todo el día</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>

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
