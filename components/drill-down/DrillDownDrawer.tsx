"use client";

import { useEffect, useRef }  from "react";
import { useAppStore }        from "@/lib/stores/app.store";
import { useDrillDownData }   from "@/lib/hooks/useShipment";
import { AuditEntry }         from "@/components/audit/AuditEntry";
import {
  formatRelativeTime,
  formatAbsoluteTime,
  formatCurrency,
  formatCarbon,
} from "@/lib/utils";
import type { StatusEvent } from "@/types";

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

// ── Focus Trap ────────────────────────────────────────────────────────────────
// Captures Tab/Shift+Tab inside the drawer. No external library.

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Focus the first focusable element on open
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      // Re-query in case DOM changed
      const els = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (els.length === 0) return;

      const firstEl = els[0];
      const lastEl  = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef]);
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export function DrillDownDrawer() {
  const drawerOpen      = useAppStore((s) => s.drawerOpen);
  const selectedAnomaly = useAppStore((s) => s.selectedAnomaly);
  const closeDrawer     = useAppStore((s) => s.closeDrawer);
  const drawerRef       = useRef<HTMLElement>(null);

  const shipmentId = selectedAnomaly?.entity_type === "shipment"
    ? selectedAnomaly.entity_id
    : null;

  const { data, isLoading, isError } = useDrillDownData(shipmentId);

  useFocusTrap(drawerOpen, drawerRef);

  // Close on Escape — redundant with focus trap but explicit
  useEffect(() => {
    if (!drawerOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 z-40"
        aria-hidden="true"
        style={{ background: "rgba(15,10,30,0.5)" }}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shipment detail"
        className="fixed top-0 right-0 bottom-0 z-41 flex flex-col overflow-y-auto"
        style={{
          width:      "min(480px, 92vw)",
          background: "var(--color-overlay)",
          borderLeft: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10 border-b"
          style={{
            background:   "var(--color-overlay)",
            borderColor:  "var(--color-border)",
          }}
        >
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
          >
            Shipment Detail
          </span>
          {/* Close — min 44px touch target */}
          <button
            onClick={closeDrawer}
            aria-label="Close shipment detail"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-[11px] transition-colors duration-150 ease-out hover:brightness-125"
            style={{
              background:  "transparent",
              border:      "1px solid var(--color-border)",
              color:       "var(--color-text-muted)",
              fontFamily:  "var(--font-mono)",
              cursor:      "pointer",
            }}
          >
            ESC
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[60px] rounded-lg animate-pulse"
                style={{ background: "var(--color-raised)" }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="p-5">
            <p
              className="text-xs"
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-critical)" }}
            >
              Failed to load shipment data.
            </p>
          </div>
        )}

        {/* Content */}
        {data && (
          <div className="flex-1">

            {/* ── Section A: Shipment Header ── */}
            <section
              className="p-5 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
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
                <span
                  className="text-[13px] font-medium"
                  style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}
                >
                  {data.shipment.origin}
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>→</span>
                <span
                  className="text-[13px] font-medium"
                  style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}
                >
                  {data.shipment.destination}
                </span>
              </div>

              <div className="flex gap-4 mb-4">
                <div>
                  <p
                    className="text-[9px] uppercase tracking-widest mb-0.5"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                  >
                    Scheduled ETA
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
                  >
                    {data.shipment.scheduled_eta ? formatAbsoluteTime(data.shipment.scheduled_eta) : "—"}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[9px] uppercase tracking-widest mb-0.5"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-warning)" }}
                  >
                    Predicted ETA
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-warning)" }}
                  >
                    {data.shipment.predicted_eta ? formatAbsoluteTime(data.shipment.predicted_eta) : "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <p
                    className="text-[9px] uppercase tracking-widest mb-0.5"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                  >
                    Client
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}
                  >
                    {data.client.name}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[9px] uppercase tracking-widest mb-0.5"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                  >
                    SLA
                  </p>
                  <p
                    className="text-[12px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: data.shipment.sla_tier === "GOLD"
                        ? "var(--color-warning)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {data.shipment.sla_tier}
                  </p>
                </div>
                {data.shipment.cost_to_serve && (
                  <div>
                    <p
                      className="text-[9px] uppercase tracking-widest mb-0.5"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                    >
                      Cost to Serve
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
                    >
                      {formatCurrency(data.shipment.cost_to_serve)}
                    </p>
                  </div>
                )}
                {data.shipment.carbon_kg && (
                  <div>
                    <p
                      className="text-[9px] uppercase tracking-widest mb-0.5"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                    >
                      Carbon
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-live)" }}
                    >
                      {formatCarbon(data.shipment.carbon_kg)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ── Section B: Live Driver Panel ── */}
            {data.driver && (
              <section
                className="p-5 border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p
                  className="text-[9px] uppercase tracking-widest mb-3"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                >
                  Live Driver
                </p>

                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <p
                      className="text-sm font-semibold mb-0.5"
                      style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}
                    >
                      {data.driver.name}
                    </p>
                    {data.driver.phone && (
                      <p
                        className="text-[11px]"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--color-indigo)" }}
                      >
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
                    <div>
                      <p
                        className="text-[9px] uppercase tracking-widest mb-0.5"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                      >
                        Vehicle
                      </p>
                      <p
                        className="text-[12px]"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
                      >
                        {data.driver.vehicle_id} — {data.driver.vehicle_type}
                      </p>
                    </div>
                  </div>
                )}

                {data.driver.last_known_location && (
                  <div
                    className="rounded-md px-3 py-2"
                    style={{
                      background: "var(--color-raised)",
                      border:     "1px solid var(--color-border)",
                    }}
                  >
                    <p
                      className="text-[9px] uppercase tracking-widest mb-0.5"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                    >
                      Last Known Location
                    </p>
                    <p
                      className="text-[12px] mb-0.5"
                      style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}
                    >
                      {data.driver.last_known_location}
                    </p>
                    {data.driver.last_seen_at && (
                      <p
                        className="text-[10px]"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                      >
                        {formatRelativeTime(data.driver.last_seen_at)}
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── Section C: Shipment Timeline ── */}
            {data.statusEvents.length > 0 && (
              <section
                className="p-5 border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p
                  className="text-[9px] uppercase tracking-widest mb-4"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                >
                  Shipment Timeline
                </p>

                <div className="flex flex-col">
                  {data.statusEvents.map((event: StatusEvent, index: number) => (
                    <div key={event.id} className="flex gap-3 relative">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className="w-2 h-2 rounded-full mt-1 shrink-0"
                          style={{
                            background: index === 0
                              ? (STATUS_COLORS[event.status] ?? "var(--color-indigo)")
                              : "var(--color-border)",
                          }}
                        />
                        {index < data.statusEvents.length - 1 && (
                          <div
                            className="w-px flex-1 min-h-[20px]"
                            style={{ background: "var(--color-border)" }}
                          />
                        )}
                      </div>

                      <div className="pb-4 flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[11px] uppercase tracking-widest"
                            style={{
                              fontFamily:  "var(--font-mono)",
                              fontWeight:  index === 0 ? 700 : 400,
                              color:       index === 0
                                ? (STATUS_COLORS[event.status] ?? "var(--color-text-primary)")
                                : "var(--color-text-primary)",
                            }}
                          >
                            {event.status.replace("_", " ")}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                          >
                            {formatRelativeTime(event.timestamp)}
                          </span>
                        </div>
                        {event.location && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-muted)" }}
                          >
                            {event.location}
                          </p>
                        )}
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                        >
                          {RECORDED_BY_LABEL[event.recorded_by_type]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Section D: Scoped Audit Trace ── */}
            <section className="p-5">
              <p
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
              >
                Audit Trace
              </p>
              <p
                className="text-[10px] mb-4"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
              >
                {data.auditEntries.length} entries for this record
              </p>

              {data.auditEntries.length === 0 && (
                <p
                  className="text-[11px]"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                >
                  No changes recorded yet.
                </p>
              )}

              {data.auditEntries.map((entry) => (
                <AuditEntry key={entry.id} entry={entry} />
              ))}
            </section>
          </div>
        )}
      </aside>
    </>
  );
}