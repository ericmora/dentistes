import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AppointmentCard } from "@dentistes/ui";

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
