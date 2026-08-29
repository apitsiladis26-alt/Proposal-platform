import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. This is the actual security
 * boundary for every public-facing route (/p/[slug], sign, checkout, the
 * Stripe webhook): only import this from server-only files under app/api/**
 * or app/p/[slug]/page.tsx, and always validate the state transition
 * yourself (e.g. don't sign an already-signed proposal) since RLS won't.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
