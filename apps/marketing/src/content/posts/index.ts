import type { Lang } from "../languages";
import { choose } from "./choose";
import { cost } from "./cost";
import { migration } from "./migration";
import type { Post } from "./types";

export type { Post, PostBlock, PostFaq } from "./types";

export const POSTS: Post[] = [choose, cost, migration];

export function getPost(id: string): Post | undefined {
  return POSTS.find((post) => post.id === id);
}

export function getPostBySlug(lang: Lang, slug: string): Post | undefined {
  return POSTS.find((post) => post.slug[lang] === slug);
}

export function postPath(lang: Lang, post: Post): string {
  const prefix = lang === "es" ? "" : `/${lang}`;
  return `${prefix}/blog/${post.slug[lang]}/`;
}

export function postUrl(lang: Lang, post: Post): string {
  return `https://dentistes.2mes4.com${postPath(lang, post)}`;
}

export function relatedPosts(post: Post): Post[] {
  return post.related
    .map((id) => getPost(id))
    .filter((item): item is Post => Boolean(item));
}
