import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");

async function findServerEntry() {
  for (const name of ["entry-server.js", "entry-server.mjs"]) {
    const candidate = path.join(ssrDir, name);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("SSR entry not found in dist-ssr");
}

const template = await fs.readFile(path.join(dist, "index.html"), "utf8");
const server = await import(pathToFileURL(await findServerEntry()).href);

function outputPath(routePath) {
  if (routePath === "/") return path.join(dist, "index.html");
  return path.join(dist, routePath.replace(/^\/|\/$/g, ""), "index.html");
}

function pageHtml(routePath, head, html, lang) {
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html);
}

let rendered = 0;
for (const route of server.ROUTES) {
  const result = server.render(route.path);
  const html = pageHtml(route.path, result.head, result.html, route.page.lang);
  const file = outputPath(route.path);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html, "utf8");
  rendered += 1;
}

const notFound = server.render("/404.html");
const notFoundHtml = pageHtml("/404.html", notFound.head, notFound.html, "es").replace(
  /<meta name="robots" content="[^"]*" \/>/,
  '<meta name="robots" content="noindex,follow" />',
);
await fs.writeFile(path.join(dist, "404.html"), notFoundHtml, "utf8");

await fs.writeFile(path.join(dist, "sitemap.xml"), server.buildSitemap(), "utf8");

const origin = "https://dentistes.2mes4.com";
const robots = [
  "User-agent: *",
  "Allow: /",
  "",
  "User-agent: GPTBot",
  "Allow: /",
  "",
  "User-agent: ClaudeBot",
  "Allow: /",
  "",
  "User-agent: PerplexityBot",
  "Allow: /",
  "",
  `Sitemap: ${origin}/sitemap.xml`,
  "",
].join("\n");
await fs.writeFile(path.join(dist, "robots.txt"), robots, "utf8");

const llms = `# Dentistes

Dentistes is dental practice management software for independent clinics.
Flat price per clinic, unlimited users and patients, 30-day trial without a card.

## Languages
- Spanish: ${origin}/
- English: ${origin}/en/
- Catalan: ${origin}/ca/

## Product
- Pricing: ${origin}/#pricing
- Security: ${origin}/#security
- Trial: ${origin}/#contact

## Content
- Blog ES: ${origin}/blog/
- Blog EN: ${origin}/en/blog/
- Blog CA: ${origin}/ca/blog/

## Company
Dentistes is a product of 2mes4. Data hosted in the EU.
`;
await fs.writeFile(path.join(dist, "llms.txt"), llms, "utf8");

const LANGS = [
  {
    id: "es",
    xmlLang: "es-ES",
    label: "Español",
    description: "Guías prácticas para clínicas dentales independientes.",
  },
  {
    id: "en",
    xmlLang: "en",
    label: "English",
    description: "Practical guides for independent dental clinics.",
  },
  {
    id: "ca",
    xmlLang: "ca-ES",
    label: "Català",
    description: "Guies pràctiques per a clíniques dentals independents.",
  },
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function rfcDate(value) {
  return new Date(`${value}T12:00:00Z`).toUTCString();
}

for (const lang of LANGS) {
  const posts = server.POSTS.filter((post) => post.slug[lang.id]);
  const items = posts
    .map((post) => {
      const link = server.absoluteUrl(server.postPath(lang.id, post));
      return `    <item>
      <title>${escapeXml(post.title[lang.id])}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.description[lang.id])}</description>
      <pubDate>${rfcDate(post.date)}</pubDate>
      <category>${escapeXml(post.category[lang.id])}</category>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Dentistes · Blog (${lang.label})</title>
    <link>${escapeXml(server.absoluteUrl(server.blogPath(lang.id)))}</link>
    <description>${escapeXml(lang.description)}</description>
    <language>${lang.xmlLang}</language>
    <lastBuildDate>${rfcDate("2026-11-12")}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  const feedFile = path.join(dist, server.blogFeedPath(lang.id).replace(/^\//, ""));
  await fs.mkdir(path.dirname(feedFile), { recursive: true });
  await fs.writeFile(feedFile, feed, "utf8");
}

console.log(`Prerendered ${rendered} routes + 404, sitemap, robots, llms.txt and ${LANGS.length} feeds.`);
