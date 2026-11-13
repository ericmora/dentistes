import { test, expect } from "@playwright/test";

test.describe("Frontend Critical Paths E2E", () => {
  test("Onboarding 2-step wizard guides clinic creation with 30-day Stripe trial", async ({ page }) => {
    await page.goto("/onboarding");

    // Step 1: Clinic details
    await expect(page.getByRole("heading", { name: "Obre la teva clínica en 1 minut" })).toBeVisible();
    await expect(page.getByText("30 dies de prova")).toBeVisible();

    const clinicInput = page.getByLabel("Com es diu la teva clínica?");
    await clinicInput.fill("Clínica Dental Garraf E2E");

    // Subdomain preview should update automatically
    await expect(page.getByText("clinica-dental-garraf-e2e")).toBeVisible();

    // Country, Currency and Tax ID fields are present
    await expect(page.getByLabel("País de la clínica")).toBeVisible();
    await expect(page.getByLabel("Divisa de subscripció")).toBeVisible();
    await expect(page.getByLabel(/NIF \/ CIF/i)).toBeVisible();

    // Advance to Step 2
    await page.getByRole("button", { name: "Continuar" }).click();

    // Step 2: Access & Stripe explanation
    await expect(page.getByText("Pas 2 de 2")).toBeVisible();
    await expect(page.getByText(/Activació amb Stripe · 30 dies gratis/i)).toBeVisible();
    await expect(page.getByText("0 € avui", { exact: true })).toBeVisible();

    // Check presence of responsible person inputs
    await expect(page.getByLabel("Nom del responsable")).toBeVisible();
    await expect(page.getByLabel("Email de treball")).toBeVisible();
    await expect(page.getByLabel("Contrasenya")).toBeVisible();
    await expect(page.getByRole("button", { name: /Crear clínica i posar Stripe/i })).toBeVisible();
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
});
