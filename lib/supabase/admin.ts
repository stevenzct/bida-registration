import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { adminCookieOptions, getSupabaseConfig, useSharedRegistration } from "./config";

export async function createAdminClient(writeCookies = false) {
  const config = getSupabaseConfig();
  if (!useSharedRegistration() || !config) return null;

  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: adminCookieOptions,
    cookies: {
      getAll: () => jar.getAll(),
      setAll(changes) {
        if (!writeCookies) return;
        for (const { name, value, options } of changes) jar.set(name, value, options);
      },
    },
  });
}

export async function hasAdminMembership(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from("registration_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !error && !!data;
}
