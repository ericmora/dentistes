import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Spinner,
  formatMoney,
} from "@dentistes/ui";
import {
  DentistesClient,
  type Feature,
  type Lead,
  type LeadStatus,
  type Plan,
  type TenantDomain,
  type TenantSummary,
  type User,
} from "@dentistes/sdk";

const sdk = new DentistesClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  mode: "browser",
});

type Tab = "tenants" | "plans" | "leads";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    sdk
      .refreshSession()
      .then((res) => {
        if (!active) return;
        if (res?.user.is_platform_admin) setUser(res.user);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return <AdminApp user={user} onLogout={() => setUser(null)} />;
}

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await sdk.login(email, password);
      if (!res.user.is_platform_admin) {
        await sdk.logout();
        throw new Error("Esta cuenta no es platform admin");
      }
      onLogin(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Dentistes</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Administración global</h1>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-xl">
          <form className="space-y-4" onSubmit={onSubmit}>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("tenants");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Dentistes</p>
            <h1 className="text-lg font-semibold">Administración global</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => void sdk.logout().then(onLogout)}>
              Salir
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-4">
          {([
            ["tenants", "Tenants"],
            ["plans", "Planes"],
            ["leads", "Leads"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
                tab === key ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {tab === "tenants" ? <TenantsPanel /> : tab === "plans" ? <PlansPanel /> : <LeadsPanel />}
      </main>
    </div>
  );
}

function TenantsPanel() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [effective, setEffective] = useState<Record<string, boolean>>({});
  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisionMessage, setProvisionMessage] = useState<string | null>(null);

  const loadTenantFeatures = useCallback(async (tenantId: string) => {
    const res = await sdk.admin.getTenantFeatures(tenantId);
    setFeatures(res.features);
    setEffective(res.effective);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [t, f] = await Promise.all([sdk.admin.listTenants(), sdk.admin.listFeatures()]);
      setTenants(t.tenants);
      setFeatures(f.features);
      if (!selected && t.tenants.length > 0) setSelected(t.tenants[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los tenants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadTenantFeatures(selected).catch((err) => {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las funcionalidades");
    });
    sdk.admin
      .getTenantDomains(selected)
      .then((res) => setDomains(res.domains))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los dominios"));
  }, [selected, loadTenantFeatures]);

  async function reprovision(tenantId: string) {
    setProvisionMessage(null);
    try {
      await sdk.admin.provisionTenant(tenantId);
      setProvisionMessage("Provisionamiento solicitado. El worker lo procesará en breve.");
      const res = await sdk.admin.getTenantDomains(tenantId);
      setDomains(res.domains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo solicitar el provisionamiento");
    }
  }

  async function setStatus(tenantId: string, status: string) {
    try {
      await sdk.admin.setTenantStatus(tenantId, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    }
  }

  async function toggleFeature(featureKey: string, enabled: boolean) {
    if (!selected) return;
    try {
      await sdk.admin.setTenantFeature(selected, featureKey, enabled);
      await loadTenantFeatures(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la funcionalidad");
    }
  }

  const selectedTenant = tenants.find((t) => t.id === selected);

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Estado, plan y funcionalidades por clínica"
        actions={
          <Button variant="outline" onClick={() => void load()}>
            Recargar
          </Button>
        }
      />
      {error ? (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Clínicas" className="lg:col-span-2">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : tenants.length === 0 ? (
            <EmptyState title="Sin tenants" description="Aún no se ha registrado ninguna clínica." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Clínica</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Suscripción</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className={selected === tenant.id ? "bg-brand-50/60" : undefined}>
                      <td className="py-3">
                        <button className="text-left font-medium text-brand-700 hover:underline" onClick={() => setSelected(tenant.id)}>
                          {tenant.name}
                        </button>
                        <p className="text-xs text-slate-500">{tenant.subdomain}</p>
                      </td>
                      <td className="py-3 text-slate-700">{tenant.plan_key || "—"}</td>
                      <td className="py-3">
                        <Badge tone={tenant.subscription_status === "ACTIVE" ? "success" : tenant.subscription_status === "PAST_DUE" ? "warning" : "neutral"}>
                          {tenant.subscription_status || "—"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge tone={tenant.status === "ACTIVE" ? "success" : tenant.status === "SUSPENDED" ? "danger" : "warning"}>{tenant.status}</Badge>
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant={tenant.status === "SUSPENDED" ? "primary" : "outline"}
                          onClick={() => void setStatus(tenant.id, tenant.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}
                        >
                          {tenant.status === "SUSPENDED" ? "Reactivar" : "Suspender"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Funcionalidades"
          description={selectedTenant ? `${selectedTenant.name} · overrides del plan` : "Selecciona una clínica"}
        >
          {selectedTenant ? (
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{feature.name}</p>
                    <p className="text-xs text-slate-500">{feature.key}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-brand-600"
                    checked={effective[feature.key] ?? false}
                    onChange={(e) => void toggleFeature(feature.key, e.target.checked)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Elige una clínica en la tabla.</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Estado efectivo del tenant. Al cambiar un checkbox se crea o actualiza un override sobre el plan.
          </p>
          {selectedTenant ? (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900">Dominio y TLS</p>
              {domains.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">Sin dominio registrado.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {domains.map((domain) => (
                    <li key={domain.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">{domain.hostname}</span>
                        <Badge tone={domain.status === "READY" ? "success" : domain.status === "FAILED" ? "danger" : "warning"}>
                          {domain.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-slate-500">TLS: {domain.tls_secret_name}</p>
                      {domain.last_error ? <p className="mt-1 text-red-700">{domain.last_error}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
              <Button size="sm" variant="outline" className="mt-3" onClick={() => void reprovision(selected)}>
                Reprovisionar
              </Button>
              {provisionMessage ? <p className="mt-2 text-xs text-slate-500">{provisionMessage}</p> : null}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await sdk.admin.listPlans();
      setPlans(res.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los planes");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="Planes" description="Precio y Stripe Price ID por plan" />
      {error ? (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanEditor key={plan.key} plan={plan} onSaved={load} />
        ))}
      </div>
    </div>
  );
}

function PlanEditor({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [price, setPrice] = useState(String(plan.price_monthly_cents));
  const [stripePrice, setStripePrice] = useState(plan.stripe_price_id ?? "");
  const [active, setActive] = useState(plan.is_active);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      await sdk.admin.updatePlan(plan.key, {
        price_monthly_cents: Number(price) || 0,
        stripe_price_id: stripePrice,
        is_active: active,
      });
      setMessage("Guardado");
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={plan.name} description={plan.key}>
      <div className="space-y-3">
        <Input label="Precio mensual (céntimos)" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
        <p className="text-xs text-slate-500">{formatMoney(Number(price) || 0, plan.currency)} / mes</p>
        <Input label="Stripe Price ID" value={stripePrice} onChange={(e) => setStripePrice(e.target.value)} placeholder="price_..." />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Plan activo
        </label>
        <Button onClick={() => void save()} loading={saving} className="w-full">
          Guardar
        </Button>
        {message ? <p className="text-xs text-slate-500">{message}</p> : null}
      </div>
    </Card>
  );
}

const LEAD_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "ARCHIVED"];

function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sdk.admin.listLeads(statusFilter ? { status: statusFilter } : {});
      setLeads(res.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los leads");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: LeadStatus) {
    try {
      await sdk.admin.updateLeadStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el lead");
    }
  }

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Solicitudes de demo y contacto desde la web comercial"
        actions={
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
            >
              <option value="">Todos los estados</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => void load()}>
              Recargar
            </Button>
          </div>
        }
      />
      {error ? (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}
      <Card title="Solicitudes recibidas">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : leads.length === 0 ? (
          <EmptyState title="Sin leads" description="No hay solicitudes de demo o contacto registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Clínica / Contacto</th>
                  <th className="py-2">Email / Teléfono</th>
                  <th className="py-2">Interés</th>
                  <th className="py-2">Origen</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{lead.clinic_name}</p>
                      <p className="text-xs text-slate-500">{lead.contact_name}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-slate-800">{lead.email}</p>
                      <p className="text-xs text-slate-500">{lead.phone || "—"}</p>
                    </td>
                    <td className="py-3">
                      <Badge tone={lead.interest === "DEMO" ? "info" : "neutral"}>{lead.interest}</Badge>
                      <span className="ml-2 text-xs uppercase text-slate-400">{lead.lang}</span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      <p>{lead.source}</p>
                      {lead.utm_source ? <p>utm: {lead.utm_source}</p> : null}
                    </td>
                    <td className="py-3">
                      <select
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                        value={lead.status}
                        onChange={(e) => void updateStatus(lead.id, e.target.value as LeadStatus)}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
