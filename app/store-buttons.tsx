"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import apple from "../assets/images/ios-badge.webp";
import google from "../assets/images/play-badge.webp";

const storeBadgeClass = "min-h-12 min-w-0 flex-1 rounded-[10px] hover:brightness-[0.94]";

export function StoreButtons() {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <div id="store-buttons" className="mx-auto mt-1.5 flex w-full max-w-[420px] gap-2 self-center hero-wide:mx-0 hero-wide:mt-0 hero-wide:mb-[7%] hero-wide:w-[48%] hero-wide:max-w-none hero-wide:gap-2.5 hero-wide:self-auto">
        <a href="https://play.google.com/store/apps/details?id=com.payso.ofw" className={`${storeBadgeClass} flex items-center`}>
          <Image src={google} alt="Get it on Google Play" unoptimized loading="eager" className="h-auto w-full" />
        </a>
        <button type="button" className={storeBadgeClass} onClick={() => dialog.current?.showModal()}>
          <Image src={apple} alt="Download on the App Store" unoptimized loading="eager" className="h-auto w-full" />
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="store-title"
        aria-describedby="store-preview"
        className="m-auto w-[min(94vw,480px)] rounded-[20px] bg-white p-6 text-ink backdrop:bg-[#0b0936b5]"
      >
        <h2 id="store-title" className="mb-2.5 text-[26px] leading-[1.09] font-bold tracking-[-0.045em]">App Store</h2>
        <p id="store-preview">Preview only. The verified BIDA store listing will open here at launch.</p>
        <button type="button" className="primary-action mx-[5px] mt-3 rounded-xl px-[18px] py-[13px] font-bold text-white" onClick={() => dialog.current?.close()}>
          Close
        </button>
      </dialog>
    </>
  );
}

export function MobileNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const buttons = document.getElementById("store-buttons");
    if (!buttons) return;

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting);
    });
    observer.observe(buttons);
    return () => observer.disconnect();
  }, []);

  return (
    <nav hidden={!visible} className="mobile-nav fixed bottom-0 z-2 flex w-full justify-center gap-3 bg-white p-[9px] shadow-[0_-1px_14px_#1811391f] desktop:hidden">
      <a href="#download" className="rounded-[9px] bg-[#431ba4] px-3 py-[9px] text-[14px] text-white">Download BIDA ↑</a>
      <a href="#join" className="rounded-[9px] bg-[#eee6fb] px-3 py-[9px] text-[14px] text-[#462182]">Join booth activities</a>
    </nav>
  );
}
