import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgendaPage } from "../pages/Agenda";

const mockListCabinets = vi.fn();
const mockListDoctors = vi.fn();
const mockListAssistants = vi.fn();
const mockListAppointments = vi.fn();
const mockListPatients = vi.fn();
const mockListTreatments = vi.fn();
const mockListAbsences = vi.fn();
const mockCreateAppointment = vi.fn();
const mockUpdateAppointment = vi.fn();
const mockUpdateAppointmentStatus = vi.fn();
const mockListWaitingList = vi.fn();
const mockFindAvailableSlots = vi.fn();
const mockGetPatient = vi.fn();
const mockListPatientFindings = vi.fn();
const mockListPatientBudgets = vi.fn();

const mockSdk = {
  listCabinets: mockListCabinets,
  listDoctors: mockListDoctors,
  listAssistants: mockListAssistants,
  listAppointments: mockListAppointments,
  listPatients: mockListPatients,
  listTreatments: mockListTreatments,
  listAbsences: mockListAbsences,
  createAppointment: mockCreateAppointment,
  updateAppointment: mockUpdateAppointment,
  updateAppointmentStatus: mockUpdateAppointmentStatus,
  listWaitingList: mockListWaitingList,
  findAvailableSlots: mockFindAvailableSlots,
  getPatient: mockGetPatient,
  listPatientFindings: mockListPatientFindings,
  listPatientBudgets: mockListPatientBudgets,
};

const mockMe = {
  user_id: "user-owner-1",
  email: "owner@clinica.com",
  full_name: "Dr. Joan Titular",
  role: "OWNER",
  permissions: ["appointments:read", "appointments:write"],
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

vi.mock("../lib/useAppointmentStream", () => ({
  useAppointmentStream: () => ({
    connected: true,
  }),
}));

function renderAgenda() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AgendaPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Agenda Cabinet Team & Resources (Un gabinet inclou doctor, auxiliar i butaca)", () => {
  const cabinetsData = [
    {
      id: "cab-1",
      name: "Box 1 (Cirurgia)",
      color_code: "#0D9488",
      chair_id: "chair-1",
      chair_name: "Sillón Quirúrgico A",
      doctor_id: "doc-1",
      doctor_name: "Dra. Laura Ortiz",
      assistant_id: "ast-1",
      assistant_name: "Marta Rius",
      is_active: true,
      availability: [],
    },
    {
      id: "cab-2",
      name: "Box 2 (Conservadora)",
      color_code: "#2563EB",
      chair_id: "chair-2",
      chair_name: "Sillón Dental B",
      doctor_id: "doc-2",
      doctor_name: "Dr. Carles Puig",
      assistant_id: "ast-2",
      assistant_name: "Jordi Prat",
      is_active: true,
      availability: [],
    },
    {
      id: "cab-no-doc",
      name: "Box 3 (Sense equip)",
      color_code: "#F59E0B",
      chair_id: "chair-3",
      chair_name: "Sillón Auxiliar C",
      doctor_id: null,
      doctor_name: "",
      assistant_id: null,
      assistant_name: "",
      is_active: true,
      availability: [],
    },
  ];

  const doctorsData = [
    { id: "doc-1", full_name: "Dra. Laura Ortiz", role: "DENTIST" },
    { id: "doc-2", full_name: "Dr. Carles Puig", role: "DENTIST" },
  ];

  const assistantsData = [
    { id: "ast-1", full_name: "Marta Rius", role: "ASSISTANT" },
    { id: "ast-2", full_name: "Jordi Prat", role: "ASSISTANT" },
  ];

  const patientsData = [
    { id: "pat-1", first_name: "Anna", last_name: "Martí", phone: "600123456" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockListCabinets.mockResolvedValue({ cabinets: cabinetsData });
    mockListDoctors.mockResolvedValue({ doctors: doctorsData });
    mockListAssistants.mockResolvedValue({ assistants: assistantsData });
    mockListPatients.mockResolvedValue({ patients: patientsData });
    mockListAppointments.mockResolvedValue({ appointments: [] });
    mockListTreatments.mockResolvedValue({ treatments: [] });
    mockListAbsences.mockResolvedValue({ absences: [] });
    mockListWaitingList.mockResolvedValue({ entries: [] });
  });

  it("displays cabinet's integrated team (chair, doctor, assistant) and removes independent doctor/assistant selects", async () => {
    renderAgenda();

    await waitFor(() => {
      expect(screen.getAllByText("Box 1 (Cirurgia)")[0]).toBeInTheDocument();
    });

    // Click "Nueva cita" button
    const newApptBtn = screen.getByRole("button", { name: /Nueva cita/i });
    fireEvent.click(newApptBtn);

    // Form opens
    await waitFor(() => {
      expect(screen.getByText(/Programar nueva cita/i)).toBeInTheDocument();
    });

    // Integrated cabinet team card should be visible with chair, doctor, and assistant
    expect(screen.getByText(/Recursos del Gabinete/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sillón Quirúrgico A/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Laura Ortiz/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Aux\. Marta Rius/i)[0]).toBeInTheDocument();

    // Verify there are NO independent select dropdowns for doctor or assistant
    expect(screen.queryByLabelText(/^Doctor asignado$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Auxiliar asignado$/i)).not.toBeInTheDocument();
  });

  it("automatically inherits the selected cabinet's doctor and assistant when creating an appointment", async () => {
    mockCreateAppointment.mockResolvedValue({
      appointment: { id: "appt-new", cabinet_id: "cab-1", doctor_id: "doc-1" },
    });

    renderAgenda();

    await waitFor(() => {
      expect(screen.getAllByText("Box 1 (Cirurgia)")[0]).toBeInTheDocument();
    });

    // Click "Nueva cita"
    fireEvent.click(screen.getByRole("button", { name: /Nueva cita/i }));

    await waitFor(() => {
      expect(screen.getByText(/Programar nueva cita/i)).toBeInTheDocument();
    });

    // Open combobox and select patient
    const comboboxBtn = screen.getByRole("button", { name: /Buscar paciente…/i });
    fireEvent.click(comboboxBtn);

    await waitFor(() => {
      expect(screen.getByText("Martí, Anna")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Martí, Anna"));

    // Submit appointment
    const submitBtn = screen.getByRole("button", { name: /Confirmar cita/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          cabinet_id: "cab-1",
          doctor_id: "doc-1",
          assistant_id: "ast-1",
          patient_id: "pat-1",
        }),
      );
    });
  });

  it("updates the integrated team when switching to another cabinet", async () => {
    mockCreateAppointment.mockResolvedValue({
      appointment: { id: "appt-new-2", cabinet_id: "cab-2", doctor_id: "doc-2" },
    });

    renderAgenda();

    await waitFor(() => {
      expect(screen.getAllByText("Box 1 (Cirurgia)")[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Nueva cita/i }));

    await waitFor(() => {
      expect(screen.getByText(/Programar nueva cita/i)).toBeInTheDocument();
    });

    // Switch cabinet to Box 2
    const cabSelect = screen.getByLabelText(/Gabinete dental/i);
    fireEvent.change(cabSelect, { target: { value: "cab-2" } });

    // Team card updates to Dr. Carles Puig and Jordi Prat
    await waitFor(() => {
      expect(screen.getAllByText(/Sillón Dental B/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Carles Puig/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Aux\. Jordi Prat/i)[0]).toBeInTheDocument();
    });

    // Open combobox and select patient
    const comboboxBtn = screen.getByRole("button", { name: /Buscar paciente…/i });
    fireEvent.click(comboboxBtn);

    await waitFor(() => {
      expect(screen.getByText("Martí, Anna")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Martí, Anna"));

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Confirmar cita/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          cabinet_id: "cab-2",
          doctor_id: "doc-2",
          assistant_id: "ast-2",
        }),
      );
    });
  });

  it("displays fallback doctor selector only if cabinet has no doctor configured in settings", async () => {
    renderAgenda();

    await waitFor(() => {
      expect(screen.getAllByText("Box 1 (Cirurgia)")[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Nueva cita/i }));

    await waitFor(() => {
      expect(screen.getByText(/Programar nueva cita/i)).toBeInTheDocument();
    });

    // Switch to Box 3 (which has no doctor assigned in settings)
    const cabSelect = screen.getByLabelText(/Gabinete dental/i);
    fireEvent.change(cabSelect, { target: { value: "cab-no-doc" } });

    await waitFor(() => {
      expect(screen.getByText(/Aquest gabinet no té cap doctor assignat/i)).toBeInTheDocument();
    });

    // Fallback selector is visible
    expect(screen.getByLabelText(/Assignar doctor per a aquesta cita/i)).toBeInTheDocument();
  });

  it("reassigns the target cabinet's doctor and assistant when moving an appointment to another cabinet", async () => {
    const existingAppt = {
      id: "appt-move-1",
      patient_id: "pat-1",
      patient_name: "Anna Martí",
      doctor_id: "doc-1",
      doctor_name: "Dra. Laura Ortiz",
      cabinet_id: "cab-1",
      cabinet_name: "Box 1 (Cirurgia)",
      treatment_type: "Revisió general",
      start_time: "2026-11-16T10:00:00.000Z",
      end_time: "2026-11-16T10:30:00.000Z",
      status: "CONFIRMED" as const,
      version: 1,
    };

    mockListAppointments.mockResolvedValue({
      appointments: [existingAppt],
    });

    mockUpdateAppointment.mockResolvedValue({
      appointment: { ...existingAppt, cabinet_id: "cab-2", doctor_id: "doc-2", assistant_id: "ast-2" },
    });

    renderAgenda();

    await waitFor(() => {
      expect(screen.getByText("Anna Martí")).toBeInTheDocument();
    });

    // Click appointment to open detail panel
    fireEvent.click(screen.getByText("Anna Martí"));

    await waitFor(() => {
      expect(screen.getByText(/Cambio rápido de hora o gabinete/i)).toBeInTheDocument();
    });

    // Change cabinet to Box 2
    const moveCabSelect = screen.getByLabelText(/Cambiar gabinete/i);
    fireEvent.change(moveCabSelect, { target: { value: "cab-2" } });

    await waitFor(() => {
      expect(mockUpdateAppointment).toHaveBeenCalledWith(
        "appt-move-1",
        expect.objectContaining({
          cabinet_id: "cab-2",
          doctor_id: "doc-2",
          assistant_id: "ast-2",
        }),
      );
    });
  });
});
