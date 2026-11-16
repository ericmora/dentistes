import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import {
  UsersPage,
  ASSIGNABLE_ROLES,
  normalizeUserRole,
  getRoleDisplayName,
} from "../pages/Users";

const mockList = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

const mockSdk = {
  users: {
    list: mockList,
    create: mockCreate,
    update: mockUpdate,
  },
};

const mockMe = {
  user_id: "user-owner-1",
  email: "owner@clinica.com",
  full_name: "Dr. Joan Titular",
  role: "OWNER",
  permissions: ["*"],
  active_tenant: {
    id: "tenant-1",
    name: "Clínica Dental",
  },
};

vi.mock("../lib/session", () => ({
  useSession: () => ({
    me: mockMe,
    sdk: mockSdk,
  }),
}));

describe("Team & Roles Management (UsersPage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines clinic assignable roles including Admin, Dentist, Hygienist, Assistant, and Receptionist", () => {
    expect(ASSIGNABLE_ROLES.length).toBe(5);
    expect(ASSIGNABLE_ROLES.map((r) => r.value)).toEqual([
      "ADMIN",
      "DENTIST",
      "HYGIENIST",
      "ASSISTANT",
      "RECEPTIONIST",
    ]);
    expect(ASSIGNABLE_ROLES.map((r) => r.label)).toEqual([
      "Administrador",
      "Odontólogo / Doctor",
      "Higienista dental",
      "Auxiliar / Asistente de gabinete",
      "Recepción y atención al paciente",
    ]);
  });

  it("normalizes existing roles and preserves ASSISTANT, HYGIENIST, RECEPTIONIST", () => {
    expect(normalizeUserRole("ADMIN")).toBe("ADMIN");
    expect(normalizeUserRole("OWNER")).toBe("OWNER");
    expect(normalizeUserRole("DENTIST")).toBe("DENTIST");
    expect(normalizeUserRole("HYGIENIST")).toBe("HYGIENIST");
    expect(normalizeUserRole("ASSISTANT")).toBe("ASSISTANT");
    expect(normalizeUserRole("RECEPTIONIST")).toBe("RECEPTIONIST");
    expect(normalizeUserRole("UNKNOWN_ROLE")).toBe("DENTIST");

    expect(getRoleDisplayName("ADMIN")).toBe("Administrador");
    expect(getRoleDisplayName("DENTIST")).toBe("Odontólogo / Doctor");
    expect(getRoleDisplayName("ASSISTANT")).toBe("Auxiliar / Asistente de gabinete");
    expect(getRoleDisplayName("OWNER")).toBe("Propietario");
  });

  it("renders users list with role selectors and Propietario badge", async () => {
    mockList.mockResolvedValue({
      users: [
        {
          membership_id: "mem-1",
          user_id: "u-1",
          email: "owner@clinica.com",
          full_name: "Dr. Joan Titular",
          role: "OWNER",
          is_active: true,
        },
        {
          membership_id: "mem-2",
          user_id: "u-2",
          email: "admin@clinica.com",
          full_name: "Laura Admin",
          role: "ADMIN",
          is_active: true,
        },
        {
          membership_id: "mem-3",
          user_id: "u-3",
          email: "clinica@clinica.com",
          full_name: "Marc Odontólogo",
          role: "DENTIST",
          is_active: true,
        },
      ],
    });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laura Admin")).toBeInTheDocument();
    });

    // OWNER has Propietario badge and action label
    expect(screen.getAllByText("Propietario").length).toBeGreaterThanOrEqual(1);

    // Selects for non-owner users only contain the 2 roles
    const selects = screen.getAllByRole("combobox");
    // 2 in table + 1 in creation form = 3 comboboxes total
    expect(selects.length).toBe(3);

    const lauraSelect = screen.getByLabelText(/Rol de Laura Admin/i);
    expect(lauraSelect).toHaveValue("ADMIN");

    // Change Laura to Profesional de clínica
    mockUpdate.mockResolvedValue({});
    fireEvent.change(lauraSelect, { target: { value: "DENTIST" } });
    expect(mockUpdate).toHaveBeenCalledWith("mem-2", { role: "DENTIST" });
  });

  it("allows adding a new team member with either Administrador or Profesional de clínica role", async () => {
    mockList.mockResolvedValue({ users: [] });
    mockCreate.mockResolvedValue({});

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Sin usuarios/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/^Email/i);
    const nameInput = screen.getByLabelText(/Nombre completo/i);
    const passInput = screen.getByLabelText(/Contraseña temporal/i);
    const roleSelect = screen.getByLabelText(/Rol en la clínica/i);

    fireEvent.change(emailInput, { target: { value: "nuevo@clinica.com" } });
    fireEvent.change(nameInput, { target: { value: "Carlos Higienista" } });
    fireEvent.change(passInput, { target: { value: "SuperSegura123!" } });

    // Role default is DENTIST
    expect(roleSelect).toHaveValue("DENTIST");

    // Options contain all 5 assignable roles
    const options = Array.from(roleSelect.querySelectorAll("option"));
    expect(options.length).toBe(5);
    expect(options.map((o) => o.value)).toEqual(["ADMIN", "DENTIST", "HYGIENIST", "ASSISTANT", "RECEPTIONIST"]);

    fireEvent.change(roleSelect, { target: { value: "ASSISTANT" } });

    const submitBtn = screen.getByRole("button", { name: /Añadir miembro/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        email: "nuevo@clinica.com",
        full_name: "Carlos Higienista",
        password: "SuperSegura123!",
        role: "ASSISTANT",
      });
    });
  });
});
