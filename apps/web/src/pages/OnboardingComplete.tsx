import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Alert, Button, Card, Spinner } from "@dentistes/ui";
import { useSession } from "../lib/session";

export function OnboardingCompletePage() {
  const { sdk, reload } = useSession();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function confirm() {
      if (!sessionId) {
        setStatus("error");
        setError("Falta el session_id de Stripe.");
        return;
      }
      try {
        await sdk.billing.confirmCheckout(sessionId);
        await reload();
        if (active) setStatus("ok");
      } catch (err) {
        if (active) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "No s'ha pogut confirmar la subscripció a Stripe.");
        }
      }
    }
    void confirm();
    return () => {
      active = false;
    };
  }, [sdk, reload, sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Card title="Activació de la clínica">
          {status === "loading" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-sm text-slate-600">
              <Spinner className="h-6 w-6 text-brand-600" />
              <p>Validant el mètode de pagament amb Stripe i activant els 30 dies…</p>
            </div>
          ) : status === "ok" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-confirmed">
                <CheckCircle2 className="h-7 w-7 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Prova de 30 dies activada</p>
                  <p className="text-xs text-slate-600">Ja tens accés complet al Pla Base Essencial.</p>
                </div>
              </div>
              <Link to="/" className="block">
                <Button className="w-full">Anar al panell de la clínica</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert tone="danger">{error ?? "Error activant la prova"}</Alert>
              <Link to="/billing" className="block">
                <Button variant="outline" className="w-full">
                  Revisar facturació
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
