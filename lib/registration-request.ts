import "server-only";

import { createHmac } from "node:crypto";
import { isIP, SocketAddress } from "node:net";
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

export function verificationAttemptSource(request: Request) {
  const header = process.env.VERCEL === "1" || process.env.VERCEL_ENV
    ? "x-vercel-forwarded-for"
    : process.env.BIDA_TRUSTED_CLIENT_IP_HEADER;
  const address = (header && request.headers.get(header)?.trim()) || "";
  const version = isIP(address);
  let network = "unknown";
  if (version === 4) network = address;
  if (version === 6) {
    const canonical = new SocketAddress({ address, family: "ipv6" }).address;
    if (canonical.startsWith("::ffff:") && isIP(canonical.slice(7)) === 4) {
      network = canonical.slice(7);
    } else {
      // Group IPv6 privacy addresses on the same /64 source network.
      const [start, end] = canonical.split("::");
      const prefix = start ? start.split(":") : [];
      if (end !== undefined) {
        const suffix = end ? end.split(":") : [];
        prefix.push(...Array<string>(8 - prefix.length - suffix.length).fill("0"), ...suffix);
      }
      network = `${prefix.slice(0, 4).join(":")}/64`;
    }
  }
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "")
    .update(`booth-verification:${network}`).digest("hex");
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
