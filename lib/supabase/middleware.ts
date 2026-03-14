import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";

function redirectToLogin(request: NextRequest, reason: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = getPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (!supabaseUrl || !supabaseAnonKey) {
    return isDashboardRoute ? redirectToLogin(request, "auth_unavailable") : NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user: { id: string } | null = null;
  try {
    const authClient = supabase.auth as unknown as {
      getUser?: () => Promise<{ data?: { user?: { id: string } | null } }>;
      getSession?: () => Promise<{ data?: { session?: { user?: { id: string } | null } | null } }>;
    };

    if (typeof authClient.getUser === "function") {
      const result = await authClient.getUser();
      user = result?.data?.user ?? null;
    } else if (typeof authClient.getSession === "function") {
      const result = await authClient.getSession();
      user = result?.data?.session?.user ?? null;
    }
  } catch {
    return isDashboardRoute ? redirectToLogin(request, "session_expired") : NextResponse.next({ request });
  }

  if (!user && isDashboardRoute) {
    return redirectToLogin(request, "unauthorized");
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
