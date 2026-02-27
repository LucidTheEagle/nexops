// components/ui/Toast.tsx
"use client";

import { useEffect }   from "react";
import { useAppStore } from "@/lib/stores/app.store";

export function Toast() {
  const toast    = useAppStore((s) => s.toast);
  const setToast = useAppStore((s) => s.setToast);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 px-4 py-3 rounded-lg text-[12px] font-semibold tracking-wide transition-all duration-150 ease-out"
      style={{
        fontFamily:  "var(--font-mono)",
        background:  toast.type === "error" ? "rgba(244,63,94,0.15)" : "rgba(16,185,129,0.15)",
        border:      `1px solid ${toast.type === "error" ? "var(--color-critical)" : "var(--color-live)"}`,
        color:       toast.type === "error" ? "var(--color-critical)" : "var(--color-live)",
        boxShadow:   "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {toast.message}
    </div>
  );
}