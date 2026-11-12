import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { Icon } from "../components/Icon";
import { homePath, type LegalDoc } from "../lib/seo";

const HOME_LABEL: Record<Lang, string> = { es: "Inicio", en: "Home", ca: "Inici" };

export function Legal({
  doc,
  lang,
  copy,
}: {
  doc: LegalDoc;
  lang: Lang;
  copy: Copy;
}) {
  const page = copy.legal[doc];

  return (
    <section>
      <header className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 grid-paper opacity-50" />
        <div className="shell relative py-10 sm:py-14">
          <nav className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-pine-500">
            <a href={homePath(lang)} className="hover:text-ink">
              {HOME_LABEL[lang]}
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-pine-700">{page.title}</span>
          </nav>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            {page.title}
          </h1>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-pine-500">
            {page.updated}
          </p>
        </div>
      </header>

      <div className="shell py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm leading-relaxed text-pine-600">{page.intro}</p>
            <a
              href={`${homePath(lang)}#contact`}
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-signal"
            >
              {copy.footer.trial}
              <Icon name="arrow" className="h-3.5 w-3.5" />
            </a>
          </aside>
          <div className="max-w-2xl">
            {page.sections.map((section) => (
              <section key={section.title} className="border-t border-line py-6 first:border-t-0 first:pt-0">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-pine-600">{section.text}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
