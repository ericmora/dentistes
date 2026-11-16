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
      if (url.includes("/v1/clinic/settings") && method === "PUT") {
        const parsed = body ?? {};
        return new Response(
          JSON.stringify({
            settings: {
              logo_url: parsed.logo_url ?? "",
              clinic_contact_line: parsed.clinic_contact_line ?? "",
              budget_default_validity_days: parsed.budget_default_validity_days ?? 60,
              budget_default_series: parsed.budget_default_series ?? "PRE",
              budget_warning_days_before_expiry: parsed.budget_warning_days_before_expiry ?? 7,
              budget_validity_terms: parsed.budget_validity_terms ?? "",
              budget_auto_expire: parsed.budget_auto_expire ?? true,
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes("/v1/clinic/settings")) {
        return new Response(
          JSON.stringify({
            settings: {
              logo_url: "https://clinica.example.com/logo.svg",
              clinic_contact_line: "Av. Diagonal 450",
              budget_default_validity_days: 30,
              budget_default_series: "PRE",
              budget_warning_days_before_expiry: 7,
              budget_validity_terms: "Validez 30 días.",
              budget_auto_expire: true,
            },
          }),
          { status: 200 },
        );
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

    const clinicSettings = await client.clinic.getSettings();
    assert.equal(clinicSettings.settings.budget_default_validity_days, 30);

    const updatedSettings = await client.clinic.updateSettings({
      logo_url: "https://clinica.example.com/new-logo.svg",
      budget_default_validity_days: 60,
    });
    assert.equal(updatedSettings.settings.budget_default_validity_days, 60);

    const clinicCancel = await client.clinic.cancel("clinica-garraf");
    assert.equal(clinicCancel.status, "CANCELED");
  });

  test("DentistesClient agenda and waiting list APIs", async () => {
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (init?.method === "PUT" && url.includes("/v1/cabinets/cab-1")) {
        return new Response(JSON.stringify({ cabinet: { id: "cab-1", name: "Gabinet 1 Cirurgia" } }), { status: 200 });
      }
      if (init?.method === "POST" && url.includes("/v1/cabinets")) {
        return new Response(JSON.stringify({ cabinet: { id: "cab-2", name: "Gabinet 2" } }), { status: 201 });
      }
      if (init?.method === "DELETE" && url.includes("/v1/cabinets/")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url.includes("/v1/cabinets")) {
        return new Response(JSON.stringify({ cabinets: [{ id: "cab-1", name: "Gabinet 1" }] }), { status: 200 });
      }
      if (url.includes("/v1/shifts/overrides")) {
        return new Response(JSON.stringify({ overrides: [{ id: "ov-1", override_date: "2026-11-16", is_cancelled: true }] }), { status: 200 });
      }
      if (url.includes("/v1/shifts")) {
        return new Response(JSON.stringify({ shifts: [{ id: "sh-1", name: "Cirugia", cabinet_id: "cab-1", day_of_week: 1 }] }), { status: 200 });
      }
      if (url.includes("/v1/holidays")) {
        return new Response(JSON.stringify({ holidays: [{ id: "h-1", date: "2026-12-25", name: "Navidad", is_full_day: true }] }), { status: 200 });
      }
      if (url.includes("/v1/doctors")) {
        return new Response(JSON.stringify({ doctors: [{ id: "doc-1", full_name: "Dr. Martí" }] }), { status: 200 });
      }
      if (url.includes("/v1/appointments/available-slots")) {
        return new Response(JSON.stringify({ slots: [{ cabinet_id: "cab-1", start_time: "10:00", end_time: "11:00", duration_minutes: 60, shift: "morning" }] }), { status: 200 });
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

    const createdCab = await client.createCabinet({ name: "Gabinet 2", color_code: "#0EA5E9" });
    assert.equal(createdCab.cabinet.name, "Gabinet 2");

    const updatedCab = await client.updateCabinet("cab-1", { name: "Gabinet 1 Cirurgia" });
    assert.equal(updatedCab.cabinet.name, "Gabinet 1 Cirurgia");

    const delCab = await client.deleteCabinet("cab-1");
    assert.equal(delCab.ok, true);

    const docs = await client.listDoctors();
    assert.equal(docs.doctors.length, 1);

    const appts = await client.listAppointments({ cabinet_id: "cab-1" });
    assert.equal(appts.appointments[0].treatment_type, "NETEJA");

    const availSlots = await client.findAvailableSlots({ cabinet_id: "cab-1", duration: 60, shift: "morning" });
    assert.equal(availSlots.slots.length, 1);
    assert.equal(availSlots.slots[0].start_time, "10:00");

    const statusUpdate = await client.updateAppointmentStatus("appt-1", "CANCELLED");
    assert.equal(statusUpdate.appointment.status, "CANCELLED");

    const waiting = await client.listWaitingList();
    assert.equal(waiting.entries[0].urgency_level, "URGENT");

    const shiftsRes = await client.listShifts();
    assert.equal(shiftsRes.shifts.length, 1);
    assert.equal(shiftsRes.shifts[0].name, "Cirugia");

    const overridesRes = await client.listShiftOverrides();
    assert.equal(overridesRes.overrides.length, 1);
    assert.equal(overridesRes.overrides[0].is_cancelled, true);

    const holidaysRes = await client.listHolidays();
    assert.equal(holidaysRes.holidays.length, 1);
    assert.equal(holidaysRes.holidays[0].name, "Navidad");

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

  test("DentistesClient treatments catalog APIs", async () => {
    const calls: Array<{ url: string; method: string; body?: any }> = [];
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(init.body.toString()) : undefined;
      calls.push({ url, method, body });

      if (url.includes("/v1/treatments") && method === "GET") {
        return new Response(
          JSON.stringify({
            treatments: [
              {
                id: "trt_1",
                code: "LIMPIEZA",
                name: "Limpieza Dental",
                category: "PREVENCION",
                category_label: "Diagnóstico y Prevención",
                default_price: 50,
                estimated_minutes: 30,
                color: "#06B6D4",
                is_active: true,
              },
            ],
          }),
          { status: 200 }
        );
      }
      if (url.includes("/v1/treatments") && method === "POST") {
        return new Response(
          JSON.stringify({
            treatment: {
              id: "trt_2",
              name: body.name,
              category: body.category,
              default_price: body.default_price,
              estimated_minutes: body.estimated_minutes,
              color: body.color,
              is_active: true,
            },
          }),
          { status: 201 }
        );
      }
      if (url.includes("/v1/treatments/trt_2") && method === "PUT") {
        return new Response(
          JSON.stringify({
            treatment: {
              id: "trt_2",
              name: body.name,
              category: body.category,
              default_price: body.default_price,
              estimated_minutes: body.estimated_minutes,
              color: body.color,
              is_active: true,
            },
          }),
          { status: 200 }
        );
      }
      if (url.includes("/v1/treatments/trt_2") && method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "auth-token",
      fetch: mockFetch,
    });

    const list = await client.listTreatments({ all: true });
    assert.equal(list.treatments.length, 1);
    assert.equal(list.treatments[0].name, "Limpieza Dental");

    const created = await client.createTreatment({
      name: "Blanqueamiento LED",
      category: "ESTETICA",
      default_price: 250,
      estimated_minutes: 60,
      color: "#F59E0B",
    });
    assert.equal(created.treatment.name, "Blanqueamiento LED");
    assert.equal(created.treatment.default_price, 250);

    const updated = await client.updateTreatment("trt_2", {
      name: "Blanqueamiento Dental LED Avanzado",
      default_price: 280,
    });
    assert.equal(updated.treatment.name, "Blanqueamiento Dental LED Avanzado");

    const del = await client.deleteTreatment("trt_2");
    assert.equal(del.ok, true);
  });

  test("DentistesClient specialties master APIs", async () => {
    const calls: Array<{ url: string; method: string; body?: any }> = [];
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(init.body.toString()) : undefined;
      calls.push({ url, method, body });

      if (url.includes("/v1/specialties") && method === "GET") {
        return new Response(
          JSON.stringify({
            specialties: [
              {
                id: "spec_1",
                code: "ORTODONCIA",
                name: "Ortodoncia",
                description: "Brackets y alineadores",
                color_code: "#EC4899",
                is_active: true,
              },
            ],
          }),
          { status: 200 }
        );
      }
      if (url.includes("/v1/specialties") && method === "POST") {
        return new Response(
          JSON.stringify({
            specialty: {
              id: "spec_2",
              code: body.code ?? "SEDACION",
              name: body.name,
              description: body.description ?? "",
              color_code: body.color_code ?? "#0D9488",
              is_active: true,
            },
          }),
          { status: 201 }
        );
      }
      if (url.includes("/v1/specialties/spec_2") && method === "PUT") {
        return new Response(
          JSON.stringify({
            specialty: {
              id: "spec_2",
              code: "SEDACION",
              name: body.name,
              description: body.description ?? "",
              color_code: body.color_code ?? "#0D9488",
              is_active: body.is_active ?? true,
            },
          }),
          { status: 200 }
        );
      }
      if (url.includes("/v1/specialties/spec_2") && method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "auth-token",
      fetch: mockFetch,
    });

    const list = await client.listSpecialties({ include_deleted: false });
    assert.equal(list.specialties.length, 1);
    assert.equal(list.specialties[0].code, "ORTODONCIA");

    const created = await client.createSpecialty({
      name: "Sedación Consciente",
      code: "SEDACION",
      description: "Técnica de relajación clínica",
      color_code: "#6366F1",
    });
    assert.equal(created.specialty.name, "Sedación Consciente");
    assert.equal(created.specialty.color_code, "#6366F1");

    const updated = await client.updateSpecialty("spec_2", {
      name: "Sedación Consciente Odontológica",
    });
    assert.equal(updated.specialty.name, "Sedación Consciente Odontológica");

    const del = await client.deleteSpecialty("spec_2");
    assert.equal(del.ok, true);
  });

  test("DentistesClient patient invoices and payments APIs", async () => {
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/v1/patients/pat_1/invoices") && method === "GET") {
        return new Response(
          JSON.stringify({
            invoices: [
              {
                id: "inv_1",
                patient_id: "pat_1",
                series: "FAC",
                invoice_number: 101,
                total_amount: 150.0,
                paid_amount: 0.0,
                status: "ISSUED",
                verification_hash: "hash123",
                items: [{ id: "1", description: "Obturación", quantity: 1, unit_price_cents: 6000, tax_rate_percent: 0 }],
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/v1/patients/pat_1/invoices") && method === "POST") {
        const body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            invoice: {
              id: "inv_2",
              patient_id: "pat_1",
              series: body.series || "FAC",
              invoice_number: 102,
              total_amount: 60.0,
              paid_amount: 0.0,
              status: "ISSUED",
              verification_hash: "hash456",
              items: body.items,
            },
          }),
          { status: 201 }
        );
      }

      if (url.includes("/v1/invoices/inv_2/payments") && method === "POST") {
        const body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            payment: {
              id: "pay_1",
              invoice_id: "inv_2",
              amount: body.amount,
              payment_method: body.payment_method,
              created_at: new Date().toISOString(),
            },
          }),
          { status: 201 }
        );
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "auth-token",
      fetch: mockFetch,
    });

    const list = await client.listPatientInvoices("pat_1");
    assert.equal(list.invoices.length, 1);
    assert.equal(list.invoices[0].invoice_number, 101);

    const created = await client.createPatientInvoice("pat_1", {
      items: [{ id: "item_1", description: "Empaste pieza 16", tooth_number: "16", quantity: 1, unit_price_cents: 6000, tax_rate_percent: 0 }],
    });
    assert.equal(created.invoice.invoice_number, 102);

    const payment = await client.recordInvoicePayment("inv_2", {
      amount: 60.0,
      payment_method: "CARD",
    });
    assert.equal(payment.payment.amount, 60.0);
    assert.equal(payment.payment.payment_method, "CARD");
  });

  test("DentistesClient clinical findings and multi-option budgets APIs", async () => {
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/v1/patients/pat_1/findings") && method === "GET") {
        return new Response(
          JSON.stringify({
            findings: [
              {
                id: "find_26",
                patient_id: "pat_1",
                doctor_id: "doc_1",
                tooth_number: "26",
                surfaces: ["mesial", "occlusal", "distal"],
                pathology_code: "SEVERE_DAMAGE",
                diagnosis: "Pieza 26 en muy mal estado",
                severity: "HIGH",
                status: "OPEN",
                notes: "Pronóstico reservado",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/v1/patients/pat_1/findings") && method === "POST") {
        const body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            finding: {
              id: "find_26",
              patient_id: "pat_1",
              doctor_id: "doc_1",
              tooth_number: body.tooth_number,
              surfaces: body.surfaces || [],
              pathology_code: body.pathology_code || "GENERAL",
              diagnosis: body.diagnosis,
              severity: body.severity || "HIGH",
              status: "OPEN",
              notes: body.notes || "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
          { status: 201 }
        );
      }

      if (url.includes("/v1/findings/find_26/status") && method === "PATCH") {
        const body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            finding: {
              id: "find_26",
              patient_id: "pat_1",
              doctor_id: "doc_1",
              tooth_number: "26",
              surfaces: [],
              pathology_code: "SEVERE_DAMAGE",
              diagnosis: "Pieza 26 en muy mal estado",
              severity: "HIGH",
              status: body.status,
              notes: body.notes || "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
          { status: 200 }
        );
      }

      if (url.includes("/v1/patients/pat_1/budgets") && method === "GET") {
        return new Response(
          JSON.stringify({
            budgets: [
              {
                id: "bud_1",
                patient_id: "pat_1",
                doctor_id: "doc_1",
                series: "PRE",
                budget_number: 1,
                title: "Plan Rehabilitación Pieza 26",
                issue_date: "2026-11-14",
                validity_days: 30,
                valid_until: "2026-12-14",
                status: "PRESENTED",
                min_estimate_amount: 50,
                max_estimate_amount: 1120,
                accepted_amount: 0,
                notes: "",
                findings_blocks: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/v1/patients/pat_1/budgets") && method === "POST") {
        const body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            budget: {
              id: "bud_1",
              patient_id: "pat_1",
              doctor_id: "doc_1",
              series: body.series || "PRE",
              budget_number: 1,
              title: body.title,
              issue_date: "2026-11-14",
              validity_days: body.validity_days || 30,
              valid_until: "2026-12-14",
              status: "PRESENTED",
              min_estimate_amount: 50,
              max_estimate_amount: 1120,
              accepted_amount: 0,
              notes: body.notes || "",
              findings_blocks: body.findings_blocks,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
          { status: 201 }
        );
      }

      if (url.includes("/v1/budgets/bud_1/options-response") && method === "PATCH") {
        return new Response(
          JSON.stringify({
            budget: {
              id: "bud_1",
              patient_id: "pat_1",
              doctor_id: "doc_1",
              series: "PRE",
              budget_number: 1,
              title: "Plan Rehabilitación Pieza 26",
              issue_date: "2026-11-14",
              validity_days: 30,
              valid_until: "2026-12-14",
              status: "ACCEPTED",
              min_estimate_amount: 50,
              max_estimate_amount: 1120,
              accepted_amount: 1120,
              notes: "",
              findings_blocks: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
          { status: 200 }
        );
      }

      if (url.includes("/v1/budgets/bud_1/status") && method === "PATCH") {
        const body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            budget: {
              id: "bud_1",
              patient_id: "pat_1",
              doctor_id: "doc_1",
              series: "PRE",
              budget_number: 1,
              title: "Plan Rehabilitación Pieza 26",
              issue_date: "2026-11-14",
              validity_days: body.validity_days || 30,
              valid_until: "2026-12-14",
              status: body.status,
              min_estimate_amount: 50,
              max_estimate_amount: 1120,
              accepted_amount: 0,
              notes: "",
              findings_blocks: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
          { status: 200 }
        );
      }

      if (url.includes("/v1/budgets/bud_1/invoice") && method === "POST") {
        return new Response(
          JSON.stringify({
            budget: { id: "bud_1", status: "INVOICED", invoice_id: "inv_99" },
            invoice: { id: "inv_99", series: "FAC", invoice_number: 99, total_amount: 1120 },
          }),
          { status: 201 }
        );
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "auth-token",
      fetch: mockFetch,
    });

    const findingsList = await client.listPatientFindings("pat_1", { open: true });
    assert.equal(findingsList.findings.length, 1);
    assert.equal(findingsList.findings[0].tooth_number, "26");

    const createdFinding = await client.createPatientFinding("pat_1", {
      tooth_number: "26",
      diagnosis: "Pieza 26 en muy mal estado",
      severity: "HIGH",
    });
    assert.equal(createdFinding.finding.status, "OPEN");

    const updatedFinding = await client.updateFindingStatus("find_26", {
      status: "DISCARDED",
      notes: "Se descarta tras Rx periapical sin lesión",
    });
    assert.equal(updatedFinding.finding.status, "DISCARDED");

    await assert.rejects(
      () => client.cancelFindingWithNote("find_26", "   "),
      /Se requiere una nota clínica/
    );
    const cancelledWithNote = await client.cancelFindingWithNote(
      "find_26",
      "Cancelado con nota clínica en historial"
    );
    assert.equal(cancelledWithNote.finding.status, "DISCARDED");
    assert.equal(cancelledWithNote.finding.notes, "Cancelado con nota clínica en historial");

    const budgetsList = await client.listPatientBudgets("pat_1", { open: true });
    assert.equal(budgetsList.budgets.length, 1);

    const createdBudget = await client.createPatientBudget("pat_1", {
      title: "Plan Rehabilitación Pieza 26",
      validity_days: 30,
      findings_blocks: [],
    });
    assert.equal(createdBudget.budget.budget_number, 1);

    const acceptedBudget = await client.updateBudgetOptionResponse("bud_1", {
      finding_id: "find_26",
      option_id: "opt_3",
      patient_response: "ACCEPTED",
      notes: "Acepta implante",
    });
    assert.equal(acceptedBudget.budget.status, "ACCEPTED");
    assert.equal(acceptedBudget.budget.accepted_amount, 1120);

    const statusBudget = await client.updateBudgetStatus("bud_1", { status: "REJECTED" });
    assert.equal(statusBudget.budget.status, "REJECTED");

    const invoiced = await client.convertBudgetToInvoice("bud_1", { series: "FAC" });
    assert.equal(invoiced.budget.status, "INVOICED");
    assert.equal(invoiced.invoice.invoice_number, 99);
  });

  test("DentistesClient uploadImage optimizes and sends image payload", async () => {
    let capturedUrl = "";
    let capturedBody: any = null;

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;
      return new Response(
        JSON.stringify({
          id: "img-123",
          url: "/api/v1/uploads/images/img-123",
          data_url: "data:image/jpeg;base64,abc",
          original_filename: "logo.png",
          mime_type: "image/jpeg",
          width: 800,
          height: 600,
          original_size_bytes: 500000,
          optimized_size_bytes: 40000,
          reduction_percentage: 92.0,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      fetch: mockFetch,
    });

    const res = await client.uploadImage(
      { dataUrl: "data:image/png;base64,dummy", filename: "logo.png" },
      { maxDim: 800 },
    );

    assert.equal(capturedUrl, "http://api.dentistes.test/v1/uploads/images?max_dim=800");
    assert.equal(capturedBody.filename, "logo.png");
    assert.equal(res.id, "img-123");
    assert.equal(res.reduction_percentage, 92.0);
  });

  test("DentistesClient clinic.reactivate and admin winback methods work correctly", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody: any = null;

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedMethod = init?.method ?? "GET";
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;

      if (capturedUrl.includes("/clinic/reactivate")) {
        return new Response(
          JSON.stringify({
            tenant: { id: "t1", slug: "clinic-test", status: "ACTIVE" },
            message: "Clínica reactivada con éxito",
            free_month_applied: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (capturedUrl.includes("/admin/winback/metrics")) {
        return new Response(
          JSON.stringify({
            total_canceled_clinics: 10,
            active_winback_window: 4,
            total_emails_sent: 25,
            total_opened: 15,
            total_clicked: 8,
            total_reactivated: 3,
            open_rate_pct: 60,
            click_rate_pct: 32,
            reactivation_rate_pct: 30,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (capturedUrl.includes("/admin/winback/logs")) {
        return new Response(
          JSON.stringify({ logs: [{ id: "log-1", step_number: 1, tracking_token: "tok-1" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (capturedUrl.includes("/admin/winback/templates")) {
        if (capturedMethod === "PUT") {
          return new Response(
            JSON.stringify({
              template: { id: "tmpl-1", step_number: 1, subject: "Nuevo Asunto" },
              message: "Plantilla actualizada",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ templates: [{ id: "tmpl-1", step_number: 1, days_after: 5 }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (capturedUrl.includes("/admin/winback/test-email")) {
        return new Response(
          JSON.stringify({ ok: true, message: "Email de prueba enviado", tracking_token: "test-tok", tracking_pixel_url: "", rendered_preview: "" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (capturedUrl.includes("/admin/winback/trigger-cron")) {
        return new Response(
          JSON.stringify({ ok: true, evaluated_clinics: 10, emails_dispatched: 2 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      fetch: mockFetch,
    });

    // Test clinic.reactivate
    const reactivateRes = await client.clinic.reactivate("test-token-123");
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/clinic/reactivate");
    assert.equal(capturedMethod, "POST");
    assert.equal(capturedBody.token, "test-token-123");
    assert.equal(reactivateRes.tenant.status, "ACTIVE");
    assert.equal(reactivateRes.free_month_applied, true);

    // Test admin.getWinbackMetrics
    const metrics = await client.admin.getWinbackMetrics();
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/admin/winback/metrics");
    assert.equal(metrics.total_canceled_clinics, 10);
    assert.equal(metrics.open_rate_pct, 60);

    // Test admin.listWinbackLogs
    const logsRes = await client.admin.listWinbackLogs();
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/admin/winback/logs");
    assert.equal(logsRes.logs.length, 1);
    assert.equal(logsRes.logs[0].id, "log-1");

    // Test admin.listWinbackTemplates
    const templatesRes = await client.admin.listWinbackTemplates();
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/admin/winback/templates");
    assert.equal(templatesRes.templates.length, 1);

    // Test admin.updateWinbackTemplate
    const updated = await client.admin.updateWinbackTemplate(1, { subject: "Nuevo Asunto" });
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/admin/winback/templates/1");
    assert.equal(capturedMethod, "PUT");
    assert.equal(capturedBody.subject, "Nuevo Asunto");
    assert.equal(updated.template.subject, "Nuevo Asunto");

    // Test admin.sendTestWinbackEmail
    const testEmailRes = await client.admin.sendTestWinbackEmail("test@dentistes.test", 15);
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/admin/winback/test-email");
    assert.equal(capturedMethod, "POST");
    assert.equal(capturedBody.recipient_email, "test@dentistes.test");
    assert.equal(capturedBody.step_day, 15);
    assert.equal(testEmailRes.tracking_token, "test-tok");

    // Test admin.triggerWinbackCron
    const cronRes = await client.admin.triggerWinbackCron();
    assert.equal(capturedUrl, "http://api.dentistes.test/v1/admin/winback/trigger-cron");
    assert.equal(capturedMethod, "POST");
    assert.equal(cronRes.emails_dispatched, 2);
  });

  test("DentistesClient chairs, assistants and staff absences APIs", async () => {
    const calls: Array<{ url: string; method: string; body?: any }> = [];
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(init.body.toString()) : undefined;
      calls.push({ url, method, body });

      if (url.includes("/v1/chairs") && method === "GET") {
        return new Response(JSON.stringify({
          chairs: [{ id: "chair_1", name: "Butaca 1", color_code: "#0D9488", is_active: true, created_at: "2026-11-16T00:00:00Z" }]
        }), { status: 200 });
      }
      if (url.includes("/v1/chairs") && method === "POST") {
        return new Response(JSON.stringify({
          chair: { id: "chair_2", name: body.name, color_code: body.color_code || "#0D9488", is_active: true, created_at: "2026-11-16T00:00:00Z" }
        }), { status: 201 });
      }
      if (url.includes("/v1/chairs/chair_2") && method === "PUT") {
        return new Response(JSON.stringify({
          chair: { id: "chair_2", name: body.name, color_code: body.color_code || "#0D9488", is_active: true, created_at: "2026-11-16T00:00:00Z" }
        }), { status: 200 });
      }
      if (url.includes("/v1/chairs/chair_2") && method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url.includes("/v1/assistants") && method === "GET") {
        return new Response(JSON.stringify({
          assistants: [{ id: "asst_1", full_name: "Marta Auxiliar", role: "ASSISTANT" }]
        }), { status: 200 });
      }
      if (url.includes("/v1/absences") && method === "GET") {
        return new Response(JSON.stringify({
          absences: [{ id: "abs_1", user_id: "doc_1", absence_type: "VACATION", start_date: "2026-11-20", end_date: "2026-11-25", status: "PENDING", auto_rescheduled_count: 0 }]
        }), { status: 200 });
      }
      if (url.includes("/v1/absences") && method === "POST") {
        return new Response(JSON.stringify({
          absence: { id: "abs_2", user_id: body.user_id, absence_type: body.absence_type, start_date: body.start_date, end_date: body.end_date, status: body.auto_approve ? "APPROVED" : "PENDING", auto_rescheduled_count: 0 }
        }), { status: 201 });
      }
      if (url.includes("/v1/absences/abs_1/status") && method === "PUT") {
        return new Response(JSON.stringify({
          absence: { id: "abs_1", user_id: "doc_1", absence_type: "VACATION", start_date: "2026-11-20", end_date: "2026-11-25", status: body.status, auto_rescheduled_count: 3 }
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new DentistesClient({
      baseUrl: "http://api.dentistes.test",
      getAccessToken: () => "token",
      fetch: mockFetch,
    });

    const chairsRes = await client.listChairs();
    assert.equal(chairsRes.chairs.length, 1);
    assert.equal(chairsRes.chairs[0].name, "Butaca 1");

    const createdChair = await client.createChair({ name: "Butaca 2" });
    assert.equal(createdChair.chair.name, "Butaca 2");

    const updatedChair = await client.updateChair("chair_2", { name: "Butaca 2 (Modificada)" });
    assert.equal(updatedChair.chair.name, "Butaca 2 (Modificada)");

    const deletedChair = await client.deleteChair("chair_2");
    assert.equal(deletedChair.ok, true);

    const asstsRes = await client.listAssistants();
    assert.equal(asstsRes.assistants.length, 1);
    assert.equal(asstsRes.assistants[0].full_name, "Marta Auxiliar");

    const absencesRes = await client.listAbsences();
    assert.equal(absencesRes.absences.length, 1);
    assert.equal(absencesRes.absences[0].status, "PENDING");

    const createdAbsence = await client.createAbsence({
      user_id: "doc_1",
      absence_type: "VACATION",
      start_date: "2026-11-20",
      end_date: "2026-11-25",
    });
    assert.equal(createdAbsence.absence.absence_type, "VACATION");

    const approvedAbsence = await client.updateAbsenceStatus("abs_1", "APPROVED");
    assert.equal(approvedAbsence.absence.status, "APPROVED");
    assert.equal(approvedAbsence.absence.auto_rescheduled_count, 3);
  });
});
