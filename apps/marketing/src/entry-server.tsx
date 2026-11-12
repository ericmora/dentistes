import { renderToString } from "react-dom/server";
import { App } from "./App";
import { POSTS, postPath } from "./content/posts";
import {
  ROUTES,
  absoluteUrl,
  blogFeedPath,
  blogPath,
  buildHead,
  buildSitemap,
  getRouteMeta,
  parsePath,
} from "./lib/seo";

export function render(path: string) {
  const page = parsePath(path);
  const meta = getRouteMeta(page);
  return {
    status: page.kind === "notFound" ? 404 : 200,
    html: renderToString(<App page={page} />),
    head: buildHead(meta),
    meta,
    page,
  };
}

export {
  POSTS,
  ROUTES,
  absoluteUrl,
  blogFeedPath,
  blogPath,
  buildSitemap,
  getRouteMeta,
  parsePath,
  postPath,
};
