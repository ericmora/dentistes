import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  User,
  Calendar,
  AlertCircle,
  FileText,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Badge, Button, cn } from "@dentistes/ui";
import { useSession } from "../lib/session";

export type AlarmPriority = "CRITICAL" | "HIGH" | "NORMAL";
export type AlarmCategory = "APPOINTMENT" | "CLINICAL_RISK" | "REMINDER" | "WAITING_LIST" | "BUDGET";

export interface UserAlarm {
  id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  description?: string;
  priority: AlarmPriority;
  category: AlarmCategory;
  patient_id?: string;
  patient_name?: string;
  due_time?: string;
  is_resolved: boolean;
  created_at: string;
}

function getInitialAlarmsForUser(userId: string, tenantId: string, userName: string, role: string): UserAlarm[] {
  const now = new Date();
  const formatTime = (offsetHours: number) => {
    const d = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const isClinical = role === "DENTIST" || role === "HYGIENIST" || role === "OWNER";

  const defaultAlarms: UserAlarm[] = [
    {
      id: `alarm-init-1-${userId}`,
      user_id: userId,
      tenant_id: tenantId,
      title: isClinical ? "Paciente con alerta médica de alto riesgo" : "Recordatorio: Confirmar citas de mañana",
      description: isClinical
        ? "Carlos Mendoza (Cita 11:30) tiene alergia severa a penicilina y tratamiento anticoagulante."
        : "Revisar lista de 4 pacientes pendientes de confirmación telefónica.",
      priority: "CRITICAL",
      category: isClinical ? "CLINICAL_RISK" : "REMINDER",
      patient_id: isClinical ? "pat-1" : undefined,
      patient_name: isClinical ? "Carlos Mendoza" : undefined,
      due_time: `Hoy a las ${formatTime(1)}`,
      is_resolved: false,
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: `alarm-init-2-${userId}`,
      user_id: userId,
      tenant_id: tenantId,
      title: "Próxima cita asignada en Gabinete 1",
      description: "Limpieza y exploración general programada con María García.",
      priority: "HIGH",
      category: "APPOINTMENT",
      patient_id: "pat-2",
      patient_name: "María García",
      due_time: `Hoy a las ${formatTime(2)}`,
      is_resolved: false,
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: `alarm-init-3-${userId}`,
      user_id: userId,
      tenant_id: tenantId,
      title: "Presupuesto pendiente de firma / aceptación",
      description: "Presupuesto de Implantología (Opción B) listo para revisión con el paciente.",
      priority: "NORMAL",
      category: "BUDGET",
      patient_id: "pat-3",
      patient_name: "Jordi Prat",
      due_time: "Para hoy",
      is_resolved: false,
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
  ];

  return defaultAlarms;
}

export function UserAlarms() {
  const { me } = useSession();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"pending" | "critical" | "all">("pending");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states for creating custom user alarm
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<AlarmPriority>("HIGH");
  const [newCategory, setNewCategory] = useState<AlarmCategory>("REMINDER");
  const [newDue, setNewDue] = useState("Hoy");

  const popoverRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(() => {
    if (!me) return null;
    return `dentistes_user_alarms_${me.active_tenant.id}_${me.user.id}`;
  }, [me]);

  const [alarms, setAlarms] = useState<UserAlarm[]>(() => {
    if (!me) return [];
    const key = `dentistes_user_alarms_${me.active_tenant.id}_${me.user.id}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback if parsing fails
    }
    return getInitialAlarmsForUser(me.user.id, me.active_tenant.id, me.user.full_name, me.role);
  });

  // Save changes to localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(alarms));
    } catch {
      // storage unavailable
    }
  }, [alarms, storageKey]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!me) return null;

  const activeAlarms = alarms.filter((a) => !a.is_resolved);
  const criticalCount = activeAlarms.filter((a) => a.priority === "CRITICAL").length;

  const filteredAlarms = alarms.filter((a) => {
    if (filter === "pending") return !a.is_resolved;
    if (filter === "critical") return !a.is_resolved && a.priority === "CRITICAL";
    return true; // all
  });

  function handleToggleResolved(id: string) {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_resolved: !a.is_resolved } : a)),
    );
  }

  function handleDelete(id: string) {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }

  function handleMarkAllResolved() {
    setAlarms((prev) => prev.map((a) => ({ ...a, is_resolved: true })));
  }

  function handleCreateAlarm(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newAlarm: UserAlarm = {
      id: `alarm-custom-${Date.now()}`,
      user_id: me!.user.id,
      tenant_id: me!.active_tenant.id,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      priority: newPriority,
      category: newCategory,
      due_time: newDue.trim() || undefined,
      is_resolved: false,
      created_at: new Date().toISOString(),
    };

    setAlarms((prev) => [newAlarm, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setShowAddForm(false);
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Alarms Header Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Alarmas del usuario"
        aria-expanded={open}
        className={cn(
          "relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          activeAlarms.length > 0
            ? criticalCount > 0
              ? "border-rose-300 bg-rose-50/80 text-rose-900 hover:bg-rose-100/90"
              : "border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100/90"
            : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
        )}
      >
        <span className="relative flex items-center justify-center">
          <Bell
            className={cn(
              "h-3.5 w-3.5",
              criticalCount > 0
                ? "text-rose-600 animate-wiggle"
                : activeAlarms.length > 0
                  ? "text-amber-600"
                  : "text-slate-500",
            )}
          />
          {activeAlarms.length > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex h-2 w-2 rounded-full",
                criticalCount > 0 ? "bg-rose-600" : "bg-amber-500",
              )}
            >
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  criticalCount > 0 ? "bg-rose-400" : "bg-amber-400",
                )}
              />
            </span>
          )}
        </span>
        <span className="font-semibold">Alarmas</span>
        {activeAlarms.length > 0 && (
          <span
            className={cn(
              "ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
              criticalCount > 0
                ? "bg-rose-600 text-white"
                : "bg-amber-600 text-white",
            )}
          >
            {activeAlarms.length}
          </span>
        )}
      </button>

      {/* Alarms Dropdown Popover Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={`Alarmas de ${me.user.full_name}`}
          className="absolute right-0 mt-2 z-50 w-[380px] sm:w-[420px] rounded-xl border border-slate-200 bg-white p-0 shadow-2xl ring-1 ring-slate-900/5 transition-all animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900">
                    Alarmas de {me.user.full_name}
                  </h3>
                  <span className="rounded bg-brand-50 px-1.5 py-0.2 text-[9px] font-semibold text-brand-700 border border-brand-200/50">
                    {me.role}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Avisos clínicos y recordatorios personales para este usuario
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              aria-label="Cerrar panel de alarmas"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Subheader / Filter Controls & New Alarm Toggle */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 bg-white">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter("pending")}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition",
                  filter === "pending"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                Pendientes ({activeAlarms.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("critical")}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition",
                  filter === "critical"
                    ? "bg-rose-700 text-white font-semibold"
                    : "text-rose-700 hover:bg-rose-50",
                )}
              >
                Críticas ({criticalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition",
                  filter === "all"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                Todas ({alarms.length})
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm((v) => !v)}
              className="h-6 gap-1 px-2 text-[10px] border-dashed"
            >
              <Plus className="h-3 w-3" />
              <span>Añadir</span>
            </Button>
          </div>

          {/* Inline Quick Add Alarm Form */}
          {showAddForm && (
            <form onSubmit={handleCreateAlarm} className="border-b border-brand-100 bg-brand-50/40 p-3">
              <p className="mb-2 text-[11px] font-bold text-brand-900">
                Nueva alarma personal para {me.user.full_name}
              </p>
              <input
                type="text"
                placeholder="Título del recordatorio o alerta (ej. Revisar TAC)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mb-2 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                autoFocus
                required
              />
              <textarea
                placeholder="Detalles adicionales o notas médicas (opcional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="mb-2 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as AlarmPriority)}
                    className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-700"
                  >
                    <option value="CRITICAL">Prioridad: Crítica</option>
                    <option value="HIGH">Prioridad: Alta</option>
                    <option value="NORMAL">Prioridad: Normal</option>
                  </select>
                  <select
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-700"
                  >
                    <option value="Hoy">Para hoy</option>
                    <option value="En 30 min">En 30 min</option>
                    <option value="En 1 hora">En 1 hora</option>
                    <option value="Mañana">Mañana</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="h-6 text-[10px] bg-brand-700 hover:bg-brand-800 text-white">
                    Guardar
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Alarms Items List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100">
            {filteredAlarms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-800">No hay alarmas pendientes</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Todo está al día para {me.user.full_name}.
                </p>
              </div>
            ) : (
              filteredAlarms.map((alarm) => {
                const isCritical = alarm.priority === "CRITICAL";
                const isHigh = alarm.priority === "HIGH";

                return (
                  <div
                    key={alarm.id}
                    className={cn(
                      "group relative rounded-lg p-2.5 transition-colors border",
                      alarm.is_resolved
                        ? "bg-slate-50/60 border-slate-200/60 opacity-60"
                        : isCritical
                          ? "bg-rose-50/50 border-rose-200 hover:bg-rose-50"
                          : isHigh
                            ? "bg-amber-50/40 border-amber-200 hover:bg-amber-50/70"
                            : "bg-white border-slate-200 hover:bg-slate-50/80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleResolved(alarm.id)}
                          aria-label={alarm.is_resolved ? "Marcar como pendiente" : "Marcar como resuelta"}
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                            alarm.is_resolved
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white hover:border-brand-500",
                          )}
                        >
                          {alarm.is_resolved && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                "text-xs font-semibold leading-tight",
                                alarm.is_resolved
                                  ? "line-through text-slate-500"
                                  : isCritical
                                    ? "text-rose-950 font-bold"
                                    : "text-slate-900",
                              )}
                            >
                              {alarm.title}
                            </span>

                            {isCritical && !alarm.is_resolved && (
                              <span className="rounded bg-rose-600 px-1 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                                Urgente
                              </span>
                            )}
                          </div>

                          {alarm.description && (
                            <p
                              className={cn(
                                "text-[11px] leading-relaxed",
                                alarm.is_resolved ? "text-slate-400" : "text-slate-600",
                              )}
                            >
                              {alarm.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-500">
                            {alarm.due_time && (
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {alarm.due_time}
                              </span>
                            )}

                            {alarm.patient_name && (
                              <span className="flex items-center gap-1 text-brand-700 font-medium">
                                <User className="h-3 w-3 text-brand-600" />
                                {alarm.patient_id ? (
                                  <Link
                                    to={`/patients/${alarm.patient_id}`}
                                    onClick={() => setOpen(false)}
                                    className="hover:underline"
                                  >
                                    {alarm.patient_name}
                                  </Link>
                                ) : (
                                  alarm.patient_name
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleDelete(alarm.id)}
                          aria-label="Eliminar alarma"
                          className="rounded p-1 text-slate-400 hover:bg-slate-200/60 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 rounded-b-xl text-[10px] text-slate-500">
            <span>Usuario: {me.user.email}</span>
            {activeAlarms.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllResolved}
                className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
              >
                Marcar todas como resueltas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
