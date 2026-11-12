import type { Lang } from "../content/languages";

const LOCALES: Record<Lang, string> = { es: "es-ES", en: "en-GB", ca: "ca-ES" };

export function formatDate(lang: Lang, value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
