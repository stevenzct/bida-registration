import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminCookieOptions, getSupabaseConfig, useSharedRegistration } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  if (useSharedRegistration() && config && request.cookies.getAll().length) {
    const client = createServerClient(config.url, config.key, {
      cookieOptions: adminCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(changes, headers) {
          for (const { name, value } of changes) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of changes) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    });
    await client.auth.getClaims();
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: "/admin/:path*" };
