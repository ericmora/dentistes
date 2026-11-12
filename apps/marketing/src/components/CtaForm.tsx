import { useRef, useState } from "react";
import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { APP, SITE } from "../content/site";
import { legalPath } from "../lib/seo";
import { Icon } from "./Icon";

export function CtaForm({ copy, lang }: { copy: Copy; lang: Lang }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const [demoStatus, setDemoStatus] = useState<"idle" | "success" | "error">("idle");
  const [demoError, setDemoError] = useState<string | null>(null);

  async function requestDemo() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;

    const data = new FormData(form);
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

    setSubmittingDemo(true);
    setDemoStatus("idle");
    setDemoError(null);

    try {
      const res = await fetch(`${SITE.apiUrl}/v1/public/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: String(data.get("contact_name") ?? ""),
          clinic_name: String(data.get("tenant_name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          interest: "DEMO",
          lang,
          source: "landing",
          utm_source: params?.get("utm_source") ?? "",
          utm_medium: params?.get("utm_medium") ?? "",
          utm_campaign: params?.get("utm_campaign") ?? "",
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? copy.contact.demoError);
      }
      setDemoStatus("success");
      form.reset();
    } catch (err) {
      setDemoStatus("error");
      setDemoError(err instanceof Error ? err.message : copy.contact.demoError);
    } finally {
      setSubmittingDemo(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
      <div>
        <p className="mono-label">{copy.contact.index}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">
          {copy.contact.title}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-pine-600">{copy.contact.intro}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[copy.common.noCard, copy.common.setup, copy.common.migration].map((item) => (
            <span key={item} className="tag">
              <Icon name="check" className="h-3 w-3 text-mint-500" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <form ref={formRef} action={APP.signup} method="get" className="border border-line-strong bg-paper p-5 sm:p-7">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="plan" value="base" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="mb-1.5 block text-[11px] font-medium text-pine-700">{copy.contact.name}</span>
            <input
              className="field"
              type="text"
              name="contact_name"
              autoComplete="name"
              required
              minLength={2}
              placeholder="Laia"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1.5 block text-[11px] font-medium text-pine-700">{copy.contact.clinic}</span>
            <input
              className="field"
              type="text"
              name="tenant_name"
              autoComplete="organization"
              required
              minLength={2}
              placeholder="Clínica Dental"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-medium text-pine-700">{copy.contact.email}</span>
            <input
              className="field"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="hola@clinica.cat"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-medium text-pine-700">{copy.contact.phone}</span>
            <input
              className="field"
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="+34 600 000 000"
            />
          </label>
        </div>

        {demoStatus === "success" ? (
          <p className="mt-4 border border-mint-400 bg-mint-50 px-3 py-2 text-xs text-pine-800" role="status">
            {copy.contact.demoSuccess}
          </p>
        ) : null}
        {demoStatus === "error" ? (
          <p className="mt-4 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
            {demoError ?? copy.contact.demoError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="submit" name="demo" value="0" className="btn-signal flex-1">
            {copy.contact.submitTrial}
            <Icon name="arrow" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void requestDemo()}
            disabled={submittingDemo}
            className="btn-secondary flex-1 disabled:opacity-60"
          >
            {submittingDemo ? copy.contact.submitting : copy.contact.submitDemo}
          </button>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-pine-500">
          {copy.contact.privacy}{" "}
          <a href={legalPath(lang, "privacy")} className="underline decoration-line-strong underline-offset-2 hover:text-ink">
            {copy.footer.privacy}
          </a>
          .
        </p>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-pine-500">
          {copy.contact.note}
        </p>
      </form>
    </div>
  );
}
