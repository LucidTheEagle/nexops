// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Sync State Store
// Tracks PGlite ↔ Supabase sync pipeline state.
// The sync dot in the UI reads exclusively from this store.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { SyncStatus } from "@/types";

interface SyncState {
  status:      SyncStatus;
  last_synced: string | null;
  pending_ops: number;

  // ── Actions ────────────────────────────────────────────────────────────────
  setSyncStatus:  (status: SyncStatus) => void;
  setLastSynced:  (timestamp: string) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  confirmSync:    (timestamp: string) => void;
}

export const useSyncStore = create<SyncState>()(
  devtools(
    (set, get) => ({
      status:      "offline",
      last_synced: null,
      pending_ops: 0,

      setSyncStatus: (status) =>
        set({ status }, false, "sync/setSyncStatus"),

      setLastSynced: (timestamp) =>
        set({ last_synced: timestamp }, false, "sync/setLastSynced"),

      incrementPending: () =>
        set(
          { pending_ops: get().pending_ops + 1, status: "syncing" },
          false,
          "sync/incrementPending"
        ),

      decrementPending: () => {
        const next = Math.max(0, get().pending_ops - 1);
        set(
          { pending_ops: next },
          false,
          "sync/decrementPending"
        );
      },

      // Called when Supabase Realtime confirms the write came back.
      // This is the moment the sync dot turns green.
      confirmSync: (timestamp) =>
        set(
          { status: "live", last_synced: timestamp, pending_ops: 0 },
          false,
          "sync/confirmSync"
        ),
    }),
    { name: "NexOps/Sync" }
  )
);