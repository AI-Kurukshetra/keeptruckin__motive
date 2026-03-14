import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

const FALLBACK_SUPABASE_URL = "https://invalid.supabase.co";
const FALLBACK_ANON_KEY = "invalid-anon-key";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = getPublicEnv("NEXT_PUBLIC_SUPABASE_URL") ?? FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = getPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? FALLBACK_ANON_KEY;

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component - middleware handles refresh.
        }
      },
    },
  });
}
