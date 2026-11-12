import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  Button,
  Card,
  Combobox,
  EmptyState,
  FeatureGate,
  Input,
  Modal,
  PageHeader,
  PermissionGate,
  Select,
  Skeleton,
  WaitingListCandidateCard,
  useToast,
} from "@dentistes/ui";
import type { WaitingListEntry } from "@dentistes/sdk";
import { useSession } from "../lib/session";

export function WaitingListPage() {
  const { sdk, me } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("WAITING");
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    treatment_type: "Revisió",
    estimated_duration_minutes: "30",
    preferred_time_slot: "ANY" as WaitingListEntry["preferred_time_slot"],
    urgency_level: "NORMAL" as WaitingListEntry["urgency_level"],
    notes: "",
  });

  const enabled = Boolean(me?.features?.waiting_list);

  const listQuery = useQuery({
    queryKey: ["waiting-list", statusFilter],
    queryFn: () => sdk.listWaitingList((statusFilter || undefined) as WaitingListEntry["status"] | undefined),
    enabled,
  });

  const patientsQuery = useQuery({
    queryKey: ["patients", "waiting-select"],
    queryFn: () => sdk.listPatients({ limit: 100 }),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      sdk.createWaitingListEntry({
        patient_id: form.patient_id,
        treatment_type: form.treatment_type,
        estimated_duration_minutes: Number(form.estimated_duration_minutes) || 30,
        preferred_time_slot: form.preferred_time_slot,
        urgency_level: form.urgency_level,
        notes: form.notes,
      }),
    onSuccess: async () => {
      setModalOpen(false);
      notify({ tone: "success", title: "Pacient afegit a la llista d'espera" });
      await queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No s'ha pogut afegir",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const holdMutation = useMutation({
    mutationFn: (id: string) => sdk.holdWaitingListEntry(id),
    onSuccess: async () => {
      notify({ tone: "success", title: "Bloqueig temporal (15 min) activat" });
      await queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No s'ha pogut reservar",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const entries = listQuery.data?.entries ?? [];

  return (
    <FeatureGate me={me} feature="waiting_list">
      <div className="space-y-6">
        <PageHeader
          title="Llista d'espera dinàmica"
          description="Cua prioritzada per cobrir cancel·lacions d'última hora amb bloqueig temporal de 15 minuts."
          actions={
            <PermissionGate me={me} permission="appointments:write">
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Afegir pacient
              </Button>
            </PermissionGate>
          }
        />

        <Card>
          <div className="mb-4 max-w-xs">
            <Select
              label="Estat"
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Tots els estats"
              options={[
                { value: "WAITING", label: "En espera" },
                { value: "OFFERED", label: "Ofertada (Hold 15m)" },
                { value: "SCHEDULED", label: "Programada" },
                { value: "CANCELLED", label: "Cancel·lada" },
              ]}
            />
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              title="Sense pacients en aquesta cua"
              description="Afegeix pacients perquè el sistema suggereixi candidats quan s'alliberi un forat."
            />
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <WaitingListCandidateCard
                  key={entry.id}
                  patientName={entry.patient_name}
                  phone={entry.patient_phone}
                  treatmentType={`${entry.treatment_type} · ${entry.preferred_time_slot} (${entry.status})`}
                  durationMinutes={entry.estimated_duration_minutes}
                  urgencyLevel={entry.urgency_level}
                  matchScore={entry.urgency_level === "URGENT" ? 98 : entry.urgency_level === "HIGH" ? 85 : 70}
                  onOfferWhatsApp={
                    entry.status === "WAITING" ? () => holdMutation.mutate(entry.id) : undefined
                  }
                />
              ))}
            </div>
          )}
        </Card>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Inscriure a la llista d'espera">
          <form
            className="space-y-4"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <Combobox
              label="Pacient"
              value={form.patient_id}
              onChange={(v) => setForm({ ...form, patient_id: v })}
              placeholder="Cerca pacient…"
              options={(patientsQuery.data?.patients ?? []).map((p) => ({
                value: p.id,
                label: `${p.last_name}, ${p.first_name}`,
                hint: p.phone,
              }))}
            />
            <Input
              label="Tractament requerit"
              value={form.treatment_type}
              onChange={(e) => setForm({ ...form, treatment_type: e.target.value })}
              required
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Select
                label="Durada"
                value={form.estimated_duration_minutes}
                onChange={(v) => setForm({ ...form, estimated_duration_minutes: v })}
                placeholder=""
                options={[
                  { value: "15", label: "15 min" },
                  { value: "30", label: "30 min" },
                  { value: "45", label: "45 min" },
                  { value: "60", label: "60 min" },
                ]}
              />
              <Select
                label="Franja"
                value={form.preferred_time_slot}
                onChange={(v) => setForm({ ...form, preferred_time_slot: v as WaitingListEntry["preferred_time_slot"] })}
                placeholder=""
                options={[
                  { value: "ANY", label: "Qualsevol" },
                  { value: "MORNING", label: "Matins" },
                  { value: "AFTERNOON", label: "Tardes" },
                ]}
              />
              <Select
                label="Urgència"
                value={form.urgency_level}
                onChange={(v) => setForm({ ...form, urgency_level: v as WaitingListEntry["urgency_level"] })}
                placeholder=""
                options={[
                  { value: "LOW", label: "Baixa" },
                  { value: "NORMAL", label: "Normal" },
                  { value: "HIGH", label: "Alta" },
                  { value: "URGENT", label: "Urgent" },
                ]}
              />
            </div>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!form.patient_id}
              className="w-full"
            >
              Desar a la llista
            </Button>
          </form>
        </Modal>
      </div>
    </FeatureGate>
  );
}
