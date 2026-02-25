// ─────────────────────────────────────────────────────────────────────────────
// NexOps — useAuditLog Hook
// Inserts audit entries on data changes.
// GPS telemetry fields are excluded at the DB trigger level — not here.
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation } from "@tanstack/react-query";
import { supabase }    from "@/lib/supabase/browser";
import type { AuditLogEntry } from "@/types";

type InsertAuditPayload = Omit<AuditLogEntry, "id" | "changed_at">;

async function insertAuditEntry(payload: InsertAuditPayload): Promise<void> {
  const { error } = await supabase
    .from("audit_log")
    .insert(payload);

  if (error) throw new Error(`[insertAuditEntry] ${error.message}`);
}

export function useInsertAuditEntry() {
  return useMutation({
    mutationFn: insertAuditEntry,
    onError: (err) => {
      console.error("[useAuditLog]", err);
    },
  });
}