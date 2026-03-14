import { createClient } from "@/lib/supabase/server";

type CompanyMembership = {
  companyId: string;
  role: string;
  companyName: string;
};

export async function getPrimaryMembership(): Promise<CompanyMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("company_members")
    .select("company_id, role, companies(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    companyId: data.company_id,
    role: data.role,
    companyName: data.companies?.name ?? "Company",
  };
}
