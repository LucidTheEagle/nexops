// lib/hooks/usePredictiveAnomalyDetection.ts
// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Predictive Anomaly Detection Engine
// Runs on CEO view mount. Scans shipments for predicted_eta breaches.
// Inserts WATCH severity anomaly with trigger_source: AI if not already present.
// Threshold: 60 minutes over scheduled_eta.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef }  from "react";
import { useQueryClient }     from "@tanstack/react-query";
import { supabase }           from "@/lib/supabase/browser";
import { anomalyKeys }        from "@/lib/hooks/useAnomalies";
import { kpiKeys }            from "@/lib/hooks/useKPIMetrics";
import type { Shipment, Anomaly, UserRole } from "@/types";

const BREACH_THRESHOLD_MINUTES = 60;

// ── Engine ────────────────────────────────────────────────────────────────────

async function runDetection(role: UserRole, queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  // 1. Fetch at-risk shipments — non-cancelled, non-deleted, both ETAs present
  const { data: shipments, error: shipErr } = await supabase
    .from("shipments")
    .select("id, reference_number, scheduled_eta, predicted_eta, current_status, deleted_at")
    .is("deleted_at", null)
    .not("scheduled_eta", "is", null)
    .not("predicted_eta", "is", null)
    .neq("current_status", "CANCELLED")
    .neq("current_status", "DELIVERED");

  if (shipErr) {
    console.error("[PredictiveDetection] shipments fetch failed:", shipErr.message);
    return;
  }

  const candidates = (shipments as Shipment[]).filter((s) => {
    const scheduled = new Date(s.scheduled_eta!).getTime();
    const predicted  = new Date(s.predicted_eta!).getTime();
    const deltaMin   = (predicted - scheduled) / 60_000;
    return deltaMin > BREACH_THRESHOLD_MINUTES;
  });

  if (candidates.length === 0) return;

  // 2. Fetch existing AI-triggered SHIPMENT_DELAYED anomalies for these entity IDs
  //    to prevent duplicate inserts
  const candidateIds = candidates.map((s) => s.id);

  const { data: existing, error: anomErr } = await supabase
    .from("anomalies")
    .select("entity_id")
    .is("deleted_at", null)
    .eq("type", "SHIPMENT_DELAYED")
    .eq("trigger_source", "AI")
    .neq("anomaly_status", "RESOLVED")
    .in("entity_id", candidateIds);

  if (anomErr) {
    console.error("[PredictiveDetection] anomalies check failed:", anomErr.message);
    return;
  }

  const alreadyFlagged = new Set((existing as Pick<Anomaly, "entity_id">[]).map((a) => a.entity_id));

  // 3. Insert anomaly for each breach not already flagged
  const toInsert = candidates.filter((s) => !alreadyFlagged.has(s.id));

  if (toInsert.length === 0) return;

  const inserts = toInsert.map((s) => {
    const deltaMin = Math.round(
      (new Date(s.predicted_eta!).getTime() - new Date(s.scheduled_eta!).getTime()) / 60_000
    );

    return {
      type:               "SHIPMENT_DELAYED" as const,
      severity:           "WATCH"            as const,
      entity_type:        "shipment"         as const,
      entity_id:          s.id,
      entity_label:       `Shipment #${s.reference_number}`,
      time_delta_minutes: deltaMin,
      trigger_source:     "AI"               as const,
      anomaly_status:     "OPEN"             as const,
    };
  });

  const { error: insertErr } = await supabase
    .from("anomalies")
    .insert(inserts);

  if (insertErr) {
    console.error("[PredictiveDetection] insert failed:", insertErr.message);
    return;
  }

  // 4. Invalidate both anomaly and KPI caches so UI reflects new flags immediately
  await queryClient.invalidateQueries({ queryKey: anomalyKeys.byRole(role) });
  await queryClient.invalidateQueries({ queryKey: kpiKeys.all });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePredictiveAnomalyDetection(role: UserRole) {
  const queryClient = useQueryClient();
  const hasRun      = useRef(false);

  useEffect(() => {
    // Run once per mount — re-runs if role changes (ref resets on unmount)
    if (hasRun.current) return;
    hasRun.current = true;

    void runDetection(role, queryClient);
  }, [role, queryClient]);
}