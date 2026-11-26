"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { hasRegistration } from "../registration-session";
import { downloadTicket } from "./ticket-image";

const actionClass = "flex min-h-12 items-center justify-center gap-[5px] rounded-[13px] border-2 border-[#761394] px-1 py-2.5 text-[length:clamp(13px,2.8vw,20px)] leading-[1.2] font-bold";

export function RegistrationTicket({ header, footer, children }: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    function loadCode() {
      const hash = window.location.hash.slice(1);
      if (hash && hasRegistration(hash)) {
        setCode(hash);
        setStatus("");
      } else {
        setCode("");
        router.replace("/#join");
      }
    }

    loadCode();
    window.addEventListener("hashchange", loadCode);
    return () => window.removeEventListener("hashchange", loadCode);
  }, [router]);

  async function saveImage() {
    try {
      await downloadTicket(code);
      setStatus("Code image ready to save.");
    } catch {
      setStatus("Could not save the image. You can take a screenshot of this code.");
    }
  }

  return (
    <main hidden={!code} className="ticket m-auto w-full max-w-[570px] overflow-hidden rounded-[clamp(20px,5vw,36px)] pb-2 text-center">
      {header}
      <section aria-labelledby="confirmation" className="px-[clamp(13px,3.4vw,26px)] pt-[clamp(18px,4vw,34px)] pb-[clamp(24px,5vw,48px)]">
        {children}
        <div className="mx-[2%] mt-[clamp(20px,5vw,36px)] border-t-[3px] border-dotted border-[#83239c] pt-[clamp(16px,4vw,26px)]">
          <label htmlFor="code" className="text-[length:clamp(13px,3vw,20px)] font-bold tracking-[0.11em] text-[#590d70] uppercase">
            Your registration reference
          </label>
          <output id="code" className="my-2 block text-[length:clamp(27px,7.2vw,50px)] leading-[1.15] font-extrabold tracking-[0.01em] text-[#100e12] [overflow-wrap:anywhere]">
            {code}
          </output>
        </div>
        <div className="my-[clamp(26px,6vw,52px)] grid grid-cols-1 gap-2 ticket-actions:grid-cols-2">
          <button type="button" className={`${actionClass} bg-[#740a98] text-white`} onClick={saveImage}>
            <span aria-hidden="true">↓</span> Save image
          </button>
          <Link href="/#download" className={`${actionClass} bg-white text-[#681080]`}>
            Download BIDA <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p role="status" className="text-[14px] leading-[1.38] not-empty:mb-3">{status}</p>
        {footer}
      </section>
    </main>
  );
}
