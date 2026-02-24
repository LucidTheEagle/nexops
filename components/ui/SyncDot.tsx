// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Sync Status Dot
// Reads exclusively from useSyncStore. Never receives status as a prop.
// Visible in top bar for warehouse_manager role only (enforced by caller).
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useSyncStore } from "@/lib/stores/sync.store";
import { getSyncStatusConfig } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

export function SyncDot() {
  const status      = useSyncStore((s) => s.status);
  const last_synced = useSyncStore((s) => s.last_synced);
  const pending_ops = useSyncStore((s) => s.pending_ops);

  const config = getSyncStatusConfig(status);

  return (
    <div className="flex items-center gap-2" title={
      last_synced ? `Last synced ${formatRelativeTime(last_synced)}` : "Not yet synced"
    }>
      {/* Dot — pulses when syncing */}
      <span
        style={{ background: config.color }}
        className={[
          "block w-2 h-2 rounded-full",
          status === "syncing" || status === "reconnecting"
            ? "animate-pulse"
            : "",
        ].join(" ")}
      />

      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize:   "11px",
          color:      config.color,
        }}
      >
        {config.label}
        {pending_ops > 0 && (
          <span style={{ color: "var(--color-text-muted)", marginLeft: "4px" }}>
            ({pending_ops} pending)
          </span>
        )}
      </span>
    </div>
  );
}