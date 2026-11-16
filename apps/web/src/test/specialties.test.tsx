import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicAdminPage } from "../pages/ClinicAdmin";

const mockListSpecialties = vi.fn();
const mockCreateSpecialty = vi.fn();
const mockUpdateSpecialty = vi.fn();
const mockDeleteSpecialty = vi.fn();
const mockListCabinets = vi.fn();
const mockListTreatments = vi.fn();
const mockGetSettings = vi.fn();

const mockSdk = {
  listSpecialties: mockListSpecialties,
  createSpecialty: mockCreateSpecialty,
  updateSpecialty: mockUpdateSpecialty,
  deleteSpecialty: mockDeleteSpecialty,
  listCabinets: mockListCabinets,
  listTreatments: mockListTreatments,
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

describe("Specialties Master Table & Matching (ClinicAdmin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({ settings: {} });
    mockListCabinets.mockResolvedValue({
      cabinets: [
        {
          id: "cab-1",
          name: "Gabinete 1",
          color_code: "#0D9488",
          equipment: "Sillón dental",
          allowed_categories: ["ORTODONCIA", "IMPLANTES"],
          is_active: true,
        },
      ],
    });
    mockListTreatments.mockResolvedValue({
      treatments: [
        {
          id: "trt-1",
          code: "BRACKETS",
          name: "Brackets metálicos",
          category: "ORTODONCIA",
          default_price: 800,
          estimated_minutes: 60,
          color: "#EC4899",
          is_active: true,
        },
      ],
    });
    mockListSpecialties.mockResolvedValue({
      specialties: [
        {
          id: "sp-1",
          code: "ORTODONCIA",
          name: "Ortodoncia",
          description: "Brackets y alineadores",
          color_code: "#EC4899",
          is_active: true,
        },
        {
          id: "sp-2",
          code: "IMPLANTES",
          name: "Implantología",
          description: "Implantes dentales y cirugía guiada",
          color_code: "#0F172A",
          is_active: true,
        },
        {
          id: "sp-3",
          code: "ENDODONCIA",
          name: "Endodoncia",
          description: "Tratamiento de conductos",
          color_code: "#8B5CF6",
          is_active: true,
        },
      ],
    });
  });

  it("renders the master specialties tab with listed specialties", async () => {
    renderWithClient(<ClinicAdminPage />);

    // Click on Especialidades tab
    const specTab = screen.getByRole("tab", { name: "Especialidades" });
    fireEvent.click(specTab);

    await waitFor(() => {
      expect(screen.getByText("Especialidades clínicas")).toBeInTheDocument();
      expect(screen.getByText("Ortodoncia")).toBeInTheDocument();
      expect(screen.getByText("Implantología")).toBeInTheDocument();
      expect(screen.getByText("Endodoncia")).toBeInTheDocument();
    });
  });

  it("allows searching and filtering specialties", async () => {
    renderWithClient(<ClinicAdminPage />);

    const specTab = screen.getByRole("tab", { name: "Especialidades" });
    fireEvent.click(specTab);

    await waitFor(() => {
      expect(screen.getByText("Ortodoncia")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Buscar especialidad o código...");
    fireEvent.change(searchInput, { target: { value: "implante" } });

    expect(screen.getByText("Implantología")).toBeInTheDocument();
    expect(screen.queryByText("Ortodoncia")).not.toBeInTheDocument();
  });

  it("opens create specialty modal and submits new specialty", async () => {
    mockCreateSpecialty.mockResolvedValue({
      specialty: {
        id: "sp-4",
        code: "SEDACION",
        name: "Sedación Consciente",
        description: "Relajación asistida",
        color_code: "#6366F1",
        is_active: true,
      },
    });

    renderWithClient(<ClinicAdminPage />);

    const specTab = screen.getByRole("tab", { name: "Especialidades" });
    fireEvent.click(specTab);

    await waitFor(() => {
      expect(screen.getByText("Nueva especialidad")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Nueva especialidad"));

    expect(screen.getByText("Configura el nombre, código, descripción y color distintivo para gabinetes y tratamientos.")).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nombre de la especialidad/i);
    fireEvent.change(nameInput, { target: { value: "Sedación Consciente" } });

    const saveButton = screen.getByText("Guardar especialidad");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateSpecialty).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sedación Consciente",
        }),
      );
    });
  });

  it("matches specialties in cabinet and treatments tabs", async () => {
    renderWithClient(<ClinicAdminPage />);

    // In Cabinets tab, the cabinet displays the matched specialty labels
    const cabTab = screen.getByRole("tab", { name: "Gabinetes" });
    fireEvent.click(cabTab);

    await waitFor(() => {
      expect(screen.getByText("Gabinete 1")).toBeInTheDocument();
      // Should display resolved specialty names rather than bare uppercase codes
      expect(screen.getByText("Ortodoncia")).toBeInTheDocument();
      expect(screen.getByText("Implantología")).toBeInTheDocument();
    });

    // In Treatments tab, the treatment displays the matched specialty label
    const trtTab = screen.getByRole("tab", { name: "Tratamientos" });
    fireEvent.click(trtTab);

    await waitFor(() => {
      expect(screen.getByText("Brackets metálicos")).toBeInTheDocument();
      expect(screen.getByText("Ortodoncia")).toBeInTheDocument();
    });
  });

  it("triggers logical deletion with confirm dialog for specialties", async () => {
    mockDeleteSpecialty.mockResolvedValue({ ok: true });

    renderWithClient(<ClinicAdminPage />);

    const specTab = screen.getByRole("tab", { name: "Especialidades" });
    fireEvent.click(specTab);

    await waitFor(() => {
      expect(screen.getByText("Ortodoncia")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Eliminar especialidad (borrado lógico)");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/La especialidad se desactivará mediante un borrado lógico/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText("Sí, eliminar especialidad");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteSpecialty).toHaveBeenCalledWith("sp-1");
    });
  });
});
