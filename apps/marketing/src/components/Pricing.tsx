import { useState } from "react";
import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { formatPrice, getPreferredRegion, signupUrl, type RegionData } from "../content/site";
import { Icon } from "./Icon";
import { RegionSwitcher } from "./RegionSwitcher";

function decimalsFor(value: number): number {
  return Number.isInteger(value) ? 0 : 2;
}

export function Pricing({ copy, lang }: { copy: Copy; lang: Lang }) {
  const [annual, setAnnual] = useState(false);
  const [region, setRegion] = useState<RegionData>(() => getPreferredRegion(lang));
  const billing = annual ? "annual" : "monthly";
  const price = annual ? region.yearly : region.monthly;
  const period = annual ? copy.pricing.perYear : copy.pricing.perMonth;
  const monthlyEquivalent = annual ? region.yearly / 12 : null;

  const addons = [
    {
      id: "whatsapp",
      name: copy.pricing.addons.whatsapp.name,
      description: copy.pricing.addons.whatsapp.description,
      monthly: region.addons.whatsapp,
    },
    {
      id: "signature",
      name: copy.pricing.addons.signature.name,
      description: copy.pricing.addons.signature.description,
      monthly: region.addons.signature,
    },
    {
      id: "pack",
      name: copy.pricing.addons.pack.name,
      description: copy.pricing.addons.pack.description,
      monthly: region.addons.pack,
      featured: true,
    },
  ];

  function addonPrice(amount: number) {
    const value = annual ? amount * 10 : amount;
    return `${formatPrice(lang, region.currency, value, decimalsFor(value))}${annual ? copy.pricing.perYear : copy.pricing.perMonth}`;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-pine-600">
            {copy.pricing.globalLabel}
          </p>
          <RegionSwitcher lang={lang} onRegionChange={setRegion} />
        </div>

        <div className="flex items-center gap-1 border border-line p-0.5">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={[
              "px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition",
              !annual ? "bg-ink text-paper" : "text-pine-600",
            ].join(" ")}
          >
            {copy.pricing.monthly}
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={[
              "px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition",
              annual ? "bg-ink text-paper" : "text-pine-600",
            ].join(" ")}
          >
            {copy.pricing.annual}
          </button>
          <span className="hidden px-2 font-mono text-[8px] uppercase tracking-[0.08em] text-mint-500 sm:block">
            {copy.pricing.annualNote}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-pine-700 bg-pine-900 p-6 text-paper sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mint-200/70">
                {copy.pricing.baseName}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-mint-100/80">
                {copy.pricing.baseDescription}
              </p>
            </div>
            <Icon name="tooth" className="h-8 w-8 shrink-0 text-mint-300/70" />
          </div>

          <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="font-mono text-5xl font-semibold tracking-[-0.04em] text-paper sm:text-6xl">
              {formatPrice(lang, region.currency, price, decimalsFor(price))}
            </span>
            <span className="pb-1 text-sm text-mint-100/70">
              {region.currency} {period}
            </span>
          </div>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-mint-200/60">
            {annual
              ? `${copy.pricing.billed} · ${formatPrice(lang, region.currency, region.yearly, decimalsFor(region.yearly))}${copy.pricing.perYear}`
              : copy.common.vat}
          </p>
          {monthlyEquivalent !== null ? (
            <p className="mt-1 text-[11px] text-mint-200/70">
              ≈ {formatPrice(lang, region.currency, monthlyEquivalent, 2)}
              {copy.pricing.perMonth} · {copy.pricing.annualNote}
            </p>
          ) : null}

          <ul className="mt-7 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
            {copy.pricing.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[11px] leading-relaxed text-mint-100/80">
                <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-300" />
                {feature}
              </li>
            ))}
          </ul>

          <a
            href={signupUrl({ plan: "base", billing, lang, country: region.countryCode, currency: region.currency })}
            className="btn-signal mt-8 w-full sm:w-auto"
          >
            {copy.pricing.cta}
            <Icon name="arrow" className="h-4 w-4" />
          </a>
          <p className="mt-3 text-[10px] text-mint-200/60">{copy.pricing.footnote}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mono-label">{copy.pricing.addonsTitle}</p>
            <p className="mt-2 text-xs leading-relaxed text-pine-600">{copy.pricing.addonsNote}</p>
          </div>
          {addons.map((addon) => (
            <div
              key={addon.id}
              className={[
                "flex flex-1 flex-col justify-between border p-4",
                addon.featured ? "border-mint-400 bg-mint-50" : "border-line bg-white/45",
              ].join(" ")}
            >
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{addon.name}</p>
                  <p className="shrink-0 font-mono text-[11px] tabular text-pine-700">
                    {addonPrice(addon.monthly)}
                  </p>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-pine-600">{addon.description}</p>
              </div>
              {addon.featured ? (
                <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.1em] text-pine-600">
                  {copy.pricing.packNote}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
