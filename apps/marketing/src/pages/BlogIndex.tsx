import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { POSTS } from "../content/posts";
import { signupUrl } from "../content/site";
import { BlogCard } from "../components/BlogCard";
import { Icon } from "../components/Icon";
import { Reveal } from "../components/Reveal";
import { blogPath, homePath } from "../lib/seo";

const HOME_LABEL: Record<Lang, string> = { es: "Inicio", en: "Home", ca: "Inici" };

export function BlogIndex({ lang, copy }: { lang: Lang; copy: Copy }) {
  const [featured, ...rest] = POSTS;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 grid-paper opacity-60" />
        <div className="shell relative py-12 sm:py-16">
          <nav className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-pine-500">
            <a href={homePath(lang)} className="hover:text-ink">
              {HOME_LABEL[lang]}
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-pine-700">{copy.nav.blog}</span>
          </nav>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
            {copy.blog.indexTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-pine-600 sm:text-base">
            {copy.blog.indexIntro}
          </p>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="shell py-12 sm:py-16">
          <Reveal>
            <p className="mono-label">{copy.blog.featured}</p>
            {featured ? <div className="mt-4"><BlogCard post={featured} lang={lang} copy={copy.blog} featured /></div> : null}
          </Reveal>

          <div className="mt-12 flex items-center justify-between border-b border-line pb-3">
            <p className="mono-label">{copy.blog.all}</p>
            <a href={`${blogPath(lang)}feed.xml`} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-pine-500 hover:text-ink">
              RSS
              <Icon name="arrow" className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, index) => (
              <Reveal key={post.id} delay={index * 60}>
                <BlogCard post={post} lang={lang} copy={copy.blog} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-pine-900 text-paper">
        <div className="shell flex flex-col gap-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <p className="text-xl font-semibold tracking-[-0.025em]">{copy.blog.ctaTitle}</p>
            <p className="mt-1 text-sm text-mint-100/75">{copy.blog.ctaText}</p>
          </div>
          <a href={signupUrl({ plan: "base", lang })} className="btn-signal shrink-0">
            {copy.blog.ctaLabel}
            <Icon name="arrow" className="h-4 w-4" />
          </a>
        </div>
      </section>
    </>
  );
}
