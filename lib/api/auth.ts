import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_ROLES, isCompanyRole, type CompanyRole } from "@/lib/permissions";
import type { Database } from "@/types/supabase";

const READ_ROLES = [...COMPANY_ROLES] as const;
const WRITE_ROLES: readonly CompanyRole[] = ["owner", "admin", "dispatcher"] as const;

type CompanyRoleData = { role: string };

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function getCompanyRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  companyId: string
): Promise<CompanyRole | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle<CompanyRoleData>();

  if (error || !data || !isCompanyRole(data.role)) {
    return null;
  }

  return data.role;
}

export async function getUserDriverIds(
  supabase: SupabaseClient<Database>,
  companyId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("drivers")
    .select("id")
    .eq("company_id", companyId)
    .eq("auth_user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((driver) => driver.id);
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
