export type Lang = "es" | "en" | "ca";

export const LANGS = [
  { id: "es", label: "Español", short: "ES", htmlLang: "es", ogLocale: "es_ES" },
  { id: "en", label: "English", short: "EN", htmlLang: "en", ogLocale: "en_US" },
  { id: "ca", label: "Català", short: "CA", htmlLang: "ca", ogLocale: "ca_ES" },
] as const satisfies ReadonlyArray<{
  id: Lang;
  label: string;
  short: string;
  htmlLang: string;
  ogLocale: string;
}>;

export const DEFAULT_LANG: Lang = "es";

export function isLang(value: string): value is Lang {
  return value === "es" || value === "en" || value === "ca";
}
