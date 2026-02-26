"use client";

import { useEffect, useCallback } from "react";
import { Command }                from "cmdk";
import { useAppStore }            from "@/lib/stores/app.store";
import { getRoleConfig }          from "@/lib/config/roles";

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
  const open       = useAppStore((s) => s.commandPaletteOpen);
  const setOpen    = useAppStore((s) => s.setCommandPaletteOpen);
  const activeRole = useAppStore((s) => s.activeRole);
  const roleConfig = getRoleConfig(activeRole);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(true);
    }
    if (e.key === "Escape") setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-50"
        aria-hidden="true"
        style={{ background: "rgba(15,10,30,0.8)", backdropFilter: "blur(4px)" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
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
          <div
            className="flex items-center gap-2.5 px-4 py-3.5 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>⌘</span>
            <Command.Input
              autoFocus
              placeholder="Type a command or search..."
              aria-label="Search commands"
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
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                fontFamily:  "var(--font-mono)",
                color:       "var(--color-text-muted)",
                background:  "var(--color-raised)",
                border:      "1px solid var(--color-border)",
              }}
            >
              ESC
            </kbd>
          </div>

          <Command.List
            className="overflow-y-auto p-2"
            style={{ maxHeight: "320px" }}
          >
            <Command.Empty
              className="text-center p-4"
              style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-muted)" }}
            >
              No results found.
            </Command.Empty>

            <Command.Group
              heading={
                <span
                  className="text-[9px] uppercase tracking-widest px-2 py-1 block"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
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
                  className="flex items-center gap-2.5 px-2 py-2.5 rounded-md cursor-pointer min-h-[44px] transition-colors duration-150 ease-out"
                  style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-text-primary)" }}
                >
                  <span className="text-sm w-5 text-center">{COMMAND_ICONS[item] ?? "→"}</span>
                  <span className="flex-1">{item}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      fontFamily:  "var(--font-mono)",
                      color:       "var(--color-text-muted)",
                      background:  "var(--color-raised)",
                      border:      "1px solid var(--color-border)",
                    }}
                  >
                    ↵
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div
            className="flex items-center gap-3 px-4 py-2 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            {[
              { key: "↑↓", label: "Navigate" },
              { key: "↵",  label: "Select"   },
              { key: "Esc", label: "Close"   },
            ].map(({ key, label }) => (
              <span
                key={key}
                className="flex items-center gap-1 text-[10px]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
              >
                <kbd
                  className="px-1 py-px rounded text-[10px]"
                  style={{
                    background: "var(--color-raised)",
                    border:     "1px solid var(--color-border)",
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