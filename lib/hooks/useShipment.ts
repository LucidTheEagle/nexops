// ─────────────────────────────────────────────────────────────────────────────
// NexOps — useShipment Hook
// Fetches full drill-down data for a single shipment.
// Includes: shipment, driver, client, status_events, scoped audit log.
// CP-07.3: Extended to handle driver and invoice entity types.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery }           from "@tanstack/react-query";
import { supabase }           from "@/lib/supabase/browser";
import type {
  DrillDownData,
  DriverDrillDownData,
  InvoiceDrillDownData,
} from "@/types";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const shipmentKeys = {
  drillDown:       (id: string) => ["shipment", "drill-down", id]  as const,
  driverDrillDown: (id: string) => ["driver",   "drill-down", id]  as const,
  invoiceDrillDown:(id: string) => ["invoice",  "drill-down", id]  as const,
};

// ── Shipment fetcher (unchanged) ──────────────────────────────────────────────

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
    driver:       shipment.driver ?? null,
    client:       shipment.client,
    statusEvents: eventsRes.data,
    auditEntries: auditRes.data,
    anomaly:      null,
  };
}

// ── Driver fetcher ────────────────────────────────────────────────────────────

async function fetchDriverDrillDown(driverId: string): Promise<DriverDrillDownData> {
  const [driverRes, auditRes] = await Promise.all([
    supabase
      .from("drivers")
      .select("*")
      .eq("id", driverId)
      .single(),
    supabase
      .from("audit_log")
      .select("*")
      .eq("record_id", driverId)
      .order("changed_at", { ascending: false }),
  ]);

  if (driverRes.error) throw new Error(`[fetchDriverDrillDown] ${driverRes.error.message}`);
  if (auditRes.error)  throw new Error(`[fetchDriverDrillDown] ${auditRes.error.message}`);

  return {
    driver:       driverRes.data,
    auditEntries: auditRes.data,
    anomaly:      null,
  };
}

// ── Invoice fetcher ───────────────────────────────────────────────────────────

async function fetchInvoiceDrillDown(invoiceId: string): Promise<InvoiceDrillDownData> {
  const [invoiceRes, auditRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, client:clients(*)")
      .eq("id", invoiceId)
      .single(),
    supabase
      .from("audit_log")
      .select("*")
      .eq("record_id", invoiceId)
      .order("changed_at", { ascending: false }),
  ]);

  if (invoiceRes.error) throw new Error(`[fetchInvoiceDrillDown] ${invoiceRes.error.message}`);
  if (auditRes.error)   throw new Error(`[fetchInvoiceDrillDown] ${auditRes.error.message}`);

  const invoice = invoiceRes.data;

  return {
    invoice,
    client:       invoice.client,
    auditEntries: auditRes.data,
    anomaly:      null,
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useDrillDownData(shipmentId: string | null) {
  return useQuery({
    queryKey: shipmentKeys.drillDown(shipmentId ?? ""),
    queryFn:  () => fetchDrillDownData(shipmentId!),
    enabled:  !!shipmentId,
    staleTime: 10_000,
  });
}

export function useDriverDrillDown(driverId: string | null) {
  return useQuery({
    queryKey: shipmentKeys.driverDrillDown(driverId ?? ""),
    queryFn:  () => fetchDriverDrillDown(driverId!),
    enabled:  !!driverId,
    staleTime: 10_000,
  });
}

export function useInvoiceDrillDown(invoiceId: string | null) {
  return useQuery({
    queryKey: shipmentKeys.invoiceDrillDown(invoiceId ?? ""),
    queryFn:  () => fetchInvoiceDrillDown(invoiceId!),
    enabled:  !!invoiceId,
    staleTime: 10_000,
  });
}