import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Input } from "@dentistes/ui";
import { useSession } from "../lib/session";

export function SignupPage() {
  const { signup } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const demo = params.get("demo") === "1";
  const [form, setForm] = useState(() => ({
    tenant_name: params.get("tenant_name") ?? "",
    subdomain: params.get("subdomain") ?? "",
    full_name: params.get("contact_name") ?? "",
    email: params.get("email") ?? "",
    password: "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Dentistes</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Crea tu clínica</h1>
          <p className="mt-1 text-sm text-slate-500">30 días de prueba. Sin tarjeta.</p>
        </div>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            {demo ? (
              <Alert tone="info">
                Has solicitado una demo. Puedes crear la cuenta ahora o esperar a que te contactemos.
              </Alert>
            ) : null}
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nombre de la clínica" value={form.tenant_name} onChange={(e) => update("tenant_name", e.target.value)} required />
              <Input
                label="Subdominio"
                value={form.subdomain}
                onChange={(e) => update("subdomain", e.target.value.toLowerCase())}
                hint="Solo minúsculas, números y guiones"
                required
              />
            </div>
            <Input label="Tu nombre" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            <Input label="Contraseña" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} hint="Mínimo 10 caracteres" required />
            <Button type="submit" loading={loading} className="w-full">
              Crear cuenta
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link className="font-medium text-brand-700 hover:underline" to="/login">
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
