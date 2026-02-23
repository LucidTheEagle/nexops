// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Ghost UI Role Configuration
// Single source of truth for all role-based rendering.
// NEVER check role strings inline in components.
// ALWAYS derive behaviour from getRoleConfig(role).
// ─────────────────────────────────────────────────────────────────────────────

import type { RoleConfig, UserRole, SeverityLevel } from "@/types";

// ── Warehouse Manager ─────────────────────────────────────────────────────────

const warehouseManager: RoleConfig = {
  role:        "warehouse_manager",
  label:       "Warehouse Manager",
  description: "Full operational control. All anomalies. Live driver detail.",
  visibleModules: [
    "action_queue",
    "drill_down_drawer",
    "audit_trace_scoped",
    "command_palette",
    "sync_status",
  ],
  anomalySeverityFilter: ["CRITICAL", "WARNING", "WATCH"],
  auditAccess:           "scoped",
  commandPaletteItems:   ["Shipments", "Drivers", "Active Routes"],
};

// ── CEO ───────────────────────────────────────────────────────────────────────

const ceo: RoleConfig = {
  role:        "ceo",
  label:       "CEO",
  description: "Business performance view. KPIs, critical escalations, full audit visibility.",
  visibleModules: [
    "kpi_dashboard",
    "action_queue_condensed",
    "audit_trace_global",
    "command_palette",
  ],
  anomalySeverityFilter: ["CRITICAL"],
  auditAccess:           "read_only",
  commandPaletteItems:   ["Reports", "KPIs", "Team"],
};

// ── Finance ───────────────────────────────────────────────────────────────────

const finance: RoleConfig = {
  role:        "finance",
  label:       "Finance Lead",
  description: "Invoice management and cost tracking.",
  visibleModules: [
    "invoices",
    "kpi_dashboard",
    "audit_trace_global",
    "command_palette",
  ],
  anomalySeverityFilter: ["CRITICAL", "WARNING"],
  auditAccess:           "global",
  commandPaletteItems:   ["Invoices", "Reports", "Clients"],
};

// ── Driver ────────────────────────────────────────────────────────────────────

const driver: RoleConfig = {
  role:        "driver",
  label:       "Field Driver",
  description: "Active route and delivery status.",
  visibleModules: [
    "active_route",
    "delivery_status",
  ],
  anomalySeverityFilter: ["CRITICAL"],
  auditAccess:           "scoped",
  commandPaletteItems:   ["My Route", "Support"],
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  warehouse_manager: warehouseManager,
  ceo,
  finance,
  driver,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role];
}

export function isModuleVisible(role: UserRole, module: string): boolean {
  return ROLE_CONFIGS[role].visibleModules.includes(module);
}

export function getSeverityFilter(role: UserRole): SeverityLevel[] {
  return ROLE_CONFIGS[role].anomalySeverityFilter;
}

export const MVP_DEMO_ROLES: UserRole[] = [
  "warehouse_manager",
  "ceo",
];

export function getRoleLabel(role: UserRole): string {
  return ROLE_CONFIGS[role].label;
}