import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DentistesClient, DentistesError, MemoryTokenStorage } from "../dist/index.js";

describe("Dentistes SDK Unit Tests", () => {
  test("DentistesError formats status and error body", () => {
    const err = new DentistesError(409, {
      code: "APPOINTMENT_OVERLAP",
      message: "The requested time slot is occupied",
      details: { cabinet_id: "c1" },
    });

    assert.equal(err.status, 409);
    assert.equal(err.code, "APPOINTMENT_OVERLAP");
    assert.equal(err.message, "The requested time slot is occupied");
    assert.deepEqual(err.details, { cabinet_id: "c1" });
    assert.equal(err.name, "DentistesError");
  });

  test("DentistesError handles empty body fallback", () => {
    const err = new DentistesError(500, undefined);
    assert.equal(err.status, 500);
    assert.equal(err.code, "UNKNOWN");
    assert.equal(err.message, "HTTP 500");
  });

  test("DentistesClient attaches bearer token when auth is true", async () => {
    let capturedAuth = "";
    let capturedUrl = "";

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input.toString();
      const headers = new Headers(init?.headers);
      capturedAuth = headers.get("Authorization") ?? "";
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "test-jwt-token-xyz",
      fetch: mockFetch,
    });

    const res = await client.me();
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/me");
    assert.equal(capturedAuth, "Bearer test-jwt-token-xyz");
    assert.equal((res as unknown as { ok: boolean }).ok, true);
  });

  test("DentistesClient throws DentistesError on HTTP error response", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions for this action",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      fetch: mockFetch,
    });

    await assert.rejects(
      async () => {
        await client.listPatients();
      },
      (err: any) => {
        assert.equal(err.name, "DentistesError");
        assert.equal(err.status, 403);
        assert.equal(err.code, "FORBIDDEN");
        assert.equal(err.message, "Insufficient permissions for this action");
        return true;
      }
    );
  });

  test("DentistesClient createLead sends public lead payload", async () => {
    let capturedMethod = "";
    let capturedBody = "";

    const mockFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedMethod = init?.method ?? "";
      capturedBody = init?.body?.toString() ?? "";
      return new Response(
        JSON.stringify({
          id: "lead-123",
          status: "NEW",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      fetch: mockFetch,
    });

    const lead = await client.createLead({
      contact_name: "Dr. Joan Mas",
      clinic_name: "Dental Mas",
      email: "joan@masdental.cat",
      phone: "+34600112233",
    });

    assert.equal(capturedMethod, "POST");
    assert(capturedBody.includes("joan@masdental.cat"));
    assert.equal(lead.id, "lead-123");
  });

  test("MemoryTokenStorage stores and retrieves tokens correctly", async () => {
    const storage = new MemoryTokenStorage("init_access", "init_refresh");
    assert.equal(await storage.getAccessToken(), "init_access");
    assert.equal(await storage.getRefreshToken(), "init_refresh");

    await storage.setAccessToken("new_access");
    await storage.setRefreshToken("new_refresh");
    assert.equal(await storage.getAccessToken(), "new_access");
    assert.equal(await storage.getRefreshToken(), "new_refresh");
  });

  test("DentistesClient multi-tenancy attaches X-Tenant-ID header", async () => {
    let capturedTenantHeader: string | null = null;
    const mockFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      capturedTenantHeader = headers.get("X-Tenant-ID");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      tenantId: "tenant-garraf-123",
      fetch: mockFetch,
    });

    assert.equal(client.getTenantId(), "tenant-garraf-123");
    await client.request("/v1/test");
    assert.equal(capturedTenantHeader, "tenant-garraf-123");

    // Dynamic tenant switch
    client.setTenantId("tenant-penedes-456");
    assert.equal(client.getTenantId(), "tenant-penedes-456");
    await client.request("/v1/test");
    assert.equal(capturedTenantHeader, "tenant-penedes-456");
  });

  test("DentistesClient appointmentStreamUrl formats valid SSE url", () => {
    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "my-secret-jwt",
    });
    const url = client.appointmentStreamUrl();
    assert.equal(url, "http://api.dentistes.test/v1/appointments/stream?access_token=my-secret-jwt");

    const unauthClient = new DentistesClient({ baseUrl: "http://api.dentistes.test" });
    assert.equal(unauthClient.appointmentStreamUrl(), null);
  });

  test("DentistesClient billing and clinic account cancellation APIs", async () => {
    const calls: Array<{ url: string; method: string; body?: any }> = [];
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(init.body.toString()) : undefined;
      calls.push({ url, method, body });

      if (url.includes("/v1/billing/invoices")) {
        return new Response(JSON.stringify({ invoices: [{ id: "in_1", number: "INV-101", status: "paid" }] }), { status: 200 });
      }
      if (url.includes("/v1/billing/subscription")) {
        return new Response(JSON.stringify({ subscription: { status: "ACTIVE", plan_key: "base" }, entitlements: { features: { agenda: true } } }), { status: 200 });
      }
      if (url.includes("/v1/billing/cancel")) {
        return new Response(JSON.stringify({ subscription: { status: "CANCELED" } }), { status: 200 });
      }
      if (url.includes("/v1/billing/resume")) {
        return new Response(JSON.stringify({ subscription: { status: "ACTIVE" } }), { status: 200 });
      }
      if (url.includes("/v1/billing/portal")) {
        return new Response(JSON.stringify({ url: "https://billing.stripe.com/p123" }), { status: 200 });
      }
      if (url.includes("/v1/clinic/cancel")) {
        return new Response(JSON.stringify({ status: "CANCELED" }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "token",
      fetch: mockFetch,
    });

    const sub = await client.billing.subscription();
    assert.equal(sub.subscription?.status, "ACTIVE");

    const invs = await client.billing.invoices();
    assert.equal(invs.invoices.length, 1);
    assert.equal(invs.invoices[0].number, "INV-101");

    const portal = await client.billing.portal();
    assert.equal(portal.url, "https://billing.stripe.com/p123");

    const cancelRes = await client.billing.cancel(true);
    assert.equal(cancelRes.subscription?.status, "CANCELED");

    const resumeRes = await client.billing.resume();
    assert.equal(resumeRes.subscription?.status, "ACTIVE");

    const clinicCancel = await client.clinic.cancel("clinica-garraf");
    assert.equal(clinicCancel.status, "CANCELED");
  });

  test("DentistesClient agenda and waiting list APIs", async () => {
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.includes("/v1/cabinets")) {
        return new Response(JSON.stringify({ cabinets: [{ id: "cab-1", name: "Gabinet 1" }] }), { status: 200 });
      }
      if (url.includes("/v1/doctors")) {
        return new Response(JSON.stringify({ doctors: [{ id: "doc-1", full_name: "Dr. Martí" }] }), { status: 200 });
      }
      if (url.includes("/v1/appointments/appt-1/status")) {
        return new Response(JSON.stringify({ appointment: { id: "appt-1", status: "CANCELLED" } }), { status: 200 });
      }
      if (url.includes("/v1/appointments")) {
        return new Response(JSON.stringify({ appointments: [{ id: "appt-1", treatment_type: "NETEJA" }] }), { status: 200 });
      }
      if (url.includes("/v1/waiting-list/matches")) {
        return new Response(JSON.stringify({ matches: [{ match_score: 95, entry: { id: "w-1" } }] }), { status: 200 });
      }
      if (url.includes("/v1/waiting-list/w-1/hold")) {
        return new Response(JSON.stringify({ entry: { id: "w-1", status: "OFFERED" } }), { status: 200 });
      }
      if (url.includes("/v1/waiting-list")) {
        return new Response(JSON.stringify({ entries: [{ id: "w-1", urgency_level: "URGENT" }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "token",
      fetch: mockFetch,
    });

    const cabs = await client.listCabinets();
    assert.equal(cabs.cabinets.length, 1);

    const docs = await client.listDoctors();
    assert.equal(docs.doctors.length, 1);

    const appts = await client.listAppointments({ cabinet_id: "cab-1" });
    assert.equal(appts.appointments[0].treatment_type, "NETEJA");

    const statusUpdate = await client.updateAppointmentStatus("appt-1", "CANCELLED");
    assert.equal(statusUpdate.appointment.status, "CANCELLED");

    const waiting = await client.listWaitingList();
    assert.equal(waiting.entries[0].urgency_level, "URGENT");

    const matches = await client.matchWaitingList({ start: "2026-11-16T10:00:00Z", end: "2026-11-16T11:00:00Z" });
    assert.equal(matches.matches[0].match_score, 95);

    const hold = await client.holdWaitingListEntry("w-1");
    assert.equal(hold.entry.status, "OFFERED");
  });

  test("DentistesClient admin module APIs", async () => {
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("/v1/admin/tenants")) {
        return new Response(JSON.stringify({ tenants: [{ id: "t1", name: "Clínica 1" }] }), { status: 200 });
      }
      if (url.includes("/v1/admin/features")) {
        return new Response(JSON.stringify({ features: [{ key: "agenda", name: "Agenda" }] }), { status: 200 });
      }
      if (url.includes("/v1/admin/plans")) {
        return new Response(JSON.stringify({ plans: [{ key: "base", name: "Base" }] }), { status: 200 });
      }
      if (url.includes("/v1/admin/leads")) {
        return new Response(JSON.stringify({ leads: [{ id: "l1", clinic_name: "Demo" }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "admin-token",
      fetch: mockFetch,
    });

    const tenants = await client.admin.listTenants();
    assert.equal(tenants.tenants.length, 1);

    const features = await client.admin.listFeatures();
    assert.equal(features.features.length, 1);

    const plans = await client.admin.listPlans();
    assert.equal(plans.plans.length, 1);

    const leads = await client.admin.listLeads();
    assert.equal(leads.leads.length, 1);
  });

  test("DentistesClient fiscal and multi-currency capabilities APIs", async () => {
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.includes("/v1/public/fiscal-configs")) {
        return new Response(JSON.stringify({ data: [{ country_code: "MX", currency_code: "MXN" }] }), { status: 200 });
      }
      if (url.includes("/v1/public/fiscal-capabilities")) {
        return new Response(JSON.stringify({
          country_code: "MX",
          currency: "MXN",
          localization: { tax_id_label: "RFC", tax_id_placeholder: "XAXX010101000", fiscal_authority: "SAT", document_label: "CFDI 4.0" },
          features: {
            electronic_invoicing: { status: "COMING_SOON", enabled: false, waitlist_joined: false, fallback_mode: "INTERNAL_RECEIPT_PDF" },
            internal_cash_register: { status: "ACTIVE", enabled: true },
          },
        }), { status: 200 });
      }
      if (url.includes("/v1/tenant/fiscal-capabilities/waitlist") && init?.method === "POST") {
        return new Response(JSON.stringify({
          country_code: "MX",
          currency: "MXN",
          features: {
            electronic_invoicing: { status: "COMING_SOON", enabled: false, waitlist_joined: true, fallback_mode: "INTERNAL_RECEIPT_PDF" },
          },
        }), { status: 200 });
      }
      if (url.includes("/v1/tenant/fiscal-capabilities")) {
        return new Response(JSON.stringify({
          country_code: "ES",
          currency: "EUR",
          features: {
            electronic_invoicing: { status: "ACTIVE", enabled: true, waitlist_joined: false, fallback_mode: "INTERNAL_RECEIPT_PDF" },
          },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "auth-token",
      fetch: mockFetch,
    });

    const configs = await client.fiscal.listConfigs();
    assert.equal(configs.length, 1);
    assert.equal(configs[0].country_code, "MX");

    const pubCaps = await client.fiscal.getPublicCapabilities("MX");
    assert.equal(pubCaps.country_code, "MX");
    assert.equal(pubCaps.features.electronic_invoicing.enabled, false);

    const tenantCaps = await client.fiscal.getCapabilities();
    assert.equal(tenantCaps.country_code, "ES");
    assert.equal(tenantCaps.features.electronic_invoicing.enabled, true);

    const waitlist = await client.fiscal.joinWaitlist("fiscal.electronic_invoicing", "Prioritat alta");
    assert.equal(waitlist.features.electronic_invoicing.waitlist_joined, true);
  });
});
