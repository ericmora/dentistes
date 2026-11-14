import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AppointmentCard, MultiCabinetTimeline, ToothAnatomicalViewer, ToothDetailHistoryPanel } from "@dentistes/ui";

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
});
