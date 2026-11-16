import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { UserAlarms } from "../ui/UserAlarms";
import type { MeResponse } from "@dentistes/sdk";

const mockMe: MeResponse = {
  user: { id: "user-123", email: "dr.mora@clinica.com", full_name: "Dr. Eric Mora", is_platform_admin: false },
  memberships: [],
  active_tenant: { id: "tenant-456", name: "Clínica Mora", subdomain: "mora", status: "ACTIVE" },
  role: "DENTIST",
  permissions: ["*"],
  features: { agenda: true },
  feature_catalog: [],
  entitlements: { tenant_status: "ACTIVE", subscription_status: "ACTIVE", plan_key: "base", features: { agenda: true } },
  billing: null,
};

vi.mock("../lib/session", () => ({
  useSession: () => ({
    me: mockMe,
    loading: false,
  }),
}));

describe("UserAlarms UI Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders alarms trigger button with initial active count", () => {
    render(
      <BrowserRouter>
        <UserAlarms />
      </BrowserRouter>
    );

    const triggerBtn = screen.getByRole("button", { name: /alarmas del usuario/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).toHaveTextContent("Alarmas");
  });

  it("opens user-specific alarms popover upon clicking trigger button", () => {
    render(
      <BrowserRouter>
        <UserAlarms />
      </BrowserRouter>
    );

    const triggerBtn = screen.getByRole("button", { name: /alarmas del usuario/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByText("Alarmas de Dr. Eric Mora")).toBeInTheDocument();
    expect(screen.getByText("DENTIST")).toBeInTheDocument();
    expect(screen.getByText(/Usuario: dr.mora@clinica.com/i)).toBeInTheDocument();
  });

  it("filters alarms by critical priority", () => {
    render(
      <BrowserRouter>
        <UserAlarms />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /alarmas del usuario/i }));

    const criticalFilterBtn = screen.getByRole("button", { name: /críticas/i });
    fireEvent.click(criticalFilterBtn);

    // Initial critical alarm for clinical role
    expect(screen.getByText(/Paciente con alerta médica de alto riesgo/i)).toBeInTheDocument();
  });

  it("creates a new custom alarm for the logged-in user", () => {
    render(
      <BrowserRouter>
        <UserAlarms />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /alarmas del usuario/i }));

    const addBtn = screen.getByRole("button", { name: /añadir/i });
    fireEvent.click(addBtn);

    const input = screen.getByPlaceholderText(/título del recordatorio o alerta/i);
    fireEvent.change(input, { target: { value: "Revisar TAC de Carlos" } });

    const submitBtn = screen.getByRole("button", { name: "Guardar" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Revisar TAC de Carlos")).toBeInTheDocument();
  });

  it("marks an alarm as resolved when clicking the toggle check button", () => {
    render(
      <BrowserRouter>
        <UserAlarms />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /alarmas del usuario/i }));

    const resolveButtons = screen.getAllByRole("button", { name: /marcar como resuelta/i });
    expect(resolveButtons.length).toBeGreaterThan(0);
    fireEvent.click(resolveButtons[0]);

    // Alarm now has resolved state in localStorage
    const saved = JSON.parse(localStorage.getItem("dentistes_user_alarms_tenant-456_user-123") || "[]");
    expect(saved[0].is_resolved).toBe(true);
  });
});
