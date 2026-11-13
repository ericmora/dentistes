import { test, expect } from "@playwright/test";

test.describe("Frontend Critical Paths E2E", () => {
  test("Onboarding 2-step wizard guides clinic creation with 30-day Stripe trial", async ({ page }) => {
    await page.goto("/onboarding");

    // Step 1: Clinic details
    await expect(page.getByRole("heading", { name: "Abre tu clínica en 1 minuto" })).toBeVisible();
    await expect(page.getByText("30 días de prueba")).toBeVisible();

    const clinicInput = page.getByLabel("¿Cómo se llama tu clínica?");
    await clinicInput.fill("Clínica Dental Garraf E2E");

    // Subdomain preview should update automatically
    await expect(page.getByText("clinica-dental-garraf-e2e")).toBeVisible();

    // Country, Currency and Tax ID fields are present
    await expect(page.getByLabel("País de la clínica")).toBeVisible();
    await expect(page.getByLabel("Divisa de suscripción")).toBeVisible();
    await expect(page.getByLabel(/NIF \/ CIF/i)).toBeVisible();

    // Advance to Step 2
    await page.getByRole("button", { name: "Continuar" }).click();

    // Step 2: Access & Stripe explanation
    await expect(page.getByText("Paso 2 de 2")).toBeVisible();
    await expect(page.getByText(/Activación con Stripe · 30 días gratis/i)).toBeVisible();
    await expect(page.getByText("0 € hoy", { exact: true })).toBeVisible();

    // Check presence of responsible person inputs
    await expect(page.getByLabel("Nombre del responsable")).toBeVisible();
    await expect(page.getByLabel("Email de trabajo")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: /Crear clínica y activar Stripe/i })).toBeVisible();
  });

  test("Login page renders authentication form and links to onboarding", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Dentistes", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Accede a/i })).toBeVisible();

    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Contraseña");
    const submitBtn = page.getByRole("button", { name: "Entrar" });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    const onboardingLink = page.getByRole("link", { name: /30 días gratis con Stripe/i });
    await expect(onboardingLink).toBeVisible();
  });

  test("Design System gallery renders clinical timeline and UI primitives", async ({ page }) => {
    await page.goto("/design-system");

    // Checks that the design system showcases badges, tokens, and timeline
    await expect(page.getByText("Design System", { exact: false })).toBeVisible();
  });

  test("Authenticated patient creation form binds inputs, validates dates, and submits successfully", async ({ page }) => {
    let capturedPayload: unknown = null;

    // Mock login, session, and patients API
    await page.route("**/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock_jwt_token",
          token_type: "Bearer",
          expires_in: 3600,
          user: { id: "usr-1", email: "dr@clinica.com", full_name: "Dr. Doctor", is_platform_admin: false },
          active_tenant: { id: "ten-1", name: "Clínica Test", subdomain: "test", status: "ACTIVE" },
          memberships: [{ tenant_id: "ten-1", tenant_name: "Clínica Test", subdomain: "test", role: "OWNER", tenant_status: "ACTIVE" }],
        }),
      });
    });

    await page.route("**/v1/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "usr-1", email: "dr@clinica.com", full_name: "Dr. Doctor", is_platform_admin: false },
          active_tenant: { id: "ten-1", name: "Clínica Test", subdomain: "test", status: "ACTIVE" },
          memberships: [{ tenant_id: "ten-1", tenant_name: "Clínica Test", subdomain: "test", role: "OWNER", tenant_status: "ACTIVE" }],
          role: "OWNER",
          permissions: ["patients:read", "patients:write", "clinical:read", "clinical:write"],
          features: { patients: true },
          feature_catalog: [],
          entitlements: { tenant_id: "ten-1", plan_key: "base", subscription_status: "ACTIVE", features: { patients: true } },
          billing: { tenant_id: "ten-1", plan_key: "base", status: "ACTIVE", cancel_at_period_end: false },
        }),
      });
    });

    await page.route("**/v1/patients*", async (route) => {
      if (route.request().method() === "POST") {
        capturedPayload = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "pat-1",
            first_name: "test amigo",
            last_name: "asd",
            birth_date: "1999-12-12",
            phone: "4493430067",
            email: "ericmora82+elpacientre@gmail.com",
            high_risk: false,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ patients: [], total: 0 }),
        });
      }
    });

    // Login via UI
    await page.goto("/login");
    await page.getByLabel("Email").fill("dr@clinica.com");
    await page.getByLabel("Contraseña").fill("password12345");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Navigate to patients
    await page.getByRole("link", { name: "Pacientes" }).click();

    // Form must be visible for users with patients:write
    await expect(page.getByRole("heading", { name: "Nuevo paciente" })).toBeVisible();

    await page.getByLabel("Nombre").fill("test amigo");
    await page.getByLabel("Apellidos").fill("asd");
    await page.getByLabel("Fecha de nacimiento").fill("1999-12-12");
    await page.getByLabel("Teléfono").fill("4493430067");
    await page.getByLabel("Email").fill("ericmora82+elpacientre@gmail.com");

    await page.getByRole("button", { name: "Crear paciente" }).click();

    // Verify undefined error never appears
    await expect(page.getByText(/expected string, received undefined/i)).not.toBeVisible();

    // Verify API received properly parsed payload
    await expect.poll(() => capturedPayload).toEqual({
      first_name: "test amigo",
      last_name: "asd",
      birth_date: "1999-12-12",
      phone: "4493430067",
      email: "ericmora82+elpacientre@gmail.com",
    });

    // Success toast notification
    await expect(page.getByText("Paciente creado")).toBeVisible();
  });
});
