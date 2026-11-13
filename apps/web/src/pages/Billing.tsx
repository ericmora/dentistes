import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PermissionGate,
  formatMoney,
  useToast,
} from "@dentistes/ui";
import type { Entitlements, FiscalCapabilitiesResponse, Plan, StripeInvoice, Subscription } from "@dentistes/sdk";
import { useSession } from "../lib/session";

export function BillingPage({ embedded = false }: { embedded?: boolean }) {
  const { sdk, me, reload } = useSession();
  const { notify } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
  const [fiscalCaps, setFiscalCaps] = useState<FiscalCapabilitiesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [billing, catalog, inv, caps] = await Promise.all([
        sdk.billing.subscription(),
        sdk.plans(),
        sdk.billing.invoices().catch(() => ({ invoices: [] as StripeInvoice[] })),
        sdk.fiscal.getCapabilities().catch(() => null),
      ]);
      setSubscription(billing.subscription);
      setEntitlements(billing.entitlements);
      setPlans(catalog.plans);
      setInvoices(inv.invoices);
      setFiscalCaps(caps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la facturación");
    }
  }, [sdk]);

  async function joinFiscalWaitlist() {
    setBusy("waitlist");
    setError(null);
    try {
      const updated = await sdk.fiscal.joinWaitlist("fiscal.electronic_invoicing", "Solicitud desde panel");
      setFiscalCaps(updated);
      notify({ tone: "success", title: "Solicitud registrada", description: "Te avisaremos tan pronto como activemos el conector tributario." });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la solicitud");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function checkout(planKey: string) {
    setBusy(planKey);
    setError(null);
    try {
      const { url } = await sdk.billing.checkout(planKey);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago");
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const { url } = await sdk.billing.portal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el portal de facturación");
      setBusy(null);
    }
  }

  async function cancelSubscription() {
    setBusy("cancel");
    setError(null);
    try {
      const res = await sdk.billing.cancel(false);
      setSubscription(res.subscription);
      setEntitlements(res.entitlements);
      setCancelConfirmOpen(false);
      await reload();
      notify({
        tone: "info",
        title: "Cancelación programada",
        description: "Mantendrás acceso hasta el final del periodo actual.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la suscripción");
    } finally {
      setBusy(null);
    }
  }

  async function resumeSubscription() {
    setBusy("resume");
    setError(null);
    try {
      const res = await sdk.billing.resume();
      setSubscription(res.subscription);
      setEntitlements(res.entitlements);
      await reload();
      notify({ tone: "success", title: "Suscripción reactivada" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reactivar la suscripción");
    } finally {
      setBusy(null);
    }
  }

  const canCancel = Boolean(subscription && subscription.status !== "CANCELED" && subscription.status !== "INCOMPLETE");

  return (
    <div className="space-y-6">
      {!embedded ? (
        <PageHeader
          title="Facturación y suscripción"
          description="Plan, mes gratuito de prueba, descarga de facturas y métodos de pago"
          actions={
            <PermissionGate me={me} permission="billing:manage">
              <Button variant="outline" onClick={openPortal} loading={busy === "portal"}>
                Portal de facturación Stripe
              </Button>
            </PermissionGate>
          }
        />
      ) : (
        <div className="flex justify-end">
          <PermissionGate me={me} permission="billing:manage">
            <Button variant="outline" size="sm" onClick={openPortal} loading={busy === "portal"}>
              Portal de facturación Stripe
            </Button>
          </PermissionGate>
        </div>
      )}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {entitlements?.blocked_reason ? (
        <Alert tone="warning" title="Funcionalidades bloqueadas">
          {subscription?.status === "INCOMPLETE"
            ? "Falta completar el paso de Stripe para activar tu mes gratuito de 30 días ($0 hoy)."
            : entitlements.blocked_reason === "subscription_inactive"
              ? "No hay una suscripción activa. Elige el plan para reactivar el acceso."
              : `Motivo: ${entitlements.blocked_reason}`}
        </Alert>
      ) : null}

      {subscription?.cancel_at_period_end ? (
        <Alert tone="warning" title="Cancelación programada">
          La suscripción se cancelará al finalizar el periodo actual. Puedes reactivarla en cualquier momento antes de esa fecha.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Plan actual">
          <p className="text-2xl font-semibold text-slate-900">{subscription?.plan_key ?? "—"}</p>
        </Card>
        <Card title="Estado">
          <div className="flex items-center gap-2">
            <Badge tone={entitlements?.blocked_reason ? "danger" : "success"}>{subscription?.status ?? "—"}</Badge>
            {subscription?.cancel_at_period_end ? <Badge tone="warning">Se cancela al renovar</Badge> : null}
          </div>
        </Card>
        <Card title={subscription?.status === "TRIALING" ? "Fin del mes gratuito" : "Próxima renovación"}>
          <p className="text-sm tabular-nums text-slate-700">
            {subscription?.trial_ends_at && subscription.status === "TRIALING"
              ? new Date(subscription.trial_ends_at).toLocaleDateString("es-ES")
              : subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString("es-ES")
                : "—"}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const current = subscription?.plan_key === plan.key;
          return (
            <Card
              key={plan.key}
              title={plan.name}
              description={plan.description}
              footer={
                <PermissionGate me={me} permission="billing:manage" fallback={<p className="text-xs text-slate-500">Solo owners/admins pueden gestionar el plan</p>}>
                  <Button
                    className="w-full"
                    variant={current && subscription?.status !== "INCOMPLETE" ? "outline" : "primary"}
                    disabled={(current && subscription?.status !== "INCOMPLETE") || !plan.is_active}
                    loading={busy === plan.key}
                    onClick={() => checkout(plan.key)}
                  >
                    {current && subscription?.status !== "INCOMPLETE"
                      ? "Plan actual"
                      : subscription?.status === "INCOMPLETE"
                        ? "Activar mes gratuito con Stripe"
                        : "Elegir plan"}
                  </Button>
                </PermissionGate>
              }
            >
              <p className="text-3xl font-semibold tabular-nums text-slate-900">
                {formatMoney(plan.price_monthly_cents, plan.currency)}
                <span className="text-sm font-normal text-slate-500">/mes</span>
              </p>
              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {fiscalCaps ? (
        <Card
          title="Cumplimiento Fiscal y Facturación Regional"
          description={`Jurisdicción: ${fiscalCaps.country_code} · Divisa clínica: ${fiscalCaps.currency}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Autoridad Tributaria / Normativa</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {fiscalCaps.localization.fiscal_authority} ({fiscalCaps.localization.document_label})
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">
                  {fiscalCaps.localization.tax_id_label} de la clínica
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {me?.active_tenant.tax_id || "No registrado (opcional en el registro inicial)"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  <span className="font-semibold text-slate-900">Módulo de Facturación Electrónica</span>
                  {fiscalCaps.features.electronic_invoicing.enabled ? (
                    <Badge tone="success">Activo ({fiscalCaps.features.electronic_invoicing.status})</Badge>
                  ) : fiscalCaps.features.electronic_invoicing.status === "COMING_SOON" ? (
                    <Badge tone="warning">En integración (Próximamente)</Badge>
                  ) : (
                    <Badge tone="neutral">Recibos internos</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {fiscalCaps.features.electronic_invoicing.ui_notice ||
                    "Conexión directa y emisión fiscal homologada para tratamientos dentales."}
                </p>
              </div>

              {fiscalCaps.features.electronic_invoicing.status === "COMING_SOON" ? (
                fiscalCaps.features.electronic_invoicing.waitlist_joined ? (
                  <Badge tone="info">Solicitud registrada en lista de espera</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy === "waitlist"}
                    onClick={() => void joinFiscalWaitlist()}
                  >
                    Solicitar activación prioritaria ({fiscalCaps.localization.fiscal_authority})
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      <PermissionGate me={me} permission="billing:manage">
        <Card title="Facturas de Stripe" description="Histórico de cobros y descarga en PDF">
          {invoices.length === 0 ? (
            <EmptyState
              title="Sin facturas emitidas todavía"
              description="Durante el mes gratuito ($0) o antes del primer cobro no hay facturas pagadas."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Número</th>
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Importe</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2 text-right">Descarga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 font-medium text-slate-900">{inv.number || inv.id}</td>
                      <td className="py-3 tabular-nums text-slate-600">
                        {new Date(inv.created * 1000).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 tabular-nums text-slate-800">
                        {formatMoney(inv.amount_paid || inv.amount_due, inv.currency.toUpperCase())}
                      </td>
                      <td className="py-3">
                        <Badge tone={inv.status === "paid" ? "success" : "warning"}>{inv.status}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {inv.invoice_pdf ? (
                            <a
                              href={inv.invoice_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </a>
                          ) : null}
                          {inv.hosted_invoice_url ? (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Ver
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {canCancel ? (
          <Card title="Gestión de la suscripción" description="Cancela la renovación automática cuando lo necesites">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                {subscription?.cancel_at_period_end
                  ? "La cancelación automática está programada para el final del periodo actual."
                  : "Si cancelas la suscripción, no se realizará ningún cargo al finalizar el periodo actual."}
              </p>
              {subscription?.cancel_at_period_end ? (
                <Button variant="secondary" loading={busy === "resume"} onClick={() => void resumeSubscription()}>
                  <RefreshCw className="h-4 w-4" />
                  Reactivar suscripción
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => setCancelConfirmOpen(true)}>
                  <XCircle className="h-4 w-4" />
                  Cancelar suscripción
                </Button>
              )}
            </div>
          </Card>
        ) : null}
      </PermissionGate>

      <ConfirmDialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => void cancelSubscription()}
        loading={busy === "cancel"}
        danger
        title="¿Cancelar suscripción?"
        description="Se desactivará la renovación automática en Stripe. Seguirás teniendo acceso hasta que finalice el mes gratuito o el periodo ya pagado."
        confirmLabel="Sí, cancelar al final del periodo"
      />
    </div>
  );
}
