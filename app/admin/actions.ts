"use server";

import { redirect } from "next/navigation";
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
