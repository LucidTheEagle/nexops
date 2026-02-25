// ─────────────────────────────────────────────────────────────────────────────
// NexOps — useAuditLog Hook
// Inserts audit entries on data changes.
// GPS telemetry fields are excluded at the DB trigger level — not here.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase }              from "@/lib/supabase/browser";
import type { AuditLogEntry }    from "@/types";

type InsertAuditPayload = Omit<AuditLogEntry, "id" | "changed_at">;

// ── Query Keys ────────────────────────────────────────────────────────────────

export const auditKeys = {
  global:  ["audit_log", "global"] as const,
  scoped:  (recordId: string) => ["audit_log", "scoped", recordId] as const,
};

// ── Fetch — Global (last 24h, paginated) ─────────────────────────────────────

async function fetchGlobalAuditLog(): Promise<AuditLogEntry[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .gte("changed_at", since)
    .order("changed_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`[fetchGlobalAuditLog] ${error.message}`);
  return data as AuditLogEntry[];
}

// ── Fetch — Scoped (single record) ───────────────────────────────────────────

async function fetchScopedAuditLog(recordId: string): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("record_id", recordId)
    .order("changed_at", { ascending: false });

  if (error) throw new Error(`[fetchScopedAuditLog] ${error.message}`);
  return data as AuditLogEntry[];
}

// ── Query Hooks ───────────────────────────────────────────────────────────────

export function useGlobalAuditLog() {
  return useQuery({
    queryKey: auditKeys.global,
    queryFn:  fetchGlobalAuditLog,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useScopedAuditLog(recordId: string) {
  return useQuery({
    queryKey: auditKeys.scoped(recordId),
    queryFn:  () => fetchScopedAuditLog(recordId),
    staleTime: 10_000,
    enabled:   !!recordId,
  });
}

// ── Insert Mutation ───────────────────────────────────────────────────────────

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