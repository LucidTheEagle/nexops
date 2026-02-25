// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Command Palette
// Keyboard-first global navigation. Triggered by Cmd+K / Ctrl+K.
// Items driven by getRoleConfig().commandPaletteItems — zero hardcoding.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useCallback } from "react";
import { Command }                from "cmdk";
import { useAppStore }            from "@/lib/stores/app.store";
import { getRoleConfig }          from "@/lib/config/roles";

// Route map — command label to path
const COMMAND_ROUTES: Record<string, string> = {
  "Shipments":     "/shipments",
  "Drivers":       "/drivers",
  "Active Routes": "/routes",
  "Invoices":      "/invoices",
  "Reports":       "/reports",
  "KPIs":          "/kpis",
  "Team":          "/team",
  "Clients":       "/clients",
  "Settings":      "/settings",
  "My Route":      "/my-route",
  "Support":       "/support",
};

const COMMAND_ICONS: Record<string, string> = {
  "Shipments":     "📦",
  "Drivers":       "🚛",
  "Active Routes": "🗺️",
  "Invoices":      "🧾",
  "Reports":       "📊",
  "KPIs":          "📈",
  "Team":          "👥",
  "Clients":       "🏢",
  "Settings":      "⚙️",
  "My Route":      "📍",
  "Support":       "💬",
};

export function CommandPalette() {
  const open                = useAppStore((s) => s.commandPaletteOpen);
  const setOpen             = useAppStore((s) => s.setCommandPaletteOpen);
  const activeRole          = useAppStore((s) => s.activeRole);
  const roleConfig          = getRoleConfig(activeRole);

  // ── Keyboard listener ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(true);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, [setOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(15,10,30,0.8)", backdropFilter: "blur(4px)" }}
      />

      {/* Palette */}
      <div
        className="fixed left-1/2 z-50"
        style={{
          top:       "20%",
          transform: "translateX(-50%)",
          width:     "min(560px, 90vw)",
        }}
      >
        <Command
          className="w-full"
          style={{
            background:   "var(--color-overlay)",
            border:       "1px solid var(--color-indigo)",
            borderRadius: "12px",
            overflow:     "hidden",
            boxShadow:    "0 24px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Search input */}
          <div
            style={{
              display:     "flex",
              alignItems:  "center",
              gap:         "10px",
              padding:     "14px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>⌘</span>
            <Command.Input
              autoFocus
              placeholder="Type a command or search..."
              style={{
                flex:       1,
                background: "transparent",
                border:     "none",
                outline:    "none",
                fontFamily: "var(--font-mono)",
                fontSize:   "13px",
                color:      "var(--color-text-primary)",
              }}
            />
            <kbd
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "10px",
                color:         "var(--color-text-muted)",
                background:    "var(--color-raised)",
                border:        "1px solid var(--color-border)",
                borderRadius:  "4px",
                padding:       "2px 6px",
              }}
            >
              ESC
            </kbd>
          </div>

          <Command.List style={{ maxHeight: "320px", overflowY: "auto", padding: "8px" }}>
            <Command.Empty
              style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "12px",
                color:      "var(--color-text-muted)",
                padding:    "16px",
                textAlign:  "center",
              }}
            >
              No results found.
            </Command.Empty>

            {/* Role-specific navigation items */}
            <Command.Group
              heading={
                <span
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "9px",
                    color:         "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding:       "4px 8px",
                    display:       "block",
                  }}
                >
                  Navigate — {roleConfig.label}
                </span>
              }
            >
              {roleConfig.commandPaletteItems.map((item) => (
                <Command.Item
                  key={item}
                  value={item}
                  onSelect={() => {
                    console.log(`[CommandPalette] Navigate to: ${COMMAND_ROUTES[item] ?? "/"}`);
                    setOpen(false);
                  }}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "10px",
                    padding:      "10px 8px",
                    borderRadius: "6px",
                    cursor:       "pointer",
                    fontFamily:   "var(--font-sans)",
                    fontSize:     "13px",
                    color:        "var(--color-text-primary)",
                  }}
                  className="command-item"
                >
                  <span style={{ fontSize: "14px", width: "20px", textAlign: "center" }}>
                    {COMMAND_ICONS[item] ?? "→"}
                  </span>
                  <span style={{ flex: 1 }}>{item}</span>
                  <span
                    style={{
                      fontFamily:    "var(--font-mono)",
                      fontSize:      "10px",
                      color:         "var(--color-text-muted)",
                      background:    "var(--color-raised)",
                      border:        "1px solid var(--color-border)",
                      borderRadius:  "4px",
                      padding:       "2px 6px",
                    }}
                  >
                    ↵
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "12px",
              padding:      "8px 16px",
              borderTop:    "1px solid var(--color-border)",
            }}
          >
            {[
              { key: "↑↓", label: "Navigate" },
              { key: "↵",  label: "Select"   },
              { key: "Esc", label: "Close"   },
            ].map(({ key, label }) => (
              <span
                key={key}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize:   "10px",
                  color:      "var(--color-text-muted)",
                  display:    "flex",
                  alignItems: "center",
                  gap:        "4px",
                }}
              >
                <kbd
                  style={{
                    background:   "var(--color-raised)",
                    border:       "1px solid var(--color-border)",
                    borderRadius: "3px",
                    padding:      "1px 5px",
                    fontSize:     "10px",
                  }}
                >
                  {key}
                </kbd>
                {label}
              </span>
            ))}
          </div>
        </Command>
      </div>
    </>
  );
}