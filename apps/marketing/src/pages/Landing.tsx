import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { signupUrl } from "../content/site";
import { AgendaMockup } from "../components/AgendaMockup";
import { CtaForm } from "../components/CtaForm";
import { Faq } from "../components/Faq";
import { Icon } from "../components/Icon";
import { Pricing } from "../components/Pricing";
import { ProductStack } from "../components/ProductStack";
import { Receipt } from "../components/Receipt";
import { Reveal } from "../components/Reveal";
import { SecurityDiagram } from "../components/SecurityDiagram";
import { VideoShowcase } from "../components/VideoShowcase";
import { WhatsAppMockup } from "../components/WhatsAppMockup";

function SectionHead({
  index,
  title,
  intro,
  className = "",
}: {
  index: string;
  title: string;
  intro: string;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <p className="mono-label">{index}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl lg:text-[2.7rem] lg:leading-[1.06]">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-pine-600 sm:text-base">{intro}</p>
    </div>
  );
}

export function Landing({ lang, copy }: { lang: Lang; copy: Copy }) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 grid-paper opacity-70" />
        <div className="pointer-events-none absolute -right-40 top-10 h-[32rem] w-[32rem] rounded-full bg-mint-200/50 blur-3xl" />
        <div className="shell relative grid grid-cols-1 gap-12 pb-14 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="animate-rise-in">
            <p className="tag">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-5 text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[4.1rem]">
              <span className="block">{copy.hero.h1a}</span>
              <span className="block text-pine-600">{copy.hero.h1b}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-pine-600 sm:text-lg">
              {copy.hero.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={signupUrl({ plan: "base", lang })} className="btn-signal">
                {copy.hero.ctaPrimary}
                <Icon name="arrow" className="h-4 w-4" />
              </a>
              <a href="#product" className="btn-secondary">
                {copy.hero.ctaSecondary}
                <Icon name="chevron" className="h-4 w-4" />
              </a>
            </div>
            <ul className="mt-8 grid max-w-xl grid-cols-2 gap-x-5 gap-y-2.5">
              {copy.hero.trust.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[11px] text-pine-600">
                  <Icon name="check" className="h-3.5 w-3.5 text-mint-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-rise-in [animation-delay:140ms]">
            <AgendaMockup copy={copy.hero.panel} />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-paper">
        <div className="shell grid grid-cols-2 divide-x divide-line lg:grid-cols-4">
          {copy.proof.items.map((item) => (
            <div key={item.label} className="px-4 py-6 first:pl-0 last:pr-0 sm:px-6">
              <p className="font-mono text-2xl font-semibold tracking-[-0.05em] text-ink sm:text-3xl">
                {item.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-pine-500">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="shell border-t border-line py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-pine-500">{copy.proof.note}</p>
        </div>
      </section>

      <section id="problem" className="border-b border-line">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <SectionHead index={copy.problem.index} title={copy.problem.title} intro={copy.problem.intro} />
              <div className="border-t border-line">
                {copy.problem.points.map((point, index) => (
                  <div key={point.title} className="grid grid-cols-1 gap-3 border-b border-line py-5 sm:grid-cols-[2rem_1fr] sm:gap-5">
                    <span className="font-mono text-[10px] text-signal">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-pine-600">{point.text}</p>
                    </div>
                  </div>
                ))}
                <p className="mt-5 max-w-lg text-xs leading-relaxed text-pine-500">{copy.problem.footnote}</p>
              </div>
            </div>
            <VideoShowcase lang={lang} variant="editorial" />
          </Reveal>
        </div>
      </section>

      <section id="product" className="border-b border-line bg-white/30">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <SectionHead index={copy.product.index} title={copy.product.title} intro={copy.product.intro} />
          </Reveal>
          <Reveal className="mt-10">
            <ProductStack copy={copy} lang={lang} />
          </Reveal>
        </div>
      </section>

      <section id="how" className="border-b border-line">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              <SectionHead index={copy.receipt.index} title={copy.receipt.title} intro={copy.receipt.intro} />
              <Receipt copy={copy.receipt} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-line bg-pine-900 text-paper">
        <div className="pointer-events-none absolute inset-0 grid-paper-dark opacity-80" />
        <div className="shell relative grid grid-cols-1 gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-16">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mint-200/60">
              {copy.whatsapp.index}
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-paper sm:text-4xl lg:text-[2.7rem] lg:leading-[1.06]">
              {copy.whatsapp.title}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-mint-100/75 sm:text-base">
              {copy.whatsapp.intro}
            </p>
            <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {copy.whatsapp.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-mint-100/85">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-300" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#pricing" className="btn-signal">
                {copy.whatsapp.cta}
                <Icon name="arrow" className="h-4 w-4" />
              </a>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-mint-200/60">
                {copy.whatsapp.addon}
              </p>
            </div>
          </Reveal>
          <Reveal className="[animation-delay:120ms]">
            <WhatsAppMockup copy={copy.whatsapp.phone} />
          </Reveal>
        </div>
      </section>

      <section id="security" className="border-b border-line">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <SectionHead index={copy.security.index} title={copy.security.title} intro={copy.security.intro} />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <Reveal>
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {copy.security.points.map((point) => (
                  <div key={point.title} className="border-t border-line py-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Icon name="check" className="h-3.5 w-3.5 text-mint-500" />
                      {point.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-pine-600">{point.text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 max-w-lg text-[11px] leading-relaxed text-pine-500">{copy.security.note}</p>
            </Reveal>
            <Reveal className="[animation-delay:100ms]">
              <SecurityDiagram copy={copy.security.diagram} />
            </Reveal>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-line bg-white/30">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <SectionHead index={copy.pricing.index} title={copy.pricing.title} intro={copy.pricing.intro} />
          </Reveal>
          <Reveal className="mt-8">
            <Pricing copy={copy} lang={lang} />
          </Reveal>
        </div>
      </section>

      <section id="comparison" className="border-b border-line">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <SectionHead index={copy.comparison.index} title={copy.comparison.title} intro={copy.comparison.intro} />
          </Reveal>
          <Reveal className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-line-strong">
                  <th className="py-3 pr-4 font-mono text-[9px] uppercase tracking-[0.12em] text-pine-500">
                    &nbsp;
                  </th>
                  <th className="py-3 pr-4 text-xs font-semibold text-ink">{copy.comparison.columns[0]}</th>
                  <th className="py-3 pr-4 text-xs font-medium text-pine-500">{copy.comparison.columns[1]}</th>
                </tr>
              </thead>
              <tbody>
                {copy.comparison.rows.map((row) => (
                  <tr key={row.label} className="border-b border-line">
                    <th className="py-3.5 pr-4 text-xs font-medium text-pine-700">{row.label}</th>
                    <td className="py-3.5 pr-4 text-xs font-semibold text-ink">
                      <span className="inline-flex items-center gap-2">
                        <Icon name="check" className="h-3.5 w-3.5 text-mint-500" />
                        {row.dentistes}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-pine-500">{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 max-w-2xl text-[11px] leading-relaxed text-pine-500">{copy.comparison.note}</p>
          </Reveal>
        </div>
      </section>

      <section id="audience" className="border-b border-line bg-mint-50/60">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <SectionHead index={copy.audience.index} title={copy.audience.title} intro={copy.audience.intro} />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.audience.items.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <div className="flex h-full flex-col border border-line bg-paper p-5">
                  <span className="font-mono text-[9px] text-signal">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-pine-600">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-line">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <Faq copy={copy.faq} />
          </Reveal>
        </div>
      </section>

      <section id="contact" className="bg-mint-50/70">
        <div className="shell py-16 sm:py-24">
          <Reveal>
            <CtaForm copy={copy} lang={lang} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
