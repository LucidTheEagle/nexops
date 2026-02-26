"use client";

import { useEffect, useRef }  from "react";
import { useAppStore }        from "@/lib/stores/app.store";
import {
  useDrillDownData,
  useDriverDrillDown,
  useInvoiceDrillDown,
}                             from "@/lib/hooks/useShipment";
import { AuditEntry }         from "@/components/audit/AuditEntry";
import {
  formatRelativeTime,
  formatAbsoluteTime,
  formatCurrency,
  formatCarbon,
} from "@/lib/utils";
import type { StatusEvent, AuditLogEntry } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "var(--color-text-muted)",
  IN_TRANSIT: "var(--color-indigo)",
  AT_RISK:    "var(--color-warning)",
  DELAYED:    "var(--color-critical)",
  DELIVERED:  "var(--color-live)",
  CANCELLED:  "var(--color-offline)",
};

const RECORDED_BY_LABEL: Record<string, string> = {
  human:  "Manual",
  ai:     "AI",
  system: "System",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING:  "var(--color-text-muted)",
  PAID:     "var(--color-live)",
  OVERDUE:  "var(--color-critical)",
  DISPUTED: "var(--color-warning)",
};

// ── Focus Trap ────────────────────────────────────────────────────────────────

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const container = containerRef.current;

    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const els = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (els.length === 0) return;
      const firstEl = els[0];
      const lastEl  = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      } else {
        if (document.activeElement === lastEl)  { e.preventDefault(); firstEl.focus(); }
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef]);
}

// ── Shared layout primitives ──────────────────────────────────────────────────

function DrawerShell({
  children,
  drawerRef,
  onClose,
}: {
  children:  React.ReactNode;
  drawerRef: React.RefObject<HTMLElement | null>;
  onClose:   () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40"
        aria-hidden="true"
        style={{ background: "rgba(15,10,30,0.5)" }}
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 bottom-0 z-41 flex flex-col overflow-y-auto"
        style={{
          width:      "min(480px, 92vw)",
          background: "var(--color-overlay)",
          borderLeft: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10 border-b shrink-0"
          style={{ background: "var(--color-overlay)", borderColor: "var(--color-border)" }}
        >
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
          >
            Detail View
          </span>
          <button
            onClick={onClose}
            aria-label="Close detail view"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-[11px] transition-colors duration-150 ease-out"
            style={{
              background: "transparent",
              border:     "1px solid var(--color-border)",
              color:      "var(--color-text-muted)",
              fontFamily: "var(--font-mono)",
              cursor:     "pointer",
            }}
          >
            ESC
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-5 flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[60px] rounded-lg animate-pulse"
          style={{ background: "var(--color-raised)" }}
        />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-5">
      <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-critical)" }}>
        {message}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[9px] uppercase tracking-widest mb-3"
      style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
    >
      {children}
    </p>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[9px] uppercase tracking-widest mb-0.5"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function AuditSection({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <section className="p-5">
      <SectionLabel>Audit Trace</SectionLabel>
      <p
        className="text-[10px] mb-4"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
      >
        {entries.length} entries for this record
      </p>
      {entries.length === 0 && (
        <p
          className="text-[11px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
        >
          No changes recorded yet.
        </p>
      )}
      {entries.map((entry) => (
        <AuditEntry key={entry.id} entry={entry} />
      ))}
    </section>
  );
}

// ── Shipment Drawer Content ───────────────────────────────────────────────────

function ShipmentContent({ shipmentId }: { shipmentId: string }) {
  const { data, isLoading, isError } = useDrillDownData(shipmentId);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !data) return <ErrorState message="Failed to load shipment data." />;

  return (
    <div className="flex-1">
      {/* Header */}
      <section className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
          >
            #{data.shipment.reference_number}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              fontFamily:  "var(--font-mono)",
              color:       STATUS_COLORS[data.shipment.current_status] ?? "var(--color-text-muted)",
              background:  `${STATUS_COLORS[data.shipment.current_status]}18`,
            }}
          >
            {data.shipment.current_status.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
            {data.shipment.origin}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>→</span>
          <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
            {data.shipment.destination}
          </span>
        </div>

        <div className="flex gap-4 mb-4">
          <MetaField label="Scheduled ETA">
            <p className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
              {data.shipment.scheduled_eta ? formatAbsoluteTime(data.shipment.scheduled_eta) : "—"}
            </p>
          </MetaField>
          <MetaField label="Predicted ETA">
            <p className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-warning)" }}>
              {data.shipment.predicted_eta ? formatAbsoluteTime(data.shipment.predicted_eta) : "—"}
            </p>
          </MetaField>
        </div>

        <div className="flex flex-wrap gap-4">
          <MetaField label="Client">
            <p className="text-[12px]" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
              {data.client.name}
            </p>
          </MetaField>
          <MetaField label="SLA">
            <p className="text-[12px]" style={{
              fontFamily: "var(--font-mono)",
              color: data.shipment.sla_tier === "GOLD" ? "var(--color-warning)" : "var(--color-text-muted)",
            }}>
              {data.shipment.sla_tier}
            </p>
          </MetaField>
          {data.shipment.cost_to_serve && (
            <MetaField label="Cost to Serve">
              <p className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                {formatCurrency(data.shipment.cost_to_serve)}
              </p>
            </MetaField>
          )}
          {data.shipment.carbon_kg && (
            <MetaField label="Carbon">
              <p className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-live)" }}>
                {formatCarbon(data.shipment.carbon_kg)}
              </p>
            </MetaField>
          )}
        </div>
      </section>

      {/* Driver */}
      {data.driver && (
        <section className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <SectionLabel>Live Driver</SectionLabel>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
                {data.driver.name}
              </p>
              {data.driver.phone && (
                <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-indigo)" }}>
                  {data.driver.phone}
                </p>
              )}
            </div>
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                fontFamily:  "var(--font-mono)",
                color:       data.driver.current_status === "ONLINE" ? "var(--color-live)" : "var(--color-offline)",
                background:  data.driver.current_status === "ONLINE" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
              }}
            >
              {data.driver.current_status}
            </span>
          </div>
          {data.driver.vehicle_id && (
            <div className="flex gap-4 mb-2.5">
              <MetaField label="Vehicle">
                <p className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                  {data.driver.vehicle_id} — {data.driver.vehicle_type}
                </p>
              </MetaField>
            </div>
          )}
          {data.driver.last_known_location && (
            <div className="rounded-md px-3 py-2" style={{ background: "var(--color-raised)", border: "1px solid var(--color-border)" }}>
              <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                Last Known Location
              </p>
              <p className="text-[12px] mb-0.5" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
                {data.driver.last_known_location}
              </p>
              {data.driver.last_seen_at && (
                <p className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                  {formatRelativeTime(data.driver.last_seen_at)}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Timeline */}
      {data.statusEvents.length > 0 && (
        <section className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <SectionLabel>Shipment Timeline</SectionLabel>
          <div className="flex flex-col">
            {data.statusEvents.map((event: StatusEvent, index: number) => (
              <div key={event.id} className="flex gap-3 relative">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{ background: index === 0 ? (STATUS_COLORS[event.status] ?? "var(--color-indigo)") : "var(--color-border)" }}
                  />
                  {index < data.statusEvents.length - 1 && (
                    <div className="w-px flex-1 min-h-[20px]" style={{ background: "var(--color-border)" }} />
                  )}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] uppercase tracking-widest"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: index === 0 ? 700 : 400,
                        color:      index === 0 ? (STATUS_COLORS[event.status] ?? "var(--color-text-primary)") : "var(--color-text-primary)",
                      }}
                    >
                      {event.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-muted)" }}>
                      {event.location}
                    </p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                    {RECORDED_BY_LABEL[event.recorded_by_type]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AuditSection entries={data.auditEntries} />
    </div>
  );
}

// ── Driver Drawer Content ─────────────────────────────────────────────────────

function DriverContent({ driverId }: { driverId: string }) {
  const { data, isLoading, isError } = useDriverDrillDown(driverId);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !data) return <ErrorState message="Failed to load driver data." />;

  return (
    <div className="flex-1">
      <section className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[18px] font-bold mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
              {data.driver.name}
            </p>
            {data.driver.phone && (
              <p className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-indigo)" }}>
                {data.driver.phone}
              </p>
            )}
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              fontFamily:  "var(--font-mono)",
              color:       data.driver.current_status === "ONLINE" ? "var(--color-live)" : "var(--color-offline)",
              background:  data.driver.current_status === "ONLINE" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
            }}
          >
            {data.driver.current_status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          {data.driver.vehicle_id && (
            <MetaField label="Vehicle">
              <p className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                {data.driver.vehicle_id} — {data.driver.vehicle_type}
              </p>
            </MetaField>
          )}
          {data.driver.last_known_location && (
            <MetaField label="Last Known Location">
              <p className="text-[12px]" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
                {data.driver.last_known_location}
              </p>
            </MetaField>
          )}
        </div>

        {data.driver.last_seen_at && (
          <p className="text-[10px] mt-3" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            Last seen {formatRelativeTime(data.driver.last_seen_at)}
          </p>
        )}
      </section>

      <AuditSection entries={data.auditEntries} />
    </div>
  );
}

// ── Invoice Drawer Content ────────────────────────────────────────────────────

function InvoiceContent({ invoiceId }: { invoiceId: string }) {
  const { data, isLoading, isError } = useInvoiceDrillDown(invoiceId);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !data) return <ErrorState message="Failed to load invoice data." />;

  return (
    <div className="flex-1">
      <section className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
          >
            Invoice
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              fontFamily:  "var(--font-mono)",
              color:       INVOICE_STATUS_COLORS[data.invoice.status] ?? "var(--color-text-muted)",
              background:  `${INVOICE_STATUS_COLORS[data.invoice.status]}18`,
            }}
          >
            {data.invoice.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          <MetaField label="Client">
            <p className="text-[13px] font-medium" style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
              {data.client.name}
            </p>
          </MetaField>
          <MetaField label="Amount">
            <p className="text-[18px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
              {formatCurrency(data.invoice.amount)}
            </p>
          </MetaField>
          {data.invoice.due_date && (
            <MetaField label="Due Date">
              <p
                className="text-[12px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: data.invoice.status === "OVERDUE" ? "var(--color-critical)" : "var(--color-text-primary)",
                }}
              >
                {formatAbsoluteTime(data.invoice.due_date)}
              </p>
            </MetaField>
          )}
          <MetaField label="SLA Tier">
            <p
              className="text-[12px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: data.client.sla_tier === "GOLD" ? "var(--color-warning)" : "var(--color-text-muted)",
              }}
            >
              {data.client.sla_tier}
            </p>
          </MetaField>
        </div>
      </section>

      <AuditSection entries={data.auditEntries} />
    </div>
  );
}

// ── Root Drawer ───────────────────────────────────────────────────────────────

export function DrillDownDrawer() {
  const drawerOpen      = useAppStore((s) => s.drawerOpen);
  const selectedAnomaly = useAppStore((s) => s.selectedAnomaly);
  const closeDrawer     = useAppStore((s) => s.closeDrawer);
  const drawerRef       = useRef<HTMLElement>(null);

  useFocusTrap(drawerOpen, drawerRef);

  useEffect(() => {
    if (!drawerOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen || !selectedAnomaly) return null;

  return (
    <DrawerShell drawerRef={drawerRef} onClose={closeDrawer}>
      {selectedAnomaly.entity_type === "shipment" && (
        <ShipmentContent shipmentId={selectedAnomaly.entity_id} />
      )}
      {selectedAnomaly.entity_type === "driver" && (
        <DriverContent driverId={selectedAnomaly.entity_id} />
      )}
      {selectedAnomaly.entity_type === "invoice" && (
        <InvoiceContent invoiceId={selectedAnomaly.entity_id} />
      )}
    </DrawerShell>
  );
}