import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If env variables are missing in Vercel edge runtime,
    // just continue instead of crashing
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware error:", err);

    // Prevent edge crash
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};