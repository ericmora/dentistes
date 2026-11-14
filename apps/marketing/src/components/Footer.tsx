import type { Copy } from "../content/copy";
import { LANDINGS, landingPath } from "../content/landings";
import type { Lang } from "../content/languages";
import { APP, signupUrl } from "../content/site";
import { blogFeedPath, blogPath, homePath, legalPath, type Page } from "../lib/seo";
import { Icon } from "./Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

const SOLUTIONS_TITLE: Record<Lang, string> = {
  ca: "Solucions",
  es: "Soluciones",
  en: "Solutions",
};

export function Footer({
  lang,
  copy,
  page,
}: {
  lang: Lang;
  copy: Copy;
  page: Page;
}) {
  const home = homePath(lang);
  const columns = [
    {
      title: copy.footer.product,
      links: [
        { label: copy.nav.product, href: `${home}#product` },
        { label: copy.nav.how, href: `${home}#how` },
        { label: copy.nav.pricing, href: `${home}#pricing` },
        { label: copy.nav.security, href: `${home}#security` },
      ],
    },
    {
      title: SOLUTIONS_TITLE[lang],
      links: LANDINGS.map((landing) => ({
        label: landing.keyword[lang],
        href: landingPath(lang, landing),
      })),
    },
    {
      title: copy.footer.resources,
      links: [
        { label: copy.footer.blog, href: blogPath(lang) },
        { label: copy.footer.trial, href: signupUrl({ lang }) },
        { label: "RSS", href: blogFeedPath(lang) },
        { label: copy.nav.login, href: APP.login },
      ],
    },
    {
      title: copy.footer.legal,
      links: [
        { label: copy.footer.privacy, href: legalPath(lang, "privacy") },
        { label: copy.footer.terms, href: legalPath(lang, "terms") },
        { label: copy.footer.cookies, href: legalPath(lang, "cookies") },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-paper">
      <div className="shell py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-pine-600">{copy.footer.tagline}</p>
            <a
              href={signupUrl({ lang })}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-signal"
            >
              {copy.footer.trial}
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="mono-label">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-pine-600 transition hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-xs text-pine-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.footer.rights}</p>
          <div className="flex items-center gap-5">
            <p>{copy.footer.madeIn}</p>
            <LanguageSwitcher page={page} label={copy.nav.language} compact />
          </div>
        </div>
      </div>
    </footer>
  );
}
