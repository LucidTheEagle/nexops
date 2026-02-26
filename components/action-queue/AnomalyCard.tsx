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
  const [hovered, setHovered] = useState(false);
  const activeRole             = useAppStore((s) => s.activeRole);
  const severity               = getSeverityClasses(anomaly.severity);
  const status                 = getAnomalyStatusClasses(anomaly.anomaly_status);
  const updateStatus           = useUpdateAnomalyStatus(activeRole);
  const insertAudit            = useInsertAuditEntry();

  const transitions = NEXT_TRANSITIONS[anomaly.anomaly_status] ?? [];
  const actionRowVisible = hovered && transitions.length > 0;

  function handleTransition(e: React.MouseEvent, nextStatus: AnomalyStatus) {
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
      className="relative"
    >
      {/* Main card button — min 44px height for warehouse touch standard */}
      <button
        onClick={() => onClick(anomaly)}
        aria-expanded={actionRowVisible}
        aria-label={`${ANOMALY_TYPE_LABEL[anomaly.type]}: ${anomaly.entity_label}, ${anomaly.severity}`}
        className="w-full text-left block min-h-[44px] transition-all duration-150 ease-out"
        style={{
          border:       `1px solid ${hovered ? "var(--color-indigo)" : "var(--color-border)"}`,
          borderRadius: actionRowVisible ? "10px 10px 0 0" : "10px",
          padding:      "14px 16px",
          cursor:       "pointer",
          background:   hovered ? "var(--color-overlay)" : "var(--color-raised)",
        }}
      >
        {/* Row 1 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              {ANOMALY_TYPE_LABEL[anomaly.type]}
            </span>
            <span
              className={`${severity.text} ${severity.bg} ${severity.border} text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {anomaly.severity}
            </span>
          </div>
          <span
            className={`${status.text} ${status.bg} text-[9px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {anomaly.anomaly_status}
          </span>
        </div>

        {/* Row 2 */}
        <p
          className="text-sm font-medium leading-snug mb-2 text-left"
          style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}
        >
          {anomaly.entity_label}
        </p>

        {/* Row 3 */}
        <div className="flex items-center justify-between">
          <span
            className="text-[11px]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
          >
            {anomaly.time_delta_minutes !== null
              ? formatTimeDelta(anomaly.time_delta_minutes)
              : formatRelativeTime(anomaly.triggered_at)}
          </span>
          <span
            className="text-[10px] tracking-wide"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
          >
            {TRIGGER_LABEL[anomaly.trigger_source]}
          </span>
        </div>
      </button>

      {/* Action row */}
      {actionRowVisible && (
        <div
          role="group"
          aria-label="Status actions"
          className="flex overflow-hidden"
          style={{
            gap:          "1px",
            background:   "var(--color-border)",
            border:       `1px solid var(--color-indigo)`,
            borderTop:    "none",
            borderRadius: "0 0 10px 10px",
          }}
        >
          {transitions.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={(e) => handleTransition(e, nextStatus)}
              disabled={updateStatus.isPending}
              // 44px min height — warehouse touch standard
              className="flex-1 min-h-[44px] transition-colors duration-150 ease-out uppercase tracking-widest text-[10px] font-semibold disabled:cursor-not-allowed hover:brightness-125"
              style={{
                padding:    "8px 12px",
                background: "var(--color-overlay)",
                border:     "none",
                cursor:     updateStatus.isPending ? "not-allowed" : "pointer",
                fontFamily: "var(--font-mono)",
                color:      nextStatus === "RESOLVED"
                  ? "var(--color-live)"
                  : "var(--color-text-secondary)",
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