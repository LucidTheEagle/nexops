// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Audit Trace Ledger
// Global view: all changes last 24h, paginated, filterable.
// Scoped view: rendered inside Drill-Down Drawer at CP-05.
// Access gated by getRoleConfig().auditAccess.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useMemo } from "react";
import { useGlobalAuditLog } from "@/lib/hooks/useAuditLog";
import { AuditEntry }        from "./AuditEntry";
import type { AuditLogEntry } from "@/types";

type TriggerFilter = AuditLogEntry["trigger_source"] | "all";
type EntityFilter  = string | "all";

export function AuditLedger() {
  const { data: entries, isLoading, isError, error } = useGlobalAuditLog();

  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>("all");
  const [entityFilter,  setEntityFilter]  = useState<EntityFilter>("all");

  // ── Derive unique entity types from data ──────────────────────────────────
  const entityTypes = useMemo(() => {
    if (!entries) return [];
    return Array.from(new Set(entries.map((e) => e.table_name))).sort();
  }, [entries]);

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      const matchTrigger = triggerFilter === "all" || e.trigger_source === triggerFilter;
      const matchEntity  = entityFilter  === "all" || e.table_name    === entityFilter;
      return matchTrigger && matchEntity;
    });
  }, [entries, triggerFilter, entityFilter]);

  const filterBtnStyle = (active: boolean) => ({
    fontFamily:    "var(--font-mono)" as const,
    fontSize:      "10px",
    padding:       "4px 10px",
    borderRadius:  "4px",
    border:        `1px solid ${active ? "var(--color-indigo)" : "var(--color-border)"}`,
    background:    active ? "rgba(99,102,241,0.15)" : "transparent",
    color:         active ? "var(--color-text-secondary)" : "var(--color-text-muted)",
    cursor:        "pointer" as const,
    transition:    "all 150ms ease",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <h2
          style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "16px",
            fontWeight:    700,
            color:         "var(--color-text-primary)",
            margin:        "0 0 4px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Audit Trace
        </h2>
        <p
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "10px",
            color:         "var(--color-text-muted)",
            margin:        "0 0 16px 0",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Last 24h · {filtered.length} entries
        </p>

        {/* Trigger source filters */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {(["all", "manual", "ai", "system"] as TriggerFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTriggerFilter(f)}
              style={filterBtnStyle(triggerFilter === f)}
            >
              {f === "all" ? "All Sources" : f}
            </button>
          ))}
        </div>

        {/* Entity type filters */}
        {entityTypes.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              onClick={() => setEntityFilter("all")}
              style={filterBtnStyle(entityFilter === "all")}
            >
              All Tables
            </button>
            {entityTypes.map((t) => (
              <button
                key={t}
                onClick={() => setEntityFilter(t)}
                style={filterBtnStyle(entityFilter === t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border)", margin: "0 20px" }} />

      {/* Entry list */}
      <div
        style={{
          flex:     1,
          overflowY: "auto",
          padding:  "0 20px",
        }}
      >
        {isLoading && (
          <div style={{ padding: "24px 0" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height:       "56px",
                  background:   "var(--color-raised)",
                  borderRadius: "6px",
                  marginBottom: "8px",
                  animation:    "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {isError && (
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "12px",
            color:      "var(--color-critical)",
            padding:    "24px 0",
          }}>
            {error?.message ?? "Failed to load audit log"}
          </p>
        )}

        {!isLoading && filtered.length === 0 && (
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "12px",
            color:      "var(--color-text-muted)",
            padding:    "24px 0",
          }}>
            No entries match the current filters.
          </p>
        )}

        {filtered.map((entry) => (
          <AuditEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}