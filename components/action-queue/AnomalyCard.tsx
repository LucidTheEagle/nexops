// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Anomaly Card
// Single card in the Action Queue feed.
// All 5 data points from Flow Map 1 must render.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { getSeverityClasses, getAnomalyStatusClasses, formatTimeDelta, formatRelativeTime } from "@/lib/utils";
import type { Anomaly } from "@/types";

interface AnomalyCardProps {
  anomaly:  Anomaly;
  onClick:  (anomaly: Anomaly) => void;
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

export function AnomalyCard({ anomaly, onClick }: AnomalyCardProps) {
  const severity = getSeverityClasses(anomaly.severity);
  const status   = getAnomalyStatusClasses(anomaly.anomaly_status);

  return (
    <button
      onClick={() => onClick(anomaly)}
      className="w-full text-left group"
      style={{
        background:   "var(--color-raised)",
        border:       `1px solid var(--color-border)`,
        borderRadius: "10px",
        padding:      "14px 16px",
        cursor:       "pointer",
        transition:   "border-color 150ms ease, background 150ms ease",
        display:      "block",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-indigo)";
        (e.currentTarget as HTMLButtonElement).style.background  = "var(--color-overlay)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLButtonElement).style.background  = "var(--color-raised)";
      }}
    >
      {/* Row 1 — Type label + severity badge + status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Q1: What is the problem */}
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

          {/* Q2: How bad is it */}
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

        {/* Anomaly status pill */}
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

      {/* Row 2 — Entity label (Q3: What is the reference) */}
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize:   "14px",
          fontWeight: 500,
          color:      "var(--color-text-primary)",
          margin:     "0 0 8px 0",
          lineHeight: 1.4,
        }}
      >
        {anomaly.entity_label}
      </p>

      {/* Row 3 — Time delta + trigger source */}
      <div className="flex items-center justify-between">
        {/* Q4: How long has this been happening */}
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

        {/* Q5: What triggered this */}
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
  );
}