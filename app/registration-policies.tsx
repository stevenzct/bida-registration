import { useEffect, useRef, type RefObject } from "react";

export type PrivacyContact = { name: string; address: string };
type RegistrationPolicy = "terms" | "privacy";
export type RegistrationPolicyView = RegistrationPolicy | "review";

const policyTitles = { terms: "Terms and Conditions", privacy: "Data Privacy Notice" };

export function RegistrationPolicyButton({ policy, disabled, opensDialog, onOpen }: {
  policy: RegistrationPolicy;
  disabled?: boolean;
  opensDialog?: boolean;
  onOpen: (policy: RegistrationPolicy) => void;
}) {
  return (
    <button
      type="button"
      aria-haspopup={opensDialog ? "dialog" : undefined}
      aria-controls={opensDialog ? "registration-consent-dialog" : undefined}
      disabled={disabled}
      className="rounded-sm font-semibold text-[#4c247c] disabled:opacity-60"
      onClick={() => onOpen(policy)}
    >
      {policyTitles[policy]}
    </button>
  );
}

export function RegistrationConsentDialog({ view, contact, dialog, onNavigate, onChoice }: {
  view: RegistrationPolicyView;
  contact?: PrivacyContact;
  dialog: RefObject<HTMLDialogElement | null>;
  onNavigate: (view: RegistrationPolicyView) => void;
  onChoice: (accepted: boolean) => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const review = view === "review";
  const titleId = "registration-consent-title";

  useEffect(() => {
    if (dialog.current?.open) title.current?.focus({ preventScroll: true });
  }, [dialog, view]);

  return (
    <dialog
      id="registration-consent-dialog"
      ref={dialog}
      aria-labelledby={titleId}
      className="m-auto w-[min(94vw,480px)] max-w-none overflow-hidden rounded-[20px] bg-white p-0 text-ink shadow-xl backdrop:bg-[#0b0936b5]"
    >
      <div className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className={review ? "grid justify-items-center gap-3 px-5 pt-6 text-center sm:px-6" : "px-5 pt-5 pb-2 sm:px-6"}>
          {review && (
            <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-[#f1e9fd] text-[#531bb1]">
              <span className="grid h-6 w-5 content-center gap-[3px] rounded border-2 p-[3px] before:block before:h-0.5 before:bg-current after:block after:h-0.5 after:w-2/3 after:bg-current" />
            </span>
          )}
          <h2 id={titleId} ref={title} tabIndex={-1} className="text-xl leading-tight font-bold tracking-tight focus:outline-none sm:text-2xl">
            {review ? "Please review and agree" : policyTitles[view]}
          </h2>
        </header>
        <div key={view} tabIndex={review ? undefined : 0} aria-labelledby={titleId} role="region" className="grid content-start gap-3 overflow-y-auto overscroll-contain px-5 py-3 text-sm leading-relaxed focus-visible:outline-offset-[-3px] sm:px-6">
          {review && (
            <p className="mx-auto max-w-[32ch] text-center">
              To continue, agree to the <RegistrationPolicyButton policy="terms" onOpen={onNavigate} /> and acknowledge the{" "}
              <RegistrationPolicyButton policy="privacy" onOpen={onNavigate} />.
            </p>
          )}
          {view === "terms" && (
            <>
              <p>These terms apply to the BIDA Hong Kong booth on 6 December 2026. Show the BIDA app to booth staff and use the code they issue to you. The code expires after 10 minutes and can be used once.</p>
              <p>Register with your own name and an email address you can access. Save your confirmation reference so booth staff can look up your registration if needed.</p>
            </>
          )}
          {view === "privacy" && (
            <>
              <p>Registering is voluntary. If you choose to register online, you must provide your name and email address to complete registration. The BIDA booth registration team uses those details, your confirmation reference, and the time you registered to manage booth participation and respond to registration inquiries.</p>
              <p>Authorized booth staff and the service providers that host the site and database may handle these details to operate registration. The site uses a protected identifier derived from your network address to limit repeated verification attempts.</p>
              <p>You can ask to access or correct your registration data. {contact
                ? <>Send your request to {contact.name} at <span className="whitespace-pre-line">{contact.address}</span>.</>
                : "Ask the BIDA booth team for help with your request."}</p>
            </>
          )}
        </div>
        {review ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2 px-5 pt-2 pb-5 sm:px-6">
            <button type="button" onClick={() => onChoice(false)} className="min-h-11 rounded-xl bg-[#f2eff6] px-2 text-[13px] font-semibold text-ink sm:text-sm">Disagree</button>
            <button type="button" onClick={() => onChoice(true)} className="primary-action min-h-11 rounded-xl px-2 text-[13px] font-semibold text-white sm:text-sm">Agree and continue</button>
          </div>
        ) : (
          <div className="flex justify-end border-t border-[#e5dcf0] px-5 pt-3 pb-5 sm:px-6">
            <button type="button" onClick={() => onNavigate("review")} className="min-h-11 rounded-lg border border-[#d9cdeb] px-3.5 text-sm font-semibold text-[#531bb1]">Back to review</button>
          </div>
        )}
      </div>
    </dialog>
  );
}
