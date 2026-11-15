import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Layers,
  Lock,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  QrCode,
  ShieldAlert,
  Sparkles,
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
  compact = false,
}: {
  alerts?: MedicalAlertsData | null;
  summaryText?: string;
  hideDetails?: boolean;
  compact?: boolean;
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

  if (compact) {
    return (
      <div
        role="region"
        aria-label="Alertas médicas críticas"
        className="rounded-lg border border-critical/80 bg-red-50/95 px-3 py-1.5 text-red-950 shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded bg-critical px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <ShieldAlert className="h-3 w-3" />
              Alerta médica
            </span>
            <span className="font-semibold text-red-900">
              {summaryText ||
                (hideDetails
                  ? "Paciente con alerta médica crítica."
                  : [
                      allergies.length > 0
                        ? `Alergias: ${allergies.map((a) => (typeof a === "string" ? a : a.name)).join(", ")}`
                        : null,
                      conditions.length > 0
                        ? `Patologías: ${conditions.map((c) => (typeof c === "string" ? c : c.name)).join(", ")}`
                        : null,
                      medications.length > 0
                        ? `Medicación: ${medications.map((m) => (typeof m === "string" ? m : m.name)).join(", ")}`
                        : null,
                      alerts?.requires_antibiotic_prophylaxis ? "Profilaxis ATB" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Riesgo clínico alto")}
            </span>
          </div>
          {!hideDetails && (allergies.length > 0 || conditions.length > 0 || medications.length > 0 || alerts?.notes) ? (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-red-800 hover:bg-red-100"
            >
              {expanded ? "Ocultar" : "Detalle"}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          ) : null}
        </div>
        {expanded && !hideDetails ? (
          <div className="mt-1.5 grid gap-2 border-t border-red-200/80 pt-1.5 text-[11px] sm:grid-cols-3">
            {allergies.length > 0 ? (
              <div>
                <span className="font-bold text-red-800">Alergias: </span>
                {allergies.map((a) => (typeof a === "string" ? a : a.name)).join(", ")}
              </div>
            ) : null}
            {conditions.length > 0 ? (
              <div>
                <span className="font-bold text-red-800">Antecedentes: </span>
                {conditions.map((c) => (typeof c === "string" ? c : c.name)).join(", ")}
              </div>
            ) : null}
            {medications.length > 0 ? (
              <div>
                <span className="font-bold text-red-800">Medicación: </span>
                {medications.map((m) => (typeof m === "string" ? m : m.name)).join(", ")}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

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

export function getFdiToothInfo(toothNum: number): {
  number: number;
  name: string;
  quadrantName: string;
  quadrant: number;
  arch: "upper" | "lower";
  side: "right" | "left";
  category: "incisor" | "canine" | "premolar" | "molar";
  isPediatric: boolean;
} {
  const q = Math.floor(toothNum / 10);
  const pos = toothNum % 10;
  const isPediatric = q >= 5 && q <= 8;
  const arch: "upper" | "lower" = q === 1 || q === 2 || q === 5 || q === 6 ? "upper" : "lower";
  const side: "right" | "left" = q === 1 || q === 4 || q === 5 || q === 8 ? "right" : "left";

  let quadrantName = "";
  if (q === 1) quadrantName = "Cuadrante 1 (Superior Derecho)";
  else if (q === 2) quadrantName = "Cuadrante 2 (Superior Izquierdo)";
  else if (q === 3) quadrantName = "Cuadrante 3 (Inferior Izquierdo)";
  else if (q === 4) quadrantName = "Cuadrante 4 (Inferior Derecho)";
  else if (q === 5) quadrantName = "Cuadrante 5 (Temporal Sup. Derecho)";
  else if (q === 6) quadrantName = "Cuadrante 6 (Temporal Sup. Izquierdo)";
  else if (q === 7) quadrantName = "Cuadrante 7 (Temporal Inf. Izquierdo)";
  else if (q === 8) quadrantName = "Cuadrante 8 (Temporal Inf. Derecho)";

  let category: "incisor" | "canine" | "premolar" | "molar" = "incisor";
  let name = `Pieza ${toothNum}`;

  if (!isPediatric) {
    if (pos === 1) {
      category = "incisor";
      name = `Incisivo central ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 2) {
      category = "incisor";
      name = `Incisivo lateral ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 3) {
      category = "canine";
      name = `Canino ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 4) {
      category = "premolar";
      name = `Primer premolar ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 5) {
      category = "premolar";
      name = `Segundo premolar ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 6) {
      category = "molar";
      name = `Primer molar ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 7) {
      category = "molar";
      name = `Segundo molar ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 8) {
      category = "molar";
      name = `Tercer molar (muela del juicio) ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    }
  } else {
    if (pos === 1) {
      category = "incisor";
      name = `Incisivo central temporal ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 2) {
      category = "incisor";
      name = `Incisivo lateral temporal ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 3) {
      category = "canine";
      name = `Canino temporal ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 4) {
      category = "molar";
      name = `Primer molar temporal ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    } else if (pos === 5) {
      category = "molar";
      name = `Segundo molar temporal ${arch === "upper" ? "superior" : "inferior"} ${side === "right" ? "derecho" : "izquierdo"}`;
    }
  }

  return {
    number: toothNum,
    name,
    quadrantName,
    quadrant: q,
    arch,
    side,
    category,
    isPediatric,
  };
}

export type OdontogramDisplayMode = "surfaces" | "anatomical";

export function ToothSurfaceRenderer({
  tooth,
  selected,
  isUpper = true,
  compact = false,
  displayMode = "surfaces",
  historyCount,
  onSelectSurface,
  onSelectTooth,
}: {
  tooth: ToothState;
  selected?: boolean;
  isUpper?: boolean;
  compact?: boolean;
  displayMode?: OdontogramDisplayMode;
  historyCount?: number;
  onSelectSurface?: (toothNumber: number, surface: ToothSurfaceName) => void;
  onSelectTooth?: (toothNumber: number) => void;
}) {
  const isMissing = tooth.general_status === "missing";
  const isEndo = tooth.general_status === "endodontics";
  const isCrown = tooth.general_status === "crown";
  const isImplant = tooth.general_status === "implant";

  const info = getFdiToothInfo(tooth.tooth_number);
  const category = info.category;

  const tNum = tooth.tooth_number;
  const fillOf = (s: ToothSurfaceName) => {
    if (isMissing) return SURFACE_COLORS.missing;
    const st = tooth.surfaces[s] ?? "healthy";
    if (st === "caries") return `url(#caries-grad-${tNum})`;
    if (st === "restored") return `url(#comp-grad-${tNum})`;
    if (st === "planned") return `url(#plan-grad-${tNum})`;
    return `url(#enamel-grad-${tNum})`;
  };

  return (
    <div
      onClick={() => onSelectTooth?.(tooth.tooth_number)}
      className={cn(
        "group flex flex-col items-center border transition-all select-none cursor-pointer",
        compact ? "rounded-lg p-0.5 sm:p-1" : "rounded-xl p-1.5",
        selected
          ? "border-brand-600 bg-brand-50/90 ring-2 ring-brand-500 shadow-xs"
          : "border-slate-200/90 bg-white hover:border-brand-400 hover:bg-slate-50/80 shadow-2xs",
        isMissing && "opacity-50",
      )}
    >
      {/* Lower arch has tooth number button at the top */}
      {!isUpper ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTooth?.(tooth.tooth_number);
          }}
          className={cn(
            "flex items-center justify-center gap-0.5 rounded font-bold tabular-nums transition",
            compact ? "mb-0.5 px-1 py-0 text-[10px]" : "mb-1 rounded-md px-1.5 py-0.5 text-[11px] gap-1",
            selected ? "bg-brand-600 text-white shadow-2xs" : "text-slate-700 hover:bg-slate-100",
          )}
          title={`${tooth.tooth_number} · ${info.name}`}
        >
          <span>{tooth.tooth_number}</span>
          {typeof historyCount === "number" && historyCount > 0 ? (
            <span
              className={cn(
                "flex items-center justify-center rounded-full font-extrabold",
                compact ? "h-3 w-3 text-[8px]" : "h-3.5 w-3.5 text-[9px]",
                selected ? "bg-white text-brand-700" : "bg-brand-600 text-white",
              )}
              title={`${historyCount} evoluciones registradas para esta pieza`}
            >
              {historyCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {/* SVG Canvas (60 x 78): Crown Surface + Anatomical Roots */}
      <svg
        viewBox="0 0 60 78"
        data-display-mode={displayMode}
        className={cn(
          "touch-manipulation transition-transform group-hover:scale-[1.02]",
          compact ? "h-10 w-8 sm:h-11 sm:w-9 xl:h-12 xl:w-9" : "h-14 w-11 sm:h-16 sm:w-12",
        )}
        role="img"
        aria-label={`Pieza ${tooth.tooth_number} - ${info.name}`}
      >
        <defs>
          <radialGradient id={`caries-grad-${tNum}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7F1D1D" />
            <stop offset="60%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>
          <linearGradient id={`comp-grad-${tNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="40%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id={`plan-grad-${tNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id={`impl-grad-${tNum}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="25%" stopColor="#475569" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="75%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id={`gold-grad-${tNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id={`enamel-grad-${tNum}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="80%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>
        {isUpper ? (
          /* UPPER ARCH: ROOTS AT TOP (y: 2..24), CROWN AT BOTTOM (y: 26..74) */
          <g>
            {/* Natural Roots or Implant */}
            {isImplant ? (
              <g className="pointer-events-none">
                <rect x="22" y="2" width="16" height="22" rx="2" fill="#334155" stroke="#0F172A" strokeWidth="1" />
                <line x1="20" y1="6" x2="40" y2="6" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="11" x2="40" y2="11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="16" x2="40" y2="16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="21" x2="40" y2="21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <polygon points="26,6 30,2 34,6" fill="#F8FAFC" />
              </g>
            ) : (
              <g className="pointer-events-none">
                {category === "molar" ? (
                  /* 3 Upper Molar Roots */
                  <g>
                    <path d="M 12 24 C 11 15, 8 8, 12 2 C 16 2, 18 10, 20 24 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    <path d="M 25 24 C 26 12, 27 6, 30 2 C 33 6, 34 12, 35 24 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    <path d="M 40 24 C 42 10, 44 2, 48 2 C 52 8, 49 15, 48 24 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    {isEndo ? (
                      <g>
                        <line x1="12" y1="24" x2="12" y2="4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <line x1="30" y1="24" x2="30" y2="3" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <line x1="48" y1="24" x2="48" y2="4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="4" r="1.5" fill="#DC2626" />
                        <circle cx="30" cy="3" r="1.5" fill="#DC2626" />
                        <circle cx="48" cy="4" r="1.5" fill="#DC2626" />
                      </g>
                    ) : null}
                  </g>
                ) : category === "premolar" ? (
                  /* 2 Upper Premolar Roots */
                  <g>
                    <path d="M 16 24 C 15 14, 16 6, 21 2 C 25 2, 26 10, 27 24 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    <path d="M 33 24 C 34 10, 35 2, 39 2 C 44 6, 45 14, 44 24 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    {isEndo ? (
                      <g>
                        <line x1="21" y1="24" x2="21" y2="3" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <line x1="39" y1="24" x2="39" y2="3" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="21" cy="3" r="1.5" fill="#DC2626" />
                        <circle cx="39" cy="3" r="1.5" fill="#DC2626" />
                      </g>
                    ) : null}
                  </g>
                ) : (
                  /* Single Incisor / Canine Root */
                  <g>
                    <path d="M 20 24 C 22 12, 24 3, 30 2 C 36 3, 38 12, 40 24 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    {isEndo ? (
                      <g>
                        <line x1="30" y1="24" x2="30" y2="3" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="30" cy="3" r="2" fill="#DC2626" />
                      </g>
                    ) : null}
                  </g>
                )}
              </g>
            )}

            {/* Crown Surfaces (5 faces or Anatomical Profile) */}
            {displayMode === "anatomical" ? (
              <g>
                {/* Base Anatomical Crown Contour */}
                <path
                  d={
                    category === "molar"
                      ? "M 7 26 C 5 40, 6 66, 13 73 C 20 71, 25 74, 30 70 C 35 74, 40 71, 47 73 C 54 66, 55 40, 53 26 Z"
                      : category === "canine"
                      ? "M 12 26 C 10 44, 15 64, 30 74 C 45 64, 50 44, 48 26 Z"
                      : category === "premolar"
                      ? "M 10 26 C 8 42, 10 66, 20 73 C 26 70, 34 70, 40 73 C 50 66, 52 42, 50 26 Z"
                      : "M 12 26 C 10 42, 11 66, 16 72 L 44 72 C 49 66, 50 42, 48 26 Z"
                  }
                  fill={isCrown ? `url(#gold-grad-${tNum})` : `url(#enamel-grad-${tNum})`}
                  stroke="#334155"
                  strokeWidth="1.4"
                />
                {/* Cervical / Palatino Zone */}
                <path
                  data-anatomical-zone="lingual"
                  d="M 11 26 L 49 26 L 44 35 L 16 35 Z"
                  fill={fillOf("lingual")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "lingual");
                  }}
                >
                  <title>Palatino (Perfil Anatómico)</title>
                </path>
                {/* Mesial Flank Zone */}
                <path
                  data-anatomical-zone="mesial"
                  d="M 10 28 L 20 35 L 20 61 L 12 68 C 7 58, 7 38, 10 28 Z"
                  fill={fillOf("mesial")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "mesial");
                  }}
                >
                  <title>Mesial (Perfil Anatómico)</title>
                </path>
                {/* Distal Flank Zone */}
                <path
                  data-anatomical-zone="distal"
                  d="M 50 28 C 53 38, 53 58, 48 68 L 40 61 L 40 35 Z"
                  fill={fillOf("distal")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "distal");
                  }}
                >
                  <title>Distal (Perfil Anatómico)</title>
                </path>
                {/* Vestibular Frontal Face Zone */}
                <rect
                  data-anatomical-zone="vestibular"
                  x="20"
                  y="35"
                  width="20"
                  height="26"
                  rx="4"
                  fill={fillOf("vestibular")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "vestibular");
                  }}
                >
                  <title>Vestibular (Perfil Anatómico)</title>
                </rect>
                {/* Occlusal / Incisal Cusp Zone */}
                <path
                  data-anatomical-zone="occlusal"
                  d="M 12 61 L 48 61 L 45 71 C 38 74, 22 74, 15 71 Z"
                  fill={fillOf("occlusal")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "occlusal");
                  }}
                >
                  <title>Oclusal / Incisal (Perfil Anatómico)</title>
                </path>
              </g>
            ) : (
              <g>
                <polygon
                  points="6,26 54,26 42,38 18,38"
                  fill={fillOf("vestibular")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "vestibular");
                  }}
                >
                  <title>Vestibular</title>
                </polygon>

                <polygon
                  points="18,62 42,62 54,74 6,74"
                  fill={fillOf("lingual")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "lingual");
                  }}
                >
                  <title>Palatino</title>
                </polygon>

                <polygon
                  points="6,26 18,38 18,62 6,74"
                  fill={fillOf("mesial")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "mesial");
                  }}
                >
                  <title>Mesial</title>
                </polygon>

                <polygon
                  points="54,26 54,74 42,62 42,38"
                  fill={fillOf("distal")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "distal");
                  }}
                >
                  <title>Distal</title>
                </polygon>

                <rect
                  x="18"
                  y="38"
                  width="24"
                  height="24"
                  fill={fillOf("occlusal")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "occlusal");
                  }}
                >
                  <title>Oclusal / Incisal</title>
                </rect>
              </g>
            )}

            {/* Overlays: Crown or Missing */}
            {isCrown ? (
              <g className="pointer-events-none">
                <rect x="4" y="24" width="52" height="52" rx="26" fill="none" stroke="#D97706" strokeWidth="2.5" />
                <rect x="4" y="24" width="52" height="52" rx="26" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="3 2" />
              </g>
            ) : null}

            {isMissing ? (
              <g className="pointer-events-none">
                <line x1="6" y1="26" x2="54" y2="74" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
                <line x1="54" y1="26" x2="6" y2="74" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : null}
          </g>
        ) : (
          /* LOWER ARCH: CROWN AT TOP (y: 2..50), ROOTS AT BOTTOM (y: 52..74) */
          <g>
            {/* Crown Surfaces (5 faces or Anatomical Profile) */}
            {displayMode === "anatomical" ? (
              <g>
                {/* Base Anatomical Crown Contour */}
                <path
                  d={
                    category === "molar"
                      ? "M 7 50 C 5 36, 6 10, 13 3 C 20 5, 25 2, 30 6 C 35 2, 40 5, 47 3 C 54 10, 55 36, 53 50 Z"
                      : category === "canine"
                      ? "M 12 50 C 10 32, 15 12, 30 2 C 45 12, 50 32, 48 50 Z"
                      : category === "premolar"
                      ? "M 10 50 C 8 34, 10 10, 20 3 C 26 6, 34 6, 40 3 C 50 10, 52 34, 50 50 Z"
                      : "M 12 50 C 10 34, 11 10, 16 4 L 44 4 C 49 10, 50 34, 48 50 Z"
                  }
                  fill={isCrown ? `url(#gold-grad-${tNum})` : `url(#enamel-grad-${tNum})`}
                  stroke="#334155"
                  strokeWidth="1.4"
                />
                {/* Occlusal / Incisal Cusp Zone */}
                <path
                  data-anatomical-zone="occlusal"
                  d="M 15 5 C 22 2, 38 2, 45 5 L 48 15 L 12 15 Z"
                  fill={fillOf("occlusal")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "occlusal");
                  }}
                >
                  <title>Oclusal / Incisal (Perfil Anatómico)</title>
                </path>
                {/* Mesial Flank Zone */}
                <path
                  data-anatomical-zone="mesial"
                  d="M 12 8 L 20 15 L 20 41 L 10 48 C 7 38, 7 18, 12 8 Z"
                  fill={fillOf("mesial")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "mesial");
                  }}
                >
                  <title>Mesial (Perfil Anatómico)</title>
                </path>
                {/* Distal Flank Zone */}
                <path
                  data-anatomical-zone="distal"
                  d="M 48 8 C 53 18, 53 38, 50 48 L 40 41 L 40 15 Z"
                  fill={fillOf("distal")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "distal");
                  }}
                >
                  <title>Distal (Perfil Anatómico)</title>
                </path>
                {/* Vestibular Frontal Face Zone */}
                <rect
                  data-anatomical-zone="vestibular"
                  x="20"
                  y="15"
                  width="20"
                  height="26"
                  rx="4"
                  fill={fillOf("vestibular")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "vestibular");
                  }}
                >
                  <title>Vestibular (Perfil Anatómico)</title>
                </rect>
                {/* Cervical / Lingual Zone */}
                <path
                  data-anatomical-zone="lingual"
                  d="M 16 41 L 44 41 L 49 50 L 11 50 Z"
                  fill={fillOf("lingual")}
                  stroke="#64748B"
                  strokeWidth="0.9"
                  className="cursor-pointer transition hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "lingual");
                  }}
                >
                  <title>Lingual (Perfil Anatómico)</title>
                </path>
              </g>
            ) : (
              <g>
                <polygon
                  points="6,2 54,2 42,14 18,14"
                  fill={fillOf("lingual")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "lingual");
                  }}
                >
                  <title>Lingual</title>
                </polygon>

                <polygon
                  points="18,38 42,38 54,50 6,50"
                  fill={fillOf("vestibular")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "vestibular");
                  }}
                >
                  <title>Vestibular</title>
                </polygon>

                <polygon
                  points="6,2 18,14 18,38 6,50"
                  fill={fillOf("mesial")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "mesial");
                  }}
                >
                  <title>Mesial</title>
                </polygon>

                <polygon
                  points="54,2 54,50 42,38 42,14"
                  fill={fillOf("distal")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "distal");
                  }}
                >
                  <title>Distal</title>
                </polygon>

                <rect
                  x="18"
                  y="14"
                  width="24"
                  height="24"
                  fill={fillOf("occlusal")}
                  stroke="#475569"
                  strokeWidth="1.2"
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurface?.(tooth.tooth_number, "occlusal");
                  }}
                >
                  <title>Oclusal / Incisal</title>
                </rect>
              </g>
            )}

            {/* Overlays: Crown or Missing */}
            {isCrown ? (
              <g className="pointer-events-none">
                <rect x="4" y="0" width="52" height="52" rx="26" fill="none" stroke="#D97706" strokeWidth="2.5" />
                <rect x="4" y="0" width="52" height="52" rx="26" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="3 2" />
              </g>
            ) : null}

            {isMissing ? (
              <g className="pointer-events-none">
                <line x1="6" y1="2" x2="54" y2="50" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
                <line x1="54" y1="2" x2="6" y2="50" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : null}

            {/* Natural Roots or Implant Pointing Downwards */}
            {isImplant ? (
              <g className="pointer-events-none">
                <rect x="22" y="52" width="16" height="22" rx="2" fill="#334155" stroke="#0F172A" strokeWidth="1" />
                <line x1="20" y1="56" x2="40" y2="56" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="61" x2="40" y2="61" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="66" x2="40" y2="66" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="71" x2="40" y2="71" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <polygon points="26,70 30,74 34,70" fill="#F8FAFC" />
              </g>
            ) : (
              <g className="pointer-events-none">
                {category === "molar" ? (
                  /* 2 Lower Molar Roots */
                  <g>
                    <path d="M 14 52 C 13 60, 10 68, 14 74 C 18 74, 21 66, 23 52 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    <path d="M 37 52 C 39 66, 42 74, 46 74 C 50 68, 47 60, 46 52 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    {isEndo ? (
                      <g>
                        <line x1="14" y1="52" x2="14" y2="73" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <line x1="46" y1="52" x2="46" y2="73" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="14" cy="73" r="1.5" fill="#DC2626" />
                        <circle cx="46" cy="73" r="1.5" fill="#DC2626" />
                      </g>
                    ) : null}
                  </g>
                ) : category === "premolar" ? (
                  /* 2 Lower Premolar Roots */
                  <g>
                    <path d="M 17 52 C 16 61, 17 68, 22 74 C 26 74, 27 66, 28 52 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    <path d="M 32 52 C 33 66, 34 74, 38 74 C 43 68, 44 61, 43 52 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    {isEndo ? (
                      <g>
                        <line x1="22" y1="52" x2="22" y2="73" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <line x1="38" y1="52" x2="38" y2="73" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="22" cy="73" r="1.5" fill="#DC2626" />
                        <circle cx="38" cy="73" r="1.5" fill="#DC2626" />
                      </g>
                    ) : null}
                  </g>
                ) : (
                  /* Single Lower Incisor / Canine Root */
                  <g>
                    <path d="M 20 52 C 22 62, 24 71, 30 74 C 36 71, 38 62, 40 52 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                    {isEndo ? (
                      <g>
                        <line x1="30" y1="52" x2="30" y2="73" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="30" cy="73" r="2" fill="#DC2626" />
                      </g>
                    ) : null}
                  </g>
                )}
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Upper arch has tooth number button at the bottom */}
      {isUpper ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTooth?.(tooth.tooth_number);
          }}
          className={cn(
            "flex items-center justify-center gap-0.5 rounded font-bold tabular-nums transition",
            compact ? "mt-0.5 px-1 py-0 text-[10px]" : "mt-1 rounded-md px-1.5 py-0.5 text-[11px] gap-1",
            selected ? "bg-brand-600 text-white shadow-2xs" : "text-slate-700 hover:bg-slate-100",
          )}
          title={`${tooth.tooth_number} · ${info.name}`}
        >
          <span>{tooth.tooth_number}</span>
          {typeof historyCount === "number" && historyCount > 0 ? (
            <span
              className={cn(
                "flex items-center justify-center rounded-full font-extrabold",
                compact ? "h-3 w-3 text-[8px]" : "h-3.5 w-3.5 text-[9px]",
                selected ? "bg-white text-brand-700" : "bg-brand-600 text-white",
              )}
              title={`${historyCount} evoluciones registradas para esta pieza`}
            >
              {historyCount}
            </span>
          ) : null}
        </button>
      ) : null}
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
  displayMode,
  onDisplayModeChange,
  activeTool = "caries",
  onToolChange,
  onToggleSurface,
  onSetGeneralStatus,
  selectedTooth,
  onSelectTooth,
  historyCounts,
  compact = false,
}: {
  teeth: Record<number, ToothState>;
  dentition?: "adult" | "child";
  onDentitionChange?: (d: "adult" | "child") => void;
  displayMode?: OdontogramDisplayMode;
  onDisplayModeChange?: (mode: OdontogramDisplayMode) => void;
  activeTool?: OdontogramActiveTool;
  onToolChange?: (tool: OdontogramActiveTool) => void;
  onToggleSurface?: (toothNumber: number, surface: ToothSurfaceName, nextStatus: ToothSurfaceStatus) => void;
  onSetGeneralStatus?: (toothNumber: number, status: NonNullable<ToothState["general_status"]>) => void;
  selectedTooth?: number;
  onSelectTooth?: (toothNumber: number) => void;
  historyCounts?: Record<number, number>;
  compact?: boolean;
}) {
  const [internalDisplayMode, setInternalDisplayMode] = useState<OdontogramDisplayMode>("surfaces");
  const effectiveDisplayMode = displayMode ?? internalDisplayMode;

  function handleDisplayModeChange(mode: OdontogramDisplayMode) {
    setInternalDisplayMode(mode);
    onDisplayModeChange?.(mode);
  }

  const upperRight = dentition === "adult" ? ADULT_UPPER_RIGHT : CHILD_UPPER_RIGHT;
  const upperLeft = dentition === "adult" ? ADULT_UPPER_LEFT : CHILD_UPPER_LEFT;
  const lowerRight = dentition === "adult" ? ADULT_LOWER_RIGHT : CHILD_LOWER_RIGHT;
  const lowerLeft = dentition === "adult" ? ADULT_LOWER_LEFT : CHILD_LOWER_LEFT;

  const surfaceTools: Array<{ key: OdontogramActiveTool; label: string; shortLabel: string; dot: string }> = [
    { key: "caries", label: "Caries / Patología", shortLabel: "Caries", dot: "bg-red-600" },
    { key: "restored", label: "Obturación / Empaste", shortLabel: "Obturado", dot: "bg-blue-600" },
    { key: "planned", label: "Tratamiento planificado", shortLabel: "Planificado", dot: "bg-emerald-600" },
    { key: "healthy", label: "Superficie sana", shortLabel: "Sano", dot: "border border-slate-300 bg-white" },
  ];

  const generalTools: Array<{ key: OdontogramActiveTool; label: string; shortLabel: string; badge: string; status: NonNullable<ToothState["general_status"]> }> = [
    { key: "endodontics", label: "Endodoncia", shortLabel: "Endo", badge: "border-red-500 text-red-700 bg-red-50", status: "endodontics" },
    { key: "crown", label: "Corona / Funda", shortLabel: "Corona", badge: "border-amber-500 text-amber-700 bg-amber-50", status: "crown" },
    { key: "implant", label: "Implante", shortLabel: "Implante", badge: "border-slate-700 text-slate-800 bg-slate-100", status: "implant" },
    { key: "general_missing", label: "Pieza ausente", shortLabel: "Ausente", badge: "border-slate-500 text-slate-700 bg-slate-50", status: "missing" },
    { key: "general_present", label: "Diente normal", shortLabel: "Normal", badge: "border-slate-300 text-slate-600 bg-white", status: "present" },
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
    if (activeTool === "caries" || activeTool === "restored" || activeTool === "planned" || activeTool === "healthy") {
      const current = state.surfaces[surface];
      const next = current === activeTool ? "healthy" : activeTool;
      onToggleSurface?.(toothNum, surface, next);
    } else {
      const tool = generalTools.find((g) => g.key === activeTool);
      if (tool && onSetGeneralStatus) {
        onSetGeneralStatus(toothNum, tool.status);
      }
    }
  }

  const activeToolMeta = surfaceTools.find((t) => t.key === activeTool) ?? generalTools.find((g) => g.key === activeTool);

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Ultra-Compact Single-Row Clinical Tool Bar */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-2.5 py-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Cara:</span>
            {surfaceTools.map((tool) => (
              <button
                key={tool.key}
                type="button"
                onClick={() => onToolChange?.(tool.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition",
                  activeTool === tool.key
                    ? "border-brand-600 bg-brand-600 text-white font-semibold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                )}
                title={tool.label}
              >
                <span className={cn("h-2 w-2 rounded-full ring-1 ring-white/40", tool.dot)} />
                {tool.shortLabel}
              </button>
            ))}

            <span className="mx-1 h-4 w-px bg-slate-200" />
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Pieza:</span>
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
                  "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition",
                  activeTool === tool.key
                    ? "border-brand-600 bg-brand-600 text-white font-semibold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                )}
                title={tool.label}
              >
                {tool.shortLabel}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
              {(
                [
                  ["surfaces", "5 Caras"],
                  ["anatomical", "Perfil Anatómico"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleDisplayModeChange(mode)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition",
                    effectiveDisplayMode === mode
                      ? "bg-brand-600 text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
              {(["adult", "child"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onDentitionChange?.(mode)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition",
                    dentition === mode ? "bg-brand-600 text-white font-semibold" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {mode === "adult" ? "Adulto (32)" : "Infantil (20)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Anatomical Arches */}
        <div className="space-y-1.5 overflow-x-auto">
          {/* Upper Arch */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>Superior · C1 (Der.)</span>
              <span className="text-slate-400">Maxilar ↑</span>
              <span>C2 (Izq.)</span>
            </div>
            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
              <div className="flex gap-0.5 sm:gap-1">
                {upperRight.map((num) => (
                  <ToothSurfaceRenderer
                    key={num}
                    tooth={teeth[num] ?? emptyTooth(num)}
                    selected={selectedTooth === num}
                    isUpper={true}
                    compact={true}
                    displayMode={effectiveDisplayMode}
                    historyCount={historyCounts?.[num]}
                    onSelectTooth={handleToothClick}
                    onSelectSurface={handleSurfaceClick}
                  />
                ))}
              </div>
              <div className="mx-0.5 h-14 w-0.5 rounded bg-brand-400/70" title="Línea media" />
              <div className="flex gap-0.5 sm:gap-1">
                {upperLeft.map((num) => (
                  <ToothSurfaceRenderer
                    key={num}
                    tooth={teeth[num] ?? emptyTooth(num)}
                    selected={selectedTooth === num}
                    isUpper={true}
                    compact={true}
                    displayMode={effectiveDisplayMode}
                    historyCount={historyCounts?.[num]}
                    onSelectTooth={handleToothClick}
                    onSelectSurface={handleSurfaceClick}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Lower Arch */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2">
            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
              <div className="flex gap-0.5 sm:gap-1">
                {lowerRight.map((num) => (
                  <ToothSurfaceRenderer
                    key={num}
                    tooth={teeth[num] ?? emptyTooth(num)}
                    selected={selectedTooth === num}
                    isUpper={false}
                    compact={true}
                    displayMode={effectiveDisplayMode}
                    historyCount={historyCounts?.[num]}
                    onSelectTooth={handleToothClick}
                    onSelectSurface={handleSurfaceClick}
                  />
                ))}
              </div>
              <div className="mx-0.5 h-14 w-0.5 rounded bg-brand-400/70" title="Línea media" />
              <div className="flex gap-0.5 sm:gap-1">
                {lowerLeft.map((num) => (
                  <ToothSurfaceRenderer
                    key={num}
                    tooth={teeth[num] ?? emptyTooth(num)}
                    selected={selectedTooth === num}
                    isUpper={false}
                    compact={true}
                    displayMode={effectiveDisplayMode}
                    historyCount={historyCounts?.[num]}
                    onSelectTooth={handleToothClick}
                    onSelectSurface={handleSurfaceClick}
                  />
                ))}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>Inferior · C4 (Der.)</span>
              <span className="text-slate-400">Mandíbula ↓</span>
              <span>C3 (Izq.)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tool Palette */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Palette className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Paleta Clínica de Tratamientos
              </h4>
              <p className="text-[11px] text-slate-500">
                Selecciona una herramienta y haz clic sobre las caras o piezas del odontograma
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {(
                [
                  ["surfaces", "5 Caras (Corona)"],
                  ["anatomical", "Perfil Anatómico"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleDisplayModeChange(mode)}
                  className={cn(
                    "min-h-[30px] rounded-md px-3 text-xs font-medium transition",
                    effectiveDisplayMode === mode
                      ? "bg-white text-slate-900 font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {(["adult", "child"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onDentitionChange?.(mode)}
                  className={cn(
                    "min-h-[30px] rounded-md px-3 text-xs font-medium transition",
                    dentition === mode ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {mode === "adult" ? "Adulto (32 piezas)" : "Infantil (20 piezas)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 pt-1 md:grid-cols-2">
          {/* Surface Tools */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Ángulos y Caras (Superficie Dental)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {surfaceTools.map((tool) => (
                <button
                  key={tool.key}
                  type="button"
                  onClick={() => onToolChange?.(tool.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                    activeTool === tool.key
                      ? "border-brand-600 bg-brand-600 text-white font-semibold shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full ring-1 ring-white/40", tool.dot)} />
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Whole Tooth Tools */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tratamientos de Pieza Completa
            </span>
            <div className="flex flex-wrap gap-1.5">
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
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                    activeTool === tool.key
                      ? "border-brand-600 bg-brand-600 text-white font-semibold shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block rounded px-1 text-[10px] font-bold border",
                      activeTool === tool.key ? "bg-white/20 text-white border-white/40" : tool.badge,
                    )}
                  >
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Tool Status Banner */}
        <div className="flex items-center justify-between rounded-lg bg-brand-50/70 border border-brand-200/60 px-3 py-1.5 text-xs text-brand-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Herramienta activa:</span>
            <span className="inline-flex items-center gap-1.5 rounded bg-white px-2 py-0.5 font-bold shadow-2xs border border-brand-200">
              {activeToolMeta?.label ?? activeTool}
            </span>
          </div>
          <span className="text-[11px] text-brand-700 hidden sm:inline">
            Haz clic sobre una cara o pieza para aplicar el tratamiento
          </span>
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
              Raíces ↑ / Vestibular / Palatino
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
                  displayMode={effectiveDisplayMode}
                  historyCount={historyCounts?.[num]}
                  onSelectTooth={handleToothClick}
                  onSelectSurface={handleSurfaceClick}
                />
              ))}
            </div>

            {/* Central Midline Divider */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="h-20 w-0.5 rounded bg-brand-500" />
              <span className="text-[9px] font-bold uppercase text-brand-700">Línea media</span>
              <div className="h-20 w-0.5 rounded bg-brand-500" />
            </div>

            {/* Quadrant 2 (21..28) */}
            <div className="flex gap-1 sm:gap-1.5">
              {upperLeft.map((num) => (
                <ToothSurfaceRenderer
                  key={num}
                  tooth={teeth[num] ?? emptyTooth(num)}
                  selected={selectedTooth === num}
                  isUpper={true}
                  displayMode={effectiveDisplayMode}
                  historyCount={historyCounts?.[num]}
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
              Lingual / Vestibular / Raíces ↓
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
                  displayMode={effectiveDisplayMode}
                  historyCount={historyCounts?.[num]}
                  onSelectTooth={handleToothClick}
                  onSelectSurface={handleSurfaceClick}
                />
              ))}
            </div>

            {/* Central Midline Divider */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="h-20 w-0.5 rounded bg-brand-500" />
              <span className="text-[9px] font-bold uppercase text-brand-700">Línea media</span>
              <div className="h-20 w-0.5 rounded bg-brand-500" />
            </div>

            {/* Quadrant 3 (31..38) */}
            <div className="flex gap-1 sm:gap-1.5">
              {lowerLeft.map((num) => (
                <ToothSurfaceRenderer
                  key={num}
                  tooth={teeth[num] ?? emptyTooth(num)}
                  selected={selectedTooth === num}
                  isUpper={false}
                  displayMode={effectiveDisplayMode}
                  historyCount={historyCounts?.[num]}
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
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
          Sano
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-600" />
          Caries
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-blue-600" />
          Obturado
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-emerald-600" />
          Planificado
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-red-500 bg-red-50" />
          Endodoncia
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded border-2 border-amber-500 bg-amber-50" />
          Corona
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-700" />
          Implante
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-400 font-bold text-white flex items-center justify-center text-[9px]">X</span>
          Ausente
        </span>
      </div>
    </div>
  );
}

export interface ToothClinicalRecord {
  id: string;
  entryType: "NOTE" | "DIAGNOSIS" | "PROCEDURE" | "PRESCRIPTION";
  content: string;
  doctorName?: string;
  licenseNumber?: string;
  createdAt: string;
}

export function ToothAnatomicalViewer({
  toothNumber,
  toothState,
  activeTool = "caries",
  canWriteClinical = true,
  onToggleSurface,
  onUpdateGeneralStatus,
}: {
  toothNumber: number;
  toothState?: ToothState;
  activeTool?: OdontogramActiveTool;
  canWriteClinical?: boolean;
  onToggleSurface?: (surface: ToothSurfaceName, nextStatus: ToothSurfaceStatus) => void;
  onUpdateGeneralStatus?: (status: NonNullable<ToothState["general_status"]>) => void;
}) {
  const [viewMode, setViewMode] = useState<"occlusal" | "frontal" | "cross_section">("occlusal");
  const info = getFdiToothInfo(toothNumber);
  const isUpper = info.arch === "upper";
  const category = info.category;

  const generalStatus = toothState?.general_status ?? "present";
  const isMissing = generalStatus === "missing";
  const isCrown = generalStatus === "crown";
  const isEndo = generalStatus === "endodontics";
  const isImplant = generalStatus === "implant";

  const tNum = toothNumber;
  const fillOf = (s: ToothSurfaceName) => {
    if (isMissing) return "#94A3B8";
    const st = toothState?.surfaces?.[s] ?? "healthy";
    if (st === "caries") return `url(#tv-caries-${tNum})`;
    if (st === "restored") return `url(#tv-comp-${tNum})`;
    if (st === "planned") return `url(#tv-plan-${tNum})`;
    return `url(#tv-enamel-${tNum})`;
  };

  const handleFaceClick = (surface: ToothSurfaceName) => {
    if (!canWriteClinical) return;
    const current = toothState?.surfaces?.[surface] ?? "healthy";
    if (activeTool === "caries" || activeTool === "restored" || activeTool === "planned" || activeTool === "healthy") {
      const next = current === activeTool ? "healthy" : activeTool;
      onToggleSurface?.(surface, next);
    } else if (
      activeTool === "endodontics" ||
      activeTool === "crown" ||
      activeTool === "implant" ||
      activeTool === "general_missing" ||
      activeTool === "general_present"
    ) {
      const map: Record<string, NonNullable<ToothState["general_status"]>> = {
        endodontics: "endodontics",
        crown: "crown",
        implant: "implant",
        general_missing: "missing",
        general_present: "present",
      };
      if (map[activeTool]) {
        onUpdateGeneralStatus?.(map[activeTool]);
      }
    }
  };

  const handleMacroApply = (preset: "mod" | "occlusal" | "vestibular" | "lingual" | "clean") => {
    if (!canWriteClinical) return;
    const targetStatus: ToothSurfaceStatus =
      activeTool === "caries" || activeTool === "restored" || activeTool === "planned" ? activeTool : "restored";

    if (preset === "clean") {
      (["occlusal", "mesial", "distal", "vestibular", "lingual"] as ToothSurfaceName[]).forEach((s) => {
        onToggleSurface?.(s, "healthy");
      });
    } else if (preset === "mod") {
      onToggleSurface?.("mesial", targetStatus);
      onToggleSurface?.("occlusal", targetStatus);
      onToggleSurface?.("distal", targetStatus);
    } else if (preset === "occlusal") {
      onToggleSurface?.("occlusal", targetStatus);
    } else if (preset === "vestibular") {
      onToggleSurface?.("vestibular", targetStatus);
    } else if (preset === "lingual") {
      onToggleSurface?.("lingual", targetStatus);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
      {/* View Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-800">Visor Anatómico Multi-Ángulo</span>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("occlusal")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition",
              viewMode === "occlusal" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900",
            )}
          >
            5 Caras (Corona)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("frontal")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition",
              viewMode === "frontal" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Perfil Anatómico
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cross_section")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition",
              viewMode === "cross_section" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Corte Pulpar
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[230px] rounded-lg bg-slate-50/60 p-2">
        <svg className="hidden">
          <defs>
            <radialGradient id={`tv-caries-${tNum}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#450A0A" />
              <stop offset="50%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </radialGradient>
            <linearGradient id={`tv-comp-${tNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="35%" stopColor="#3B82F6" />
              <stop offset="85%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            <linearGradient id={`tv-plan-${tNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="60%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id={`tv-enamel-${tNum}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id={`tv-gold-${tNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="80%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id={`tv-impl-${tNum}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="30%" stopColor="#475569" />
              <stop offset="55%" stopColor="#94A3B8" />
              <stop offset="75%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id={`tv-dentin-${tNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="70%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id={`tv-pulp-${tNum}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
          </defs>
        </svg>

        {viewMode === "occlusal" && (
          <div className="flex flex-col items-center">
            <svg
              viewBox="0 0 220 220"
              className="h-56 w-56 select-none drop-shadow-sm transition-all"
              aria-label={`Mapa de 5 caras de la pieza ${toothNumber}`}
            >
              {/* Background disc */}
              <circle cx="110" cy="110" r="100" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Vestibular (Top) */}
              <polygon
                points="30,30 190,30 150,70 70,70"
                fill={fillOf("vestibular")}
                stroke="#334155"
                strokeWidth="2"
                className={cn("transition cursor-pointer hover:stroke-brand-600 hover:opacity-90", !canWriteClinical && "cursor-default")}
                onClick={() => handleFaceClick("vestibular")}
              >
                <title>Cara Vestibular (V)</title>
              </polygon>
              <text x="110" y="52" textAnchor="middle" className="text-[11px] font-black fill-slate-700 pointer-events-none select-none">
                VESTIBULAR (V)
              </text>

              {/* Palatino / Lingual (Bottom) */}
              <polygon
                points="70,150 150,150 190,190 30,190"
                fill={fillOf("lingual")}
                stroke="#334155"
                strokeWidth="2"
                className={cn("transition cursor-pointer hover:stroke-brand-600 hover:opacity-90", !canWriteClinical && "cursor-default")}
                onClick={() => handleFaceClick("lingual")}
              >
                <title>{isUpper ? "Cara Palatina (P)" : "Cara Lingual (L)"}</title>
              </polygon>
              <text x="110" y="174" textAnchor="middle" className="text-[11px] font-black fill-slate-700 pointer-events-none select-none">
                {isUpper ? "PALATINO (P)" : "LINGUAL (L)"}
              </text>

              {/* Mesial (Left) */}
              <polygon
                points="30,30 70,70 70,150 30,190"
                fill={fillOf("mesial")}
                stroke="#334155"
                strokeWidth="2"
                className={cn("transition cursor-pointer hover:stroke-brand-600 hover:opacity-90", !canWriteClinical && "cursor-default")}
                onClick={() => handleFaceClick("mesial")}
              >
                <title>Cara Mesial (M)</title>
              </polygon>
              <text x="50" y="114" textAnchor="middle" className="text-[11px] font-black fill-slate-700 pointer-events-none select-none">
                M
              </text>

              {/* Distal (Right) */}
              <polygon
                points="190,30 190,190 150,150 150,70"
                fill={fillOf("distal")}
                stroke="#334155"
                strokeWidth="2"
                className={cn("transition cursor-pointer hover:stroke-brand-600 hover:opacity-90", !canWriteClinical && "cursor-default")}
                onClick={() => handleFaceClick("distal")}
              >
                <title>Cara Distal (D)</title>
              </polygon>
              <text x="170" y="114" textAnchor="middle" className="text-[11px] font-black fill-slate-700 pointer-events-none select-none">
                D
              </text>

              {/* Occlusal / Incisal (Center) */}
              <rect
                x="70"
                y="70"
                width="80"
                height="80"
                rx="4"
                fill={fillOf("occlusal")}
                stroke="#334155"
                strokeWidth="2"
                className={cn("transition cursor-pointer hover:stroke-brand-600 hover:opacity-90", !canWriteClinical && "cursor-default")}
                onClick={() => handleFaceClick("occlusal")}
              >
                <title>{category === "incisor" || category === "canine" ? "Borde Incisal (I)" : "Cara Oclusal (O)"}</title>
              </rect>
              <text x="110" y="115" textAnchor="middle" className="text-xs font-black fill-slate-800 pointer-events-none select-none">
                {category === "incisor" || category === "canine" ? "INCISAL (I)" : "OCLUSAL (O)"}
              </text>

              {/* Overlays */}
              {isCrown && (
                <circle
                  cx="110"
                  cy="110"
                  r="95"
                  fill="none"
                  stroke={`url(#tv-gold-${tNum})`}
                  strokeWidth="6"
                  strokeDasharray="12 4"
                  className="pointer-events-none"
                />
              )}

              {isMissing && (
                <g className="pointer-events-none">
                  <line x1="30" y1="30" x2="190" y2="190" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
                  <line x1="190" y1="30" x2="30" y2="190" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
                </g>
              )}
            </svg>
          </div>
        )}

        {viewMode === "frontal" && (
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 220 250" className="h-56 w-56 select-none drop-shadow-sm">
              {isUpper ? (
                /* UPPER TOOTH: Roots at top (y: 20..130), Crown at bottom (y: 130..220) */
                <g>
                  {isImplant ? (
                    <g>
                      <polygon points="90,130 130,130 124,115 96,115" fill="#475569" stroke="#1E293B" strokeWidth="1.5" />
                      <rect x="94" y="25" width="32" height="90" rx="4" fill={`url(#tv-impl-${tNum})`} stroke="#0F172A" strokeWidth="1.5" />
                      {[35, 45, 55, 65, 75, 85, 95, 105].map((y) => (
                        <line key={y} x1="88" y1={y} x2="132" y2={y} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                      ))}
                      <polygon points="94,25 126,25 110,12" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
                    </g>
                  ) : (
                    <g>
                      {category === "molar" ? (
                        <g>
                          <path d="M 60 130 C 50 80, 40 40, 52 18 C 65 18, 75 60, 85 130 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
                          <path d="M 95 130 C 100 70, 105 35, 110 15 C 118 35, 122 70, 125 130 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                          <path d="M 135 130 C 145 60, 155 18, 168 18 C 180 40, 170 80, 160 130 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
                          {isEndo && (
                            <g>
                              <path d="M 54 22 Q 62 70 70 130" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                              <path d="M 110 18 L 110 130" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                              <path d="M 166 22 Q 158 70 150 130" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                              <circle cx="54" cy="22" r="3" fill="#DC2626" />
                              <circle cx="110" cy="18" r="3" fill="#DC2626" />
                              <circle cx="166" cy="22" r="3" fill="#DC2626" />
                            </g>
                          )}
                        </g>
                      ) : category === "premolar" ? (
                        <g>
                          <path d="M 72 130 C 65 80, 68 35, 82 18 C 96 18, 100 65, 102 130 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
                          <path d="M 118 130 C 120 65, 124 18, 138 18 C 152 35, 155 80, 148 130 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
                          {isEndo && (
                            <g>
                              <path d="M 82 22 Q 88 75 90 130" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                              <path d="M 138 22 Q 132 75 130 130" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                              <circle cx="82" cy="22" r="3" fill="#DC2626" />
                              <circle cx="138" cy="22" r="3" fill="#DC2626" />
                            </g>
                          )}
                        </g>
                      ) : (
                        <g>
                          <path
                            d={
                              category === "canine"
                                ? "M 80 130 C 85 75, 95 20, 110 12 C 125 20, 135 75, 140 130 Z"
                                : "M 82 130 C 88 80, 96 30, 110 16 C 124 30, 132 80, 138 130 Z"
                            }
                            fill="#F1F5F9"
                            stroke="#64748B"
                            strokeWidth="1.5"
                          />
                          {isEndo && (
                            <g>
                              <line x1="110" y1="18" x2="110" y2="130" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
                              <circle cx="110" cy="18" r="3" fill="#DC2626" />
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  )}

                  <path
                    d={
                      category === "molar"
                        ? "M 55 130 C 50 160, 52 205, 65 218 C 80 216, 95 220, 110 215 C 125 220, 140 216, 155 218 C 168 205, 170 160, 165 130 C 145 133, 75 133, 55 130 Z"
                        : category === "canine"
                        ? "M 70 130 C 65 165, 75 205, 110 226 C 145 205, 155 165, 150 130 Z"
                        : category === "premolar"
                        ? "M 65 130 C 60 165, 65 210, 85 220 C 100 215, 120 215, 135 220 C 155 210, 160 165, 155 130 Z"
                        : "M 70 130 C 66 165, 68 215, 80 220 L 140 220 C 152 215, 154 165, 150 130 Z"
                    }
                    fill={isCrown ? `url(#tv-gold-${tNum})` : `url(#tv-enamel-${tNum})`}
                    stroke="#334155"
                    strokeWidth="2"
                  />

                  <path d="M 60 130 Q 110 136 160 130" stroke="#64748B" strokeWidth="1.5" fill="none" />

                  {/* Interactive Surface Zones on Upper Anatomical Crown Profile */}
                  <path
                    data-anatomical-zone="lingual"
                    d="M 64 132 L 156 132 L 144 150 L 76 150 Z"
                    fill={fillOf("lingual")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("lingual")}
                  >
                    <title>Palatino (P)</title>
                  </path>
                  <path
                    data-anatomical-zone="mesial"
                    d="M 60 136 L 82 150 L 82 198 L 64 212 C 54 195, 53 160, 60 136 Z"
                    fill={fillOf("mesial")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("mesial")}
                  >
                    <title>Mesial (M)</title>
                  </path>
                  <path
                    data-anatomical-zone="distal"
                    d="M 160 136 C 167 160, 166 195, 156 212 L 138 198 L 138 150 Z"
                    fill={fillOf("distal")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("distal")}
                  >
                    <title>Distal (D)</title>
                  </path>
                  <rect
                    data-anatomical-zone="vestibular"
                    x="82"
                    y="150"
                    width="56"
                    height="48"
                    rx="8"
                    fill={fillOf("vestibular")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("vestibular")}
                  >
                    <title>Vestibular (V)</title>
                  </rect>
                  <path
                    data-anatomical-zone="occlusal"
                    d="M 66 198 L 154 198 L 148 216 C 130 222, 90 222, 72 216 Z"
                    fill={fillOf("occlusal")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("occlusal")}
                  >
                    <title>Oclusal / Incisal (O)</title>
                  </path>

                  {isMissing && (
                    <g>
                      <line x1="45" y1="20" x2="175" y2="225" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
                      <line x1="175" y1="20" x2="45" y2="225" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              ) : (
                /* LOWER TOOTH: Crown at top (y: 25..115), Roots at bottom (y: 115..225) */
                <g>
                  <path
                    d={
                      category === "molar"
                        ? "M 55 115 C 50 85, 52 40, 65 27 C 80 29, 95 25, 110 30 C 125 25, 140 29, 155 27 C 168 40, 170 85, 165 115 Z"
                        : category === "canine"
                        ? "M 70 115 C 65 80, 75 40, 110 19 C 145 40, 155 80, 150 115 Z"
                        : category === "premolar"
                        ? "M 65 115 C 60 80, 65 35, 85 25 C 100 30, 120 30, 135 25 C 155 35, 160 80, 155 115 Z"
                        : "M 70 115 C 66 80, 68 30, 80 25 L 140 25 C 152 30, 154 80, 150 115 Z"
                    }
                    fill={isCrown ? `url(#tv-gold-${tNum})` : `url(#tv-enamel-${tNum})`}
                    stroke="#334155"
                    strokeWidth="2"
                  />

                  <path d="M 60 115 Q 110 109 160 115" stroke="#64748B" strokeWidth="1.5" fill="none" />

                  {/* Interactive Surface Zones on Lower Anatomical Crown Profile */}
                  <path
                    data-anatomical-zone="occlusal"
                    d="M 72 29 C 90 23, 130 23, 148 29 L 154 47 L 66 47 Z"
                    fill={fillOf("occlusal")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("occlusal")}
                  >
                    <title>Oclusal / Incisal (O)</title>
                  </path>
                  <path
                    data-anatomical-zone="mesial"
                    d="M 64 33 L 82 47 L 82 95 L 60 109 C 53 85, 54 50, 64 33 Z"
                    fill={fillOf("mesial")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("mesial")}
                  >
                    <title>Mesial (M)</title>
                  </path>
                  <path
                    data-anatomical-zone="distal"
                    d="M 156 33 C 166 50, 167 85, 160 109 L 138 95 L 138 47 Z"
                    fill={fillOf("distal")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("distal")}
                  >
                    <title>Distal (D)</title>
                  </path>
                  <rect
                    data-anatomical-zone="vestibular"
                    x="82"
                    y="47"
                    width="56"
                    height="48"
                    rx="8"
                    fill={fillOf("vestibular")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("vestibular")}
                  >
                    <title>Vestibular (V)</title>
                  </rect>
                  <path
                    data-anatomical-zone="lingual"
                    d="M 76 95 L 144 95 L 156 113 L 64 113 Z"
                    fill={fillOf("lingual")}
                    stroke="#475569"
                    strokeWidth="1.2"
                    className={cn("transition cursor-pointer hover:opacity-85", !canWriteClinical && "cursor-default")}
                    onClick={() => handleFaceClick("lingual")}
                  >
                    <title>Lingual (L)</title>
                  </path>

                  {isImplant ? (
                    <g>
                      <polygon points="90,115 130,115 124,130 96,130" fill="#475569" stroke="#1E293B" strokeWidth="1.5" />
                      <rect x="94" y="130" width="32" height="90" rx="4" fill={`url(#tv-impl-${tNum})`} stroke="#0F172A" strokeWidth="1.5" />
                      {[140, 150, 160, 170, 180, 190, 200, 210].map((y) => (
                        <line key={y} x1="88" y1={y} x2="132" y2={y} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                      ))}
                      <polygon points="94,220 126,220 110,233" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
                    </g>
                  ) : (
                    <g>
                      {category === "molar" ? (
                        <g>
                          <path d="M 60 115 C 55 160, 60 215, 78 230 C 92 215, 95 165, 100 115 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
                          <path d="M 120 115 C 125 165, 128 215, 142 230 C 160 215, 165 160, 160 115 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
                          {isEndo && (
                            <g>
                              <path d="M 80 115 Q 75 180 78 226" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                              <path d="M 140 115 Q 145 180 142 226" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                              <circle cx="78" cy="226" r="3" fill="#DC2626" />
                              <circle cx="142" cy="226" r="3" fill="#DC2626" />
                            </g>
                          )}
                        </g>
                      ) : (
                        <g>
                          <path
                            d="M 80 115 C 85 165, 95 220, 110 230 C 125 220, 135 165, 140 115 Z"
                            fill="#F1F5F9"
                            stroke="#64748B"
                            strokeWidth="1.5"
                          />
                          {isEndo && (
                            <g>
                              <line x1="110" y1="115" x2="110" y2="226" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
                              <circle cx="110" cy="226" r="3" fill="#DC2626" />
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  )}

                  {isMissing && (
                    <g>
                      <line x1="45" y1="20" x2="175" y2="225" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
                      <line x1="175" y1="20" x2="45" y2="225" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              )}
            </svg>
          </div>
        )}

        {viewMode === "cross_section" && (
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 220 250" className="h-56 w-56 select-none drop-shadow-sm">
              <path
                d="M 50 115 C 45 60, 60 25, 110 20 C 160 25, 175 60, 170 115 C 150 118, 70 118, 50 115 Z"
                fill={`url(#tv-enamel-${tNum})`}
                stroke="#475569"
                strokeWidth="1.5"
              />
              <path
                d="M 62 115 C 58 75, 75 42, 110 38 C 145 42, 162 75, 158 115 C 145 160, 135 210, 110 230 C 85 210, 75 160, 62 115 Z"
                fill={`url(#tv-dentin-${tNum})`}
                stroke="#D97706"
                strokeWidth="1.2"
              />
              <path
                d="M 98 115 C 95 85, 96 70, 104 60 C 107 65, 113 65, 116 60 C 124 70, 125 85, 122 115 C 118 160, 114 205, 110 225 C 106 205, 102 160, 98 115 Z"
                fill={isEndo ? "#DC2626" : `url(#tv-pulp-${tNum})`}
                stroke={isEndo ? "#991B1B" : "#B91C1C"}
                strokeWidth="1.5"
              />

              <text x="35" y="45" className="text-[10px] font-bold fill-slate-600">
                Esmalte
              </text>
              <line x1="68" y1="42" x2="85" y2="35" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />

              <text x="25" y="100" className="text-[10px] font-bold fill-amber-700">
                Dentina
              </text>
              <line x1="62" y1="98" x2="78" y2="98" stroke="#D97706" strokeWidth="1" strokeDasharray="2 2" />

              <text x="145" y="80" className="text-[10px] font-bold fill-red-700">
                {isEndo ? "Gutapercha" : "Pulpa"}
              </text>
              <line x1="140" y1="80" x2="120" y2="85" stroke="#DC2626" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>
        )}
      </div>

      {/* Quick Surface Application Presets */}
      {canWriteClinical && (viewMode === "occlusal" || viewMode === "frontal") && !isMissing && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">Rápidos:</span>
          <button
            type="button"
            onClick={() => handleMacroApply("mod")}
            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 shadow-2xs"
            title="Aplica en Mesial, Oclusal y Distal"
          >
            MOD
          </button>
          <button
            type="button"
            onClick={() => handleMacroApply("occlusal")}
            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 shadow-2xs"
            title="Aplica en cara Oclusal"
          >
            Oclusal
          </button>
          <button
            type="button"
            onClick={() => handleMacroApply("vestibular")}
            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 shadow-2xs"
            title="Aplica en cara Vestibular"
          >
            Vestibular
          </button>
          <button
            type="button"
            onClick={() => handleMacroApply("lingual")}
            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 shadow-2xs"
            title="Aplica en cara Palatina o Lingual"
          >
            {isUpper ? "Palatino" : "Lingual"}
          </button>
          <button
            type="button"
            onClick={() => handleMacroApply("clean")}
            className="rounded border border-red-200 bg-red-50/60 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100 shadow-2xs"
            title="Limpiar todas las caras a esmalte sano"
          >
            Limpiar caras
          </button>
        </div>
      )}
    </div>
  );
}

export function ToothDetailHistoryPanel({
  toothNumber,
  toothState,
  records,
  activeTool,
  canWriteClinical = true,
  onUpdateGeneralStatus,
  onToggleSurface,
  onUpdateNotes,
  onCreateRecordForTooth,
  onClose,
}: {
  toothNumber: number;
  toothState?: ToothState;
  records: ToothClinicalRecord[];
  activeTool?: OdontogramActiveTool;
  canWriteClinical?: boolean;
  onUpdateGeneralStatus: (status: NonNullable<ToothState["general_status"]>) => void;
  onToggleSurface: (surface: ToothSurfaceName, nextStatus: ToothSurfaceStatus) => void;
  onUpdateNotes?: (notes: string) => void;
  onCreateRecordForTooth?: (content: string, type: "NOTE" | "DIAGNOSIS" | "PROCEDURE" | "PRESCRIPTION") => Promise<void> | void;
  onClose?: () => void;
}) {
  const info = getFdiToothInfo(toothNumber);
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"NOTE" | "DIAGNOSIS" | "PROCEDURE" | "PRESCRIPTION">("PROCEDURE");
  const [savingRecord, setSavingRecord] = useState(false);

  const surfaces: Array<{ name: ToothSurfaceName; label: string; current: ToothSurfaceStatus }> = [
    { name: "occlusal", label: "Oclusal / Incisal", current: toothState?.surfaces?.occlusal ?? "healthy" },
    { name: "mesial", label: "Mesial", current: toothState?.surfaces?.mesial ?? "healthy" },
    { name: "distal", label: "Distal", current: toothState?.surfaces?.distal ?? "healthy" },
    { name: "vestibular", label: "Vestibular", current: toothState?.surfaces?.vestibular ?? "healthy" },
    { name: "lingual", label: info.arch === "upper" ? "Palatino" : "Lingual", current: toothState?.surfaces?.lingual ?? "healthy" },
  ];

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim() || !onCreateRecordForTooth) return;
    setSavingRecord(true);
    try {
      const fullText = newContent.includes(`[Pieza ${toothNumber}]`)
        ? newContent.trim()
        : `[Pieza ${toothNumber}] ${newContent.trim()}`;
      await onCreateRecordForTooth(fullText, newType);
      setNewContent("");
    } finally {
      setSavingRecord(false);
    }
  }

  const generalStatus = toothState?.general_status ?? "present";

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 font-bold text-white text-base shadow-xs">
            {toothNumber}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{info.name}</h3>
              <Badge tone="info">{info.quadrantName}</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Sistema FDI / ISO 3950 · {info.arch === "upper" ? "Arcada Superior (Maxilar)" : "Arcada Inferior (Mandíbula)"}
            </p>
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
            title="Cerrar ficha de la pieza"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* Left Column: Visual Anatomical Inspector & Surface Angle Controls */}
        <div className="space-y-4">
          <ToothAnatomicalViewer
            toothNumber={toothNumber}
            toothState={toothState}
            activeTool={activeTool}
            canWriteClinical={canWriteClinical}
            onToggleSurface={onToggleSurface}
            onUpdateGeneralStatus={onUpdateGeneralStatus}
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Estado general de la pieza
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["present", "Normal / Sano"],
                  ["caries", "Caries"],
                  ["restored", "Obturado"],
                  ["endodontics", "Endodoncia"],
                  ["crown", "Corona"],
                  ["implant", "Implante"],
                  ["missing", "Ausente / Extraído"],
                ] as const
              ).map(([st, label]) => (
                <Button
                  key={st}
                  size="sm"
                  variant={generalStatus === st ? "primary" : "outline"}
                  onClick={() => onUpdateGeneralStatus(st as NonNullable<ToothState["general_status"]>)}
                  disabled={!canWriteClinical}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Superficies de la corona
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {surfaces.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-2 text-xs"
                >
                  <span className="font-medium text-slate-700">{s.label}</span>
                  <select
                    value={s.current}
                    disabled={!canWriteClinical || generalStatus === "missing"}
                    onChange={(e) => onToggleSurface(s.name, e.target.value as ToothSurfaceStatus)}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="healthy">Sana</option>
                    <option value="caries">Caries</option>
                    <option value="restored">Obturada</option>
                    <option value="planned">Planificada</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Notas clínicas de la pieza
            </p>
            <textarea
              rows={2}
              value={toothState?.notes ?? ""}
              disabled={!canWriteClinical}
              onChange={(e) => onUpdateNotes?.(e.target.value)}
              placeholder="Observaciones de la pieza (sensibilidad, fisuras, bolsa periodontal...)"
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Right Column: Tooth Clinical History */}
        <div className="space-y-4 border-t border-slate-200 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Historial de la pieza {toothNumber}
              </h4>
              <Badge tone={records.length > 0 ? "info" : "neutral"}>
                {records.length} {records.length === 1 ? "registro" : "registros"}
              </Badge>
            </div>
          </div>

          {/* Historical timeline of this tooth */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {records.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500">
                No constan intervenciones o diagnósticos registrados previamente para la pieza {toothNumber}.
              </div>
            ) : (
              records.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-3 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-semibold text-slate-700">
                      {rec.doctorName ? `Dr(a). ${rec.doctorName}` : "Facultativo"}
                    </span>
                    <span className="tabular-nums">{rec.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge tone={rec.entryType === "PROCEDURE" ? "success" : rec.entryType === "DIAGNOSIS" ? "warning" : "neutral"}>
                      {rec.entryType === "PROCEDURE"
                        ? "Procedimiento"
                        : rec.entryType === "DIAGNOSIS"
                        ? "Diagnóstico"
                        : rec.entryType === "PRESCRIPTION"
                        ? "Prescripción"
                        : "Nota clínica"}
                    </Badge>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-normal pt-0.5">{rec.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick Record Addition Form for This Tooth */}
          {canWriteClinical && onCreateRecordForTooth ? (
            <form onSubmit={handleAddRecord} className="space-y-2.5 rounded-lg border border-brand-100 bg-brand-50/40 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-900">
                  Registrar nueva evolución en pieza {toothNumber}
                </span>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none"
                >
                  <option value="PROCEDURE">Procedimiento</option>
                  <option value="DIAGNOSIS">Diagnóstico</option>
                  <option value="NOTE">Nota clínica</option>
                  <option value="PRESCRIPTION">Prescripción</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={`Detalle del tratamiento para la pieza ${toothNumber} (ej: Obturación oclusal con composite, anestesia local...)`}
                required
                className="w-full rounded border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <Button size="sm" type="submit" loading={savingRecord} disabled={!newContent.trim()}>
                  Firmar evolución en ficha
                </Button>
              </div>
            </form>
          ) : null}
        </div>
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
  isForced?: boolean;
  notes?: string;
}

const TIMELINE_SLOT_HEIGHT = 68;

function parseTimelineMinutes(hhmmStr: string): number {
  if (!hhmmStr) return 0;
  const parts = hhmmStr.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

function formatTimelineHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getTimelineDurationMinutes(start: string, end: string): number {
  const s = parseTimelineMinutes(start);
  const e = parseTimelineMinutes(end);
  return Math.max(10, e - s);
}

export function AppointmentCard({
  appointment,
  durationMinutes,
  compactMode = false,
  selected = false,
  onClick,
  draggable,
  onDragStart,
}: {
  appointment: AppointmentCardData;
  durationMinutes?: number;
  compactMode?: boolean;
  selected?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
}) {
  const meta = APPOINTMENT_STATUS_META[appointment.status];
  const dur = durationMinutes ?? getTimelineDurationMinutes(appointment.startTime, appointment.endTime);
  const isCompact = dur < 30 || compactMode;

  if (isCompact) {
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
        title={`${appointment.patientName} · ${appointment.treatmentType} (${appointment.startTime}–${appointment.endTime}) · ${meta.label}${appointment.isForced ? " [SOBRECITA]" : ""}${appointment.notes ? ` · ${appointment.notes}` : ""}`}
        className={cn(
          "w-full h-full rounded-md border border-slate-200 border-l-4 bg-white px-2 py-0.5 text-left shadow-2xs transition hover:shadow flex items-center justify-between gap-1.5 overflow-hidden",
          appointment.isForced ? "border-amber-400 bg-amber-50/70" : meta.border,
          selected && "ring-2 ring-brand-600 border-brand-500 bg-brand-50/90 shadow-xs",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {appointment.highRisk ? (
            <AlertTriangle className="h-3 w-3 shrink-0 text-critical" aria-label="Alerta médica" />
          ) : null}
          <p className="truncate text-xs font-bold text-slate-900">{appointment.patientName}</p>
          <span className="truncate text-[11px] font-medium text-slate-600 hidden sm:inline">
            · {appointment.treatmentType}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {appointment.isForced ? (
            <Badge tone="warning" className="px-1 py-0 text-[9px] bg-amber-100 text-amber-800 border-amber-300">
              Sobrecita
            </Badge>
          ) : null}
          <Badge tone={meta.tone} className="px-1.5 py-0 text-[10px]">
            {meta.label}
          </Badge>
          <span className="text-[10px] font-medium text-slate-500 tabular-nums">
            {appointment.startTime}–{appointment.endTime}
          </span>
        </div>
      </button>
    );
  }

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
      title={`${appointment.patientName} · ${appointment.treatmentType} (${appointment.startTime}–${appointment.endTime})${appointment.isForced ? " [SOBRECITA]" : ""}${appointment.notes ? ` · ${appointment.notes}` : ""}`}
      className={cn(
        "w-full h-full rounded-lg border border-slate-200 border-l-4 bg-white p-2 text-left shadow-sm transition hover:shadow flex flex-col justify-between overflow-hidden",
        appointment.isForced ? "border-amber-400 bg-amber-50/50" : meta.border,
        selected && "ring-2 ring-brand-600 border-brand-500 bg-brand-50/90",
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-1">
          <p className="truncate text-sm font-semibold text-slate-900">{appointment.patientName}</p>
          <div className="flex items-center gap-1 shrink-0">
            {appointment.isForced ? (
              <Badge tone="warning" className="px-1.5 py-0 text-[10px] bg-amber-100 text-amber-800 border-amber-300">
                Sobrecita
              </Badge>
            ) : null}
            {appointment.highRisk ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-critical" aria-label="Alerta médica" /> : null}
          </div>
        </div>
        <p className="truncate text-xs text-slate-600 mt-0.5">{appointment.treatmentType}</p>
        {appointment.notes ? (
          <p className="truncate text-[10px] italic text-slate-500 mt-0.5">{appointment.notes}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-1">
        <span className="inline-flex items-center gap-1 tabular-nums font-medium">
          <Clock className="h-3 w-3" />
          {appointment.startTime}–{appointment.endTime}
        </span>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
    </button>
  );
}

export interface CabinetDayAvailability {
  day_of_week: number; // 1 = Lunes .. 7 = Domingo
  day_name?: string;
  is_open: boolean;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
}

export interface CabinetColumn {
  id: string;
  name: string;
  colorCode?: string;
  availability?: CabinetDayAvailability[];
}

export function computeAppointmentLanes(
  appointments: AppointmentCardData[],
): Map<string, { lane: number; totalLanes: number }> {
  const result = new Map<string, { lane: number; totalLanes: number }>();
  if (!appointments || appointments.length === 0) return result;

  const valid = appointments.filter((a) => a.status !== "CANCELLED");
  if (valid.length === 0) return result;

  interface ItemInterval {
    id: string;
    start: number;
    end: number;
  }

  const intervals: ItemInterval[] = valid.map((a) => {
    const s = parseTimelineMinutes(a.startTime);
    const e = parseTimelineMinutes(a.endTime);
    return {
      id: a.id,
      start: s,
      end: Math.max(s + 5, e),
    };
  });

  // Sort by start asc, duration desc
  intervals.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Find overlapping clusters (connected components)
  const clusters: ItemInterval[][] = [];
  let currentCluster: ItemInterval[] = [];
  let currentClusterEnd = -1;

  for (const item of intervals) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      currentClusterEnd = item.end;
    } else if (item.start < currentClusterEnd) {
      currentCluster.push(item);
      if (item.end > currentClusterEnd) {
        currentClusterEnd = item.end;
      }
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      currentClusterEnd = item.end;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Assign lanes per cluster using interval scheduling
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      result.set(cluster[0].id, { lane: 0, totalLanes: 1 });
      continue;
    }

    const laneEndTimes: number[] = [];
    const itemAssignments: Array<{ id: string; lane: number }> = [];

    for (const item of cluster) {
      let assignedLane = -1;
      for (let i = 0; i < laneEndTimes.length; i++) {
        if (laneEndTimes[i] <= item.start) {
          assignedLane = i;
          laneEndTimes[i] = item.end;
          break;
        }
      }
      if (assignedLane === -1) {
        assignedLane = laneEndTimes.length;
        laneEndTimes.push(item.end);
      }
      itemAssignments.push({ id: item.id, lane: assignedLane });
    }

    const totalLanes = laneEndTimes.length;
    for (const assign of itemAssignments) {
      result.set(assign.id, { lane: assign.lane, totalLanes });
    }
  }

  return result;
}

export function MultiCabinetTimeline({
  cabinets,
  slots,
  slotHeight = TIMELINE_SLOT_HEIGHT,
  selectedAppointmentId,
  selectedSlot,
  appointmentsByCabinet,
  dayOfWeek,
  onSelectAppointment,
  onSelectSlot,
  onMoveAppointment,
}: {
  cabinets: CabinetColumn[];
  slots: string[];
  slotHeight?: number;
  selectedAppointmentId?: string;
  selectedSlot?: { cabinetId: string; slot: string } | null;
  appointmentsByCabinet: Record<string, AppointmentCardData[]>;
  dayOfWeek?: number;
  onSelectAppointment?: (appointment: AppointmentCardData) => void;
  onSelectSlot?: (cabinetId: string, slot: string, suggestedDuration?: number) => void;
  onMoveAppointment?: (appointmentId: string, targetCabinetId: string, targetSlot: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const isCompactTimeline = slotHeight < 50;
  const pad = isCompactTimeline ? 4 : 6;
  const minCardHeight = isCompactTimeline ? 18 : 28;
  const timeColWidth = isCompactTimeline ? "64px" : "80px";

  const cabinetLanesMap = useMemo(() => {
    const map: Record<string, Map<string, { lane: number; totalLanes: number }>> = {};
    cabinets.forEach((cab) => {
      map[cab.id] = computeAppointmentLanes(appointmentsByCabinet[cab.id] ?? []);
    });
    return map;
  }, [cabinets, appointmentsByCabinet]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="min-w-[560px]">
        {/* Header row with Cabinet names */}
        <div
          className="grid border-b border-slate-200 bg-slate-50/90 sticky top-0 z-20"
          style={{ gridTemplateColumns: `${timeColWidth} repeat(${Math.max(1, cabinets.length)}, minmax(160px, 1fr))` }}
        >
          <div className={cn("font-semibold uppercase tracking-wide text-slate-500", isCompactTimeline ? "px-2.5 py-2 text-[11px]" : "px-3 py-3 text-xs")}>
            Hora
          </div>
          {cabinets.map((cab) => {
            const count = (appointmentsByCabinet[cab.id] ?? []).length;
            return (
              <div
                key={cab.id}
                className={cn(
                  "flex items-center justify-between gap-2 border-l border-slate-200 font-semibold text-slate-800",
                  isCompactTimeline ? "px-2.5 py-2 text-xs" : "px-3 py-3 text-sm",
                )}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cab.colorCode ?? "#0D9488" }} />
                  <span className="truncate">{cab.name}</span>
                </span>
                <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-bold tabular-nums text-slate-600">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* 30-min Slot Rows */}
        {slots.map((slot) => {
          const slotStart = parseTimelineMinutes(slot);
          const slotEnd = slotStart + 30;
          const isHourMark = slot.endsWith(":00");

          return (
            <div
              key={slot}
              className={cn(
                "grid border-b last:border-b-0",
                isHourMark ? "border-slate-100" : "border-slate-200/70",
              )}
              style={{
                height: `${slotHeight}px`,
                gridTemplateColumns: `${timeColWidth} repeat(${Math.max(1, cabinets.length)}, minmax(160px, 1fr))`,
              }}
            >
              <div
                className={cn(
                  "tabular-nums select-none flex items-center",
                  isCompactTimeline ? "px-2.5 text-[11px]" : "px-3 py-3 text-xs",
                  isHourMark ? "font-semibold text-slate-700" : "font-normal text-slate-400",
                )}
              >
                {slot}
              </div>
              {cabinets.map((cab) => {
                const cabAppts = appointmentsByCabinet[cab.id] ?? [];

                // Appointments starting in this 30-min slot
                const starting = cabAppts.filter((a) => {
                  const s = parseTimelineMinutes(a.startTime);
                  return s >= slotStart && s < slotEnd;
                });

                // Appointments covering this 30-min slot from an earlier start
                const isCoveredFromAbove = cabAppts.some((a) => {
                  const s = parseTimelineMinutes(a.startTime);
                  const e = parseTimelineMinutes(a.endTime);
                  return s < slotStart && e > slotStart;
                });

                const cellKey = `${cab.id}-${slot}`;
                const isDropHover = hoverTarget === cellKey;
                const isSlotSelected = selectedSlot?.cabinetId === cab.id && selectedSlot?.slot === slot;
                const isEmpty = starting.length === 0 && !isCoveredFromAbove;

                const dayConfig = dayOfWeek && cab.availability
                  ? cab.availability.find((a) => a.day_of_week === dayOfWeek)
                  : undefined;

                let isSlotBlocked = false;
                let blockedReason = "";

                if (dayConfig) {
                  if (!dayConfig.is_open) {
                    isSlotBlocked = true;
                    blockedReason = "Cerrado hoy";
                  } else {
                    const openStart = parseTimelineMinutes(dayConfig.start_time || "09:00");
                    const openEnd = parseTimelineMinutes(dayConfig.end_time || "20:00");
                    if (slotStart < openStart || slotEnd > openEnd) {
                      isSlotBlocked = true;
                      blockedReason = "Fuera de horario";
                    } else if (dayConfig.break_start && dayConfig.break_end) {
                      const bStart = parseTimelineMinutes(dayConfig.break_start);
                      const bEnd = parseTimelineMinutes(dayConfig.break_end);
                      if (slotStart < bEnd && slotEnd > bStart) {
                        isSlotBlocked = true;
                        blockedReason = `Pausa (${dayConfig.break_start}–${dayConfig.break_end})`;
                      }
                    }
                  }
                }

                if (isSlotBlocked && isEmpty) {
                  return (
                    <div
                      key={cellKey}
                      onClick={() => onSelectSlot?.(cab.id, slot, 30)}
                      style={{ height: `${slotHeight}px` }}
                      className="relative border-l border-slate-100 p-0.5 bg-slate-100/70 select-none overflow-hidden cursor-pointer group/blocked hover:bg-slate-200/50 transition-colors"
                      title={`Gabinete no disponible: ${blockedReason}. Clic para forzar cita de urgencia.`}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300/80 bg-white/40 px-1 text-[10px] font-medium text-slate-500">
                        <span className="truncate flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                          <span>{blockedReason}</span>
                        </span>
                      </div>
                    </div>
                  );
                }

                // Compute gaps of >= 5 minutes in this slot [slotStart, slotEnd)
                const isMinOccupied = (m: number) => {
                  return cabAppts.some((a) => {
                    const s = parseTimelineMinutes(a.startTime);
                    const e = parseTimelineMinutes(a.endTime);
                    return s <= m && e > m;
                  });
                };

                const gaps: Array<{ start: number; duration: number }> = [];
                let currentGapStart: number | null = null;
                for (let m = slotStart; m < slotEnd; m++) {
                  const occupied = isMinOccupied(m);
                  if (!occupied && currentGapStart === null) {
                    currentGapStart = m;
                  } else if (occupied && currentGapStart !== null) {
                    const dur = m - currentGapStart;
                    if (dur >= 5) {
                      gaps.push({ start: currentGapStart, duration: dur });
                    }
                    currentGapStart = null;
                  }
                }
                if (currentGapStart !== null) {
                  const dur = slotEnd - currentGapStart;
                  if (dur >= 5) {
                    gaps.push({ start: currentGapStart, duration: dur });
                  }
                }

                const isConcurrent = starting.length > 1;

                return (
                  <div
                    key={cellKey}
                    onClick={() => {
                      if (isEmpty) onSelectSlot?.(cab.id, slot);
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
                    style={{ height: `${slotHeight}px` }}
                    className={cn(
                      "group/slot relative border-l border-slate-100 p-0.5 transition-colors",
                      isEmpty && onSelectSlot && "cursor-pointer hover:bg-brand-50/50",
                      isSlotSelected && "bg-brand-50 ring-2 ring-inset ring-brand-500",
                      isCoveredFromAbove && "bg-slate-50/20",
                      isDropHover && "bg-brand-100/60 ring-2 ring-inset ring-brand-400",
                    )}
                  >
                    {isEmpty && onSelectSlot ? (
                      <span className="pointer-events-none hidden group-hover/slot:inline-flex items-center gap-1 pl-1.5 text-[10px] font-medium text-brand-700">
                        + Cita {slot}
                      </span>
                    ) : null}

                    {/* Render available gaps inside partially filled slots to optimize idle time in background on hover */}
                    {!isEmpty &&
                      gaps.map((gap) => {
                        const gapSlotStr = formatTimelineHHMM(gap.start);
                        const minOffset = gap.start - slotStart;
                        const topPx = Math.round(pad / 2) + Math.round((minOffset / 30) * (slotHeight - pad));
                        const heightPx = Math.max(18, Math.round((gap.duration / 30) * (slotHeight - pad)));
                        return (
                          <button
                            key={gapSlotStr}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSlot?.(cab.id, gapSlotStr, gap.duration);
                            }}
                            style={{
                              position: "absolute",
                              top: `${topPx}px`,
                              left: "3px",
                              right: "3px",
                              height: `${heightPx}px`,
                              zIndex: 2,
                            }}
                            className="opacity-0 group-hover/slot:opacity-100 flex items-center justify-between rounded border border-dashed border-emerald-400 bg-emerald-50/90 px-1.5 py-0.5 text-left shadow-2xs hover:bg-emerald-100 hover:border-emerald-600 transition-opacity"
                            title={`Hueco disponible de ${gap.duration} min (${gapSlotStr}–${formatTimelineHHMM(gap.start + gap.duration)}). Clic para encajar cita.`}
                          >
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800">
                              <Plus className="h-3 w-3 shrink-0 text-emerald-600" />
                              <span className="truncate">Encajar {gapSlotStr}</span>
                            </span>
                            <span className="rounded bg-emerald-200/80 px-1 text-[9px] font-bold text-emerald-900 tabular-nums">
                              {gap.duration}m
                            </span>
                          </button>
                        );
                      })}

                    {/* Render starting appointments with horizontal partitioning on overlap */}
                    {starting.map((item) => {
                      const durMin = getTimelineDurationMinutes(item.startTime, item.endTime);
                      const minOffset = Math.max(0, parseTimelineMinutes(item.startTime) - slotStart);
                      const topPx = Math.round(pad / 2) + Math.round((minOffset / 30) * (slotHeight - pad));
                      const slotFraction = durMin / 30;
                      const heightPx = Math.max(minCardHeight, Math.round(slotFraction * slotHeight - pad));

                      const layout = cabinetLanesMap[cab.id]?.get(item.id) ?? { lane: 0, totalLanes: 1 };
                      const widthPct = 100 / layout.totalLanes;
                      const leftPct = layout.lane * widthPct;

                      return (
                        <div
                          key={item.id}
                          style={{
                            position: "absolute",
                            top: `${topPx}px`,
                            left: layout.totalLanes > 1 ? `calc(${leftPct}% + 2px)` : "3px",
                            width: layout.totalLanes > 1 ? `calc(${widthPct}% - 4px)` : "calc(100% - 6px)",
                            height: `${heightPx}px`,
                            zIndex: selectedAppointmentId === item.id ? 25 : 10 + layout.lane,
                          }}
                        >
                          <AppointmentCard
                            appointment={item}
                            durationMinutes={durMin}
                            compactMode={isCompactTimeline}
                            selected={selectedAppointmentId === item.id}
                            draggable={Boolean(onMoveAppointment)}
                            onDragStart={() => setDraggedId(item.id)}
                            onClick={() => onSelectAppointment?.(item)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
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

export interface ClinicalAttachmentUI {
  id: string;
  kind: "XRAY" | "PHOTO" | "DOCUMENT";
  name: string;
  mime_type: string;
  data_url: string;
  size_bytes?: number;
  tooth_number?: string;
}

export function buildSampleClinicalAttachment(
  kind: "XRAY" | "PHOTO" | "DOCUMENT",
  toothNumber?: number | string,
): ClinicalAttachmentUI {
  const tooth = toothNumber ? String(toothNumber) : "26";
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  if (kind === "XRAY") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160"><rect width="240" height="160" fill="#0f172a"/><rect x="14" y="14" width="212" height="132" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/><path d="M95 36 C95 22 145 22 145 36 L138 86 L128 134 L120 96 L112 134 L102 86 Z" fill="#e2e8f0" opacity="0.88"/><circle cx="115" cy="54" r="10" fill="#0f172a" opacity="0.75"/><text x="24" y="34" fill="#94a3b8" font-family="monospace" font-size="11">RX PERIAPICAL · PIEZA ${tooth}</text></svg>`;
    return {
      id: `att-rx-${stamp}`,
      kind: "XRAY",
      name: `Rx_Periapical_Pieza_${tooth}.svg`,
      mime_type: "image/svg+xml",
      data_url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      tooth_number: tooth,
    };
  }
  if (kind === "PHOTO") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160"><rect width="240" height="160" fill="#fff1f2"/><rect x="14" y="14" width="212" height="132" rx="10" fill="#ffe4e6" stroke="#fda4af" stroke-width="1.5"/><rect x="82" y="42" width="76" height="72" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><circle cx="120" cy="75" r="11" fill="#dc2626" opacity="0.7"/><text x="24" y="34" fill="#9f1239" font-family="sans-serif" font-weight="bold" font-size="11">FOTO INTRAORAL · PIEZA ${tooth}</text></svg>`;
    return {
      id: `att-photo-${stamp}`,
      kind: "PHOTO",
      name: `Foto_Intraoral_Pieza_${tooth}.svg`,
      mime_type: "image/svg+xml",
      data_url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      tooth_number: tooth,
    };
  }
  return {
    id: `att-doc-${stamp}`,
    kind: "DOCUMENT",
    name: `Consentimiento_Informado_Pieza_${tooth}.pdf`,
    mime_type: "application/pdf",
    data_url: `data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nPj4KZW5kb2JqCnRyYWlsZXIKPDwvUm9vdCAxIDAgUj4+CiUlRU9G`,
    tooth_number: tooth,
  };
}

export interface ClinicalTimelineEntry {
  id: string;
  entryType: "NOTE" | "DIAGNOSIS" | "PROCEDURE" | "PRESCRIPTION";
  content: string;
  doctorName: string;
  licenseNumber?: string;
  createdAt: string;
  amendsEntryId?: string;
  attachments?: ClinicalAttachmentUI[];
}

export function ClinicalHistoryTimeline({
  entries,
  compact = false,
  selectedTooth,
  onSelectTooth,
  onPreviewAttachment,
}: {
  entries: ClinicalTimelineEntry[];
  compact?: boolean;
  selectedTooth?: number;
  onSelectTooth?: (toothNumber: number) => void;
  onPreviewAttachment?: (attachment: ClinicalAttachmentUI) => void;
}) {
  const typeTone: Record<ClinicalTimelineEntry["entryType"], Tone> = {
    NOTE: "neutral",
    DIAGNOSIS: "warning",
    PROCEDURE: "info",
    PRESCRIPTION: "success",
  };

  const typeLabel: Record<ClinicalTimelineEntry["entryType"], string> = {
    NOTE: "Nota",
    DIAGNOSIS: "Diagnóstico",
    PROCEDURE: "Procedimiento",
    PRESCRIPTION: "Prescripción",
  };

  const attachmentKindMeta: Record<ClinicalAttachmentUI["kind"], { label: string; tone: Tone }> = {
    XRAY: { label: "Radiografía", tone: "info" },
    PHOTO: { label: "Fotografía", tone: "success" },
    DOCUMENT: { label: "Documento", tone: "neutral" },
  };

  function extractToothNumbers(text: string): number[] {
    const found = new Set<number>();
    const matches = text.match(/\b(?:pieza|diente|peça)?\s*#?([1-4][1-8]|[5-8][1-5])\b/gi);
    if (matches) {
      for (const m of matches) {
        const numMatch = m.match(/([1-4][1-8]|[5-8][1-5])/);
        if (numMatch) found.add(Number(numMatch[1]));
      }
    }
    return Array.from(found);
  }

  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {entries.map((entry) => {
        const teethNums = extractToothNumbers(entry.content);
        const matchesSelected = selectedTooth !== undefined && teethNums.includes(selectedTooth);
        const attachments = entry.attachments ?? [];

        return (
          <li
            key={entry.id}
            className={cn(
              "rounded-lg border bg-white transition",
              compact ? "p-2.5 shadow-2xs" : "rounded-xl p-4 shadow-sm",
              matchesSelected
                ? "border-brand-500 bg-brand-50/40 ring-1 ring-brand-400"
                : "border-slate-200",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={typeTone[entry.entryType]} className={compact ? "px-1.5 py-0 text-[10px]" : undefined}>
                  {compact ? typeLabel[entry.entryType] : entry.entryType}
                </Badge>
                {teethNums.map((tNum) => (
                  <button
                    key={tNum}
                    type="button"
                    onClick={() => onSelectTooth?.(tNum)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition",
                      selectedTooth === tNum
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-brand-800 hover:bg-brand-100",
                    )}
                    title={`Seleccionar pieza ${tNum} en el odontograma`}
                  >
                    Pieza {tNum}
                  </button>
                ))}
                {entry.amendsEntryId ? (
                  <Badge tone="warning" className={compact ? "px-1.5 py-0 text-[10px]" : undefined}>
                    Addenda
                  </Badge>
                ) : null}
                {attachments.length > 0 ? (
                  <Badge tone="info" className={compact ? "px-1.5 py-0 text-[10px]" : undefined}>
                    {attachments.length} adjunto(s)
                  </Badge>
                ) : null}
                <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                  <Lock className="h-2.5 w-2.5" />
                  Inmutable
                </span>
              </div>
              <time className="text-[11px] tabular-nums text-slate-500">{entry.createdAt}</time>
            </div>
            <p className={cn("whitespace-pre-wrap text-slate-800", compact ? "mt-1.5 text-xs leading-relaxed" : "mt-2 text-sm")}>
              {entry.content}
            </p>

            {/* Attached clinical images (photos, X-rays) & documents */}
            {attachments.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2">
                {attachments.map((att) => {
                  const isImage =
                    att.kind === "XRAY" ||
                    att.kind === "PHOTO" ||
                    att.mime_type.startsWith("image/");
                  const meta = attachmentKindMeta[att.kind] ?? attachmentKindMeta.DOCUMENT;
                  return (
                    <div
                      key={att.id}
                      className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/90 p-1.5 text-xs hover:border-brand-400 hover:bg-white transition"
                    >
                      {isImage ? (
                        <img
                          src={att.data_url}
                          alt={att.name}
                          className="h-10 w-14 rounded object-cover border border-slate-200 bg-slate-900 shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-[10px] font-extrabold uppercase text-brand-700 shrink-0">
                          DOC
                        </div>
                      )}
                      <div className="min-w-0 max-w-[160px]">
                        <div className="flex items-center gap-1">
                          <Badge tone={meta.tone} className="px-1 py-0 text-[9px]">
                            {meta.label}
                          </Badge>
                          {att.tooth_number ? (
                            <span className="text-[9px] font-bold text-slate-500">#{att.tooth_number}</span>
                          ) : null}
                        </div>
                        <p className="truncate font-semibold text-slate-800 text-[11px] mt-0.5" title={att.name}>
                          {att.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {onPreviewAttachment ? (
                            <button
                              type="button"
                              onClick={() => onPreviewAttachment(att)}
                              className="text-[10px] font-semibold text-brand-700 hover:underline"
                            >
                              Ver / Ampliar
                            </button>
                          ) : null}
                          <a
                            href={att.data_url}
                            download={att.name}
                            className="text-[10px] text-slate-500 hover:text-slate-800 hover:underline"
                          >
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <p className={cn("flex items-center gap-1 text-slate-500", compact ? "mt-1.5 text-[11px]" : "mt-3 text-xs")}>
              <UserCheck className="h-3 w-3 text-brand-600" />
              <span>{entry.doctorName}</span>
              {entry.licenseNumber ? <span>· Col. {entry.licenseNumber}</span> : null}
            </p>
          </li>
        );
      })}
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

// ============================================================================
// CLINICAL FINDINGS & MULTI-OPTION TREATMENT BUDGETS (F7)
// ============================================================================

export interface ClinicalFindingUI {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name?: string;
  tooth_number: string;
  surfaces: string[];
  pathology_code: string;
  diagnosis: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_BUDGET" | "ACCEPTED" | "INVOICED" | "DISCARDED";
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetProcedureItemUI {
  id: string;
  treatment_code?: string;
  description: string;
  tooth_number?: string;
  quantity: number;
  unit_price_cents: number;
  discount_percent?: number;
  tax_rate_percent?: number;
}

export interface BudgetTreatmentOptionUI {
  id: string;
  option_label: string;
  name: string;
  description?: string;
  is_recommended: boolean;
  items: BudgetProcedureItemUI[];
  total_cents: number;
  patient_response: "PENDING" | "ACCEPTED" | "REJECTED";
  patient_response_at?: string;
  patient_response_notes?: string;
}

export interface BudgetFindingBlockUI {
  finding_id: string;
  tooth_number: string;
  surfaces?: string[];
  diagnosis: string;
  notes?: string;
  options: BudgetTreatmentOptionUI[];
}

export interface PatientBudgetUI {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name?: string;
  series: string;
  budget_number: number;
  title: string;
  issue_date: string;
  validity_days: number;
  valid_until: string;
  status: "DRAFT" | "PRESENTED" | "ACCEPTED" | "PARTIAL" | "REJECTED" | "EXPIRED" | "INVOICED";
  findings_blocks: BudgetFindingBlockUI[];
  min_estimate_amount: number;
  max_estimate_amount: number;
  accepted_amount: number;
  notes: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export function buildThreeOptionsForFinding(finding: {
  id: string;
  tooth_number: string;
  surfaces?: string[];
  diagnosis: string;
  notes?: string;
}): BudgetFindingBlockUI {
  const tooth = finding.tooth_number || "General";
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  return {
    finding_id: finding.id,
    tooth_number: tooth,
    surfaces: finding.surfaces ?? [],
    diagnosis: finding.diagnosis,
    notes: finding.notes,
    options: [
      {
        id: `opt-${stamp}-1`,
        option_label: "Opción 1",
        name: "Extracción simple",
        description: `Exodoncia conservadora de la pieza ${tooth}`,
        is_recommended: false,
        total_cents: 5000,
        patient_response: "PENDING",
        items: [
          {
            id: `it-${stamp}-1a`,
            treatment_code: "EXTRACCION_SIMPLE",
            description: `Extracción simple (Pieza ${tooth})`,
            tooth_number: tooth,
            quantity: 1,
            unit_price_cents: 5000,
          },
        ],
      },
      {
        id: `opt-${stamp}-2`,
        option_label: "Opción 2",
        name: "Tratamiento de reconstrucción",
        description: `Conservación dental mediante endodoncia, reconstrucción compleja y corona en pieza ${tooth}`,
        is_recommended: false,
        total_cents: 61500,
        patient_response: "PENDING",
        items: [
          {
            id: `it-${stamp}-2a`,
            treatment_code: "ENDODONCIA_MULTIRRADICULAR",
            description: `Endodoncia multirradicular (Pieza ${tooth})`,
            tooth_number: tooth,
            quantity: 1,
            unit_price_cents: 21000,
          },
          {
            id: `it-${stamp}-2b`,
            treatment_code: "OBTURACION_COMPLEJA",
            description: `Reconstrucción compleja (Pieza ${tooth})`,
            tooth_number: tooth,
            quantity: 1,
            unit_price_cents: 8500,
          },
          {
            id: `it-${stamp}-2c`,
            treatment_code: "CORONA",
            description: `Corona / Funda protectora (Pieza ${tooth})`,
            tooth_number: tooth,
            quantity: 1,
            unit_price_cents: 32000,
          },
        ],
      },
      {
        id: `opt-${stamp}-3`,
        option_label: "Opción 3",
        name: "Extracción y después Implante",
        description: `Rehabilitación implantológica completa: extracción + implante osteointegrado + corona sobre implante en pieza ${tooth}`,
        is_recommended: true,
        total_cents: 112000,
        patient_response: "PENDING",
        items: [
          {
            id: `it-${stamp}-3a`,
            treatment_code: "EXTRACCION_SIMPLE",
            description: `Extracción previa (Pieza ${tooth})`,
            tooth_number: tooth,
            quantity: 1,
            unit_price_cents: 5000,
          },
          {
            id: `it-${stamp}-3b`,
            treatment_code: "IMPLANTE",
            description: `Colocación de implante osteointegrado (Pieza ${tooth})`,
            tooth_number: tooth,
            quantity: 1,
            unit_price_cents: 75000,
          },
          {
            id: `it-${stamp}-3c`,
            treatment_code: "CORONA",
            description: `Corona sobre implante (Pieza ${tooth})`,
            tooth_number: tooth,
            quantity: 1,
            unit_price_cents: 32000,
          },
        ],
      },
    ],
  };
}

const budgetStatusMeta: Record<
  PatientBudgetUI["status"],
  { label: string; tone: Tone }
> = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  PRESENTED: { label: "En estudio por el cliente", tone: "warning" },
  ACCEPTED: { label: "Aceptado por el cliente", tone: "success" },
  PARTIAL: { label: "Aceptación parcial", tone: "info" },
  REJECTED: { label: "Descartado / Rechazado", tone: "danger" },
  EXPIRED: { label: "Caducado", tone: "danger" },
  INVOICED: { label: "Cerrado y Facturado", tone: "success" },
};

const optionResponseMeta: Record<
  BudgetTreatmentOptionUI["patient_response"],
  { label: string; tone: Tone; boxClass: string }
> = {
  PENDING: {
    label: "En estudio por el cliente",
    tone: "warning",
    boxClass: "border-slate-200 bg-white",
  },
  ACCEPTED: {
    label: "✓ Aceptado por el cliente",
    tone: "success",
    boxClass: "border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400/50",
  },
  REJECTED: {
    label: "✗ Descartado por el cliente",
    tone: "neutral",
    boxClass: "border-slate-200 bg-slate-50/70 opacity-75",
  },
};

export function PatientBudgetCard({
  budget,
  currency = "EUR",
  canWrite = false,
  loading = false,
  onRespondOption,
  onUpdateStatus,
  onConvertToInvoice,
  onPrintFormat,
  onCreateNewBudgetForFinding,
}: {
  budget: PatientBudgetUI;
  currency?: string;
  canWrite?: boolean;
  loading?: boolean;
  onRespondOption?: (
    budgetId: string,
    findingId: string,
    optionId: string,
    response: "PENDING" | "ACCEPTED" | "REJECTED",
  ) => void;
  onUpdateStatus?: (budgetId: string, status: PatientBudgetUI["status"], validityDays?: number) => void;
  onConvertToInvoice?: (budgetId: string) => void;
  onPrintFormat?: (budget: PatientBudgetUI) => void;
  onCreateNewBudgetForFinding?: (finding: {
    id: string;
    tooth_number: string;
    surfaces?: string[];
    diagnosis: string;
    notes?: string;
  }) => void;
}) {
  const stMeta = budgetStatusMeta[budget.status] ?? budgetStatusMeta.PRESENTED;
  const isClosed = budget.status === "INVOICED" || budget.status === "REJECTED";
  const validUntilDate = budget.valid_until ? new Date(budget.valid_until) : null;
  const isExpired =
    !isClosed &&
    validUntilDate !== null &&
    !Number.isNaN(validUntilDate.getTime()) &&
    validUntilDate.getTime() < Date.now() - 86400000;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
      {/* Header: Code, Title, Validity & Status */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-brand-700 px-2 py-0.5 text-xs font-extrabold text-white tabular-nums">
              {budget.series}-{budget.budget_number}
            </span>
            <h3 className="text-sm font-bold text-slate-900">{budget.title}</h3>
            <Badge tone={stMeta.tone}>{stMeta.label}</Badge>
            {isExpired ? (
              <Badge tone="danger">Vigencia vencida</Badge>
            ) : (
              <Badge tone="info">
                Vigencia: {budget.validity_days} días (hasta{" "}
                {validUntilDate ? validUntilDate.toLocaleDateString("es-ES") : budget.valid_until})
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Emitido el {new Date(budget.issue_date).toLocaleDateString("es-ES")}
            {budget.doctor_name ? ` · Facultativo: ${budget.doctor_name}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onPrintFormat ? (
            <Button size="sm" variant="outline" onClick={() => onPrintFormat(budget)}>
              Formato cliente / Imprimir
            </Button>
          ) : null}
          {canWrite && !isClosed && onUpdateStatus ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={loading}
                onClick={() => onUpdateStatus(budget.id, "PRESENTED", 30)}
              >
                Renovar +30d
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={loading}
                onClick={() => onUpdateStatus(budget.id, "REJECTED")}
              >
                Descartar presupuesto
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Findings Blocks -> Below each Finding, the Proposed Treatment Alternatives */}
      <div className="space-y-4">
        {budget.findings_blocks.map((blk, blkIdx) => {
          const allOptionsRejected =
            blk.options.length > 0 && blk.options.every((o) => o.patient_response === "REJECTED");
          const isFindingRejectedInThisBudget = allOptionsRejected || budget.status === "REJECTED";

          return (
          <div
            key={blk.finding_id || `blk-${blkIdx}`}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3"
          >
            {/* Top of Block: Clinical Finding (Hallazgo) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center justify-center rounded-md bg-slate-900 px-2 text-xs font-extrabold text-white tabular-nums">
                  Pieza #{blk.tooth_number || "General"}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hallazgo clínico detectado en odontograma
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {blk.diagnosis}
                    {blk.surfaces && blk.surfaces.length > 0 ? (
                      <span className="ml-2 text-xs font-normal text-slate-600">
                        (Caras: {blk.surfaces.join(", ")})
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isFindingRejectedInThisBudget ? (
                  <Badge tone="warning" className="text-[10px]">
                    Tratamiento descartado · Hallazgo sigue abierto
                  </Badge>
                ) : null}
                {canWrite && isFindingRejectedInThisBudget && onCreateNewBudgetForFinding ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onCreateNewBudgetForFinding({
                        id: blk.finding_id,
                        tooth_number: blk.tooth_number,
                        surfaces: blk.surfaces,
                        diagnosis: blk.diagnosis,
                        notes: blk.notes,
                      })
                    }
                  >
                    + Nuevo presupuesto para este hallazgo
                  </Button>
                ) : null}
                <span className="text-xs font-semibold text-slate-600">
                  {blk.options.length} tratamiento(s) alternativo(s) propuesto(s)
                </span>
              </div>
            </div>

            {/* Bottom of Block: Treatment Options / Alternatives Proposed for this Finding */}
            <div className="grid gap-3 md:grid-cols-3">
              {blk.options.map((opt) => {
                const respMeta =
                  optionResponseMeta[opt.patient_response] ?? optionResponseMeta.PENDING;
                const optionTotalCents =
                  opt.total_cents ||
                  opt.items.reduce((acc, it) => acc + (it.quantity || 1) * it.unit_price_cents, 0);

                return (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border p-3 transition",
                      respMeta.boxClass,
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700">
                              {opt.option_label}
                            </span>
                            {opt.is_recommended ? (
                              <Badge tone="info" className="text-[10px] px-1.5 py-0">
                                ★ Recomendado
                              </Badge>
                            ) : null}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{opt.name}</h4>
                        </div>
                        <span className="text-sm font-extrabold text-slate-900 tabular-nums shrink-0">
                          {formatMoney(optionTotalCents, currency)}
                        </span>
                      </div>

                      {opt.description ? (
                        <p className="text-xs text-slate-600 leading-snug">{opt.description}</p>
                      ) : null}

                      {/* Itemized Procedures inside this Option */}
                      <ul className="space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-700">
                        {opt.items.map((it) => (
                          <li key={it.id} className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              • {it.description}{" "}
                              {it.quantity > 1 ? `x${it.quantity}` : ""}
                            </span>
                            <span className="tabular-nums font-medium text-slate-600 shrink-0">
                              {formatMoney((it.quantity || 1) * it.unit_price_cents, currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Explicit Customer Response Section */}
                    <div className="mt-3 space-y-2 border-t border-slate-200/80 pt-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Respuesta cliente:
                        </span>
                        <Badge tone={respMeta.tone} className="text-[10px] px-1.5 py-0">
                          {respMeta.label}
                        </Badge>
                      </div>

                      {opt.patient_response_notes ? (
                        <p className="text-[11px] italic text-slate-500">
                          "{opt.patient_response_notes}"
                        </p>
                      ) : null}

                      {canWrite && !isClosed && onRespondOption ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            disabled={loading || opt.patient_response === "ACCEPTED"}
                            aria-label={`Aceptar opción ${opt.name}`}
                            onClick={() =>
                              onRespondOption(budget.id, blk.finding_id, opt.id, "ACCEPTED")
                            }
                            className={cn(
                              "flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
                              opt.patient_response === "ACCEPTED"
                                ? "bg-emerald-600 text-white cursor-default"
                                : "border border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white",
                            )}
                          >
                            {opt.patient_response === "ACCEPTED" ? "✓ Aceptada" : "Aceptar opción"}
                          </button>
                          <button
                            type="button"
                            disabled={loading || opt.patient_response === "REJECTED"}
                            aria-label={`Descartar opción ${opt.name}`}
                            onClick={() =>
                              onRespondOption(budget.id, blk.finding_id, opt.id, "REJECTED")
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"
                          >
                            Descartar
                          </button>
                          {opt.patient_response !== "PENDING" ? (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                onRespondOption(budget.id, blk.finding_id, opt.id, "PENDING")
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                              title="Volver a dejar en estudio"
                            >
                              En estudio
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>

      {/* Footer: Comparative Range, Accepted Amount & Convert to Invoice Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center gap-6 text-xs tabular-nums">
          <div>
            <span className="text-slate-500 block">Horquilla propuesta según opción:</span>
            <span className="text-sm font-bold text-slate-800">
              {formatMoney(Math.round(budget.min_estimate_amount * 100), currency)} –{" "}
              {formatMoney(Math.round(budget.max_estimate_amount * 100), currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Total tratamientos aceptados por el cliente:</span>
            <span className="text-base font-extrabold text-emerald-700">
              {formatMoney(Math.round(budget.accepted_amount * 100), currency)}
            </span>
          </div>
        </div>

        {canWrite && budget.status !== "INVOICED" && budget.accepted_amount > 0 && onConvertToInvoice ? (
          <Button
            size="sm"
            loading={loading}
            onClick={() => onConvertToInvoice(budget.id)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Facturar tratamientos aceptados
          </Button>
        ) : budget.status === "INVOICED" ? (
          <Badge tone="success">Presupuesto cerrado y facturado</Badge>
        ) : null}
      </div>
    </div>
  );
}

export interface ClinicBudgetSettingsUI {
  logo_url: string;
  clinic_contact_line: string;
  budget_default_validity_days: number;
  budget_default_series: string;
  budget_warning_days_before_expiry: number;
  budget_validity_terms: string;
  budget_auto_expire: boolean;
}

export const DEFAULT_CLINIC_BUDGET_SETTINGS: ClinicBudgetSettingsUI = {
  logo_url: "",
  clinic_contact_line: "",
  budget_default_validity_days: 30,
  budget_default_series: "PRE",
  budget_warning_days_before_expiry: 7,
  budget_validity_terms:
    "Presupuesto válido durante el periodo de vigencia indicado. Los importes reflejados incluyen los materiales y controles clínicos especificados para cada alternativa de tratamiento.",
  budget_auto_expire: true,
};

export const SAMPLE_CLINIC_LOGO_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#0F3F34"/>
      <path d="M16 14C12.5 14 11 17.5 11 21.5C11 26.5 13.5 31 15 35.5C16 38.5 17.5 39 19 36C20.5 33 21.5 29 24 29C26.5 29 27.5 33 29 36C30.5 39 32 38.5 33 35.5C34.5 31 37 26.5 37 21.5C37 17.5 35.5 14 32 14C28.5 14 26.5 16 24 16C21.5 16 19.5 14 16 14Z" fill="#CCFBF1" stroke="#5EEAD4" stroke-width="1.5"/>
      <text x="58" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#0F172A">CLÍNICA DENTAL</text>
      <text x="58" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="#0D9488" letter-spacing="1.5">ODONTOLOGÍA AVANZADA</text>
    </svg>`,
  );

export function BudgetPrintFormatDocument({
  budget,
  patientName,
  patientDni,
  clinicName = "Clínica Dental",
  clinicLogoUrl,
  clinicTaxId,
  clinicContactLine,
  validityTerms,
  currency = "EUR",
  onPrint,
}: {
  budget: PatientBudgetUI;
  patientName: string;
  patientDni?: string;
  clinicName?: string;
  clinicLogoUrl?: string;
  clinicTaxId?: string;
  clinicContactLine?: string;
  validityTerms?: string;
  currency?: string;
  onPrint?: () => void;
}) {
  const issueDateFormatted = new Date(budget.issue_date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const validUntilFormatted = new Date(budget.valid_until).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const effectiveValidityTerms =
    validityTerms?.trim() ||
    DEFAULT_CLINIC_BUDGET_SETTINGS.budget_validity_terms;

  return (
    <div
      data-print-budget="true"
      className="print-budget-sheet space-y-5 rounded-xl border border-slate-300 bg-white p-6 text-slate-900 shadow-xs"
    >
      {/* Top Action Bar (Hidden when printing) */}
      {onPrint ? (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-2.5">
          <div className="text-xs text-brand-950">
            <span className="font-bold">Vista previa de impresión A4</span> · Optimizada para papel y exportación a PDF sin bordes ni menús.
          </div>
          <Button size="sm" onClick={onPrint}>
            Imprimir / Guardar PDF para el cliente
          </Button>
        </div>
      ) : null}

      {/* Editorial Clinical Document Header */}
      <div className="print-avoid-break flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-900 pb-5">
        <div className="flex items-start gap-4">
          {clinicLogoUrl && clinicLogoUrl.trim() ? (
            <img
              src={clinicLogoUrl.trim()}
              alt={`Logo de ${clinicName}`}
              className="h-14 max-w-[180px] object-contain shrink-0"
            />
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-white shadow-2xs"
              aria-hidden="true"
            >
              <svg viewBox="0 0 36 36" className="h-7 w-7 fill-current">
                <path d="M11 8C8 8 6.5 11 6.5 14.5C6.5 19 8.5 23 10 27C11 29.5 12.2 30 13.5 27.5C14.8 25 15.8 21.5 18 21.5C20.2 21.5 21.2 25 22.5 27.5C23.8 30 25 29.5 26 27C27.5 23 29.5 19 29.5 14.5C29.5 11 28 8 25 8C22 8 20.2 9.8 18 9.8C15.8 9.8 14 8 11 8Z" />
              </svg>
            </div>
          )}

          <div className="space-y-0.5">
            <p className="text-sm font-extrabold uppercase tracking-wider text-brand-800">
              {clinicName}
            </p>
            {clinicTaxId ? (
              <p className="text-[11px] font-semibold text-slate-600">
                NIF / Identificación Fiscal: <span className="text-slate-800">{clinicTaxId}</span>
              </p>
            ) : null}
            {clinicContactLine ? (
              <p className="text-[11px] text-slate-500">{clinicContactLine}</p>
            ) : null}
            <h2 className="pt-1 text-lg font-extrabold tracking-tight text-slate-900">
              PRESUPUESTO CLÍNICO Y OPCIONES DE TRATAMIENTO
            </h2>
          </div>
        </div>

        {/* Document Reference & Validity Box */}
        <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-right text-xs text-slate-700 space-y-1 min-w-[230px]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Nº Presupuesto
            </span>
            <span className="text-sm font-extrabold tabular-nums text-slate-900">
              {budget.series}-{budget.budget_number}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Fecha de emisión:</span>
            <strong className="tabular-nums text-slate-900">{issueDateFormatted}</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Vigencia del presupuesto:</span>
            <strong className="tabular-nums text-brand-800">
              {budget.validity_days} días (Válido hasta {validUntilFormatted})
            </strong>
          </div>
        </div>
      </div>

      {/* Patient & Treatment Plan Identification Bar */}
      <div className="print-avoid-break grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:grid-cols-3 text-xs">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Paciente
          </span>
          <span className="font-extrabold text-slate-900 text-sm">
            {patientName}
          </span>
          {patientDni ? (
            <span className="ml-1.5 text-slate-600 font-medium">({patientDni})</span>
          ) : null}
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Plan de Tratamiento
          </span>
          <span className="font-bold text-slate-900">{budget.title}</span>
        </div>
        <div className="sm:text-right">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Facultativo Responsable
          </span>
          <span className="font-semibold text-slate-800">
            {budget.doctor_name || "Equipo Médico Odontológico"}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        A continuación se detallan los hallazgos clínicos registrados en su exploración odontológica y las{" "}
        <strong>alternativas de tratamiento propuestas</strong> para cada pieza dental. Puede estudiar este
        documento y marcar la opción que desea aceptar para cada hallazgo.
      </p>

      {/* Clinical Findings & Comparative Treatment Alternatives */}
      <div className="space-y-4">
        {budget.findings_blocks.map((blk, idx) => (
          <div
            key={blk.finding_id || idx}
            className="print-avoid-break overflow-hidden rounded-xl border border-slate-300 bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-100/90 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center rounded-md bg-slate-900 px-2 text-[11px] font-extrabold uppercase tracking-wide text-white">
                  Pieza #{blk.tooth_number}
                </span>
                <span className="text-xs font-extrabold uppercase text-slate-900">
                  HALLAZGO #{idx + 1} · {blk.diagnosis}
                </span>
              </div>
              {blk.surfaces && blk.surfaces.length > 0 ? (
                <span className="text-[11px] font-semibold text-slate-600">
                  Caras afectadas: {blk.surfaces.join(", ")}
                </span>
              ) : null}
            </div>

            <div className="divide-y divide-slate-200 p-3 space-y-2.5">
              {blk.options.map((opt) => {
                const totalCents =
                  opt.total_cents ||
                  opt.items.reduce((acc, i) => acc + (i.quantity || 1) * i.unit_price_cents, 0);
                const isAccepted = opt.patient_response === "ACCEPTED";
                return (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3 text-xs first:mt-0",
                      isAccepted
                        ? "border-emerald-500 bg-emerald-50/40"
                        : opt.is_recommended
                        ? "border-brand-300 bg-brand-50/20"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <div className="space-y-1.5 flex-1 min-w-[220px]">
                      <div className="flex flex-wrap items-center gap-2 font-bold text-slate-900">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-xs border border-slate-800 bg-white text-[11px] font-extrabold leading-none">
                          {isAccepted ? "✓" : ""}
                        </span>
                        <span className="text-xs font-extrabold">
                          {opt.option_label}: {opt.name}
                        </span>
                        {opt.is_recommended ? (
                          <span className="rounded-md border border-brand-300 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-900">
                            ★ Opción recomendada
                          </span>
                        ) : null}
                      </div>

                      {opt.description ? (
                        <p className="pl-6 text-[11px] text-slate-600">{opt.description}</p>
                      ) : null}

                      {opt.items.length > 0 ? (
                        <table className="mt-1 w-full pl-6 text-[11px] text-slate-700">
                          <tbody>
                            {opt.items.map((it) => (
                              <tr key={it.id} className="border-b border-dotted border-slate-200 last:border-none">
                                <td className="py-0.5 pl-6 pr-2">
                                  • {it.description}
                                  {it.quantity && it.quantity > 1 ? ` (x${it.quantity})` : ""}
                                </td>
                                <td className="py-0.5 text-right font-medium tabular-nums text-slate-600 w-24">
                                  {formatMoney((it.quantity || 1) * it.unit_price_cents, currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : null}
                    </div>

                    <div className="text-right tabular-nums shrink-0 min-w-[140px]">
                      <span className="text-sm font-extrabold text-slate-900 block">
                        {formatMoney(totalCents, currency)}
                      </span>
                      <span className="mt-0.5 inline-block text-[10px] font-semibold uppercase text-slate-600">
                        {isAccepted
                          ? "✓ Opción aceptada"
                          : opt.patient_response === "REJECTED"
                          ? "Opción descartada"
                          : "[ ] Marcar si elige esta opción"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Economic Summary Strip */}
      <div className="print-avoid-break flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs tabular-nums">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Horquilla económica según alternativa elegida
          </span>
          <span className="text-sm font-extrabold text-slate-900">
            {formatMoney(Math.round(budget.min_estimate_amount * 100), currency)} –{" "}
            {formatMoney(Math.round(budget.max_estimate_amount * 100), currency)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total tratamientos aceptados
          </span>
          <span className="text-base font-extrabold text-emerald-800">
            {formatMoney(Math.round(budget.accepted_amount * 100), currency)}
          </span>
        </div>
      </div>

      {/* Notes & Clinic Validity Terms Box */}
      <div className="print-avoid-break rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-[11px] text-slate-700 space-y-1.5">
        {budget.notes ? (
          <p>
            <strong className="text-slate-900">Observaciones clínicas del presupuesto:</strong> {budget.notes}
          </p>
        ) : null}
        <p className="text-slate-600">
          <strong className="text-slate-800">Condiciones de vigencia ({budget.validity_days} días · hasta {validUntilFormatted}):</strong>{" "}
          {effectiveValidityTerms}
        </p>
      </div>

      {/* Signatures & Patient Conformity Block */}
      <div className="print-avoid-break grid grid-cols-2 gap-8 border-t-2 border-slate-300 pt-5 text-xs text-slate-700">
        <div>
          <p className="font-bold text-slate-900">Firma y Sello del Facultativo / Clínica</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{clinicName}</p>
          <div className="mt-10 border-b border-dashed border-slate-400" />
        </div>
        <div>
          <p className="font-bold text-slate-900">
            Conformidad y Aceptación del Paciente (indicar opción elegida)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Fdo.: {patientName} {patientDni ? `· DNI/NIE: ${patientDni}` : ""}
          </p>
          <div className="mt-10 border-b border-dashed border-slate-400" />
        </div>
      </div>
    </div>
  );
}

export function ClinicBrandingAndBudgetSettingsCard({
  clinicName,
  clinicTaxId,
  initialSettings,
  saving = false,
  onSave,
}: {
  clinicName: string;
  clinicTaxId?: string;
  initialSettings?: Partial<ClinicBudgetSettingsUI>;
  saving?: boolean;
  onSave: (settings: ClinicBudgetSettingsUI) => void;
}) {
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url ?? DEFAULT_CLINIC_BUDGET_SETTINGS.logo_url);
  const [contactLine, setContactLine] = useState(
    initialSettings?.clinic_contact_line ?? DEFAULT_CLINIC_BUDGET_SETTINGS.clinic_contact_line,
  );
  const [validityDays, setValidityDays] = useState<number>(
    initialSettings?.budget_default_validity_days ?? DEFAULT_CLINIC_BUDGET_SETTINGS.budget_default_validity_days,
  );
  const [defaultSeries, setDefaultSeries] = useState(
    initialSettings?.budget_default_series ?? DEFAULT_CLINIC_BUDGET_SETTINGS.budget_default_series,
  );
  const [warningDays, setWarningDays] = useState<number>(
    initialSettings?.budget_warning_days_before_expiry ??
      DEFAULT_CLINIC_BUDGET_SETTINGS.budget_warning_days_before_expiry,
  );
  const [validityTerms, setValidityTerms] = useState(
    initialSettings?.budget_validity_terms ?? DEFAULT_CLINIC_BUDGET_SETTINGS.budget_validity_terms,
  );
  const [autoExpire, setAutoExpire] = useState<boolean>(
    initialSettings?.budget_auto_expire ?? DEFAULT_CLINIC_BUDGET_SETTINGS.budget_auto_expire,
  );

  const previewValidUntil = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(validityDays) || 30));
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  }, [validityDays]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left column (7 cols): Form controls for Logo & Budget Validity Parameters */}
        <div className="lg:col-span-7 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Identidad Visual (Logo) y Parámetros de Vigencia de Presupuestos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura el logotipo oficial de la clínica y las condiciones de validez por defecto que se aplicarán al emitir e imprimir presupuestos para los pacientes.
            </p>
          </div>

          {/* 1. Clinic Logo Configuration */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <label
              htmlFor="clinic-logo-url-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              URL o imagen del logo de la clínica
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="clinic-logo-url-input"
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://tu-clinica.com/logo.png o sube una imagen…"
                className="h-9 flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
              />
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <span>Subir imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setLogoUrl(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setLogoUrl(SAMPLE_CLINIC_LOGO_DATA_URL)}
                className="h-9 rounded-lg border border-brand-200 bg-brand-50 px-2.5 text-xs font-semibold text-brand-800 hover:bg-brand-100"
              >
                Usar logo dental de muestra
              </button>
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-700"
                >
                  Quitar logo
                </button>
              ) : null}
            </div>

            <div className="pt-1">
              <label
                htmlFor="clinic-contact-line-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Datos de cabecera para documentos impresos (Dirección, Teléfono, Registro Sanitario)
              </label>
              <input
                id="clinic-contact-line-input"
                type="text"
                value={contactLine}
                onChange={(e) => setContactLine(e.target.value)}
                placeholder="Ej. Av. Diagonal 450, 08006 Barcelona · Tel. 932 00 11 22 · Reg. Sanitario E08991234"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Budget Validity Parameters */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Parámetros de Vigencia de los Presupuestos
            </span>

            <div className="space-y-1.5">
              <label
                htmlFor="budget-default-validity-input"
                className="block text-xs font-semibold text-slate-700"
              >
                Plazo de vigencia por defecto (días naturales)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[15, 30, 45, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setValidityDays(days)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                      validityDays === days
                        ? "border-brand-600 bg-brand-600 text-white shadow-2xs"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {days} días
                  </button>
                ))}
                <input
                  id="budget-default-validity-input"
                  type="number"
                  min={1}
                  max={365}
                  value={validityDays}
                  onChange={(e) => setValidityDays(Math.max(1, Math.min(365, Number(e.target.value) || 30)))}
                  className="h-8 w-20 rounded-lg border border-slate-300 bg-white px-2 text-center text-xs font-bold tabular-nums text-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="budget-default-series-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Serie por defecto de presupuestos
                </label>
                <input
                  id="budget-default-series-input"
                  type="text"
                  value={defaultSeries}
                  onChange={(e) => setDefaultSeries(e.target.value.toUpperCase())}
                  placeholder="PRE"
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold uppercase text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="budget-warning-days-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Aviso de vencimiento próximo (días antes)
                </label>
                <input
                  id="budget-warning-days-input"
                  type="number"
                  min={1}
                  max={90}
                  value={warningDays}
                  onChange={(e) => setWarningDays(Math.max(1, Math.min(90, Number(e.target.value) || 7)))}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs tabular-nums text-slate-900"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="budget-validity-terms-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Condiciones legales y texto de vigencia impreso al pie del presupuesto
              </label>
              <textarea
                id="budget-validity-terms-input"
                rows={3}
                value={validityTerms}
                onChange={(e) => setValidityTerms(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoExpire}
                onChange={(e) => setAutoExpire(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              <span>
                Marcar automáticamente los presupuestos como caducados una vez superada su fecha límite de vigencia
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              loading={saving}
              onClick={() =>
                onSave({
                  logo_url: logoUrl.trim(),
                  clinic_contact_line: contactLine.trim(),
                  budget_default_validity_days: Number(validityDays) || 30,
                  budget_default_series: defaultSeries.trim().toUpperCase() || "PRE",
                  budget_warning_days_before_expiry: Number(warningDays) || 7,
                  budget_validity_terms: validityTerms.trim(),
                  budget_auto_expire: autoExpire,
                })
              }
            >
              Guardar logo y parámetros de vigencia
            </Button>
          </div>
        </div>

        {/* Right column (5 cols): Live Print Header & Validity Footer Preview */}
        <div className="lg:col-span-5 space-y-3 rounded-xl border border-slate-200 bg-slate-100/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Vista previa de cabecera e impresión
            </span>
            <Badge tone="info">Formato A4</Badge>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-xs text-xs">
            <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 pb-3">
              <div className="flex items-start gap-2.5">
                {logoUrl.trim() ? (
                  <img
                    src={logoUrl.trim()}
                    alt={`Vista previa logo ${clinicName}`}
                    className="h-11 max-w-[140px] object-contain shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white font-extrabold">
                    CD
                  </div>
                )}
                <div>
                  <p className="font-extrabold uppercase text-brand-800">{clinicName}</p>
                  {clinicTaxId ? <p className="text-[10px] text-slate-500">NIF: {clinicTaxId}</p> : null}
                  {contactLine ? <p className="text-[10px] text-slate-500">{contactLine}</p> : null}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right text-[10px]">
                <p className="font-extrabold text-slate-900">{defaultSeries || "PRE"}-101</p>
                <p className="font-semibold text-brand-800">
                  Vigencia: {validityDays} días (hasta {previewValidUntil})
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-[11px] text-slate-600">
              <strong className="text-slate-800">Condiciones de vigencia ({validityDays} días):</strong>{" "}
              {validityTerms}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentOpenFindingsAndBudgetsSummary({
  findings,
  budgets,
  currency = "EUR",
  onNavigateToBudgets,
}: {
  findings: ClinicalFindingUI[];
  budgets: PatientBudgetUI[];
  currency?: string;
  onNavigateToBudgets?: () => void;
}) {
  // Filter only unclosed findings (!INVOICED && !DISCARDED) and unclosed budgets (!INVOICED && !REJECTED)
  const openFindings = useMemo(
    () => findings.filter((f) => f.status !== "INVOICED" && f.status !== "DISCARDED"),
    [findings],
  );
  const openBudgets = useMemo(
    () => budgets.filter((b) => b.status !== "INVOICED" && b.status !== "REJECTED"),
    [budgets],
  );

  if (openFindings.length === 0 && openBudgets.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-500">
        Sin hallazgos ni presupuestos pendientes de cierre para este paciente.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
          Hallazgos y Presupuestos Abiertos
        </span>
        <Badge tone="warning" className="text-[10px] px-1.5 py-0">
          {openFindings.length} hallazgo(s) · {openBudgets.length} ppto(s)
        </Badge>
      </div>

      {/* Unclosed Clinical Findings */}
      {openFindings.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-500">
            Hallazgos activos del odontograma:
          </p>
          <ul className="space-y-1">
            {openFindings.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-1.5 rounded-lg border border-amber-200/70 bg-white px-2 py-1 text-xs"
              >
                <span className="truncate font-medium text-slate-800">
                  <strong className="text-brand-800">Pieza #{f.tooth_number}:</strong> {f.diagnosis}
                </span>
                <Badge
                  tone={f.status === "ACCEPTED" ? "success" : f.status === "IN_BUDGET" ? "info" : "warning"}
                  className="text-[9px] px-1.5 py-0 shrink-0"
                >
                  {f.status === "ACCEPTED"
                    ? "Aceptado"
                    : f.status === "IN_BUDGET"
                    ? "Presupuestado"
                    : "Sin presupuestar"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Unclosed Patient Budgets & Customer Option Responses */}
      {openBudgets.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase text-slate-500">
            Presupuestos pendientes de cierre / facturación:
          </p>
          {openBudgets.map((b) => {
            const stMeta = budgetStatusMeta[b.status] ?? budgetStatusMeta.PRESENTED;
            return (
              <div
                key={b.id}
                className="rounded-lg border border-slate-200 bg-white p-2 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-bold text-slate-900 truncate">
                    {b.series}-{b.budget_number} · {b.title}
                  </span>
                  <Badge tone={stMeta.tone} className="text-[9px] px-1.5 py-0 shrink-0">
                    {stMeta.label}
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-500 tabular-nums">
                  Vigencia hasta {new Date(b.valid_until).toLocaleDateString("es-ES")} ·{" "}
                  {b.accepted_amount > 0
                    ? `Aceptado: ${formatMoney(Math.round(b.accepted_amount * 100), currency)}`
                    : `Opciones: ${formatMoney(Math.round(b.min_estimate_amount * 100), currency)}–${formatMoney(Math.round(b.max_estimate_amount * 100), currency)}`}
                </p>

                {/* Breakdown of findings & accepted/pending options */}
                <div className="space-y-1 border-t border-slate-100 pt-1">
                  {b.findings_blocks.map((blk, i) => {
                    const acceptedOpt = blk.options.find((o) => o.patient_response === "ACCEPTED");
                    return (
                      <div key={blk.finding_id || i} className="text-[11px] text-slate-700">
                        <span className="font-semibold">Pieza #{blk.tooth_number}:</span>{" "}
                        {acceptedOpt ? (
                          <span className="font-semibold text-emerald-700">
                            ✓ {acceptedOpt.option_label} ({acceptedOpt.name})
                          </span>
                        ) : (
                          <span className="text-amber-800">
                            {blk.options.length} alternativa(s) en estudio por el cliente
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {onNavigateToBudgets ? (
        <button
          type="button"
          onClick={onNavigateToBudgets}
          className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-center text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition"
        >
          Gestionar hallazgos y aceptación de presupuestos →
        </button>
      ) : null}
    </div>
  );
}

export interface ToothGraphicalEvolutionStep {
  id: string;
  stageLabel: string;
  subtitle: string;
  dateLabel?: string;
  toothState: ToothState;
  changeBadges: string[];
  tone: Tone;
  isCurrent?: boolean;
}

const SURFACE_SHORT_MAP: Record<ToothSurfaceName, string> = {
  occlusal: "O",
  mesial: "M",
  distal: "D",
  vestibular: "V",
  lingual: "L/P",
};

const GENERAL_STATUS_LABEL_MAP: Record<NonNullable<ToothState["general_status"]>, string> = {
  present: "Sano",
  endodontics: "Endodoncia",
  crown: "Corona",
  implant: "Implante",
  missing: "Ausente",
};

const SURFACE_STATUS_LABEL_MAP: Record<ToothSurfaceStatus, string> = {
  healthy: "Sana",
  caries: "Caries",
  restored: "Obturada",
  planned: "Planificada",
  missing: "Ausente",
};

function cloneToothState(toothNumber: number, state?: ToothState): ToothState {
  const base = state ?? emptyTooth(toothNumber);
  return {
    tooth_number: toothNumber,
    general_status: base.general_status ?? "present",
    notes: base.notes,
    surfaces: {
      occlusal: base.surfaces?.occlusal ?? "healthy",
      mesial: base.surfaces?.mesial ?? "healthy",
      distal: base.surfaces?.distal ?? "healthy",
      vestibular: base.surfaces?.vestibular ?? "healthy",
      lingual: base.surfaces?.lingual ?? "healthy",
    },
  };
}

function normalizeSurfaceKey(raw: string): ToothSurfaceName | null {
  const s = raw.trim().toLowerCase();
  if (s === "o" || s.startsWith("ocl") || s.startsWith("occ") || s.startsWith("inc")) return "occlusal";
  if (s === "m" || s.startsWith("mes")) return "mesial";
  if (s === "d" || s.startsWith("dis")) return "distal";
  if (s === "v" || s.startsWith("ves") || s.startsWith("buc")) return "vestibular";
  if (s === "l" || s === "p" || s.startsWith("lin") || s.startsWith("pal")) return "lingual";
  return null;
}

function inferSurfacesFromClinicalText(text: string): ToothSurfaceName[] {
  const found = new Set<ToothSurfaceName>();
  const upper = text.toUpperCase();
  if (/\bMOD\b/.test(upper)) {
    found.add("mesial");
    found.add("occlusal");
    found.add("distal");
  }
  if (/\b(?:MO|OM)\b/.test(upper) || /MESIO[-\s]?OCLUSAL/i.test(text)) {
    found.add("mesial");
    found.add("occlusal");
  }
  if (/\b(?:OD|DO)\b/.test(upper) || /OCLUSO[-\s]?DISTAL/i.test(text)) {
    found.add("occlusal");
    found.add("distal");
  }
  if (/oclusal|incisal/i.test(text)) found.add("occlusal");
  if (/mesial/i.test(text)) found.add("mesial");
  if (/distal/i.test(text)) found.add("distal");
  if (/vestibular|bucal/i.test(text)) found.add("vestibular");
  if (/palatin[oa]|lingual/i.test(text)) found.add("lingual");
  return Array.from(found);
}

function computeToothDiffBadges(prev: ToothState, next: ToothState): string[] {
  const badges: string[] = [];
  const prevGen = prev.general_status ?? "present";
  const nextGen = next.general_status ?? "present";

  if (prevGen !== nextGen) {
    badges.push(`${GENERAL_STATUS_LABEL_MAP[prevGen]} → ${GENERAL_STATUS_LABEL_MAP[nextGen]}`);
  }

  const byTargetStatus: Partial<Record<ToothSurfaceStatus, string[]>> = {};
  (Object.keys(SURFACE_SHORT_MAP) as ToothSurfaceName[]).forEach((surf) => {
    const pSt = prev.surfaces?.[surf] ?? "healthy";
    const nSt = next.surfaces?.[surf] ?? "healthy";
    if (pSt !== nSt) {
      if (!byTargetStatus[nSt]) byTargetStatus[nSt] = [];
      byTargetStatus[nSt]!.push(SURFACE_SHORT_MAP[surf]);
    }
  });

  (Object.entries(byTargetStatus) as Array<[ToothSurfaceStatus, string[]]>).forEach(([st, surfs]) => {
    badges.push(`${SURFACE_STATUS_LABEL_MAP[st]} (${surfs.join(", ")})`);
  });

  return badges;
}

function summarizeToothStateBadges(state: ToothState): string[] {
  const badges: string[] = [];
  const gen = state.general_status ?? "present";
  if (gen !== "present") {
    badges.push(GENERAL_STATUS_LABEL_MAP[gen]);
  }
  const bySt: Partial<Record<ToothSurfaceStatus, string[]>> = {};
  (Object.keys(SURFACE_SHORT_MAP) as ToothSurfaceName[]).forEach((surf) => {
    const st = state.surfaces?.[surf] ?? "healthy";
    if (st !== "healthy") {
      if (!bySt[st]) bySt[st] = [];
      bySt[st]!.push(SURFACE_SHORT_MAP[surf]);
    }
  });
  (Object.entries(bySt) as Array<[ToothSurfaceStatus, string[]]>).forEach(([st, surfs]) => {
    badges.push(`${SURFACE_STATUS_LABEL_MAP[st]} (${surfs.join(", ")})`);
  });
  if (badges.length === 0) {
    badges.push("Sano (5 caras)");
  }
  return badges;
}

export function buildToothGraphicalEvolutionSteps({
  toothNumber,
  initialToothState,
  historicalToothState,
  currentToothState,
  findings = [],
  records = [],
}: {
  toothNumber: number;
  initialToothState?: ToothState;
  historicalToothState?: ToothState;
  currentToothState?: ToothState;
  findings?: ClinicalFindingUI[];
  records?: ClinicalTimelineEntry[];
}): ToothGraphicalEvolutionStep[] {
  const steps: ToothGraphicalEvolutionStep[] = [];
  const baseInitial = cloneToothState(toothNumber, initialToothState);

  steps.push({
    id: `step-initial-${toothNumber}`,
    stageLabel: "Estado Inicial",
    subtitle: "Odontograma de base",
    toothState: baseInitial,
    changeBadges: summarizeToothStateBadges(baseInitial),
    tone: "neutral",
  });

  let runningState = cloneToothState(toothNumber, baseInitial);

  if (historicalToothState) {
    const histClone = cloneToothState(toothNumber, historicalToothState);
    const diffs = computeToothDiffBadges(runningState, histClone);
    if (diffs.length > 0) {
      steps.push({
        id: `step-historical-${toothNumber}`,
        stageLabel: "Odontograma Histórico",
        subtitle: "Revisión intermedia",
        toothState: histClone,
        changeBadges: diffs,
        tone: "info",
      });
      runningState = histClone;
    }
  }

  // Apply findings for this tooth in chronological order
  const toothFindings = findings
    .filter((f) => String(f.tooth_number) === String(toothNumber))
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const finding of toothFindings) {
    const nextState = cloneToothState(toothNumber, runningState);
    const explicitSurfaces = (finding.surfaces ?? [])
      .map(normalizeSurfaceKey)
      .filter((s): s is ToothSurfaceName => s !== null);
    const targetSurfaces =
      explicitSurfaces.length > 0 ? explicitSurfaces : inferSurfacesFromClinicalText(`${finding.diagnosis} ${finding.notes ?? ""}`);

    const text = `${finding.pathology_code ?? ""} ${finding.diagnosis} ${finding.notes ?? ""}`.toLowerCase();
    if (/ausente|exodoncia|extracci/i.test(text)) {
      nextState.general_status = "missing";
    } else if (/endodoncia|pulpar|necrosis/i.test(text) && targetSurfaces.length === 0) {
      nextState.surfaces.occlusal = "caries";
    } else if (targetSurfaces.length > 0) {
      targetSurfaces.forEach((surf) => {
        nextState.surfaces[surf] = "caries";
      });
    } else {
      nextState.surfaces.occlusal = "caries";
    }

    const diffs = computeToothDiffBadges(runningState, nextState);
    const changeBadges =
      diffs.length > 0
        ? diffs
        : targetSurfaces.length > 0
        ? [`Caries (${targetSurfaces.map((s) => SURFACE_SHORT_MAP[s]).join(", ")})`]
        : ["Hallazgo registrado"];

    if (finding.status === "DISCARDED") {
      changeBadges.push("Hallazgo cancelado");
    }

    steps.push({
      id: `step-finding-${finding.id}`,
      stageLabel: finding.status === "DISCARDED" ? "Hallazgo Cancelado" : "Hallazgo Clínico",
      subtitle: finding.diagnosis,
      dateLabel: finding.created_at ? new Date(finding.created_at).toLocaleDateString("es-ES") : undefined,
      toothState: nextState,
      changeBadges,
      tone: finding.status === "DISCARDED" ? "neutral" : "warning",
    });

    if (finding.status !== "DISCARDED") {
      runningState = nextState;
    }
  }

  // Apply clinical records for this tooth (oldest to newest)
  const chronologicalRecords = records.slice().reverse();
  for (const rec of chronologicalRecords) {
    // Skip auto-generated finding creation notes if we already rendered the finding card above, unless no findings were passed
    if (toothFindings.length > 0 && /Hallazgo clínico registrado en pieza/i.test(rec.content)) {
      continue;
    }

    const nextState = cloneToothState(toothNumber, runningState);
    const text = rec.content.toLowerCase();
    const mentionedSurfaces = inferSurfacesFromClinicalText(rec.content);

    if (/implante|osteointegr/i.test(text)) {
      nextState.general_status = "implant";
    } else if (/exodoncia|extracci[oó]n|pieza ausente/i.test(text)) {
      nextState.general_status = "missing";
    } else if (/corona|zirconio|funda|pr[oó]tesis fija/i.test(text)) {
      nextState.general_status = "crown";
    } else if (/endodoncia|biopulpectom|conducto/i.test(text)) {
      nextState.general_status = "endodontics";
    }

    if (/obturaci[oó]n|reconstrucci[oó]n|composite|empaste|incrustaci[oó]n|restauraci[oó]n/i.test(text)) {
      if (mentionedSurfaces.length > 0) {
        mentionedSurfaces.forEach((s) => {
          nextState.surfaces[s] = "restored";
        });
      } else {
        // Restore any previously carious surfaces or occlusal by default
        const carious = (Object.keys(SURFACE_SHORT_MAP) as ToothSurfaceName[]).filter(
          (s) => nextState.surfaces[s] === "caries",
        );
        if (carious.length > 0) {
          carious.forEach((s) => {
            nextState.surfaces[s] = "restored";
          });
        } else {
          nextState.surfaces.occlusal = "restored";
        }
      }
    } else if (/caries|desmineralizaci[oó]n|fractura/i.test(text) && rec.entryType === "DIAGNOSIS") {
      const surfs = mentionedSurfaces.length > 0 ? mentionedSurfaces : (["occlusal"] as ToothSurfaceName[]);
      surfs.forEach((s) => {
        nextState.surfaces[s] = "caries";
      });
    }

    const diffs = computeToothDiffBadges(runningState, nextState);
    const cleanSubtitle = rec.content.replace(/^\[Pieza\s+\d+\]\s*/i, "");

    steps.push({
      id: `step-rec-${rec.id}`,
      stageLabel:
        rec.entryType === "PROCEDURE"
          ? "Tratamiento / Procedimiento"
          : rec.entryType === "DIAGNOSIS"
          ? "Diagnóstico"
          : "Evolución Clínica",
      subtitle: cleanSubtitle,
      dateLabel: rec.createdAt,
      toothState: nextState,
      changeBadges: diffs.length > 0 ? diffs : summarizeToothStateBadges(nextState),
      tone: rec.entryType === "PROCEDURE" ? "info" : rec.entryType === "DIAGNOSIS" ? "warning" : "neutral",
    });

    runningState = nextState;
  }

  // Final step: Current state on the odontogram
  const finalCurrent = cloneToothState(toothNumber, currentToothState);
  const diffFromInitial = computeToothDiffBadges(baseInitial, finalCurrent);
  const diffFromRunning = computeToothDiffBadges(runningState, finalCurrent);
  const currentBadges =
    diffFromInitial.length > 0
      ? diffFromInitial
      : diffFromRunning.length > 0
      ? diffFromRunning
      : summarizeToothStateBadges(finalCurrent);

  steps.push({
    id: `step-current-${toothNumber}`,
    stageLabel: "Estado Actual",
    subtitle:
      diffFromInitial.length > 0
        ? `Cambios acumulados (${diffFromInitial.length})`
        : "Estado activo en odontograma",
    toothState: finalCurrent,
    changeBadges: currentBadges,
    tone: diffFromInitial.length > 0 ? "success" : "info",
    isCurrent: true,
  });

  return steps;
}

export function SelectedToothEvolutionAndHistoryPanel({
  toothNumber,
  displayMode = "surfaces",
  initialToothState,
  historicalToothState,
  currentToothState,
  findings = [],
  records = [],
  onSelectTooth,
  onPreviewAttachment,
}: {
  toothNumber: number;
  displayMode?: OdontogramDisplayMode;
  initialToothState?: ToothState;
  historicalToothState?: ToothState;
  currentToothState?: ToothState;
  findings?: ClinicalFindingUI[];
  records?: ClinicalTimelineEntry[];
  onSelectTooth?: (toothNumber: number) => void;
  onPreviewAttachment?: (attachment: ClinicalAttachmentUI) => void;
}) {
  const info = getFdiToothInfo(toothNumber);
  const isUpper = info.arch === "upper";

  const toothFindings = useMemo(
    () => findings.filter((f) => String(f.tooth_number) === String(toothNumber)),
    [findings, toothNumber],
  );

  const steps = useMemo(
    () =>
      buildToothGraphicalEvolutionSteps({
        toothNumber,
        initialToothState,
        historicalToothState,
        currentToothState,
        findings: toothFindings,
        records,
      }),
    [toothNumber, initialToothState, historicalToothState, currentToothState, toothFindings, records],
  );

  const initialVsCurrentDiffs = useMemo(
    () =>
      computeToothDiffBadges(
        cloneToothState(toothNumber, initialToothState),
        cloneToothState(toothNumber, currentToothState),
      ),
    [toothNumber, initialToothState, currentToothState],
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-3">
      {/* 1. GRAPHICAL EVOLUTION OF CHANGES FOR SELECTED TOOTH */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-xs font-extrabold text-brand-800 tabular-nums">
              #{toothNumber}
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Evolución gráfica de cambios · Pieza #{toothNumber} ({info.name})
              </h3>
              <p className="text-[11px] text-slate-500">
                Comparativa visual desde el estado inicial pasando por los hallazgos y tratamientos sufridos por la pieza
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {initialVsCurrentDiffs.length > 0 ? (
              initialVsCurrentDiffs.map((diff, idx) => (
                <Badge key={idx} tone="warning" className="px-1.5 py-0 text-[10px]">
                  Δ {diff}
                </Badge>
              ))
            ) : (
              <Badge tone="neutral" className="px-1.5 py-0 text-[10px]">
                Sin alteraciones estructurales respecto al inicio
              </Badge>
            )}
          </div>
        </div>

        {/* Horizontal Graphical Timeline of Tooth States */}
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1 pt-0.5">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-stretch gap-2 shrink-0">
              <div
                className={cn(
                  "flex min-w-[165px] max-w-[210px] shrink-0 flex-col justify-between rounded-xl border p-2.5 transition",
                  step.isCurrent
                    ? "border-brand-500 bg-brand-50/40 ring-1 ring-brand-300"
                    : "border-slate-200 bg-slate-50/60",
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <Badge tone={step.tone} className="px-1.5 py-0 text-[9px]">
                      {step.stageLabel}
                    </Badge>
                    {step.dateLabel ? (
                      <span className="text-[9px] font-medium tabular-nums text-slate-400">
                        {step.dateLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-[11px] font-semibold text-slate-800 leading-tight" title={step.subtitle}>
                    {step.subtitle}
                  </p>
                </div>

                {/* Graphical SVG representation of the tooth at this stage */}
                <div className="my-1.5 flex items-center justify-center rounded-lg border border-slate-200/80 bg-white py-1.5 shadow-2xs">
                  <ToothSurfaceRenderer
                    tooth={step.toothState}
                    isUpper={isUpper}
                    compact={true}
                    displayMode={displayMode}
                    selected={Boolean(step.isCurrent)}
                  />
                </div>

                {/* Change badges for this step */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {step.changeBadges.map((b, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold",
                        step.isCurrent
                          ? "bg-brand-600 text-white"
                          : "bg-slate-200/80 text-slate-700",
                      )}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {index < steps.length - 1 ? (
                <div className="flex items-center justify-center text-slate-400 font-bold text-sm select-none px-0.5">
                  →
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* 2. CLINICAL HISTORY OF THE SELECTED TOOTH */}
      <div className="border-t border-slate-200 pt-2.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand-700" />
            <h4 className="text-xs font-bold text-slate-900">
              Historia clínica de la pieza #{toothNumber}
            </h4>
            <Badge tone={records.length + toothFindings.length > 0 ? "info" : "neutral"} className="px-1.5 py-0 text-[10px]">
              {records.length} evolución(es) · {toothFindings.length} hallazgo(s)
            </Badge>
          </div>
        </div>

        {/* Active or cancelled findings for this tooth */}
        {toothFindings.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {toothFindings.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px]",
                  f.status === "DISCARDED"
                    ? "border-slate-200 bg-slate-100 text-slate-500 line-through"
                    : "border-amber-200 bg-amber-50/70 text-amber-950",
                )}
              >
                <Badge
                  tone={
                    f.status === "ACCEPTED"
                      ? "success"
                      : f.status === "IN_BUDGET"
                      ? "info"
                      : f.status === "DISCARDED"
                      ? "neutral"
                      : "warning"
                  }
                  className="px-1 py-0 text-[9px]"
                >
                  {f.status === "ACCEPTED"
                    ? "Aceptado"
                    : f.status === "IN_BUDGET"
                    ? "En presupuesto"
                    : f.status === "DISCARDED"
                    ? "Cancelado"
                    : "Hallazgo abierto"}
                </Badge>
                <span className="font-semibold">{f.diagnosis}</span>
                {f.notes ? <span className="text-slate-500">· {f.notes}</span> : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* Clinical History Entries for this tooth */}
        {records.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-2.5 text-center text-xs text-slate-500">
            Sin entradas registradas en la historia clínica para la pieza #{toothNumber}.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto pr-1">
            <ClinicalHistoryTimeline
              entries={records.map((r) => ({
                ...r,
                content: r.content.replace(new RegExp(`^\\[Pieza\\s+#?${toothNumber}\\]\\s*`, "i"), ""),
              }))}
              compact={true}
              selectedTooth={toothNumber}
              onSelectTooth={onSelectTooth}
              onPreviewAttachment={onPreviewAttachment}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export type OdontogramAutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface OdontogramUndoEntry {
  id: string;
  label: string;
  teeth: Record<number, ToothState>;
  timestamp: string;
}

export function cloneOdontogramTeethMap(teeth: Record<number, ToothState>): Record<number, ToothState> {
  const result: Record<number, ToothState> = {};
  for (const [k, v] of Object.entries(teeth)) {
    const num = Number(k);
    if (!Number.isNaN(num) && v) {
      result[num] = cloneToothState(num, v);
    }
  }
  return result;
}

export function pushOdontogramUndoEntry(
  stack: OdontogramUndoEntry[],
  prevTeeth: Record<number, ToothState>,
  label: string,
  maxDepth = 30,
): OdontogramUndoEntry[] {
  const entry: OdontogramUndoEntry = {
    id: `undo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label,
    teeth: cloneOdontogramTeethMap(prevTeeth),
    timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
  return [entry, ...stack].slice(0, maxDepth);
}

export function OdontogramAutosaveUndoBar({
  autosaveStatus,
  lastSavedAt,
  undoCount,
  lastUndoLabel,
  canWriteClinical = true,
  onUndo,
  onRetrySave,
}: {
  autosaveStatus: OdontogramAutosaveStatus;
  lastSavedAt?: string;
  undoCount: number;
  lastUndoLabel?: string;
  canWriteClinical?: boolean;
  onUndo: () => void;
  onRetrySave?: () => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {/* Live Autosave Status Badge */}
      <span
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
          autosaveStatus === "saving"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : autosaveStatus === "error"
            ? "border-red-200 bg-red-50 text-red-800"
            : autosaveStatus === "saved"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-slate-50 text-slate-600",
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            autosaveStatus === "saving"
              ? "bg-amber-500 animate-pulse"
              : autosaveStatus === "error"
              ? "bg-red-600"
              : autosaveStatus === "saved"
              ? "bg-emerald-600"
              : "bg-slate-400",
          )}
        />
        <span>
          {autosaveStatus === "saving"
            ? "Autoguardando…"
            : autosaveStatus === "error"
            ? "Error al autoguardar"
            : autosaveStatus === "saved"
            ? `Autoguardado${lastSavedAt ? ` · ${lastSavedAt}` : ""}`
            : "Autoguardado activo"}
        </span>
        {autosaveStatus === "error" && onRetrySave ? (
          <button
            type="button"
            onClick={onRetrySave}
            className="ml-1 underline font-bold hover:text-red-950"
          >
            Reintentar
          </button>
        ) : null}
      </span>

      {/* Undo Button */}
      <button
        type="button"
        disabled={!canWriteClinical || undoCount === 0}
        onClick={onUndo}
        title={
          lastUndoLabel
            ? `Deshacer último cambio: ${lastUndoLabel} (Ctrl+Z / ⌘Z)`
            : "Deshacer último cambio en el odontograma (Ctrl+Z / ⌘Z)"
        }
        className={cn(
          "inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
          !canWriteClinical || undoCount === 0
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
            : "border-slate-300 bg-white text-slate-800 shadow-2xs hover:border-brand-400 hover:bg-brand-50 hover:text-brand-900",
        )}
      >
        <span aria-hidden="true" className="text-xs font-bold leading-none">
          ↶
        </span>
        <span>Deshacer</span>
        {undoCount > 0 ? (
          <span className="rounded-full bg-brand-100 px-1.5 py-0 text-[10px] font-extrabold tabular-nums text-brand-800">
            {undoCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}



