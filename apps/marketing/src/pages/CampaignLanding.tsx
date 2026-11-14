import type { Copy } from "../content/copy";
import type { CampaignLandingData } from "../content/landings";
import type { Lang } from "../content/languages";
import { signupUrl } from "../content/site";
import { CtaForm } from "../components/CtaForm";
import { Icon } from "../components/Icon";
import { Reveal } from "../components/Reveal";
import { VideoShowcase } from "../components/VideoShowcase";

export function CampaignLanding({
  landing,
  lang,
  copy,
}: {
  landing: CampaignLandingData;
  lang: Lang;
  copy: Copy;
}) {
  const benefits = landing.benefits[lang];
  const compHead = landing.comparisonHead[lang];
  const compRows = landing.comparisonRows[lang];
  const faqs = landing.faq[lang];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 grid-paper opacity-70" />
        <div className="pointer-events-none absolute -right-32 top-8 h-[28rem] w-[28rem] rounded-full bg-mint-200/50 blur-3xl" />
        <div className="shell relative grid grid-cols-1 gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-20">
          <div>
            <p className="tag">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              {landing.badge[lang]}
            </p>
            <h1 className="mt-5 text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl lg:text-[3.5rem]">
              <span className="block">{landing.h1[lang]}</span>
              <span className="block text-mint-700">{landing.h1Highlight[lang]}</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-pine-600 sm:text-lg">
              {landing.subtitle[lang]}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={signupUrl({ plan: "base", lang })} className="btn-signal">
                {landing.ctaText[lang]}
                <Icon name="arrow" className="h-4 w-4" />
              </a>
              <span className="text-xs text-pine-500">
                {copy.common.noCard} · {copy.common.trialBadge}
              </span>
            </div>
          </div>
          <div>
            <VideoShowcase lang={lang} variant="hero" />
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="border-b border-line bg-mint-50/40 py-14 sm:py-20">
        <div className="shell">
          <div className="max-w-3xl">
            <p className="mono-label">Punt de Dolor Real</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {landing.painPointTitle[lang]}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-pine-700 sm:text-lg">
              {landing.painPointBody[lang]}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="border-b border-line py-16 sm:py-24">
        <div className="shell">
          <div className="max-w-2xl">
            <p className="mono-label">Avantatges Clau</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Dissenyat per a la realitat del teu consultori
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
            {benefits.map((benefit, idx) => (
              <Reveal key={benefit.title} delay={idx * 60}>
                <div className="h-full rounded-2xl border border-line bg-paper p-6 sm:p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-mint-800">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pine-600">
                    {benefit.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-b border-line bg-pine-900 py-16 text-paper sm:py-24">
        <div className="shell">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-wider text-mint-300">
              Comparativa Directa
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Per què les clíniques canvien a Dentistes
            </h2>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-pine-700 font-mono text-xs uppercase tracking-wider text-mint-200">
                  <th className="py-3 pr-4">{compHead[0]}</th>
                  <th className="px-4 py-3 text-pine-400">{compHead[1]}</th>
                  <th className="px-4 py-3 text-mint-300 font-semibold">{compHead[2]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-800">
                {compRows.map(([crit, trad, dent], i) => (
                  <tr key={i}>
                    <td className="py-4 pr-4 font-medium text-paper">{crit}</td>
                    <td className="px-4 py-4 text-pine-400">{trad}</td>
                    <td className="px-4 py-4 font-semibold text-mint-200">{dent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 rounded-2xl border border-mint-500/30 bg-mint-950/40 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-mint-300">Tarifa Plana Universal</p>
                <p className="mt-1 text-2xl font-semibold sm:text-3xl text-paper">
                  18,50 $ USD / mes
                </p>
                <p className="text-xs text-mint-100/70">
                  Sense límit de doctors, higienistes ni pacients · 0 $ de quota d'alta
                </p>
              </div>
              <a href={signupUrl({ plan: "base", lang })} className="btn-signal shrink-0">
                {landing.ctaText[lang]}
                <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-line py-16 sm:py-24">
        <div className="shell max-w-3xl">
          <p className="mono-label">Preguntes Freqüents</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Respostes clares i transparents
          </h2>

          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map((item, idx) => (
              <div key={idx} className="py-6">
                <h3 className="text-base font-semibold text-ink sm:text-lg">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-pine-600 sm:text-base">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Lead Form CTA */}
      <section className="py-16 sm:py-24">
        <div className="shell">
          <CtaForm copy={copy} lang={lang} />
        </div>
      </section>
    </>
  );
}
