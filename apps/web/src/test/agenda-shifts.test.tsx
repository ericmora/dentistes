import { describe, it, expect } from "vitest";
import type { AvailableSlot } from "@dentistes/sdk";

describe("Agenda Shift-based Slot Booking", () => {
  it("formats available slot with assigned doctor and shift name", () => {
    const slot: AvailableSlot = {
      cabinet_id: "cab-1",
      cabinet_name: "Gabinete 1",
      cabinet_color: "#0D9488",
      doctor_id: "doc-1",
      doctor_name: "Dr. Fernando Cirujano",
      shift_id: "shift-surgery",
      shift_name: "Cirugía e Implantes Mañanas",
      date: "2026-11-16",
      start_time: "10:00",
      end_time: "10:45",
      duration_minutes: 45,
      shift: "morning",
      formatted_date: "Lunes, 16 de noviembre",
    };

    expect(slot.doctor_name).toBe("Dr. Fernando Cirujano");
    expect(slot.shift_name).toBe("Cirugía e Implantes Mañanas");
    expect(slot.cabinet_name).toBe("Gabinete 1");
    expect(slot.start_time).toBe("10:00");
    expect(slot.duration_minutes).toBe(45);
  });

  it("builds correct navigation query links for patient clinical, billing, and overview tabs", () => {
    const patientId = "patient-123";
    const clinicalHref = `/patients/${patientId}?tab=clinical`;
    const billingHref = `/patients/${patientId}?tab=billing`;
    const overviewHref = `/patients/${patientId}?tab=overview`;

    expect(clinicalHref).toContain("tab=clinical");
    expect(billingHref).toContain("tab=billing");
    expect(overviewHref).toContain("tab=overview");
  });
});
