"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCompanySchema, inviteMemberSchema } from "@/lib/validations";

function getValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function createCompanyAction(formData: FormData) {
  const parsed = createCompanySchema.safeParse({
    name: getValue(formData, "name"),
    dotNumber: getValue(formData, "dotNumber") || undefined,
    fleetSize: getOptionalNumber(getValue(formData, "fleetSize")),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid_company_input");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("companies").insert({
    name: parsed.data.name,
    dot_number: parsed.data.dotNumber ?? null,
    fleet_size: parsed.data.fleetSize ?? null,
    created_by: user.id,
  });

  if (error) {
    redirect("/dashboard?error=company_create_failed");
  }

  redirect("/dashboard?message=company_created");
}

export async function inviteMemberAction(formData: FormData) {
  const parsed = inviteMemberSchema.safeParse({
    companyId: getValue(formData, "companyId"),
    email: getValue(formData, "email"),
    role: getValue(formData, "role"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid_invite_input");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", parsed.data.companyId)
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (membershipError || !membership) {
    redirect("/dashboard?error=invite_not_allowed");
  }

  const { error } = await supabase.from("company_invitations").insert({
    company_id: parsed.data.companyId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    invited_by: user.id,
  });

  if (error) {
    redirect("/dashboard?error=invite_failed");
  }

  redirect("/dashboard?message=invite_created");
}
