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
  Plus,
  Radio,
  Stethoscope,
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
                slotHeight={28}
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
      </div>
    </FeatureGate>
  );
}
