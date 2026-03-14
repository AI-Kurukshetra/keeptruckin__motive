import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

const FALLBACK_SUPABASE_URL = "https://invalid.supabase.co";
const FALLBACK_ANON_KEY = "invalid-anon-key";

export function createClient() {
  const supabaseUrl = getPublicEnv("NEXT_PUBLIC_SUPABASE_URL") ?? FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = getPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? FALLBACK_ANON_KEY;

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
