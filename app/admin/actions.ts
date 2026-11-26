"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, hasAdminMembership } from "../../lib/supabase/admin";
import { verificationAlphabet, verificationCodeLength } from "../verification-code";

type ActionState = { error?: string };

export async function signIn(_previous: ActionState, form: FormData): Promise<ActionState> {
  const client = await createAdminClient(true);
  const email = form.get("email");
  const password = form.get("password");
  if (!client || typeof email !== "string" || !email.trim() || email.length > 254 ||
    typeof password !== "string" || !password || password.length > 256) {
    return { error: "Enter a valid email and password." };
  }

  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) return { error: "Could not sign in. Check your credentials and try again." };
  if (!(await hasAdminMembership(client, data.user.id))) {
    await client.auth.signOut({ scope: "local" });
    return { error: "Could not sign in. Check your credentials and try again." };
  }
  redirect("/admin");
}

export async function signOut() {
  const client = await createAdminClient(true);
  if (client) await client.auth.signOut({ scope: "local" });
  redirect("/admin");
}

export async function issueVerificationCode(): Promise<{
  error?: string;
  issued?: { code: string; expires_at: string };
}> {
  const client = await createAdminClient(true);
  if (!client) return { error: "Verification codes are unavailable." };
  const { data: { user } } = await client.auth.getUser();
  if (!user || !(await hasAdminMembership(client, user.id))) {
    return { error: "Sign in with a staff account to issue a code." };
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const code = Array.from({ length: verificationCodeLength }, () => verificationAlphabet[randomInt(verificationAlphabet.length)]).join("");
    const { data, error } = await client.from("verification_codes").insert({ code }).select("code, expires_at").single();
    if (!error && data) {
      revalidatePath("/admin");
      return { issued: data };
    }
    if (error?.code !== "23505") break;
  }
  return { error: "Could not issue a code. Please try again." };
}
