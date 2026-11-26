import "server-only";

import { createClient } from "@supabase/supabase-js";
import { useSharedRegistration } from "./supabase/config";

export function createRegistrationClient() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!useSharedRegistration() || !url || !secret) return null;

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function readRegistrationRequest(request: Request): Promise<Record<string, unknown> | Response> {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return new Response(null, { status: 403 });
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return new Response(null, { status: 415 });
  }

  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });

  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      text += decoder.decode(value, { stream: true });
    }
    const data = JSON.parse(text + decoder.decode());
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
  } catch {
    return new Response(null, { status: 400 });
  }
  return new Response(null, { status: 400 });
}
