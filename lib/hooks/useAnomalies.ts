// ─────────────────────────────────────────────────────────────────────────────
// NexOps — useAnomalies React Query Hook
// Fetches anomalies from Supabase, filtered by role severity config.
// Optimistic mutation included — this is what CP-02.5 pipeline test uses.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import { getSeverityFilter } from "@/lib/config/roles";
import { sortBySeverity } from "@/lib/utils";
import type { Anomaly, UserRole, AnomalyStatus } from "@/types";
import { useAppStore } from "@/lib/stores/app.store";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const anomalyKeys = {
  all:    ["anomalies"] as const,
  byRole: (role: UserRole) => ["anomalies", role] as const,
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchAnomalies(role: UserRole): Promise<Anomaly[]> {
  const severityFilter = getSeverityFilter(role);

  const { data, error } = await supabase
    .from("anomalies")
    .select("*")
    .is("deleted_at", null)
    .in("severity", severityFilter)
    .neq("anomaly_status", "RESOLVED")
    .order("triggered_at", { ascending: false });

  if (error) throw new Error(`[useAnomalies] ${error.message}`);

  return sortBySeverity(data as Anomaly[]);
}

// ── Query Hook ────────────────────────────────────────────────────────────────

export function useAnomalies(role: UserRole) {
  return useQuery({
    queryKey: anomalyKeys.byRole(role),
    queryFn:  () => fetchAnomalies(role),
    staleTime: 15_000,
  });
}

// ── Insert Anomaly (used by CP-02.5 pipeline test) ────────────────────────────

interface InsertAnomalyPayload {
  type:               Anomaly["type"];
  severity:           Anomaly["severity"];
  entity_type:        Anomaly["entity_type"];
  entity_id:          string;
  entity_label:       string;
  time_delta_minutes: number | null;
  trigger_source:     Anomaly["trigger_source"];
}

async function insertAnomaly(payload: InsertAnomalyPayload): Promise<Anomaly> {
  const { data, error } = await supabase
    .from("anomalies")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(`[insertAnomaly] ${error.message}`);
  return data as Anomaly;
}

// ── Optimistic Mutation Hook ──────────────────────────────────────────────────

export function useInsertAnomaly(role: UserRole) {
  const queryClient = useQueryClient();
  const queryKey    = anomalyKeys.byRole(role);

  return useMutation({
    mutationFn: insertAnomaly,

    // Step 1: optimistic update — UI reflects change immediately
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Anomaly[]>(queryKey) ?? [];

      const optimistic: Anomaly = {
        id:                 `optimistic-${Date.now()}`,
        type:               payload.type,
        severity:           payload.severity,
        entity_type:        payload.entity_type,
        entity_id:          payload.entity_id,
        entity_label:       payload.entity_label,
        time_delta_minutes: payload.time_delta_minutes,
        trigger_source:     payload.trigger_source,
        anomaly_status:     "OPEN",
        triggered_at:       new Date().toISOString(),
        actioned_by:        null,
        actioned_at:        null,
        updated_at:         new Date().toISOString(),
        deleted_at:         null,
      };

      queryClient.setQueryData<Anomaly[]>(
        queryKey,
        sortBySeverity([optimistic, ...previous])
      );

      return { previous };
    },

    // Rollback on error
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Anomaly[]>(queryKey, context.previous);
      }
    },

    // Replace optimistic record with real server data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ── Update Anomaly Status ─────────────────────────────────────────────────────

export function useUpdateAnomalyStatus(role: UserRole) {
  const setToast = useAppStore((s) => s.setToast);
  const queryClient = useQueryClient();
  const queryKey    = anomalyKeys.byRole(role);

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id:     string;
      status: AnomalyStatus;
    }) => {
      const { error } = await supabase
        .from("anomalies")
        .update({ anomaly_status: status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(`[updateAnomalyStatus] ${error.message}`);
    },

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Anomaly[]>(queryKey) ?? [];

      queryClient.setQueryData<Anomaly[]>(
        queryKey,
        previous.map((a) =>
          a.id === id ? { ...a, anomaly_status: status } : a
        )
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Anomaly[]>(queryKey, context.previous);
      }
      setToast({ message: "Failed to update status — changes rolled back", type: "error" });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}