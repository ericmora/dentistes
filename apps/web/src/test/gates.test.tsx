import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RoleGuard, FeatureGate, PermissionGate } from "@dentistes/ui";
import type { MeResponse } from "@dentistes/sdk";

const mockOwner: MeResponse = {
  user: { id: "u1", email: "owner@clinic.cat", full_name: "Owner", is_platform_admin: false },
  memberships: [],
  active_tenant: { id: "t1", name: "Clínica", subdomain: "clinica", status: "ACTIVE" },
  role: "OWNER",
  permissions: ["*"],
  features: { agenda: true, billing: true },
  feature_catalog: [],
  entitlements: { tenant_status: "ACTIVE", subscription_status: "ACTIVE", plan_key: "base", features: { agenda: true, billing: true } },
  billing: null,
};

const mockReceptionist: MeResponse = {
  ...mockOwner,
  role: "RECEPTIONIST",
  permissions: ["appointments:read", "appointments:write"],
  features: { agenda: true, billing: false },
};

describe("UI Security Gates", () => {
  it("RoleGuard renders children when role matches", () => {
    render(
      <RoleGuard me={mockOwner} roles={["OWNER", "ADMIN"]}>
        <div data-testid="protected-content">Àrea d'Administració</div>
      </RoleGuard>
    );
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("RoleGuard renders fallback when role does not match", () => {
    render(
      <RoleGuard me={mockReceptionist} roles={["OWNER", "ADMIN"]} fallback={<div data-testid="fallback">Accés Denegat</div>}>
        <div data-testid="protected-content">Àrea d'Administració</div>
      </RoleGuard>
    );
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("PermissionGate checks specific permission", () => {
    render(
      <PermissionGate me={mockReceptionist} permission="appointments:write">
        <div data-testid="can-write">Nova Cita</div>
      </PermissionGate>
    );
    expect(screen.getByTestId("can-write")).toBeInTheDocument();

    render(
      <PermissionGate me={mockReceptionist} permission="users:manage" fallback={<div data-testid="blocked">No Permès</div>}>
        <div data-testid="users-area">Gestió Usuaris</div>
      </PermissionGate>
    );
    expect(screen.queryByTestId("users-area")).not.toBeInTheDocument();
    expect(screen.getByTestId("blocked")).toBeInTheDocument();
  });

  it("FeatureGate blocks disabled or locked features", () => {
    render(
      <FeatureGate me={mockReceptionist} feature="billing" fallback={<div data-testid="locked-billing">Billing Bloquejat</div>}>
        <div data-testid="billing-content">Factures</div>
      </FeatureGate>
    );
    expect(screen.queryByTestId("billing-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("locked-billing")).toBeInTheDocument();
  });
});
