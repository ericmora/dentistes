import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Input } from "@dentistes/ui";
import { sdk, useSession } from "../lib/session";
import { currentTenantSubdomain } from "../lib/tenant";

export function LoginPage() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clinic, setClinic] = useState<string | null>(null);
  const subdomain = currentTenantSubdomain();

  useEffect(() => {
    if (!subdomain) return;
    sdk
      .tenant(subdomain)
      .then((res) => setClinic(res.tenant.name))
      .catch(() => undefined);
  }, [subdomain]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Dentistes</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{clinic ? `Accede a ${clinic}` : "Accede a tu clínica"}</h1>
          <p className="mt-1 text-sm text-slate-500">{subdomain ? `${subdomain}.${import.meta.env.VITE_TENANT_BASE_DOMAIN ?? "dentistes.2mes4.com"}` : "Gestión dental multi-clínica"}</p>
        </div>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Input label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Contraseña" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Nueva clínica?{" "}
            <Link className="font-medium text-brand-700 hover:underline" to="/onboarding">
              Crear cuenta (30 días gratis con Stripe)
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
