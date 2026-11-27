import Image from "next/image";
import brand from "../assets/images/brand.webp";
import headline from "../assets/images/kasama-transparent.webp";
import receiving from "../assets/images/feature-receiving.webp";
import exchange from "../assets/images/feature-exchange.webp";
import transfer from "../assets/images/feature-transfer.webp";
import { MobileNav, StoreButtons } from "./store-buttons";
import { RegistrationForm } from "./registration-form";
import { useSharedRegistration } from "../lib/supabase/config";

export const dynamic = "force-dynamic";

const features = [
  {
    image: receiving,
    title: "Receiving account",
    description: "Apply for a Hong Kong receiving account, subject to eligibility.",
  },
  {
    image: exchange,
    title: "Exchange",
    description: "Convert funds between supported currencies.",
  },
  {
    image: transfer,
    title: "Transfer",
    description: "Send funds to supported recipients.",
  },
];

function Hero() {
  const appStoreUrl = process.env.BIDA_APP_STORE_URL;
  const iosListing = appStoreUrl && /^https:\/\/apps\.apple\.com\/[^?#]+\/id\d+(?:[?#].*)?$/.test(appStoreUrl) ? appStoreUrl : undefined;

  return (
    <section
      id="download"
      aria-labelledby="event-title"
      className="hero relative isolate flex flex-col items-start gap-2.5 p-[clamp(12px,4vw,24px)] text-white hero-wide:aspect-[1461/1076] hero-wide:gap-0 hero-wide:p-[5%] short-landscape:grid short-landscape:grid-cols-2 short-landscape:content-center short-landscape:items-end short-landscape:gap-x-4 short-landscape:gap-y-[5px] short-landscape:px-[4%] short-landscape:py-2.5"
    >
      <Image
        src={brand}
        alt="BIDA"
        unoptimized
        loading="eager"
        className="h-auto w-[clamp(60px,18vw,105px)] hero-wide:w-[17%] short-landscape:w-[58px]"
      />
      <span className="sr-only">Hong Kong · 06 December 2026</span>
      <div className="mt-[clamp(10px,4.6vw,28px)] w-full hero-wide:my-auto hero-wide:w-[58%] short-landscape:col-start-1 short-landscape:mt-0">
        <h1 id="event-title" className="mb-[5px] w-[65%] max-w-[400px] hero-wide:mb-2 hero-wide:w-full hero-wide:max-w-none short-landscape:mb-[3px] short-landscape:w-[70%]">
          <Image src={headline} alt="Kasama mo, saan ka man." unoptimized loading="eager" className="h-auto w-full" />
        </h1>
        <p className="w-fit max-w-full rounded-[0.4em] bg-[rgb(9_15_58_/_26%)] px-[0.6em] py-[0.35em] text-[length:clamp(15px,4vw,19px)] leading-[1.35] hero-wide:text-[length:clamp(18px,2.6vw,29px)] hero-wide:leading-[1.36] short-landscape:text-[14px]">
          Meet BIDA — designed around<br />everyday financial needs Of<br />Filipinos abroad.
        </p>
      </div>
      <StoreButtons appStoreUrl={iosListing} />
    </section>
  );
}

function Capabilities() {
  return (
    <section aria-labelledby="capability-title" className="mt-7 overflow-hidden bg-[#3923a2] text-[#100d42]">
      <header className="capabilities-heading relative isolate overflow-hidden px-[5%] pt-[clamp(24px,5%,52px)] pb-[clamp(42px,8%,84px)] text-white">
        <h2 id="capability-title" className="mb-3 text-[length:clamp(23px,5.65vw,56px)] leading-[1.09] font-bold tracking-[-0.042em]">
          What you can do with BIDA
        </h2>
        <span className="inline-block rounded-full border-2 border-white px-[0.9em] py-[3px] text-[length:clamp(14px,2.7vw,24px)] leading-[1.25] font-bold">
          Coming Soon
        </span>
      </header>
      <ul role="list" className="relative -mt-5 rounded-t-[clamp(20px,5vw,48px)] bg-white px-[4.5%] py-1 [&>li+li]:border-t [&>li+li]:border-[#d5bdff]">
        {features.map(({ image, title, description }) => (
          <li key={title} className="grid grid-cols-[clamp(44px,10vw,102px)_minmax(0,1fr)] items-center gap-[clamp(12px,3vw,30px)] py-[clamp(16px,3.75vw,36px)]">
            <Image src={image} alt="" width={152} height={140} unoptimized loading="eager" className="h-auto w-full" />
            <div>
              <h3 className="mb-1 text-[length:clamp(18px,3.65vw,36px)] leading-[1.2] font-bold tracking-[-0.03em]">
                {title}
              </h3>
              <p className="text-[length:clamp(15px,2.55vw,24px)] leading-[1.4]">{description}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="bg-[#f2edfb] px-[5%] py-[clamp(20px,4.5vw,44px)] text-center text-[length:clamp(15px,2.55vw,24px)] leading-[1.4] font-medium">
        Need assistance? Ask the BIDA booth team.
      </p>
    </section>
  );
}

export default function HomePage() {
  const privacyAddress = process.env.BIDA_PRIVACY_CONTACT_ADDRESS?.trim();
  const privacyContact = privacyAddress ? {
    name: process.env.BIDA_PRIVACY_CONTACT_NAME?.trim() || "BIDA Booth Registration Lead",
    address: privacyAddress,
  } : undefined;

  return (
    <>
      <main className="mx-auto w-full max-w-[1000px] pb-[65px]">
        <Hero />
        <section
          id="join"
          aria-labelledby="join-title"
          className="registration-panel relative mx-[clamp(6px,1.6vw,16px)] -mt-px rounded-[clamp(21px,4vw,44px)] border border-[#e0dcf0] p-[clamp(20px,4.5vw,48px)]"
        >
          <h2 id="join-title" className="text-[length:clamp(25px,4.1vw,44px)] leading-[1.09] font-bold tracking-[-0.045em]">
            Join our booth activities!
          </h2>
          <p className="mt-2.5 mb-5">Download the BIDA app and complete your account registration. Show the app to our booth staff for verification, then return to this page or scan the booth QR code again to enter your verification code.</p>
          <RegistrationForm
            demoCode={!useSharedRegistration() && process.env.VERCEL_ENV !== "production" ? "BIDA-0529" : undefined}
            privacyContact={privacyContact}
          />
        </section>
        <Capabilities />
      </main>
      <MobileNav />
    </>
  );
}
