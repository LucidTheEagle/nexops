// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Drill-Down Drawer
// Slides in from right on anomaly card click.
// Four sections per Flow Map 2: Header, Driver, Timeline, Audit.
// Never navigates — context is never lost.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useAppStore }      from "@/lib/stores/app.store";
import { useDrillDownData } from "@/lib/hooks/useShipment";
import { AuditEntry }       from "@/components/audit/AuditEntry";
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

export function DrillDownDrawer() {
  const drawerOpen      = useAppStore((s) => s.drawerOpen);
  const selectedAnomaly = useAppStore((s) => s.selectedAnomaly);
  const closeDrawer     = useAppStore((s) => s.closeDrawer);

  // Only fetch for shipment anomalies for now
  const shipmentId = selectedAnomaly?.entity_type === "shipment"
    ? selectedAnomaly.entity_id
    : null;

  const { data, isLoading, isError } = useDrillDownData(shipmentId);

  if (!drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        style={{
          position:   "fixed",
          inset:      0,
          zIndex:     40,
          background: "rgba(15,10,30,0.5)",
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position:      "fixed",
          top:           0,
          right:         0,
          bottom:        0,
          width:         "min(480px, 92vw)",
          zIndex:        41,
          background:    "var(--color-overlay)",
          borderLeft:    "1px solid var(--color-border)",
          display:       "flex",
          flexDirection: "column",
          overflowY:     "auto",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "16px 20px",
            borderBottom:   "1px solid var(--color-border)",
            position:       "sticky",
            top:            0,
            background:     "var(--color-overlay)",
            zIndex:         1,
          }}
        >
          <span
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "11px",
              color:         "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Shipment Detail
          </span>
          <button
            onClick={closeDrawer}
            style={{
              background:   "transparent",
              border:       "1px solid var(--color-border)",
              borderRadius: "6px",
              padding:      "4px 10px",
              color:        "var(--color-text-muted)",
              fontFamily:   "var(--font-mono)",
              fontSize:     "11px",
              cursor:       "pointer",
            }}
          >
            ESC
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height:       "60px",
                  background:   "var(--color-raised)",
                  borderRadius: "8px",
                  animation:    "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ padding: "24px 20px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-critical)" }}>
              Failed to load shipment data.
            </p>
          </div>
        )}

        {/* Content */}
        {data && (
          <div style={{ flex: 1 }}>

            {/* ── Section A: Shipment Header ── */}
            <section style={{ padding: "20px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "11px",
                    color:         "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  #{data.shipment.reference_number}
                </span>
                <span
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "10px",
                    fontWeight:    700,
                    color:         STATUS_COLORS[data.shipment.current_status] ?? "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding:       "3px 8px",
                    borderRadius:  "4px",
                    background:    `${STATUS_COLORS[data.shipment.current_status]}18`,
                  }}
                >
                  {data.shipment.current_status.replace("_", " ")}
                </span>
              </div>

              {/* Origin → Destination */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {data.shipment.origin}
                </span>
                <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>→</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {data.shipment.destination}
                </span>
              </div>

              {/* ETA comparison */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                    Scheduled ETA
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-primary)", margin: 0 }}>
                    {data.shipment.scheduled_eta
                      ? formatAbsoluteTime(data.shipment.scheduled_eta)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                    Predicted ETA
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-warning)", margin: 0 }}>
                    {data.shipment.predicted_eta
                      ? formatAbsoluteTime(data.shipment.predicted_eta)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Client + SLA + Cost */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                    Client
                  </p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-text-primary)", margin: 0 }}>
                    {data.client.name}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                    SLA
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: data.shipment.sla_tier === "GOLD" ? "var(--color-warning)" : "var(--color-text-muted)", margin: 0 }}>
                    {data.shipment.sla_tier}
                  </p>
                </div>
                {data.shipment.cost_to_serve && (
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                      Cost to Serve
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-primary)", margin: 0 }}>
                      {formatCurrency(data.shipment.cost_to_serve)}
                    </p>
                  </div>
                )}
                {data.shipment.carbon_kg && (
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                      Carbon
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-live)", margin: 0 }}>
                      {formatCarbon(data.shipment.carbon_kg)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ── Section B: Live Driver Panel ── */}
            {data.driver && (
              <section style={{ padding: "20px", borderBottom: "1px solid var(--color-border)" }}>
                <p
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "9px",
                    color:         "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    margin:        "0 0 12px 0",
                  }}
                >
                  Live Driver
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 2px 0" }}>
                      {data.driver.name}
                    </p>
                    {data.driver.phone && (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-indigo)", margin: 0 }}>
                        {data.driver.phone}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily:    "var(--font-mono)",
                      fontSize:      "9px",
                      fontWeight:    700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding:       "3px 8px",
                      borderRadius:  "4px",
                      color:         data.driver.current_status === "ONLINE" ? "var(--color-live)" : "var(--color-offline)",
                      background:    data.driver.current_status === "ONLINE" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                    }}
                  >
                    {data.driver.current_status}
                  </span>
                </div>

                {/* Vehicle */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
                  {data.driver.vehicle_id && (
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                        Vehicle
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-primary)", margin: 0 }}>
                        {data.driver.vehicle_id} — {data.driver.vehicle_type}
                      </p>
                    </div>
                  )}
                </div>

                {/* Last known location — human label, never raw coords */}
                {data.driver.last_known_location && (
                  <div
                    style={{
                      background:   "var(--color-raised)",
                      border:       "1px solid var(--color-border)",
                      borderRadius: "6px",
                      padding:      "8px 12px",
                    }}
                  >
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
                      Last Known Location
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-text-primary)", margin: "0 0 2px 0" }}>
                      {data.driver.last_known_location}
                    </p>
                    {data.driver.last_seen_at && (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-muted)", margin: 0 }}>
                        {formatRelativeTime(data.driver.last_seen_at)}
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── Section C: Shipment Timeline ── */}
            {data.statusEvents.length > 0 && (
              <section style={{ padding: "20px", borderBottom: "1px solid var(--color-border)" }}>
                <p
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "9px",
                    color:         "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    margin:        "0 0 16px 0",
                  }}
                >
                  Shipment Timeline
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {data.statusEvents.map((event: StatusEvent, index: number) => (
                    <div
                      key={event.id}
                      style={{
                        display:  "flex",
                        gap:      "12px",
                        position: "relative",
                      }}
                    >
                      {/* Timeline line */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div
                          style={{
                            width:        "8px",
                            height:       "8px",
                            borderRadius: "50%",
                            background:   index === 0 ? STATUS_COLORS[event.status] ?? "var(--color-indigo)" : "var(--color-border)",
                            marginTop:    "4px",
                            flexShrink:   0,
                          }}
                        />
                        {index < data.statusEvents.length - 1 && (
                          <div style={{ width: "1px", flex: 1, background: "var(--color-border)", minHeight: "20px" }} />
                        )}
                      </div>

                      {/* Event content */}
                      <div style={{ paddingBottom: "16px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span
                            style={{
                              fontFamily:    "var(--font-mono)",
                              fontSize:      "11px",
                              fontWeight:    index === 0 ? 700 : 400,
                              color:         index === 0 ? STATUS_COLORS[event.status] ?? "var(--color-text-primary)" : "var(--color-text-primary)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {event.status.replace("_", " ")}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-muted)" }}>
                            {formatRelativeTime(event.timestamp)}
                          </span>
                        </div>
                        {event.location && (
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-text-muted)", margin: "2px 0 0 0" }}>
                            {event.location}
                          </p>
                        )}
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-muted)", margin: "2px 0 0 0" }}>
                          {RECORDED_BY_LABEL[event.recorded_by_type]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Section D: Scoped Audit Trace ── */}
            <section style={{ padding: "20px" }}>
              <p
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "9px",
                  color:         "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin:        "0 0 4px 0",
                }}
              >
                Audit Trace
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-muted)", margin: "0 0 16px 0" }}>
                {data.auditEntries.length} entries for this record
              </p>

              {data.auditEntries.length === 0 && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-muted)" }}>
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