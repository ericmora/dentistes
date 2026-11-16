import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicAdminPage } from "../pages/ClinicAdmin";

const mockListChairs = vi.fn();
const mockCreateChair = vi.fn();
const mockUpdateChair = vi.fn();
const mockDeleteChair = vi.fn();

const mockListCabinets = vi.fn();
const mockCreateCabinet = vi.fn();
const mockUpdateCabinet = vi.fn();
const mockDeleteCabinet = vi.fn();

const mockListDoctors = vi.fn();
const mockListAssistants = vi.fn();
const mockListAbsences = vi.fn();
const mockCreateAbsence = vi.fn();
const mockUpdateAbsenceStatus = vi.fn();
const mockListUsers = vi.fn();

const mockListSpecialties = vi.fn();
const mockListTreatments = vi.fn();
const mockGetSettings = vi.fn();
const mockUpdateSettings = vi.fn();

const mockSdk = {
  listChairs: mockListChairs,
  createChair: mockCreateChair,
  updateChair: mockUpdateChair,
  deleteChair: mockDeleteChair,

  listCabinets: mockListCabinets,
  createCabinet: mockCreateCabinet,
  updateCabinet: mockUpdateCabinet,
  deleteCabinet: mockDeleteCabinet,

  listDoctors: mockListDoctors,
  listAssistants: mockListAssistants,
  listAbsences: mockListAbsences,
  createAbsence: mockCreateAbsence,
  updateAbsenceStatus: mockUpdateAbsenceStatus,

  listSpecialties: mockListSpecialties,
  listTreatments: mockListTreatments,
  users: {
    list: mockListUsers,
  },
  clinic: {
    getSettings: mockGetSettings,
    updateSettings: mockUpdateSettings,
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
    name: "Clínica Dental Diagonal",
    subdomain: "diagonal",
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
  getRoleDisplayName: (role: string) => {
    if (role === "ADMIN") return "Administrador";
    if (role === "DENTIST") return "Odontólogo / Doctor";
    if (role === "ASSISTANT") return "Auxiliar de gabinete";
    return role;
  },
}));

vi.mock("./Billing", () => ({
  BillingPage: () => <div>Billing Page Mock</div>,
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Butacas, Gabinetes and Staff Absences (ClinicAdminPage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockListSpecialties.mockResolvedValue({ specialties: [] });
    mockListTreatments.mockResolvedValue({ treatments: [] });
    mockGetSettings.mockResolvedValue({
      settings: {
        budget_default_validity_days: 30,
        auto_approve_absences: false,
      },
    });

    mockListChairs.mockResolvedValue({
      chairs: [
        {
          id: "chair-1",
          name: "Sillón Quirúrgico A",
          room: "Sala 1",
          color_code: "#0D9488",
          equipment: "Motor de implantes, Rx intraoral",
          is_active: true,
        },
        {
          id: "chair-2",
          name: "Sillón Higiene B",
          room: "Sala 2",
          color_code: "#3B82F6",
          equipment: "Ultrasonidos, lámpara de blanqueamiento",
          is_active: true,
        },
      ],
    });

    mockListDoctors.mockResolvedValue({
      doctors: [
        { id: "doc-1", full_name: "Dra. Laura Ortiz", role: "DENTIST" },
      ],
    });

    mockListAssistants.mockResolvedValue({
      assistants: [
        { id: "ast-1", full_name: "Marta Auxiliar", role: "ASSISTANT" },
      ],
    });

    mockListUsers.mockResolvedValue({
      users: [
        { user_id: "doc-1", full_name: "Dra. Laura Ortiz", role: "DENTIST", email: "laura@clinica.com" },
        { user_id: "ast-1", full_name: "Marta Auxiliar", role: "ASSISTANT", email: "marta@clinica.com" },
      ],
    });

    mockListCabinets.mockResolvedValue({
      cabinets: [
        {
          id: "cab-1",
          name: "Box Cirugía",
          color_code: "#0D9488",
          equipment: "Turbina LED",
          chair_id: "chair-1",
          chair_name: "Sillón Quirúrgico A",
          doctor_id: "doc-1",
          doctor_name: "Dra. Laura Ortiz",
          assistant_id: "ast-1",
          assistant_name: "Marta Auxiliar",
          is_active: true,
        },
      ],
    });

    mockListAbsences.mockResolvedValue({
      absences: [
        {
          id: "abs-1",
          user_id: "doc-1",
          user_name: "Dra. Laura Ortiz",
          user_role: "DENTIST",
          absence_type: "VACATION",
          start_date: "2026-08-01",
          end_date: "2026-08-15",
          notes: "Vacaciones de verano",
          status: "PENDING",
          auto_rescheduled_count: 0,
        },
        {
          id: "abs-2",
          user_id: "ast-1",
          user_name: "Marta Auxiliar",
          user_role: "ASSISTANT",
          absence_type: "SICK_LEAVE",
          start_date: "2026-06-10",
          end_date: "2026-06-12",
          notes: "Gripe",
          status: "APPROVED",
          auto_rescheduled_count: 0,
        },
      ],
    });
  });

  it("renders cabinets with medical team (Doctor, Assistant) and linked physical chair (Butaca)", async () => {
    renderWithClient(<ClinicAdminPage />);

    const cabTab = screen.getByRole("tab", { name: "Gabinetes" });
    fireEvent.click(cabTab);

    await waitFor(() => {
      expect(screen.getByText("Box Cirugía")).toBeInTheDocument();
    });

    expect(screen.getByText("🪑 Sillón Quirúrgico A")).toBeInTheDocument();
    expect(screen.getByText("Dr(a). Dra. Laura Ortiz")).toBeInTheDocument();
    expect(screen.getByText("Aux. Marta Auxiliar")).toBeInTheDocument();
  });

  it("allows creating a new cabinet with chair_id, doctor_id, assistant_id", async () => {
    mockCreateCabinet.mockResolvedValue({
      cabinet: { id: "cab-new", name: "Box 2" },
    });

    renderWithClient(<ClinicAdminPage />);

    const cabTab = screen.getByRole("tab", { name: "Gabinetes" });
    fireEvent.click(cabTab);

    await waitFor(() => {
      expect(screen.getByText("Box Cirugía")).toBeInTheDocument();
    });

    const newBtn = screen.getByRole("button", { name: /Nuevo gabinete/i });
    fireEvent.click(newBtn);

    const nameInput = screen.getByLabelText(/Nombre del gabinete/i);
    fireEvent.change(nameInput, { target: { value: "Box Odontopediatría" } });

    const chairSelect = screen.getByLabelText(/Butaca física/i);
    fireEvent.change(chairSelect, { target: { value: "chair-2" } });

    const docSelect = screen.getByLabelText(/Doctor asignado/i);
    fireEvent.change(docSelect, { target: { value: "doc-1" } });

    const astSelect = screen.getByLabelText(/Auxiliar asignado/i);
    fireEvent.change(astSelect, { target: { value: "ast-1" } });

    const saveBtn = screen.getByRole("button", { name: /Guardar gabinete/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockCreateCabinet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Box Odontopediatría",
          chair_id: "chair-2",
          doctor_id: "doc-1",
          assistant_id: "ast-1",
        }),
      );
    });
  });

  it("renders Butacas (Sillones) tab with chairs list, status and assigned cabinet", async () => {
    renderWithClient(<ClinicAdminPage />);

    const chairsTab = screen.getByRole("tab", { name: /Butacas/i });
    fireEvent.click(chairsTab);

    await waitFor(() => {
      expect(screen.getByText("Sillón Quirúrgico A")).toBeInTheDocument();
    });

    expect(screen.getByText("Sillón Higiene B")).toBeInTheDocument();
    expect(screen.getByText("Asignada a: Box Cirugía")).toBeInTheDocument();
    expect(screen.getByText("Libre (sin asignar)")).toBeInTheDocument();
  });

  it("allows creating a new dental chair (Butaca)", async () => {
    mockCreateChair.mockResolvedValue({
      chair: { id: "chair-3", name: "Sillón Estética 3", is_active: true },
    });

    renderWithClient(<ClinicAdminPage />);

    const chairsTab = screen.getByRole("tab", { name: /Butacas/i });
    fireEvent.click(chairsTab);

    await waitFor(() => {
      expect(screen.getByText("Sillón Quirúrgico A")).toBeInTheDocument();
    });

    const newChairBtn = screen.getByRole("button", { name: /Nueva butaca/i });
    fireEvent.click(newChairBtn);

    const nameInput = screen.getByLabelText(/Nombre de la butaca/i);
    fireEvent.change(nameInput, { target: { value: "Sillón Estética 3" } });

    const equipInput = screen.getByLabelText(/Equipamiento técnico instalado/i);
    fireEvent.change(equipInput, { target: { value: "Lámpara blanqueamiento LED" } });

    const saveBtn = screen.getByRole("button", { name: /Guardar butaca/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockCreateChair).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sillón Estética 3",
          equipment: "Lámpara blanqueamiento LED",
          is_active: true,
        }),
      );
    });
  });

  it("renders Vacaciones y Bajas tab and allows toggling auto_approve_absences", async () => {
    mockUpdateSettings.mockResolvedValue({
      settings: { auto_approve_absences: true },
    });

    renderWithClient(<ClinicAdminPage />);

    const absencesTab = screen.getByRole("tab", { name: /Vacaciones y Bajas/i });
    fireEvent.click(absencesTab);

    await waitFor(() => {
      expect(screen.getByText(/Aprobación automática de ausencias y vacaciones/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Desactivada")).toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: /Activar auto-aprobación/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          auto_approve_absences: true,
        }),
      );
    });
  });

  it("renders staff absences list and allows approving a pending absence", async () => {
    mockUpdateAbsenceStatus.mockResolvedValue({
      absence: {
        id: "abs-1",
        status: "APPROVED",
        auto_rescheduled_count: 3,
      },
    });

    renderWithClient(<ClinicAdminPage />);

    const absencesTab = screen.getByRole("tab", { name: /Vacaciones y Bajas/i });
    fireEvent.click(absencesTab);

    await waitFor(() => {
      expect(screen.getByText("Dra. Laura Ortiz")).toBeInTheDocument();
    });

    expect(screen.getByText("Marta Auxiliar")).toBeInTheDocument();
    expect(screen.getByText("Vacaciones de verano")).toBeInTheDocument();
    expect(screen.getByText("Reagendará citas al aprobar")).toBeInTheDocument();
    expect(screen.getByText("Sin reagendar (Auxiliar)")).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: /Aprobar/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockUpdateAbsenceStatus).toHaveBeenCalledWith("abs-1", "APPROVED");
    });
  });

  it("allows registering a new absence with doctor auto-reschedule warning", async () => {
    mockCreateAbsence.mockResolvedValue({
      absence: {
        id: "abs-new",
        user_id: "doc-1",
        status: "PENDING",
        auto_rescheduled_count: 0,
      },
    });

    renderWithClient(<ClinicAdminPage />);

    const absencesTab = screen.getByRole("tab", { name: /Vacaciones y Bajas/i });
    fireEvent.click(absencesTab);

    await waitFor(() => {
      expect(screen.getByText("Dra. Laura Ortiz")).toBeInTheDocument();
    });

    const newBtn = screen.getByRole("button", { name: /Registrar ausencia o baja/i });
    fireEvent.click(newBtn);

    expect(screen.getByText(/Reagendamiento automático para Doctores activado/i)).toBeInTheDocument();

    const startInput = screen.getByLabelText(/Fecha de inicio/i);
    const endInput = screen.getByLabelText(/Fecha de fin/i);
    fireEvent.change(startInput, { target: { value: "2026-09-01" } });
    fireEvent.change(endInput, { target: { value: "2026-09-10" } });

    const notesInput = screen.getByLabelText(/Motivo u observaciones/i);
    fireEvent.change(notesInput, { target: { value: "Congreso Odontológico" } });

    const submitBtn = screen.getByRole("button", { name: "Registrar ausencia" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAbsence).toHaveBeenCalledWith({
        user_id: "doc-1",
        absence_type: "VACATION",
        start_date: "2026-09-01",
        end_date: "2026-09-10",
        notes: "Congreso Odontológico",
      });
    });
  });
});
