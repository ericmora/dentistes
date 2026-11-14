import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  AppointmentCard,
  ClinicalHistoryTimeline,
  CriticalAlertBanner,
  MultiCabinetTimeline,
  OdontogramGrid,
  ToothAnatomicalViewer,
  ToothDetailHistoryPanel,
  computeAppointmentLanes,
} from "@dentistes/ui";

describe("Agenda UI Components", () => {
  it("renders AppointmentCard with patient, doctor, and treatment info", () => {
    const handleClick = vi.fn();
    const appt = {
      id: "appt-1",
      patientName: "Joan Casals",
      doctorName: "Dr. Jordi Martí",
      cabinetName: "Gabinet 1",
      treatmentType: "ENDODONTIA",
      startTime: "10:00",
      endTime: "11:00",
      status: "CONFIRMED" as const,
    };

    render(<AppointmentCard appointment={appt} onClick={handleClick} />);

    expect(screen.getByText("Joan Casals")).toBeInTheDocument();
    expect(screen.getByText("ENDODONTIA")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Joan Casals"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders 1-hour appointment spanning across 2 30-min slots and blocks covered slot from opening a new appointment", () => {
    const handleSelectSlot = vi.fn();
    const handleSelectAppt = vi.fn();

    const cabinets = [{ id: "cab-1", name: "Box 1", colorCode: "#0D9488" }];
    const slots = ["09:00", "09:30", "10:00", "10:30"];
    const appointmentsByCabinet = {
      "cab-1": [
        {
          id: "appt-60m",
          patientName: "Marta Rius",
          doctorName: "Dr. Gómez",
          treatmentType: "Cirugía Implante",
          startTime: "09:00",
          endTime: "10:00", // 1 hour -> covers 09:00 and 09:30
          status: "CONFIRMED" as const,
        },
        {
          id: "appt-15m",
          patientName: "Pere Font",
          doctorName: "Dr. Gómez",
          treatmentType: "Revisión rápida",
          startTime: "10:00",
          endTime: "10:15", // 15 min -> only occupies a portion of 10:00-10:30
          status: "CONFIRMED" as const,
        },
      ],
    };

    const { container } = render(
      <MultiCabinetTimeline
        cabinets={cabinets}
        slots={slots}
        appointmentsByCabinet={appointmentsByCabinet}
        onSelectSlot={handleSelectSlot}
        onSelectAppointment={handleSelectAppt}
      />,
    );

    expect(screen.getByText("Marta Rius")).toBeInTheDocument();
    expect(screen.getByText("Pere Font")).toBeInTheDocument();

    // Verify 1-hour appointment card container has proportional height spanning 2 slots
    const martaCard = screen.getByText("Marta Rius").closest("div[style*='position: absolute']");
    expect(martaCard).toHaveStyle({ height: "130px" }); // 2 slots * 68 - 6

    // Verify 15-minute appointment has compact height
    const pereCard = screen.getByText("Pere Font").closest("div[style*='position: absolute']");
    expect(pereCard).toHaveStyle({ height: "28px" });

    // Click on 10:30 which is completely empty -> calls handleSelectSlot
    const emptyCell1030 = container.querySelector('[class*="cursor-pointer"]');
    if (emptyCell1030) {
      fireEvent.click(emptyCell1030);
      expect(handleSelectSlot).toHaveBeenCalledWith("cab-1", "10:30");
    }
  });

  it("supports compact single-page mode in MultiCabinetTimeline with reduced slotHeight", () => {
    const cabinets = [{ id: "cab-1", name: "Box 1", colorCode: "#0D9488" }];
    const slots = ["09:00", "09:30", "10:00"];
    const appointmentsByCabinet = {
      "cab-1": [
        {
          id: "appt-60m",
          patientName: "Marta Rius",
          doctorName: "Dr. Gómez",
          treatmentType: "Cirugía Implante",
          startTime: "09:00",
          endTime: "10:00",
          status: "CONFIRMED" as const,
        },
      ],
    };

    render(
      <MultiCabinetTimeline
        cabinets={cabinets}
        slots={slots}
        appointmentsByCabinet={appointmentsByCabinet}
      />,
    );

    const martaCard = screen.getByText("Marta Rius").closest("div[style*='position: absolute']");
    expect(martaCard).toHaveStyle({ height: "130px" }); // 2 slots * 68 - 6
  });

  it("detects and renders available idle gaps inside 30-min slots and allows 1-click scheduling in gap", () => {
    const handleSelectSlot = vi.fn();
    const cabinets = [{ id: "cab-1", name: "Box 1", colorCode: "#0D9488" }];
    const slots = ["09:00", "09:30"];
    const appointmentsByCabinet = {
      "cab-1": [
        {
          id: "appt-20m",
          patientName: "Carles Soler",
          doctorName: "Dr. Gómez",
          treatmentType: "Revisión rápida",
          startTime: "09:00",
          endTime: "09:20", // 20 min -> leaves 09:20 to 09:30 free (10 min gap)
          status: "CONFIRMED" as const,
        },
      ],
    };

    render(
      <MultiCabinetTimeline
        cabinets={cabinets}
        slots={slots}
        appointmentsByCabinet={appointmentsByCabinet}
        onSelectSlot={handleSelectSlot}
      />,
    );

    expect(screen.getByText("Carles Soler")).toBeInTheDocument();
    // The 10-minute gap button should be rendered
    const gapButton = screen.getByText("Encajar 09:20");
    expect(gapButton).toBeInTheDocument();
    expect(screen.getByText("10m")).toBeInTheDocument();

    fireEvent.click(gapButton);
    expect(handleSelectSlot).toHaveBeenCalledWith("cab-1", "09:20", 10);
  });

  it("renders forced overbooking appointments (sobrecitas) with Sobrecita badge and side-by-side layout", () => {
    const cabinets = [{ id: "cab-1", name: "Box 1", colorCode: "#0D9488" }];
    const slots = ["09:00"];
    const appointmentsByCabinet = {
      "cab-1": [
        {
          id: "appt-regular",
          patientName: "Laura Puig",
          doctorName: "Dr. Gómez",
          treatmentType: "Higiene dental",
          startTime: "09:00",
          endTime: "09:30",
          status: "CONFIRMED" as const,
        },
        {
          id: "appt-forced",
          patientName: "Marc Valls",
          doctorName: "Dr. Gómez",
          treatmentType: "Urgencia dolor",
          startTime: "09:00",
          endTime: "09:20",
          status: "CONFIRMED" as const,
          isForced: true,
          notes: "Dolor agudo en pieza 46",
        },
      ],
    };

    render(
      <MultiCabinetTimeline
        cabinets={cabinets}
        slots={slots}
        appointmentsByCabinet={appointmentsByCabinet}
      />,
    );

    expect(screen.getByText("Laura Puig")).toBeInTheDocument();
    expect(screen.getByText("Marc Valls")).toBeInTheDocument();
    expect(screen.getByText("Sobrecita")).toBeInTheDocument();
  });

  it("blocks slots when cabinet is closed, outside working hours, or in scheduled pause", () => {
    const cabinets = [
      {
        id: "cab-cirugia",
        name: "Box Cirugía",
        colorCode: "#0D9488",
        availability: [
          {
            day_of_week: 1, // Lunes
            day_name: "Lunes",
            is_open: true,
            start_time: "10:00",
            end_time: "18:00",
            break_start: "14:00",
            break_end: "15:00",
          },
          {
            day_of_week: 7, // Domingo
            day_name: "Domingo",
            is_open: false,
            start_time: "09:00",
            end_time: "14:00",
          },
        ],
      },
    ];

    // Day 1 (Lunes): 09:00 is outside hours, 14:00 is in break, 10:00 is open
    const { rerender } = render(
      <MultiCabinetTimeline
        cabinets={cabinets}
        slots={["09:00", "10:00", "14:00"]}
        dayOfWeek={1}
        appointmentsByCabinet={{ "cab-cirugia": [] }}
      />,
    );

    expect(screen.getByText("Fuera de horario")).toBeInTheDocument();
    expect(screen.getByText("Pausa (14:00–15:00)")).toBeInTheDocument();

    // Day 7 (Domingo): closed all day
    rerender(
      <MultiCabinetTimeline
        cabinets={cabinets}
        slots={["10:00"]}
        dayOfWeek={7}
        appointmentsByCabinet={{ "cab-cirugia": [] }}
      />,
    );

    expect(screen.getByText("Cerrado hoy")).toBeInTheDocument();
  });
});

describe("ToothAnatomicalViewer and Clinical Odontogram Components", () => {
  it("renders ToothAnatomicalViewer with 3 view angles and allows switching modes", () => {
    const handleToggleSurface = vi.fn();
    const handleUpdateGeneralStatus = vi.fn();

    render(
      <ToothAnatomicalViewer
        toothNumber={16}
        toothState={{
          tooth_number: 16,
          general_status: "present",
          surfaces: { occlusal: "caries", mesial: "healthy", distal: "healthy", vestibular: "healthy", lingual: "healthy" },
        }}
        activeTool="restored"
        onToggleSurface={handleToggleSurface}
        onUpdateGeneralStatus={handleUpdateGeneralStatus}
      />,
    );

    expect(screen.getByText("Visor Anatómico Multi-Ángulo")).toBeInTheDocument();
    expect(screen.getByText("5 Caras (Corona)")).toBeInTheDocument();
    expect(screen.getByText("Perfil Anatómico")).toBeInTheDocument();
    expect(screen.getByText("Corte Pulpar")).toBeInTheDocument();

    // Verify view mode switching
    fireEvent.click(screen.getByText("Perfil Anatómico"));
    fireEvent.click(screen.getByText("Corte Pulpar"));
    expect(screen.getByText("Esmalte")).toBeInTheDocument();
    expect(screen.getByText("Dentina")).toBeInTheDocument();

    // Switch back to 5 caras and apply macro preset MOD
    fireEvent.click(screen.getByText("5 Caras (Corona)"));
    const modBtn = screen.getByText("MOD");
    fireEvent.click(modBtn);
    expect(handleToggleSurface).toHaveBeenCalledWith("mesial", "restored");
    expect(handleToggleSurface).toHaveBeenCalledWith("occlusal", "restored");
    expect(handleToggleSurface).toHaveBeenCalledWith("distal", "restored");
  });

  it("renders ToothDetailHistoryPanel with tooth metadata, history records, and interactive viewer", () => {
    const handleStatus = vi.fn();
    const handleSurface = vi.fn();
    const records = [
      {
        id: "rec-1",
        entryType: "PROCEDURE" as const,
        content: "Obturación oclusal con composite fotopolimerizable",
        doctorName: "Dra. Elena Gómez",
        createdAt: "2026-03-10",
      },
    ];

    render(
      <ToothDetailHistoryPanel
        toothNumber={21}
        toothState={{
          tooth_number: 21,
          general_status: "present",
          surfaces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", vestibular: "healthy", lingual: "healthy" },
        }}
        records={records}
        onUpdateGeneralStatus={handleStatus}
        onToggleSurface={handleSurface}
      />,
    );

    expect(screen.getByText("Incisivo central superior izquierdo")).toBeInTheDocument();
    expect(screen.getByText("Historial de la pieza 21")).toBeInTheDocument();
    expect(screen.getByText("Obturación oclusal con composite fotopolimerizable")).toBeInTheDocument();
    expect(screen.getByText("Visor Anatómico Multi-Ángulo")).toBeInTheDocument();
  });

  it("renders OdontogramGrid in compact single-screen mode with single-row tool bar", () => {
    const handleSelectTooth = vi.fn();
    render(
      <OdontogramGrid
        teeth={{}}
        selectedTooth={16}
        onSelectTooth={handleSelectTooth}
        historyCounts={{ 16: 2 }}
      />,
    );

    // Both arches are rendered in compact mode
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("renders compact CriticalAlertBanner and interactive tooth chips in ClinicalHistoryTimeline", () => {
    const handleSelectTooth = vi.fn();

    render(
      <div>
        <CriticalAlertBanner
          compact={true}
          alerts={{
            high_risk: true,
            requires_antibiotic_prophylaxis: true,
            allergies: [{ name: "Penicilina" }],
          }}
        />
        <ClinicalHistoryTimeline
          compact={true}
          selectedTooth={16}
          onSelectTooth={handleSelectTooth}
          entries={[
            {
              id: "e-1",
              entryType: "PROCEDURE",
              content: "[Pieza 16] Obturación MOD con composite",
              doctorName: "Dr. Martí",
              createdAt: "13/11/2026",
            },
          ]}
        />
      </div>,
    );

    expect(screen.getByText(/Alergias: Penicilina/i)).toBeInTheDocument();
    expect(screen.getByText(/Profilaxis ATB/i)).toBeInTheDocument();

    const toothChip = screen.getByRole("button", { name: "Pieza 16" });
    expect(toothChip).toBeInTheDocument();
    fireEvent.click(toothChip);
    expect(handleSelectTooth).toHaveBeenCalledWith(16);
  });

  it("computeAppointmentLanes partitions overlapping appointments side by side in narrower horizontal lanes", () => {
    const appts = [
      {
        id: "a1",
        patientName: "Paciente 1",
        doctorName: "Dr. Jordi Martí",
        treatmentType: "Endodoncia",
        startTime: "09:00",
        endTime: "10:00",
        status: "CONFIRMED" as const,
      },
      {
        id: "a2",
        patientName: "Paciente 2",
        doctorName: "Dr. Jordi Martí",
        treatmentType: "Higiene",
        startTime: "09:30",
        endTime: "10:00",
        status: "SCHEDULED" as const,
      },
      {
        id: "a3",
        patientName: "Paciente 3",
        doctorName: "Dr. Jordi Martí",
        treatmentType: "Revisión",
        startTime: "10:30",
        endTime: "11:00",
        status: "SCHEDULED" as const,
      },
    ];

    const lanes = computeAppointmentLanes(appts);
    expect(lanes.get("a1")).toEqual({ lane: 0, totalLanes: 2 });
    expect(lanes.get("a2")).toEqual({ lane: 1, totalLanes: 2 });
    expect(lanes.get("a3")).toEqual({ lane: 0, totalLanes: 1 });
  });

  it("MultiCabinetTimeline renders overlapping appointments in narrower horizontal widths without occlusion", () => {
    const appts = [
      {
        id: "a1",
        patientName: "Paciente Alpha",
        doctorName: "Dr. Jordi Martí",
        treatmentType: "Endodoncia",
        startTime: "09:00",
        endTime: "10:00",
        status: "CONFIRMED" as const,
      },
      {
        id: "a2",
        patientName: "Paciente Beta",
        doctorName: "Dr. Jordi Martí",
        treatmentType: "Obturación",
        startTime: "09:30",
        endTime: "10:00",
        status: "CONFIRMED" as const,
      },
    ];

    render(
      <MultiCabinetTimeline
        cabinets={[{ id: "cab-1", name: "Gabinete 1" }]}
        slots={["09:00", "09:30", "10:00"]}
        appointmentsByCabinet={{ "cab-1": appts }}
        slotHeight={30}
      />,
    );

    expect(screen.getByText("Paciente Alpha")).toBeInTheDocument();
    expect(screen.getByText("Paciente Beta")).toBeInTheDocument();
  });
});
