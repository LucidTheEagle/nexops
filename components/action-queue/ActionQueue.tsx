"use client";

import { useEffect, useId }   from "react";
import { useQueryClient }     from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useAnomalies, anomalyKeys } from "@/lib/hooks/useAnomalies";
import { useAppStore }        from "@/lib/stores/app.store";
import { useSyncStore }       from "@/lib/stores/sync.store";
import { supabase }           from "@/lib/supabase/browser";
import { AnomalyCard }        from "./AnomalyCard";
import type { Anomaly }       from "@/types";

export function ActionQueue() {
  const activeRole    = useAppStore((s) => s.activeRole);
  const openDrawer    = useAppStore((s) => s.openDrawer);
  const setSyncStatus = useSyncStore((s) => s.setSyncStatus);
  const confirmSync   = useSyncStore((s) => s.confirmSync);
  const queryClient   = useQueryClient();
  const listId        = useId();

  const { data: anomalies, isLoading, isError, error } = useAnomalies(activeRole);

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

  if (!isLoading && !isError && anomalies?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 gap-2">
        <span className="text-2xl">✓</span>
        <p
          style={{ fontFamily: "var(--font-mono)" }}
          className="text-xs"
          // color is a runtime CSS var — inline required
          // but we can use a Tailwind arbitrary value for known tokens:
        >
          <span style={{ color: "var(--color-text-muted)" }}>No active anomalies</span>
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p style={{ fontFamily: "var(--font-mono)", color: "var(--color-critical)" }} className="text-xs">
          {error?.message ?? "Failed to load anomalies"}
        </p>
      </div>
    );
  }

  return (
    // aria-live: screen readers announce new anomalies without interrupting user
    <div
      role="feed"
      aria-live="polite"
      aria-label="Active anomalies"
      aria-busy={isLoading}
      id={listId}
      className="flex flex-col gap-2"
    >
      {isLoading && Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[10px] h-[88px] animate-pulse"
          style={{ background: "var(--color-raised)", border: "1px solid var(--color-border)" }}
        />
      ))}

      {/* AnimatePresence mode="popLayout": exiting elements animate out before
          layout shifts, preventing CLS when severity re-ranking occurs        */}
      <AnimatePresence mode="popLayout">
        {anomalies?.map((anomaly: Anomaly) => (
          <motion.div
            key={anomaly.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <AnomalyCard
              anomaly={anomaly}
              onClick={handleCardClick}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}