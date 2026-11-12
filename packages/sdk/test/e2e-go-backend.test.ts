import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { DentistesClient, DentistesError, MemoryTokenStorage } from "../dist/index.js";

describe("SDK E2E Compatibility with Go API Contract", () => {
  let server: http.Server;
  let serverUrl: string;

  test("Setup mock Go HTTP server adhering to internal/httpapi contract", async () => {
    server = http.createServer((req, res) => {
      // Simulate Go API writeJSON and writeError responses
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

      if (url.pathname === "/v1/public/leads" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          if (!parsed.email && !parsed.phone) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: {
                  code: "VALIDATION",
                  message: "either email or phone is required",
                },
              })
            );
            return;
          }
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              id: "019325c8-lead-7000-8000-000000000001",
              status: "NEW",
              clinic_name: parsed.clinic_name,
            })
          );
        });
        return;
      }

      if (url.pathname === "/v1/auth/login" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          if (parsed.email === "owner@garraf-dental.cat" && parsed.password === "Password123!") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                access_token: "jwt_token_sample_abc",
                refresh_token: "refresh_token_sample_xyz",
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              })
            );
          } else {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: {
                  code: "UNAUTHORIZED",
                  message: "invalid credentials",
                },
              })
            );
          }
        });
        return;
      }

      if (url.pathname === "/v1/me" && req.method === "GET") {
        const authHeader = req.headers["authorization"];
        if (authHeader !== "Bearer jwt_token_sample_abc") {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "missing or invalid token" } }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            user: { id: "u-1", email: "owner@garraf-dental.cat", full_name: "Dra. Maria Soler", is_platform_admin: false },
            memberships: [],
            active_tenant: { id: "tenant-garraf", name: "Clínica Dental Garraf", subdomain: "garraf-dental", status: "ACTIVE" },
            role: "OWNER",
            permissions: ["*"],
            features: { agenda: true, billing: true },
            feature_catalog: [],
            entitlements: { tenant_status: "ACTIVE", subscription_status: "ACTIVE", plan_key: "base", features: { agenda: true, billing: true } },
            billing: null,
          })
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "route not found" } }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as { port: number };
        serverUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  test("End-to-End flow: Lead -> Login -> Authenticated Me -> Entitlements", async () => {
    const storage = new MemoryTokenStorage();
    const client = new DentistesClient({
      baseUrl: serverUrl,
      storage,
    });

    // 1. Public lead captation
    const lead = await client.createLead({
      contact_name: "Dra. Maria Soler",
      clinic_name: "Clínica Dental Garraf",
      email: "owner@garraf-dental.cat",
      phone: "+34611223344",
    });
    assert.equal(lead.status, "NEW");
    assert.equal(lead.clinic_name, "Clínica Dental Garraf");

    // 2. Lead validation error
    await assert.rejects(
      async () => {
        await client.createLead({
          contact_name: "Sense contacte",
          clinic_name: "Sense contacte",
          email: "",
          phone: "",
        });
      },
      (err: any) => {
        assert(err instanceof DentistesError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "VALIDATION");
        assert.equal(err.message, "either email or phone is required");
        return true;
      }
    );

    // 3. Login with credentials
    const auth = await client.login("owner@garraf-dental.cat", "Password123!");
    assert.equal(auth.access_token, "jwt_token_sample_abc");
    assert.equal(await storage.getAccessToken(), "jwt_token_sample_abc");

    // 4. Authenticated /v1/me call using stored token
    const me = await client.me();
    assert.equal(me.role, "OWNER");
    assert.equal(me.active_tenant.subdomain, "garraf-dental");
    assert.equal(me.features.agenda, true);
    assert.equal(me.entitlements.plan_key, "base");

    // Close server
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
