import { createRegistrationClient, readRegistrationRequest, verificationAttemptSource } from "../../../lib/registration-request";
import { normalizeVerificationCode } from "../../verification-code";

export async function POST(request: Request) {
  const input = await readRegistrationRequest(request);
  if (input instanceof Response) return input;

  const code = normalizeVerificationCode(input.code);
  if (!code) return Response.json({ status: "invalid" }, { status: 400 });

  const client = createRegistrationClient();
  if (!client) return new Response(null, { status: 503 });
  const { data, error } = await client.rpc("attempt_booth_verification", {
    verification_code: code,
    attempt_source: verificationAttemptSource(request),
  });
  if (error) return new Response(null, { status: 503 });
  return Response.json({ status: data }, { status: data === "rate_limited" ? 429 : 200 });
}
