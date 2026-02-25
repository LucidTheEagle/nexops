// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Action Queue (Priority Inbox)
// The heartbeat of NexOps. Renders ranked anomaly feed from live Supabase data.
// Severity sort: CRITICAL → WARNING → WATCH (enforced by useAnomalies hook).
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect }      from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnomalies, anomalyKeys } from "@/lib/hooks/useAnomalies";
import { useAppStore }    from "@/lib/stores/app.store";
import { useSyncStore }   from "@/lib/stores/sync.store";
import { supabase }       from "@/lib/supabase/browser";
import { AnomalyCard }    from "./AnomalyCard";
import type { Anomaly }   from "@/types";

export function ActionQueue() {
  const activeRole    = useAppStore((s) => s.activeRole);
  const openDrawer    = useAppStore((s) => s.openDrawer);
  const setSyncStatus = useSyncStore((s) => s.setSyncStatus);
  const confirmSync   = useSyncStore((s) => s.confirmSync);
  const queryClient   = useQueryClient();

  const { data: anomalies, isLoading, isError, error } = useAnomalies(activeRole);

  // ── Supabase Realtime subscription ───────────────────────────────────────
  useEffect(() => {
    setSyncStatus("syncing");

    const channel = supabase
      .channel("action-queue-anomalies")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "anomalies" },
        () => {
          confirmSync(new Date().toISOString());
          queryClient.invalidateQueries({ queryKey: anomalyKeys.byRole(activeRole) });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED")    setSyncStatus("live");
        if (status === "CLOSED")        setSyncStatus("offline");
        if (status === "CHANNEL_ERROR") setSyncStatus("reconnecting");
      });

    return () => { supabase.removeChannel(channel); };
  }, [setSyncStatus, confirmSync, activeRole, queryClient]);

  function handleCardClick(anomaly: Anomaly) {
    openDrawer(anomaly);
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!isLoading && !isError && anomalies?.length === 0) {
    return (
      <div
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "48px 24px",
          gap:            "8px",
        }}
      >
        <span style={{ fontSize: "24px" }}>✓</span>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-muted)" }}>
          No active anomalies
        </p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div style={{ padding: "24px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-critical)" }}>
          {error?.message ?? "Failed to load anomalies"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Loading skeletons */}
      {isLoading && Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            background:   "var(--color-raised)",
            border:       "1px solid var(--color-border)",
            borderRadius: "10px",
            height:       "88px",
            animation:    "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}

      {/* Anomaly cards */}
      {anomalies?.map((anomaly: Anomaly) => (
        <AnomalyCard
          key={anomaly.id}
          anomaly={anomaly}
          onClick={handleCardClick}
        />
      ))}
    </div>
  );
}