"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { isRegistrationCode } from "./registration-code";
import { RegistrationConsentDialog, RegistrationPolicyButton, type PrivacyContact, type RegistrationPolicyView } from "./registration-policies";
import { checkRegistrationStorage, registerVisitor } from "./registration-session";
import { normalizeLegacyVerificationCode, normalizeVerificationCode } from "./verification-code";
import { VerificationInput } from "./verification-input";

const fieldClass = "mt-1.5 min-h-12 w-full rounded-[10px] border border-form-border bg-white px-3.5 py-2.5 text-base placeholder:text-[#757575]";
const buttonClass = "primary-action min-h-12 rounded-xl px-[18px] py-3 font-bold text-white disabled:opacity-60";
const consentRequired = "Accept the Terms and Conditions and acknowledge the Data Privacy Notice to complete registration.";
const verificationErrors = {
  invalid: "That code is invalid. Check the code you received from staff.",
  expired: "That code has expired. Ask booth staff for a new one.",
  used: "That code has already been used. Ask booth staff for help.",
  rate_limited: "Too many attempts. Wait a few minutes before trying again.",
};

function verificationError(status: unknown) {
  return status === "invalid" || status === "expired" || status === "used" || status === "rate_limited" ? verificationErrors[status] : undefined;
}

export function RegistrationForm({ demoCode, privacyContact }: { demoCode?: string; privacyContact?: PrivacyContact }) {
  const router = useRouter();
  const [verifiedCode, setVerifiedCode] = useState("");
  const [status, setStatus] = useState("");
  const [acceptedRegistrationTerms, setAcceptedRegistrationTerms] = useState(false);
  const [policyView, setPolicyView] = useState<RegistrationPolicyView>("review");
  const [isPending, startTransition] = useTransition();
  const consentDialog = useRef<HTMLDialogElement>(null);

  function openPolicies(view: RegistrationPolicyView = "review") {
    setPolicyView(view);
    consentDialog.current?.showModal();
  }

  function chooseConsent(accepted: boolean) {
    setAcceptedRegistrationTerms(accepted);
    consentDialog.current?.close();
    if (!accepted) setStatus(consentRequired);
    else if (status === consentRequired) setStatus("");
  }

  function clearVerification() {
    setVerifiedCode("");
    setAcceptedRegistrationTerms(false);
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const form = new FormData(event.currentTarget);
    const code = form.has("legacyCode")
      ? normalizeLegacyVerificationCode(form.get("legacyCode"))
      : normalizeVerificationCode(form.getAll("digit").join(""));
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
        if (result === "available") setVerifiedCode(code);
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
    if (!acceptedRegistrationTerms) {
      openPolicies();
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
              body: JSON.stringify({ name, email, verificationCode: verifiedCode, acceptedRegistrationTerms }),
            });
            const result = await response.json();
            if (!response.ok) {
              const error = verificationError(result.status);
              if (error && result.status !== "rate_limited") clearVerification();
              if (result.status === "consent_required") {
                setStatus(consentRequired);
                return;
              }
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
      {verifiedCode ? (
        <form onSubmit={register} className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#e8f5ec] px-3.5 py-2.5 text-sm font-semibold text-[#245538]">
            <p role="status">Code verified</p>
            <button type="button" className="min-h-9 underline" disabled={isPending} onClick={() => { clearVerification(); setStatus(""); }}>Change code</button>
          </div>
          <label className="font-bold">Full name<input name="name" autoComplete="name" maxLength={100} required className={fieldClass} /></label>
          <label className="font-bold">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required className={fieldClass} /></label>
          <div className="flex items-start gap-2.5 text-sm leading-normal">
            <input
              type="checkbox"
              name="acceptedRegistrationTerms"
              aria-labelledby="registration-consent-label"
              required
              checked={acceptedRegistrationTerms}
              disabled={isPending}
              onInvalid={(event) => {
                if (event.currentTarget.form?.querySelector(":invalid") !== event.currentTarget) return;
                event.preventDefault();
                openPolicies();
              }}
              onChange={(event) => {
                if (event.currentTarget.checked) openPolicies();
                else setAcceptedRegistrationTerms(false);
              }}
              className="mt-[3px] size-4 shrink-0 cursor-pointer accent-[#531bb1]"
            />
            <p id="registration-consent-label" className="text-[13px] leading-relaxed">
              I have read and agree to the <RegistrationPolicyButton policy="terms" disabled={isPending} onOpen={openPolicies} opensDialog /> and acknowledge the{" "}
              <RegistrationPolicyButton policy="privacy" disabled={isPending} onOpen={openPolicies} opensDialog />.
            </p>
          </div>
          <button type="submit" className={buttonClass} disabled={isPending}>{isPending ? "Saving…" : "Complete registration"}</button>
          <RegistrationConsentDialog
            dialog={consentDialog}
            view={policyView}
            contact={privacyContact}
            onNavigate={setPolicyView}
            onChoice={chooseConsent}
          />
        </form>
      ) : (
        <form onSubmit={verify} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <VerificationInput disabled={isPending} onEdit={() => setStatus("")} />
          <button type="submit" className={buttonClass} disabled={isPending}>{isPending ? "Verifying…" : "Verify and continue"}</button>
          {demoCode && <p className="text-sm text-[#635575] sm:col-span-2">Local demo code <strong>{demoCode}</strong></p>}
        </form>
      )}
      <p role="status" className="text-[#94203d] not-empty:mt-2.5">{status}</p>
    </>
  );
}
