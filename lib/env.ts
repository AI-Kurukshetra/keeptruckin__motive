const warnedKeys = new Set<string>();

function warnOnce(message: string, key: string) {
  if (warnedKeys.has(key)) {
    return;
  }
  warnedKeys.add(key);
  console.error(message);
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return null;
  }
  return value.trim();
}

export function getPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "NEXT_PUBLIC_APP_URL"): string | null {
  const value = readEnv(name);
  if (!value) {
    warnOnce(`[env] Missing required public env var: ${name}`, name);
  }
  return value;
}

export function getServerEnv(name: "SUPABASE_SERVICE_ROLE_KEY"): string | null {
  const value = readEnv(name);
  if (!value) {
    warnOnce(`[env] Missing required server env var: ${name}`, name);
  }
  return value;
}

export function getAppEnv() {
  return {
    supabaseUrl: getPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: getServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    appUrl: getPublicEnv("NEXT_PUBLIC_APP_URL"),
  };
}
