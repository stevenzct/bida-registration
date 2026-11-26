import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import bida from "../../assets/images/bida.png";
import { createAdminClient, hasAdminMembership } from "../../lib/supabase/admin";
import { signOut } from "./actions";
import { SignInForm } from "./auth-forms";
import { LiveRegistrationUpdates } from "./live-registration-updates";
import { RegistrationSearch } from "./registration-search";
import { VerificationPanel, type VerificationEntry } from "./verification-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booth registration admin · BIDA",
  robots: { index: false, follow: false },
};

const pageSize = 50;
const searchMaxLength = 254;

function AdminLayout({ children, signedIn = false }: { children: ReactNode; signedIn?: boolean }) {
  return (
    <div className="min-h-svh bg-[#f7f5fb]">
      <header className="border-b border-[#e8dff2] bg-white">
        <div className="mx-auto flex min-h-17 max-w-6xl items-center justify-between gap-2 px-4 sm:px-7 lg:px-8">
          <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-sm sm:gap-3.5">
            <Image src={bida} alt="BIDA" unoptimized className="h-auto w-[68px] shrink-0 sm:w-[78px]" />
            <span className="border-l border-[#e5dcf0] pl-2.5 text-sm leading-tight font-semibold text-[#4d3e63] sm:pl-3.5">Hong Kong</span>
          </Link>
          {signedIn && (
            <form action={signOut} className="shrink-0">
              <button type="submit" className="min-h-11 rounded-lg border border-[#d9cdeb] px-3.5 text-sm font-semibold text-[#531bb1] hover:bg-[#f2ebfc] sm:px-4">Sign out</button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-10 sm:px-7 sm:pt-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function AccessCard({ title, children, signedIn }: { title: string; children: ReactNode; signedIn?: boolean }) {
  return (
    <AdminLayout signedIn={signedIn}>
      <section className="mx-auto mt-3 max-w-md rounded-2xl border border-[#e5dcf0] bg-white p-5 shadow-[0_8px_28px_#2d14570a] sm:mt-8 sm:p-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#221539]">{title}</h1>
        {children}
      </section>
    </AdminLayout>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string | string[]; q?: string | string[] }> }) {
  const client = await createAdminClient();
  if (!client) {
    return <AccessCard title="Registration admin"><p className="mt-3">The dashboard is available when shared registration is configured.</p></AccessCard>;
  }

  const { data: { user } } = await client.auth.getUser();
  if (!user) return <AccessCard title="Admin sign-in"><SignInForm /></AccessCard>;

  if (!(await hasAdminMembership(client, user.id))) {
    return <AccessCard title="Access restricted" signedIn><p className="mt-3">This account does not have access to booth registrations.</p></AccessCard>;
  }

  const { page: requestedPage, q } = await searchParams;
  const page = typeof requestedPage === "string" && /^[1-9]\d{0,5}$/.test(requestedPage) ? Number(requestedPage) : 1;
  const offset = (page - 1) * pageSize;
  const search = typeof q === "string" ? q.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, searchMaxLength) : "";
  const registrations = search
    ? client.rpc("search_booth_registrations", { search_term: search })
    : client.from("registrations").select("name, code, email, created_at");
  const [{ data }, { data: verificationCodes }] = await Promise.all([
    registrations.order("created_at", { ascending: false }).order("code", { ascending: false }).range(offset, offset + pageSize),
    client.from("verification_codes").select("code, expires_at, used_at").order("issued_at", { ascending: false }).order("code", { ascending: false }).limit(10),
  ]);

  const now = Date.now();
  const recent: VerificationEntry[] | undefined = verificationCodes?.map(({ code, expires_at, used_at }) => ({
    code, expires_at, status: used_at ? "Used" : Date.parse(expires_at) <= now ? "Expired" : "Available",
  }));

  const rows = data?.slice(0, pageSize);
  const hasNextPage = (data?.length ?? 0) > pageSize;

  return (
    <AdminLayout signedIn>
      <LiveRegistrationUpdates />
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,#642eac_0%,#391f70_52%,#241443_100%)] p-5 text-white shadow-[0_10px_28px_#2c125222] sm:px-7 sm:py-6 lg:px-8">
        <div>
          <h1 className="text-[clamp(1.625rem,5vw,2.5rem)] leading-[1.12] font-bold tracking-[-0.04em]">Booth registrations</h1>
          <p className="mt-2.5 text-sm text-[#f0e6ff]">Newest first <span aria-hidden="true">·</span> Hong Kong time (UTC+8)</p>
        </div>
        <p className="rounded-full border border-white/30 bg-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-white">
          Auto-updates every 5 seconds
        </p>
      </header>
      <VerificationPanel recent={recent} />
      <RegistrationSearch search={search} maxLength={searchMaxLength} rows={rows} page={page} offset={offset} hasNextPage={hasNextPage} />
    </AdminLayout>
  );
}
