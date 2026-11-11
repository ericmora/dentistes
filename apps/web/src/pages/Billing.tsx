import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, PageHeader, PermissionGate, formatMoney } from "@dentistes/ui";
import type { Entitlements, Plan, Subscription } from "@dentistes/sdk";
import { useSession } from "../lib/session";

export function BillingPage() {
  const { sdk, me } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([sdk.billing.subscription(), sdk.plans()])
      .then(([billing, catalog]) => {
        if (!active) return;
        setSubscription(billing.subscription);
        setEntitlements(billing.entitlements);
        setPlans(catalog.plans);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar la facturación");
      });
    return () => {
      active = false;
    };
  }, [sdk]);

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

  return (
    <div>
      <PageHeader
        title="Facturación"
        description="Suscripción, plan y métodos de pago"
        actions={
          <PermissionGate me={me} permission="billing:manage">
            <Button variant="outline" onClick={openPortal} loading={busy === "portal"}>
              Portal de facturación
            </Button>
          </PermissionGate>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      {entitlements?.blocked_reason ? (
        <div className="mb-4">
          <Alert tone="warning" title="Funcionalidades bloqueadas">
            {entitlements.blocked_reason === "subscription_inactive"
              ? "No hay una suscripción activa. Elige un plan para reactivar el acceso."
              : `Motivo: ${entitlements.blocked_reason}`}
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card title="Plan actual">
          <p className="text-2xl font-semibold text-slate-900">{subscription?.plan_key ?? "—"}</p>
        </Card>
        <Card title="Estado">
          <Badge tone={entitlements?.blocked_reason ? "danger" : "success"}>{subscription?.status ?? "—"}</Badge>
        </Card>
        <Card title="Renovación">
          <p className="text-sm text-slate-700">{subscription?.current_period_end ?? "—"}</p>
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
                <PermissionGate me={me} permission="billing:manage" fallback={<p className="text-xs text-slate-500">Solo owners/admins pueden cambiar el plan</p>}>
                  <Button
                    className="w-full"
                    variant={current ? "outline" : "primary"}
                    disabled={current || !plan.is_active}
                    loading={busy === plan.key}
                    onClick={() => checkout(plan.key)}
                  >
                    {current ? "Plan actual" : "Elegir plan"}
                  </Button>
                </PermissionGate>
              }
            >
              <p className="text-3xl font-semibold text-slate-900">
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
    </div>
  );
}
