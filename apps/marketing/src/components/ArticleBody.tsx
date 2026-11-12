import type { ReactNode } from "react";
import type { Lang } from "../content/languages";
import type { PostBlock } from "../content/posts";
import { blogPath } from "../lib/seo";
import { Icon } from "./Icon";

function localizeHref(lang: Lang, href: string) {
  const prefix = lang === "es" ? "" : `/${lang}`;
  if (href.startsWith("/#")) return `${prefix}${href}`;
  if (href === "/blog/" || href === "/blog") return blogPath(lang);
  return href;
}

function renderInline(text: string, lang: Lang): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\))/g;
  return text.split(pattern).map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return part;
    const [, label, href] = match;
    const external = /^https?:\/\//.test(href ?? "");
    return (
      <a
        key={`${label}-${index}`}
        href={localizeHref(lang, href ?? "#")}
        {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
      >
        {label}
      </a>
    );
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ArticleBody({ blocks, lang }: { blocks: PostBlock[]; lang: Lang }) {
  return (
    <div className="article-prose">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return <p key={index}>{renderInline(block.text, lang)}</p>;
        }
        if (block.type === "h2") {
          return (
            <h2 key={index} id={block.id ?? slugify(block.text)}>
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={index} id={block.id ?? slugify(block.text)}>
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item) => (
                <li key={item}>{renderInline(item, lang)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index}>
              {block.items.map((item) => (
                <li key={item}>{renderInline(item, lang)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index}>
              {renderInline(block.text, lang)}
              {block.cite ? <cite className="mt-2 block font-mono text-[10px] not-italic">{block.cite}</cite> : null}
            </blockquote>
          );
        }
        if (block.type === "callout") {
          return (
            <aside key={index} className="callout">
              {block.title ? <p className="mb-1 font-semibold text-ink">{block.title}</p> : null}
              <p>{renderInline(block.text, lang)}</p>
            </aside>
          );
        }
        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {block.head.map((cell) => (
                      <th key={cell}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row.join("-")}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <div key={index} className="not-prose my-10 border border-pine-700 bg-pine-900 p-5 text-paper sm:p-6">
            <p className="text-lg font-semibold tracking-[-0.02em]">{block.title}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mint-100/80">{block.text}</p>
            <a
              href={localizeHref(lang, block.href)}
              className="mt-5 inline-flex items-center gap-2 border border-mint-200/40 px-4 py-2.5 text-xs font-semibold text-mint-200 transition hover:bg-mint-200 hover:text-pine-900"
            >
              {block.label}
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
        );
      })}
    </div>
  );
}
