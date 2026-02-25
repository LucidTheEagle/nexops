// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Command Center Home
// CP-05.1: Role toggle wired. Ghost UI switches between WM and CEO views.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState }        from "react";
import { ActionQueue }     from "@/components/action-queue/ActionQueue";
import { SyncDot }         from "@/components/ui/SyncDot";
import { AuditLedger }     from "@/components/audit/AuditLedger";
import { CommandPalette }  from "@/components/ui/CommandPalette";
import { RoleToggle }      from "@/components/ui/RoleToggle";
import { useAppStore }     from "@/lib/stores/app.store";
import { getRoleConfig, isModuleVisible } from "@/lib/config/roles";

export default function Home() {
  const activeRole = useAppStore((s) => s.activeRole);
  const roleConfig = getRoleConfig(activeRole);
  const [auditOpen, setAuditOpen] = useState(false);

  const canViewGlobalAudit =
    roleConfig.auditAccess === "global" ||
    roleConfig.auditAccess === "read_only";

  const isCEO = activeRole === "ceo";

  return (
    <div
      style={{
        minHeight:     "100vh",
        background:    "var(--color-surface)",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top Bar ── */}
      <header
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "12px 24px",
          borderBottom:   "1px solid var(--color-border)",
          background:     "var(--color-raised)",
          position:       "sticky",
          top:            0,
          zIndex:         50,
          gap:            "16px",
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "20px",
            fontWeight:    800,
            color:         "var(--color-violet)",
            letterSpacing: "-0.03em",
            flexShrink:    0,
          }}
        >
          NexOps
        </span>

        {/* Center — Role Toggle */}
        <RoleToggle />

        {/* Right — Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {canViewGlobalAudit && (
            <button
              onClick={() => setAuditOpen((o) => !o)}
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "10px",
                color:         auditOpen ? "var(--color-text-secondary)" : "var(--color-text-muted)",
                background:    auditOpen ? "rgba(99,102,241,0.15)" : "transparent",
                border:        `1px solid ${auditOpen ? "var(--color-indigo)" : "var(--color-border)"}`,
                borderRadius:  "6px",
                padding:       "6px 12px",
                cursor:        "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight:    600,
                transition:    "all 150ms ease",
              }}
            >
              Audit Trace
            </button>
          )}

          {isModuleVisible(activeRole, "sync_status") && <SyncDot />}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Main content */}
        <main
          style={{
            flex:       1,
            overflowY:  "auto",
            padding:    "32px 24px",
            maxWidth:   auditOpen ? "100%" : "720px",
            margin:     auditOpen ? "0" : "0 auto",
            transition: "all 200ms ease",
          }}
        >
          {/* ── CEO View ── */}
          {isCEO && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ marginBottom: "20px" }}>
                <h1
                  style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "22px",
                    fontWeight:    700,
                    color:         "var(--color-text-primary)",
                    letterSpacing: "-0.02em",
                    margin:        0,
                  }}
                >
                  Operations Overview
                </h1>
                <p
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "11px",
                    color:         "var(--color-text-muted)",
                    marginTop:     "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  KPI Dashboard — Live
                </p>
              </div>

              {/* KPI placeholder — built at CP-06 */}
              <div
                style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap:                 "12px",
                  marginBottom:        "32px",
                }}
              >
                {[
                  { label: "OTIF Rate",        value: "—", unit: "%"  },
                  { label: "Avg Cost-to-Serve", value: "—", unit: "$"  },
                  { label: "Carbon / Shipment", value: "—", unit: "kg" },
                  { label: "On-Time %",         value: "—", unit: "%"  },
                ].map(({ label, value, unit }) => (
                  <div
                    key={label}
                    style={{
                      background:   "var(--color-raised)",
                      border:       "1px solid var(--color-border)",
                      borderRadius: "10px",
                      padding:      "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily:    "var(--font-mono)",
                        fontSize:      "10px",
                        color:         "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        margin:        "0 0 8px 0",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize:   "28px",
                        fontWeight: 700,
                        color:      "var(--color-text-primary)",
                        margin:     0,
                      }}
                    >
                      {value}
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize:   "12px",
                          color:      "var(--color-text-muted)",
                          marginLeft: "4px",
                        }}
                      >
                        {unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Action Queue — both roles, filtered by severity ── */}
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontFamily:    "var(--font-display)",
                fontSize:      isCEO ? "16px" : "22px",
                fontWeight:    700,
                color:         "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                margin:        0,
              }}
            >
              {isCEO ? "Critical Escalations" : "Action Queue"}
            </h2>
            <p
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "11px",
                color:         "var(--color-text-muted)",
                marginTop:     "4px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {isCEO ? "Critical Only" : `Priority Inbox — ${roleConfig.anomalySeverityFilter.join(" · ")}`}
            </p>
          </div>

          {isModuleVisible(activeRole, "action_queue") && <ActionQueue />}
          {isModuleVisible(activeRole, "action_queue_condensed") && <ActionQueue />}
        </main>

        {/* ── Audit Sidebar ── */}
        {auditOpen && (
          <aside
            style={{
              width:         "380px",
              minWidth:      "380px",
              borderLeft:    "1px solid var(--color-border)",
              background:    "var(--color-raised)",
              overflowY:     "auto",
              display:       "flex",
              flexDirection: "column",
            }}
          >
            <AuditLedger />
          </aside>
        )}
      </div>

      <CommandPalette />
    </div>
  );
}