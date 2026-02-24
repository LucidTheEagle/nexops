// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Command Center Home
// CP-03: Action Queue live. Pipeline test harness retired.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { ActionQueue } from "@/components/action-queue/ActionQueue";
import { SyncDot }     from "@/components/ui/SyncDot";
import { useAppStore } from "@/lib/stores/app.store";
import { getRoleConfig } from "@/lib/config/roles";
import { isModuleVisible } from "@/lib/config/roles";

export default function Home() {
  const activeRole  = useAppStore((s) => s.activeRole);
  const roleConfig  = getRoleConfig(activeRole);

  return (
    <div
      style={{
        minHeight:  "100vh",
        background: "var(--color-surface)",
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          padding:         "16px 24px",
          borderBottom:    "1px solid var(--color-border)",
          background:      "var(--color-raised)",
          position:        "sticky",
          top:             0,
          zIndex:          50,
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
          }}
        >
          NexOps
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Role label */}
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

          {/* Sync dot — warehouse manager only */}
          {isModuleVisible(activeRole, "sync_status") && <SyncDot />}
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Action Queue header */}
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
              fontFamily: "var(--font-mono)",
              fontSize:   "11px",
              color:      "var(--color-text-muted)",
              marginTop:  "4px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Priority Inbox — {roleConfig.anomalySeverityFilter.join(" · ")}
          </p>
        </div>

        {/* Action Queue feed */}
        {isModuleVisible(activeRole, "action_queue") && <ActionQueue />}

      </main>
    </div>
  );
}