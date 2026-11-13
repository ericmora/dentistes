import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { Alert, Badge, Button, Card, Input, Select } from "@dentistes/ui";
import { useSession } from "../lib/session";

const BASE_DOMAIN = import.meta.env.VITE_TENANT_BASE_DOMAIN ?? "dentistes.2mes4.com";

function slugifyClinic(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const LOCALE_OPTIONS = [
  { value: "ca-ES", label: "Català (Espanya / Europa)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "es-MX", label: "Español (México / LATAM)" },
  { value: "en-GB", label: "English" },
];

const COUNTRY_OPTIONS = [
  { value: "ES", label: "Espanya (EUR €)" },
  { value: "MX", label: "Mèxic (MXN $)" },
  { value: "CO", label: "Colòmbia (USD $)" },
  { value: "CL", label: "Xile (USD $)" },
  { value: "PE", label: "Perú (USD $)" },
  { value: "AR", label: "Argentina (USD $)" },
  { value: "CR", label: "Costa Rica (USD $)" },
  { value: "EC", label: "Equador (USD $)" },
  { value: "DO", label: "Rep. Dominicana (USD $)" },
  { value: "UY", label: "Uruguai (USD $)" },
  { value: "US", label: "Estats Units / Internacional (USD $)" },
];

function taxLabelForCountry(code: string): { label: string; placeholder: string } {
  switch (code) {
    case "MX":
      return { label: "RFC de la clínica (opcional)", placeholder: "XAXX010101000" };
    case "CO":
      return { label: "NIT / Cédula tributària (opcional)", placeholder: "900123456-1" };
    case "PE":
      return { label: "RUC de la clínica (opcional)", placeholder: "20123456789" };
    case "CL":
      return { label: "RUT de la clínica (opcional)", placeholder: "76123456-7" };
    case "AR":
      return { label: "CUIT de la clínica (opcional)", placeholder: "30712345678" };
    default:
      return { label: "NIF / CIF de la clínica (opcional)", placeholder: "B12345678" };
  }
}

function defaultCurrencyForCountry(code: string): string {
  if (code === "ES") return "EUR";
  if (code === "MX") return "MXN";
  return "USD";
}

export function OnboardingPage() {
  const { sdk, me, onboarding } = useSession();
  const [params] = useSearchParams();
  const canceled = params.get("checkout") === "cancel";
  const demo = params.get("demo") === "1";

  const [step, setStep] = useState<1 | 2>(1);
  const [clinicName, setClinicName] = useState(() => params.get("tenant_name") ?? "");
  const [subdomainTouched, setSubdomainTouched] = useState(() => Boolean(params.get("subdomain")));
  const [customSubdomain, setCustomSubdomain] = useState(() => params.get("subdomain") ?? "");
  const [cabinetsCount, setCabinetsCount] = useState(1);
  const [country, setCountry] = useState(() => {
    const raw = (params.get("country") ?? params.get("country_code") ?? "").toUpperCase();
    return raw && raw.length === 2 ? raw : "ES";
  });
  const [currency, setCurrency] = useState(() => {
    const raw = (params.get("currency") ?? "").toUpperCase();
    if (raw === "EUR" || raw === "MXN" || raw === "USD") return raw;
    return defaultCurrencyForCountry(country);
  });
  const [taxId, setTaxId] = useState("");
  const [locale, setLocale] = useState(() => {
    const lang = params.get("lang");
    if (lang === "es") return "es-ES";
    if (lang === "en") return "en-GB";
    return "ca-ES";
  });
  const [fullName, setFullName] = useState(() => params.get("contact_name") ?? "");
  const [email, setEmail] = useState(() => params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subdomain = useMemo(() => {
    if (subdomainTouched) return slugifyClinic(customSubdomain);
    return slugifyClinic(clinicName);
  }, [clinicName, customSubdomain, subdomainTouched]);

  const pendingStripeActivation = Boolean(me && me.billing?.status === "INCOMPLETE");

  async function resumeStripeCheckout() {
    setError(null);
    setLoading(true);
    try {
      const { url } = await sdk.billing.checkout(me?.billing?.plan_key || "base");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No s'ha pogut iniciar Stripe Checkout");
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await onboarding({
        clinic_name: clinicName.trim(),
        subdomain: subdomain || undefined,
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        cabinets_count: cabinetsCount,
        locale,
        country_code: country,
        currency,
        tax_id: taxId.trim() || undefined,
        plan_key: "base",
      });
      window.location.href = res.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No s'ha pogut completar l'onboarding");
      setLoading(false);
    }
  }

  if (pendingStripeActivation && me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Dentistes</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Activa els teus 30 dies de prova</h1>
            <p className="mt-1 text-sm text-slate-500">
              Clínica creada: <strong>{me.active_tenant.name}</strong> ({me.active_tenant.subdomain}.{BASE_DOMAIN})
            </p>
          </div>
          <Card>
            <div className="space-y-4">
              {canceled ? (
                <Alert tone="warning">
                  Has cancel·lat el pas de Stripe. Afegeix la targeta sense càrrec avui per activar els 30 dies de prova.
                </Alert>
              ) : null}
              {error ? <Alert tone="danger">{error}</Alert> : null}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Pla Base Essencial</span>
                  <Badge tone="info">30 dies gratis</Badge>
                </div>
                <p className="mt-1 text-slate-600">$0,00 USD avui · Després $18.50 USD/mes. Cancel·lació en un clic.</p>
              </div>
              <Button onClick={() => void resumeStripeCheckout()} loading={loading} className="w-full">
                <CreditCard className="h-4 w-4" />
                Activar 30 dies a Stripe
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Dentistes</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Obre la teva clínica en 1 minut</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pas {step} de 2 · 30 dies de prova gratis activant Stripe ($0 avui, després $18.50 USD/mes)
          </p>
        </div>

        <Card>
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className={step === 1 ? "text-brand-700 font-semibold" : "text-confirmed inline-flex items-center gap-1"}>
              {step === 2 ? <CheckCircle2 className="h-3.5 w-3.5" /> : "1."} Dades bàsiques
            </span>
            <span>→</span>
            <span className={step === 2 ? "text-brand-700 font-semibold" : ""}>2. Responsable i Stripe</span>
          </div>

          {demo ? (
            <div className="mb-4">
              <Alert tone="info">
                Has sol·licitat una demo. Si vols començar ja, crea la clínica ara i activa els 30 dies amb Stripe.
              </Alert>
            </div>
          ) : null}
          {error ? (
            <div className="mb-4">
              <Alert tone="danger">{error}</Alert>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <Input
                label="Com es diu la teva clínica?"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Clínica Dental Garraf"
                required
              />
              <Input
                label="Adreça web de la clínica"
                value={subdomainTouched ? customSubdomain : subdomain}
                onChange={(e) => {
                  setSubdomainTouched(true);
                  setCustomSubdomain(e.target.value.toLowerCase());
                }}
                hint={`Accedireu a https://${subdomain || "la-teva-clinica"}.${BASE_DOMAIN}`}
                required
              />

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Quants gabinets / boxes teniu?</span>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCabinetsCount(n)}
                      className={`min-h-[44px] rounded-lg border text-sm font-semibold transition ${
                        cabinetsCount === n
                          ? "border-brand-600 bg-brand-50 text-brand-800"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {n === 5 ? "5+" : n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="País de la clínica"
                  options={COUNTRY_OPTIONS}
                  value={country}
                  onChange={(val) => {
                    setCountry(val);
                    setCurrency(defaultCurrencyForCountry(val));
                  }}
                  placeholder=""
                />
                <Select
                  label="Divisa de subscripció"
                  options={[
                    { value: "EUR", label: "EUR (€)" },
                    { value: "MXN", label: "MXN ($)" },
                    { value: "USD", label: "USD ($)" },
                  ]}
                  value={currency}
                  onChange={setCurrency}
                  placeholder=""
                />
              </div>

              <Input
                label={taxLabelForCountry(country).label}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                placeholder={taxLabelForCountry(country).placeholder}
              />

              <Select
                label="Idioma principal"
                options={LOCALE_OPTIONS}
                value={locale}
                onChange={setLocale}
                placeholder=""
              />

              <Button
                className="w-full"
                disabled={clinicName.trim().length < 2 || subdomain.length < 2}
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Nom del responsable"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dra. Laia Serra"
                required
              />
              <Input
                label="Email de treball"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="laia@clinica.cat"
                required
              />
              <Input
                label="Contrasenya"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="Mínim 10 caràcters"
                minLength={10}
                required
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    Activació amb Stripe · 30 dies gratis ({currency})
                  </span>
                  <span className="tabular-nums">
                    {currency === "EUR" ? "0 € avui" : currency === "MXN" ? "$0 MXN avui" : "$0 avui"}
                  </span>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  Al següent pas introduiràs la targeta a Stripe Checkout per activar els 30 dies de prova del Pla Base
                  Essencial. No es cobra res fins al dia 31 ({currency === "EUR" ? "49 €/mes" : currency === "MXN" ? "$999 MXN/mes" : "$49 USD/mes"}). Cancel·lació en un clic.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  Enrere
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  <CreditCard className="h-4 w-4" />
                  Crear clínica i posar Stripe
                </Button>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            Ja tens compte?{" "}
            <Link className="font-medium text-brand-700 hover:underline" to="/login">
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
