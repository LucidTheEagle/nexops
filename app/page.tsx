// ─────────────────────────────────────────────────────────────────────────────
// NexOps — CP-02.5 Pipeline Test Harness
// Proves: Zustand → Optimistic UI → Supabase write → Realtime confirmation
// This page is replaced at CP-03 with the real Action Queue.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import { useInsertAnomaly, useAnomalies } from "@/lib/hooks/useAnomalies";
import { useSyncStore } from "@/lib/stores/sync.store";
import { useAppStore } from "@/lib/stores/app.store";
import { supabase } from "@/lib/supabase/browser";
import { getSyncStatusConfig } from "@/lib/utils";
import type { Anomaly } from "@/types";

const TEST_ROLE = "warehouse_manager" as const;

export default function PipelineTest() {
  const activeRole          = useAppStore((s) => s.activeRole);
  const syncStatus          = useSyncStore((s) => s.status);
  const setSyncStatus       = useSyncStore((s) => s.setSyncStatus);
  const incrementPending    = useSyncStore((s) => s.incrementPending);
  const confirmSync         = useSyncStore((s) => s.confirmSync);

  const { data: anomalies, isLoading } = useAnomalies(TEST_ROLE);
  const insertAnomaly                  = useInsertAnomaly(TEST_ROLE);

  const syncConfig   = getSyncStatusConfig(syncStatus);
  const realtimeRef  = useRef(false);

  // ── Step 4: Supabase Realtime subscription ──────────────────────────────
  useEffect(() => {
    if (realtimeRef.current) return;
    realtimeRef.current = true;

    setSyncStatus("syncing");

    const channel = supabase
      .channel("anomalies-pipeline-test")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anomalies" },
        (payload) => {
          console.log("[CP-02.5] Step 4 — Realtime confirmed:", payload.new);
          confirmSync(new Date().toISOString());
        }
      )
      .subscribe((status) => {
        console.log("[CP-02.5] Realtime channel status:", status);
        if (status === "SUBSCRIBED") setSyncStatus("live");
        if (status === "CLOSED")     setSyncStatus("offline");
        if (status === "CHANNEL_ERROR") setSyncStatus("reconnecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setSyncStatus, confirmSync]);

  // ── Pipeline Test Trigger ───────────────────────────────────────────────
  function runPipelineTest() {
    console.log("[CP-02.5] Step 1 — Zustand mutation fired");
    incrementPending();

    const start = performance.now();
    console.log(`[CP-02.5] Step 1 — Zustand mutation fired`);
    incrementPending();
    
    insertAnomaly.mutate(
      {
        type:               "SHIPMENT_DELAYED",
        severity:           "CRITICAL",
        entity_type:        "shipment",
        entity_id:          "00000000-0000-0000-0000-000000000001",
        entity_label:       "Shipment #TEST — Rotterdam to Dubai",
        time_delta_minutes: 134,
        trigger_source:     "MANUAL",
      },
      {
        onSuccess: () => {
          const elapsed = performance.now() - start;
          console.log(`[CP-02.5] Step 2 — Optimistic UI update: ${elapsed.toFixed(2)}ms`);
          console.log("[CP-02.5] Step 3 — Supabase write confirmed");
        },
        onError: (err) => {
          console.error("[CP-02.5] Pipeline error:", err);
        },
      }
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontFamily:    "var(--font-display)",
          fontSize:      "48px",
          fontWeight:    800,
          color:         "var(--color-violet)",
          letterSpacing: "-0.03em",
        }}>
          NexOps
        </h1>
        <p style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "12px",
          color:         "var(--color-text-muted)",
          marginTop:     "8px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          CP-02.5 — Pipeline Test
        </p>
      </div>

      {/* Sync Status Dot */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width:        "10px",
          height:       "10px",
          borderRadius: "50%",
          background:   syncConfig.color,
        }} />
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize:   "12px",
          color:      syncConfig.color,
        }}>
          {syncConfig.label}
        </span>
      </div>

      {/* Pipeline Test Button */}
      <button
        onClick={runPipelineTest}
        disabled={insertAnomaly.isPending}
        style={{
          background:   "var(--color-violet)",
          color:        "var(--color-text-primary)",
          border:       "none",
          borderRadius: "8px",
          padding:      "12px 24px",
          fontFamily:   "var(--font-mono)",
          fontSize:     "13px",
          cursor:       insertAnomaly.isPending ? "not-allowed" : "pointer",
          opacity:      insertAnomaly.isPending ? 0.6 : 1,
        }}
      >
        {insertAnomaly.isPending ? "Writing..." : "Run Pipeline Test"}
      </button>

      {/* Live Anomaly Feed */}
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize:   "11px",
          color:      "var(--color-text-muted)",
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}>
          Live Anomaly Feed — Role: {activeRole}
        </p>

        {isLoading && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-muted)" }}>
            Loading...
          </p>
        )}

        {anomalies?.map((anomaly: Anomaly) => (
          <div
            key={anomaly.id}
            style={{
              background:   "var(--color-raised)",
              border:       "1px solid var(--color-border)",
              borderRadius: "8px",
              padding:      "12px 16px",
              marginBottom: "8px",
              display:      "flex",
              gap:          "12px",
              alignItems:   "center",
            }}
          >
            <span style={{
              fontFamily:  "var(--font-mono)",
              fontSize:    "10px",
              color:       anomaly.severity === "CRITICAL" ? "#F43F5E"
                         : anomaly.severity === "WARNING"  ? "#F59E0B"
                         : "#6366F1",
              fontWeight:  700,
              minWidth:    "70px",
            }}>
              {anomaly.severity}
            </span>
            <span style={{
              fontFamily: "var(--font-sans)",
              fontSize:   "13px",
              color:      "var(--color-text-primary)",
              flex:       1,
            }}>
              {anomaly.entity_label}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "11px",
              color:      "var(--color-text-muted)",
            }}>
              {anomaly.anomaly_status}
            </span>
          </div>
        ))}

        {anomalies?.length === 0 && !isLoading && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-muted)" }}>
            No anomalies. Hit the button above to run the pipeline test.
          </p>
        )}
      </div>
    </main>
  );
}