"use client";

import { useAppStore }                  from "@/lib/stores/app.store";
import { getRoleLabel, MVP_DEMO_ROLES } from "@/lib/config/roles";

export function RoleToggle() {
  const activeRole = useAppStore((s) => s.activeRole);
  const setRole    = useAppStore((s) => s.setActiveRole);

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-[3px]"
      role="group"
      aria-label="Switch active role"
      style={{
        background: "var(--color-surface)",
        border:     "1px solid var(--color-border)",
      }}
    >
      {MVP_DEMO_ROLES.map((role) => {
        const isActive = activeRole === role;
        return (
          <button
            key={role}
            onClick={() => setRole(role)}
            aria-pressed={isActive}
            aria-label={`Switch to ${getRoleLabel(role)}`}
            disabled={isActive}
            // min 44px height — warehouse touch standard
            className="min-h-[44px] min-w-[44px] px-3 rounded-md text-[10px] font-mono tracking-widest uppercase transition-all duration-150 ease-out disabled:cursor-default"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: isActive ? 700 : 400,
              background: isActive ? "var(--color-violet)" : "transparent",
              color:      isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border:     "none",
              cursor:     isActive ? "default" : "pointer",
            }}
          >
            {getRoleLabel(role)}
          </button>
        );
      })}
    </div>
  );
}