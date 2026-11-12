import { useEffect } from "react";
import { COPY } from "../content/copy";
import { DEFAULT_LANG, LANGS, type Lang } from "../content/languages";
import { POSTS, getPostBySlug, postPath, type Post } from "../content/posts";
import { REGION_DATA, SITE } from "../content/site";

export type JsonLd = Record<string, unknown>;

export type LegalDoc = "privacy" | "terms" | "cookies";

export type Page =
  | { kind: "home"; lang: Lang }
  | { kind: "blog"; lang: Lang }
  | { kind: "post"; lang: Lang; post: Post }
  | { kind: "legal"; lang: Lang; doc: LegalDoc }
  | { kind: "notFound"; lang: Lang };

export type Alternate = { hreflang: string; href: string };

export type RouteMeta = {
  page: Page;
  path: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: "website" | "article";
  image: string;
  imageAlt: string;
  htmlLang: string;
  ogLocale: string;
  alternates: Alternate[];
  jsonLd: JsonLd[];
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
};

export type RouteDefinition = {
  path: string;
  page: Page;
  lastmod: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
};

const ORIGIN = SITE.url.replace(/\/$/, "");

const LEGAL_SLUGS: Record<Lang, Record<LegalDoc, string>> = {
  es: { privacy: "privacidad", terms: "terminos", cookies: "cookies" },
  en: { privacy: "privacy", terms: "terms", cookies: "cookies" },
  ca: { privacy: "privacitat", terms: "termes", cookies: "cookies" },
};

const HOME_LABEL: Record<Lang, string> = { es: "Inicio", en: "Home", ca: "Inici" };
const DOC_LABEL: Record<LegalDoc, Record<Lang, string>> = {
  privacy: { es: "Privacidad", en: "Privacy", ca: "Privacitat" },
  terms: { es: "Términos", en: "Terms", ca: "Termes" },
  cookies: { es: "Cookies", en: "Cookies", ca: "Cookies" },
};

function langInfo(lang: Lang) {
  return LANGS.find((item) => item.id === lang) ?? LANGS[0];
}

function prefix(lang: Lang) {
  return lang === "es" ? "" : `/${lang}`;
}

export function absoluteUrl(path: string) {
  return `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function homePath(lang: Lang) {
  return `${prefix(lang)}/`;
}

export function blogPath(lang: Lang) {
  return `${prefix(lang)}/blog/`;
}

export function legalPath(lang: Lang, doc: LegalDoc) {
  return `${prefix(lang)}/legal/${LEGAL_SLUGS[lang][doc]}/`;
}

export function pageForLang(page: Page, lang: Lang): Page {
  switch (page.kind) {
    case "home":
      return { kind: "home", lang };
    case "blog":
      return { kind: "blog", lang };
    case "post":
      return { kind: "post", lang, post: page.post };
    case "legal":
      return { kind: "legal", lang, doc: page.doc };
    case "notFound":
      return { kind: "notFound", lang };
  }
}

export function pagePath(page: Page) {
  switch (page.kind) {
    case "home":
      return homePath(page.lang);
    case "blog":
      return blogPath(page.lang);
    case "post":
      return postPath(page.lang, page.post);
    case "legal":
      return legalPath(page.lang, page.doc);
    case "notFound":
      return "/404.html";
  }
}

export function parsePath(input: string): Page {
  const raw = input.split(/[?#]/)[0] || "/";
  const clean = raw !== "/" ? raw.replace(/\/+$/, "") : "/";
  let lang: Lang = DEFAULT_LANG;
  let rest = clean;

  for (const candidate of ["en", "ca"] as const) {
    if (clean === `/${candidate}` || clean.startsWith(`/${candidate}/`)) {
      lang = candidate;
      rest = clean.slice(candidate.length + 1) || "/";
      break;
    }
  }

  if (rest === "" || rest === "/") return { kind: "home", lang };
  if (rest === "/blog") return { kind: "blog", lang };

  if (rest.startsWith("/blog/")) {
    const slug = rest.slice("/blog/".length);
    const post = getPostBySlug(lang, slug);
    if (post) return { kind: "post", lang, post };
  }

  const legal = rest.match(/^\/legal\/([^/]+)$/);
  if (legal) {
    const doc = (Object.keys(LEGAL_SLUGS[lang]) as LegalDoc[]).find(
      (key) => LEGAL_SLUGS[lang][key] === legal[1],
    );
    if (doc) return { kind: "legal", lang, doc };
  }

  return { kind: "notFound", lang };
}

function organization(lang: Lang): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${ORIGIN}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: ORIGIN,
    logo: absoluteUrl("/icon-512.png"),
    description: COPY[lang].footer.tagline,
    foundingDate: SITE.founded,
    areaServed: [
      { "@type": "Country", name: "España" },
      { "@type": "Country", name: "México" },
      { "@type": "Country", name: "Chile" },
    ],
    knowsLanguage: ["es", "en", "ca"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: absoluteUrl(`${homePath(lang)}#contact`),
      availableLanguage: ["es", "en", "ca"],
    },
  };
}

function website(lang: Lang): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${ORIGIN}/#website`,
    url: ORIGIN,
    name: SITE.name,
    description: COPY[lang].meta.home.description,
    inLanguage: langInfo(lang).htmlLang,
    publisher: { "@id": `${ORIGIN}/#organization` },
  };
}

function softwareApplication(lang: Lang): JsonLd {
  const copy = COPY[lang];
  const offers = REGION_DATA.map((region) => ({
    "@type": "Offer",
    price: region.monthly,
    priceCurrency: region.currency,
    url: absoluteUrl(`${homePath(lang)}#pricing`),
    availability: "https://schema.org/InStock",
    category: "SaaS",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${ORIGIN}/#software`,
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Dental practice management",
    operatingSystem: "Web",
    url: ORIGIN,
    description: copy.meta.home.description,
    image: absoluteUrl(SITE.ogImages[lang]),
    screenshot: absoluteUrl(SITE.ogImages[lang]),
    inLanguage: langInfo(lang).htmlLang,
    featureList: [...copy.product.modules.map((module) => module.title), ...copy.pricing.features],
    offers,
    publisher: { "@id": `${ORIGIN}/#organization` },
  };
}

function faqPage(lang: Lang, items = COPY[lang].faq.items): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function breadcrumbs(lang: Lang, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function blogPosting(lang: Lang, post: Post): JsonLd {
  const url = absoluteUrl(postPath(lang, post));
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title[lang],
    description: post.description[lang],
    image: [absoluteUrl(post.cover)],
    datePublished: post.date,
    dateModified: post.updated,
    inLanguage: langInfo(lang).htmlLang,
    articleSection: post.category[lang],
    author: { "@type": "Organization", name: post.author[lang], url: ORIGIN },
    publisher: { "@id": `${ORIGIN}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@id": `${ORIGIN}/#website` },
  };
}

export function alternatesFor(page: Page): Alternate[] {
  if (page.kind === "notFound") return [];
  const paths: Record<Lang, string> = {
    es: pagePath(pageForLang(page, "es")),
    en: pagePath(pageForLang(page, "en")),
    ca: pagePath(pageForLang(page, "ca")),
  };

  return [
    { hreflang: "es-ES", href: absoluteUrl(paths.es) },
    { hreflang: "en", href: absoluteUrl(paths.en) },
    { hreflang: "ca-ES", href: absoluteUrl(paths.ca) },
    { hreflang: "x-default", href: absoluteUrl(paths.es) },
  ];
}

export function getRouteMeta(page: Page): RouteMeta {
  const copy = COPY[page.lang];
  const path = pagePath(page);
  const canonical = absoluteUrl(path);
  const alternates = alternatesFor(page);
  const info = langInfo(page.lang);
  const base = {
    page,
    path,
    canonical,
    alternates,
    htmlLang: info.htmlLang,
    ogLocale: info.ogLocale,
    image: absoluteUrl(SITE.ogImages[page.lang]),
    imageAlt: `${SITE.name}: ${copy.footer.tagline}`,
  };

  if (page.kind === "home") {
    return {
      ...base,
      title: copy.meta.home.title,
      description: copy.meta.home.description,
      robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      ogType: "website",
      jsonLd: [
        organization(page.lang),
        website(page.lang),
        softwareApplication(page.lang),
        faqPage(page.lang),
      ],
    };
  }

  if (page.kind === "blog") {
    return {
      ...base,
      title: copy.meta.blog.title,
      description: copy.meta.blog.description,
      robots: "index,follow,max-image-preview:large",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Blog",
          "@id": `${absoluteUrl(blogPath(page.lang))}#blog`,
          name: `${SITE.name} · Blog`,
          description: copy.meta.blog.description,
          url: absoluteUrl(blogPath(page.lang)),
          inLanguage: info.htmlLang,
          publisher: { "@id": `${ORIGIN}/#organization` },
          blogPost: POSTS.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title[page.lang],
            url: absoluteUrl(postPath(page.lang, post)),
            datePublished: post.date,
          })),
        },
        breadcrumbs(page.lang, [
          { name: HOME_LABEL[page.lang], path: homePath(page.lang) },
          { name: copy.nav.blog, path: blogPath(page.lang) },
        ]),
      ],
    };
  }

  if (page.kind === "post") {
    const post = page.post;
    return {
      ...base,
      title: `${post.seoTitle[page.lang]} | ${SITE.name}`,
      description: post.description[page.lang],
      robots: "index,follow,max-image-preview:large",
      ogType: "article",
      image: absoluteUrl(post.cover),
      imageAlt: post.coverAlt[page.lang],
      publishedTime: post.date,
      modifiedTime: post.updated,
      section: post.category[page.lang],
      jsonLd: [
        blogPosting(page.lang, post),
        breadcrumbs(page.lang, [
          { name: HOME_LABEL[page.lang], path: homePath(page.lang) },
          { name: copy.nav.blog, path: blogPath(page.lang) },
          { name: post.title[page.lang], path: postPath(page.lang, post) },
        ]),
        ...(post.faq[page.lang].length ? [faqPage(page.lang, post.faq[page.lang])] : []),
      ],
    };
  }

  if (page.kind === "legal") {
    const doc = copy.legal[page.doc];
    return {
      ...base,
      title: `${doc.title} | ${SITE.name}`,
      description: doc.intro,
      robots: "index,follow",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: doc.title,
          description: doc.intro,
          url: canonical,
          inLanguage: info.htmlLang,
          isPartOf: { "@id": `${ORIGIN}/#website` },
          dateModified: "2026-11-12",
        },
        breadcrumbs(page.lang, [
          { name: HOME_LABEL[page.lang], path: homePath(page.lang) },
          { name: DOC_LABEL[page.doc][page.lang], path: legalPath(page.lang, page.doc) },
        ]),
      ],
    };
  }

  return {
    ...base,
    path: "/404.html",
    canonical: absoluteUrl("/404.html"),
    alternates: [],
    title: copy.meta.notFound.title,
    description: copy.meta.notFound.description,
    robots: "noindex,follow",
    ogType: "website",
    jsonLd: [],
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function jsonLdScript(data: JsonLd) {
  const json = JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
  return `<script type="application/ld+json" data-seo="jsonld">${json}</script>`;
}

export function buildHead(meta: RouteMeta) {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    ...meta.alternates.map(
      (alt) =>
        `<link rel="alternate" hreflang="${escapeHtml(alt.hreflang)}" href="${escapeHtml(alt.href)}" />`,
    ),
    `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE.name)} · Blog" href="${escapeHtml(absoluteUrl(blogFeedPath(meta.page.lang)))}" />`,
    `<meta property="og:locale" content="${escapeHtml(meta.ogLocale)}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    `<meta property="og:image:width" content="${SITE.ogImageWidth}" />`,
    `<meta property="og:image:height" content="${SITE.ogImageHeight}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />`,
  ];

  if (meta.publishedTime) {
    tags.push(`<meta property="article:published_time" content="${meta.publishedTime}" />`);
  }
  if (meta.modifiedTime) {
    tags.push(`<meta property="article:modified_time" content="${meta.modifiedTime}" />`);
  }
  if (meta.section) {
    tags.push(`<meta property="article:section" content="${escapeHtml(meta.section)}" />`);
  }

  tags.push(...meta.jsonLd.map(jsonLdScript));
  return tags.join("\n    ");
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    if (hreflang) element.hreflang = hreflang;
    document.head.appendChild(element);
  }
  element.href = href;
}

export function useSeo(meta: RouteMeta) {
  useEffect(() => {
    document.title = meta.title;
    document.documentElement.lang = meta.htmlLang;
    setMeta("name", "description", meta.description);
    setMeta("name", "robots", meta.robots);
    setLink("canonical", meta.canonical);
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    for (const alternate of meta.alternates) {
      setLink("alternate", alternate.href, alternate.hreflang);
    }
    setMeta("property", "og:locale", meta.ogLocale);
    setMeta("property", "og:type", meta.ogType);
    setMeta("property", "og:site_name", SITE.name);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:url", meta.canonical);
    setMeta("property", "og:image", meta.image);
    setMeta("property", "og:image:width", String(SITE.ogImageWidth));
    setMeta("property", "og:image:height", String(SITE.ogImageHeight));
    setMeta("property", "og:image:alt", meta.imageAlt);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", meta.image);
    setMeta("name", "twitter:image:alt", meta.imageAlt);

    document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((script) => script.remove());
    for (const data of meta.jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seo = "jsonld";
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }, [meta]);
}

const LAST_UPDATED = "2026-11-12";

export const ROUTES: RouteDefinition[] = LANGS.flatMap(({ id: lang }) => [
  {
    path: homePath(lang),
    page: { kind: "home", lang } as Page,
    lastmod: LAST_UPDATED,
    changefreq: "weekly" as const,
    priority: "1.0",
  },
  {
    path: blogPath(lang),
    page: { kind: "blog", lang } as Page,
    lastmod: LAST_UPDATED,
    changefreq: "weekly" as const,
    priority: "0.8",
  },
  ...POSTS.map((post) => ({
    path: postPath(lang, post),
    page: { kind: "post", lang, post } as Page,
    lastmod: post.updated,
    changefreq: "monthly" as const,
    priority: "0.7",
  })),
  ...(["privacy", "terms", "cookies"] as LegalDoc[]).map((doc) => ({
    path: legalPath(lang, doc),
    page: { kind: "legal", lang, doc } as Page,
    lastmod: LAST_UPDATED,
    changefreq: "yearly" as const,
    priority: "0.2",
  })),
]);

export function buildSitemap() {
  const urls = ROUTES.map((route) => {
    const alternates = alternatesFor(route.page)
      .map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeHtml(alt.hreflang)}" href="${escapeHtml(alt.href)}" />`,
      )
      .join("\n");
    return `  <url>\n    <loc>${escapeHtml(absoluteUrl(route.path))}</loc>\n    <lastmod>${route.lastmod}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n${alternates}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

export function blogFeedPath(lang: Lang) {
  return `${prefix(lang)}/blog/feed.xml`;
}
