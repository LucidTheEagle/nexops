// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SeverityLevel, AnomalyStatus, SyncStatus } from "@/types";

// ── Class Name Merger ─────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Severity ──────────────────────────────────────────────────────────────────

export function getSeverityClasses(severity: SeverityLevel): {
  text:   string;
  bg:     string;
  border: string;
} {
  const map: Record<SeverityLevel, { text: string; bg: string; border: string }> = {
    CRITICAL: {
      text:   "text-[#F43F5E]",
      bg:     "bg-[#F43F5E]/10",
      border: "border-[#F43F5E]/30",
    },
    WARNING: {
      text:   "text-[#F59E0B]",
      bg:     "bg-[#F59E0B]/10",
      border: "border-[#F59E0B]/30",
    },
    WATCH: {
      text:   "text-[#6366F1]",
      bg:     "bg-[#6366F1]/10",
      border: "border-[#6366F1]/30",
    },
  };
  return map[severity];
}

export const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  CRITICAL: 0,
  WARNING:  1,
  WATCH:    2,
};

export function sortBySeverity<T extends { severity: SeverityLevel; triggered_at: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const diff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (diff !== 0) return diff;
    return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
  });
}

// ── Anomaly Status ────────────────────────────────────────────────────────────

export function getAnomalyStatusClasses(status: AnomalyStatus): {
  text: string;
  bg:   string;
} {
  const map: Record<AnomalyStatus, { text: string; bg: string }> = {
    OPEN:          { text: "text-[#F43F5E]", bg: "bg-[#F43F5E]/10" },
    INVESTIGATING: { text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
    RESOLVED:      { text: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  };
  return map[status];
}

// ── Sync Status ───────────────────────────────────────────────────────────────

export function getSyncStatusConfig(status: SyncStatus): {
  label: string;
  color: string;
} {
  const map: Record<SyncStatus, { label: string; color: string }> = {
    live:         { label: "Live",         color: "#10B981" },
    syncing:      { label: "Syncing...",   color: "#F59E0B" },
    reconnecting: { label: "Reconnecting", color: "#F59E0B" },
    offline:      { label: "Offline",      color: "#6B7280" },
  };
  return map[status];
}

// ── Time Formatting ───────────────────────────────────────────────────────────

export function formatTimeDelta(minutes: number): string {
  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}

export function formatRelativeTime(isoTimestamp: string): string {
  const diffMin = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 60_000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function formatAbsoluteTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-GB", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ── Number Formatting ─────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style:                "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCarbon(kg: number): string {
  if (kg < 1000) return `${kg.toFixed(1)} kg`;
  return `${(kg / 1000).toFixed(2)} t`;
}

// ── ID Helpers ────────────────────────────────────────────────────────────────

export function shortId(uuid: string): string {
  return `#${uuid.slice(0, 4).toUpperCase()}`;
}

export function getAnomalyDescription(
  type: string,
  entityLabel: string,
  timeDeltaMinutes: number | null
): string {
  const delta = timeDeltaMinutes !== null ? ` — ${formatTimeDelta(timeDeltaMinutes)}` : "";
  const map: Record<string, string> = {
    SHIPMENT_DELAYED: `${entityLabel} is delayed${delta}`,
    DRIVER_OFFLINE:   `${entityLabel} has been offline${delta}`,
    INVOICE_OVERDUE:  `${entityLabel} is overdue${delta}`,
  };
  return map[type] ?? `${entityLabel}${delta}`;
}