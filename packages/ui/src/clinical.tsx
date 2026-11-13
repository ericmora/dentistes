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
  caries: "#DC2626",
  restored: "#2563EB",
  planned: "#16A34A",
  missing: "#475569",
};

export function ToothSurfaceRenderer({
  tooth,
  selected,
  isUpper = true,
  onSelectSurface,
  onSelectTooth,
}: {
  tooth: ToothState;
  selected?: boolean;
  isUpper?: boolean;
  onSelectSurface?: (toothNumber: number, surface: ToothSurfaceName) => void;
  onSelectTooth?: (toothNumber: number) => void;
}) {
  const isMissing = tooth.general_status === "missing";
  const isEndo = tooth.general_status === "endodontics";
  const isCrown = tooth.general_status === "crown";
  const isImplant = tooth.general_status === "implant";

  const fillOf = (s: ToothSurfaceName) =>
    isMissing ? SURFACE_COLORS.missing : SURFACE_COLORS[tooth.surfaces[s] ?? "healthy"];

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border p-1 transition select-none",
        selected ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-300" : "border-slate-200 bg-white hover:border-slate-300",
        isMissing && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => onSelectTooth?.(tooth.tooth_number)}
        className={cn(
          "mb-1 text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded transition",
          selected ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100",
        )}
      >
        {tooth.tooth_number}
      </button>

      <svg viewBox="0 0 60 60" className="h-10 w-10 sm:h-11 sm:w-11 touch-manipulation" role="img" aria-label={`Pieza ${tooth.tooth_number}`}>
        {/* Top surface: Vestibular (upper) or Lingual (lower) */}
        <polygon
          points="5,5 55,5 42,18 18,18"
          fill={fillOf("vestibular")}
          stroke="#475569"
          strokeWidth="1.2"
          className="cursor-pointer transition hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "vestibular")}
        >
          <title>{isUpper ? "Vestibular" : "Lingual"}</title>
        </polygon>

        {/* Bottom surface: Palatino (upper) or Vestibular (lower) */}
        <polygon
          points="18,42 42,42 55,55 5,55"
          fill={fillOf("lingual")}
          stroke="#475569"
          strokeWidth="1.2"
          className="cursor-pointer transition hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "lingual")}
        >
          <title>{isUpper ? "Palatino" : "Vestibular"}</title>
        </polygon>

        {/* Left surface: Mesial / Distal */}
        <polygon
          points="5,5 18,18 18,42 5,55"
          fill={fillOf("mesial")}
          stroke="#475569"
          strokeWidth="1.2"
          className="cursor-pointer transition hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "mesial")}
        >
          <title>Mesial</title>
        </polygon>

        {/* Right surface: Distal / Mesial */}
        <polygon
          points="55,5 55,55 42,42 42,18"
          fill={fillOf("distal")}
          stroke="#475569"
          strokeWidth="1.2"
          className="cursor-pointer transition hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "distal")}
        >
          <title>Distal</title>
        </polygon>

        {/* Occlusal / Incisal center */}
        <rect
          x="18"
          y="18"
          width="24"
          height="24"
          fill={fillOf("occlusal")}
          stroke="#475569"
          strokeWidth="1.2"
          className="cursor-pointer transition hover:opacity-80"
          onClick={() => onSelectSurface?.(tooth.tooth_number, "occlusal")}
        >
          <title>Oclusal / Incisal</title>
        </rect>

        {/* Standard Treatment Drawings */}

        {/* Endodoncia: conducto radicular vertical en rojo o azul */}
        {isEndo ? (
          <g className="pointer-events-none">
            <line x1="30" y1="6" x2="30" y2="54" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            <line x1="24" y1="20" x2="36" y2="20" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="26" y1="30" x2="34" y2="30" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="27" y1="40" x2="33" y2="40" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="50" r="3" fill="#DC2626" />
          </g>
        ) : null}

        {/* Corona / Funda: contorno circular dorado exterior */}
        {isCrown ? (
          <g className="pointer-events-none">
            <circle cx="30" cy="30" r="27" fill="none" stroke="#D97706" strokeWidth="3" />
            <circle cx="30" cy="30" r="24" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="3 2" />
          </g>
        ) : null}

        {/* Implante: tornillo osteointegrado de titanio */}
        {isImplant ? (
          <g className="pointer-events-none">
            <rect x="23" y="10" width="14" height="40" rx="3" fill="#334155" stroke="#0F172A" strokeWidth="1" />
            <line x1="20" y1="18" x2="40" y2="18" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="26" x2="40" y2="26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="34" x2="40" y2="34" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="42" x2="40" y2="42" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <polygon points="26,14 30,10 34,14 30,18" fill="#F8FAFC" />
          </g>
        ) : null}

        {/* Ausente / Extracción: gran cruz roja 'X' */}
        {isMissing ? (
          <g className="pointer-events-none">
            <line x1="6" y1="6" x2="54" y2="54" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="54" y1="6" x2="6" y2="54" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

const ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const ADULT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const ADULT_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const CHILD_UPPER_RIGHT = [55, 54, 53, 52, 51];
const CHILD_UPPER_LEFT = [61, 62, 63, 64, 65];
const CHILD_LOWER_RIGHT = [85, 84, 83, 82, 81];
const CHILD_LOWER_LEFT = [71, 72, 73, 74, 75];

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

export type OdontogramActiveTool = ToothSurfaceStatus | "endodontics" | "crown" | "implant" | "general_missing" | "general_present";

export function OdontogramGrid({
  teeth,
  dentition = "adult",
  onDentitionChange,
  activeTool = "caries",
  onToolChange,
  onToggleSurface,
  onSetGeneralStatus,
  selectedTooth,
  onSelectTooth,
}: {
  teeth: Record<number, ToothState>;
  dentition?: "adult" | "child";
  onDentitionChange?: (d: "adult" | "child") => void;
  activeTool?: OdontogramActiveTool;
  onToolChange?: (tool: OdontogramActiveTool) => void;
  onToggleSurface?: (toothNumber: number, surface: ToothSurfaceName, nextStatus: ToothSurfaceStatus) => void;
  onSetGeneralStatus?: (toothNumber: number, status: NonNullable<ToothState["general_status"]>) => void;
  selectedTooth?: number;
  onSelectTooth?: (toothNumber: number) => void;
}) {
  const upperRight = dentition === "adult" ? ADULT_UPPER_RIGHT : CHILD_UPPER_RIGHT;
  const upperLeft = dentition === "adult" ? ADULT_UPPER_LEFT : CHILD_UPPER_LEFT;
  const lowerRight = dentition === "adult" ? ADULT_LOWER_RIGHT : CHILD_LOWER_RIGHT;
  const lowerLeft = dentition === "adult" ? ADULT_LOWER_LEFT : CHILD_LOWER_LEFT;

  const surfaceTools: Array<{ key: OdontogramActiveTool; label: string; dot: string }> = [
    { key: "caries", label: "Caries / Patología", dot: "bg-red-600" },
    { key: "restored", label: "Obturación / Empaste", dot: "bg-blue-600" },
    { key: "planned", label: "Tratamiento planificado", dot: "bg-emerald-600" },
    { key: "healthy", label: "Superficie sana", dot: "border border-slate-300 bg-white" },
  ];

  const generalTools: Array<{ key: OdontogramActiveTool; label: string; badge: string; status: NonNullable<ToothState["general_status"]> }> = [
    { key: "endodontics", label: "Endodoncia", badge: "border-red-500 text-red-700 bg-red-50", status: "endodontics" },
    { key: "crown", label: "Corona / Funda", badge: "border-amber-500 text-amber-700 bg-amber-50", status: "crown" },
    { key: "implant", label: "Implante", badge: "border-slate-700 text-slate-800 bg-slate-100", status: "implant" },
    { key: "general_missing", label: "Pieza ausente", badge: "border-slate-500 text-slate-700 bg-slate-50", status: "missing" },
    { key: "general_present", label: "Diente normal", badge: "border-slate-300 text-slate-600 bg-white", status: "present" },
  ];

  function handleToothClick(num: number) {
    onSelectTooth?.(num);
    const tool = generalTools.find((g) => g.key === activeTool);
    if (tool && onSetGeneralStatus) {
      onSetGeneralStatus(num, tool.status);
    }
  }

  function handleSurfaceClick(toothNum: number, surface: ToothSurfaceName) {
    onSelectTooth?.(toothNum);
    const state = teeth[toothNum] ?? emptyTooth(toothNum);
    // If active tool is a surface tool
    if (activeTool === "caries" || activeTool === "restored" || activeTool === "planned" || activeTool === "healthy") {
      const current = state.surfaces[surface];
      const next = current === activeTool ? "healthy" : activeTool;
      onToggleSurface?.(toothNum, surface, next);
    } else {
      // If a general tool is selected, clicking any surface applies that general status to the tooth
      const tool = generalTools.find((g) => g.key === activeTool);
      if (tool && onSetGeneralStatus) {
        onSetGeneralStatus(toothNum, tool.status);
      }
    }
  }

  return (
    <div className="space-y-5">
      {/* Tool Palette */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Herramienta:</span>
          {surfaceTools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => onToolChange?.(tool.key)}
              className={cn(
                "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                activeTool === tool.key
                  ? "border-brand-600 bg-brand-50 text-brand-800 font-semibold shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", tool.dot)} />
              {tool.label}
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-slate-200" />
          {generalTools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => {
                onToolChange?.(tool.key);
                if (selectedTooth && onSetGeneralStatus) {
                  onSetGeneralStatus(selectedTooth, tool.status);
                }
              }}
              className={cn(
                "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                activeTool === tool.key
                  ? "border-brand-600 bg-brand-50 text-brand-800 font-semibold shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <span className={cn("inline-block rounded px-1 text-[10px] font-bold border", tool.badge)}>
                {tool.label}
              </span>
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
                "min-h-[34px] rounded-md px-3 text-xs font-medium transition",
                dentition === mode ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:text-slate-900",
              )}
            >
              {mode === "adult" ? "Adulto (32 piezas)" : "Infantil (20 piezas)"}
            </button>
          ))}
        </div>
      </div>

      {/* Anatomical Mouth Layout: Upper and Lower Arches */}
      <div className="space-y-6 overflow-x-auto pb-2">
        {/* Arcada Superior (Maxilar) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-600" />
              Arcada Superior (Maxilar) · Cuadrante 1 (Derecha)
            </span>
            <span className="rounded bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Vestibular ↑ / Palatino ↓
            </span>
            <span>Cuadrante 2 (Izquierda)</span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Quadrant 1 (18..11) */}
            <div className="flex gap-1 sm:gap-1.5">
              {upperRight.map((num) => (
                <ToothSurfaceRenderer
                  key={num}
                  tooth={teeth[num] ?? emptyTooth(num)}
                  selected={selectedTooth === num}
                  isUpper={true}
                  onSelectTooth={handleToothClick}
                  onSelectSurface={handleSurfaceClick}
                />
              ))}
            </div>

            {/* Central Midline Divider */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="h-16 w-0.5 rounded bg-brand-500" />
              <span className="text-[9px] font-bold uppercase text-brand-700">Línea media</span>
              <div className="h-16 w-0.5 rounded bg-brand-500" />
            </div>

            {/* Quadrant 2 (21..28) */}
            <div className="flex gap-1 sm:gap-1.5">
              {upperLeft.map((num) => (
                <ToothSurfaceRenderer
                  key={num}
                  tooth={teeth[num] ?? emptyTooth(num)}
                  selected={selectedTooth === num}
                  isUpper={true}
                  onSelectTooth={handleToothClick}
                  onSelectSurface={handleSurfaceClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Arcada Inferior (Mandíbula) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-700" />
              Arcada Inferior (Mandíbula) · Cuadrante 4 (Derecha)
            </span>
            <span className="rounded bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Lingual ↑ / Vestibular ↓
            </span>
            <span>Cuadrante 3 (Izquierda)</span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Quadrant 4 (48..41) */}
            <div className="flex gap-1 sm:gap-1.5">
              {lowerRight.map((num) => (
                <ToothSurfaceRenderer
                  key={num}
                  tooth={teeth[num] ?? emptyTooth(num)}
                  selected={selectedTooth === num}
                  isUpper={false}
                  onSelectTooth={handleToothClick}
                  onSelectSurface={handleSurfaceClick}
                />
              ))}
            </div>

            {/* Central Midline Divider */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="h-16 w-0.5 rounded bg-brand-500" />
              <span className="text-[9px] font-bold uppercase text-brand-700">Línea media</span>
              <div className="h-16 w-0.5 rounded bg-brand-500" />
            </div>

            {/* Quadrant 3 (31..38) */}
            <div className="flex gap-1 sm:gap-1.5">
              {lowerLeft.map((num) => (
                <ToothSurfaceRenderer
                  key={num}
                  tooth={teeth[num] ?? emptyTooth(num)}
                  selected={selectedTooth === num}
                  isUpper={false}
                  onSelectTooth={handleToothClick}
                  onSelectSurface={handleSurfaceClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Convención visual clínica:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-600" /> Caries (Superficie)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-600" /> Empaste / Obturación
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-600" /> Planificado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-red-600 font-bold">|</span> Endodoncia (Conducto)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-amber-600" /> Corona
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-2 bg-slate-800 rounded-xs" /> Implante
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-red-600 font-extrabold text-sm leading-none">✕</span> Ausente / Extracción
        </span>
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
