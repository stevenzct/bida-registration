import { randomBytes } from "node:crypto";
import { createRegistrationClient, readRegistrationRequest } from "../../../lib/registration-request";
import { formatRegistrationCode } from "../../registration-code";
import { normalizeVerificationCode } from "../../verification-code";

export async function POST(request: Request) {
  const input = await readRegistrationRequest(request);
  if (input instanceof Response) return input;

  const verificationCode = normalizeVerificationCode(input.verificationCode);
  if (!verificationCode) return Response.json({ status: "invalid" }, { status: 400 });

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const hasControlCharacters = /[\u0000-\u001f\u007f]/u;
  if (!name || name.length > 100 || hasControlCharacters.test(name) || email.length > 254 ||
    hasControlCharacters.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    return Response.json({ status: "invalid_details" }, { status: 400 });
  }

  const client = createRegistrationClient();
  if (!client) return new Response(null, { status: 503 });
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = formatRegistrationCode(randomBytes(4).readUInt32BE());
    const { data, error } = await client.rpc("register_verified_visitor", {
      verification_code: verificationCode,
      visitor_name: name,
      visitor_email: email,
      confirmation_code: code,
    });
    if (error?.code === "23505") continue;
    if (error) break;
    if (data === "registered") return Response.json({ code }, { status: 201 });
    if (data === "used") return Response.json({ status: data }, { status: 409 });
    if (data === "expired") return Response.json({ status: data }, { status: 410 });
    if (data === "invalid") return Response.json({ status: data }, { status: 400 });
    break;
  }

  return new Response(null, { status: 503 });
}
