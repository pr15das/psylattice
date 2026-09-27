import "server-only";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export function researchAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Research service database environment variables are incomplete.");
  }

  return createSupabaseAdmin(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
