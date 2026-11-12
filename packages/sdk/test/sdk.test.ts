import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DentistesClient, DentistesError } from "../dist/index.js";

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
});
