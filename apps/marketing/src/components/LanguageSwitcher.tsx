import { LANGS, type Lang } from "../content/languages";
import { pageForLang, pagePath, type Page } from "../lib/seo";

export function LanguageSwitcher({
  page,
  label,
  compact = false,
}: {
  page: Page;
  label: string;
  compact?: boolean;
}) {
  return (
    <nav aria-label={label} className="flex items-center gap-0.5">
      {LANGS.map((lang) => {
        const active = page.lang === lang.id;
        const href = pagePath(pageForLang(page, lang.id as Lang));
        return (
          <a
            key={lang.id}
            href={href}
            hrefLang={lang.htmlLang}
            aria-current={active ? "true" : undefined}
            className={[
              "inline-flex h-8 min-w-8 items-center justify-center rounded-panel px-1.5 font-mono text-[10px] tracking-[0.12em] transition",
              active
                ? "bg-pine-700 text-paper"
                : "text-pine-600 hover:bg-white/70 hover:text-ink",
              compact ? "text-[9px]" : "",
            ].join(" ")}
          >
            {lang.short}
          </a>
        );
      })}
    </nav>
  );
}
