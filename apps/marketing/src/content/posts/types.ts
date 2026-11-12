import type { Lang } from "../languages";

export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string; id?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; title?: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "cta"; title: string; text: string; href: string; label: string };

export type PostFaq = { q: string; a: string };

export type Localized<T> = Record<Lang, T>;

export type Post = {
  id: string;
  slug: Localized<string>;
  title: Localized<string>;
  seoTitle: Localized<string>;
  description: Localized<string>;
  excerpt: Localized<string>;
  date: string;
  updated: string;
  category: Localized<string>;
  readingTime: Localized<string>;
  cover: string;
  coverAlt: Localized<string>;
  author: Localized<string>;
  blocks: Localized<PostBlock[]>;
  faq: Localized<PostFaq[]>;
  related: string[];
};
