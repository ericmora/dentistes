import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { relatedPosts, type Post, type PostBlock } from "../content/posts";
import { signupUrl } from "../content/site";
import { ArticleBody, slugify } from "../components/ArticleBody";
import { BlogCard } from "../components/BlogCard";
import { Faq } from "../components/Faq";
import { Icon } from "../components/Icon";
import { Reveal } from "../components/Reveal";
import { formatDate } from "../lib/format";
import { blogPath, homePath } from "../lib/seo";

const TEXT: Record<
  Lang,
  { home: string; toc: string; faq: string; by: string; updated: string; share: string }
> = {
  es: { home: "Inicio", toc: "En este artículo", faq: "Preguntas frecuentes", by: "Por", updated: "Actualizado", share: "Volver al blog" },
  en: { home: "Home", toc: "In this article", faq: "Frequently asked questions", by: "By", updated: "Updated", share: "Back to blog" },
  ca: { home: "Inici", toc: "En aquest article", faq: "Preguntes freqüents", by: "Per", updated: "Actualitzat", share: "Tornar al blog" },
};

export function BlogPost({
  post,
  lang,
  copy,
}: {
  post: Post;
  lang: Lang;
  copy: Copy;
}) {
  const blocks = post.blocks[lang];
  const toc = blocks
    .filter((block): block is Extract<PostBlock, { type: "h2" }> => block.type === "h2")
    .map((block) => ({ id: block.id ?? slugify(block.text), text: block.text }));
  const related = relatedPosts(post);
  const t = TEXT[lang];

  return (
    <>
      <article>
        <header className="relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute inset-0 grid-paper opacity-50" />
          <div className="shell relative py-10 sm:py-14">
            <nav className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-pine-500">
              <a href={homePath(lang)} className="hover:text-ink">{t.home}</a>
              <span aria-hidden="true">/</span>
              <a href={blogPath(lang)} className="hover:text-ink">{copy.nav.blog}</a>
              <span aria-hidden="true">/</span>
              <span className="text-pine-700">{post.category[lang]}</span>
            </nav>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.12em] text-pine-500">
                  <span>{post.category[lang]}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.date}>{formatDate(lang, post.date)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readingTime[lang]}</span>
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl">
                  {post.title[lang]}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-pine-600">{post.excerpt[lang]}</p>
                <p className="mt-5 text-[11px] text-pine-500">
                  {t.by} {post.author[lang]}
                </p>
              </div>
              <div className="hidden border-l border-line pl-6 lg:block">
                <p className="mono-label">{t.toc}</p>
                <ol className="mt-3 space-y-1.5">
                  {toc.map((item, index) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="flex gap-2 text-[11px] leading-relaxed text-pine-600 hover:text-ink">
                        <span className="font-mono text-[9px] text-pine-500">{String(index + 1).padStart(2, "0")}</span>
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </header>

        <div className="shell py-10 sm:py-14">
          <div className="mx-auto max-w-3xl">
            <img
              src={post.cover}
              alt={post.coverAlt[lang]}
              width={1200}
              height={630}
              loading="eager"
              decoding="async"
              className="mb-10 w-full border border-line bg-chalk object-cover"
            />
            <ArticleBody blocks={blocks} lang={lang} />
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-pine-500">
                {t.updated}: {formatDate(lang, post.updated)}
              </p>
              <a href={blogPath(lang)} className="inline-flex items-center gap-2 text-xs font-semibold text-signal">
                <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
                {t.share}
              </a>
            </div>
          </div>
        </div>
      </article>

      {post.faq[lang].length ? (
        <section className="border-y border-line bg-white/30">
          <div className="shell py-12 sm:py-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
              <div>
                <p className="mono-label">{copy.blog.category}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink">{t.faq}</h2>
              </div>
              <Faq copy={{ ...copy.faq, items: post.faq[lang] }} compact />
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="border-b border-line">
          <div className="shell py-12 sm:py-16">
            <p className="mono-label">{copy.blog.related}</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <BlogCard key={item.id} post={item} lang={lang} copy={copy.blog} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
