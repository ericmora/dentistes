import { useState, useMemo, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Armchair,
  Building2,
  CalendarX,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Layers,
  Plus,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Tag,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ClinicBrandingAndBudgetSettingsCard,
  ConfirmDialog,
  Input,
  Modal,
  PageHeader,
  RoleGuard,
  Select,
  Tabs,
  useToast,
  formatMoney,
  cn,
  type ClinicBudgetSettingsUI,
} from "@dentistes/ui";
import {
  defaultCabinetAvailability,
  type Cabinet,
  type CabinetDayAvailability,
  type DentalChair,
  type Specialty,
  type StaffAbsence,
  type StaffAbsenceStatus,
  type StaffAbsenceType,
  type Treatment,
} from "@dentistes/sdk";
import { useSession } from "../lib/session";
import { useUiStore } from "../lib/store";
import { UsersPage, getRoleDisplayName } from "./Users";
import { BillingPage } from "./Billing";

const FALLBACK_SPECIALTIES: Specialty[] = [
  { id: "sp_1", code: "PREVENCION", name: "Diagnóstico y Prevención", description: "Revisiones, diagnósticos y limpiezas preventivas", color_code: "#0EA5E9", is_active: true },
  { id: "sp_2", code: "CONSERVADORA", name: "Odontología Conservadora", description: "Obturaciones, empastes simples y restauraciones", color_code: "#3B82F6", is_active: true },
  { id: "sp_3", code: "ENDODONCIA", name: "Endodoncia", description: "Tratamientos de conductos radiculares", color_code: "#8B5CF6", is_active: true },
  { id: "sp_4", code: "CIRUGIA", name: "Cirugía e Implantes", description: "Extracciones dentales, cirugía oral e implantología", color_code: "#F97316", is_active: true },
  { id: "sp_5", code: "IMPLANTES", name: "Implantología", description: "Implantes dentales, cirugías guiadas y osteointegración", color_code: "#0F172A", is_active: true },
  { id: "sp_6", code: "PERIODONCIA", name: "Periodoncia", description: "Tratamientos periodontales, raspados y curetajes", color_code: "#10B981", is_active: true },
  { id: "sp_7", code: "PROTESIS", name: "Prótesis Dental", description: "Prótesis fijas, removibles y sobre implantes", color_code: "#D97706", is_active: true },
  { id: "sp_8", code: "ORTODONCIA", name: "Ortodoncia", description: "Brackets, ortodoncia invisible y alineadores", color_code: "#EC4899", is_active: true },
  { id: "sp_9", code: "ESTETICA", name: "Estética Dental", description: "Blanqueamientos, carillas y estética dental", color_code: "#F59E0B", is_active: true },
  { id: "sp_10", code: "ODONTOPEDIATRIA", name: "Odontopediatría", description: "Odontología y atención infantil especializada", color_code: "#06B6D4", is_active: true },
  { id: "sp_11", code: "HIGIENE", name: "Higiene Dental", description: "Profilaxis bucodental y mantenimientos", color_code: "#14B8A6", is_active: true },
  { id: "sp_12", code: "GENERAL", name: "General", description: "Procedimientos y consultas generales", color_code: "#64748B", is_active: true },
];

export function ClinicAdminPage() {
  const { sdk, me, logout } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { clinicBudgetSettings, setClinicBudgetSettings } = useUiStore();
  const [activeTab, setActiveTab] = useState("account");
  const [cabinetName, setCabinetName] = useState("");
  const [cabinetColor, setCabinetColor] = useState("#0D9488");
  const [cabinetEquipment, setCabinetEquipment] = useState("");
  const [cabinetAllowedCategories, setCabinetAllowedCategories] = useState<string[]>([]);
  const [confirmSubdomain, setConfirmSubdomain] = useState("");
  const [cancelAccountOpen, setCancelAccountOpen] = useState(false);
  const [cabinetToDelete, setCabinetToDelete] = useState<{ id: string; name: string } | null>(null);

  // Cabinets state
  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);
  const [cabinetAvailability, setCabinetAvailability] = useState<CabinetDayAvailability[]>(defaultCabinetAvailability());
  const [cabinetChairId, setCabinetChairId] = useState("");
  const [cabinetDoctorId, setCabinetDoctorId] = useState("");
  const [cabinetAssistantId, setCabinetAssistantId] = useState("");

  // Dental Chairs (Butacas físicas) state
  const [chairModalOpen, setChairModalOpen] = useState(false);
  const [editingChair, setEditingChair] = useState<DentalChair | null>(null);
  const [chairToDelete, setChairToDelete] = useState<DentalChair | null>(null);
  const [chairName, setChairName] = useState("");
  const [chairColor, setChairColor] = useState("#0D9488");
  const [chairEquipment, setChairEquipment] = useState("");
  const [chairAllowedCategories, setChairAllowedCategories] = useState<string[]>([]);
  const [chairIsActive, setChairIsActive] = useState(true);

  // Staff Absences (Vacaciones y Bajas) state
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [absenceUserId, setAbsenceUserId] = useState("");
  const [absenceType, setAbsenceType] = useState<StaffAbsenceType>("VACATION");
  const [absenceStartDate, setAbsenceStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [absenceEndDate, setAbsenceEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [absenceNotes, setAbsenceNotes] = useState("");

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

  const chairsQuery = useQuery({
    queryKey: ["chairs"],
    queryFn: () => sdk.listChairs(),
    enabled: Boolean(me?.features?.agenda),
  });

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: () => sdk.listDoctors(),
    enabled: Boolean(me?.active_tenant.id),
  });

  const assistantsQuery = useQuery({
    queryKey: ["assistants"],
    queryFn: () => sdk.listAssistants(),
    enabled: Boolean(me?.active_tenant.id),
  });

  const absencesQuery = useQuery({
    queryKey: ["absences"],
    queryFn: () => sdk.listAbsences(),
    enabled: Boolean(me?.active_tenant.id),
  });

  const usersQuery = useQuery({
    queryKey: ["tenant-users"],
    queryFn: () => sdk.users.list(),
    enabled: Boolean(me?.active_tenant.id),
  });

  const treatmentsQuery = useQuery({
    queryKey: ["treatments"],
    queryFn: () => sdk.listTreatments({ all: true }),
    enabled: Boolean(me?.features?.agenda),
  });

  const specialtiesQuery = useQuery({
    queryKey: ["specialties"],
    queryFn: () => sdk.listSpecialties(),
    enabled: Boolean(me?.active_tenant.id),
  });

  const rawSpecialties = specialtiesQuery.data?.specialties ?? [];
  const specialtiesList = rawSpecialties.length > 0 ? rawSpecialties : FALLBACK_SPECIALTIES;
  const activeSpecialties = useMemo(() => specialtiesList.filter((s) => s.is_active !== false), [specialtiesList]);

  const specialtiesMap = useMemo(() => {
    const map = new Map<string, { name: string; color_code: string }>();
    for (const s of specialtiesList) {
      map.set(s.code, { name: s.name, color_code: s.color_code });
      map.set(s.name, { name: s.name, color_code: s.color_code });
    }
    return map;
  }, [specialtiesList]);

  // Specialties master state
  const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<Specialty | null>(null);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [specialtyForm, setSpecialtyForm] = useState({
    name: "",
    code: "",
    description: "",
    color_code: "#0D9488",
  });

  function openCreateSpecialty() {
    setEditingSpecialty(null);
    setSpecialtyForm({
      name: "",
      code: "",
      description: "",
      color_code: "#0D9488",
    });
    setSpecialtyModalOpen(true);
  }

  function openEditSpecialty(spec: Specialty) {
    setEditingSpecialty(spec);
    setSpecialtyForm({
      name: spec.name,
      code: spec.code,
      description: spec.description || "",
      color_code: spec.color_code || "#0D9488",
    });
    setSpecialtyModalOpen(true);
  }

  const saveSpecialtyMutation = useMutation({
    mutationFn: async () => {
      if (editingSpecialty) {
        return sdk.updateSpecialty(editingSpecialty.id, {
          name: specialtyForm.name.trim(),
          description: specialtyForm.description.trim(),
          color_code: specialtyForm.color_code,
        });
      }
      return sdk.createSpecialty({
        name: specialtyForm.name.trim(),
        code: specialtyForm.code.trim() || undefined,
        description: specialtyForm.description.trim(),
        color_code: specialtyForm.color_code,
      });
    },
    onSuccess: async () => {
      setSpecialtyModalOpen(false);
      setEditingSpecialty(null);
      notify({ tone: "success", title: editingSpecialty ? "Especialidad actualizada" : "Especialidad creada" });
      await queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo guardar la especialidad",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const deleteSpecialtyMutation = useMutation({
    mutationFn: (id: string) => sdk.deleteSpecialty(id),
    onSuccess: async () => {
      setSpecialtyToDelete(null);
      notify({ tone: "success", title: "Especialidad desactivada (borrado lógico)" });
      await queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo eliminar la especialidad",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const clinicSettingsQuery = useQuery({
    queryKey: ["clinic-settings", me?.active_tenant.id],
    queryFn: async () => {
      try {
        const res = await sdk.clinic.getSettings();
        setClinicBudgetSettings(res.settings);
        return res.settings;
      } catch {
        return clinicBudgetSettings;
      }
    },
    enabled: Boolean(me?.active_tenant.id),
  });

  const saveClinicSettingsMutation = useMutation({
    mutationFn: async (next: ClinicBudgetSettingsUI) => {
      setClinicBudgetSettings(next);
      try {
        const res = await sdk.clinic.updateSettings(next);
        setClinicBudgetSettings(res.settings);
        return res.settings;
      } catch {
        return next;
      }
    },
    onSuccess: async () => {
      notify({
        tone: "success",
        title: "Configuración de identidad y presupuestos guardada",
        description: "El logo y los parámetros de vigencia se aplicarán a los presupuestos de la clínica.",
      });
      await queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
    },
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
    setCabinetEquipment("");
    setCabinetAllowedCategories([]);
    setCabinetAvailability(defaultCabinetAvailability());
    setCabinetChairId("");
    setCabinetDoctorId("");
    setCabinetAssistantId("");
    setCabinetModalOpen(true);
  }

  function openEditCabinet(cab: Cabinet) {
    setEditingCabinet(cab);
    setCabinetName(cab.name);
    setCabinetColor(cab.color_code || "#0D9488");
    setCabinetEquipment(cab.equipment || "");
    setCabinetAllowedCategories(cab.allowed_categories || []);
    setCabinetAvailability(cab.availability && cab.availability.length > 0 ? cab.availability : defaultCabinetAvailability());
    setCabinetChairId(cab.chair_id || "");
    setCabinetDoctorId(cab.doctor_id || "");
    setCabinetAssistantId(cab.assistant_id || "");
    setCabinetModalOpen(true);
  }

  function openCreateChair() {
    setEditingChair(null);
    setChairName("");
    setChairColor("#0D9488");
    setChairEquipment("");
    setChairAllowedCategories([]);
    setChairIsActive(true);
    setChairModalOpen(true);
  }

  function openEditChair(chair: DentalChair) {
    setEditingChair(chair);
    setChairName(chair.name);
    setChairColor(chair.color_code || "#0D9488");
    setChairEquipment(chair.equipment || "");
    setChairAllowedCategories(chair.allowed_categories || []);
    setChairIsActive(chair.is_active);
    setChairModalOpen(true);
  }

  function openCreateAbsence(defaultUserId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    setAbsenceUserId(defaultUserId || (usersQuery.data?.users?.[0]?.user_id ?? ""));
    setAbsenceType("VACATION");
    setAbsenceStartDate(today);
    setAbsenceEndDate(today);
    setAbsenceNotes("");
    setAbsenceModalOpen(true);
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
        equipment: cabinetEquipment.trim(),
        allowed_categories: cabinetAllowedCategories,
        availability: cabinetAvailability,
        chair_id: cabinetChairId || undefined,
        doctor_id: cabinetDoctorId || undefined,
        assistant_id: cabinetAssistantId || undefined,
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

  const saveChairMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: chairName.trim(),
        color_code: chairColor,
        equipment: chairEquipment.trim(),
        allowed_categories: chairAllowedCategories,
        is_active: chairIsActive,
      };
      if (editingChair) {
        return sdk.updateChair(editingChair.id, payload);
      }
      return sdk.createChair(payload);
    },
    onSuccess: async () => {
      setChairModalOpen(false);
      setEditingChair(null);
      notify({ tone: "success", title: editingChair ? "Butaca física actualizada" : "Butaca física creada con éxito" });
      await queryClient.invalidateQueries({ queryKey: ["chairs"] });
      await queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo guardar la butaca",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const deleteChairMutation = useMutation({
    mutationFn: (id: string) => sdk.deleteChair(id),
    onSuccess: async () => {
      setChairToDelete(null);
      notify({ tone: "success", title: "Butaca física desactivada" });
      await queryClient.invalidateQueries({ queryKey: ["chairs"] });
      await queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo desactivar la butaca",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const saveAbsenceMutation = useMutation({
    mutationFn: async () => {
      return sdk.createAbsence({
        user_id: absenceUserId || undefined,
        absence_type: absenceType,
        start_date: absenceStartDate,
        end_date: absenceEndDate,
        notes: absenceNotes.trim() || undefined,
      });
    },
    onSuccess: async (res) => {
      setAbsenceModalOpen(false);
      const isAutoApproved = res.absence.status === "APPROVED";
      notify({
        tone: "success",
        title: isAutoApproved
          ? "Ausencia registrada y aprobada automáticamente"
          : "Ausencia registrada (pendiente de aprobación)",
        description:
          res.absence.auto_rescheduled_count > 0
            ? `Se han reagendado automáticamente ${res.absence.auto_rescheduled_count} citas afectadas del doctor.`
            : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["absences"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo registrar la ausencia",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const updateAbsenceStatusMutation = useMutation({
    mutationFn: (input: { id: string; status: StaffAbsenceStatus }) =>
      sdk.updateAbsenceStatus(input.id, input.status),
    onSuccess: async (res, variables) => {
      const isApproved = variables.status === "APPROVED";
      notify({
        tone: isApproved ? "success" : "info",
        title: isApproved ? "Ausencia aprobada con éxito" : "Ausencia rechazada",
        description:
          res.absence.auto_rescheduled_count > 0
            ? `Se han reagendado automáticamente ${res.absence.auto_rescheduled_count} citas de pacientes.`
            : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["absences"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo actualizar el estado de la ausencia",
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

  const filteredSpecialties = specialtiesList.filter((s) => {
    if (!specialtySearch.trim()) return true;
    const q = specialtySearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
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
              id: "account",
              label: "Gestión de cuenta",
              content: (
                <div className="space-y-8">
                  {/* Facturación y suscripción arriba */}
                  <BillingPage embedded />

                  {/* Cancelación de cuenta abajo del todo */}
                  {me?.role === "OWNER" ? (
                    <Card
                      title="Cancelación de la cuenta de la clínica"
                      description="Custodia y retención de datos durante 90 días con reactivación garantizada."
                    >
                      <div className="space-y-4">
                        <Alert tone="warning" title="Período de custodia de 90 días y reactivación en 30 días">
                          <div className="space-y-2 text-sm text-slate-700">
                            <p>
                              Al cancelar tu cuenta, tu suscripción se detendrá de inmediato. Todos los historiales clínicos, pacientes, citas y facturas quedarán <strong>guardados de forma segura durante 90 días</strong>.
                            </p>
                            <p>
                              Dispones de <strong>30 días de plazo para reactivar tu cuenta</strong> con un solo clic recuperando el 100% de la operativa al instante. Recibirás recordatorios periódicos con instrucciones de reactivación. Si no se reactiva, pasados los 90 días los datos se purgarán de manera definitiva conforme a la normativa vigente.
                            </p>
                          </div>
                        </Alert>

                        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                          <h4 className="text-sm font-semibold text-red-900">Confirmación de baja del servicio</h4>
                          <p className="mt-1 text-xs text-red-700">
                            Para proceder con la cancelación, escribe el subdominio de tu clínica: <strong>{me.active_tenant.subdomain}</strong>
                          </p>
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="max-w-xs flex-1">
                              <Input
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
                              Cancelar cuenta de la clínica
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : null}
                </div>
              ),
            },
            {
              id: "branding-budgets",
              label: "Identidad y Presupuestos",
              content: (
                <ClinicBrandingAndBudgetSettingsCard
                  key={JSON.stringify(clinicSettingsQuery.data ?? clinicBudgetSettings)}
                  clinicName={me?.active_tenant.name ?? "Clínica Dental"}
                  clinicTaxId={me?.active_tenant.tax_id}
                  initialSettings={clinicSettingsQuery.data ?? clinicBudgetSettings}
                  saving={saveClinicSettingsMutation.isPending}
                  onSave={(next) => saveClinicSettingsMutation.mutate(next)}
                />
              ),
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
                      <h3 className="text-base font-semibold text-slate-900">Gabinetes dentales y equipos de trabajo</h3>
                      <p className="text-sm text-slate-500">
                        Cada gabinete combina un equipo humano (Doctor y Auxiliar) con una butaca física y un horario semanal de disponibilidad.
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
                        <div key={cab.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
                              style={{ backgroundColor: cab.color_code || "#0D9488" }}
                              title={cab.color_code}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{cab.name}</span>
                                <Badge tone="info" className="text-[10px]">Equipo de trabajo</Badge>
                                {cab.chair_name && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    🪑 {cab.chair_name}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-semibold text-slate-700">Doctor:</span>
                                  {cab.doctor_name ? (
                                    <span className="font-medium text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                      Dr(a). {cab.doctor_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">Sin doctor asignado</span>
                                  )}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-semibold text-slate-700">Auxiliar:</span>
                                  {cab.assistant_name ? (
                                    <span className="font-medium text-indigo-800 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                      Aux. {cab.assistant_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">Sin auxiliar asignado</span>
                                  )}
                                </span>
                              </div>

                              {cab.equipment && (
                                <p className="text-xs text-slate-700">
                                  <span className="font-semibold text-slate-600">Equipación:</span> {cab.equipment}
                                </p>
                              )}
                              {cab.allowed_categories && cab.allowed_categories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {cab.allowed_categories.map((c) => {
                                    const spec = specialtiesMap.get(c);
                                    return (
                                      <span
                                        key={c}
                                        className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800"
                                      >
                                        <span
                                          className="h-1.5 w-1.5 rounded-full"
                                          style={{ backgroundColor: spec?.color_code || "#0D9488" }}
                                        />
                                        {spec?.name || c}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              <p className="text-xs text-slate-500 flex items-center gap-1.5">
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
                              title="Configurar equipo y disponibilidad"
                              onClick={() => openEditCabinet(cab)}
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-600" />
                              Editar equipo
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
              id: "chairs",
              label: "Butacas (Sillones)",
              content: (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Butacas dentales (Sillones físicos)</h3>
                      <p className="text-sm text-slate-500">
                        Inventario de sillones e infraestructura física de la clínica. Cada butaca física puede asignarse a un gabinete de trabajo.
                      </p>
                    </div>
                    <Button onClick={openCreateChair}>
                      <Plus className="h-4 w-4" />
                      Nueva butaca
                    </Button>
                  </div>

                  <Card>
                    <div className="divide-y divide-slate-100">
                      {(chairsQuery.data?.chairs ?? []).map((chair) => {
                        const linkedCabinet = (cabinetsQuery.data?.cabinets ?? []).find(
                          (c) => c.chair_id === chair.id,
                        );
                        return (
                          <div key={chair.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span
                                className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
                                style={{ backgroundColor: chair.color_code || "#0D9488" }}
                                title={chair.color_code}
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900">{chair.name}</span>
                                  {chair.is_active ? (
                                    <Badge tone="success" className="text-[10px]">Operativa</Badge>
                                  ) : (
                                    <Badge tone="neutral" className="text-[10px]">Inactiva</Badge>
                                  )}
                                  {linkedCabinet ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                      Asignada a: {linkedCabinet.name}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">Libre (sin asignar)</span>
                                  )}
                                </div>
                                {chair.equipment && (
                                  <p className="text-xs text-slate-700">
                                    <span className="font-semibold text-slate-600">Equipamiento técnico:</span> {chair.equipment}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 self-end sm:self-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => openEditChair(chair)}
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-600" />
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-critical"
                                title="Desactivar butaca física"
                                onClick={() => setChairToDelete(chair)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {(chairsQuery.data?.chairs ?? []).length === 0 && (
                        <div className="py-8 text-center text-sm text-slate-500">
                          No hay butacas físicas registradas. Pulsa en "Nueva butaca" para añadir la primera.
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              id: "absences",
              label: "Vacaciones y Bajas",
              content: (
                <div className="space-y-6">
                  {/* Auto-approval policy card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            Aprobación automática de ausencias y vacaciones
                          </h3>
                          <Badge
                            tone={clinicSettingsQuery.data?.auto_approve_absences ? "success" : "neutral"}
                            className="text-[10px]"
                          >
                            {clinicSettingsQuery.data?.auto_approve_absences ? "Activada" : "Desactivada"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                          Si está activado, las vacaciones y bajas médicas quedan aprobadas al instante.
                          Al aprobarse la ausencia de un <strong>Doctor</strong>, el sistema <strong>reagendará automáticamente</strong> todas las citas de sus pacientes afectadas al siguiente hueco disponible en la agenda. Para los <strong>Auxiliares</strong>, las citas se mantendrán porque el facultativo continuará atendiendo.
                        </p>
                      </div>

                      <Button
                        variant={clinicSettingsQuery.data?.auto_approve_absences ? "outline" : "primary"}
                        size="sm"
                        loading={saveClinicSettingsMutation.isPending}
                        onClick={() => {
                          const current = clinicSettingsQuery.data ?? clinicBudgetSettings;
                          saveClinicSettingsMutation.mutate({
                            ...current,
                            auto_approve_absences: !current.auto_approve_absences,
                          });
                        }}
                      >
                        {clinicSettingsQuery.data?.auto_approve_absences
                          ? "Desactivar auto-aprobación"
                          : "Activar auto-aprobación"}
                      </Button>
                    </div>
                  </div>

                  {/* Absences list & actions */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Registro de ausencias, vacaciones y bajas
                        </h3>
                        <p className="text-sm text-slate-500">
                          Gestiona los períodos no laborables del personal médico y auxiliar para evitar colisiones de agenda.
                        </p>
                      </div>
                      <Button onClick={() => openCreateAbsence()}>
                        <Plus className="h-4 w-4" />
                        Registrar ausencia o baja
                      </Button>
                    </div>

                    <Card>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Profesional</th>
                              <th className="px-4 py-3">Tipo</th>
                              <th className="px-4 py-3">Periodo</th>
                              <th className="px-4 py-3">Motivo / Notas</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3">Impacto / Citas</th>
                              <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(absencesQuery.data?.absences ?? []).map((abs) => {
                              const isDoc =
                                abs.user_role === "DENTIST" ||
                                abs.user_role === "HYGIENIST" ||
                                abs.user_role === "OWNER" ||
                                abs.user_role === "ADMIN";
                              return (
                                <tr key={abs.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-4 py-3.5">
                                    <div className="font-semibold text-slate-900">
                                      {abs.user_name || "Profesional de clínica"}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {getRoleDisplayName(abs.user_role || "DENTIST")}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <Badge
                                      tone={
                                        abs.absence_type === "VACATION"
                                          ? "info"
                                          : abs.absence_type === "SICK_LEAVE"
                                          ? "warning"
                                          : "neutral"
                                      }
                                      className="text-[10px]"
                                    >
                                      {abs.absence_type === "VACATION"
                                        ? "Vacaciones"
                                        : abs.absence_type === "SICK_LEAVE"
                                        ? "Baja médica"
                                        : "Asuntos propios"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3.5 tabular-nums whitespace-nowrap">
                                    <div className="font-medium text-slate-800">
                                      {abs.start_date} al {abs.end_date}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 max-w-xs truncate" title={abs.notes || ""}>
                                    {abs.notes || <span className="text-slate-400 italic">Sin observaciones</span>}
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <Badge
                                      tone={
                                        abs.status === "APPROVED"
                                          ? "success"
                                          : abs.status === "REJECTED"
                                          ? "danger"
                                          : "warning"
                                      }
                                      className="text-[10px]"
                                    >
                                      {abs.status === "APPROVED"
                                        ? "Aprobada"
                                        : abs.status === "REJECTED"
                                        ? "Rechazada"
                                        : "Pendiente"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    {abs.status === "APPROVED" ? (
                                      isDoc ? (
                                        abs.auto_rescheduled_count > 0 ? (
                                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                            ✓ {abs.auto_rescheduled_count} citas reagendadas
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 text-[11px]">0 citas afectadas</span>
                                        )
                                      ) : (
                                        <span className="text-slate-400 text-[11px] italic">
                                          Sin reagendar (Auxiliar)
                                        </span>
                                      )
                                    ) : abs.status === "PENDING" ? (
                                      <span className="text-amber-700 text-[11px]">
                                        {isDoc ? "Reagendará citas al aprobar" : "No afecta a las citas"}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                    {abs.status === "PENDING" ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                          size="sm"
                                          className="text-xs px-2.5 py-1"
                                          loading={updateAbsenceStatusMutation.isPending}
                                          onClick={() =>
                                            updateAbsenceStatusMutation.mutate({ id: abs.id, status: "APPROVED" })
                                          }
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Aprobar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="text-xs px-2 py-1"
                                          loading={updateAbsenceStatusMutation.isPending}
                                          onClick={() =>
                                            updateAbsenceStatusMutation.mutate({ id: abs.id, status: "REJECTED" })
                                          }
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Rechazar
                                        </Button>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">Procesada</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {(absencesQuery.data?.absences ?? []).length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-500">
                                  No hay ausencias o vacaciones registradas.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
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
                                <Badge tone="neutral">
                                  {specialtiesMap.get(t.category)?.name || t.category_label || t.category}
                                </Badge>
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
            {
              id: "specialties",
              label: "Especialidades",
              content: (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Especialidades clínicas</h3>
                      <p className="text-sm text-slate-500">
                        Tabla maestra de especialidades compartida y sincronizada entre gabinetes y catálogo de tratamientos.
                      </p>
                    </div>
                    <Button onClick={openCreateSpecialty}>
                      <Plus className="h-4 w-4" />
                      Nueva especialidad
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 max-w-sm">
                    <Input
                      placeholder="Buscar especialidad o código..."
                      value={specialtySearch}
                      onChange={(e) => setSpecialtySearch(e.target.value)}
                    />
                  </div>

                  {specialtiesQuery.isLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500">Cargando especialidades...</div>
                  ) : filteredSpecialties.length === 0 ? (
                    <Card>
                      <div className="py-8 text-center">
                        <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-2 text-sm font-medium text-slate-900">No se encontraron especialidades</p>
                        <p className="text-xs text-slate-500">
                          {specialtySearch ? "Prueba con otro término de búsqueda" : "Crea tu primera especialidad"}
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Especialidad</th>
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Descripción</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSpecialties.map((spec) => (
                            <tr key={spec.id || spec.code} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: spec.color_code || "#0D9488" }}
                                    title={spec.color_code}
                                  />
                                  <span className="font-medium text-slate-900">{spec.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                                {spec.code}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-600">
                                {spec.description || "—"}
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge tone={spec.is_active ? "success" : "neutral"}>
                                  {spec.is_active ? "Activa" : "Inactiva"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Editar especialidad"
                                    onClick={() => openEditSpecialty(spec)}
                                  >
                                    <Edit2 className="h-4 w-4 text-slate-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-critical"
                                    title="Eliminar especialidad (borrado lógico)"
                                    onClick={() => setSpecialtyToDelete(spec)}
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

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Butaca física (Sillón / Box)
                </label>
                <select
                  aria-label="Butaca física"
                  value={cabinetChairId}
                  onChange={(e) => setCabinetChairId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Sin butaca asignada</option>
                  {(chairsQuery.data?.chairs ?? []).map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      🪑 {ch.name} {!ch.is_active ? "(Inactiva)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Doctor / Facultativo
                </label>
                <select
                  aria-label="Doctor asignado"
                  value={cabinetDoctorId}
                  onChange={(e) => setCabinetDoctorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Sin doctor asignado</option>
                  {(doctorsQuery.data?.doctors ?? []).map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      👨‍⚕️ Dr(a). {doc.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Auxiliar de gabinete
                </label>
                <select
                  aria-label="Auxiliar asignado"
                  value={cabinetAssistantId}
                  onChange={(e) => setCabinetAssistantId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Sin auxiliar asignado</option>
                  {(assistantsQuery.data?.assistants ?? []).map((ast) => (
                    <option key={ast.id} value={ast.id}>
                      🤝 Aux. {ast.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Equipamiento e instrumental instalado"
              placeholder="Ej. Motor quirúrgico, lámpara scialítica, Rx intraoral, ultrasonidos..."
              value={cabinetEquipment}
              onChange={(e) => setCabinetEquipment(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Especialidades / Tratamientos ejecutables en este gabinete
              </label>
              <p className="text-[11px] text-slate-500">
                Selecciona qué tipos de tratamientos permite realizar la equipación de este box (si no marcas ninguna, admite cualquier tratamiento).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeSpecialties.map((spec) => {
                  const isChecked = cabinetAllowedCategories.includes(spec.code) || cabinetAllowedCategories.includes(spec.name);
                  return (
                    <button
                      key={spec.id || spec.code}
                      type="button"
                      onClick={() => {
                        setCabinetAllowedCategories((prev) =>
                          isChecked
                            ? prev.filter((c) => c !== spec.code && c !== spec.name)
                            : [...prev, spec.code],
                        );
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
                        isChecked
                          ? "border-teal-600 bg-teal-50 text-teal-800 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: spec.color_code || "#0D9488" }} />
                      {isChecked ? `✓ ${spec.name}` : spec.name}
                    </button>
                  );
                })}
              </div>
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
              options={activeSpecialties.map((c) => ({ value: c.code, label: c.name }))}
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

        <Modal
          open={specialtyModalOpen}
          onClose={() => setSpecialtyModalOpen(false)}
          title={editingSpecialty ? "Editar especialidad" : "Nueva especialidad"}
          description="Configura el nombre, código, descripción y color distintivo para gabinetes y tratamientos."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSpecialtyModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                loading={saveSpecialtyMutation.isPending}
                onClick={() => saveSpecialtyMutation.mutate()}
                disabled={!specialtyForm.name.trim()}
              >
                Guardar especialidad
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <Input
              label="Nombre de la especialidad"
              placeholder="Ej. Ortodoncia Invisible"
              value={specialtyForm.name}
              onChange={(e) => setSpecialtyForm({ ...specialtyForm, name: e.target.value })}
              required
            />
            {!editingSpecialty && (
              <Input
                label="Código identificador (opcional)"
                placeholder="Ej. ORTODONCIA_INVISIBLE"
                value={specialtyForm.code}
                onChange={(e) => setSpecialtyForm({ ...specialtyForm, code: e.target.value })}
              />
            )}
            <Input
              label="Descripción"
              placeholder="Descripción del área clínica..."
              value={specialtyForm.description}
              onChange={(e) => setSpecialtyForm({ ...specialtyForm, description: e.target.value })}
            />
            <div>
              <Input
                label="Color identificativo"
                type="color"
                value={specialtyForm.color_code}
                onChange={(e) => setSpecialtyForm({ ...specialtyForm, color_code: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-400">
                Se usará para distinguir los gabinetes y tratamientos asociados a esta especialidad.
              </p>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          open={Boolean(specialtyToDelete)}
          onClose={() => setSpecialtyToDelete(null)}
          onConfirm={() => specialtyToDelete && deleteSpecialtyMutation.mutate(specialtyToDelete.id)}
          loading={deleteSpecialtyMutation.isPending}
          danger
          title={`¿Eliminar especialidad "${specialtyToDelete?.name}"?`}
          description="La especialidad se desactivará mediante un borrado lógico. No se eliminarán ni alterarán los tratamientos o gabinetes históricos asociados."
          confirmLabel="Sí, eliminar especialidad"
        />

        {/* Modal Butaca Física */}
        <Modal
          open={chairModalOpen}
          onClose={() => setChairModalOpen(false)}
          title={editingChair ? "Editar butaca física" : "Nueva butaca física (Sillón dental)"}
          description="Registra o actualiza los datos técnicos del sillón y su equipamiento instalado."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setChairModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                loading={saveChairMutation.isPending}
                onClick={() => saveChairMutation.mutate()}
                disabled={!chairName.trim()}
              >
                Guardar butaca
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nombre de la butaca"
                placeholder="Ej. Sillón 1 (Sala A - Kavo Primus)"
                value={chairName}
                onChange={(e) => setChairName(e.target.value)}
                required
              />
              <Input
                label="Color identificativo"
                type="color"
                value={chairColor}
                onChange={(e) => setChairColor(e.target.value)}
              />
            </div>

            <Input
              label="Equipamiento técnico instalado"
              placeholder="Ej. Motor de implantes, Rx intraoral, lámpara scialítica LED, ultrasonidos..."
              value={chairEquipment}
              onChange={(e) => setChairEquipment(e.target.value)}
            />

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={chairIsActive}
                onChange={(e) => setChairIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Butaca operativa y activa para asignación a gabinetes</span>
            </label>
          </div>
        </Modal>

        {/* Modal Registrar Ausencia o Baja */}
        <Modal
          open={absenceModalOpen}
          onClose={() => setAbsenceModalOpen(false)}
          title="Registrar ausencia o baja médica"
          description="Planifica períodos de vacaciones, permisos o bajas médicas del equipo."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAbsenceModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                loading={saveAbsenceMutation.isPending}
                onClick={() => saveAbsenceMutation.mutate()}
                disabled={!absenceUserId || !absenceStartDate || !absenceEndDate}
              >
                Registrar ausencia
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Profesional / Miembro del equipo
              </label>
              <select
                aria-label="Profesional para la ausencia"
                value={absenceUserId}
                onChange={(e) => setAbsenceUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
              >
                {(usersQuery.data?.users ?? []).map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name} · {getRoleDisplayName(u.role)} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tipo de ausencia
              </label>
              <select
                aria-label="Tipo de ausencia"
                value={absenceType}
                onChange={(e) => setAbsenceType(e.target.value as StaffAbsenceType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
              >
                <option value="VACATION">Vacaciones anuales</option>
                <option value="SICK_LEAVE">Baja médica / Incapacidad temporal</option>
                <option value="PERSONAL">Asuntos propios / Permiso retribuido</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Fecha de inicio"
                type="date"
                value={absenceStartDate}
                onChange={(e) => setAbsenceStartDate(e.target.value)}
                required
              />
              <Input
                label="Fecha de fin"
                type="date"
                value={absenceEndDate}
                onChange={(e) => setAbsenceEndDate(e.target.value)}
                required
              />
            </div>

            <Input
              label="Motivo u observaciones (opcional)"
              placeholder="Ej. Vacaciones de verano, reposo médico..."
              value={absenceNotes}
              onChange={(e) => setAbsenceNotes(e.target.value)}
            />

            {(() => {
              const selectedUser = (usersQuery.data?.users ?? []).find(
                (u) => u.user_id === absenceUserId,
              );
              const isDoctor =
                selectedUser?.role === "DENTIST" ||
                selectedUser?.role === "HYGIENIST" ||
                selectedUser?.role === "OWNER" ||
                selectedUser?.role === "ADMIN";
              return isDoctor ? (
                <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-teal-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Reagendamiento automático para Doctores activado</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-teal-700">
                    Al aprobarse esta ausencia, las citas de pacientes que colisionen en el período seleccionado serán <strong>reagendadas de forma automática</strong> a las siguientes fechas disponibles.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-slate-800">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span>Ausencia de personal Auxiliar</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Las citas agendadas no se reagendarán automáticamente porque el doctor continuará atendiendo la consulta.
                  </p>
                </div>
              );
            })()}
          </div>
        </Modal>

        <ConfirmDialog
          open={Boolean(chairToDelete)}
          onClose={() => setChairToDelete(null)}
          onConfirm={() => chairToDelete && deleteChairMutation.mutate(chairToDelete.id)}
          loading={deleteChairMutation.isPending}
          danger
          title={`¿Desactivar butaca física "${chairToDelete?.name}"?`}
          description="La butaca pasará a estar inactiva y no podrá asignarse a nuevos gabinetes. Las citas y el historial no se verán alterados."
          confirmLabel="Sí, desactivar butaca"
        />

        <ConfirmDialog
          open={cancelAccountOpen}
          onClose={() => setCancelAccountOpen(false)}
          onConfirm={() => cancelAccountMutation.mutate()}
          loading={cancelAccountMutation.isPending}
          danger
          title="¿Confirmar cancelación de la cuenta de la clínica?"
          description="Se cancelará la suscripción de forma inmediata. Tus datos clínicos y de facturación se custodiarán durante 90 días con una ventana de 30 días para reactivación preferente con un solo clic."
          confirmLabel="Sí, cancelar cuenta"
        />
      </div>
    </RoleGuard>
  );
}
