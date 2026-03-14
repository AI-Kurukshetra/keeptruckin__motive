"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { loginSchema, registerSchema } from "@/lib/validations";

function getValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: getValue(formData, "email"),
    password: getValue(formData, "password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_login_input");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      redirect("/login?error=invalid_credentials");
    }
  } catch {
    redirect("/login?error=auth_unavailable");
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: getValue(formData, "email"),
    password: getValue(formData, "password"),
    confirmPassword: getValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid_register_input");
  }

  const appUrl = getPublicEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      redirect(`/register?error=${encodeURIComponent(error.message)}`);
    }
  } catch {
    redirect("/register?error=auth_unavailable");
  }

  redirect("/login?message=account_created");
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    redirect("/login?error=session_terminate_failed");
  }

  redirect("/login?message=signed_out");
}
