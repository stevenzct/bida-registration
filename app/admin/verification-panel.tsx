"use client";

import { useActionState, useState } from "react";
import { issueVerificationCode } from "./actions";

export type VerificationEntry = {
  code: string;
  expires_at: string;
  status: "Available" | "Used" | "Expired";
};

const expiryTime = new Intl.DateTimeFormat("en-HK", { timeStyle: "short", timeZone: "Asia/Hong_Kong" });
const statusClass = {
  Available: "bg-[#e8f5ec] text-[#245538]",
  Used: "bg-[#eee7fa] text-[#4d2383]",
  Expired: "bg-[#f7ecec] text-[#802b3d]",
};

export function VerificationPanel({ recent }: { recent?: VerificationEntry[] }) {
  const [state, action, pending] = useActionState(issueVerificationCode, {});
  const issued = state.issued;
  const [copiedCode, setCopiedCode] = useState("");
  const [copyError, setCopyError] = useState(false);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <section aria-labelledby="booth-verification" className="mt-5 rounded-2xl border border-[#e5dcf0] bg-white p-4 sm:mt-6 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="booth-verification" className="text-xl font-bold tracking-tight text-[#221539]">Booth verification</h2>
          <p className="mt-1 text-sm text-[#635575]">Check the open BIDA app, then issue a code for that visitor. Codes expire after 10 minutes.</p>
        </div>
        <form action={action}>
          <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-[#531bb1] px-4 text-sm font-semibold text-white hover:bg-[#42158e] disabled:opacity-60">{pending ? "Issuing…" : "Issue verification code"}</button>
        </form>
      </div>
      {state.error && <p role="alert" className="mt-3 text-sm text-[#94203d]">{state.error}</p>}
      {issued && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f1e9fd] p-3.5">
          <div aria-live="polite">
            <p className="text-sm font-semibold text-[#4d2383]">Code issued</p>
            <code className="text-2xl font-bold tracking-[0.12em] text-[#321164]">{issued.code}</code>
            <p className="text-sm text-[#635575]">Expires at <time dateTime={issued.expires_at}>{expiryTime.format(new Date(issued.expires_at))}</time></p>
          </div>
          <button type="button" onClick={() => copy(issued.code)} className="min-h-11 rounded-lg border border-[#d9cdeb] bg-white px-4 text-sm font-semibold text-[#531bb1]">
            {copiedCode === issued.code ? "Copied" : "Copy code"}
          </button>
        </div>
      )}
      {copyError && <p role="status" className="mt-2 text-sm text-[#635575]">Select and copy the code from the screen.</p>}
      {!recent ? (
        <p role="status" className="mt-4 text-sm text-[#94203d]">Could not load recent codes.</p>
      ) : recent.length > 0 && (
        <ul aria-label="Recent verification codes" className="mt-4 divide-y divide-[#eee8f5] border-t border-[#eee8f5]">
          {recent.map(({ code, status, expires_at }) => (
            <li key={code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-x-5">
              <code className="font-semibold text-[#4d2383]">{code}</code>
              <p className="col-start-1 row-start-2 text-[#635575] sm:col-start-auto sm:row-start-auto">Expires at <time dateTime={expires_at}>{expiryTime.format(new Date(expires_at))}</time></p>
              <span className={`col-start-2 row-span-2 row-start-1 justify-self-end rounded-full px-2.5 py-1 text-xs font-semibold sm:col-start-auto sm:row-span-1 sm:row-start-auto ${statusClass[status]}`}>{status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
