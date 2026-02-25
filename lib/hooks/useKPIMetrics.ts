// lib/hooks/useKPIMetrics.ts
// ─────────────────────────────────────────────────────────────────────────────
// NexOps — useKPIMetrics React Query Hook
// Computes OTIF, Cost-to-Serve, Carbon, On-Time % from live shipments table.
// No hardcoded values. All computation is client-side from raw rows.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import type { KPIMetrics, Shipment } from "@/types";

// ── Query Key ─────────────────────────────────────────────────────────────────

export const kpiKeys = {
  all: ["kpi_metrics"] as const,
};

// ── Computation ───────────────────────────────────────────────────────────────

function computeKPIs(shipments: Shipment[]): KPIMetrics {
  // Exclude soft-deleted and cancelled from all metric denominators
  const active = shipments.filter(
    (s) => s.deleted_at === null && s.current_status !== "CANCELLED"
  );

  const delivered = active.filter((s) => s.current_status === "DELIVERED");

  // OTIF: delivered on or before scheduled_eta
  // A shipment is "in full" by definition if it reached DELIVERED — we don't
  // track partial fulfillment at this schema level, so OTIF collapses to on-time
  // delivery rate across all delivered shipments.
  const otifCount = delivered.filter((s) => {
    if (!s.predicted_eta || !s.scheduled_eta) return false;
    return new Date(s.predicted_eta) <= new Date(s.scheduled_eta);
  }).length;

  const otif_rate =
    delivered.length > 0
      ? parseFloat(((otifCount / delivered.length) * 100).toFixed(1))
      : 0;

  // On-Time %: same numerator as OTIF, but denominator is all active
  // (includes in-transit/delayed — gives a fleet-wide health signal)
  const onTimeCount = active.filter((s) => {
    if (!s.predicted_eta || !s.scheduled_eta) return false;
    return new Date(s.predicted_eta) <= new Date(s.scheduled_eta);
  }).length;

  const on_time_percentage =
    active.length > 0
      ? parseFloat(((onTimeCount / active.length) * 100).toFixed(1))
      : 0;

  // Avg Cost-to-Serve: mean across rows where cost_to_serve is non-null
  const withCost = active.filter((s) => s.cost_to_serve !== null);
  const avg_cost_to_serve =
    withCost.length > 0
      ? parseFloat(
          (
            withCost.reduce((sum, s) => sum + (s.cost_to_serve ?? 0), 0) /
            withCost.length
          ).toFixed(2)
        )
      : 0;

  // Total Carbon: sum across non-null rows
  const total_carbon_kg = parseFloat(
    active
      .reduce((sum, s) => sum + (s.carbon_kg ?? 0), 0)
      .toFixed(1)
  );

  // Active shipments count (IN_TRANSIT + DELAYED + AT_RISK + PENDING)
  const active_shipments = active.filter(
    (s) => s.current_status !== "DELIVERED"
  ).length;

  return {
    otif_rate,
    avg_cost_to_serve,
    total_carbon_kg,
    on_time_percentage,
    active_shipments,
    critical_anomalies: 0, // populated by caller — anomaly data lives in separate query
    computed_at: new Date().toISOString(),
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchKPIMetrics(): Promise<KPIMetrics> {
  const { data, error } = await supabase
    .from("shipments")
    .select(
      "id, current_status, scheduled_eta, predicted_eta, cost_to_serve, carbon_kg, deleted_at"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(`[useKPIMetrics] ${error.message}`);

  return computeKPIs(data as Shipment[]);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKPIMetrics() {
  return useQuery({
    queryKey: kpiKeys.all,
    queryFn:  fetchKPIMetrics,
    staleTime: 30_000,
    refetchInterval: 60_000, // KPIs refresh every 60s — not realtime-subscribed
  });
}