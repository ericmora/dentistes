import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
  BudgetPrintFormatDocument,
  Button,
  Card,
  ClinicalHistoryTimeline,
  CriticalAlertBanner,
  FeatureGate,
  Input,
  InvoiceLineEditor,
  Modal,
  OdontogramAutosaveUndoBar,
  OdontogramGrid,
  PatientBudgetCard,
  PermissionGate,
  QRVerifierBlock,
  Select,
  SelectedToothEvolutionAndHistoryPanel,
  Skeleton,
  Switch,
  Textarea,
  ToothAnatomicalViewer,
  buildSampleClinicalAttachment,
  cn,
  emptyTooth,
  formatMoney,
  getFdiToothInfo,
  pushOdontogramUndoEntry,
  useToast,
  type BudgetFindingBlockUI,
  type BudgetTreatmentOptionUI,
  type ClinicalAttachmentUI,
  type InvoiceLineItem,
  type OdontogramAutosaveStatus,
  type OdontogramDisplayMode,
  type OdontogramUndoEntry,
  type PatientBudgetUI,
  type ToothState,
  type ToothSurfaceName,
  type ToothSurfaceStatus,
} from "@dentistes/ui";
import { can, type ClinicalFinding, type ClinicalRecord, type FindingMaster, type Odontogram, type PatientInvoice } from "@dentistes/sdk";
import { useSession } from "../lib/session";
import { useUiStore } from "../lib/store";

export function PatientDetailPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { sdk, me } = useSession();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  // Tab support with query param: ?tab=clinical | overview | billing
  const [activeTab, setActiveTab] = useState<"clinical" | "overview" | "billing">(() => {
    const t = searchParams.get("tab");
    if (t === "overview" || t === "billing" || t === "clinical") {
      return t;
    }
    return "clinical";
  });

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "overview" || t === "billing" || t === "clinical") {
      setActiveTab(t);
    }
  }, [searchParams]);
  const [filterBySelectedTooth, setFilterBySelectedTooth] = useState(false);
  const [linkRecordToTooth, setLinkRecordToTooth] = useState(true);
  const [anatomicalModalOpen, setAnatomicalModalOpen] = useState(false);
  const [odontogramDisplayMode, setOdontogramDisplayMode] = useState<OdontogramDisplayMode>("surfaces");

  const {
    odontogramTool,
    setOdontogramTool,
    odontogramDentition,
    setOdontogramDentition,
    clinicBudgetSettings,
    setClinicBudgetSettings,
  } = useUiStore();

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
  const effectiveClinicSettings = clinicSettingsQuery.data ?? clinicBudgetSettings;

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

  const findingsQuery = useQuery({
    queryKey: ["patient-findings", id],
    queryFn: () => sdk.listPatientFindings(id),
    enabled: Boolean(id),
  });

  const budgetsQuery = useQuery({
    queryKey: ["patient-budgets", id],
    queryFn: () => sdk.listPatientBudgets(id),
    enabled: Boolean(id && me?.features?.billing_pdf),
  });

  const treatmentsCatalogQuery = useQuery({
    queryKey: ["treatments-catalog"],
    queryFn: () => sdk.listTreatments(),
    enabled: Boolean(me),
  });

  const findingsCatalogQuery = useQuery({
    queryKey: ["findings-catalog"],
    queryFn: () => sdk.listFindingsCatalog(),
    enabled: Boolean(me?.active_tenant.id),
  });
  const masterFindings = useMemo(
    () => (findingsCatalogQuery.data?.findings ?? []).filter((f) => f.is_active !== false),
    [findingsCatalogQuery.data?.findings],
  );

  // Clinical findings & multi-option budgets state (F7)
  const [newFindingTooth, setNewFindingTooth] = useState("26");
  const [selectedFindingCode, setSelectedFindingCode] = useState<string>("");
  const [newFindingDiagnosis, setNewFindingDiagnosis] = useState("Caries profunda con pulpitis");
  const [newFindingSeverity, setNewFindingSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("HIGH");
  const [newFindingNotes, setNewFindingNotes] = useState("");

  const [budgetTitle, setBudgetTitle] = useState("Plan de Tratamiento por Hallazgos");
  const [budgetSeries, setBudgetSeries] = useState(
    () => effectiveClinicSettings.budget_default_series || "PRE",
  );
  const [budgetValidityDays, setBudgetValidityDays] = useState(
    () => String(effectiveClinicSettings.budget_default_validity_days || 30),
  );
  const [budgetNotes, setBudgetNotes] = useState(
    () =>
      effectiveClinicSettings.budget_validity_terms ||
      "Presupuesto válido durante el periodo de vigencia indicado. El paciente puede elegir una de las alternativas propuestas para cada hallazgo.",
  );
  const [draftFindingBlocks, setDraftFindingBlocks] = useState<BudgetFindingBlockUI[]>([]);
  const [printingBudget, setPrintingBudget] = useState<PatientBudgetUI | null>(null);

  useEffect(() => {
    if (effectiveClinicSettings.budget_default_series) {
      setBudgetSeries(effectiveClinicSettings.budget_default_series);
    }
    if (effectiveClinicSettings.budget_default_validity_days) {
      setBudgetValidityDays(String(effectiveClinicSettings.budget_default_validity_days));
    }
    if (effectiveClinicSettings.budget_validity_terms) {
      setBudgetNotes(effectiveClinicSettings.budget_validity_terms);
    }
  }, [
    effectiveClinicSettings.budget_default_series,
    effectiveClinicSettings.budget_default_validity_days,
    effectiveClinicSettings.budget_validity_terms,
  ]);

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

  // Odontogram state (F1) with Autosave & Undo stack
  const [odoType, setOdoType] = useState<Odontogram["type"]>("CURRENT");
  const [teeth, setTeeth] = useState<Record<number, ToothState>>({});
  const teethRef = useRef<Record<number, ToothState>>({});
  const [selectedTooth, setSelectedTooth] = useState<number | undefined>(16);
  const [undoStack, setUndoStack] = useState<OdontogramUndoEntry[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState<OdontogramAutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(undefined);
  const latestVersionRef = useRef<number | undefined>(undefined);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncedOdoKeyRef = useRef<string>("");

  const currentOdo = odontogramQuery.data?.odontograms.find((o) => o.type === odoType);

  useEffect(() => {
    if (currentOdo?.version !== undefined) {
      latestVersionRef.current = currentOdo.version;
    }
    const syncKey = `${id}:${odoType}:${currentOdo ? "loaded" : "empty"}`;
    if (syncedOdoKeyRef.current === syncKey) {
      return;
    }
    syncedOdoKeyRef.current = syncKey;
    const raw = currentOdo?.teeth_data as Record<string, ToothState> | undefined;
    if (!raw) {
      teethRef.current = {};
      setTeeth({});
      setUndoStack([]);
      setAutosaveStatus("idle");
      return;
    }
    const parsed: Record<number, ToothState> = {};
    for (const [k, val] of Object.entries(raw)) {
      const num = Number(k);
      if (!Number.isNaN(num)) parsed[num] = val;
    }
    teethRef.current = parsed;
    setTeeth(parsed);
    setUndoStack([]);
    setAutosaveStatus("idle");
  }, [currentOdo, odoType, id]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const saveOdontogramMutation = useMutation({
    mutationFn: (vars?: { teethData?: Record<number, ToothState>; silent?: boolean }) =>
      sdk.saveOdontogram(id, odoType, {
        teeth_data: vars?.teethData ?? teethRef.current,
        version: latestVersionRef.current ?? currentOdo?.version,
      }),
    onSuccess: async (res, vars) => {
      if (res?.odontogram?.version !== undefined) {
        latestVersionRef.current = res.odontogram.version;
      }
      setAutosaveStatus("saved");
      setLastSavedAt(
        new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
      if (!vars?.silent) {
        notify({ tone: "success", title: "Odontograma guardado" });
      }
      await queryClient.invalidateQueries({ queryKey: ["patient-odontograms", id] });
    },
    onError: (err, vars) => {
      setAutosaveStatus("error");
      if (!vars?.silent) {
        notify({
          tone: "danger",
          title: "Error al guardar odontograma",
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
  });

  function scheduleOdontogramAutosave(nextTeeth: Record<number, ToothState>, delayMs = 250) {
    if (!canWriteClinical || !id) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    setAutosaveStatus("saving");
    autosaveTimerRef.current = setTimeout(() => {
      saveOdontogramMutation.mutate({ teethData: nextTeeth, silent: true });
    }, delayMs);
  }

  function applyOdontogramChange(
    label: string,
    updater: (prev: Record<number, ToothState>) => Record<number, ToothState>,
    delayMs = 250,
  ) {
    const prevSnapshot = teethRef.current;
    const next = updater(prevSnapshot);
    teethRef.current = next;
    setUndoStack((stack) => pushOdontogramUndoEntry(stack, prevSnapshot, label));
    setTeeth(next);
    scheduleOdontogramAutosave(next, delayMs);
  }

  function handleUndoOdontogram() {
    if (!canWriteClinical || undoStack.length === 0) return;
    const [latestUndo, ...remainingStack] = undoStack;
    teethRef.current = latestUndo.teeth;
    setUndoStack(remainingStack);
    setTeeth(latestUndo.teeth);
    scheduleOdontogramAutosave(latestUndo.teeth, 120);
  }

  // Keyboard shortcut Ctrl+Z / Cmd+Z for Odontogram Undo when in clinical tab
  useEffect(() => {
    if (activeTab !== "clinical" || !canWriteClinical) return;
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        if (undoStack.length > 0) {
          e.preventDefault();
          handleUndoOdontogram();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Clinical record form (F3) & Clinical History Attachments (Photos, X-rays, Documents)
  const [entryType, setEntryType] = useState<ClinicalRecord["entry_type"]>("PROCEDURE");
  const [entryContent, setEntryContent] = useState("");
  const [amendsEntryId, setAmendsEntryId] = useState("");
  const [draftAttachments, setDraftAttachments] = useState<ClinicalAttachmentUI[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<ClinicalAttachmentUI | null>(null);

  // Cancellation of a clinical finding requires a clinical note
  const [cancellingFindingId, setCancellingFindingId] = useState<string | null>(null);
  const [cancellationClinicalNote, setCancellationClinicalNote] = useState("");

  const createRecordMutation = useMutation({
    mutationFn: () => {
      const trimmed =
        entryContent.trim() ||
        (draftAttachments.length > 0
          ? `Adjunto clínico incorporado al historial: ${draftAttachments.map((a) => a.name).join(", ")}`
          : "");
      const finalContent =
        selectedTooth && linkRecordToTooth && !trimmed.includes(`Pieza ${selectedTooth}`)
          ? `[Pieza ${selectedTooth}] ${trimmed}`
          : trimmed;
      return sdk.createClinicalRecord(id, {
        entry_type: entryType,
        content: finalContent,
        amends_entry_id: amendsEntryId || undefined,
        attachments: draftAttachments.length > 0 ? draftAttachments : undefined,
      });
    },
    onSuccess: async () => {
      setEntryContent("");
      setAmendsEntryId("");
      setDraftAttachments([]);
      notify({ tone: "success", title: "Evolución clínica registrada en el historial" });
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

  const createFindingMutation = useMutation({
    mutationFn: (input: {
      tooth_number: string;
      surfaces?: string[];
      pathology_code?: string;
      diagnosis: string;
      severity?: "LOW" | "MEDIUM" | "HIGH";
      notes?: string;
    }) => sdk.createPatientFinding(id, input),
    onSuccess: async () => {
      setNewFindingNotes("");
      notify({
        tone: "success",
        title: "Hallazgo clínico registrado",
        description: "El hallazgo se ha añadido al historial clínico del paciente y al apartado de presupuestos.",
      });
      await queryClient.invalidateQueries({ queryKey: ["patient-findings", id] });
      await queryClient.invalidateQueries({ queryKey: ["patient-records", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo registrar el hallazgo",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const updateFindingStatusMutation = useMutation({
    mutationFn: (vars: { findingId: string; status: ClinicalFinding["status"]; notes?: string }) =>
      sdk.updateFindingStatus(vars.findingId, { status: vars.status, notes: vars.notes }),
    onSuccess: async (_, vars) => {
      setCancellingFindingId(null);
      setCancellationClinicalNote("");
      notify({
        tone: "success",
        title:
          vars.status === "DISCARDED"
            ? "Hallazgo cancelado con nota clínica"
            : "Estado del hallazgo actualizado",
        description:
          vars.status === "DISCARDED"
            ? "La nota clínica de cancelación se ha registrado en el historial del paciente."
            : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["patient-findings", id] });
      await queryClient.invalidateQueries({ queryKey: ["patient-records", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo actualizar el hallazgo",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: () =>
      sdk.createPatientBudget(id, {
        series: budgetSeries,
        title: budgetTitle,
        validity_days: Number(budgetValidityDays) || 30,
        notes: budgetNotes,
        findings_blocks: draftFindingBlocks,
      }),
    onSuccess: async () => {
      setDraftFindingBlocks([]);
      notify({
        tone: "success",
        title: "Presupuesto con alternativas emitido",
        description: "El cliente ya puede estudiar las opciones de tratamiento propuestas.",
      });
      await queryClient.invalidateQueries({ queryKey: ["patient-budgets", id] });
      await queryClient.invalidateQueries({ queryKey: ["patient-findings", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo emitir el presupuesto",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const respondBudgetOptionMutation = useMutation({
    mutationFn: (vars: {
      budgetId: string;
      findingId: string;
      optionId: string;
      response: "PENDING" | "ACCEPTED" | "REJECTED";
    }) =>
      sdk.updateBudgetOptionResponse(vars.budgetId, {
        finding_id: vars.findingId,
        option_id: vars.optionId,
        patient_response: vars.response,
      }),
    onSuccess: async (_, vars) => {
      notify({
        tone: "success",
        title:
          vars.response === "ACCEPTED"
            ? "Opción de tratamiento aceptada por el cliente"
            : vars.response === "REJECTED"
            ? "Tratamiento descartado (el hallazgo sigue abierto)"
            : "Opción marcada en estudio",
        description:
          vars.response === "REJECTED"
            ? "El hallazgo clínico permanece activo por si deseas proponer otro presupuesto más adelante."
            : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["patient-budgets", id] });
      await queryClient.invalidateQueries({ queryKey: ["patient-findings", id] });
    },
  });

  const updateBudgetStatusMutation = useMutation({
    mutationFn: (vars: { budgetId: string; status: PatientBudgetUI["status"]; validityDays?: number }) =>
      sdk.updateBudgetStatus(vars.budgetId, {
        status: vars.status,
        validity_days: vars.validityDays,
      }),
    onSuccess: async (_, vars) => {
      notify({
        tone: "success",
        title:
          vars.status === "REJECTED"
            ? "Presupuesto descartado · Hallazgos siguen abiertos"
            : "Presupuesto actualizado",
      });
      await queryClient.invalidateQueries({ queryKey: ["patient-budgets", id] });
      await queryClient.invalidateQueries({ queryKey: ["patient-findings", id] });
    },
  });

  const convertBudgetToInvoiceMutation = useMutation({
    mutationFn: (budgetId: string) => sdk.convertBudgetToInvoice(budgetId, { series: invoiceSeries || "FAC" }),
    onSuccess: async (res) => {
      notify({
        tone: "success",
        title: `Factura ${res.invoice.series}-${res.invoice.invoice_number} emitida`,
        description: "Los tratamientos aceptados se han facturado y el presupuesto ha quedado cerrado.",
      });
      await queryClient.invalidateQueries({ queryKey: ["patient-budgets", id] });
      await queryClient.invalidateQueries({ queryKey: ["patient-findings", id] });
      await queryClient.invalidateQueries({ queryKey: ["patient-invoices", id] });
    },
    onError: (err) => {
      notify({
        tone: "danger",
        title: "No se pudo facturar el presupuesto",
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  function addFindingProtocolToDraft(finding: {
    id: string;
    tooth_number: string;
    surfaces?: string[];
    pathology_code?: string;
    diagnosis: string;
    notes?: string;
  }) {
    const tooth = finding.tooth_number || "General";
    const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const treatments = treatmentsCatalogQuery.data?.treatments ?? [];

    // Buscar protocolo configurado en la tabla maestra
    let protocol = masterFindings.find(
      (m) => finding.pathology_code && m.code.toUpperCase() === finding.pathology_code.toUpperCase(),
    );
    if (!protocol) {
      protocol = masterFindings.find(
        (m) =>
          m.name.toLowerCase() === finding.diagnosis.toLowerCase() ||
          finding.diagnosis.toLowerCase().includes(m.name.toLowerCase()) ||
          m.name.toLowerCase().includes(finding.diagnosis.toLowerCase()),
      );
    }

    const items: Array<{
      id: string;
      treatment_code: string;
      description: string;
      tooth_number: string;
      quantity: number;
      unit_price_cents: number;
    }> = [];

    if (protocol && protocol.default_treatment_codes && protocol.default_treatment_codes.length > 0) {
      protocol.default_treatment_codes.forEach((trtCode, idx) => {
        const trt = treatments.find((t) => t.code === trtCode);
        const name = trt ? trt.name : trtCode;
        const priceCents = trt ? Math.round(trt.default_price * 100) : 6000;
        items.push({
          id: `it-${stamp}-${idx + 1}`,
          treatment_code: trtCode,
          description: `${name} (Pieza ${tooth})`,
          tooth_number: tooth,
          quantity: 1,
          unit_price_cents: priceCents,
        });
      });
    } else {
      // Tratamiento conservador de respaldo
      items.push({
        id: `it-${stamp}-1`,
        treatment_code: "OBTURACION_SIMPLE",
        description: `Obturación / Reconstrucción (Pieza ${tooth})`,
        tooth_number: tooth,
        quantity: 1,
        unit_price_cents: 6000,
      });
    }

    const totalCents = items.reduce((sum, it) => sum + it.unit_price_cents * it.quantity, 0);

    const newBlock: BudgetFindingBlockUI = {
      finding_id: finding.id,
      tooth_number: tooth,
      surfaces: finding.surfaces ?? [],
      diagnosis: finding.diagnosis,
      notes: finding.notes,
      options: [
        {
          id: `opt-${stamp}-1`,
          option_label: "Opción recomendada (Protocolo clínico)",
          name: protocol ? `Protocolo: ${protocol.name}` : `Tratamiento pieza ${tooth}`,
          description: protocol?.description || finding.diagnosis,
          is_recommended: true,
          total_cents: totalCents,
          patient_response: "PENDING",
          items,
        },
      ],
    };

    setDraftFindingBlocks((prev) => {
      const exists = prev.some((b) => b.finding_id === finding.id && finding.id !== "");
      if (exists) {
        return prev.map((b) => (b.finding_id === finding.id ? newBlock : b));
      }
      return [...prev, newBlock];
    });

    notify({
      tone: "success",
      title: `Protocolo asignado a Pieza #${tooth}`,
      description: `${items.length} tratamiento(s) añadidos al presupuesto según el protocolo clínico de la clínica.`,
    });
  }

  function addFindingSingleOptionToDraft(finding: {
    id: string;
    tooth_number: string;
    surfaces?: string[];
    diagnosis: string;
    notes?: string;
  }) {
    const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const newBlock: BudgetFindingBlockUI = {
      finding_id: finding.id,
      tooth_number: finding.tooth_number || "General",
      surfaces: finding.surfaces ?? [],
      diagnosis: finding.diagnosis,
      notes: finding.notes,
      options: [
        {
          id: `opt-${stamp}-1`,
          option_label: "Opción 1",
          name: `Tratamiento conservador pieza ${finding.tooth_number}`,
          description: finding.diagnosis,
          is_recommended: true,
          total_cents: 6000,
          patient_response: "PENDING",
          items: [
            {
              id: `it-${stamp}-1`,
              treatment_code: "OBTURACION_SIMPLE",
              description: `Obturación / Reconstrucción (Pieza ${finding.tooth_number})`,
              tooth_number: finding.tooth_number,
              quantity: 1,
              unit_price_cents: 6000,
            },
          ],
        },
      ],
    };
    setDraftFindingBlocks((prev) => [...prev, newBlock]);
  }

  // Import pathologies from current odontogram to findings & multi-option budget (F1 -> F7 link)
  function importFromOdontogram() {
    const newBlocks: BudgetFindingBlockUI[] = [];
    const newItems: InvoiceLineItem[] = [];

    for (const [toothStr, t] of Object.entries(teeth)) {
      const toothNum = Number(toothStr);
      const affectedSurfaces = Object.entries(t.surfaces || {})
        .filter(([, st]) => st === "caries" || st === "planned")
        .map(([surf]) => surf);
      const hasCaries = Object.values(t.surfaces || {}).some((s) => s === "caries");
      const hasPlanned = Object.values(t.surfaces || {}).some((s) => s === "planned");

      if (hasCaries || hasPlanned || t.general_status === "endodontics" || t.general_status === "crown") {
        const isSevere = affectedSurfaces.length >= 3 || t.general_status === "endodontics";
        const pathologyCode = isSevere ? "CARIES_PROFUNDA" : "CARIES_ESMALTE";
        const diag =
          t.notes?.trim() ||
          (isSevere
            ? `Caries profunda / Afectación en pieza ${toothNum} (${affectedSurfaces.length} caras)`
            : `Caries de esmalte en pieza ${toothNum}`);
        const fId = `odo-${toothNum}-${Date.now()}`;
        addFindingProtocolToDraft({
          id: fId,
          tooth_number: String(toothNum),
          surfaces: affectedSurfaces,
          pathology_code: pathologyCode,
          diagnosis: diag,
          notes: t.notes,
        });
        createFindingMutation.mutate({
          tooth_number: String(toothNum),
          surfaces: affectedSurfaces,
          pathology_code: pathologyCode,
          diagnosis: diag,
          severity: isSevere ? "HIGH" : "LOW",
          notes: t.notes,
        });
        newItems.push({
          id: `imp-${toothNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: `Tratamiento según protocolo pieza ${toothNum}`,
          toothNumber: String(toothNum),
          quantity: 1,
          unitPriceCents: 6000,
          taxRatePercent: 0,
        });
      } else if (t.general_status === "missing") {
        const diag = t.notes?.trim() || `Ausencia dental / Edentulismo en pieza ${toothNum}`;
        const fId = `odo-${toothNum}-${Date.now()}`;
        addFindingProtocolToDraft({
          id: fId,
          tooth_number: String(toothNum),
          surfaces: [],
          pathology_code: "EDENTULISMO_UNITARIO",
          diagnosis: diag,
          notes: t.notes,
        });
        createFindingMutation.mutate({
          tooth_number: String(toothNum),
          surfaces: [],
          pathology_code: "EDENTULISMO_UNITARIO",
          diagnosis: diag,
          severity: "MEDIUM",
          notes: t.notes,
        });
        newItems.push({
          id: `imp-${toothNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: `Rehabilitación sobre implante pieza ${toothNum}`,
          toothNumber: String(toothNum),
          quantity: 1,
          unitPriceCents: 75000,
          taxRatePercent: 0,
        });
      }
    }
    if (newBlocks.length === 0) {
      notify({
        tone: "info",
        title: "Sin hallazgos pendientes",
        description: "No se han detectado piezas con patologías o tratamientos planificados en el odontograma actual.",
      });
      return;
    }
    setDraftFindingBlocks((prev) => [...prev, ...newBlocks]);
    setInvoiceLines((prev) => [...prev, ...newItems]);
    setActiveTab("billing");
    notify({
      tone: "success",
      title: "Hallazgos registrados y opciones generadas",
      description: `Se han registrado ${newBlocks.length} hallazgo(s) del odontograma con sus alternativas de tratamiento.`,
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
    applyOdontogramChange(`Pieza #${toothNum} · Cara ${surface}: ${nextStatus}`, (prev) => {
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
    applyOdontogramChange(`Pieza #${toothNum} · Estado: ${status}`, (prev) => {
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

  const initialOdo = odontogramQuery.data?.odontograms.find((o) => o.type === "INITIAL");
  const historicalOdo = odontogramQuery.data?.odontograms.find((o) => o.type === "HISTORICAL");
  const initialToothState = (initialOdo?.teeth_data as Record<string, ToothState> | undefined)?.[
    String(activeToothNum)
  ];
  const historicalToothState = (historicalOdo?.teeth_data as Record<string, ToothState> | undefined)?.[
    String(activeToothNum)
  ];

  const selectedToothFindings = (findingsQuery.data?.findings ?? []).filter(
    (f) => String(f.tooth_number) === String(activeToothNum),
  );

  const selectedToothPattern = new RegExp(`\\b(?:pieza|diente|peça)?\\s*#?${activeToothNum}\\b`, "i");
  const selectedToothTimelineEntries = allRecords
    .filter(
      (r) =>
        selectedToothPattern.test(r.content) ||
        (r.attachments ?? []).some((att) => String(att.tooth_number) === String(activeToothNum)),
    )
    .map((r) => ({
      id: r.id,
      entryType: r.entry_type,
      content: r.content,
      doctorName: r.doctor_name ?? "Facultativo",
      createdAt: new Date(r.created_at).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      amendsEntryId: r.amends_entry_id,
      attachments: r.attachments,
    }));

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
              <OdontogramAutosaveUndoBar
                autosaveStatus={autosaveStatus}
                lastSavedAt={lastSavedAt}
                undoCount={undoStack.length}
                lastUndoLabel={undoStack[0]?.label}
                canWriteClinical={canWriteClinical}
                onUndo={handleUndoOdontogram}
                onRetrySave={() => saveOdontogramMutation.mutate({ teethData: teeth, silent: false })}
              />
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
                onClick={() => saveOdontogramMutation.mutate({ teethData: teeth, silent: false })}
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
          {/* LEFT PANE (7 cols): Interactive Compact Odontogram + Inline Active Piece Inspector (FIXED, NO SCROLL) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs overflow-hidden">
            <FeatureGate me={me} feature="odontogram">
              {!canReadClinical ? (
                <Alert tone="warning" title="Acceso restringido">
                  Solo el personal facultativo puede consultar el odontograma detallado.
                </Alert>
              ) : (
                <div className="flex flex-col h-full min-h-0 justify-between gap-2">
                  {/* BLOQUE FIJO: Los dientes y la interacción con los dientes */}
                  <div className="shrink-0 space-y-2 select-none sticky top-0 z-10 bg-white">
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
                        displayMode={odontogramDisplayMode}
                        onDisplayModeChange={setOdontogramDisplayMode}
                        activeTool={odontogramTool}
                        onToolChange={setOdontogramTool}
                        selectedTooth={activeToothNum}
                        onSelectTooth={(num) => setSelectedTooth(num)}
                        onToggleSurface={handleToggleSurface}
                        onSetGeneralStatus={setToothGeneralStatus}
                        historyCounts={historyCounts}
                      />
                    </div>

                    {/* Inline Compact Piece Inspector Bar (Interacción con los dientes fija) */}
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
                            applyOdontogramChange(`Pieza #${activeToothNum} · Preset MOD (${st})`, (prev) => {
                              const base = prev[activeToothNum] ?? emptyTooth(activeToothNum);
                              return {
                                ...prev,
                                [activeToothNum]: {
                                  ...base,
                                  general_status: base.general_status === "missing" ? "present" : base.general_status,
                                  surfaces: {
                                    ...base.surfaces,
                                    mesial: st,
                                    occlusal: st,
                                    distal: st,
                                  },
                                },
                              };
                            });
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
                            applyOdontogramChange(`Pieza #${activeToothNum} · Limpiar pieza a estado sano`, (prev) => ({
                              ...prev,
                              [activeToothNum]: emptyTooth(activeToothNum),
                            }));
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
                          applyOdontogramChange(
                            `Pieza #${activeToothNum} · Nota clínica`,
                            (prev) => {
                              const base = prev[activeToothNum] ?? emptyTooth(activeToothNum);
                              return { ...prev, [activeToothNum]: { ...base, notes } };
                            },
                            600,
                          );
                        }}
                        placeholder={`Nota rápida pieza ${activeToothNum} (sensibilidad, bolsa…)`}
                        className="h-7 flex-1 min-w-[160px] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                      />

                      {canWriteClinical ? (
                        <button
                          type="button"
                          onClick={() => {
                            const affectedSurfaces = Object.entries(activeToothState.surfaces || {})
                              .filter(([, st]) => st !== "healthy")
                              .map(([surf]) => surf);
                            const isSevere = affectedSurfaces.length >= 3;
                            const pathologyCode = isSevere ? "CARIES_PROFUNDA" : "CARIES_ESMALTE";
                            const diag =
                              activeToothState.notes?.trim() ||
                              (isSevere
                                ? `Caries profunda en pieza ${activeToothNum} (${activeToothInfo.name})`
                                : `Caries de esmalte en pieza ${activeToothNum} (${activeToothInfo.name})`);
                            createFindingMutation.mutate(
                              {
                                tooth_number: String(activeToothNum),
                                surfaces: affectedSurfaces,
                                pathology_code: pathologyCode,
                                diagnosis: diag,
                                severity: isSevere ? "HIGH" : "LOW",
                                notes: activeToothState.notes ?? "",
                              },
                              {
                                onSuccess: (res) => {
                                  addFindingProtocolToDraft(res.finding);
                                },
                              },
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-amber-700 transition"
                          title="Registrar este descubrimiento en Hallazgos/Presupuestos con sus opciones de tratamiento"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Registrar hallazgo pieza #{activeToothNum}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                  {/* Bottom Section of Selected Tooth: Graphical Evolution of Changes + Clinical History of Selected Tooth */}
                  <div className="flex-1 min-h-0 overflow-y-auto pt-1 rounded-lg">
                    <SelectedToothEvolutionAndHistoryPanel
                      toothNumber={activeToothNum}
                      initialToothState={initialToothState}
                      historicalToothState={historicalToothState}
                      currentToothState={activeToothState}
                      findings={selectedToothFindings}
                      records={selectedToothTimelineEntries}
                      displayMode={odontogramDisplayMode}
                      onSelectTooth={(num) => setSelectedTooth(num)}
                      onPreviewAttachment={(att) => setPreviewAttachment(att)}
                    />
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

                  {/* Scrollable Internal Timeline (El scroll está sobre el histórico del paciente) */}
                  <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-1.5 overscroll-contain focus:outline-none scroll-smooth">
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
                        onPreviewAttachment={(att) => setPreviewAttachment(att)}
                        entries={displayedRecords.map((r) => ({
                          id: r.id,
                          entryType: r.entry_type,
                          content: r.content,
                          doctorName: r.doctor_name,
                          createdAt: new Date(r.created_at).toLocaleString("es-ES"),
                          amendsEntryId: r.amends_entry_id,
                          attachments: r.attachments,
                        }))}
                      />
                    )}
                  </div>

                  {/* Pinned Quick Evolution Composer (Always visible at bottom of right pane) */}
                  <PermissionGate me={me} permission="clinical:write">
                    <form
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        if (!entryContent.trim() && draftAttachments.length === 0) return;
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

                      {/* Attachments Toolbar: Upload images (photos / X-rays) or documents */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100">
                          <Plus className="h-3 w-3 text-brand-700" />
                          <span>Adjuntar archivo</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? []);
                              files.forEach((file) => {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const dataUrl = String(reader.result || "");
                                  const lower = file.name.toLowerCase();
                                  const kind: ClinicalAttachmentUI["kind"] =
                                    lower.includes("rx") ||
                                    lower.includes("radio") ||
                                    lower.includes("orto") ||
                                    lower.includes("periapical")
                                      ? "XRAY"
                                      : file.type.startsWith("image/")
                                      ? "PHOTO"
                                      : "DOCUMENT";
                                  setDraftAttachments((prev) => [
                                    ...prev,
                                    {
                                      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                      kind,
                                      name: file.name,
                                      mime_type: file.type || "application/octet-stream",
                                      data_url: dataUrl,
                                      size_bytes: file.size,
                                      tooth_number: linkRecordToTooth ? String(activeToothNum) : undefined,
                                    },
                                  ]);
                                };
                                reader.readAsDataURL(file);
                              });
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftAttachments((prev) => [
                              ...prev,
                              buildSampleClinicalAttachment("XRAY", activeToothNum),
                            ])
                          }
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-brand-800 hover:bg-brand-50"
                          title="Adjuntar radiografía periapical al historial"
                        >
                          + Radiografía
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftAttachments((prev) => [
                              ...prev,
                              buildSampleClinicalAttachment("PHOTO", activeToothNum),
                            ])
                          }
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50"
                          title="Adjuntar fotografía intraoral al historial"
                        >
                          + Foto clínica
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftAttachments((prev) => [
                              ...prev,
                              buildSampleClinicalAttachment("DOCUMENT", activeToothNum),
                            ])
                          }
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                          title="Adjuntar documento o consentimiento informado al historial"
                        >
                          + Documento
                        </button>
                      </div>

                      {draftAttachments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 rounded-lg border border-brand-200 bg-white p-1.5">
                          {draftAttachments.map((att) => (
                            <span
                              key={att.id}
                              className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-900"
                            >
                              <span>
                                [{att.kind === "XRAY" ? "Rx" : att.kind === "PHOTO" ? "Foto" : "Doc"}] {att.name}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftAttachments((prev) => prev.filter((x) => x.id !== att.id))
                                }
                                className="text-slate-400 hover:text-red-600"
                                title="Quitar adjunto"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          aria-label="Descripción clínica"
                          value={entryContent}
                          onChange={(e) => setEntryContent(e.target.value)}
                          placeholder={
                            linkRecordToTooth
                              ? `Registrar evolución para [Pieza ${activeToothNum}] (hallazgos, anestesia, radiografía, obturación…)`
                              : "Motivo, hallazgos, radiografías, anestesia, recomendaciones…"
                          }
                          required={draftAttachments.length === 0}
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
        /* VIEW 3: HALLAZGOS DEL ODONTOGRAMA, PRESUPUESTOS MULTI-OPCIÓN Y FACTURACIÓN */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <FeatureGate me={me} feature="billing_pdf">
            <div className="grid gap-4 lg:grid-cols-12">
              {/* LEFT COLUMN (4 cols): APARTADO DE HALLAZGOS CLÍNICOS */}
              <div className="lg:col-span-4 space-y-4">
                <Card
                  title="Hallazgos del Odontograma"
                  description="Descubrimientos clínicos registrados durante la exploración dental"
                  footer={
                    <Button variant="outline" size="sm" onClick={importFromOdontogram}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Sincronizar odontograma
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    {/* Quick New Finding Form */}
                    <PermissionGate me={me} permission="billing:write">
                      <form
                        onSubmit={(e: FormEvent) => {
                          e.preventDefault();
                          if (!newFindingDiagnosis.trim()) return;
                          createFindingMutation.mutate({
                            tooth_number: newFindingTooth.trim() || "General",
                            diagnosis: newFindingDiagnosis.trim(),
                            severity: newFindingSeverity,
                            notes: newFindingNotes.trim(),
                          });
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2.5"
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Registrar nuevo hallazgo clínico
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Pieza dental"
                            value={newFindingTooth}
                            onChange={(e) => setNewFindingTooth(e.target.value)}
                            placeholder="26"
                            required
                          />
                          <Select
                            label="Prioridad"
                            value={newFindingSeverity}
                            onChange={(v) => setNewFindingSeverity(v as "LOW" | "MEDIUM" | "HIGH")}
                            placeholder=""
                            options={[
                              { value: "HIGH", label: "Alta / Urgente" },
                              { value: "MEDIUM", label: "Media" },
                              { value: "LOW", label: "Baja / Seguimiento" },
                            ]}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">
                            Diagnóstico / Descubrimiento clínico
                          </label>
                          <select
                            aria-label="Catálogo de hallazgos y protocolos clínicos"
                            value={selectedFindingCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              setSelectedFindingCode(code);
                              const fnd = masterFindings.find((m) => m.code === code);
                              if (fnd) {
                                setNewFindingDiagnosis(fnd.name);
                                setNewFindingSeverity(fnd.default_severity || "MEDIUM");
                              }
                            }}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
                          >
                            <option value="">Seleccionar del catálogo de hallazgos y protocolos…</option>
                            {masterFindings.map((m) => (
                              <option key={m.id || m.code} value={m.code}>
                                {m.name} ({m.default_treatment_codes?.length ?? 0} tratamientos configurados)
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={newFindingDiagnosis}
                            onChange={(e) => setNewFindingDiagnosis(e.target.value)}
                            placeholder="Descripción del hallazgo clínico…"
                            required
                            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Button
                            type="submit"
                            size="sm"
                            loading={createFindingMutation.isPending}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Guardar hallazgo
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (!newFindingDiagnosis.trim()) return;
                              createFindingMutation.mutate(
                                {
                                  tooth_number: newFindingTooth.trim() || "General",
                                  diagnosis: newFindingDiagnosis.trim(),
                                  pathology_code: selectedFindingCode || undefined,
                                  severity: newFindingSeverity,
                                  notes: newFindingNotes.trim(),
                                },
                                {
                                  onSuccess: (res) => {
                                    addFindingProtocolToDraft(res.finding);
                                  },
                                },
                              );
                            }}
                          >
                            + Guardar y presupuestar según protocolo
                          </Button>
                        </div>
                      </form>
                    </PermissionGate>

                    {/* Registered Findings List */}
                    {findingsQuery.isLoading ? (
                      <Skeleton className="h-28 w-full" />
                    ) : (findingsQuery.data?.findings.length ?? 0) === 0 ? (
                      <Alert tone="neutral">
                        No hay hallazgos registrados todavía. Marca patologías en el odontograma o añade un hallazgo arriba.
                      </Alert>
                    ) : (
                      <div className="space-y-2.5">
                        {(findingsQuery.data?.findings ?? []).map((f) => {
                          const isClosed = f.status === "INVOICED" || f.status === "DISCARDED";
                          return (
                            <div
                              key={f.id}
                              className={cn(
                                "rounded-xl border p-3 space-y-2 transition",
                                isClosed
                                  ? "border-slate-200 bg-slate-50/60 opacity-75"
                                  : "border-slate-200 bg-white shadow-2xs",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
                                      Pieza #{f.tooth_number}
                                    </span>
                                    <Badge
                                      tone={
                                        f.status === "ACCEPTED" || f.status === "INVOICED"
                                          ? "success"
                                          : f.status === "IN_BUDGET"
                                          ? "info"
                                          : f.status === "DISCARDED"
                                          ? "neutral"
                                          : "warning"
                                      }
                                      className="text-[10px]"
                                    >
                                      {f.status === "OPEN"
                                        ? "Abierto / Sin presupuestar"
                                        : f.status === "IN_BUDGET"
                                        ? "En presupuesto"
                                        : f.status === "ACCEPTED"
                                        ? "Aceptado"
                                        : f.status === "INVOICED"
                                        ? "Cerrado (Facturado)"
                                        : "Cancelado con nota clínica"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs font-bold text-slate-900 mt-1">{f.diagnosis}</p>
                                  {f.notes ? (
                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                      Nota clínica: {f.notes}
                                    </p>
                                  ) : null}
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    ✓ Añadido automáticamente al historial clínico del paciente
                                  </p>
                                </div>
                              </div>

                              {!isClosed ? (
                                <PermissionGate me={me} permission="billing:write">
                                  <div className="space-y-2 border-t border-slate-100 pt-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => addFindingProtocolToDraft(f)}
                                        className="rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700 transition"
                                        title="Generar los tratamientos del protocolo clínico asignado al presupuesto"
                                      >
                                        + Presupuestar según protocolo
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => addFindingSingleOptionToDraft(f)}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                                        title="Añadir tratamiento manual al presupuesto"
                                      >
                                        + 1 Tratamiento libre
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCancellingFindingId((prev) => (prev === f.id ? null : f.id));
                                          setCancellationClinicalNote("");
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-red-50 hover:text-red-700"
                                      >
                                        Cancelar con nota clínica
                                      </button>
                                    </div>

                                    {cancellingFindingId === f.id ? (
                                      <div className="rounded-lg border border-red-200 bg-red-50/60 p-2.5 space-y-2">
                                        <label className="block text-[11px] font-bold text-red-900">
                                          Nota clínica obligatoria para cancelar el hallazgo (se registrará en el historial):
                                        </label>
                                        <input
                                          type="text"
                                          value={cancellationClinicalNote}
                                          onChange={(e) => setCancellationClinicalNote(e.target.value)}
                                          placeholder="Ej: Descartado tras radiografía periapical sin lesión activa…"
                                          className="h-8 w-full rounded-md border border-red-300 bg-white px-2 text-xs text-slate-900"
                                        />
                                        <div className="flex items-center justify-end gap-1.5">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setCancellingFindingId(null);
                                              setCancellationClinicalNote("");
                                            }}
                                          >
                                            Volver
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            disabled={!cancellationClinicalNote.trim()}
                                            loading={updateFindingStatusMutation.isPending}
                                            onClick={() =>
                                              updateFindingStatusMutation.mutate({
                                                findingId: f.id,
                                                status: "DISCARDED",
                                                notes: cancellationClinicalNote.trim(),
                                              })
                                            }
                                          >
                                            Confirmar cancelación y anotar en historial
                                          </Button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </PermissionGate>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* RIGHT COLUMN (8 cols): PRESUPUESTOS POR TRATAMIENTOS Y RESPUESTA DEL CLIENTE */}
              <div className="lg:col-span-8 space-y-4">
                {/* 1. Constructor de Presupuesto Estructurado por Hallazgos y Opciones */}
                <PermissionGate me={me} permission="billing:write">
                  <Card
                    title="Confección de Presupuesto por Hallazgos y Alternativas de Tratamiento"
                    description="Cada hallazgo se sitúa arriba y debajo se detallan los diferentes tratamientos propuestos para que el cliente elija en casa"
                    footer={
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-600">
                          {draftFindingBlocks.length === 0
                            ? "Selecciona un hallazgo de la columna izquierda para añadir sus alternativas de tratamiento."
                            : `${draftFindingBlocks.length} hallazgo(s) incluido(s) en este presupuesto.`}
                        </span>
                        <div className="flex items-center gap-2">
                          {draftFindingBlocks.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDraftFindingBlocks([])}
                            >
                              Limpiar borrador
                            </Button>
                          ) : null}
                          <Button
                            onClick={() => createBudgetMutation.mutate()}
                            loading={createBudgetMutation.isPending}
                            disabled={draftFindingBlocks.length === 0}
                          >
                            <Receipt className="h-4 w-4" />
                            Emitir presupuesto con opciones
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                          <Input
                            label="Título del presupuesto"
                            value={budgetTitle}
                            onChange={(e) => setBudgetTitle(e.target.value)}
                            placeholder="Plan Rehabilitación Oral"
                          />
                        </div>
                        <Input
                          label="Serie"
                          value={budgetSeries}
                          onChange={(e) => setBudgetSeries(e.target.value.toUpperCase())}
                          placeholder="PRE"
                        />
                        <Select
                          label="Tiempo de vigencia"
                          value={budgetValidityDays}
                          onChange={setBudgetValidityDays}
                          placeholder=""
                          options={[
                            { value: "15", label: "15 días" },
                            { value: "30", label: "30 días (Estándar)" },
                            { value: "45", label: "45 días" },
                            { value: "60", label: "60 días" },
                            { value: "90", label: "90 días" },
                            ...(!["15", "30", "45", "60", "90"].includes(budgetValidityDays)
                              ? [{ value: budgetValidityDays, label: `${budgetValidityDays} días (Personalizado)` }]
                              : []),
                          ]}
                        />
                      </div>

                      {draftFindingBlocks.length > 0 ? (
                        <div className="space-y-4">
                          {draftFindingBlocks.map((blk, blkIdx) => (
                            <div
                              key={blk.finding_id || blkIdx}
                              className="rounded-xl border border-brand-200 bg-brand-50/30 p-3.5 space-y-3"
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-brand-200/80 pb-2">
                                <div>
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-800">
                                    Hallazgo #{blkIdx + 1} · Pieza {blk.tooth_number}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900">{blk.diagnosis}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setDraftFindingBlocks((prev) =>
                                        prev.map((b, idx) => {
                                          if (idx !== blkIdx) return b;
                                          const nextNum = b.options.length + 1;
                                          const newOpt: BudgetTreatmentOptionUI = {
                                            id: `opt-${Date.now()}-${nextNum}`,
                                            option_label: `Opción ${nextNum}`,
                                            name: `Alternativa de tratamiento ${nextNum}`,
                                            is_recommended: false,
                                            total_cents: 6000,
                                            patient_response: "PENDING",
                                            items: [
                                              {
                                                id: `it-${Date.now()}-${nextNum}`,
                                                description: `Tratamiento pieza ${b.tooth_number}`,
                                                tooth_number: b.tooth_number,
                                                quantity: 1,
                                                unit_price_cents: 6000,
                                              },
                                            ],
                                          };
                                          return { ...b, options: [...b.options, newOpt] };
                                        }),
                                      );
                                    }}
                                  >
                                    + Añadir otra opción de tratamiento
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraftFindingBlocks((prev) =>
                                        prev.filter((_, idx) => idx !== blkIdx),
                                      )
                                    }
                                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Quitar hallazgo del borrador"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Treatment Alternatives Editor under this Finding */}
                              <div className="grid gap-3 md:grid-cols-3">
                                {blk.options.map((opt, optIdx) => (
                                  <div
                                    key={opt.id}
                                    className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-extrabold uppercase text-brand-700">
                                        {opt.option_label}
                                      </span>
                                      <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                                        <input
                                          type="checkbox"
                                          checked={opt.is_recommended}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            setDraftFindingBlocks((prev) =>
                                              prev.map((b, i) =>
                                                i !== blkIdx
                                                  ? b
                                                  : {
                                                      ...b,
                                                      options: b.options.map((o, j) =>
                                                        j === optIdx
                                                          ? { ...o, is_recommended: checked }
                                                          : o,
                                                      ),
                                                    },
                                              ),
                                            );
                                          }}
                                        />
                                        Recomendado
                                      </label>
                                    </div>

                                    <input
                                      type="text"
                                      value={opt.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDraftFindingBlocks((prev) =>
                                          prev.map((b, i) =>
                                            i !== blkIdx
                                              ? b
                                              : {
                                                  ...b,
                                                  options: b.options.map((o, j) =>
                                                    j === optIdx ? { ...o, name: val } : o,
                                                  ),
                                                },
                                          ),
                                        );
                                      }}
                                      className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs font-bold text-slate-900"
                                    />

                                    <div className="space-y-1.5">
                                      {opt.items.map((it, itIdx) => (
                                        <div key={it.id} className="flex items-center gap-1 text-xs">
                                          <input
                                            type="text"
                                            value={it.description}
                                            onChange={(e) => {
                                              const desc = e.target.value;
                                              setDraftFindingBlocks((prev) =>
                                                prev.map((b, i) =>
                                                  i !== blkIdx
                                                    ? b
                                                    : {
                                                        ...b,
                                                        options: b.options.map((o, j) =>
                                                          j !== optIdx
                                                            ? o
                                                            : {
                                                                ...o,
                                                                items: o.items.map((item, k) =>
                                                                  k === itIdx
                                                                    ? { ...item, description: desc }
                                                                    : item,
                                                                ),
                                                              },
                                                        ),
                                                      },
                                                ),
                                              );
                                            }}
                                            className="h-7 flex-1 min-w-0 rounded border border-slate-200 px-1.5 text-[11px]"
                                          />
                                          <input
                                            type="number"
                                            step="1"
                                            min={0}
                                            value={Math.round(it.unit_price_cents / 100)}
                                            onChange={(e) => {
                                              const cents = Math.round(
                                                (Number(e.target.value) || 0) * 100,
                                              );
                                              setDraftFindingBlocks((prev) =>
                                                prev.map((b, i) =>
                                                  i !== blkIdx
                                                    ? b
                                                    : {
                                                        ...b,
                                                        options: b.options.map((o, j) => {
                                                          if (j !== optIdx) return o;
                                                          const nextItems = o.items.map(
                                                            (item, k) =>
                                                              k === itIdx
                                                                ? {
                                                                    ...item,
                                                                    unit_price_cents: cents,
                                                                  }
                                                                : item,
                                                          );
                                                          const nextTotal = nextItems.reduce(
                                                            (s, x) =>
                                                              s +
                                                              (x.quantity || 1) * x.unit_price_cents,
                                                            0,
                                                          );
                                                          return {
                                                            ...o,
                                                            items: nextItems,
                                                            total_cents: nextTotal,
                                                          };
                                                        }),
                                                      },
                                                ),
                                              );
                                            }}
                                            className="h-7 w-16 rounded border border-slate-200 px-1.5 text-right text-[11px] tabular-nums"
                                          />
                                        </div>
                                      ))}

                                      {/* Add procedure from Treatments Catalog */}
                                      {(treatmentsCatalogQuery.data?.treatments.length ?? 0) > 0 ? (
                                        <select
                                          aria-label="Añadir acto clínico del catálogo"
                                          value=""
                                          onChange={(e) => {
                                            const trt = treatmentsCatalogQuery.data?.treatments.find(
                                              (t) => t.id === e.target.value,
                                            );
                                            if (!trt) return;
                                            const priceCents = Math.round(
                                              (trt.default_price || 50) * 100,
                                            );
                                            setDraftFindingBlocks((prev) =>
                                              prev.map((b, i) =>
                                                i !== blkIdx
                                                  ? b
                                                  : {
                                                      ...b,
                                                      options: b.options.map((o, j) => {
                                                        if (j !== optIdx) return o;
                                                        const nextItems = [
                                                          ...o.items,
                                                          {
                                                            id: `it-${Date.now()}`,
                                                            treatment_code: trt.code,
                                                            description: `${trt.name} (Pieza ${b.tooth_number})`,
                                                            tooth_number: b.tooth_number,
                                                            quantity: 1,
                                                            unit_price_cents: priceCents,
                                                          },
                                                        ];
                                                        return {
                                                          ...o,
                                                          items: nextItems,
                                                          total_cents: nextItems.reduce(
                                                            (s, x) =>
                                                              s +
                                                              (x.quantity || 1) * x.unit_price_cents,
                                                            0,
                                                          ),
                                                        };
                                                      }),
                                                    },
                                              ),
                                            );
                                          }}
                                          className="h-7 w-full rounded border border-dashed border-slate-300 bg-slate-50 px-1.5 text-[11px] text-slate-600"
                                        >
                                          <option value="">+ Añadir acto del catálogo…</option>
                                          {(treatmentsCatalogQuery.data?.treatments ?? []).map(
                                            (t) => (
                                              <option key={t.id} value={t.id}>
                                                {t.name} ({t.default_price} €)
                                              </option>
                                            ),
                                          )}
                                        </select>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </PermissionGate>

                {/* 2. Presupuestos Emitidos y Registro de Aceptación del Cliente por Tratamiento */}
                <Card
                  title="Presupuestos del Cliente y Respuesta por Tratamiento"
                  description="Registra qué opción de tratamiento acepta o descarta el paciente cuando regresa con su decisión"
                >
                  {budgetsQuery.isLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (budgetsQuery.data?.budgets.length ?? 0) === 0 ? (
                    <Alert tone="neutral">
                      Todavía no hay presupuestos estructurados por tratamientos para este cliente.
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {(budgetsQuery.data?.budgets ?? []).map((bud) => (
                        <PatientBudgetCard
                          key={bud.id}
                          budget={bud}
                          currency="EUR"
                          canWrite={can(me, "billing:write")}
                          loading={
                            respondBudgetOptionMutation.isPending ||
                            updateBudgetStatusMutation.isPending ||
                            convertBudgetToInvoiceMutation.isPending
                          }
                          onRespondOption={(budgetId, findingId, optionId, response) =>
                            respondBudgetOptionMutation.mutate({
                              budgetId,
                              findingId,
                              optionId,
                              response,
                            })
                          }
                          onUpdateStatus={(budgetId, status, validityDays) =>
                            updateBudgetStatusMutation.mutate({
                              budgetId,
                              status,
                              validityDays,
                            })
                          }
                          onConvertToInvoice={(budgetId) =>
                            convertBudgetToInvoiceMutation.mutate(budgetId)
                          }
                          onPrintFormat={(b) => setPrintingBudget(b)}
                          onCreateNewBudgetForFinding={(finding) =>
                            addFindingProtocolToDraft(finding)
                          }
                        />
                      ))}
                    </div>
                  )}
                </Card>

                {/* 3. Facturación Directa e Historial de Facturas (FAC-X) */}
                <PermissionGate me={me} permission="billing:write">
                  <Card
                    title="Nuevo presupuesto o factura directa"
                    description="Añade conceptos sueltos o importa partidas rápidas desde el odontograma"
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
            </div>
          </FeatureGate>
        </div>
      )}

      {/* Modal: Formato Imprimible de Presupuesto con Alternativas para el Cliente */}
      <Modal
        open={Boolean(printingBudget)}
        onClose={() => setPrintingBudget(null)}
        maxWidth="max-w-4xl"
        title={
          printingBudget
            ? `Formato de Presupuesto ${printingBudget.series}-${printingBudget.budget_number}`
            : "Formato de Presupuesto"
        }
        description="Documento comparativo de hallazgos y tratamientos propuestos para entregar al paciente"
      >
        {printingBudget ? (
          <BudgetPrintFormatDocument
            budget={printingBudget}
            patientName={`${patient.first_name} ${patient.last_name}`}
            patientDni={patient.dni_nie}
            clinicName={me?.active_tenant.name ?? "Clínica Dental"}
            clinicLogoUrl={effectiveClinicSettings.logo_url}
            clinicTaxId={me?.active_tenant.tax_id}
            clinicContactLine={effectiveClinicSettings.clinic_contact_line}
            validityTerms={effectiveClinicSettings.budget_validity_terms}
            currency={me?.active_tenant.billing_currency ?? "EUR"}
            customMarginsEnabled={effectiveClinicSettings.custom_margins_enabled}
            marginTopMm={effectiveClinicSettings.margin_top_mm}
            marginBottomMm={effectiveClinicSettings.margin_bottom_mm}
            marginLeftMm={effectiveClinicSettings.margin_left_mm}
            marginRightMm={effectiveClinicSettings.margin_right_mm}
            hideHeaderLogoOnPrint={effectiveClinicSettings.hide_header_logo_on_print}
            onPrint={() => window.print()}
          />
        ) : null}
      </Modal>

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

      {/* Modal: Visor de Adjuntos del Historial Clínico (Radiografías, Fotos, Documentos) */}
      <Modal
        open={Boolean(previewAttachment)}
        onClose={() => setPreviewAttachment(null)}
        title={previewAttachment ? previewAttachment.name : "Adjunto Clínico"}
        description={
          previewAttachment
            ? `${
                previewAttachment.kind === "XRAY"
                  ? "Radiografía dental"
                  : previewAttachment.kind === "PHOTO"
                  ? "Fotografía clínica"
                  : "Documento del historial"
              }${previewAttachment.tooth_number ? ` · Pieza #${previewAttachment.tooth_number}` : ""}`
            : undefined
        }
      >
        {previewAttachment ? (
          <div className="space-y-4">
            {previewAttachment.kind === "XRAY" ||
            previewAttachment.kind === "PHOTO" ||
            previewAttachment.mime_type.startsWith("image/") ? (
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-950 p-4">
                <img
                  src={previewAttachment.data_url}
                  alt={previewAttachment.name}
                  className="max-h-[420px] w-auto rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                <p className="font-bold text-slate-900">{previewAttachment.name}</p>
                <p className="mt-1 text-slate-500">Tipo MIME: {previewAttachment.mime_type}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <a
                href={previewAttachment.data_url}
                download={previewAttachment.name}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Descargar archivo
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
