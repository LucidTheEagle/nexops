// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Core Type Definitions
// Every type justified by a specific UI data requirement from the Flow Maps.
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitives ────────────────────────────────────────────────────────────────

export type SeverityLevel  = "CRITICAL" | "WARNING" | "WATCH";
export type AnomalyStatus  = "OPEN" | "INVESTIGATING" | "RESOLVED";
export type AnomalyType    = "SHIPMENT_DELAYED" | "DRIVER_OFFLINE" | "INVOICE_OVERDUE";
export type EntityType     = "shipment" | "driver" | "invoice";
export type TriggerSource  = "AI" | "MANUAL" | "SYSTEM";
export type RecordedByType = "human" | "ai" | "system";
export type ShipmentStatus = "PENDING" | "IN_TRANSIT" | "DELAYED" | "AT_RISK" | "DELIVERED" | "CANCELLED";
export type DriverStatus   = "ONLINE" | "OFFLINE" | "IDLE";
export type InvoiceStatus  = "PENDING" | "PAID" | "OVERDUE" | "DISPUTED";
export type SLATier        = "GOLD" | "STANDARD";
export type UserRole       = "warehouse_manager" | "finance" | "ceo" | "driver";
export type AuditAccess    = "scoped" | "global" | "read_only";
export type SyncStatus     = "live" | "syncing" | "reconnecting" | "offline";

// ── Coordinates ───────────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id:         string;
  name:       string;
  email:      string;
  role:       UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface Client {
  id:             string;
  name:           string;
  sla_tier:       SLATier;
  industry:       string | null;
  created_at:     string;
  updated_at:     string;
  deleted_at:     string | null;
}

// ── Driver ────────────────────────────────────────────────────────────────────

export interface Driver {
  id:                   string;
  name:                 string;
  avatar_url:           string | null;
  phone:                string | null;
  vehicle_id:           string | null;
  vehicle_type:         string | null;
  current_status:       DriverStatus;
  last_known_location:  string | null;
  coordinates:          Coordinates | null;
  last_seen_at:         string | null;
  created_at:           string;
  updated_at:           string;
  deleted_at:           string | null;
}

// ── Shipment ──────────────────────────────────────────────────────────────────

export interface Shipment {
  id:               string;
  reference_number: string;
  origin:           string;
  destination:      string;
  client_id:        string;
  driver_id:        string | null;
  current_status:   ShipmentStatus;
  sla_tier:         SLATier;
  scheduled_eta:    string | null;
  predicted_eta:    string | null;
  cost_to_serve:    number | null;
  carbon_kg:        number | null;
  created_at:       string;
  updated_at:       string;
  deleted_at:       string | null;
  // Joined
  client?:          Client;
  driver?:          Driver;
}

// ── Status Event ──────────────────────────────────────────────────────────────

export interface StatusEvent {
  id:               string;
  shipment_id:      string;
  status:           ShipmentStatus;
  location:         string | null;
  recorded_by_type: RecordedByType;
  recorded_by_id:   string | null;
  timestamp:        string;
  updated_at:       string;
}

// ── Anomaly ───────────────────────────────────────────────────────────────────

export interface Anomaly {
  id:                  string;
  type:                AnomalyType;
  severity:            SeverityLevel;
  entity_type:         EntityType;
  entity_id:           string;
  entity_label:        string;
  time_delta_minutes:  number | null;
  trigger_source:      TriggerSource;
  anomaly_status:      AnomalyStatus;
  triggered_at:        string;
  actioned_by:         string | null;
  actioned_at:         string | null;
  updated_at:          string;
  deleted_at:          string | null;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id:                     string;
  table_name:             string;
  record_id:              string;
  record_label:           string | null;
  field_changed:          string;
  old_value:              string | null;
  new_value:              string | null;
  changed_by_user_id:     string | null;
  changed_by_name:        string | null;
  role_at_time_of_change: string | null;
  trigger_source:         "manual" | "ai" | "system";
  trigger_detail:         string | null;
  changed_at:             string;
}

// ── Invoice ───────────────────────────────────────────────────────────────────

export interface Invoice {
  id:          string;
  client_id:   string;
  shipment_id: string | null;
  amount:      number;
  status:      InvoiceStatus;
  due_date:    string | null;
  created_at:  string;
  updated_at:  string;
  deleted_at:  string | null;
}

// ── KPI Metrics ───────────────────────────────────────────────────────────────

export interface KPIMetrics {
  otif_rate:           number;
  avg_cost_to_serve:   number;
  total_carbon_kg:     number;
  on_time_percentage:  number;
  active_shipments:    number;
  critical_anomalies:  number;
  computed_at:         string;
}

// ── Ghost UI Role Config ──────────────────────────────────────────────────────

export interface RoleConfig {
  role:                  UserRole;
  label:                 string;
  description:           string;
  visibleModules:        string[];
  anomalySeverityFilter: SeverityLevel[];
  auditAccess:           AuditAccess;
  commandPaletteItems:   string[];
}

// ── Sync State ────────────────────────────────────────────────────────────────

export interface SyncState {
  status:      SyncStatus;
  last_synced: string | null;
  pending_ops: number;
}

// ── User Session ──────────────────────────────────────────────────────────────

export interface UserSession {
  id:            string;
  user_id:       string;
  role_override: UserRole | null;
  created_at:    string;
  updated_at:    string;
}

// ── Drill-Down Drawer ─────────────────────────────────────────────────────────
export interface DrillDownData {
  shipment:     Shipment;
  driver:       Driver | null;
  client:       Client;
  statusEvents: StatusEvent[];
  auditEntries: AuditLogEntry[];
  anomaly:      Anomaly | null;
}

export interface DriverDrillDownData {
  driver:       Driver;
  auditEntries: AuditLogEntry[];
  anomaly:      Anomaly | null;
}

export interface InvoiceDrillDownData {
  invoice:      Invoice;
  client:       Client;
  auditEntries: AuditLogEntry[];
  anomaly:      Anomaly | null;
}

// ── API Wrappers ──────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data:  T;
  error: null;
}

export interface ApiError {
  data:   null;
  error:  string;
  code?:  string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;