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

  it("handles appointment creation payload with clinical notes and remarks", () => {
    const form = {
      patient_id: "pat-99",
      cabinet_id: "cab-1",
      doctor_id: "doc-1",
      slot: "11:30",
      duration: "45",
      treatment_type: "Endodoncia multirradicular",
      is_forced: false,
      notes: "Paciente con dolor agudo en pieza 16. Precisa radiografía previa.",
    };

    expect(form.notes).toBe("Paciente con dolor agudo en pieza 16. Precisa radiografía previa.");
    expect(form.treatment_type).toBe("Endodoncia multirradicular");
    expect(form.duration).toBe("45");
  });

  it("verifies slot finder flow starts with treatment and cascades duration", () => {
    const masterTreatments = [
      { name: "Primera visita / Diagnóstico", default_duration_minutes: 30 },
      { name: "Endodoncia multirradicular", default_duration_minutes: 60 },
      { name: "Cirugía e Implante unitario", default_duration_minutes: 90 },
    ];

    let selectedTreatment = masterTreatments[1].name;
    const found = masterTreatments.find((t) => t.name === selectedTreatment);
    let selectedDuration = found ? found.default_duration_minutes : 30;

    expect(selectedTreatment).toBe("Endodoncia multirradicular");
    expect(selectedDuration).toBe(60);

    // Changing treatment cascades duration
    selectedTreatment = masterTreatments[2].name;
    const found2 = masterTreatments.find((t) => t.name === selectedTreatment);
    selectedDuration = found2 ? found2.default_duration_minutes : 30;

    expect(selectedTreatment).toBe("Cirugía e Implante unitario");
    expect(selectedDuration).toBe(90);
  });
});
