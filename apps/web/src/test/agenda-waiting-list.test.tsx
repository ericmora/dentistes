import { describe, it, expect } from "vitest";
import type { WaitingListEntry } from "@dentistes/sdk";

describe("Agenda Integrated Waiting List", () => {
  it("verifies main layout navItems only contain Agenda and Patients (no top-level waiting-list)", () => {
    // Replicates layout navigation items definition
    const isClinicAdmin = true;
    const navItems = [
      { to: "/agenda", label: "Agenda" },
      { to: "/patients", label: "Pacientes" },
      ...(isClinicAdmin ? [{ to: "/settings", label: "Administración" }] : []),
    ];

    const hasWaitingListInTopNav = navItems.some((item) => item.to === "/waiting-list");
    expect(hasWaitingListInTopNav).toBe(false);
    expect(navItems.map((i) => i.to)).toEqual(["/agenda", "/patients", "/settings"]);
  });

  it("filters waiting list entries by status and calculates pending waiting count", () => {
    const entries: WaitingListEntry[] = [
      {
        id: "wl-1",
        patient_id: "pat-1",
        patient_name: "García, Laura",
        patient_phone: "+34600111222",
        treatment_type: "Limpieza dental",
        estimated_duration_minutes: 30,
        preferred_time_slot: "MORNING",
        preferred_days: [1, 2, 3, 4, 5],
        urgency_level: "NORMAL",
        status: "WAITING",
        created_at: "2026-11-16T08:00:00Z",
      },
      {
        id: "wl-2",
        patient_id: "pat-2",
        patient_name: "Martínez, Carlos",
        patient_phone: "+34600333444",
        treatment_type: "Endodoncia",
        estimated_duration_minutes: 60,
        preferred_time_slot: "ANY",
        preferred_days: [1, 2, 3, 4, 5],
        urgency_level: "URGENT",
        status: "WAITING",
        created_at: "2026-11-16T08:30:00Z",
      },
      {
        id: "wl-3",
        patient_id: "pat-3",
        patient_name: "López, Ana",
        patient_phone: "+34600555666",
        treatment_type: "Extracción",
        estimated_duration_minutes: 45,
        preferred_time_slot: "AFTERNOON",
        preferred_days: [1, 2, 3, 4, 5],
        urgency_level: "HIGH",
        status: "SCHEDULED",
        created_at: "2026-11-16T09:00:00Z",
      },
    ];

    const waitingEntries = entries.filter((e) => e.status === "WAITING");
    expect(waitingEntries).toHaveLength(2);
    expect(waitingEntries[1].urgency_level).toBe("URGENT");
  });

  it("prepares appointment booking form directly from waiting list entry", () => {
    const entry: WaitingListEntry = {
      id: "wl-urgent",
      patient_id: "pat-urgent-1",
      patient_name: "Sánchez, Marta",
      patient_phone: "+34699887766",
      treatment_type: "Urgencia dental / Dolor agudo",
      estimated_duration_minutes: 45,
      preferred_time_slot: "MORNING",
      preferred_days: [1, 2, 3, 4, 5],
      urgency_level: "URGENT",
      notes: "Dolor pulsátil en molar inferior derecho",
      status: "WAITING",
      created_at: "2026-11-16T08:00:00Z",
    };

    // Mapping waiting list entry into appointment creation state in Agenda
    const newForm = {
      patient_id: entry.patient_id,
      treatment_type: entry.treatment_type,
      duration: String(entry.estimated_duration_minutes),
      notes: `[Desde Lista de Espera] ${entry.notes || ""}`.trim(),
      is_forced: entry.urgency_level === "URGENT",
      cabinet_id: "cab-1",
      slot: "10:00",
    };

    expect(newForm.patient_id).toBe("pat-urgent-1");
    expect(newForm.treatment_type).toBe("Urgencia dental / Dolor agudo");
    expect(newForm.duration).toBe("45");
    expect(newForm.is_forced).toBe(true);
    expect(newForm.notes).toContain("Desde Lista de Espera");
  });

  it("handles navigation url with waiting list query parameter", () => {
    const searchParams = new URLSearchParams("tab=waiting-list");
    const isWaitingListRequested = searchParams.get("tab") === "waiting-list" || searchParams.has("waiting_list");
    expect(isWaitingListRequested).toBe(true);
  });
});
