import { create } from "zustand";
import {
  DEFAULT_CLINIC_BUDGET_SETTINGS,
  type ClinicBudgetSettingsUI,
  type OdontogramActiveTool,
} from "@dentistes/ui";

export type AgendaViewMode = "day" | "week" | "month";

const CLINIC_SETTINGS_STORAGE_KEY = "dentistes_clinic_budget_settings";

function loadStoredClinicBudgetSettings(): ClinicBudgetSettingsUI {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(CLINIC_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ClinicBudgetSettingsUI>;
        return { ...DEFAULT_CLINIC_BUDGET_SETTINGS, ...parsed };
      }
    }
  } catch {
    // Ignore storage errors
  }
  return { ...DEFAULT_CLINIC_BUDGET_SETTINGS };
}

interface UiState {
  agendaView: AgendaViewMode;
  setAgendaView: (view: AgendaViewMode) => void;
  odontogramTool: OdontogramActiveTool;
  setOdontogramTool: (tool: OdontogramActiveTool) => void;
  odontogramDentition: "adult" | "child";
  setOdontogramDentition: (dentition: "adult" | "child") => void;
  clinicBudgetSettings: ClinicBudgetSettingsUI;
  setClinicBudgetSettings: (settings: ClinicBudgetSettingsUI) => void;
}

export const useUiStore = create<UiState>((set) => ({
  agendaView: "day",
  setAgendaView: (agendaView) => set({ agendaView }),
  odontogramTool: "caries",
  setOdontogramTool: (odontogramTool) => set({ odontogramTool }),
  odontogramDentition: "adult",
  setOdontogramDentition: (odontogramDentition) => set({ odontogramDentition }),
  clinicBudgetSettings: loadStoredClinicBudgetSettings(),
  setClinicBudgetSettings: (clinicBudgetSettings) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          CLINIC_SETTINGS_STORAGE_KEY,
          JSON.stringify(clinicBudgetSettings),
        );
      }
    } catch {
      // Ignore storage errors
    }
    set({ clinicBudgetSettings });
  },
}));
