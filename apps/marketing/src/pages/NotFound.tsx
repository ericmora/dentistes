import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { Icon } from "../components/Icon";
import { blogPath, homePath } from "../lib/seo";

export function NotFound({ lang, copy }: { lang: Lang; copy: Copy }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-paper opacity-60" />
      <div className="shell relative flex min-h-[62vh] flex-col justify-center py-16 sm:py-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">404</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
          {copy.notFound.title}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-pine-600">{copy.notFound.text}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={homePath(lang)} className="btn-signal">
            {copy.notFound.cta}
            <Icon name="arrow" className="h-4 w-4" />
          </a>
          <a href={blogPath(lang)} className="btn-secondary">
            {copy.nav.blog}
          </a>
        </div>
      </div>
    </section>
  );
}
