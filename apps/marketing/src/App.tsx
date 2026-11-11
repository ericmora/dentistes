import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, formatMoney } from "@dentistes/ui";
import { DentistesClient, type Feature, type Plan } from "@dentistes/sdk";

const sdk = new DentistesClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  mode: "browser",
});

const appUrl = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

const modules = [
  { title: "Odontograma interactivo", text: "32 piezas FDI, cinco caras por diente y estados por color. Del diagnóstico al presupuesto." },
  { title: "Agenda multigabinet", text: "Vista matricial en tiempo real, drag and drop y confirmaciones por WhatsApp." },
  { title: "Historial clínico", text: "Evoluciones inmutables, alertas médicas JSONB y permisos estrictos por rol." },
  { title: "WhatsApp", text: "Recordatorios, confirmaciones y reprogramación con agente autónomo." },
  { title: "Lista de espera", text: "Cobertura automática de huecos con scoring de urgencia y compatibilidad." },
  { title: "Facturación con QR", text: "Presupuestos y facturas PDF verificables, pagos parciales y cobro por sesión." },
];

export function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [catalog, setCatalog] = useState<Feature[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sdk
      .plans()
      .then((res) => {
        setPlans(res.plans);
        setCatalog(res.feature_catalog);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los precios"));
  }, []);

  const featureName = (key: string) => catalog.find((f) => f.key === key)?.name ?? key;

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#" className="text-sm font-semibold tracking-tight text-brand-700">
            Dentistes
          </a>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#producto" className="hover:text-slate-900">Producto</a>
            <a href="#modulos" className="hover:text-slate-900">Módulos</a>
            <a href="#precios" className="hover:text-slate-900">Precios</a>
          </nav>
          <div className="flex items-center gap-2">
            <a className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:block" href={`${appUrl}/login`}>
              Acceder
            </a>
            <a className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700" href={`${appUrl}/signup`}>
              Empezar gratis
            </a>
          </div>
        </div>
      </header>

      <section id="producto" className="mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-3xl">
          <Badge tone="info">14 días de prueba · sin tarjeta</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            El software dental que tu clínica sí va a usar.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Agenda, odontograma, historial clínico y facturación en una plataforma rápida, segura y multi-clínica. Menos clics, menos ausencias, más tiempo con el paciente.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700" href={`${appUrl}/signup`}>
              Crear mi clínica
            </a>
            <a className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="#precios">
              Ver precios
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Datos en la UE · RGPD · Multi-tenant con aislamiento por fila</p>
        </div>
      </section>

      <section id="modulos" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-2xl font-semibold text-slate-900">Todo el flujo clínico, sin saltar de herramienta</h2>
          <p className="mt-2 text-slate-600">Módulos que se activan según tu plan. Los permisos se aplican por rol y por tenant.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <Card key={mod.title} title={mod.title}>
                <p className="text-sm text-slate-600">{mod.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-slate-900">Precios claros, sin sorpresas</h2>
          <p className="mt-2 text-slate-600">Elige plan y empieza en minutos. Si no pagas, las funciones de pago se bloquean automáticamente.</p>
        </div>
        {error ? (
          <div className="mt-8">
            <EmptyState title="No se pudieron cargar los precios" description={error} />
          </div>
        ) : plans.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">Cargando planes…</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.key}
                title={plan.name}
                description={plan.description}
                footer={
                  <a className="block rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700" href={`${appUrl}/signup`}>
                    Empezar
                  </a>
                }
              >
                <p className="text-3xl font-semibold text-slate-900">
                  {formatMoney(plan.price_monthly_cents, plan.currency)}
                  <span className="text-sm font-normal text-slate-500">/mes</span>
                </p>
                <ul className="mt-4 space-y-1 text-sm text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {featureName(feature)}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white">Tu clínica, lista en una tarde</h2>
          <p className="mt-2 text-slate-300">Importa tus pacientes y empieza a agendar. Sin instalaciones.</p>
          <a className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-400" href={`${appUrl}/signup`}>
            Empezar 14 días gratis
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row">
          <p>Dentistes · Software de gestión dental multi-clínica</p>
          <div className="flex gap-4">
            <a href={`${appUrl}/login`} className="hover:text-slate-800">Acceder</a>
            <a href="#precios" className="hover:text-slate-800">Precios</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
