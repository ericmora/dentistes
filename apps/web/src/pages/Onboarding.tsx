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
  { value: "es-ES", label: "Español (España)" },
  { value: "es-MX", label: "Español (México / LATAM)" },
  { value: "ca-ES", label: "Català" },
  { value: "en-GB", label: "English" },
];

const COUNTRY_OPTIONS = [
  { value: "ES", label: "España (EUR €)" },
  { value: "MX", label: "México (MXN $)" },
  { value: "CO", label: "Colombia (USD $)" },
  { value: "CL", label: "Chile (USD $)" },
  { value: "PE", label: "Perú (USD $)" },
  { value: "AR", label: "Argentina (USD $)" },
  { value: "CR", label: "Costa Rica (USD $)" },
  { value: "EC", label: "Ecuador (USD $)" },
  { value: "DO", label: "Rep. Dominicana (USD $)" },
  { value: "UY", label: "Uruguay (USD $)" },
  { value: "US", label: "Estados Unidos / Internacional (USD $)" },
];

function taxLabelForCountry(code: string): { label: string; placeholder: string } {
  switch (code) {
    case "MX":
      return { label: "RFC de la clínica (opcional)", placeholder: "XAXX010101000" };
    case "CO":
      return { label: "NIT / Cédula tributaria (opcional)", placeholder: "900123456-1" };
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
    if (lang === "ca") return "ca-ES";
    if (lang === "en") return "en-GB";
    if (lang === "mx") return "es-MX";
    return "es-ES";
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

  function translateError(msg: string): string {
    if (msg.includes("Stripe must be configured") || msg.includes("STRIPE_DISABLED")) {
      return "Stripe debe estar configurado para activar la prueba gratuita de 30 días.";
    }
    if (msg.includes("clinic_name is required")) {
      return "El nombre de la clínica es obligatorio.";
    }
    if (msg.includes("full_name is required")) {
      return "El nombre del responsable es obligatorio.";
    }
    if (msg.includes("invalid email")) {
      return "El correo electrónico no es válido.";
    }
    if (msg.includes("password must be at least 10 characters")) {
      return "La contraseña debe tener al menos 10 caracteres.";
    }
    if (msg.includes("already registered") || msg.includes("conflict") || msg.includes("already exists")) {
      return "Ya existe una clínica o usuario con este correo o subdominio.";
    }
    if (msg.includes("plan has no Stripe price configured") || msg.includes("PLAN_NOT_CONFIGURED")) {
      return "El plan seleccionado no tiene un precio configurado en Stripe.";
    }
    if (msg.includes("unknown or inactive plan") || msg.includes("UNKNOWN_PLAN")) {
      return "El plan seleccionado no es válido o no está activo.";
    }
    if (msg.includes("could not complete onboarding with Stripe") || msg.includes("ONBOARDING_FAILED")) {
      return "No se pudo iniciar el proceso de pago con Stripe. Por favor, inténtalo de nuevo.";
    }
    return msg;
  }

  async function resumeStripeCheckout() {
    setError(null);
    setLoading(true);
    try {
      const { url } = await sdk.billing.checkout(me?.billing?.plan_key || "base");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? translateError(err.message) : "No se pudo iniciar Stripe Checkout");
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
      setError(err instanceof Error ? translateError(err.message) : "No se pudo completar el registro");
      setLoading(false);
    }
  }

  if (pendingStripeActivation && me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Dentistes</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Activa tus 30 días de prueba</h1>
            <p className="mt-1 text-sm text-slate-500">
              Clínica creada: <strong>{me.active_tenant.name}</strong> ({me.active_tenant.subdomain}.{BASE_DOMAIN})
            </p>
          </div>
          <Card>
            <div className="space-y-4">
              {canceled ? (
                <Alert tone="warning">
                  Has cancelado el paso de Stripe. Añade la tarjeta sin cargo hoy para activar los 30 días de prueba.
                </Alert>
              ) : null}
              {error ? <Alert tone="danger">{error}</Alert> : null}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Plan Base Esencial</span>
                  <Badge tone="info">30 días gratis</Badge>
                </div>
                <p className="mt-1 text-slate-600">
                  {currency === "EUR" ? "0 € hoy · Después 49 €/mes" : currency === "MXN" ? "$0 MXN hoy · Después $999 MXN/mes" : "$0 hoy · Después $49 USD/mes"}. Cancelación en un clic.
                </p>
              </div>
              <Button onClick={() => void resumeStripeCheckout()} loading={loading} className="w-full">
                <CreditCard className="h-4 w-4" />
                Activar 30 días con Stripe
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
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Abre tu clínica en 1 minuto</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paso {step} de 2 · 30 días de prueba gratis activando Stripe ($0 hoy)
          </p>
        </div>

        <Card>
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className={step === 1 ? "text-brand-700 font-semibold" : "text-confirmed inline-flex items-center gap-1"}>
              {step === 2 ? <CheckCircle2 className="h-3.5 w-3.5" /> : "1."} Datos básicos
            </span>
            <span>→</span>
            <span className={step === 2 ? "text-brand-700 font-semibold" : ""}>2. Responsable y Stripe</span>
          </div>

          {demo ? (
            <div className="mb-4">
              <Alert tone="info">
                Has solicitado una demo. Si quieres empezar ya, crea tu clínica ahora y activa los 30 días con Stripe.
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
                label="¿Cómo se llama tu clínica?"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Clínica Dental San Jerónimo"
                required
              />
              <Input
                label="Dirección web de la clínica"
                value={subdomainTouched ? customSubdomain : subdomain}
                onChange={(e) => {
                  setSubdomainTouched(true);
                  setCustomSubdomain(e.target.value.toLowerCase());
                }}
                hint={`Accederéis en https://${subdomain || "tu-clinica"}.${BASE_DOMAIN}`}
                required
              />

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">¿Cuántos gabinetes / boxes tenéis?</span>
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
                  label="Divisa de suscripción"
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
                label="Nombre del responsable"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Roberto Gómez"
                required
              />
              <Input
                label="Email de trabajo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="roberto@clinica.com"
                required
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="Mínimo 10 caracteres"
                minLength={10}
                required
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    Activación con Stripe · 30 días gratis ({currency})
                  </span>
                  <span className="tabular-nums">
                    {currency === "EUR" ? "0 € hoy" : currency === "MXN" ? "$0 MXN hoy" : "$0 hoy"}
                  </span>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  En el siguiente paso introducirás la tarjeta en Stripe Checkout para activar los 30 días de prueba del Plan Base
                  Esencial. No se cobra nada hasta el día 31 ({currency === "EUR" ? "49 €/mes" : currency === "MXN" ? "$999 MXN/mes" : "$49 USD/mes"}). Cancelación en un clic.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  Atrás
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  <CreditCard className="h-4 w-4" />
                  Crear clínica y activar Stripe
                </Button>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link className="font-medium text-brand-700 hover:underline" to="/login">
              Iniciar sesión
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
