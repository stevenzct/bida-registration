"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { isRegistrationCode } from "./registration-code";
import { checkRegistrationStorage, registerVisitor } from "./registration-session";
import { normalizeVerificationCode, verificationCodeLength } from "./verification-code";

const fieldClass = "mt-1.5 min-h-12 w-full rounded-[10px] border border-form-border bg-white px-3.5 py-2.5 text-base placeholder:text-[#757575]";
const buttonClass = "primary-action min-h-12 rounded-xl px-[18px] py-3 font-bold text-white disabled:opacity-60";
const verificationErrors = {
  invalid: "That code is invalid. Check the code you received from staff.",
  expired: "That code has expired. Ask booth staff for a new one.",
  used: "That code has already been used. Ask booth staff for help.",
};

function verificationError(status: unknown) {
  return status === "invalid" || status === "expired" || status === "used" ? verificationErrors[status] : undefined;
}

export function RegistrationForm({ demoCode }: { demoCode?: string }) {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const code = normalizeVerificationCode(verificationCode);
    if (!code) {
      setStatus(verificationErrors.invalid);
      return;
    }
    setStatus("");
    startTransition(async () => {
      try {
        let result: unknown;
        if (demoCode) {
          result = code === demoCode ? "available" : "invalid";
        } else {
          const response = await fetch("/api/verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          result = (await response.json()).status;
        }
        if (result === "available") setVerified(true);
        else setStatus(verificationError(result) ?? "Could not verify the code. Please try again.");
      } catch {
        setStatus("Could not verify the code. Please try again.");
      }
    });
  }

  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    if (!name) {
      setStatus("Enter a full name to continue.");
      return;
    }
    setStatus("");
    startTransition(async () => {
      let confirmedCode: string | undefined;
      try {
        checkRegistrationStorage();
        if (!demoCode) {
          try {
            const response = await fetch("/api/registrations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, verificationCode }),
            });
            const result = await response.json();
            if (!response.ok) {
              const error = verificationError(result.status);
              if (error) setVerified(false);
              setStatus(error ?? (result.status === "invalid_details"
                ? "Check your name and email address and try again."
                : "Could not save the registration. Please try again."));
              return;
            }
            if (!isRegistrationCode(result.code)) throw new Error("Invalid confirmation code");
            confirmedCode = result.code;
          } catch {
            setStatus("Could not save the registration. Please try again.");
            return;
          }
        }
        const code = registerVisitor(name, confirmedCode);
        startTransition(() => router.push(`/registered#${code}`));
      } catch {
        setStatus(confirmedCode
          ? `Registration saved. Your reference is ${confirmedCode}. This browser could not open the ticket.`
          : "Could not save in this browser. Enable session storage and try again.");
      }
    });
  }

  return (
    <>
      {verified ? (
        <form onSubmit={register} className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f1e9fd] px-3.5 py-2.5 text-sm font-semibold text-[#4c247c]">
            <p role="status">Code verified</p>
            <button type="button" className="min-h-9 underline" disabled={isPending} onClick={() => { setVerified(false); setStatus(""); }}>Change code</button>
          </div>
          <label className="font-bold">Full name<input name="name" autoComplete="name" maxLength={100} required className={fieldClass} /></label>
          <label className="font-bold">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required className={fieldClass} /></label>
          <button type="submit" className={buttonClass} disabled={isPending}>{isPending ? "Saving…" : "Complete registration"}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="font-bold">Verification code
            <input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={verificationCodeLength}
              placeholder="Enter your 8-character code"
              required
              disabled={isPending}
              className={fieldClass}
            />
          </label>
          <button type="submit" className={buttonClass} disabled={isPending}>{isPending ? "Verifying…" : "Verify code"}</button>
          {demoCode && <p className="text-sm text-[#635575] sm:col-span-2">Local demo code <strong>{demoCode}</strong></p>}
        </form>
      )}
      <p role="status" className="text-[#94203d] not-empty:mt-2.5">{status}</p>
    </>
  );
}
