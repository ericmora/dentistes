import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  MessageCircle,
  Phone,
  QrCode,
  ShieldAlert,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Badge, Button, cn, formatMoney, type Tone } from "./primitives";

export interface MedicalAllergy {
  name: string;
  severity?: "HIGH" | "MEDIUM" | "LOW";
  reaction?: string;
}

export interface MedicalCondition {
  code?: string;
  name: string;
  active?: boolean;
}

export interface MedicalAlertsData {
  allergies?: Array<MedicalAllergy | string>;
  conditions?: Array<MedicalCondition | string>;
  medications?: Array<{ name: string; dosage?: string } | string>;
  high_risk?: boolean;
  requires_antibiotic_prophylaxis?: boolean;
  notes?: string;
}

export function CriticalAlertBanner({
  alerts,
  summaryText,
  hideDetails = false,
}: {
  alerts?: MedicalAlertsData | null;
  summaryText?: string;
  hideDetails?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const allergies = alerts?.allergies ?? [];
  const conditions = alerts?.conditions ?? [];
  const medications = alerts?.medications ?? [];
  const hasAlerts =
    Boolean(alerts?.high_risk) ||
    Boolean(alerts?.requires_antibiotic_prophylaxis) ||
    allergies.length > 0 ||
    conditions.length > 0 ||
    Boolean(summaryText);

  if (!hasAlerts) return null;

  return (
    <div
      role="region"
      aria-label="Alertas médicas críticas"
      className="rounded-xl border-2 border-critical bg-red-50 px-4 py-3 text-red-950 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-critical text-white">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-critical">
              Alerta clínica activa
            </p>
            <p className="text-sm font-medium text-red-900">
              {summaryText ||
                (hideDetails
                  ? "Paciente con alerta médica crítica. Consultar con el facultativo."
                  : [
                      allergies.length > 0 ? `${allergies.length} alergia(s)` : null,
                      conditions.length > 0 ? `${conditions.length} patología(s)` : null,
                      alerts?.requires_antibiotic_prophylaxis ? "Profilaxis antibiótica" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Riesgo clínico marcado")}
            </p>
          </div>
        </div>
        {!hideDetails && (allergies.length > 0 || conditions.length > 0 || medications.length > 0 || alerts?.notes) ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-100"
          >
            {expanded ? "Ocultar detalle" : "Ver detalle"}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      {expanded && !hideDetails ? (
        <div className="mt-3 grid gap-3 border-t border-red-200 pt-3 text-xs sm:grid-cols-3">
          {allergies.length > 0 ? (
            <div>
              <p className="font-semibold uppercase text-red-800">Alergias</p>
              <ul className="mt-1 space-y-1">
                {allergies.map((a, idx) => (
                  <li key={idx}>• {typeof a === "string" ? a : `${a.name}${a.reaction ? ` (${a.reaction})` : ""}`}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {conditions.length > 0 ? (
            <div>
              <p className="font-semibold uppercase text-red-800">Antecedentes</p>
              <ul className="mt-1 space-y-1">
                {conditions.map((c, idx) => (
                  <li key={idx}>• {typeof c === "string" ? c : c.name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {medications.length > 0 ? (
            <div>
              <p className="font-semibold uppercase text-red-800">Medicación</p>
              <ul className="mt-1 space-y-1">
                {medications.map((m, idx) => (
                  <li key={idx}>• {typeof m === "string" ? m : `${m.name}${m.dosage ? ` ${m.dosage}` : ""}`}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type ToothSurfaceName = "occlusal" | "mesial" | "distal" | "vestibular" | "lingual";
export type ToothSurfaceStatus = "healthy" | "caries" | "restored" | "planned" | "missing";

export interface ToothState {
  tooth_number: number;
  surfaces: Record<ToothSurfaceName, ToothSurfaceStatus>;
  general_status?: "present" | "missing" | "crown" | "implant" | "endodontics";
  notes?: string;
}

const SURFACE_COLORS: Record<ToothSurfaceStatus, string> = {
  healthy: "#FFFFFF",
  caries: "#E11D48",
  restored: "#2563EB",
  planned: "#16A34A",
  missing: "#4B5563",
};

export function ToothSurfaceRenderer({
  tooth,
  selected,
  onSelectSurface,
  onSelectTooth,
}: {
  tooth: ToothState;
  selected?: boolean;
  onSelectSurface?: (toothNumber: number, surface: ToothSurfaceName) => void;
  onSelectTooth?: (toothNumber: number) => void;
}) {
  const isMissing = tooth.general_status === "missing";
  const fillOf = (s: ToothSurfaceName) =>
    isMissing ? SURFACE_COLORS.missing : SURFACE_COLORS[tooth.surfaces[s] ?? "healthy"];

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border p-1.5 transition",
        selected ? "border-brand-600 bg-brand-50/50 ring-2 ring-brand-200" : "border-slate-200 bg-white",
      )}
    >
      <button
        type="button"
        onClick={() => onSelectTooth?.(tooth.tooth_number)}
        className="mb-1 text-xs font-semibold tabular-nums text-slate-700 hover:text-brand-700"
      >
        {tooth.tooth_number}
      </button>
      <svg viewBox="0 0 60 60" className="h-11 w-11 touch-manipulation" role="img" aria-label={`Pieza ${tooth.tooth_number}`}>
        {/* Vestibular (top) */}
        <polygon
          points="5,5 55,5 42,18 18,18"
          fill={fillOf("vestibular")}
          stroke="#334155"
          strokeWidth="1.5"
          className="cursor-pointer hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "vestibular")}
        />
        {/* Lingual (bottom) */}
        <polygon
          points="18,42 42,42 55,55 5,55"
          fill={fillOf("lingual")}
          stroke="#334155"
          strokeWidth="1.5"
          className="cursor-pointer hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "lingual")}
        />
        {/* Mesial (left) */}
        <polygon
          points="5,5 18,18 18,42 5,55"
          fill={fillOf("mesial")}
          stroke="#334155"
          strokeWidth="1.5"
          className="cursor-pointer hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "mesial")}
        />
        {/* Distal (right) */}
        <polygon
          points="55,5 55,55 42,42 42,18"
          fill={fillOf("distal")}
          stroke="#334155"
          strokeWidth="1.5"
          className="cursor-pointer hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "distal")}
        />
        {/* Occlusal / Incisal (center) */}
        <rect
          x="18"
          y="18"
          width="24"
          height="24"
          fill={fillOf("occlusal")}
          stroke="#334155"
          strokeWidth="1.5"
          className="cursor-pointer hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "occlusal")}
        />
        {isMissing ? (
          <g stroke="#F8FAFC" strokeWidth="2.5">
            <line x1="10" y1="10" x2="50" y2="50" />
            <line x1="50" y1="10" x2="10" y2="50" />
          </g>
        ) : null}
        {tooth.general_status === "crown" ? (
          <circle cx="30" cy="30" r="26" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeDasharray="4 2" />
        ) : null}
        {tooth.general_status === "implant" ? (
          <circle cx="30" cy="30" r="6" fill="#0F172A" />
        ) : null}
      </svg>
    </div>
  );
}

const ADULT_QUADRANTS = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41],
  [31, 32, 33, 34, 35, 36, 37, 38],
];

const CHILD_QUADRANTS = [
  [55, 54, 53, 52, 51],
  [61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81],
  [71, 72, 73, 74, 75],
];

export function emptyTooth(tooth_number: number): ToothState {
  return {
    tooth_number,
    surfaces: {
      occlusal: "healthy",
      mesial: "healthy",
      distal: "healthy",
      vestibular: "healthy",
      lingual: "healthy",
    },
    general_status: "present",
  };
}

export function OdontogramGrid({
  teeth,
  dentition = "adult",
  onDentitionChange,
  activeTool = "caries",
  onToolChange,
  onToggleSurface,
  selectedTooth,
  onSelectTooth,
}: {
  teeth: Record<number, ToothState>;
  dentition?: "adult" | "child";
  onDentitionChange?: (d: "adult" | "child") => void;
  activeTool?: ToothSurfaceStatus;
  onToolChange?: (tool: ToothSurfaceStatus) => void;
  onToggleSurface?: (toothNumber: number, surface: ToothSurfaceName, nextStatus: ToothSurfaceStatus) => void;
  selectedTooth?: number;
  onSelectTooth?: (toothNumber: number) => void;
}) {
  const quadrants = dentition === "adult" ? ADULT_QUADRANTS : CHILD_QUADRANTS;
  const tools: Array<{ key: ToothSurfaceStatus; label: string; dot: string }> = [
    { key: "caries", label: "Patología / Caries", dot: "bg-dental-caries" },
    { key: "restored", label: "Realizado", dot: "bg-dental-restored" },
    { key: "planned", label: "Planificado", dot: "bg-dental-planned" },
    { key: "missing", label: "Ausente", dot: "bg-dental-missing" },
    { key: "healthy", label: "Sana", dot: "border border-slate-300 bg-white" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => onToolChange?.(tool.key)}
              className={cn(
                "inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                activeTool === tool.key
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <span className={cn("h-3 w-3 rounded-full", tool.dot)} />
              {tool.label}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(["adult", "child"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onDentitionChange?.(mode)}
              className={cn(
                "min-h-[36px] rounded-md px-3 text-xs font-medium",
                dentition === mode ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900",
              )}
            >
              {mode === "adult" ? "Adulto (32)" : "Infantil (20)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {quadrants.map((q, qIdx) => (
          <div key={qIdx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex flex-wrap justify-center gap-1.5">
              {q.map((num) => {
                const state = teeth[num] ?? emptyTooth(num);
                return (
                  <ToothSurfaceRenderer
                    key={num}
                    tooth={state}
                    selected={selectedTooth === num}
                    onSelectTooth={onSelectTooth}
                    onSelectSurface={(toothNum, surface) => {
                      const current = state.surfaces[surface];
                      const next = current === activeTool ? "healthy" : activeTool;
                      onToggleSurface?.(toothNum, surface, next);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "WHATSAPP_SENT"
  | "CONFIRMED"
  | "WAITING_ROOM"
  | "IN_CABINET"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

const APPOINTMENT_STATUS_META: Record<AppointmentStatus, { label: string; tone: Tone; border: string }> = {
  SCHEDULED: { label: "Programada", tone: "warning", border: "border-l-pending" },
  WHATSAPP_SENT: { label: "WhatsApp enviado", tone: "info", border: "border-l-pending" },
  CONFIRMED: { label: "Confirmada", tone: "success", border: "border-l-confirmed" },
  WAITING_ROOM: { label: "Sala de espera", tone: "info", border: "border-l-inchair" },
  IN_CABINET: { label: "En gabinete", tone: "info", border: "border-l-inchair" },
  COMPLETED: { label: "Finalizada", tone: "neutral", border: "border-l-slate-400" },
  NO_SHOW: { label: "No presentado", tone: "danger", border: "border-l-critical" },
  CANCELLED: { label: "Cancelada", tone: "neutral", border: "border-l-slate-300" },
};

export interface AppointmentCardData {
  id: string;
  patientName: string;
  doctorName: string;
  treatmentType: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  highRisk?: boolean;
}

export function AppointmentCard({
  appointment,
  onClick,
  draggable,
  onDragStart,
}: {
  appointment: AppointmentCardData;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
}) {
  const meta = APPOINTMENT_STATUS_META[appointment.status];
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", appointment.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-slate-200 border-l-4 bg-white p-2.5 text-left shadow-sm transition hover:shadow",
        meta.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-slate-900">{appointment.patientName}</p>
        {appointment.highRisk ? <AlertTriangle className="h-4 w-4 shrink-0 text-critical" aria-label="Alerta médica" /> : null}
      </div>
      <p className="mt-0.5 truncate text-xs text-slate-600">{appointment.treatmentType}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock className="h-3 w-3" />
          {appointment.startTime}–{appointment.endTime}
        </span>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
    </button>
  );
}

export interface CabinetColumn {
  id: string;
  name: string;
  colorCode?: string;
}

export function MultiCabinetTimeline({
  cabinets,
  slots,
  appointmentsByCabinet,
  onSelectAppointment,
  onSelectSlot,
  onMoveAppointment,
}: {
  cabinets: CabinetColumn[];
  slots: string[];
  appointmentsByCabinet: Record<string, AppointmentCardData[]>;
  onSelectAppointment?: (appointment: AppointmentCardData) => void;
  onSelectSlot?: (cabinetId: string, slot: string) => void;
  onMoveAppointment?: (appointmentId: string, targetCabinetId: string, targetSlot: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="min-w-[680px]">
        <div
          className="grid border-b border-slate-200 bg-slate-50"
          style={{ gridTemplateColumns: `80px repeat(${Math.max(1, cabinets.length)}, minmax(180px, 1fr))` }}
        >
          <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Hora</div>
          {cabinets.map((cab) => (
            <div key={cab.id} className="flex items-center gap-2 border-l border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cab.colorCode ?? "#0D9488" }} />
              {cab.name}
            </div>
          ))}
        </div>
        {slots.map((slot) => (
          <div
            key={slot}
            className="grid border-b border-slate-100 last:border-b-0"
            style={{ gridTemplateColumns: `80px repeat(${Math.max(1, cabinets.length)}, minmax(180px, 1fr))` }}
          >
            <div className="px-3 py-3 text-xs font-medium tabular-nums text-slate-500">{slot}</div>
            {cabinets.map((cab) => {
              const items = (appointmentsByCabinet[cab.id] ?? []).filter((a) => a.startTime === slot);
              const cellKey = `${cab.id}-${slot}`;
              const isDropHover = hoverTarget === cellKey;
              return (
                <div
                  key={cellKey}
                  onClick={() => {
                    if (items.length === 0) onSelectSlot?.(cab.id, slot);
                  }}
                  onDragOver={(e) => {
                    if (!onMoveAppointment) return;
                    e.preventDefault();
                    if (hoverTarget !== cellKey) setHoverTarget(cellKey);
                  }}
                  onDragLeave={() => {
                    if (hoverTarget === cellKey) setHoverTarget(null);
                  }}
                  onDrop={(e) => {
                    if (!onMoveAppointment) return;
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain") || draggedId;
                    setHoverTarget(null);
                    setDraggedId(null);
                    if (id) onMoveAppointment(id, cab.id, slot);
                  }}
                  className={cn(
                    "min-h-[60px] space-y-1 border-l border-slate-100 p-1.5 transition-colors",
                    items.length === 0 && onSelectSlot && "cursor-pointer hover:bg-brand-50/40",
                    isDropHover && "bg-brand-100/60 ring-2 ring-inset ring-brand-400",
                  )}
                >
                  {items.map((item) => (
                    <AppointmentCard
                      key={item.id}
                      appointment={item}
                      draggable={Boolean(onMoveAppointment)}
                      onDragStart={() => setDraggedId(item.id)}
                      onClick={() => onSelectAppointment?.(item)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WaitingListCandidateCard({
  patientName,
  phone,
  treatmentType,
  durationMinutes,
  urgencyLevel,
  matchScore,
  onOfferWhatsApp,
}: {
  patientName: string;
  phone: string;
  treatmentType: string;
  durationMinutes: number;
  urgencyLevel: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  matchScore: number;
  onOfferWhatsApp?: () => void;
}) {
  const urgencyTone: Record<string, Tone> = {
    LOW: "neutral",
    NORMAL: "info",
    HIGH: "warning",
    URGENT: "danger",
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{patientName}</p>
          <Badge tone={urgencyTone[urgencyLevel] ?? "neutral"}>{urgencyLevel}</Badge>
          <Badge tone="success">{matchScore}% match</Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {treatmentType} · {durationMinutes} min · {phone}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${phone}`}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          <Phone className="h-3.5 w-3.5" />
          Llamar
        </a>
        {onOfferWhatsApp ? (
          <Button size="sm" onClick={onOfferWhatsApp}>
            <MessageCircle className="h-3.5 w-3.5" />
            Ofertar WhatsApp
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export interface ClinicalTimelineEntry {
  id: string;
  entryType: "NOTE" | "DIAGNOSIS" | "PROCEDURE" | "PRESCRIPTION";
  content: string;
  doctorName: string;
  licenseNumber?: string;
  createdAt: string;
  amendsEntryId?: string;
}

export function ClinicalHistoryTimeline({ entries }: { entries: ClinicalTimelineEntry[] }) {
  const typeTone: Record<ClinicalTimelineEntry["entryType"], Tone> = {
    NOTE: "neutral",
    DIAGNOSIS: "warning",
    PROCEDURE: "info",
    PRESCRIPTION: "success",
  };

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={typeTone[entry.entryType]}>{entry.entryType}</Badge>
              {entry.amendsEntryId ? <Badge tone="warning">Addenda</Badge> : null}
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                Inmutable
              </span>
            </div>
            <time className="text-xs tabular-nums text-slate-500">{entry.createdAt}</time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{entry.content}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <UserCheck className="h-3.5 w-3.5" />
            {entry.doctorName}
            {entry.licenseNumber ? ` · Col. ${entry.licenseNumber}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  toothNumber?: string;
  quantity: number;
  unitPriceCents: number;
  taxRatePercent: number;
}

export function InvoiceLineEditor({
  lines,
  currency = "USD",
  onChange,
}: {
  lines: InvoiceLineItem[];
  currency?: string;
  onChange: (next: InvoiceLineItem[]) => void;
}) {
  function updateLine(id: string, patch: Partial<InvoiceLineItem>) {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addLine() {
    onChange([
      ...lines,
      {
        id: `${Date.now()}`,
        description: "",
        toothNumber: "",
        quantity: 1,
        unitPriceCents: 0,
        taxRatePercent: 0,
      },
    ]);
  }

  const totals = lines.reduce(
    (acc, line) => {
      const sub = line.quantity * line.unitPriceCents;
      const tax = Math.round((sub * line.taxRatePercent) / 100);
      return { subtotal: acc.subtotal + sub, tax: acc.tax + tax, total: acc.total + sub + tax };
    },
    { subtotal: 0, tax: 0, total: 0 },
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Concepto</th>
              <th className="px-3 py-2">Pieza</th>
              <th className="px-3 py-2">Cant.</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">IVA %</th>
              <th className="px-3 py-2 text-right">Importe</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line) => {
              const rowTotal = Math.round(line.quantity * line.unitPriceCents * (1 + line.taxRatePercent / 100));
              return (
                <tr key={line.id}>
                  <td className="p-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(line.id, { description: e.target.value })}
                      placeholder="Tratamiento"
                      className="min-h-[38px] w-full rounded-md border border-slate-300 px-2.5 text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={line.toothNumber ?? ""}
                      onChange={(e) => updateLine(line.id, { toothNumber: e.target.value })}
                      placeholder="16"
                      className="min-h-[38px] w-16 rounded-md border border-slate-300 px-2 text-sm tabular-nums"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                      className="min-h-[38px] w-16 rounded-md border border-slate-300 px-2 text-sm tabular-nums"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={(line.unitPriceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        updateLine(line.id, { unitPriceCents: Math.round((Number(e.target.value) || 0) * 100) })
                      }
                      className="min-h-[38px] w-24 rounded-md border border-slate-300 px-2 text-sm tabular-nums"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={line.taxRatePercent}
                      onChange={(e) => updateLine(line.id, { taxRatePercent: Math.max(0, Number(e.target.value) || 0) })}
                      className="min-h-[38px] w-16 rounded-md border border-slate-300 px-2 text-sm tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                    {formatMoney(rowTotal, currency)}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      aria-label="Eliminar línea"
                      onClick={() => onChange(lines.filter((l) => l.id !== line.id))}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-critical"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={addLine}>
          Añadir partida
        </Button>
        <dl className="flex flex-wrap gap-6 text-sm tabular-nums">
          <div>
            <dt className="text-xs text-slate-500">Base</dt>
            <dd className="font-medium text-slate-800">{formatMoney(totals.subtotal, currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Impuestos</dt>
            <dd className="font-medium text-slate-800">{formatMoney(totals.tax, currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Total</dt>
            <dd className="text-base font-semibold text-slate-900">{formatMoney(totals.total, currency)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function QRVerifierBlock({
  documentNumber,
  verificationHash,
  verificationUrl,
  onDownloadPdf,
}: {
  documentNumber: string;
  verificationHash: string;
  verificationUrl?: string;
  onDownloadPdf?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
          <QrCode className="h-9 w-9" />
        </div>
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-confirmed" />
            Documento {documentNumber}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500">Hash: {verificationHash}</p>
          {verificationUrl ? (
            <a href={verificationUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
              Verificar autenticidad
            </a>
          ) : null}
        </div>
      </div>
      {onDownloadPdf ? (
        <Button variant="outline" size="sm" onClick={onDownloadPdf}>
          Descargar PDF
        </Button>
      ) : null}
    </div>
  );
}
