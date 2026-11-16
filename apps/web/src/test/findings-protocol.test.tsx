import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicAdminPage } from "../pages/ClinicAdmin";

const mockListSpecialties = vi.fn();
const mockListTreatments = vi.fn();
const mockListFindingsCatalog = vi.fn();
const mockCreateFindingCatalog = vi.fn();
const mockUpdateFindingCatalog = vi.fn();
const mockDeleteFindingCatalog = vi.fn();
const mockGetSettings = vi.fn();

const mockSdk = {
  listSpecialties: mockListSpecialties,
  listTreatments: mockListTreatments,
  listFindingsCatalog: mockListFindingsCatalog,
  createFindingCatalog: mockCreateFindingCatalog,
  updateFindingCatalog: mockUpdateFindingCatalog,
  deleteFindingCatalog: mockDeleteFindingCatalog,
  listCabinets: vi.fn().mockResolvedValue({ cabinets: [] }),
  listChairs: vi.fn().mockResolvedValue({ chairs: [] }),
  listStaffAbsences: vi.fn().mockResolvedValue({ absences: [] }),
  listUsers: vi.fn().mockResolvedValue({ users: [] }),
  clinic: {
    getSettings: mockGetSettings,
  },
};

const mockMe = {
  user_id: "user-owner-1",
  email: "owner@clinica.com",
  full_name: "Dr. Joan Titular",
  role: "OWNER",
  permissions: ["*"],
  features: {
    agenda: true,
  },
  active_tenant: {
    id: "tenant-1",
    name: "Clínica Dental",
    subdomain: "clinicadental",
    billing_currency: "EUR",
  },
};

vi.mock("../lib/session", () => ({
  useSession: () => ({
    me: mockMe,
    sdk: mockSdk,
    logout: vi.fn(),
  }),
}));

vi.mock("./Users", () => ({
  UsersPage: () => <div>Users Page Mock</div>,
  getRoleDisplayName: () => "Propietario",
}));

vi.mock("./Billing", () => ({
  BillingPage: () => <div>Billing Page Mock</div>,
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Findings Master Catalog & Treatment Protocols (ClinicAdmin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({ settings: {} });
    mockListSpecialties.mockResolvedValue({
      specialties: [
        { id: "sp-1", code: "CONSERVADORA", name: "Odontología Conservadora", color_code: "#3B82F6", is_active: true },
        { id: "sp-2", code: "ENDODONCIA", name: "Endodoncia", color_code: "#8B5CF6", is_active: true },
      ],
    });
    mockListTreatments.mockResolvedValue({
      treatments: [
        {
          id: "trt-1",
          code: "OBTURACION_SIMPLE",
          name: "Obturación simple",
          category: "CONSERVADORA",
          default_price: 60,
          is_active: true,
        },
        {
          id: "trt-2",
          code: "ENDODONCIA_MULTIRRADICULAR",
          name: "Endodoncia multirradicular",
          category: "ENDODONCIA",
          default_price: 210,
          is_active: true,
        },
      ],
    });
    mockListFindingsCatalog.mockResolvedValue({
      findings: [
        {
          id: "fnd-1",
          code: "CARIES_ESMALTE",
          name: "Caries superficial / esmalte",
          description: "Lesión inicial",
          category: "CONSERVADORA",
          default_severity: "LOW",
          color_code: "#3B82F6",
          default_treatment_codes: ["OBTURACION_SIMPLE"],
          is_active: true,
        },
      ],
    });
  });

  it("renders findings tab and displays default protocols", async () => {
    renderWithClient(<ClinicAdminPage />);

    const findingsTab = screen.getByRole("tab", { name: /Hallazgos y Protocolos/i });
    expect(findingsTab).toBeInTheDocument();

    fireEvent.click(findingsTab);

    await waitFor(() => {
      expect(screen.getByText("Catálogo de Hallazgos y Protocolos Clínicos")).toBeInTheDocument();
      expect(screen.getByText("Caries superficial / esmalte")).toBeInTheDocument();
      expect(screen.getByText("CARIES_ESMALTE")).toBeInTheDocument();
      expect(screen.getByText("Baja")).toBeInTheDocument();
      expect(screen.getByText("Obturación simple")).toBeInTheDocument();
    });
  });

  it("opens create finding modal and sends default treatments protocol", async () => {
    mockCreateFindingCatalog.mockResolvedValue({
      finding: {
        id: "fnd-2",
        code: "CARIES_PROFUNDA",
        name: "Caries profunda con pulpitis",
        description: "Afectación pulpar",
        category: "ENDODONCIA",
        default_severity: "HIGH",
        color_code: "#8B5CF6",
        default_treatment_codes: ["ENDODONCIA_MULTIRRADICULAR"],
        is_active: true,
      },
    });

    renderWithClient(<ClinicAdminPage />);

    const findingsTab = screen.getByRole("tab", { name: /Hallazgos y Protocolos/i });
    fireEvent.click(findingsTab);

    await waitFor(() => {
      expect(screen.getByText("Catálogo de Hallazgos y Protocolos Clínicos")).toBeInTheDocument();
    });

    const newFindingBtn = screen.getByRole("button", { name: /Nuevo hallazgo/i });
    fireEvent.click(newFindingBtn);

    await waitFor(() => {
      expect(screen.getByText("Nuevo hallazgo diagnóstico y protocolo")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Ej. Caries de esmalte oclusal");
    fireEvent.change(nameInput, { target: { value: "Caries profunda con pulpitis" } });

    // Click on treatment item to assign it to default protocol
    const endoTreatmentOption = screen.getByRole("button", { name: /Endodoncia multirradicular/i });
    fireEvent.click(endoTreatmentOption);

    const submitBtn = screen.getByRole("button", { name: /Guardar hallazgo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateFindingCatalog).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Caries profunda con pulpitis",
          default_treatment_codes: expect.arrayContaining(["ENDODONCIA_MULTIRRADICULAR"]),
        }),
      );
    });
  });
});
