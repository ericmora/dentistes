import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { postPath, type Post } from "../content/posts";
import { formatDate } from "../lib/format";
import { Icon } from "./Icon";

export function BlogCard({
  post,
  lang,
  copy,
  featured = false,
}: {
  post: Post;
  lang: Lang;
  copy: Copy["blog"];
  featured?: boolean;
}) {
  return (
    <article
      className={[
        "group border border-line bg-paper",
        featured ? "grid overflow-hidden lg:grid-cols-[1.08fr_0.92fr]" : "flex flex-col",
      ].join(" ")}
    >
      <a
        href={postPath(lang, post)}
        className={[
          "block overflow-hidden bg-chalk",
          featured ? "order-1 lg:order-2" : "",
        ].join(" ")}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={post.cover}
          alt={post.coverAlt[lang]}
          width={1200}
          height={630}
          loading={featured ? "eager" : "lazy"}
          decoding="async"
          className="h-full min-h-48 w-full object-cover transition duration-500 group-hover:scale-[1.025]"
        />
      </a>
      <div className={featured ? "order-2 flex flex-col justify-center p-5 sm:p-8 lg:order-1" : "flex flex-1 flex-col p-5"}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.12em] text-pine-500">
          <span>{post.category[lang]}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{formatDate(lang, post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime[lang]}</span>
        </div>
        <h2
          className={[
            "mt-3 font-semibold tracking-[-0.025em] text-ink",
            featured ? "text-2xl sm:text-3xl" : "text-lg leading-snug",
          ].join(" ")}
        >
          <a href={postPath(lang, post)} className="transition hover:text-pine-700">
            {post.title[lang]}
          </a>
        </h2>
        <p className={["mt-2 text-sm leading-relaxed text-pine-600", featured ? "max-w-xl" : "line-clamp-3"].join(" ")}>
          {post.excerpt[lang]}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-signal">
          {copy.read}
          <Icon name="arrow" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
