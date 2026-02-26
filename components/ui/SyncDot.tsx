"use client";

import { useSyncStore }        from "@/lib/stores/sync.store";
import { getSyncStatusConfig } from "@/lib/utils";
import { formatRelativeTime }  from "@/lib/utils";

export function SyncDot() {
  const status      = useSyncStore((s) => s.status);
  const last_synced = useSyncStore((s) => s.last_synced);
  const pending_ops = useSyncStore((s) => s.pending_ops);

  const config = getSyncStatusConfig(status);

  return (
    <div
      className="flex items-center gap-2"
      title={last_synced ? `Last synced ${formatRelativeTime(last_synced)}` : "Not yet synced"}
      role="status"
      aria-label={`Sync status: ${config.label}${pending_ops > 0 ? `, ${pending_ops} pending` : ""}`}
      aria-live="polite"
    >
      <span
        className={[
          "block w-2 h-2 rounded-full shrink-0",
          status === "syncing" || status === "reconnecting" ? "animate-pulse" : "",
        ].join(" ")}
        style={{ background: config.color }}
      />
      <span
        className="text-[11px]"
        style={{ fontFamily: "var(--font-mono)", color: config.color }}
      >
        {config.label}
        {pending_ops > 0 && (
          <span
            className="ml-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            ({pending_ops} pending)
          </span>
        )}
      </span>
    </div>
  );
}