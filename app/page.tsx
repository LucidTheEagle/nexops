// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ActionQueue }     from "@/components/action-queue/ActionQueue";
import { SyncDot }         from "@/components/ui/SyncDot";
import { Toast } from "@/components/ui/Toast";
import { AuditLedger }     from "@/components/audit/AuditLedger";
import { DrillDownDrawer } from "@/components/drill-down/DrillDownDrawer";
import { CommandPalette }  from "@/components/ui/CommandPalette";
import { RoleToggle }      from "@/components/ui/RoleToggle";
import { KPIDashboard }    from "@/components/kpi/KPIDashboard";
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

  // Lock body scroll when audit sidebar is open
  useEffect(() => {
    if (auditOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [auditOpen]);

  return (
    <div
      className="min-h-screen flex flex-col pb-safe"
      style={{ background: "var(--color-surface)" }}
    >
      {/* ── Top Bar ── */}
      <header
        className="
          flex items-center justify-between
          px-4 md:px-6 py-3
          sticky top-0 z-50 shrink-0
          pt-safe
        "
        style={{
          borderBottom: "1px solid var(--color-border)",
          background:   "var(--color-raised)",
        }}
      >
        {/* Logo */}
        <span
          className="shrink-0 text-[18px] md:text-[20px] font-extrabold tracking-[-0.03em]"
          style={{
            fontFamily: "var(--font-display)",
            color:      "var(--color-violet)",
          }}
        >
          NexOps
        </span>

        {/* Center — Role Toggle */}
        <RoleToggle />

        {/* Right — Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {canViewGlobalAudit && (
            <button
              onClick={() => setAuditOpen((o) => !o)}
              className="
                min-h-[44px] px-2 md:px-3 rounded-md
                text-[10px] font-semibold uppercase tracking-widest
                transition-all duration-150 ease-out
              "
              style={{
                fontFamily: "var(--font-mono)",
                color:      auditOpen ? "var(--color-text-secondary)" : "var(--color-text-muted)",
                background: auditOpen ? "rgba(99,102,241,0.15)" : "transparent",
                border:     `1px solid ${auditOpen ? "var(--color-indigo)" : "var(--color-border)"}`,
                cursor:     "pointer",
              }}
            >
              {/* Abbreviated on mobile */}
              <span className="hidden sm:inline">Audit Trace</span>
              <span className="sm:hidden">Audit</span>
            </button>
          )}
          {isModuleVisible(activeRole, "sync_status") && <SyncDot />}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Main scroll column ── */}
        <main
          className="flex-1 overflow-y-auto py-6 md:py-8 px-4 md:px-6"
          style={{
            maxWidth: auditOpen ? "100%" : "720px",
            margin:   auditOpen ? "0" : "0 auto",
          }}
        >
          {/* CEO View */}
          {isCEO && (
            <div className="mb-8">
              <div className="mb-5">
                <h1
                  className="text-[18px] md:text-[22px] font-bold tracking-[-0.02em] m-0"
                  style={{
                    fontFamily: "var(--font-display)",
                    color:      "var(--color-text-primary)",
                  }}
                >
                  Operations Overview
                </h1>
                <p
                  className="text-[10px] md:text-[11px] uppercase tracking-widest mt-1"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color:      "var(--color-text-muted)",
                  }}
                >
                  KPI Dashboard — Live
                </p>
              </div>
              <KPIDashboard />
            </div>
          )}

          {/* Action Queue header */}
          <div className="mb-5">
            <h2
              className="font-bold tracking-[-0.02em] m-0"
              style={{
                fontFamily: "var(--font-display)",
                fontSize:   isCEO ? "16px" : "20px",
                color:      "var(--color-text-primary)",
              }}
            >
              {isCEO ? "Critical Escalations" : "Action Queue"}
            </h2>
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-widest mt-1"
              style={{
                fontFamily: "var(--font-mono)",
                color:      "var(--color-text-muted)",
              }}
            >
              {isCEO
                ? "Critical Only"
                : `Priority Inbox — ${roleConfig.anomalySeverityFilter.join(" · ")}`}
            </p>
          </div>

          {isModuleVisible(activeRole, "action_queue") && <ActionQueue />}
          {isModuleVisible(activeRole, "action_queue_condensed") && <ActionQueue />}
        </main>

        {/* ── Audit backdrop ── */}
        {auditOpen && (
          <div
            className="absolute inset-0 z-10"
            aria-hidden="true"
            onClick={() => setAuditOpen(false)}
            style={{ background: "rgba(15,10,30,0.4)" }}
          />
        )}

        {/* ── Audit Sidebar
              Desktop (md+): 380px panel on right edge
              Mobile (<md):  full width overlay
        ── */}
        {auditOpen && (
          <aside
            className="
              absolute top-0 right-0 bottom-0 z-20
              w-full md:w-[380px]
              overflow-y-auto flex flex-col
              pb-safe
            "
            style={{
              borderLeft: "1px solid var(--color-border)",
              background: "var(--color-raised)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AuditLedger />
          </aside>
        )}
      </div>

      <DrillDownDrawer />
      <CommandPalette />
      <Toast />
    </div>
  );
}