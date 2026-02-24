// ─────────────────────────────────────────────────────────────────────────────
// NexOps — App State Store
// Manages UI state: active role, drawer, selected anomaly.
// No server data here — that belongs to React Query.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { UserRole, Anomaly } from "@/types";

interface AppState {
  // ── Active Role ────────────────────────────────────────────────────────────
  activeRole:    UserRole;
  setActiveRole: (role: UserRole) => void;

  // ── Drill-Down Drawer ──────────────────────────────────────────────────────
  drawerOpen:      boolean;
  selectedAnomaly: Anomaly | null;
  openDrawer:      (anomaly: Anomaly) => void;
  closeDrawer:     () => void;

  // ── Command Palette ────────────────────────────────────────────────────────
  commandPaletteOpen:    boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // ── Active Role ──────────────────────────────────────────────────────
      activeRole:    "warehouse_manager",
      setActiveRole: (role) =>
        set({ activeRole: role }, false, "app/setActiveRole"),

      // ── Drill-Down Drawer ────────────────────────────────────────────────
      drawerOpen:      false,
      selectedAnomaly: null,
      openDrawer: (anomaly) =>
        set(
          { drawerOpen: true, selectedAnomaly: anomaly },
          false,
          "app/openDrawer"
        ),
      closeDrawer: () =>
        set(
          { drawerOpen: false, selectedAnomaly: null },
          false,
          "app/closeDrawer"
        ),

      // ── Command Palette ──────────────────────────────────────────────────
      commandPaletteOpen:    false,
      setCommandPaletteOpen: (open) =>
        set({ commandPaletteOpen: open }, false, "app/setCommandPaletteOpen"),
    }),
    { name: "NexOps/App" }
  )
);