import { createRegistrationClient, readRegistrationRequest } from "../../../lib/registration-request";
import { normalizeVerificationCode } from "../../verification-code";

export async function POST(request: Request) {
  const input = await readRegistrationRequest(request);
  if (input instanceof Response) return input;

  const code = normalizeVerificationCode(input.code);
  if (!code) return Response.json({ status: "invalid" }, { status: 400 });

  const client = createRegistrationClient();
  if (!client) return new Response(null, { status: 503 });
  const { data, error } = await client.rpc("check_booth_verification", { verification_code: code });
  if (error) return new Response(null, { status: 503 });
  return Response.json({ status: data });
}
