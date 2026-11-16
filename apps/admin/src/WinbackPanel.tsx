import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, Input, Spinner } from "@dentistes/ui";
import {
  DentistesClient,
  type CancellationEmailLog,
  type CancellationEmailTemplate,
  type WinbackMetrics,
} from "@dentistes/sdk";

interface WinbackPanelProps {
  sdk: DentistesClient;
}

type SubTab = "monitor" | "templates" | "how-it-works";

export function WinbackPanel({ sdk }: WinbackPanelProps) {
  const [subTab, setSubTab] = useState<SubTab>("monitor");
  const [metrics, setMetrics] = useState<WinbackMetrics | null>(null);
  const [logs, setLogs] = useState<CancellationEmailLog[]>([]);
  const [templates, setTemplates] = useState<CancellationEmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Test email modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStepDay, setTestStepDay] = useState(15);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ message: string; tracking_token: string } | null>(null);

  // Cron trigger state
  const [triggeringCron, setTriggeringCron] = useState(false);

  // Template editor state
  const [selectedTemplate, setSelectedTemplate] = useState<CancellationEmailTemplate | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editPreviewText, setEditPreviewText] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editFreeMonth, setEditFreeMonth] = useState(false);

  // Filter logs state
  const [logSearch, setLogSearch] = useState("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, logsRes, templatesRes] = await Promise.all([
        sdk.admin.getWinbackMetrics(),
        sdk.admin.listWinbackLogs(),
        sdk.admin.listWinbackTemplates(),
      ]);
      setMetrics(metricsRes.metrics);
      setLogs(logsRes.logs);
      setTemplates(templatesRes.templates);
      if (templatesRes.templates.length > 0 && !selectedTemplate) {
        selectTemplate(templatesRes.templates[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos del sistema de winback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTemplate(tmpl: CancellationEmailTemplate) {
    setSelectedTemplate(tmpl);
    setEditSubject(tmpl.subject);
    setEditPreviewText(tmpl.preview_text);
    setEditBodyHtml(tmpl.body_html);
    setEditFreeMonth(tmpl.has_free_month_offer);
    setActionSuccess(null);
  }

  async function handleSaveTemplate() {
    if (!selectedTemplate) return;
    setSavingTemplate(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await sdk.admin.updateWinbackTemplate(selectedTemplate.id, {
        subject: editSubject,
        preview_text: editPreviewText,
        body_html: editBodyHtml,
        has_free_month_offer: editFreeMonth,
      });
      setSelectedTemplate(res.template);
      setTemplates((prev) =>
        prev.map((t) => (t.id === res.template.id ? res.template : t)),
      );
      setActionSuccess(`Plantilla del Día ${res.template.step_day} actualizada correctamente.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar plantilla");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail.trim()) return;
    setSendingTest(true);
    setError(null);
    setTestResult(null);
    try {
      const res = await sdk.admin.sendTestWinbackEmail(testEmail, testStepDay);
      setTestResult({
        message: res.message,
        tracking_token: res.tracking_token,
      });
      setActionSuccess(`Email de prueba (Día ${testStepDay}) enviado a ${testEmail}`);
      // Refresh logs
      const updatedLogs = await sdk.admin.listWinbackLogs();
      setLogs(updatedLogs.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar email de prueba");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleTriggerCron() {
    setTriggeringCron(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await sdk.admin.triggerWinbackCron();
      setActionSuccess(
        `Ciclo ejecutado: ${res.evaluated_clinics} clínicas evaluadas, ${res.emails_dispatched} correos enviados.`,
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ejecutar ciclo de winback");
    } finally {
      setTriggeringCron(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      log.tenant_id.toLowerCase().includes(q) ||
      log.recipient_email.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q) ||
      log.tracking_token.toLowerCase().includes(q)
    );
  });

  if (loading && !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Subnav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cancelaciones & Sistema de Winback</h2>
          <p className="text-sm text-slate-500">
            Monitorización en tiempo real con píxel 1x1 por cliente, custodia de 90 días, ventana de reactivación de 30 días y editor de correos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerCron}
            loading={triggeringCron}
            title="Evalúa clínicas canceladas y envía correos pendientes según la cadencia de 5 días"
          >
            ⚡ Ejecutar revisión de envíos
          </Button>
          <Button size="sm" onClick={() => setTestModalOpen(true)}>
            ✉️ Enviar email de prueba
          </Button>
        </div>
      </div>

      {actionSuccess ? <Alert tone="success">{actionSuccess}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab("monitor")}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            subTab === "monitor"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          📊 Monitorización & Píxel por Cliente
        </button>
        <button
          onClick={() => setSubTab("templates")}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            subTab === "templates"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          ✏️ Editor de Plantillas ({templates.length})
        </button>
        <button
          onClick={() => setSubTab("how-it-works")}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            subTab === "how-it-works"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          💡 Cómo Funciona el Sistema
        </button>
      </div>

      {/* 1. MONITOR TAB */}
      {subTab === "monitor" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Canceladas Totales</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{metrics?.total_canceled_clinics ?? 0}</p>
              <span className="text-xs text-slate-400">Custodia 90 días</span>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">En Custodia (90d)</span>
              <p className="mt-2 text-2xl font-bold text-blue-900">{metrics?.active_in_custody ?? 0}</p>
              <span className="text-xs text-blue-600">Periodo de retención</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Correos Enviados</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{metrics?.total_emails_sent ?? 0}</p>
              <span className="text-xs text-slate-400">Total acumulado</span>
            </div>
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Aperturas Píxel</span>
              <p className="mt-2 text-2xl font-bold text-teal-900">{metrics?.open_rate_percent.toFixed(1) ?? "0.0"}%</p>
              <span className="text-xs text-teal-600">{metrics?.total_emails_opened ?? 0} correos leídos</span>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Tasa de Clics</span>
              <p className="mt-2 text-2xl font-bold text-amber-900">{metrics?.click_rate_percent.toFixed(1) ?? "0.0"}%</p>
              <span className="text-xs text-amber-600">{metrics?.total_clicks ?? 0} clics en reactivar</span>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Reactivaciones</span>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{metrics?.reactivation_rate_percent.toFixed(1) ?? "0.0"}%</p>
              <span className="text-xs text-emerald-600">{metrics?.total_reactivations ?? 0} clínicas recuperadas</span>
            </div>
          </div>

          {/* Table of Tracking Logs */}
          <Card
            title="Registro de Envíos y Tracking por Cliente (Píxel 1x1)"
            description="Seguimiento individual de lectura por píxel transparente, clics de reactivación, IP y dispositivo."
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xs flex-1">
                  <Input
                    placeholder="Buscar por tenant, email o token..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Mostrando {filteredLogs.length} de {logs.length} registros
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <EmptyState
                  title="No hay registros de seguimiento"
                  description="Cuando se cancelen cuentas o se envíen emails de prueba, aparecerán los registros con el estado del píxel."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Clínica / Destinatario</th>
                        <th className="px-4 py-3">Paso & Asunto</th>
                        <th className="px-4 py-3">Fecha Envío</th>
                        <th className="px-4 py-3">Píxel (Lectura)</th>
                        <th className="px-4 py-3">Clic Reactivar</th>
                        <th className="px-4 py-3">Reactivación</th>
                        <th className="px-4 py-3 text-right">Detalles Píxel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredLogs.map((log) => {
                        const isOpened = Boolean(log.opened_at);
                        const isClicked = Boolean(log.clicked_at);
                        const isReactivated = Boolean(log.reactivated_at);

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{log.recipient_email}</div>
                              <div className="text-xs text-slate-500">ID: {log.tenant_id.slice(0, 8)}...</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Badge tone={log.step_day >= 15 ? "info" : "neutral"}>
                                  Día {log.step_day}
                                </Badge>
                                {log.step_day >= 15 ? (
                                  <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold text-emerald-800">
                                    +1 Mes Gratis
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-0.5 max-w-xs truncate text-xs text-slate-600" title={log.subject}>
                                {log.subject}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                              {new Date(log.sent_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              {isOpened ? (
                                <div className="space-y-0.5">
                                  <Badge tone="success">
                                    Leído ({log.open_count} {log.open_count === 1 ? "vez" : "veces"})
                                  </Badge>
                                  <div className="text-[11px] text-slate-500">
                                    {new Date(log.opened_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                              ) : (
                                <Badge tone="neutral">No abierto</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isClicked ? (
                                <div className="space-y-0.5">
                                  <Badge tone="info">Clic registrado</Badge>
                                  <div className="text-[11px] text-slate-500">
                                    {new Date(log.clicked_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isReactivated ? (
                                <div className="space-y-0.5">
                                  <Badge tone="success">¡Reactivada!</Badge>
                                  <div className="text-[11px] text-slate-500">
                                    {new Date(log.reactivated_at!).toLocaleDateString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">Pendiente</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-[11px] text-slate-500">
                                {log.ip_address ? <div>IP: {log.ip_address}</div> : null}
                                {log.user_agent ? (
                                  <div className="max-w-[140px] truncate" title={log.user_agent}>
                                    {log.user_agent}
                                  </div>
                                ) : null}
                                <div className="mt-1 font-mono text-[10px] text-slate-400" title={`Token: ${log.tracking_token}`}>
                                  tok: {log.tracking_token.slice(0, 10)}...
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 2. TEMPLATES EDITOR TAB */}
      {subTab === "templates" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Selector de pasos (3 cols) */}
          <div className="space-y-2 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Secuencia de Correos (6)</h3>
            <div className="space-y-1.5">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => selectTemplate(tmpl)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {tmpl.name} (Día {tmpl.step_day})
                      </span>
                      {tmpl.has_free_month_offer ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          1 Mes Gratis
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{tmpl.subject}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulario de edición (5 cols) */}
          <div className="space-y-4 lg:col-span-5">
            <Card
              title={`Editar Plantilla: Día ${selectedTemplate?.step_day ?? ""}`}
              description="Ajusta el asunto, texto preheader y el contenido HTML responsive del correo."
            >
              <div className="space-y-4">
                <Input
                  label="Asunto del correo (Subject)"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Ej: Te echamos de menos en Dentistes..."
                />
                <Input
                  label="Texto Preheader (Vista previa en cliente de correo)"
                  value={editPreviewText}
                  onChange={(e) => setEditPreviewText(e.target.value)}
                  placeholder="Ej: Tus historiales siguen guardados de forma segura..."
                />

                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    id="freeMonthToggle"
                    checked={editFreeMonth}
                    onChange={(e) => setEditFreeMonth(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="freeMonthToggle" className="text-sm font-medium text-slate-900">
                    Incluir oferta de 1 mes sin coste
                    <span className="block text-xs font-normal text-slate-500">
                      Muestra el banner de cortesía y aplica automáticamente el cupón de reactivación.
                    </span>
                  </label>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">Cuerpo HTML (Template)</label>
                    <span className="text-[11px] text-slate-400">Variables: {"{{clinic_name}}"}, {"{{reactivate_url}}"}</span>
                  </div>
                  <textarea
                    rows={14}
                    value={editBodyHtml}
                    onChange={(e) => setEditBodyHtml(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2.5 font-mono text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    onClick={handleSaveTemplate}
                    loading={savingTemplate}
                    disabled={!selectedTemplate}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Vista previa en tiempo real (4 cols) */}
          <div className="space-y-4 lg:col-span-4">
            <Card
              title="Vista Previa en Vivo"
              description="Visualización idéntica a la que recibirá el doctor en su bandeja de entrada."
            >
              <div className="rounded-lg border border-slate-300 bg-slate-100 p-3">
                <div className="mb-2 border-b border-slate-200 bg-white p-2 text-xs">
                  <div><strong>De:</strong> Dentistes &lt;soporte@dentistes.2mes4.com&gt;</div>
                  <div><strong>Asunto:</strong> {editSubject}</div>
                  <div className="text-slate-500"><strong>Preheader:</strong> {editPreviewText}</div>
                </div>
                <div className="max-h-[520px] overflow-y-auto rounded bg-white p-4 shadow-inner">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: editBodyHtml
                        .replace(/\{\{clinic_name\}\}/g, "Clínica Dental Ejemplo")
                        .replace(/\{\{reactivate_url\}\}/g, "#"),
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 3. HOW IT WORKS TAB */}
      {subTab === "how-it-works" && (
        <div className="space-y-6">
          <Card
            title="Arquitectura y Flujo del Sistema de Retención & Winback"
            description="Explicación detallada del ciclo de vida tras la cancelación, custodia de datos y seguimiento."
          >
            <div className="space-y-8">
              {/* Diagrama de pasos */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    1
                  </div>
                  <h4 className="mt-3 font-semibold text-slate-900">Cancelación de Cuenta</h4>
                  <p className="mt-1 text-xs text-slate-600">
                    La suscripción de Stripe se cancela. Se fija un periodo de <strong>90 días de custodia</strong> y <strong>30 días de periodo preferente de reactivación</strong>.
                  </p>
                </div>

                <div className="relative rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    2
                  </div>
                  <h4 className="mt-3 font-semibold text-blue-900">Cadencia cada 5 días</h4>
                  <p className="mt-1 text-xs text-blue-700">
                    Se envían 6 correos automatizados en los días <strong>5, 10, 15, 20, 25 y 30</strong>. Cada mensaje tiene un enfoque y propuesta de valor diferente.
                  </p>
                </div>

                <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    3
                  </div>
                  <h4 className="mt-3 font-semibold text-emerald-900">Día 15: Oferta 1 Mes Gratis</h4>
                  <p className="mt-1 text-xs text-emerald-700">
                    A partir del día 15 (días 15, 20, 25 y 30) se añade un incentivo irresistible: <strong>1 mes completamente gratuito</strong> al reactivar la clínica.
                  </p>
                </div>

                <div className="relative rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                    4
                  </div>
                  <h4 className="mt-3 font-semibold text-purple-900">Tracking con Píxel 1x1</h4>
                  <p className="mt-1 text-xs text-purple-700">
                    Cada email incluye una imagen 1x1 transparente única por cliente. Cuando el cliente abre el correo, el servidor registra su IP, User-Agent y timestamp de apertura.
                  </p>
                </div>
              </div>

              {/* Detalles técnicos */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-slate-200 p-5">
                  <h4 className="text-base font-semibold text-slate-900">🔍 ¿Cómo funciona el Píxel de Tracking?</h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-600">•</span>
                      <span>
                        Se inyecta al final del correo una etiqueta:
                        <code className="block mt-1 bg-slate-100 p-1.5 rounded text-slate-800">
                          &lt;img src="https://api.dentistes.2mes4.com/tracking/pixel/[token]" width="1" height="1" /&gt;
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-600">•</span>
                      <span>
                        El servidor responde con un PNG transparente de 1x1 con cabeceras estrictas <code>Cache-Control: no-cache, no-store, must-revalidate</code> para forzar la petición en cada apertura.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-600">•</span>
                      <span>
                        Registra la fecha y hora de la primera y última apertura, el número total de lecturas, la dirección IP y el cliente de correo (User-Agent).
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 p-5">
                  <h4 className="text-base font-semibold text-slate-900">⚡ Reactivación en 1 Clic</h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600">•</span>
                      <span>
                        El botón principal del correo dirige a:
                        <code className="block mt-1 bg-slate-100 p-1.5 rounded text-slate-800">
                          https://api.dentistes.2mes4.com/tracking/click/[token]
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600">•</span>
                      <span>
                        El backend registra el clic de forma instantánea y redirige a la página de reactivación de la clínica.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600">•</span>
                      <span>
                        Al reactivarse, el estado del tenant vuelve a <code>ACTIVE</code>, se detiene la secuencia de correos para que no reciba más avisos de cancelación, y si tenía la oferta de 1 mes gratis, se activa en su cuenta.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Test Email Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Enviar Email de Prueba</h3>
            <p className="mt-1 text-xs text-slate-500">
              Comprueba el diseño del email y el funcionamiento del píxel de tracking enviándolo a tu bandeja.
            </p>

            <div className="mt-4 space-y-4">
              <Input
                label="Email destinatario"
                type="email"
                placeholder="tu-correo@ejemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />

              <div>
                <label className="text-xs font-medium text-slate-700">Paso de la secuencia</label>
                <select
                  value={testStepDay}
                  onChange={(e) => setTestStepDay(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value={5}>Día 5 · ¿Todo bien? Recordatorio de datos</option>
                  <option value={10}>Día 10 · Historias clínicas y citas intactas</option>
                  <option value={15}>Día 15 · 🎁 Oferta 1 Mes Gratis</option>
                  <option value={20}>Día 20 · 🎁 Quedan 10 días + 1 Mes Gratis</option>
                  <option value={25}>Día 25 · 🎁 Recta final de reactivación</option>
                  <option value={30}>Día 30 · ⚠️ Último día de periodo preferente</option>
                </select>
              </div>

              {testResult ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                  <p className="font-semibold">{testResult.message}</p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-600">Token: {testResult.tracking_token}</p>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setTestModalOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={handleSendTestEmail} loading={sendingTest} disabled={!testEmail.trim()}>
                  Enviar prueba ahora
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
