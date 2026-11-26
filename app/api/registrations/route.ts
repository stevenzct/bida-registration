import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activities } from "../../activities";
import { formatRegistrationCode } from "../../registration-code";
import { useSharedRegistration } from "../../../lib/supabase/config";

const allowedActivities = new Set<string>(activities);
const maxBodyBytes = 4096;

async function readSubmission(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBodyBytes) {
      await reader.cancel();
      throw new RangeError("Request body too large");
    }
    text += decoder.decode(value, { stream: true });
  }

  return JSON.parse(text + decoder.decode());
}

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!useSharedRegistration() || !url || !secret) {
    return Response.json({ error: "Registration is unavailable." }, { status: 503 });
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return new Response(null, { status: 403 });
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return new Response(null, { status: 415 });
  }

  let submission: unknown;
  try {
    submission = await readSubmission(request);
  } catch (error) {
    return new Response(null, { status: error instanceof RangeError ? 413 : 400 });
  }
  if (!submission || typeof submission !== "object" || !("name" in submission) || !("interests" in submission)) {
    return new Response(null, { status: 400 });
  }

  const name = typeof submission.name === "string" ? submission.name.trim() : "";
  const interests = submission.interests;
  if (!name || name.length > 100 || /[\u0000-\u001f\u007f]/u.test(name) ||
    !Array.isArray(interests) || interests.length > activities.length ||
    !interests.every((activity) => typeof activity === "string" && allowedActivities.has(activity)) ||
    new Set(interests).size !== interests.length) {
    return new Response(null, { status: 400 });
  }

  const supabase = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = formatRegistrationCode(randomBytes(4).readUInt32BE());
    const { error } = await supabase.from("registrations").insert({ name, code, interests });
    if (!error) return Response.json({ code }, { status: 201 });
    if (error.code !== "23505") break;
  }

  return Response.json({ error: "Could not save the registration. Please try again." }, { status: 503 });
}
