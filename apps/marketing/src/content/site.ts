import type { Lang } from "./languages";

export const SITE = {
  name: "Dentistes",
  legalName: "Dentistes",
  url: "https://dentistes.2mes4.com",
  appUrl: import.meta.env.VITE_APP_URL ?? "https://app.dentistes.2mes4.com",
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  ogImage: "/og.png",
  ogImages: { es: "/og-es.png", en: "/og-en.png", ca: "/og-ca.png" },
  ogImageWidth: 1200,
  ogImageHeight: 630,
  themeColor: "#0A1B17",
  founded: "2026",
};

export const APP = {
  login: `${SITE.appUrl}/login`,
  signup: `${SITE.appUrl}/signup`,
};

export function signupUrl(params?: Record<string, string | undefined>) {
  const url = new URL(APP.signup);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export const REGION_DATA = [
  {
    id: "global",
    currency: "USD",
    monthly: 18.5,
    yearly: 185,
    addons: { whatsapp: 20, signature: 10, pack: 39 },
  },
] as const;

export const BASE_PRICE = REGION_DATA[0];

export type RegionData = (typeof REGION_DATA)[number];

export function formatPrice(lang: Lang, currency: string, amount: number, decimals = 0) {
  const locale = lang === "en" ? "en-GB" : lang === "ca" ? "ca-ES" : "es-ES";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
