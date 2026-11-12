import { create } from "zustand";
import type { ToothSurfaceStatus } from "@dentistes/ui";

export type AgendaViewMode = "day" | "week" | "month";

interface UiState {
  agendaView: AgendaViewMode;
  setAgendaView: (view: AgendaViewMode) => void;
  odontogramTool: ToothSurfaceStatus;
  setOdontogramTool: (tool: ToothSurfaceStatus) => void;
  odontogramDentition: "adult" | "child";
  setOdontogramDentition: (dentition: "adult" | "child") => void;
}

export const useUiStore = create<UiState>((set) => ({
  agendaView: "day",
  setAgendaView: (agendaView) => set({ agendaView }),
  odontogramTool: "caries",
  setOdontogramTool: (odontogramTool) => set({ odontogramTool }),
  odontogramDentition: "adult",
  setOdontogramDentition: (odontogramDentition) => set({ odontogramDentition }),
}));
