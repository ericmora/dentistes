const base = (import.meta.env.VITE_TENANT_BASE_DOMAIN ?? "dentistes.2mes4.com").toLowerCase();

const reserved = new Set(["app", "admin", "api", "www"]);

export function currentTenantSubdomain(): string | undefined {
  const host = window.location.hostname.toLowerCase();
  if (!host.endsWith(`.${base}`)) return undefined;
  const subdomain = host.slice(0, -(base.length + 1));
  if (!subdomain || subdomain.includes(".") || reserved.has(subdomain)) return undefined;
  return subdomain;
}
