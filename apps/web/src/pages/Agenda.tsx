import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Radio } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Combobox,
  FeatureGate,
  Input,
  Modal,
  MultiCabinetTimeline,
  PageHeader,
  PermissionGate,
  Select,
  Sheet,
  Skeleton,
  WaitingListCandidateCard,
  useToast,
  type AppointmentCardData,
} from "@dentistes/ui";
import type { Appointment, AppointmentStatus, WaitingCandidateMatch } from "@dentistes/sdk";
import { useSession } from "../lib/session";
import { useAppointmentStream } from "../lib/useAppointmentStream";

const SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [matches, setMatches] = useState<WaitingCandidateMatch[]>([]);

  const [newForm, setNewForm] = useState({
    patient_id: "",
    doctor_id: "",
    cabinet_id: "",
    slot: "09:00",
    duration: "30",
    treatment_type: "Revisió",
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
      });
    },
    onSuccess: async () => {
      setCreateOpen(false);
      notify({ tone: "success", title: "Cita programada" });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No s'ha pogut crear la cita",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const moveMutation = useMutation({
    mutationFn: (input: { appt: Appointment; cabinetId: string; targetSlot: string }) => {
      const durMin = Math.max(15, Math.round((new Date(input.appt.end_time).getTime() - new Date(input.appt.start_time).getTime()) / 60_000));
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
    onSuccess: async () => {
      notify({ tone: "success", title: "Cita reprogramada" });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No s'ha pogut moure la cita",
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
      notify({ tone: "success", title: "Estat actualitzat" });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "Error actualitzant estat",
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
        title: "No s'ha pogut bloquejar la plaça",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const cabinets = cabinetsQuery.data?.cabinets ?? [];
  const doctors = doctorsQuery.data?.doctors ?? [];
  const appointments = appointmentsQuery.data?.appointments ?? [];

  const appointmentsByCabinet = useMemo(() => {
    const map: Record<string, AppointmentCardData[]> = {};
    for (const appt of appointments) {
      if (appt.status === "CANCELLED") continue;
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
  }, [appointments]);

  function openNewAt(cabinetId: string, slot: string) {
    setNewForm((prev) => ({
      ...prev,
      cabinet_id: cabinetId || cabinets[0]?.id || "",
      doctor_id: prev.doctor_id || doctors[0]?.id || "",
      slot,
    }));
    setCreateOpen(true);
  }

  return (
    <FeatureGate me={me} feature="agenda">
      <div className="space-y-6">
        <PageHeader
          title="Agenda multigabinet"
          description="Arrossega una cita per reprogramar entre hores o gabinets. Sincronització SSE en temps real."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={connected ? "success" : "warning"}>
                <Radio className="mr-1 inline h-3 w-3" />
                {connected ? "SSE en directe" : "Connectant…"}
              </Badge>
              <PermissionGate me={me} permission="appointments:write">
                <Button onClick={() => openNewAt(cabinets[0]?.id ?? "", "09:00")}>
                  <Plus className="h-4 w-4" />
                  Nova cita
                </Button>
              </PermissionGate>
            </div>
          }
        />

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="w-48">
            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              prefixIcon={<Calendar className="h-4 w-4" />}
            />
          </div>
          <div className="w-64">
            <Select
              label="Filtrar per professional"
              value={doctorFilter}
              onChange={setDoctorFilter}
              placeholder="Tots els professionals"
              options={doctors.map((d) => ({ value: d.id, label: `${d.full_name} (${d.role})` }))}
            />
          </div>
        </div>

        {appointmentsQuery.isLoading || cabinetsQuery.isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : cabinets.length === 0 ? (
          <Alert tone="warning">No hi ha gabinets actius configurats per a aquesta clínica.</Alert>
        ) : (
          <MultiCabinetTimeline
            cabinets={cabinets.map((c) => ({ id: c.id, name: c.name, colorCode: c.color_code }))}
            slots={SLOTS}
            appointmentsByCabinet={appointmentsByCabinet}
            onSelectSlot={(cabId, slot) => openNewAt(cabId, slot)}
            onSelectAppointment={(card) => {
              const full = appointments.find((a) => a.id === card.id) ?? null;
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

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Programar nova cita">
          <form
            className="space-y-4"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <Combobox
              label="Pacient"
              value={newForm.patient_id}
              onChange={(v) => setNewForm({ ...newForm, patient_id: v })}
              placeholder="Cerca pacient…"
              options={(patientsQuery.data?.patients ?? []).map((p) => ({
                value: p.id,
                label: `${p.last_name}, ${p.first_name}`,
                hint: p.phone,
              }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Gabinet"
                value={newForm.cabinet_id}
                onChange={(v) => setNewForm({ ...newForm, cabinet_id: v })}
                placeholder=""
                options={cabinets.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                label="Professional"
                value={newForm.doctor_id}
                onChange={(v) => setNewForm({ ...newForm, doctor_id: v })}
                placeholder=""
                options={doctors.map((d) => ({ value: d.id, label: d.full_name }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Hora d'inici"
                value={newForm.slot}
                onChange={(v) => setNewForm({ ...newForm, slot: v })}
                placeholder=""
                options={SLOTS.map((s) => ({ value: s, label: s }))}
              />
              <Select
                label="Durada"
                value={newForm.duration}
                onChange={(v) => setNewForm({ ...newForm, duration: v })}
                placeholder=""
                options={[
                  { value: "15", label: "15 minuts" },
                  { value: "30", label: "30 minuts" },
                  { value: "45", label: "45 minuts" },
                  { value: "60", label: "60 minuts" },
                  { value: "90", label: "90 minuts" },
                ]}
              />
            </div>
            <Input
              label="Tractament"
              value={newForm.treatment_type}
              onChange={(e) => setNewForm({ ...newForm, treatment_type: e.target.value })}
              required
            />
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!newForm.patient_id || !newForm.cabinet_id || !newForm.doctor_id}
              className="w-full"
            >
              Confirmar cita
            </Button>
          </form>
        </Modal>

        <Sheet
          open={Boolean(selectedAppt)}
          onClose={() => setSelectedAppt(null)}
          title={selectedAppt ? selectedAppt.patient_name : ""}
          description={
            selectedAppt
              ? `${selectedAppt.treatment_type} · ${hhmm(selectedAppt.start_time)}–${hhmm(selectedAppt.end_time)} · ${selectedAppt.cabinet_name}`
              : undefined
          }
        >
          {selectedAppt ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estat de la cita</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["SCHEDULED", "Programada"],
                      ["CONFIRMED", "Confirmada"],
                      ["WAITING_ROOM", "Sala d'espera"],
                      ["IN_CABINET", "En gabinet"],
                      ["COMPLETED", "Finalitzada"],
                      ["NO_SHOW", "No presentat"],
                      ["CANCELLED", "Cancel·lar cita"],
                    ] as const
                  ).map(([st, label]) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={selectedAppt.status === st ? "primary" : st === "CANCELLED" ? "destructive" : "outline"}
                      loading={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: selectedAppt.id, status: st })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {matches.length > 0 ? (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Candidats en llista d'espera per cobrir aquest forat
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
          ) : null}
        </Sheet>
      </div>
    </FeatureGate>
  );
}
