// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Anomaly Card
// All 5 flow map fields render.
// Hover reveals action row: OPEN → INVESTIGATING → RESOLVED
// Each transition fires an audit log entry.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import {
  getSeverityClasses,
  getAnomalyStatusClasses,
  formatTimeDelta,
  formatRelativeTime,
} from "@/lib/utils";
import { useUpdateAnomalyStatus } from "@/lib/hooks/useAnomalies";
import { useInsertAuditEntry }    from "@/lib/hooks/useAuditLog";
import { useAppStore }            from "@/lib/stores/app.store";
import type { Anomaly, AnomalyStatus } from "@/types";

interface AnomalyCardProps {
  anomaly: Anomaly;
  onClick: (anomaly: Anomaly) => void;
}

const ANOMALY_TYPE_LABEL: Record<Anomaly["type"], string> = {
  SHIPMENT_DELAYED: "Shipment Delayed",
  DRIVER_OFFLINE:   "Driver Offline",
  INVOICE_OVERDUE:  "Invoice Overdue",
};

const TRIGGER_LABEL: Record<Anomaly["trigger_source"], string> = {
  AI:     "AI Detected",
  MANUAL: "Manual Flag",
  SYSTEM: "System Rule",
};

// Valid forward transitions only — no going backwards
const NEXT_TRANSITIONS: Partial<Record<AnomalyStatus, AnomalyStatus[]>> = {
  OPEN:          ["INVESTIGATING", "RESOLVED"],
  INVESTIGATING: ["RESOLVED"],
  RESOLVED:      [],
};

const TRANSITION_LABEL: Record<AnomalyStatus, string> = {
  OPEN:          "Open",
  INVESTIGATING: "Investigate",
  RESOLVED:      "Resolve",
};

export function AnomalyCard({ anomaly, onClick }: AnomalyCardProps) {
  const [hovered, setHovered]   = useState(false);
  const activeRole               = useAppStore((s) => s.activeRole);
  const severity                 = getSeverityClasses(anomaly.severity);
  const status                   = getAnomalyStatusClasses(anomaly.anomaly_status);
  const updateStatus             = useUpdateAnomalyStatus(activeRole);
  const insertAudit              = useInsertAuditEntry();

  const transitions = NEXT_TRANSITIONS[anomaly.anomaly_status] ?? [];

  function handleTransition(e: React.MouseEvent, nextStatus: AnomalyStatus) {
    // Stop click from bubbling to card onClick (which opens drawer)
    e.stopPropagation();

    const prevStatus = anomaly.anomaly_status;

    updateStatus.mutate({ id: anomaly.id, status: nextStatus });

    insertAudit.mutate({
      table_name:             "anomalies",
      record_id:              anomaly.id,
      record_label:           anomaly.entity_label,
      field_changed:          "anomaly_status",
      old_value:              prevStatus,
      new_value:              nextStatus,
      changed_by_user_id:     null,
      changed_by_name:        "Demo User",
      role_at_time_of_change: activeRole,
      trigger_source:         "manual",
      trigger_detail:         `Status transitioned from ${prevStatus} to ${nextStatus}`,
    });
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative" }}
    >
      <button
        onClick={() => onClick(anomaly)}
        className="w-full text-left"
        style={{
          border:       `1px solid ${hovered ? "var(--color-indigo)" : "var(--color-border)"}`,
          borderRadius: transitions.length > 0 && hovered ? "10px 10px 0 0" : "10px",
          padding:      "14px 16px",
          cursor:       "pointer",
          transition:   "border-color 150ms ease, background 150ms ease, border-radius 150ms ease",
          background:   hovered ? "var(--color-overlay)" : "var(--color-raised)",
          display:      "block",
          width:        "100%",
        }}
      >
        {/* Row 1 — Type label + severity badge + status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "10px",
                fontWeight:    700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:         "var(--color-text-muted)",
              }}
            >
              {ANOMALY_TYPE_LABEL[anomaly.type]}
            </span>

            <span
              className={`${severity.text} ${severity.bg} ${severity.border}`}
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "9px",
                fontWeight:    700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding:       "2px 6px",
                borderRadius:  "4px",
                border:        "1px solid",
              }}
            >
              {anomaly.severity}
            </span>
          </div>

          <span
            className={`${status.text} ${status.bg}`}
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "9px",
              fontWeight:    600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding:       "2px 8px",
              borderRadius:  "4px",
            }}
          >
            {anomaly.anomaly_status}
          </span>
        </div>

        {/* Row 2 — Entity label */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "14px",
            fontWeight: 500,
            color:      "var(--color-text-primary)",
            margin:     "0 0 8px 0",
            lineHeight: 1.4,
            textAlign:  "left",
          }}
        >
          {anomaly.entity_label}
        </p>

        {/* Row 3 — Time delta + trigger source */}
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "11px",
              color:      "var(--color-text-muted)",
            }}
          >
            {anomaly.time_delta_minutes !== null
              ? formatTimeDelta(anomaly.time_delta_minutes)
              : formatRelativeTime(anomaly.triggered_at)}
          </span>

          <span
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "10px",
              color:         "var(--color-text-muted)",
              letterSpacing: "0.05em",
            }}
          >
            {TRIGGER_LABEL[anomaly.trigger_source]}
          </span>
        </div>
      </button>

      {/* Action row — appears on hover if transitions available */}
      {hovered && transitions.length > 0 && (
        <div
          style={{
            display:       "flex",
            gap:           "1px",
            background:    "var(--color-border)",
            border:        "1px solid var(--color-indigo)",
            borderTop:     "none",
            borderRadius:  "0 0 10px 10px",
            overflow:      "hidden",
          }}
        >
          {transitions.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={(e) => handleTransition(e, nextStatus)}
              disabled={updateStatus.isPending}
              style={{
                flex:          1,
                padding:       "8px 12px",
                background:    "var(--color-overlay)",
                border:        "none",
                cursor:        updateStatus.isPending ? "not-allowed" : "pointer",
                fontFamily:    "var(--font-mono)",
                fontSize:      "10px",
                fontWeight:    600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:         nextStatus === "RESOLVED"
                  ? "var(--color-live)"
                  : "var(--color-text-secondary)",
                transition:    "background 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-muted-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-overlay)";
              }}
            >
              {TRANSITION_LABEL[nextStatus]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}