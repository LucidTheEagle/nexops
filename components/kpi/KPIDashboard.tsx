// components/kpi/KPIDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NexOps — KPI Dashboard
// CEO-only. Reads from useKPIMetrics + useAnomalies for critical count.
// Skeleton state while loading. Zero hardcoded values.
// CP-07.2: Full Tailwind conversion. Responsive grid: 1col mobile, 2col sm+.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useKPIMetrics }  from "@/lib/hooks/useKPIMetrics";
import { useAnomalies }   from "@/lib/hooks/useAnomalies";
import { useAppStore }    from "@/lib/stores/app.store";
import { usePredictiveAnomalyDetection } from "@/lib/hooks/usePredictiveAnomalyDetection";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[10px] p-5 h-[88px] flex flex-col gap-3"
          style={{
            background: "var(--color-raised)",
            border:     "1px solid var(--color-border)",
          }}
        >
          <div
            className="w-20 h-2.5 rounded opacity-60"
            style={{ background: "var(--color-muted-bg)" }}
          />
          <div
            className="w-16 h-6 rounded opacity-40"
            style={{ background: "var(--color-muted-bg)" }}
          />
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  label:      string;
  value:      string;
  unit:       string;
  highlight?: "live" | "warning" | "critical" | "muted";
  sublabel?:  string;
}

function KPICard({ label, value, unit, highlight, sublabel }: KPICardProps) {
  const valueColor =
    highlight === "live"     ? "var(--color-live)"       :
    highlight === "warning"  ? "var(--color-warning)"    :
    highlight === "critical" ? "var(--color-critical)"   :
    highlight === "muted"    ? "var(--color-text-muted)" :
    "var(--color-text-primary)";

  return (
    <div
      className="rounded-[10px] p-5 flex flex-col gap-1.5"
      style={{
        background: "var(--color-raised)",
        border:     "1px solid var(--color-border)",
      }}
    >
      <p
        className="text-[10px] uppercase tracking-widest m-0"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
      >
        {label}
      </p>

      <p
        className="text-[28px] font-bold leading-none m-0"
        style={{ fontFamily: "var(--font-display)", color: valueColor }}
      >
        {value}
        <span
          className="text-[12px] font-normal ml-1"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
        >
          {unit}
        </span>
      </p>

      {sublabel && (
        <p
          className="text-[10px] m-0 opacity-70"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
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

  const { data: kpi,       isLoading: kpiLoading, isError: kpiError } = useKPIMetrics();
  const { data: anomalies, isLoading: anomLoading                    } = useAnomalies(activeRole);

  if (kpiLoading || anomLoading) return <KPISkeleton />;

  if (kpiError || !kpi) {
    return (
      <div
        className="p-5 rounded-[10px] mb-8 text-[12px]"
        style={{
          border:     "1px solid var(--color-critical)",
          background: "rgba(244,63,94,0.08)",
          fontFamily: "var(--font-mono)",
          color:      "var(--color-critical)",
        }}
      >
        KPI data unavailable — check Supabase connection
      </div>
    );
  }

  const criticalCount = (anomalies ?? []).filter(
    (a) => a.severity === "CRITICAL" && a.anomaly_status !== "RESOLVED"
  ).length;

  const otifHighlight =
    kpi.otif_rate >= 90 ? "live"     :
    kpi.otif_rate >= 70 ? "warning"  :
    kpi.otif_rate > 0   ? "critical" :
    "muted";

  const onTimeHighlight =
    kpi.on_time_percentage >= 85 ? "live"     :
    kpi.on_time_percentage >= 65 ? "warning"  :
    kpi.on_time_percentage > 0   ? "critical" :
    "muted";

  const criticalHighlight =
    criticalCount === 0 ? "live"     :
    criticalCount <= 2  ? "warning"  :
    "critical";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
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

      {/* Critical Anomalies — spans full width at all breakpoints */}
      <div className="col-span-full">
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