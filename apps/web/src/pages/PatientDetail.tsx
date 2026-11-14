import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  Lock,
  Plus,
  Receipt,
  Save,
  Sparkles,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ClinicalHistoryTimeline,
  CriticalAlertBanner,
  FeatureGate,
  Input,
  InvoiceLineEditor,
  Modal,
  OdontogramGrid,
  PermissionGate,
  QRVerifierBlock,
  Select,
  Skeleton,
  Switch,
  Textarea,
  ToothAnatomicalViewer,
  cn,
  emptyTooth,
  formatMoney,
  getFdiToothInfo,
  useToast,
  type InvoiceLineItem,
  type ToothState,
  type ToothSurfaceName,
  type ToothSurfaceStatus,
} from "@dentistes/ui";
import { can, type ClinicalRecord, type Odontogram, type PatientInvoice } from "@dentistes/sdk";
import { useSession } from "../lib/session";
import { useUiStore } from "../lib/store";

export function PatientDetailPage() {
  const { id = "" } = useParams();
  const { sdk, me } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  // Default view is the unified single-screen Clinical Cockpit (Odontogram + Clinical History)
  const [activeTab, setActiveTab] = useState<"clinical" | "overview" | "billing">("clinical");
  const [filterBySelectedTooth, setFilterBySelectedTooth] = useState(false);
  const [linkRecordToTooth, setLinkRecordToTooth] = useState(true);
  const [anatomicalModalOpen, setAnatomicalModalOpen] = useState(false);

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

  const invoicesQuery = useQuery({
    queryKey: ["patient-invoices", id],
    queryFn: () => sdk.listPatientInvoices(id),
    enabled: Boolean(id && me?.features?.billing_pdf),
  });

  // Clinical billing & estimate state (F6)
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineItem[]>([]);
  const [invoiceSeries, setInvoiceSeries] = useState("FAC");
  const [payingInvoice, setPayingInvoice] = useState<PatientInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

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

  // Odontogram state (F1)
  const [odoType, setOdoType] = useState<Odontogram["type"]>("CURRENT");
  const [teeth, setTeeth] = useState<Record<number, ToothState>>({});
  const [selectedTooth, setSelectedTooth] = useState<number | undefined>(16);
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

  // Clinical record form (F3)
  const [entryType, setEntryType] = useState<ClinicalRecord["entry_type"]>("PROCEDURE");
  const [entryContent, setEntryContent] = useState("");
  const [amendsEntryId, setAmendsEntryId] = useState("");

  const createRecordMutation = useMutation({
    mutationFn: () => {
      const trimmed = entryContent.trim();
      const finalContent =
        selectedTooth && linkRecordToTooth && !trimmed.includes(`Pieza ${selectedTooth}`)
          ? `[Pieza ${selectedTooth}] ${trimmed}`
          : trimmed;
      return sdk.createClinicalRecord(id, {
        entry_type: entryType,
        content: finalContent,
        amends_entry_id: amendsEntryId || undefined,
      });
    },
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

  // Import pathologies from current odontogram to estimate/invoice (F1 -> F6 link)
  function importFromOdontogram() {
    const newItems: InvoiceLineItem[] = [];
    for (const [toothStr, t] of Object.entries(teeth)) {
      const toothNum = Number(toothStr);
      const hasCaries = Object.values(t.surfaces || {}).some((s) => s === "caries");
      const hasPlanned = Object.values(t.surfaces || {}).some((s) => s === "planned");
      if (hasCaries || hasPlanned) {
        newItems.push({
          id: `imp-${toothNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: `Obturación / Tratamiento pieza ${toothNum}`,
          toothNumber: String(toothNum),
          quantity: 1,
          unitPriceCents: 6000,
          taxRatePercent: 0,
        });
      } else if (t.general_status === "missing") {
        newItems.push({
          id: `imp-${toothNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: `Extracción / Prótesis pieza ${toothNum}`,
          toothNumber: String(toothNum),
          quantity: 1,
          unitPriceCents: 5000,
          taxRatePercent: 0,
        });
      }
    }
    if (newItems.length === 0) {
      notify({
        tone: "info",
        title: "Sin hallazgos pendientes",
        description: "No se han detectado piezas con caries o tratamientos planificados en el odontograma actual.",
      });
      return;
    }
    setInvoiceLines((prev) => [...prev, ...newItems]);
    setActiveTab("billing");
    notify({
      tone: "success",
      title: "Tratamientos importados",
      description: `Se han añadido ${newItems.length} partida(s) desde el odontograma al presupuesto.`,
    });
  }

  const createInvoiceMutation = useMutation({
    mutationFn: () =>
      sdk.createPatientInvoice(id, {
        series: invoiceSeries,
        items: invoiceLines.map((l) => ({
          id: l.id,
          description: l.description,
          tooth_number: l.toothNumber,
          quantity: l.quantity,
          unit_price_cents: l.unitPriceCents,
          tax_rate_percent: l.taxRatePercent,
        })),
      }),
    onSuccess: async () => {
      setInvoiceLines([]);
      notify({ tone: "success", title: "Presupuesto / Factura generada con éxito" });
      await queryClient.invalidateQueries({ queryKey: ["patient-invoices", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo generar la factura",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (invId: string) =>
      sdk.recordInvoicePayment(invId, {
        amount: Number(paymentAmount) || 0,
        payment_method: paymentMethod,
      }),
    onSuccess: async () => {
      setPayingInvoice(null);
      setPaymentAmount("");
      notify({ tone: "success", title: "Cobro registrado correctamente" });
      await queryClient.invalidateQueries({ queryKey: ["patient-invoices", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo registrar el cobro",
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

  // Count clinical history entries by tooth number
  const historyCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    const records = recordsQuery.data?.records ?? [];
    for (const r of records) {
      const matches = r.content.match(/\b(?:pieza|diente|peça)?\s*#?([1-4][1-8]|[5-8][1-5])\b/gi);
      if (matches) {
        for (const m of matches) {
          const numMatch = m.match(/([1-4][1-8]|[5-8][1-5])/);
          if (numMatch) {
            const num = Number(numMatch[1]);
            counts[num] = (counts[num] ?? 0) + 1;
          }
        }
      }
    }
    return counts;
  }, [recordsQuery.data?.records]);

  const allRecords = recordsQuery.data?.records ?? [];

  // Filtered clinical records when filtering by selected tooth
  const displayedRecords = useMemo(() => {
    if (!filterBySelectedTooth || !selectedTooth) return allRecords;
    const pattern = new RegExp(`\\b(?:pieza|diente|peça)?\\s*#?${selectedTooth}\\b`, "i");
    return allRecords.filter((r) => pattern.test(r.content));
  }, [allRecords, filterBySelectedTooth, selectedTooth]);

  const selectedToothRecordCount = useMemo(() => {
    if (!selectedTooth) return 0;
    return historyCounts[selectedTooth] ?? 0;
  }, [historyCounts, selectedTooth]);

  if (patientQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-[520px] w-full rounded-xl" />
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

  const activeToothNum = selectedTooth ?? 16;
  const activeToothState = teeth[activeToothNum] ?? emptyTooth(activeToothNum);
  const activeToothInfo = getFdiToothInfo(activeToothNum);

  const surfaceCycle: ToothSurfaceStatus[] = ["healthy", "caries", "restored", "planned"];
  const surfaceShortLabels: Array<{ key: ToothSurfaceName; short: string; label: string }> = [
    { key: "occlusal", short: "O", label: "Oclusal / Incisal" },
    { key: "mesial", short: "M", label: "Mesial" },
    { key: "distal", short: "D", label: "Distal" },
    { key: "vestibular", short: "V", label: "Vestibular" },
    { key: "lingual", short: activeToothInfo.arch === "upper" ? "P" : "L", label: activeToothInfo.arch === "upper" ? "Palatino" : "Lingual" },
  ];

  const surfaceToneClass: Record<ToothSurfaceStatus, string> = {
    healthy: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
    caries: "border-red-600 bg-red-600 text-white font-bold",
    restored: "border-blue-600 bg-blue-600 text-white font-bold",
    planned: "border-emerald-600 bg-emerald-600 text-white font-bold",
    missing: "border-slate-500 bg-slate-500 text-white",
  };

  return (
    <div className="flex flex-col gap-2 lg:h-[calc(100vh-4.25rem)] lg:overflow-hidden">
      {/* Compact Patient Workstation Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs shrink-0">
        {/* Left: Back Navigation + Patient Identity */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <Link
              to="/agenda"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-slate-700 hover:bg-white hover:text-brand-700"
              title="Volver a la Agenda"
            >
              <Calendar className="h-3.5 w-3.5 text-brand-700" />
              <span>Agenda</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              to="/patients"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-white hover:text-slate-900"
              title="Directorio de pacientes"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Pacientes</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              {patient.last_name}, {patient.first_name}
            </h1>
            <span className="hidden sm:inline text-xs tabular-nums text-slate-500">
              Tel: {patient.phone} · Nac: {patient.birth_date}
            </span>
            <Badge tone={patient.whatsapp_opt_in ? "success" : "neutral"} className="px-2 py-0 text-[10px]">
              {patient.whatsapp_opt_in ? "WhatsApp OK" : "Sin WhatsApp"}
            </Badge>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs (Default: Vista Clínica Odontograma + Historia) */}
        <div
          role="tablist"
          aria-label="Vistas de la ficha del paciente"
          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "clinical"}
            onClick={() => setActiveTab("clinical")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition",
              activeTab === "clinical"
                ? "bg-white text-brand-950 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Stethoscope className="h-3.5 w-3.5 text-brand-700" />
            <span>Odontograma + Historia</span>
            <span className="rounded-full bg-brand-100 px-1.5 py-0 text-[10px] font-bold text-brand-800">
              {allRecords.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition",
              activeTab === "overview"
                ? "bg-white text-brand-950 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <User className="h-3.5 w-3.5" />
            <span>Datos y Alertas</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "billing"}
            onClick={() => setActiveTab("billing")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition",
              activeTab === "billing"
                ? "bg-white text-brand-950 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Presupuestos</span>
            {invoicesQuery.data?.invoices.length ? (
              <span className="rounded-full bg-slate-200 px-1.5 py-0 text-[10px] font-bold text-slate-700">
                {invoicesQuery.data.invoices.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Right: Quick Actions for Odontogram */}
        {activeTab === "clinical" && canReadClinical ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(["CURRENT", "INITIAL", "HISTORICAL"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOdoType(t)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition",
                    odoType === t ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {t === "CURRENT" ? "Actual" : t === "INITIAL" ? "Inicial" : "Histórico"}
                </button>
              ))}
            </div>

            <PermissionGate me={me} permission="clinical:write">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[30px] px-2.5 py-1 text-xs"
                title="Importar hallazgos del odontograma a un nuevo presupuesto"
                onClick={importFromOdontogram}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Presupuestar hallazgos</span>
              </Button>
              <Button
                size="sm"
                className="min-h-[30px] px-3 py-1 text-xs"
                onClick={() => saveOdontogramMutation.mutate()}
                loading={saveOdontogramMutation.isPending}
              >
                <Save className="h-3.5 w-3.5" />
                Guardar odontograma
              </Button>
            </PermissionGate>
          </div>
        ) : null}
      </div>

      {/* Compact 1-Line Medical Alert Strip (if patient has alerts) */}
      <div className="shrink-0">
        <CriticalAlertBanner
          alerts={patient.medical_alerts}
          summaryText={patient.medical_alerts?.summary}
          hideDetails={!canReadClinical}
          compact={true}
        />
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      {activeTab === "clinical" ? (
        /* DEFAULT VIEW: UNIFIED SINGLE-SCREEN ODONTOGRAM + CLINICAL HISTORY COCKPIT (NO SCROLL) */
        <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-12">
          {/* LEFT PANE (7 cols): Interactive Compact Odontogram + Inline Active Piece Inspector */}
          <div className="lg:col-span-7 flex flex-col min-h-0 justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs overflow-y-auto">
            <FeatureGate me={me} feature="odontogram">
              {!canReadClinical ? (
                <Alert tone="warning" title="Acceso restringido">
                  Solo el personal facultativo puede consultar el odontograma detallado.
                </Alert>
              ) : (
                <div className="flex flex-col h-full justify-between gap-2">
                  {/* Compact Odontogram Header + Interactive Grid */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        Odontograma interactivo (FDI / ISO 3950)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {currentOdo
                          ? `v${currentOdo.version} · ${new Date(currentOdo.updated_at).toLocaleDateString("es-ES")}`
                          : "Sin guardar"}
                      </span>
                    </div>

                    <OdontogramGrid
                      teeth={teeth}
                      compact={true}
                      dentition={odontogramDentition}
                      onDentitionChange={setOdontogramDentition}
                      activeTool={odontogramTool}
                      onToolChange={setOdontogramTool}
                      selectedTooth={activeToothNum}
                      onSelectTooth={(num) => setSelectedTooth(num)}
                      onToggleSurface={handleToggleSurface}
                      onSetGeneralStatus={setToothGeneralStatus}
                      historyCounts={historyCounts}
                    />
                  </div>

                  {/* Inline Compact Piece Inspector Bar (No Page Scroll Required) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-xs font-extrabold tabular-nums text-white shadow-2xs">
                          {activeToothNum}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{activeToothInfo.name}</span>
                            <span className="rounded bg-slate-200/80 px-1.5 py-0 text-[10px] font-semibold text-slate-700">
                              Q{activeToothInfo.quadrant}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick 5-Surface Toggles + Macro Presets + 3-Angle Viewer Button */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 mr-0.5">Caras:</span>
                        {surfaceShortLabels.map((s) => {
                          const currentSt = activeToothState.surfaces[s.key] ?? "healthy";
                          return (
                            <button
                              key={s.key}
                              type="button"
                              disabled={!canWriteClinical || activeToothState.general_status === "missing"}
                              onClick={() => {
                                const targetTool: ToothSurfaceStatus =
                                  odontogramTool === "caries" ||
                                  odontogramTool === "restored" ||
                                  odontogramTool === "planned"
                                    ? odontogramTool
                                    : surfaceCycle[(surfaceCycle.indexOf(currentSt) + 1) % surfaceCycle.length];
                                const next = currentSt === targetTool ? "healthy" : targetTool;
                                handleToggleSurface(activeToothNum, s.key, next);
                              }}
                              title={`${s.label}: ${currentSt}`}
                              className={cn(
                                "h-6 w-6 rounded border text-[11px] tabular-nums transition",
                                surfaceToneClass[currentSt],
                              )}
                            >
                              {s.short}
                            </button>
                          );
                        })}

                        <span className="mx-1 h-4 w-px bg-slate-200" />
                        <button
                          type="button"
                          disabled={!canWriteClinical}
                          onClick={() => {
                            const st: ToothSurfaceStatus =
                              odontogramTool === "caries" || odontogramTool === "planned" ? odontogramTool : "restored";
                            handleToggleSurface(activeToothNum, "mesial", st);
                            handleToggleSurface(activeToothNum, "occlusal", st);
                            handleToggleSurface(activeToothNum, "distal", st);
                          }}
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                          title="Aplicar en Mesial, Oclusal y Distal"
                        >
                          MOD
                        </button>
                        <button
                          type="button"
                          disabled={!canWriteClinical}
                          onClick={() => {
                            (["occlusal", "mesial", "distal", "vestibular", "lingual"] as ToothSurfaceName[]).forEach(
                              (surf) => handleToggleSurface(activeToothNum, surf, "healthy"),
                            );
                            setToothGeneralStatus(activeToothNum, "present");
                          }}
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"
                          title="Limpiar pieza a estado sano"
                        >
                          Limpia
                        </button>

                        <button
                          type="button"
                          onClick={() => setAnatomicalModalOpen(true)}
                          className="ml-1 inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800 hover:bg-brand-100"
                        >
                          <Eye className="h-3 w-3" />
                          Visor 3D
                        </button>
                      </div>
                    </div>

                    {/* Row 2 of Piece Inspector: General Status Pills + Inline Tooth Note */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {(
                          [
                            ["present", "Sano"],
                            ["endodontics", "Endodoncia"],
                            ["crown", "Corona"],
                            ["implant", "Implante"],
                            ["missing", "Ausente"],
                          ] as const
                        ).map(([st, label]) => (
                          <button
                            key={st}
                            type="button"
                            disabled={!canWriteClinical}
                            onClick={() => setToothGeneralStatus(activeToothNum, st)}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-medium transition",
                              (activeToothState.general_status ?? "present") === st
                                ? "border-brand-600 bg-brand-600 text-white font-semibold"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        disabled={!canWriteClinical}
                        value={activeToothState.notes ?? ""}
                        onChange={(e) => {
                          const notes = e.target.value;
                          setTeeth((prev) => {
                            const base = prev[activeToothNum] ?? emptyTooth(activeToothNum);
                            return { ...prev, [activeToothNum]: { ...base, notes } };
                          });
                        }}
                        placeholder={`Nota rápida pieza ${activeToothNum} (sensibilidad, bolsa…)`}
                        className="h-7 flex-1 min-w-[180px] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </FeatureGate>
          </div>

          {/* RIGHT PANE (5 cols): Integrated Clinical History + Pinned Quick Evolution Composer */}
          <div className="lg:col-span-5 flex flex-col min-h-0 justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs overflow-hidden">
            <FeatureGate me={me} feature="clinical_history">
              {!canReadClinical ? (
                <Alert tone="warning" title="Acceso restringido">
                  Solo el personal facultativo puede consultar las evoluciones clínicas detalladas.
                </Alert>
              ) : (
                <div className="flex flex-col h-full min-h-0 justify-between">
                  {/* Top Bar of Clinical History Pane: Title + Tooth Filter Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-brand-700" />
                      <h2 className="text-sm font-bold text-slate-900">Historial Clínico</h2>
                      <Badge tone="neutral" className="px-1.5 py-0 text-[10px]">
                        {displayedRecords.length}
                      </Badge>
                    </div>

                    {/* Filter Toggle: All History vs Active Tooth History */}
                    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setFilterBySelectedTooth(false)}
                        className={cn(
                          "rounded px-2 py-0.5 font-medium transition",
                          !filterBySelectedTooth
                            ? "bg-white text-slate-900 font-semibold shadow-2xs"
                            : "text-slate-600 hover:text-slate-900",
                        )}
                      >
                        Todas ({allRecords.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterBySelectedTooth(true)}
                        className={cn(
                          "rounded px-2 py-0.5 font-medium transition",
                          filterBySelectedTooth
                            ? "bg-brand-600 text-white font-semibold shadow-2xs"
                            : "text-slate-600 hover:text-slate-900",
                        )}
                      >
                        Pieza #{activeToothNum} ({selectedToothRecordCount})
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Internal Timeline (Page itself never scrolls!) */}
                  <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-1">
                    {recordsQuery.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : displayedRecords.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[140px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">
                          {filterBySelectedTooth
                            ? `Sin evoluciones previas en la pieza ${activeToothNum}`
                            : "Sin evoluciones registradas todavía"}
                        </p>
                        <p className="mt-0.5 text-[11px]">
                          Registra la primera entrada en el formulario inferior.
                        </p>
                      </div>
                    ) : (
                      <ClinicalHistoryTimeline
                        compact={true}
                        selectedTooth={activeToothNum}
                        onSelectTooth={(tNum) => setSelectedTooth(tNum)}
                        entries={displayedRecords.map((r) => ({
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

                  {/* Pinned Quick Evolution Composer (Always visible at bottom of right pane) */}
                  <PermissionGate me={me} permission="clinical:write">
                    <form
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        if (!entryContent.trim()) return;
                        createRecordMutation.mutate();
                      }}
                      className="shrink-0 space-y-2 border-t border-slate-200 bg-slate-50/90 pt-2.5 -mx-3 -mb-3 px-3 pb-3 rounded-b-xl"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <select
                            aria-label="Tipo de entrada"
                            value={entryType}
                            onChange={(e) => setEntryType(e.target.value as ClinicalRecord["entry_type"])}
                            className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                          >
                            <option value="PROCEDURE">Procedimiento</option>
                            <option value="DIAGNOSIS">Diagnóstico</option>
                            <option value="NOTE">Nota clínica</option>
                            <option value="PRESCRIPTION">Prescripción</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setLinkRecordToTooth((v) => !v)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition",
                              linkRecordToTooth
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
                            )}
                            title="Vincular automáticamente esta evolución a la pieza seleccionada en el odontograma"
                          >
                            <span>{linkRecordToTooth ? `✓ Pieza #${activeToothNum}` : `+ Pieza #${activeToothNum}`}</span>
                          </button>
                        </div>

                        {allRecords.length > 0 ? (
                          <select
                            aria-label="Enmienda / Addenda a (opcional)"
                            value={amendsEntryId}
                            onChange={(e) => setAmendsEntryId(e.target.value)}
                            className="h-7 max-w-[155px] truncate rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-600"
                          >
                            <option value="">Entrada nueva</option>
                            {allRecords.map((r) => (
                              <option key={r.id} value={r.id}>
                                Addenda: {r.content.slice(0, 24)}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          aria-label="Descripción clínica"
                          value={entryContent}
                          onChange={(e) => setEntryContent(e.target.value)}
                          placeholder={
                            linkRecordToTooth
                              ? `Registrar evolución para [Pieza ${activeToothNum}] (hallazgos, anestesia, obturación…)`
                              : "Motivo, hallazgos, anestesia, recomendaciones…"
                          }
                          required
                          className="w-full flex-1 rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          loading={createRecordMutation.isPending}
                          className="shrink-0 self-end min-h-[48px] px-3 text-xs font-semibold"
                        >
                          Firmar y guardar
                        </Button>
                      </div>
                    </form>
                  </PermissionGate>
                </div>
              )}
            </FeatureGate>
          </div>
        </div>
      ) : activeTab === "overview" ? (
        /* VIEW 2: DATOS DE CONTACTO Y ALERTAS MÉDICAS CRÍTICAS */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <form
            className="grid gap-4 lg:grid-cols-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              updatePatientMutation.mutate();
            }}
          >
            <Card title="Datos de contacto">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Nombre"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                  />
                  <Input
                    label="Apellidos"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                    required
                  />
                  <Input
                    label="DNI / NIE"
                    value={form.dni_nie}
                    onChange={(e) => setForm({ ...form, dni_nie: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Teléfono"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <Switch
                  label="Consentimiento explícito WhatsApp (Opt-in)"
                  checked={form.whatsapp_opt_in}
                  onChange={(checked) => setForm({ ...form, whatsapp_opt_in: checked })}
                />
              </div>
            </Card>

            <Card
              title="Alertas Médicas Críticas"
              description={
                canReadClinical
                  ? "Visibles permanentemente en la cabecera de la ficha"
                  : "Acceso restringido al personal facultativo"
              }
            >
              {canReadClinical ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4">
                    <Switch
                      label="Riesgo alto"
                      checked={form.high_risk}
                      onChange={(v) => setForm({ ...form, high_risk: v })}
                      disabled={!canWriteClinical}
                    />
                    <Switch
                      label="Profilaxis antibiótica"
                      checked={form.prophylaxis}
                      onChange={(v) => setForm({ ...form, prophylaxis: v })}
                      disabled={!canWriteClinical}
                    />
                  </div>
                  <Input
                    label="Alergias (separadas por comas)"
                    value={form.allergiesText}
                    onChange={(e) => setForm({ ...form, allergiesText: e.target.value })}
                    placeholder="Penicilina, Látex"
                    disabled={!canWriteClinical}
                  />
                  <Input
                    label="Patologías / Antecedentes (separados por comas)"
                    value={form.conditionsText}
                    onChange={(e) => setForm({ ...form, conditionsText: e.target.value })}
                    placeholder="Hipertensión, Anticoagulados"
                    disabled={!canWriteClinical}
                  />
                  <Input
                    label="Medicación crónica"
                    value={form.medicationsText}
                    onChange={(e) => setForm({ ...form, medicationsText: e.target.value })}
                    placeholder="Sintrom 4mg"
                    disabled={!canWriteClinical}
                  />
                  <Textarea
                    label="Notas de alerta clínica"
                    value={form.alertNotes}
                    onChange={(e) => setForm({ ...form, alertNotes: e.target.value })}
                    disabled={!canWriteClinical}
                  />
                </div>
              ) : (
                <Alert tone="info">
                  El rol actual solo visualiza el indicador de riesgo clínico sin detalle diagnóstico (RGPD Art. 9).
                </Alert>
              )}
            </Card>

            <PermissionGate me={me} permission="patients:write">
              <div className="lg:col-span-2">
                <Button type="submit" loading={updatePatientMutation.isPending}>
                  <Save className="h-4 w-4" />
                  Guardar ficha
                </Button>
              </div>
            </PermissionGate>
          </form>
        </div>
      ) : (
        /* VIEW 3: PRESUPUESTOS Y FACTURACIÓN */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <FeatureGate me={me} feature="billing_pdf">
            <div className="space-y-4">
              <PermissionGate me={me} permission="billing:write">
                <Card
                  title="Nuevo presupuesto o factura"
                  description="Añade conceptos o importa automáticamente los tratamientos desde el odontograma"
                  footer={
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button variant="outline" size="sm" onClick={importFromOdontogram}>
                        <Sparkles className="h-4 w-4" />
                        Importar hallazgos del odontograma
                      </Button>
                      <Button
                        onClick={() => createInvoiceMutation.mutate()}
                        loading={createInvoiceMutation.isPending}
                        disabled={invoiceLines.length === 0}
                      >
                        <Receipt className="h-4 w-4" />
                        Emitir documento
                      </Button>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="w-32">
                        <Input
                          label="Serie"
                          value={invoiceSeries}
                          onChange={(e) => setInvoiceSeries(e.target.value.toUpperCase())}
                          placeholder="FAC"
                        />
                      </div>
                    </div>

                    <InvoiceLineEditor lines={invoiceLines} currency="USD" onChange={setInvoiceLines} />
                  </div>
                </Card>
              </PermissionGate>

              <Card
                title="Historial de facturas y presupuestos emitidos"
                description="Comprobantes sanitarios con código QR de verificación"
              >
                {invoicesQuery.isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (invoicesQuery.data?.invoices.length ?? 0) === 0 ? (
                  <Alert tone="neutral">
                    No hay facturas ni presupuestos emitidos para este paciente todavía.
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {(invoicesQuery.data?.invoices ?? []).map((inv) => {
                      const isPending = inv.paid_amount < inv.total_amount;
                      return (
                        <div
                          key={inv.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                  {inv.series}-{inv.invoice_number}
                                </span>
                                <Badge
                                  tone={
                                    inv.status === "PAID"
                                      ? "success"
                                      : inv.status === "PARTIAL"
                                      ? "warning"
                                      : "neutral"
                                  }
                                >
                                  {inv.status === "PAID"
                                    ? "Cobrado"
                                    : inv.status === "PARTIAL"
                                    ? "Pago parcial"
                                    : "Pendiente de cobro"}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Emitida: {new Date(inv.issue_date).toLocaleString("es-ES")}
                              </p>
                            </div>

                            <div className="text-right tabular-nums">
                              <p className="text-sm font-bold text-slate-900">
                                Total: {formatMoney(inv.total_amount, "USD")}
                              </p>
                              <p className="text-xs text-slate-500">
                                Pagado: {formatMoney(inv.paid_amount, "USD")}
                              </p>
                            </div>
                          </div>

                          <QRVerifierBlock
                            documentNumber={`${inv.series}-${inv.invoice_number}`}
                            verificationHash={inv.verification_hash || inv.id}
                            onDownloadPdf={() => window.print()}
                          />

                          {isPending ? (
                            <PermissionGate me={me} permission="billing:write">
                              {payingInvoice?.id === inv.id ? (
                                <form
                                  className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                  onSubmit={(e: FormEvent) => {
                                    e.preventDefault();
                                    recordPaymentMutation.mutate(inv.id);
                                  }}
                                >
                                  <div className="w-40">
                                    <Input
                                      label="Importe (céntimos)"
                                      type="number"
                                      min={1}
                                      max={inv.total_amount - inv.paid_amount}
                                      value={paymentAmount}
                                      onChange={(e) => setPaymentAmount(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="w-44">
                                    <Select
                                      label="Método de pago"
                                      value={paymentMethod}
                                      onChange={setPaymentMethod}
                                      placeholder=""
                                      options={[
                                        { value: "CASH", label: "Efectivo" },
                                        { value: "CARD", label: "Tarjeta / TPV" },
                                        { value: "TRANSFER", label: "Transferencia" },
                                      ]}
                                    />
                                  </div>
                                  <Button type="submit" size="sm" loading={recordPaymentMutation.isPending}>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Confirmar cobro
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPayingInvoice(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </form>
                              ) : (
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setPayingInvoice(inv);
                                      setPaymentAmount(String(inv.total_amount - inv.paid_amount));
                                    }}
                                  >
                                    Registrar cobro
                                  </Button>
                                </div>
                              )}
                            </PermissionGate>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </FeatureGate>
        </div>
      )}

      {/* Modal: Visor Anatómico Multi-Ángulo de la Pieza Seleccionada */}
      <Modal
        open={anatomicalModalOpen}
        onClose={() => setAnatomicalModalOpen(false)}
        title={`Pieza ${activeToothNum} · ${activeToothInfo.name}`}
        description={activeToothInfo.quadrantName}
      >
        <ToothAnatomicalViewer
          toothNumber={activeToothNum}
          toothState={activeToothState}
          activeTool={odontogramTool}
          canWriteClinical={canWriteClinical}
          onToggleSurface={(surf, next) => handleToggleSurface(activeToothNum, surf, next)}
          onUpdateGeneralStatus={(st) => setToothGeneralStatus(activeToothNum, st)}
        />
      </Modal>
    </div>
  );
}
