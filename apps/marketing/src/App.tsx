import { COPY } from "./content/copy";
import { DEFAULT_LANG } from "./content/languages";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { getRouteMeta, parsePath, useSeo, type Page } from "./lib/seo";
import { useSmoothScroll } from "./lib/motion";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogPost } from "./pages/BlogPost";
import { CampaignLanding } from "./pages/CampaignLanding";
import { Landing } from "./pages/Landing";
import { Legal } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";

function resolvePage(page?: Page): Page {
  if (page) return page;
  if (typeof window !== "undefined") return parsePath(window.location.pathname);
  return { kind: "home", lang: DEFAULT_LANG };
}

export function App({ page }: { page?: Page }) {
  const current = resolvePage(page);
  const copy = COPY[current.lang];
  const meta = getRouteMeta(current);
  useSeo(meta);
  useSmoothScroll();

  return (
    <div className="min-h-screen">
      <a className="skip-link" href="#contingut">
        {copy.common.skip}
      </a>
      <Header lang={current.lang} copy={copy} page={current} />
      <main id="contingut">
        {current.kind === "home" ? <Landing lang={current.lang} copy={copy} /> : null}
        {current.kind === "landing" ? <CampaignLanding landing={current.landing} lang={current.lang} copy={copy} /> : null}
        {current.kind === "blog" ? <BlogIndex lang={current.lang} copy={copy} /> : null}
        {current.kind === "post" ? <BlogPost post={current.post} lang={current.lang} copy={copy} /> : null}
        {current.kind === "legal" ? <Legal doc={current.doc} lang={current.lang} copy={copy} /> : null}
        {current.kind === "notFound" ? <NotFound lang={current.lang} copy={copy} /> : null}
      </main>
      <Footer lang={current.lang} copy={copy} page={current} />
    </div>
  );
}
