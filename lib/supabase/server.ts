// ─────────────────────────────────────────────────────────────────────────────
// NexOps — Supabase Server Client
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl         = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error(
    "[NexOps] Missing Supabase server env vars. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken:  false,
    persistSession:    false,
  },
});