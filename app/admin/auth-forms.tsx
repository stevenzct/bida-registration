"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-form-border bg-white px-3 py-2.5 font-normal";
const buttonClass = "primary-action min-h-11 rounded-lg px-4 py-2.5 font-semibold text-white hover:brightness-110 disabled:opacity-60";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="mt-5 grid gap-4">
      <label className="font-semibold">
        Email
        <input className={inputClass} name="email" type="email" required maxLength={254} autoComplete="username" />
      </label>
      <label className="font-semibold">
        Password
        <input className={inputClass} name="password" type="password" required maxLength={256} autoComplete="current-password" />
      </label>
      {state.error && <p role="alert" className="text-[#94203d]">{state.error}</p>}
      <button type="submit" className={buttonClass} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

