// components/kpi/KPIDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NexOps — KPI Dashboard
// CEO-only. Reads from useKPIMetrics + useAnomalies for critical count.
// Skeleton state while loading. Zero hardcoded values.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useKPIMetrics }  from "@/lib/hooks/useKPIMetrics";
import { useAnomalies }   from "@/lib/hooks/useAnomalies";
import { useAppStore }    from "@/lib/stores/app.store";
import { usePredictiveAnomalyDetection } from "@/lib/hooks/usePredictiveAnomalyDetection";

// ── Skeleton card ─────────────────────────────────────────────────────────────

function KPISkeleton() {
  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap:                 "12px",
        marginBottom:        "32px",
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            background:   "var(--color-raised)",
            border:       "1px solid var(--color-border)",
            borderRadius: "10px",
            padding:      "20px",
            height:       "88px",
          }}
        >
          <div
            style={{
              width:        "80px",
              height:       "10px",
              borderRadius: "4px",
              background:   "var(--color-muted-bg)",
              marginBottom: "12px",
              opacity:      0.6,
            }}
          />
          <div
            style={{
              width:        "60px",
              height:       "24px",
              borderRadius: "4px",
              background:   "var(--color-muted-bg)",
              opacity:      0.4,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  label:     string;
  value:     string;
  unit:      string;
  highlight?: "live" | "warning" | "critical" | "muted";
  sublabel?: string;
}

function KPICard({ label, value, unit, highlight, sublabel }: KPICardProps) {
  const valueColor =
    highlight === "live"     ? "var(--color-live)"     :
    highlight === "warning"  ? "var(--color-warning)"  :
    highlight === "critical" ? "var(--color-critical)" :
    highlight === "muted"    ? "var(--color-text-muted)" :
    "var(--color-text-primary)";

  return (
    <div
      style={{
        background:   "var(--color-raised)",
        border:       `1px solid var(--color-border)`,
        borderRadius: "10px",
        padding:      "20px",
        display:      "flex",
        flexDirection: "column",
        gap:          "6px",
      }}
    >
      <p
        style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "10px",
          color:         "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin:        0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize:   "28px",
          fontWeight: 700,
          color:      valueColor,
          margin:     0,
          lineHeight: 1,
        }}
      >
        {value}
        <span
          style={{
            fontFamily:  "var(--font-mono)",
            fontSize:    "12px",
            color:       "var(--color-text-muted)",
            marginLeft:  "4px",
            fontWeight:  400,
          }}
        >
          {unit}
        </span>
      </p>
      {sublabel && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "10px",
            color:      "var(--color-text-muted)",
            margin:     0,
            opacity:    0.7,
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function KPIDashboard() {
  const activeRole = useAppStore((s) => s.activeRole);
  usePredictiveAnomalyDetection(activeRole);

  const { data: kpi,       isLoading: kpiLoading,  isError: kpiError  } = useKPIMetrics();
  const { data: anomalies, isLoading: anomLoading                       } = useAnomalies(activeRole);

  if (kpiLoading || anomLoading) return <KPISkeleton />;

  if (kpiError || !kpi) {
    return (
      <div
        style={{
          padding:      "20px",
          borderRadius: "10px",
          border:       "1px solid var(--color-critical)",
          background:   "rgba(244,63,94,0.08)",
          marginBottom: "32px",
          fontFamily:   "var(--font-mono)",
          fontSize:     "12px",
          color:        "var(--color-critical)",
        }}
      >
        KPI data unavailable — check Supabase connection
      </div>
    );
  }

  // Count criticals from live anomaly query — no hardcoded value
  const criticalCount = (anomalies ?? []).filter(
    (a) => a.severity === "CRITICAL" && a.anomaly_status !== "RESOLVED"
  ).length;

  // Derive highlight states from actual values
  const otifHighlight =
    kpi.otif_rate >= 90 ? "live" :
    kpi.otif_rate >= 70 ? "warning" :
    kpi.otif_rate > 0   ? "critical" :
    "muted";

  const onTimeHighlight =
    kpi.on_time_percentage >= 85 ? "live" :
    kpi.on_time_percentage >= 65 ? "warning" :
    kpi.on_time_percentage > 0   ? "critical" :
    "muted";

  const criticalHighlight =
    criticalCount === 0 ? "live" :
    criticalCount <= 2  ? "warning" :
    "critical";

  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap:                 "12px",
        marginBottom:        "32px",
      }}
    >
      <KPICard
        label="OTIF Rate"
        value={kpi.otif_rate > 0 ? kpi.otif_rate.toString() : "—"}
        unit="%"
        highlight={otifHighlight}
        sublabel={`${kpi.active_shipments} active shipment${kpi.active_shipments !== 1 ? "s" : ""}`}
      />
      <KPICard
        label="Avg Cost-to-Serve"
        value={
          kpi.avg_cost_to_serve > 0
            ? kpi.avg_cost_to_serve.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            : "—"
        }
        unit="$"
        highlight="muted"
      />
      <KPICard
        label="Carbon / Shipment"
        value={
          kpi.total_carbon_kg > 0
            ? kpi.active_shipments > 0
              ? (kpi.total_carbon_kg / kpi.active_shipments).toFixed(1)
              : kpi.total_carbon_kg.toFixed(1)
            : "—"
        }
        unit="kg"
        highlight="muted"
      />
      <KPICard
        label="On-Time %"
        value={kpi.on_time_percentage > 0 ? kpi.on_time_percentage.toString() : "—"}
        unit="%"
        highlight={onTimeHighlight}
      />

      {/* ── Critical Escalations count — spans full width ── */}
      <div style={{ gridColumn: "1 / -1" }}>
        <KPICard
          label="Critical Anomalies"
          value={criticalCount.toString()}
          unit="open"
          highlight={criticalHighlight}
          sublabel="Requires immediate action"
        />
      </div>
    </div>
  );
}