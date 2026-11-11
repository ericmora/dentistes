#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { DentistesClient, type MeResponse, type Patient } from "@dentistes/sdk";

interface CliConfig {
  baseUrl: string;
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
}

const configDir = path.join(os.homedir(), ".dentistes");
const configPath = path.join(configDir, "config.json");

function loadConfig(): CliConfig {
  const fallback: CliConfig = {
    baseUrl: process.env.DENTISTES_API_URL ?? "http://localhost:8080",
    accessToken: null,
    refreshToken: null,
    tenantId: null,
  };
  try {
    return { ...fallback, ...JSON.parse(fs.readFileSync(configPath, "utf8")) };
  } catch {
    return fallback;
  }
}

function saveConfig(config: CliConfig): void {
  fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
}

function makeClient(config: CliConfig): DentistesClient {
  return new DentistesClient({
    baseUrl: config.baseUrl,
    mode: "native",
    getAccessToken: () => config.accessToken,
    onAccessToken: (token) => {
      config.accessToken = token;
      saveConfig(config);
    },
    getRefreshToken: () => config.refreshToken,
    onRefreshToken: (token) => {
      config.refreshToken = token;
      saveConfig(config);
    },
  });
}

async function requireMe(client: DentistesClient, config: CliConfig): Promise<MeResponse> {
  try {
    const me = await client.me();
    config.tenantId = me.active_tenant?.id ?? config.tenantId;
    saveConfig(config);
    return me;
  } catch {
    const ok = await client.refresh();
    if (!ok) throw new Error("Sesión caducada. Ejecuta: dentistes login");
    const me = await client.me();
    config.tenantId = me.active_tenant?.id ?? config.tenantId;
    saveConfig(config);
    return me;
  }
}

function printPatients(patients: Patient[]): void {
  if (patients.length === 0) {
    console.log("Sin pacientes.");
    return;
  }
  for (const p of patients) {
    console.log(`${p.id}  ${p.last_name}, ${p.first_name}  ${p.phone}  ${p.birth_date}${p.high_risk ? "  [RIESGO]" : ""}`);
  }
}

function fail(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
}

const program = new Command();
program.name("dentistes").description("CLI de Dentistes (gestión dental multi-clínica)").version("0.1.0");

program
  .command("login")
  .description("Inicia sesión y guarda los tokens")
  .option("-e, --email <email>", "email")
  .option("-p, --password <password>", "contraseña")
  .option("--api <url>", "URL base de la API")
  .action(async (opts: { email?: string; password?: string; api?: string }) => {
    try {
      const config = loadConfig();
      if (opts.api) config.baseUrl = opts.api.replace(/\/$/, "");
      const email = opts.email ?? process.env.DENTISTES_EMAIL;
      const password = opts.password ?? process.env.DENTISTES_PASSWORD;
      if (!email || !password) throw new Error("Faltan --email y --password");
      const client = makeClient(config);
      const res = await client.login(email, password);
      config.tenantId = res.active_tenant?.id ?? null;
      saveConfig(config);
      console.log(`Sesión iniciada: ${res.user.full_name} <${res.user.email}>`);
      if (res.active_tenant) console.log(`Tenant activo: ${res.active_tenant.name} (${res.active_tenant.id})`);
      else console.log("Sin tenant activo (platform admin)");
    } catch (error) {
      fail(error);
    }
  });

program
  .command("logout")
  .description("Cierra la sesión y borra los tokens locales")
  .action(async () => {
    const config = loadConfig();
    await makeClient(config).logout().catch(() => undefined);
    config.accessToken = null;
    config.refreshToken = null;
    saveConfig(config);
    console.log("Sesión cerrada.");
  });

program
  .command("whoami")
  .description("Muestra el usuario y tenant activo")
  .action(async () => {
    try {
      const config = loadConfig();
      const me = await requireMe(makeClient(config), config);
      console.log(`Usuario: ${me.user.full_name} <${me.user.email}>`);
      console.log(`Rol: ${me.role}`);
      console.log(`Tenant: ${me.active_tenant.name} (${me.active_tenant.subdomain})`);
      console.log(`Plan: ${me.entitlements.plan_key || "—"} · Suscripción: ${me.billing?.status ?? "—"}`);
    } catch (error) {
      fail(error);
    }
  });

program
  .command("tenants")
  .description("Lista los tenants del usuario")
  .action(async () => {
    try {
      const config = loadConfig();
      const me = await requireMe(makeClient(config), config);
      for (const m of me.memberships) {
        const active = m.tenant_id === me.active_tenant.id ? "*" : " ";
        console.log(`${active} ${m.tenant_id}  ${m.tenant_name} (${m.subdomain})  ${m.role}  ${m.tenant_status}`);
      }
    } catch (error) {
      fail(error);
    }
  });

program
  .command("use")
  .argument("<tenantId>", "ID del tenant")
  .description("Cambia el tenant activo")
  .action(async (tenantId: string) => {
    try {
      const config = loadConfig();
      const client = makeClient(config);
      const res = await client.switchTenant(tenantId);
      config.tenantId = res.active_tenant?.id ?? tenantId;
      saveConfig(config);
      console.log(`Tenant activo: ${res.active_tenant?.name ?? tenantId}`);
    } catch (error) {
      fail(error);
    }
  });

program
  .command("features")
  .description("Muestra funcionalidades y permisos del tenant activo")
  .action(async () => {
    try {
      const config = loadConfig();
      const me = await requireMe(makeClient(config), config);
      if (me.entitlements.blocked_reason) {
        console.log(`BLOQUEADO: ${me.entitlements.blocked_reason}`);
      }
      for (const f of me.feature_catalog) {
        console.log(`${me.features[f.key] ? "[x]" : "[ ]"} ${f.key}  ${f.name}`);
      }
      console.log(`\nPermisos: ${me.permissions.join(", ")}`);
    } catch (error) {
      fail(error);
    }
  });

const patients = program.command("patients").description("Pacientes del tenant activo");

patients
  .command("list")
  .description("Lista pacientes")
  .option("-q, --query <texto>", "búsqueda")
  .option("-l, --limit <n>", "límite", "50")
  .action(async (opts: { query?: string; limit: string }) => {
    try {
      const config = loadConfig();
      const client = makeClient(config);
      await requireMe(client, config);
      const res = await client.listPatients({ q: opts.query, limit: Number(opts.limit) || 50 });
      printPatients(res.patients);
    } catch (error) {
      fail(error);
    }
  });

patients
  .command("create")
  .description("Crea un paciente")
  .requiredOption("--first <nombre>")
  .requiredOption("--last <apellidos>")
  .requiredOption("--birth <YYYY-MM-DD>")
  .requiredOption("--phone <telefono>")
  .option("--email <email>")
  .action(async (opts: { first: string; last: string; birth: string; phone: string; email?: string }) => {
    try {
      const config = loadConfig();
      const client = makeClient(config);
      await requireMe(client, config);
      const patient = await client.createPatient({
        first_name: opts.first,
        last_name: opts.last,
        birth_date: opts.birth,
        phone: opts.phone,
        email: opts.email,
      });
      console.log(`Paciente creado: ${patient.last_name}, ${patient.first_name} (${patient.id})`);
    } catch (error) {
      fail(error);
    }
  });

const billing = program.command("billing").description("Suscripción y pagos");

billing
  .command("status")
  .description("Estado de la suscripción")
  .action(async () => {
    try {
      const config = loadConfig();
      const client = makeClient(config);
      await requireMe(client, config);
      const res = await client.billing.subscription();
      console.log(JSON.stringify(res, null, 2));
    } catch (error) {
      fail(error);
    }
  });

billing
  .command("checkout")
  .requiredOption("--plan <key>", "plan a contratar")
  .description("Abre el checkout de Stripe")
  .action(async (opts: { plan: string }) => {
    try {
      const config = loadConfig();
      const client = makeClient(config);
      await requireMe(client, config);
      const res = await client.billing.checkout(opts.plan);
      console.log(res.url);
    } catch (error) {
      fail(error);
    }
  });

billing
  .command("portal")
  .description("Abre el portal de facturación de Stripe")
  .action(async () => {
    try {
      const config = loadConfig();
      const client = makeClient(config);
      await requireMe(client, config);
      const res = await client.billing.portal();
      console.log(res.url);
    } catch (error) {
      fail(error);
    }
  });

const admin = program.command("admin").description("Administración global (platform admin)");

admin
  .command("tenants")
  .description("Lista todos los tenants")
  .action(async () => {
    try {
      const config = loadConfig();
      const client = makeClient(config);
      const ok = await client.refresh();
      if (!ok) throw new Error("Sesión caducada. Ejecuta: dentistes login");
      const res = await client.admin.listTenants();
      for (const t of res.tenants) {
        console.log(`${t.id}  ${t.subdomain}  ${t.status}  ${t.plan_key || "—"}  ${t.subscription_status || "—"}`);
      }
    } catch (error) {
      fail(error);
    }
  });

program.parseAsync(process.argv).catch(fail);
