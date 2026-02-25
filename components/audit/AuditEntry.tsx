// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Audit Entry
// Single row in the Audit Trace Ledger.
// All 5 fields from Flow Map 3 must render.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

interface AuditEntryProps {
  entry: AuditLogEntry;
}

const TRIGGER_SOURCE_LABEL: Record<AuditLogEntry["trigger_source"], string> = {
  manual: "Manual Override",
  ai:     "AI Detected",
  system: "System Rule",
};

const TRIGGER_SOURCE_COLOR: Record<AuditLogEntry["trigger_source"], string> = {
  manual: "var(--color-text-secondary)",
  ai:     "var(--color-indigo)",
  system: "var(--color-text-muted)",
};

export function AuditEntry({ entry }: AuditEntryProps) {
  return (
    <div
      style={{
        padding:      "12px 0",
        borderBottom: "1px solid var(--color-border)",
        display:      "flex",
        flexDirection: "column",
        gap:          "4px",
      }}
    >
      {/* Row 1 — What changed + from → to */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {/* Field 1: What changed */}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "11px",
            color:      "var(--color-text-primary)",
            fontWeight: 600,
          }}
        >
          {entry.record_label ?? entry.record_id.slice(0, 8)}
        </span>

        <span style={{ color: "var(--color-text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
          —
        </span>

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "10px",
            color:      "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {entry.field_changed}
        </span>

        {/* Field 2: From → To */}
        {entry.old_value && entry.new_value && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "10px",
                color:         "var(--color-critical)",
                background:    "rgba(244,63,94,0.1)",
                padding:       "1px 6px",
                borderRadius:  "3px",
                textTransform: "uppercase",
              }}
            >
              {entry.old_value}
            </span>
            <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>→</span>
            <span
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "10px",
                color:         "var(--color-live)",
                background:    "rgba(16,185,129,0.1)",
                padding:       "1px 6px",
                borderRadius:  "3px",
                textTransform: "uppercase",
              }}
            >
              {entry.new_value}
            </span>
          </div>
        )}
      </div>

      {/* Row 2 — Who + when + trigger */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Field 3: Who changed it */}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "10px",
              color:      "var(--color-text-secondary)",
            }}
          >
            {entry.changed_by_name ?? "System"}
          </span>

          {entry.role_at_time_of_change && (
            <span
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "9px",
                color:         "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              · {entry.role_at_time_of_change.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Field 4: When */}
        <span
          title={formatAbsoluteTime(entry.changed_at)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "10px",
            color:      "var(--color-text-muted)",
            cursor:     "default",
          }}
        >
          {formatRelativeTime(entry.changed_at)}
        </span>
      </div>

      {/* Field 5: Why / trigger source */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize:   "10px",
          color:      TRIGGER_SOURCE_COLOR[entry.trigger_source],
        }}
      >
        {TRIGGER_SOURCE_LABEL[entry.trigger_source]}
        {entry.trigger_detail && (
          <span style={{ color: "var(--color-text-muted)", marginLeft: "4px" }}>
            — {entry.trigger_detail}
          </span>
        )}
      </span>
    </div>
  );
}