import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ClinicalHistoryTimeline,
  CriticalAlertBanner,
  FeatureGate,
  Input,
  OdontogramGrid,
  PageHeader,
  PermissionGate,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
  emptyTooth,
  useToast,
  type ToothState,
  type ToothSurfaceName,
  type ToothSurfaceStatus,
} from "@dentistes/ui";
import { can, type ClinicalRecord, type Odontogram } from "@dentistes/sdk";
import { useSession } from "../lib/session";
import { useUiStore } from "../lib/store";

export function PatientDetailPage() {
  const { id = "" } = useParams();
  const { sdk, me } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { odontogramTool, setOdontogramTool, odontogramDentition, setOdontogramDentition } = useUiStore();

  const patientQuery = useQuery({
    queryKey: ["patient", id],
    queryFn: () => sdk.getPatient(id),
    enabled: Boolean(id),
  });

  const canReadClinical = can(me, "clinical:read");
  const canWriteClinical = can(me, "clinical:write");

  const recordsQuery = useQuery({
    queryKey: ["patient-records", id],
    queryFn: () => sdk.listClinicalRecords(id),
    enabled: Boolean(id && canReadClinical && me?.features?.clinical_history),
  });

  const odontogramQuery = useQuery({
    queryKey: ["patient-odontograms", id],
    queryFn: () => sdk.listOdontograms(id),
    enabled: Boolean(id && canReadClinical && me?.features?.odontogram),
  });

  const patient = patientQuery.data?.patient;

  // Editable patient + medical alerts state
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    email: "",
    dni_nie: "",
    gender: "",
    whatsapp_opt_in: false,
    high_risk: false,
    prophylaxis: false,
    allergiesText: "",
    conditionsText: "",
    medicationsText: "",
    alertNotes: "",
  });

  useEffect(() => {
    if (!patient) return;
    const alerts = patient.medical_alerts ?? {};
    const toCsv = (items?: Array<{ name: string } | string>) =>
      (items ?? []).map((x) => (typeof x === "string" ? x : x.name)).join(", ");
    setForm({
      first_name: patient.first_name,
      last_name: patient.last_name,
      birth_date: patient.birth_date,
      phone: patient.phone,
      email: patient.email ?? "",
      dni_nie: patient.dni_nie ?? "",
      gender: patient.gender ?? "",
      whatsapp_opt_in: patient.whatsapp_opt_in,
      high_risk: Boolean(alerts.high_risk ?? patient.high_risk),
      prophylaxis: Boolean(alerts.requires_antibiotic_prophylaxis),
      allergiesText: toCsv(alerts.allergies),
      conditionsText: toCsv(alerts.conditions),
      medicationsText: toCsv(alerts.medications),
      alertNotes: alerts.notes ?? "",
    });
  }, [patient]);

  const updatePatientMutation = useMutation({
    mutationFn: () => {
      const splitList = (raw: string) =>
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
      return sdk.updatePatient(id, {
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
        phone: form.phone,
        email: form.email || undefined,
        dni_nie: form.dni_nie || undefined,
        gender: form.gender || undefined,
        whatsapp_opt_in: form.whatsapp_opt_in,
        medical_alerts: canWriteClinical
          ? {
              high_risk: form.high_risk,
              requires_antibiotic_prophylaxis: form.prophylaxis,
              allergies: splitList(form.allergiesText),
              conditions: splitList(form.conditionsText),
              medications: splitList(form.medicationsText),
              notes: form.alertNotes,
            }
          : undefined,
      });
    },
    onSuccess: async () => {
      notify({ tone: "success", title: "Ficha actualizada" });
      await queryClient.invalidateQueries({ queryKey: ["patient", id] });
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo actualizar",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  // Clinical record form (F3)
  const [entryType, setEntryType] = useState<ClinicalRecord["entry_type"]>("NOTE");
  const [entryContent, setEntryContent] = useState("");
  const [amendsEntryId, setAmendsEntryId] = useState("");

  const createRecordMutation = useMutation({
    mutationFn: () =>
      sdk.createClinicalRecord(id, {
        entry_type: entryType,
        content: entryContent,
        amends_entry_id: amendsEntryId || undefined,
      }),
    onSuccess: async () => {
      setEntryContent("");
      setAmendsEntryId("");
      notify({ tone: "success", title: "Evolución clínica registrada" });
      await queryClient.invalidateQueries({ queryKey: ["patient-records", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo guardar la evolución",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  // Odontogram state (F1)
  const [odoType, setOdoType] = useState<Odontogram["type"]>("CURRENT");
  const [teeth, setTeeth] = useState<Record<number, ToothState>>({});
  const [selectedTooth, setSelectedTooth] = useState<number | undefined>();
  const currentOdo = odontogramQuery.data?.odontograms.find((o) => o.type === odoType);

  useEffect(() => {
    const raw = currentOdo?.teeth_data as Record<string, ToothState> | undefined;
    if (!raw) {
      setTeeth({});
      return;
    }
    const parsed: Record<number, ToothState> = {};
    for (const [k, val] of Object.entries(raw)) {
      const num = Number(k);
      if (!Number.isNaN(num)) parsed[num] = val;
    }
    setTeeth(parsed);
  }, [currentOdo, odoType]);

  const saveOdontogramMutation = useMutation({
    mutationFn: () =>
      sdk.saveOdontogram(id, odoType, {
        teeth_data: teeth,
        version: currentOdo?.version,
      }),
    onSuccess: async () => {
      notify({ tone: "success", title: "Odontograma guardado" });
      await queryClient.invalidateQueries({ queryKey: ["patient-odontograms", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "Error al guardar odontograma",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  function handleToggleSurface(toothNum: number, surface: ToothSurfaceName, nextStatus: ToothSurfaceStatus) {
    setSelectedTooth(toothNum);
    setTeeth((prev) => {
      const base = prev[toothNum] ?? emptyTooth(toothNum);
      if (nextStatus === "missing") {
        return {
          ...prev,
          [toothNum]: {
            ...base,
            general_status: base.general_status === "missing" ? "present" : "missing",
          },
        };
      }
      return {
        ...prev,
        [toothNum]: {
          ...base,
          general_status: base.general_status === "missing" ? "present" : base.general_status,
          surfaces: { ...base.surfaces, [surface]: nextStatus },
        },
      };
    });
  }

  function setToothGeneralStatus(toothNum: number, status: NonNullable<ToothState["general_status"]>) {
    setTeeth((prev) => {
      const base = prev[toothNum] ?? emptyTooth(toothNum);
      return { ...prev, [toothNum]: { ...base, general_status: status } };
    });
  }

  if (patientQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (patientQuery.error || !patient) {
    return (
      <Alert tone="danger" title="No se pudo cargar la ficha">
        {patientQuery.error instanceof Error ? patientQuery.error.message : "Paciente no encontrado."}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link to="/patients" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Pacientes
        </Link>
      </div>

      <PageHeader
        title={`${patient.last_name}, ${patient.first_name}`}
        description={`Tel: ${patient.phone} · Nacimiento: ${patient.birth_date}`}
        actions={
          <Badge tone={patient.whatsapp_opt_in ? "success" : "neutral"}>
            {patient.whatsapp_opt_in ? "WhatsApp Opt-in" : "Sin Opt-in WhatsApp"}
          </Badge>
        }
      />

      <CriticalAlertBanner
        alerts={patient.medical_alerts}
        summaryText={patient.medical_alerts?.summary}
        hideDetails={!canReadClinical}
      />

      <Tabs
        activeId={activeTab}
        onChange={setActiveTab}
        items={[
          {
            id: "overview",
            label: "Dades i Alertes",
            content: (
              <form
                className="grid gap-6 lg:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  updatePatientMutation.mutate();
                }}
              >
                <Card title="Dades de contacte">
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Nom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                      <Input label="Cognoms" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Data de naixement" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
                      <Input label="DNI / NIE" value={form.dni_nie} onChange={(e) => setForm({ ...form, dni_nie: e.target.value })} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Telèfon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                      <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <Switch
                      label="Consentiment explícit WhatsApp (Opt-in)"
                      checked={form.whatsapp_opt_in}
                      onChange={(checked) => setForm({ ...form, whatsapp_opt_in: checked })}
                    />
                  </div>
                </Card>

                <Card title="Alertes Mèdiques (JSONB)" description={canReadClinical ? "Visibles permanentment a la capçalera" : "Accés restringit al personal facultatiu"}>
                  {canReadClinical ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4">
                        <Switch label="Risc alt" checked={form.high_risk} onChange={(v) => setForm({ ...form, high_risk: v })} disabled={!canWriteClinical} />
                        <Switch label="Profilaxi antibiòtica" checked={form.prophylaxis} onChange={(v) => setForm({ ...form, prophylaxis: v })} disabled={!canWriteClinical} />
                      </div>
                      <Input
                        label="Al·lèrgies (separades per comes)"
                        value={form.allergiesText}
                        onChange={(e) => setForm({ ...form, allergiesText: e.target.value })}
                        placeholder="Penicil·lina, Làtex"
                        disabled={!canWriteClinical}
                      />
                      <Input
                        label="Patologies / Antecedents (separats per comes)"
                        value={form.conditionsText}
                        onChange={(e) => setForm({ ...form, conditionsText: e.target.value })}
                        placeholder="Hipertensió, Anticoagulats"
                        disabled={!canWriteClinical}
                      />
                      <Input
                        label="Medicació crònica"
                        value={form.medicationsText}
                        onChange={(e) => setForm({ ...form, medicationsText: e.target.value })}
                        placeholder="Sintrom 4mg"
                        disabled={!canWriteClinical}
                      />
                      <Textarea
                        label="Notes d'alerta"
                        value={form.alertNotes}
                        onChange={(e) => setForm({ ...form, alertNotes: e.target.value })}
                        disabled={!canWriteClinical}
                      />
                    </div>
                  ) : (
                    <Alert tone="info">
                      El rol actual només visualitza l'indicador de risc clínic sense detall diagnòstic (RGPD Art. 9).
                    </Alert>
                  )}
                </Card>

                <PermissionGate me={me} permission="patients:write">
                  <div className="lg:col-span-2">
                    <Button type="submit" loading={updatePatientMutation.isPending}>
                      <Save className="h-4 w-4" />
                      Desar fitxa
                    </Button>
                  </div>
                </PermissionGate>
              </form>
            ),
          },
          {
            id: "history",
            label: "Historial Clínic",
            badge: recordsQuery.data?.records.length,
            content: (
              <FeatureGate me={me} feature="clinical_history">
                {!canReadClinical ? (
                  <Alert tone="warning" title="Accés restringit">
                    Només el personal facultatiu pot consultar les evolucions clíniques detallades.
                  </Alert>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                      {recordsQuery.isLoading ? (
                        <Skeleton className="h-40 w-full" />
                      ) : (recordsQuery.data?.records.length ?? 0) === 0 ? (
                        <Alert tone="neutral">Sense evolucions registrades encara.</Alert>
                      ) : (
                        <ClinicalHistoryTimeline
                          entries={(recordsQuery.data?.records ?? []).map((r) => ({
                            id: r.id,
                            entryType: r.entry_type,
                            content: r.content,
                            doctorName: r.doctor_name,
                            createdAt: new Date(r.created_at).toLocaleString("es-ES"),
                            amendsEntryId: r.amends_entry_id,
                          }))}
                        />
                      )}
                    </div>

                    <PermissionGate me={me} permission="clinical:write">
                      <Card title="Nova evolució (immutable)" description="Registre append-only auditable">
                        <form
                          className="space-y-3"
                          onSubmit={(e: FormEvent) => {
                            e.preventDefault();
                            createRecordMutation.mutate();
                          }}
                        >
                          <Select
                            label="Tipus d'entrada"
                            value={entryType}
                            onChange={(v) => setEntryType(v as ClinicalRecord["entry_type"])}
                            placeholder=""
                            options={[
                              { value: "NOTE", label: "Nota clínica" },
                              { value: "DIAGNOSIS", label: "Diagnòstic" },
                              { value: "PROCEDURE", label: "Procediment executat" },
                              { value: "PRESCRIPTION", label: "Prescripció" },
                            ]}
                          />
                          <Textarea
                            label="Descripció clínica"
                            value={entryContent}
                            onChange={(e) => setEntryContent(e.target.value)}
                            placeholder="Motiu, troballes, anestèsia, recomanacions…"
                            required
                          />
                          {(recordsQuery.data?.records.length ?? 0) > 0 ? (
                            <Select
                              label="Esmena / Addenda a (opcional)"
                              value={amendsEntryId}
                              onChange={setAmendsEntryId}
                              placeholder="Nova entrada independent"
                              options={(recordsQuery.data?.records ?? []).map((r) => ({
                                value: r.id,
                                label: `${r.entry_type} · ${r.content.slice(0, 32)}`,
                              }))}
                            />
                          ) : null}
                          <Button type="submit" loading={createRecordMutation.isPending} className="w-full">
                            Signar i desar
                          </Button>
                        </form>
                      </Card>
                    </PermissionGate>
                  </div>
                )}
              </FeatureGate>
            ),
          },
          {
            id: "odontogram",
            label: "Odontograma",
            content: (
              <FeatureGate me={me} feature="odontogram">
                {!canReadClinical ? (
                  <Alert tone="warning" title="Accés restringit">
                    Només el personal facultatiu pot consultar l'odontograma detallat.
                  </Alert>
                ) : (
                  <Card
                    title="Odontograma interactiu (FDI / ISO 3950)"
                    description={currentOdo ? `Versió ${currentOdo.version} · Actualitzat ${new Date(currentOdo.updated_at).toLocaleString("es-ES")}` : "Sense registre guardat encara"}
                    footer={
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {(["CURRENT", "INITIAL", "HISTORICAL"] as const).map((t) => (
                            <Button
                              key={t}
                              size="sm"
                              variant={odoType === t ? "secondary" : "outline"}
                              onClick={() => setOdoType(t)}
                            >
                              {t === "CURRENT" ? "Estat Actual" : t === "INITIAL" ? "Estat Inicial" : "Històric"}
                            </Button>
                          ))}
                        </div>
                        <PermissionGate me={me} permission="clinical:write">
                          <Button
                            onClick={() => saveOdontogramMutation.mutate()}
                            loading={saveOdontogramMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                            Desar odontograma
                          </Button>
                        </PermissionGate>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <OdontogramGrid
                        teeth={teeth}
                        dentition={odontogramDentition}
                        onDentitionChange={setOdontogramDentition}
                        activeTool={odontogramTool}
                        onToolChange={setOdontogramTool}
                        selectedTooth={selectedTooth}
                        onSelectTooth={setSelectedTooth}
                        onToggleSurface={handleToggleSurface}
                      />
                      {selectedTooth ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                          <span className="font-semibold text-slate-800">Peça seleccionada: {selectedTooth}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(["present", "crown", "implant", "missing"] as const).map((st) => (
                              <Button
                                key={st}
                                size="sm"
                                variant={(teeth[selectedTooth]?.general_status ?? "present") === st ? "primary" : "outline"}
                                onClick={() => setToothGeneralStatus(selectedTooth, st)}
                              >
                                {st === "present" ? "Normal" : st === "crown" ? "Corona" : st === "implant" ? "Implant" : "Absent"}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                )}
              </FeatureGate>
            ),
          },
        ]}
      />
    </div>
  );
}
