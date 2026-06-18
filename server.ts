import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service role key bypasses row level security. Only ever call this from
// API routes / server code that has already done its own authorization
// checks — never expose this client or key to the browser.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
