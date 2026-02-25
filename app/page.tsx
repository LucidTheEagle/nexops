// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Command Center Home
// CP-04.1: Audit Trace Ledger wired. Layout: Action Queue + Audit sidebar.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState }        from "react";
import { ActionQueue }     from "@/components/action-queue/ActionQueue";
import { SyncDot }         from "@/components/ui/SyncDot";
import { AuditLedger }     from "@/components/audit/AuditLedger";
import { useAppStore }     from "@/lib/stores/app.store";
import { getRoleConfig, isModuleVisible } from "@/lib/config/roles";

export default function Home() {
  const activeRole = useAppStore((s) => s.activeRole);
  const roleConfig = getRoleConfig(activeRole);
  const [auditOpen, setAuditOpen] = useState(false);

  const canViewGlobalAudit = roleConfig.auditAccess === "global" ||
                             roleConfig.auditAccess === "read_only";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface)", display: "flex", flexDirection: "column" }}>

      {/* Top Bar */}
      <header
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "16px 24px",
          borderBottom:   "1px solid var(--color-border)",
          background:     "var(--color-raised)",
          position:       "sticky",
          top:            0,
          zIndex:         50,
        }}
      >
        <span
          style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "20px",
            fontWeight:    800,
            color:         "var(--color-violet)",
            letterSpacing: "-0.03em",
          }}
        >
          NexOps
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "10px",
              color:         "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {roleConfig.label}
          </span>

          {/* Audit Ledger toggle */}
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
                transition:    "all 150ms ease",
              }}
            >
              Audit Trace
            </button>
          )}

          {isModuleVisible(activeRole, "sync_status") && <SyncDot />}
        </div>
      </header>

      {/* Body — Action Queue + Audit Sidebar */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Action Queue */}
        <main
          style={{
            flex:      1,
            overflowY: "auto",
            padding:   "32px 24px",
            maxWidth:  auditOpen ? "100%" : "720px",
            margin:    auditOpen ? "0" : "0 auto",
            transition: "all 200ms ease",
          }}
        >
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
              Action Queue
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
              Priority Inbox — {roleConfig.anomalySeverityFilter.join(" · ")}
            </p>
          </div>

          {isModuleVisible(activeRole, "action_queue") && <ActionQueue />}
        </main>

        {/* Audit Ledger Sidebar */}
        {auditOpen && (
          <aside
            style={{
              width:       "380px",
              minWidth:    "380px",
              borderLeft:  "1px solid var(--color-border)",
              background:  "var(--color-raised)",
              overflowY:   "auto",
              display:     "flex",
              flexDirection: "column",
            }}
          >
            <AuditLedger />
          </aside>
        )}
      </div>
    </div>
  );
}