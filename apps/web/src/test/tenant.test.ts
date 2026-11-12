import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { currentTenantSubdomain } from "../lib/tenant";

describe("currentTenantSubdomain", () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  function setHostname(hostname: string) {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { hostname },
    });
  }

  it("extracts subdomain from valid clinic domain", () => {
    setHostname("clinica-garraf.dentistes.2mes4.com");
    expect(currentTenantSubdomain()).toBe("clinica-garraf");
  });

  it("rejects reserved subdomains", () => {
    for (const reserved of ["app", "admin", "api", "www"]) {
      setHostname(`${reserved}.dentistes.2mes4.com`);
      expect(currentTenantSubdomain()).toBeUndefined();
    }
  });

  it("returns undefined for naked base domain or unrelated domain", () => {
    setHostname("dentistes.2mes4.com");
    expect(currentTenantSubdomain()).toBeUndefined();

    setHostname("localhost");
    expect(currentTenantSubdomain()).toBeUndefined();
  });
});
