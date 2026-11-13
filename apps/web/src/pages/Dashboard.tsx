import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, Card, PageHeader, Stat } from "@dentistes/ui";
import { useSession } from "../lib/session";

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export function DashboardPage() {
  const { me } = useSession();
  if (!me) return null;

  const enabled = useMemo(
    () => me.feature_catalog.filter((feature) => me.features[feature.key]),
    [me],
  );
  const blocked = Boolean(me.entitlements.blocked_reason);

  return (
    <div>
      <PageHeader
        title={`Hola, ${me.user.full_name.split(" ")[0]}`}
        description={`${me.active_tenant.name} · ${me.active_tenant.subdomain}`}
        actions={
          <Link className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700" to="/billing">
            Gestionar suscripción
          </Link>
        }
      />

      {blocked ? (
        <div className="mb-6">
          <Alert
            tone={me.billing?.status === "INCOMPLETE" ? "warning" : "danger"}
            title={
              me.billing?.status === "INCOMPLETE"
                ? "Falta completar Stripe para activar los 30 días de prueba"
                : "Acceso a funcionalidades bloqueado"
            }
          >
            {me.billing?.status === "INCOMPLETE" ? (
              <span>
                La clínica está creada pero aún no se ha validado la tarjeta en Stripe ($0 hoy).{" "}
                <Link className="font-semibold underline" to="/onboarding">
                  Activar 30 días con Stripe →
                </Link>
              </span>
            ) : (
              "La suscripción no está activa. Las funciones de pago están deshabilitadas hasta regularizar el pago."
            )}
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Plan" value={me.entitlements.plan_key || "—"} />
        <Stat label="Suscripción" value={me.billing?.status ?? "—"} hint={me.billing?.current_period_end ? `Renueva: ${formatDate(me.billing.current_period_end)}` : undefined} />
        <Stat label="Rol" value={me.role} />
        <Stat label="Funciones activas" value={`${enabled.length} / ${me.feature_catalog.length}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Funcionalidades" description="Según tu plan y los módulos activos de la clínica" className="lg:col-span-2">
          <ul className="grid gap-3 sm:grid-cols-2">
            {me.feature_catalog.map((feature) => {
              const active = me.features[feature.key];
              return (
                <li key={feature.key} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{feature.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{feature.description}</p>
                    </div>
                    <Badge tone={active ? "success" : "neutral"}>{active ? "Activa" : "Bloqueada"}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card title="Tu sesión">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{me.user.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Clínica</dt>
                <dd className="font-medium text-slate-900">{me.active_tenant.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Prueba hasta</dt>
                <dd className="font-medium text-slate-900">{formatDate(me.active_tenant.trial_ends_at)}</dd>
              </div>
            </dl>
          </Card>
          <Card title="Permisos" description="RBAC del rol activo">
            <div className="flex flex-wrap gap-2">
              {me.permissions.map((permission) => (
                <Badge key={permission} tone="info">
                  {permission}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
