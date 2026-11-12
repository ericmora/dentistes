import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { APP, signupUrl } from "../content/site";
import { blogPath, homePath, type Page } from "../lib/seo";
import { Icon } from "./Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

export function Header({
  lang,
  copy,
  page,
}: {
  lang: Lang;
  copy: Copy;
  page: Page;
}) {
  const home = homePath(lang);
  const nav = [
    { label: copy.nav.product, href: `${home}#product` },
    { label: copy.nav.how, href: `${home}#how` },
    { label: copy.nav.pricing, href: `${home}#pricing` },
    { label: copy.nav.security, href: `${home}#security` },
    { label: copy.nav.blog, href: blogPath(lang) },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-chalk/88 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-5">
        <a href={home} aria-label="Dentistes" className="shrink-0">
          <Logo />
        </a>

        <nav className="hidden items-center gap-6 text-[13px] font-medium text-pine-700 lg:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher page={page} label={copy.nav.language} />
          <a href={APP.login} className="px-2 text-[13px] font-medium text-pine-700 transition hover:text-ink">
            {copy.nav.login}
          </a>
          <a href={signupUrl({ lang })} className="btn-signal min-h-10 px-4 text-[13px]">
            {copy.nav.trial}
            <Icon name="arrow" className="h-4 w-4" />
          </a>
        </div>

        <details className="group relative lg:hidden">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-panel border border-line-strong text-ink [&::-webkit-details-marker]:hidden"
            aria-label={copy.nav.menu}
          >
            <Icon name="menu" className="h-5 w-5 group-open:hidden" />
            <Icon name="close" className="hidden h-5 w-5 group-open:block" />
          </summary>
          <div className="absolute right-0 top-12 w-[min(19rem,calc(100vw-2.5rem))] border border-line bg-paper p-4 shadow-float">
            <nav className="flex flex-col">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="border-b border-line py-3 text-sm font-medium text-pine-700"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex items-center justify-between">
              <LanguageSwitcher page={page} label={copy.nav.language} />
              <a href={APP.login} className="text-sm font-medium text-pine-700">
                {copy.nav.login}
              </a>
            </div>
            <a href={signupUrl({ lang })} className="btn-signal mt-4 w-full">
              {copy.nav.trial}
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
