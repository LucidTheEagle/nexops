// ─────────────────────────────────────────────────────────────────────────────
// NexOps — useShipment Hook
// Fetches full drill-down data for a single shipment.
// Includes: shipment, driver, client, status_events, scoped audit log.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery }           from "@tanstack/react-query";
import { supabase }           from "@/lib/supabase/browser";
import type { DrillDownData } from "@/types";

export const shipmentKeys = {
  drillDown: (id: string) => ["shipment", "drill-down", id] as const,
};

async function fetchDrillDownData(shipmentId: string): Promise<DrillDownData> {
  const [shipmentRes, eventsRes, auditRes] = await Promise.all([
    supabase
      .from("shipments")
      .select("*, client:clients(*), driver:drivers(*)")
      .eq("id", shipmentId)
      .single(),
    supabase
      .from("status_events")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("timestamp", { ascending: false }),
    supabase
      .from("audit_log")
      .select("*")
      .eq("record_id", shipmentId)
      .order("changed_at", { ascending: false }),
  ]);

  if (shipmentRes.error) throw new Error(`[fetchDrillDown] ${shipmentRes.error.message}`);
  if (eventsRes.error)   throw new Error(`[fetchDrillDown] ${eventsRes.error.message}`);
  if (auditRes.error)    throw new Error(`[fetchDrillDown] ${auditRes.error.message}`);

  const shipment = shipmentRes.data;

  return {
    shipment,
    driver:       shipment.driver   ?? null,
    client:       shipment.client,
    statusEvents: eventsRes.data,
    auditEntries: auditRes.data,
    anomaly:      null,
  };
}

export function useDrillDownData(shipmentId: string | null) {
  return useQuery({
    queryKey: shipmentKeys.drillDown(shipmentId ?? ""),
    queryFn:  () => fetchDrillDownData(shipmentId!),
    enabled:  !!shipmentId,
    staleTime: 10_000,
  });
}