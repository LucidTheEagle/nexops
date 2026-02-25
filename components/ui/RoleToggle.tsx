// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Role Toggle
// Demo mechanism: switches Ghost UI between Warehouse Manager and CEO.
// Reads/writes activeRole in Zustand — zero page reload.
// Only renders MVP_DEMO_ROLES — never exposes finance or driver in demo.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useAppStore }                from "@/lib/stores/app.store";
import { getRoleLabel, MVP_DEMO_ROLES } from "@/lib/config/roles";

export function RoleToggle() {
  const activeRole  = useAppStore((s) => s.activeRole);
  const setRole     = useAppStore((s) => s.setActiveRole);

  return (
    <div
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "2px",
        background:   "var(--color-surface)",
        border:       "1px solid var(--color-border)",
        borderRadius: "8px",
        padding:      "3px",
      }}
    >
      {MVP_DEMO_ROLES.map((role) => {
        const isActive = activeRole === role;
        return (
          <button
            key={role}
            onClick={() => setRole(role)}
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "10px",
              fontWeight:    isActive ? 700 : 400,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding:       "5px 12px",
              borderRadius:  "6px",
              border:        "none",
              cursor:        isActive ? "default" : "pointer",
              background:    isActive ? "var(--color-violet)" : "transparent",
              color:         isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              transition:    "all 150ms ease",
            }}
          >
            {getRoleLabel(role)}
          </button>
        );
      })}
    </div>
  );
}