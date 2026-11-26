import type { Metadata } from "next";
import Image from "next/image";
import brand from "../../assets/images/brand.webp";
import check from "../../assets/images/registered-check.webp";
import { RegistrationTicket } from "./registration-ticket";

export const metadata: Metadata = {
  title: "Registration confirmation · BIDA",
};

export default function RegisteredPage() {
  return (
    <div className="ticket-page grid min-h-svh items-start justify-items-center p-[clamp(14px,3vw,32px)] text-[#302d35]">
      <RegistrationTicket
        header={
          <header className="ticket-header p-[clamp(16px,4vw,26px)]">
            <Image src={brand} alt="BIDA" unoptimized loading="eager" className="mx-auto h-auto w-[24%]" />
          </header>
        }
        footer={
          <small className="block text-[length:clamp(13px,2.6vw,17px)] leading-[1.45]">
            Registration is for booth activities, not a BIDA app account. Participation and prizes are subject to event rules.
          </small>
        }
      >
        <Image src={check} alt="" unoptimized loading="eager" className="mx-auto h-auto w-[16%]" />
        <h1 id="confirmation" className="my-2.5 text-[length:clamp(26px,6vw,40px)] leading-[1.12] font-bold tracking-[-0.04em] text-[#380740]">
          You are registered!
        </h1>
        <p className="text-[length:clamp(16px,3.4vw,22px)] leading-[1.38]">
          Show this confirmation to the BIDA booth team when joining an activity.
        </p>
      </RegistrationTicket>
    </div>
  );
}
