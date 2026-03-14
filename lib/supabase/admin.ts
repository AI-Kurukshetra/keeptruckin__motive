import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAppEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

export function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getAppEnv();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
