"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRegistrationClient } from "../../lib/registration-request";
import { createAdminClient, hasAdminMembership } from "../../lib/supabase/admin";

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

  const issuer = createRegistrationClient();
  if (!issuer) return { error: "Verification codes are unavailable." };

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await issuer.rpc("issue_booth_verification_code", { staff_user_id: user.id })
      .maybeSingle().overrideTypes<{ code: string; expires_at: string }, { merge: false }>();
    if (error) break;
    if (data) {
      revalidatePath("/admin");
      return { issued: data };
    }
  }
  return { error: "Could not issue a code. Please try again." };
}
