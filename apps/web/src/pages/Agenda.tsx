import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Maximize2,
  Minimize2,
  Moon,
  Plus,
  Radio,
  Search,
  Sparkles,
  Stethoscope,
  Sun,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Combobox,
  FeatureGate,
  Input,
  MultiCabinetTimeline,
  PermissionGate,
  Select,
  Skeleton,
  WaitingListCandidateCard,
  cn,
  useToast,
  type AppointmentCardData,
} from "@dentistes/ui";
import {
  DENTAL_TREATMENTS_MASTER,
  type Appointment,
  type AppointmentStatus,
  type AvailableSlot,
  type WaitingCandidateMatch,
} from "@dentistes/sdk";
import { useSession } from "../lib/session";
import { useAppointmentStream } from "../lib/useAppointmentStream";

const SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
];

const GRANULAR_SLOTS = (() => {
  const list: string[] = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 20 && m > 30) break;
      list.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return list;
})();

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDateISO(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function slotToRange(dateStr: string, slot: string, durationMinutes: number) {
  const [h, m] = slot.split(":").map(Number);
  const start = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function AgendaPage() {
  const { sdk, me } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISO);
  const [doctorFilter, setDoctorFilter] = useState("");
  const [cabinetFilter, setCabinetFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [matches, setMatches] = useState<WaitingCandidateMatch[]>([]);

  // Timeline Height Toggle: Compact (28px) vs Expanded (68px)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dentistes_agenda_expanded") === "true";
    } catch {
      return false;
    }
  });

  function toggleTimelineExpanded() {
    setIsTimelineExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("dentistes_agenda_expanded", String(next));
      } catch {}
      return next;
    });
  }

  // Next Available Slots Finder State
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderCabinet, setFinderCabinet] = useState("");
  const [finderTreatment, setFinderTreatment] = useState(DENTAL_TREATMENTS_MASTER[0].name);
  const [finderDuration, setFinderDuration] = useState<number>(DENTAL_TREATMENTS_MASTER[0].default_duration_minutes);
  const [finderShift, setFinderShift] = useState<"all" | "morning" | "afternoon">("all");
  const [finderStartDate, setFinderStartDate] = useState(todayISO());

  const defaultTreatment = DENTAL_TREATMENTS_MASTER[0];
  const [newForm, setNewForm] = useState({
    patient_id: "",
    doctor_id: "",
    cabinet_id: "",
    slot: "09:00",
    duration: String(defaultTreatment.default_duration_minutes),
    treatment_type: defaultTreatment.name,
    is_forced: false,
    notes: "",
  });

  const agendaEnabled = Boolean(me?.features?.agenda);
  const { connected } = useAppointmentStream(agendaEnabled);

  const availableSlotsQuery = useQuery({
    queryKey: ["available-slots", finderCabinet, finderDuration, finderShift, finderStartDate],
    queryFn: () =>
      sdk.findAvailableSlots({
        cabinet_id: finderCabinet || undefined,
        duration: finderDuration,
        shift: finderShift,
        start_date: finderStartDate,
        days: 21,
        limit: 30,
      }),
    enabled: agendaEnabled && finderOpen,
  });

  function handleSelectAvailableSlot(slot: AvailableSlot) {
    setDate(slot.date);
    if (slot.cabinet_id) {
      setCabinetFilter(slot.cabinet_id);
    }
    setFinderOpen(false);
    openNewAt(slot.cabinet_id, slot.start_time, slot.duration_minutes);
    if (finderTreatment) {
      setNewForm((prev) => ({
        ...prev,
        treatment_type: finderTreatment,
        duration: String(slot.duration_minutes),
      }));
    }
    notify({
      tone: "info",
      title: "Hueco reservado en formulario",
      description: `${slot.formatted_date} a las ${slot.start_time} (${slot.duration_minutes} min)`,
    });
  }

  const dayStart = useMemo(() => new Date(`${date}T00:00:00`).toISOString(), [date]);
  const dayEnd = useMemo(() => new Date(`${date}T23:59:59`).toISOString(), [date]);

  const cabinetsQuery = useQuery({
    queryKey: ["cabinets"],
    queryFn: () => sdk.listCabinets(),
    enabled: agendaEnabled,
  });

  const treatmentsQuery = useQuery({
    queryKey: ["treatments"],
    queryFn: () => sdk.listTreatments(),
    enabled: agendaEnabled,
  });

  const availableTreatments = useMemo(() => {
    const list = treatmentsQuery.data?.treatments;
    if (list && list.length > 0) {
      return list.map((t) => ({
        id: t.id,
        name: t.name,
        category_label: t.category,
        default_duration_minutes: t.estimated_minutes,
        color: t.color,
      }));
    }
    return DENTAL_TREATMENTS_MASTER;
  }, [treatmentsQuery.data?.treatments]);

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: () => sdk.listDoctors(),
    enabled: agendaEnabled,
  });

  const patientsQuery = useQuery({
    queryKey: ["patients", "agenda-select"],
    queryFn: () => sdk.listPatients({ limit: 100 }),
    enabled: agendaEnabled,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", date, doctorFilter],
    queryFn: () => sdk.listAppointments({ start: dayStart, end: dayEnd, doctor_id: doctorFilter || undefined }),
    enabled: agendaEnabled,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const { start, end } = slotToRange(date, newForm.slot, Number(newForm.duration) || 30);
      return sdk.createAppointment({
        patient_id: newForm.patient_id,
        doctor_id: newForm.doctor_id,
        cabinet_id: newForm.cabinet_id,
        start_time: start,
        end_time: end,
        treatment_type: newForm.treatment_type,
        is_forced: newForm.is_forced,
        notes: newForm.notes || undefined,
      });
    },
    onSuccess: async () => {
      setCreateOpen(false);
      notify({ tone: "success", title: "Cita programada con éxito" });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo programar la cita",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const moveMutation = useMutation({
    mutationFn: (input: { appt: Appointment; cabinetId: string; targetSlot: string }) => {
      const durMin = Math.max(
        15,
        Math.round((new Date(input.appt.end_time).getTime() - new Date(input.appt.start_time).getTime()) / 60_000),
      );
      const { start, end } = slotToRange(date, input.targetSlot, durMin);
      return sdk.updateAppointment(input.appt.id, {
        doctor_id: input.appt.doctor_id,
        cabinet_id: input.cabinetId,
        start_time: start,
        end_time: end,
        treatment_type: input.appt.treatment_type,
        version: input.appt.version,
      });
    },
    onSuccess: async (updated) => {
      setSelectedAppt(updated.appointment);
      notify({ tone: "success", title: "Cita reprogramada" });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo mover la cita",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: AppointmentStatus }) =>
      sdk.updateAppointmentStatus(input.id, input.status),
    onSuccess: async (res) => {
      setSelectedAppt(res.appointment);
      if (res.waiting_list_matches && res.waiting_list_matches.length > 0) {
        setMatches(res.waiting_list_matches);
      } else {
        setMatches([]);
      }
      notify({ tone: "success", title: "Estado de la cita actualizado" });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "Error al actualizar estado",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const holdMutation = useMutation({
    mutationFn: (entryId: string) => sdk.holdWaitingListEntry(entryId),
    onSuccess: () => {
      notify({ tone: "success", title: "Reserva temporal (15 min) activada" });
      void queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo reservar la plaza",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const allCabinets = cabinetsQuery.data?.cabinets ?? [];
  const cabinets = cabinetFilter ? allCabinets.filter((c) => c.id === cabinetFilter) : allCabinets;
  const doctors = doctorsQuery.data?.doctors ?? [];
  const appointments = appointmentsQuery.data?.appointments ?? [];
  const activeAppointments = useMemo(
    () => appointments.filter((a) => a.status !== "CANCELLED"),
    [appointments],
  );

  const appointmentsByCabinet = useMemo(() => {
    const map: Record<string, AppointmentCardData[]> = {};
    for (const appt of activeAppointments) {
      if (!map[appt.cabinet_id]) map[appt.cabinet_id] = [];
      map[appt.cabinet_id].push({
        id: appt.id,
        patientName: appt.patient_name,
        doctorName: appt.doctor_name,
        treatmentType: appt.treatment_type,
        startTime: hhmm(appt.start_time),
        endTime: hhmm(appt.end_time),
        status: appt.status,
        highRisk: appt.patient_high_risk,
      });
    }
    return map;
  }, [activeAppointments]);

  function openNewAt(cabinetId: string, slot: string, suggestedDuration?: number) {
    setSelectedAppt(null);
    setMatches([]);
    setNewForm((prev) => ({
      ...prev,
      cabinet_id: cabinetId || allCabinets[0]?.id || "",
      doctor_id: prev.doctor_id || doctors[0]?.id || "",
      slot,
      duration: suggestedDuration ? String(suggestedDuration) : prev.duration,
      is_forced: false,
      notes: "",
    }));
    setCreateOpen(true);
  }

  const selectedCabinet = allCabinets.find((c) => c.id === selectedAppt?.cabinet_id);
  const inChairCount = activeAppointments.filter((a) => a.status === "IN_CABINET" || a.status === "WAITING_ROOM").length;
  const confirmedCount = activeAppointments.filter((a) => a.status === "CONFIRMED").length;

  return (
    <FeatureGate me={me} feature="agenda">
      <div className="flex flex-col gap-2.5 lg:h-[calc(100vh-4.25rem)] lg:overflow-hidden">
        {/* Top Single-Bar Command Strip: Date Nav + Cabinet Pills + Doctor Filter + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs shrink-0">
          {/* Left: Title + Date Stepper */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 pr-1">
              <Calendar className="h-4 w-4 text-brand-700" />
              <h1 className="text-sm font-bold tracking-tight text-slate-900">Agenda</h1>
            </div>

            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setDate((d) => shiftDateISO(d, -1))}
                aria-label="Día anterior"
                className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <input
                type="date"
                aria-label="Fecha"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent px-1.5 text-xs font-semibold tabular-nums text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setDate(todayISO())}
                className="rounded px-2 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-white"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setDate((d) => shiftDateISO(d, 1))}
                aria-label="Día siguiente"
                className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Cabinet Quick-Switch Pills */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-100/70 p-0.5">
              <button
                type="button"
                onClick={() => setCabinetFilter("")}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition",
                  cabinetFilter === ""
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                Todos ({allCabinets.length})
              </button>
              {allCabinets.map((cab) => (
                <button
                  key={cab.id}
                  type="button"
                  onClick={() => setCabinetFilter(cabinetFilter === cab.id ? "" : cab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition",
                    cabinetFilter === cab.id
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cab.color_code }} />
                  <span>{cab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Doctor Select + Live Status + Nueva Cita */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Profesional"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Todos los profesionales</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.role})
                </option>
              ))}
            </select>

            <Badge tone={connected ? "success" : "warning"} className="px-2 py-0.5 text-[11px]">
              <Radio className="mr-1 inline h-3 w-3" />
              {connected ? "En vivo" : "Conectando…"}
            </Badge>

            {/* Expand / Compress Timeline Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTimelineExpanded}
              className="min-h-[32px] px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 border-slate-200"
              title={isTimelineExpanded ? "Comprimir calendario a vista compacta" : "Expandir calendario a vista detallada"}
            >
              {isTimelineExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Comprimir</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Expandir</span>
                </>
              )}
            </Button>

            {/* Buscar Hueco Disponible */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFinderStartDate(date);
                setFinderOpen(true);
              }}
              className="min-h-[32px] px-2.5 py-1 text-xs border-brand-200 bg-brand-50/70 text-brand-800 hover:bg-brand-100"
              title="Buscar siguientes citas disponibles según gabinete, tratamiento y horario"
            >
              <Search className="h-3.5 w-3.5 text-brand-600" />
              <span>Buscar hueco</span>
            </Button>

            <PermissionGate me={me} permission="appointments:write">
              <Button
                size="sm"
                className="min-h-[32px] px-3 py-1 text-xs"
                onClick={() => openNewAt(cabinetFilter || allCabinets[0]?.id || "", "09:00")}
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva cita
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Main Single-Screen Split Workspace: Compact Timeline (Left) + Contextual Unfolding Panel (Right) */}
        <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-12">
          {/* Left/Center: Single-Page Multi-Cabinet Timeline */}
          <div className="lg:col-span-8 xl:col-span-9 min-h-0 overflow-y-auto">
            {appointmentsQuery.isLoading || cabinetsQuery.isLoading ? (
              <Skeleton className="h-full min-h-[520px] w-full rounded-xl" />
            ) : allCabinets.length === 0 ? (
              <Alert tone="warning">
                No hay gabinetes configurados para esta clínica. Puedes crearlos en Administración.
              </Alert>
            ) : (
              <MultiCabinetTimeline
                cabinets={cabinets.map((c) => ({
                  id: c.id,
                  name: c.name,
                  colorCode: c.color_code,
                  availability: c.availability,
                }))}
                dayOfWeek={(new Date(`${date}T12:00:00`).getDay() || 7)}
                slots={SLOTS}
                slotHeight={isTimelineExpanded ? 68 : 28}
                selectedAppointmentId={selectedAppt?.id}
                selectedSlot={createOpen ? { cabinetId: newForm.cabinet_id, slot: newForm.slot } : null}
                appointmentsByCabinet={appointmentsByCabinet}
                onSelectSlot={(cabId, slot, suggestedDur) => openNewAt(cabId, slot, suggestedDur)}
                onSelectAppointment={(card) => {
                  const full = appointments.find((a) => a.id === card.id) ?? null;
                  setCreateOpen(false);
                  setMatches([]);
                  setSelectedAppt(full);
                }}
                onMoveAppointment={(apptId, targetCabId, targetSlot) => {
                  const appt = appointments.find((a) => a.id === apptId);
                  if (!appt) return;
                  moveMutation.mutate({ appt, cabinetId: targetCabId, targetSlot });
                }}
              />
            )}
          </div>

          {/* Right: In-Agenda Unfolding Contextual Options & Clear Navigation Panel */}
          <aside
            aria-label="Opciones y navegación de agenda"
            className="lg:col-span-4 xl:col-span-3 flex flex-col min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
          >
            {selectedAppt ? (
              /* MODE 1: UNFOLDED APPOINTMENT OPTIONS & CLEAR CLINICAL NAVIGATION */
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      Cita seleccionada
                    </span>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {selectedAppt.patient_name}
                    </h2>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {hhmm(selectedAppt.start_time)}–{hhmm(selectedAppt.end_time)} · {selectedAppt.treatment_type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAppt(null)}
                    aria-label="Cerrar detalle de cita"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Primary Clinical Navigation: 1-Click to Unified Odontogram + History Chart */}
                <div className="rounded-xl border border-brand-200/80 bg-brand-50/50 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <Stethoscope className="h-3.5 w-3.5 text-brand-700" />
                      <span>Dr(a). {selectedAppt.doctor_name}</span>
                    </div>
                    {selectedAppt.patient_high_risk ? (
                      <Badge tone="danger" className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Riesgo alto
                      </Badge>
                    ) : null}
                  </div>

                  <Link
                    to={`/patients/${selectedAppt.patient_id}`}
                    className="flex w-full items-center justify-between rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Abrir ficha clínica (Odontograma + Historia)
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Quick Navigation & Filtering Inside Agenda */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Gabinete:</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: selectedCabinet?.color_code ?? "#0D9488" }}
                      />
                      {selectedCabinet?.name ?? selectedAppt.cabinet_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {selectedCabinet ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[30px] px-2 text-[11px]"
                        onClick={() =>
                          setCabinetFilter(cabinetFilter === selectedCabinet.id ? "" : selectedCabinet.id)
                        }
                      >
                        <Filter className="h-3 w-3" />
                        {cabinetFilter === selectedCabinet.id ? "Ver todos gab." : "Solo este gab."}
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[30px] px-2 text-[11px]"
                      onClick={() =>
                        setDoctorFilter(doctorFilter === selectedAppt.doctor_id ? "" : selectedAppt.doctor_id)
                      }
                    >
                      <UserCheck className="h-3 w-3" />
                      {doctorFilter === selectedAppt.doctor_id ? "Todos doctores" : "Solo este Dr."}
                    </Button>
                  </div>
                </div>

                {/* 1-Click Appointment Status Workflow */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Flujo de estado en clínica
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ["SCHEDULED", "Programada"],
                        ["CONFIRMED", "Confirmada"],
                        ["WAITING_ROOM", "En sala de espera"],
                        ["IN_CABINET", "En gabinete"],
                        ["COMPLETED", "Finalizada"],
                        ["NO_SHOW", "No presentado"],
                        ["CANCELLED", "Cancelar cita"],
                      ] as const
                    ).map(([st, label]) => (
                      <Button
                        key={st}
                        size="sm"
                        className={cn(
                          "min-h-[32px] px-2.5 text-xs justify-start",
                          st === "CANCELLED" && "col-span-2 justify-center",
                        )}
                        variant={
                          selectedAppt.status === st
                            ? "primary"
                            : st === "CANCELLED"
                            ? "destructive"
                            : "outline"
                        }
                        loading={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: selectedAppt.id, status: st })}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Quick Inline Reschedule (Gabinete / Hora) */}
                <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Cambio rápido de hora o gabinete
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      aria-label="Cambiar gabinete"
                      value={selectedAppt.cabinet_id}
                      onChange={(e) =>
                        moveMutation.mutate({
                          appt: selectedAppt,
                          cabinetId: e.target.value,
                          targetSlot: hhmm(selectedAppt.start_time),
                        })
                      }
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                    >
                      {allCabinets.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Cambiar hora"
                      value={hhmm(selectedAppt.start_time)}
                      onChange={(e) =>
                        moveMutation.mutate({
                          appt: selectedAppt,
                          cabinetId: selectedAppt.cabinet_id,
                          targetSlot: e.target.value,
                        })
                      }
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs tabular-nums text-slate-800"
                    >
                      {GRANULAR_SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Waiting List Candidates if Cancelled */}
                {matches.length > 0 ? (
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-xs font-bold text-slate-900">
                      Candidatos en lista de espera para este hueco
                    </p>
                    {matches.map((m) => (
                      <WaitingListCandidateCard
                        key={m.entry.id}
                        patientName={m.entry.patient_name}
                        phone={m.entry.patient_phone}
                        treatmentType={m.entry.treatment_type}
                        durationMinutes={m.entry.estimated_duration_minutes}
                        urgencyLevel={m.entry.urgency_level}
                        matchScore={m.match_score}
                        onOfferWhatsApp={() => holdMutation.mutate(m.entry.id)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : createOpen ? (
              /* MODE 2: INLINE NEW APPOINTMENT FORM UNFOLDED INSIDE AGENDA */
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      Nuevo hueco seleccionado
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">Programar nueva cita</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    aria-label="Cerrar formulario"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form
                  className="space-y-3"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    createMutation.mutate();
                  }}
                >
                  <Combobox
                    label="Paciente"
                    value={newForm.patient_id}
                    onChange={(v) => setNewForm({ ...newForm, patient_id: v })}
                    placeholder="Buscar paciente…"
                    options={(patientsQuery.data?.patients ?? []).map((p) => ({
                      value: p.id,
                      label: `${p.last_name}, ${p.first_name}`,
                      hint: p.phone,
                    }))}
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select
                      label="Gabinete dental"
                      value={newForm.cabinet_id}
                      onChange={(v) => setNewForm({ ...newForm, cabinet_id: v })}
                      placeholder=""
                      options={allCabinets.map((c) => ({ value: c.id, label: c.name }))}
                    />
                    <Select
                      label="Profesional asignado"
                      value={newForm.doctor_id}
                      onChange={(v) => setNewForm({ ...newForm, doctor_id: v })}
                      placeholder=""
                      options={doctors.map((d) => ({ value: d.id, label: d.full_name }))}
                    />
                  </div>

                  <Select
                    label="Tratamiento dental"
                    value={newForm.treatment_type}
                    onChange={(v) => {
                      const found = availableTreatments.find((t) => t.name === v);
                      setNewForm({
                        ...newForm,
                        treatment_type: v,
                        duration: found ? String(found.default_duration_minutes) : newForm.duration,
                      });
                    }}
                    placeholder=""
                    options={availableTreatments.map((t) => ({
                      value: t.name,
                      label: `${t.name} (${t.default_duration_minutes} min)`,
                      hint: t.category_label,
                    }))}
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select
                      label="Hora de inicio"
                      value={newForm.slot}
                      onChange={(v) => setNewForm({ ...newForm, slot: v })}
                      placeholder=""
                      options={GRANULAR_SLOTS.map((s) => ({ value: s, label: s }))}
                    />
                    <Select
                      label="Duración estimada"
                      value={newForm.duration}
                      onChange={(v) => setNewForm({ ...newForm, duration: v })}
                      placeholder=""
                      options={[
                        { value: "10", label: "10 minutos (Consulta / Revisión)" },
                        { value: "15", label: "15 minutos" },
                        { value: "20", label: "20 minutos" },
                        { value: "30", label: "30 minutos" },
                        { value: "45", label: "45 minutos" },
                        { value: "60", label: "60 minutos (1 hora)" },
                        { value: "90", label: "90 minutos" },
                        { value: "120", label: "120 minutos (2 horas)" },
                      ]}
                    />
                  </div>

                  <input
                    type="text"
                    aria-label="Notas de la cita"
                    value={newForm.notes}
                    onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                    placeholder="Notas rápidas (urgencia, material, observaciones…)"
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                  />

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newForm.is_forced}
                      onChange={(e) => setNewForm({ ...newForm, is_forced: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 accent-brand-600"
                    />
                    <span>Forzar cita de urgencia (permitir solapamiento en gabinete)</span>
                  </label>

                  <Button
                    type="submit"
                    size="sm"
                    loading={createMutation.isPending}
                    disabled={!newForm.patient_id || !newForm.cabinet_id || !newForm.doctor_id}
                    className="w-full"
                  >
                    Confirmar cita
                  </Button>
                </form>
              </div>
            ) : (
              /* MODE 3: DAY OVERVIEW & QUICK PATIENT NAVIGATION LIST */
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      Panel interactivo
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">Actividad y navegación del día</h2>
                    <p className="text-[11px] text-slate-500">
                      Haz clic en una cita o hueco libre para desplegar sus opciones aquí.
                    </p>
                  </div>

                  {/* Quick Day Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2">
                      <p className="text-base font-bold tabular-nums text-slate-900">{activeAppointments.length}</p>
                      <p className="text-[10px] font-medium text-slate-500">Citas hoy</p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2">
                      <p className="text-base font-bold tabular-nums text-emerald-800">{confirmedCount}</p>
                      <p className="text-[10px] font-medium text-emerald-700">Confirmadas</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-2">
                      <p className="text-base font-bold tabular-nums text-blue-800">{inChairCount}</p>
                      <p className="text-[10px] font-medium text-blue-700">En clínica</p>
                    </div>
                  </div>

                  {/* Chronological Patient Queue with 1-Click Jump to Chart */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Pacientes citados ({activeAppointments.length})
                    </p>
                    {activeAppointments.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs text-slate-500">
                        Sin citas en esta fecha. Haz clic en cualquier celda horaria para programar.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5">
                        {activeAppointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs hover:border-brand-300 transition"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedAppt(appt)}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold tabular-nums text-brand-700">
                                  {hhmm(appt.start_time)}
                                </span>
                                <span className="truncate font-semibold text-slate-900">
                                  {appt.patient_name}
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-slate-500">
                                {appt.treatment_type} · {appt.cabinet_name}
                              </p>
                            </button>
                            <Link
                              to={`/patients/${appt.patient_id}`}
                              title="Ir directo a ficha clínica (Odontograma + Historia)"
                              className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 hover:border-brand-300"
                            >
                              Ficha →
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Module Links */}
                <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5">
                  <Link
                    to="/waiting-list"
                    className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Clock className="h-3.5 w-3.5 text-brand-700" />
                    Lista de espera
                  </Link>
                  <Link
                    to="/patients"
                    className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Users className="h-3.5 w-3.5 text-brand-700" />
                    Pacientes
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Modal: Buscador de Siguientes Citas / Huecos Disponibles */}
        {finderOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Search className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Buscador de Siguientes Huecos Disponibles
                    </h3>
                    <p className="text-xs text-slate-500">
                      Encuentra las próximas citas libres por gabinete, tratamiento y franja horaria
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFinderOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Controls */}
              <div className="border-b border-slate-100 bg-slate-50/70 p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Gabinete Filter */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Gabinete</label>
                    <select
                      value={finderCabinet}
                      onChange={(e) => setFinderCabinet(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-brand-500 focus:outline-none"
                    >
                      <option value="">Cualquier gabinete ({allCabinets.length})</option>
                      {allCabinets.map((cab) => (
                        <option key={cab.id} value={cab.id}>
                          {cab.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha a partir de */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">A partir de</label>
                    <input
                      type="date"
                      value={finderStartDate}
                      onChange={(e) => setFinderStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Tratamiento / Hueco necesario */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Tratamiento (duración estimada)
                    </label>
                    <select
                      value={finderTreatment}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFinderTreatment(val);
                        const found = availableTreatments.find((t) => t.name === val);
                        if (found) {
                          setFinderDuration(found.default_duration_minutes);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-brand-500 focus:outline-none"
                    >
                      {availableTreatments.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.default_duration_minutes} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duración en minutos buttons */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Hueco necesario: <span className="text-brand-700 font-bold">{finderDuration} min</span>
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[15, 20, 30, 45, 60, 90, 120].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setFinderDuration(dur)}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs font-medium transition",
                            finderDuration === dur
                              ? "border-brand-600 bg-brand-600 text-white font-bold shadow-2xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                          )}
                        >
                          {dur}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Franja Horaria (Mañana / Tarde / Todo el día) */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Franja horaria preferida</label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFinderShift("all")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                        finderShift === "all"
                          ? "bg-brand-600 text-white font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900",
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Cualquier hora</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinderShift("morning")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                        finderShift === "morning"
                          ? "bg-amber-500 text-white font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900",
                      )}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      <span>Mañanas (09:00–14:00)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinderShift("afternoon")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                        finderShift === "afternoon"
                          ? "bg-indigo-600 text-white font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900",
                      )}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      <span>Tardes (14:00–20:00)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {availableSlotsQuery.isLoading ? (
                  <div className="space-y-2 py-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : availableSlotsQuery.isError ? (
                  <Alert tone="danger">Error al buscar huecos disponibles en la agenda.</Alert>
                ) : (availableSlotsQuery.data?.slots ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No se han encontrado huecos con estos criterios</p>
                    <p className="text-xs text-slate-500 mt-0.5">Prueba a ampliar la franja horaria o buscar en otro gabinete.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1 pb-1">
                      <span>Se han encontrado {availableSlotsQuery.data?.slots.length} huecos disponibles</span>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Hueco de {finderDuration} minutos
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {availableSlotsQuery.data?.slots.map((slot, idx) => (
                        <div
                          key={`${slot.date}-${slot.cabinet_id}-${slot.start_time}-${idx}`}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-brand-400 hover:shadow-xs transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{slot.start_time}–{slot.end_time}</span>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 text-[10px] font-semibold",
                                  slot.shift === "morning"
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-indigo-50 text-indigo-800 border border-indigo-200",
                                )}
                              >
                                {slot.shift === "morning" ? "Mañana" : "Tarde"}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: slot.cabinet_color || "#0D9488" }} />
                              <span className="truncate font-medium text-slate-700">{slot.cabinet_name}</span>
                              <span>·</span>
                              <span className="truncate">{slot.formatted_date}</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="ml-2 shrink-0 text-xs px-2.5 py-1"
                            onClick={() => handleSelectAvailableSlot(slot)}
                          >
                            Reservar →
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end border-t border-slate-200 px-5 py-3">
                <Button variant="outline" size="sm" onClick={() => setFinderOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </FeatureGate>
  );
}
