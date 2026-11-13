import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AppointmentCard, ToothAnatomicalViewer, ToothDetailHistoryPanel } from "@dentistes/ui";

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
