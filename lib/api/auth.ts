import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

const READ_ROLES = ["owner", "admin", "dispatcher", "driver", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin", "dispatcher"] as const;

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function hasCompanyAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  companyId: string,
  options?: {
    write?: boolean;
  }
) {
  const allowedRoles = options?.write ? [...WRITE_ROLES] : [...READ_ROLES];

  const { data, error } = await supabase
    .from("company_members")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .in("role", allowedRoles)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}
