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
    id: "eur",
    countryCode: "ES",
    label: "Espanya / Europa (EUR €)",
    currency: "EUR",
    monthly: 49,
    yearly: 470,
    addons: { whatsapp: 20, signature: 10, pack: 39 },
  },
  {
    id: "mxn",
    countryCode: "MX",
    label: "Mèxic (MXN $)",
    currency: "MXN",
    monthly: 999,
    yearly: 9590,
    addons: { whatsapp: 399, signature: 199, pack: 799 },
  },
  {
    id: "usd",
    countryCode: "US",
    label: "Llatinoamèrica / Internacional (USD $)",
    currency: "USD",
    monthly: 49,
    yearly: 470,
    addons: { whatsapp: 20, signature: 10, pack: 39 },
  },
] as const;

export const BASE_PRICE = REGION_DATA[0];

export type RegionData = (typeof REGION_DATA)[number];
export type RegionId = RegionData["id"];

export const REGION_OVERRIDE_KEY = "2mes4_region_override";

export function getPreferredRegion(lang?: Lang): RegionData {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(REGION_OVERRIDE_KEY);
      if (stored) {
        const found = REGION_DATA.find((r) => r.id === stored || r.currency === stored);
        if (found) return found;
      }
    } catch {
      // ignore
    }
  }
  if (lang === "ca") return REGION_DATA[0]; // EUR
  if (lang === "es") return REGION_DATA[2]; // USD default for es / LATAM
  return REGION_DATA[2]; // USD default
}

export function setPreferredRegion(id: RegionId) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REGION_OVERRIDE_KEY, id);
      document.cookie = `${REGION_OVERRIDE_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }
}

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
