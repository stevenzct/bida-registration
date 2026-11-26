import Link from "next/link";

export type Registration = {
  name: string;
  code: string;
  email: string | null;
  created_at: string;
};

const eventDate = new Intl.DateTimeFormat("en-HK", { dateStyle: "medium", timeZone: "Asia/Hong_Kong" });
const eventTime = new Intl.DateTimeFormat("en-HK", { timeStyle: "medium", timeZone: "Asia/Hong_Kong" });
const numericEventTime = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Hong_Kong" });

export function matchesRegistration({ name, code, email, created_at }: Registration, needle: string) {
  const date = new Date(created_at);
  return [name, code, email ?? "", `${eventDate.format(date)}, ${eventTime.format(date)}`, numericEventTime.format(date)]
    .some((field) => field.toLowerCase().includes(needle));
}

function RegistrationTime({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <time dateTime={value} className="block text-sm tabular-nums text-[#2b2042]">
      {eventDate.format(date)}
      <span className="block text-[#635575]">{eventTime.format(date)}</span>
    </time>
  );
}

function RegistrationCode({ code }: { code: string }) {
  return (
    <code className="inline-block max-w-full rounded-md bg-[#eee7fa] px-2 py-1 text-[13px] leading-5 font-semibold [overflow-wrap:anywhere] text-[#4d2383]">
      {code}
    </code>
  );
}

function RegistrationEmail({ email }: { email: string | null }) {
  return <span className="text-sm [overflow-wrap:anywhere] text-[#514066]">{email ?? "Unavailable"}</span>;
}

const fieldLabel = "mb-1 text-[13px] font-semibold text-[#635575]";
const pageLink = "inline-flex min-h-11 items-center rounded-lg border border-[#d9cdeb] bg-white px-4 text-sm font-semibold text-[#531bb1] hover:bg-[#f2ebfc]";

export function RegistrationList({ rows, page, offset, hasNextPage, search, pending }: {
  rows: Registration[];
  page: number;
  offset: number;
  hasNextPage: boolean;
  search: string;
  pending: boolean;
}) {
  function pageHref(pageNumber: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (pageNumber > 1) params.set("page", String(pageNumber));
    const queryString = params.toString();
    return queryString ? `/admin?${queryString}` : "/admin";
  }

  return (
    <section aria-label="Registration list" aria-busy={pending} className="mt-5 sm:mt-6">
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#d9cdeb] bg-white p-8 text-center text-sm text-[#635575]">
          {pending ? "Checking all registrations…" : page > 1 ? "No registrations on this page." : search ? "No registrations match your search." : "No booth registrations yet."}
        </p>
      ) : (
        <>
          <ul role="list" className="grid gap-3 sm:grid-cols-2 md:hidden">
            {rows.map(({ name, code, email, created_at }) => (
              <li key={code} className="rounded-2xl border border-[#e5dcf0] bg-white p-4 shadow-[0_3px_14px_#2d145709]">
                <h2 className="text-base leading-snug font-bold [overflow-wrap:anywhere] text-[#221539]">{name}</h2>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3.5 border-t border-[#eee8f5] pt-3">
                  <div className="min-w-0">
                    <dt className={fieldLabel}>Reference</dt>
                    <dd><RegistrationCode code={code} /></dd>
                  </div>
                  <div className="min-w-0">
                    <dt className={fieldLabel}>Registered</dt>
                    <dd><RegistrationTime value={created_at} /></dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={fieldLabel}>Email address</dt>
                    <dd><RegistrationEmail email={email} /></dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-2xl border border-[#e5dcf0] bg-white shadow-[0_8px_28px_#2d14570a] md:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <caption className="sr-only">Registered booth visitors</caption>
              <thead className="bg-[#f0e9fa] text-[13px] font-semibold text-[#514066]">
                <tr>
                  <th scope="col" className="w-[25%] px-4 py-3.5 lg:px-5">Full name</th>
                  <th scope="col" className="w-[20%] px-4 py-3.5 lg:px-5">Reference</th>
                  <th scope="col" className="w-[35%] px-4 py-3.5 lg:px-5">Email address</th>
                  <th scope="col" className="w-[20%] px-4 py-3.5 lg:px-5">Time of registration</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ name, code, email, created_at }) => (
                  <tr key={code} className="border-t border-[#eee8f5] align-middle hover:bg-[#fcfaff]">
                    <th scope="row" className="px-4 py-3.5 font-semibold [overflow-wrap:anywhere] text-[#221539] lg:px-5">{name}</th>
                    <td className="px-4 py-3.5 lg:px-5"><RegistrationCode code={code} /></td>
                    <td className="px-4 py-3.5 lg:px-5"><RegistrationEmail email={email} /></td>
                    <td className="px-4 py-3.5 lg:px-5"><RegistrationTime value={created_at} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!pending && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#635575]">
          {rows.length > 0 && <p>Showing {search ? "matches " : ""}{offset + 1}–{offset + rows.length}</p>}
          {(page > 1 || hasNextPage) && (
            <nav aria-label="Registration pages" className="flex flex-wrap items-center gap-2.5">
              {page > 1 && <Link href={pageHref(page - 1)} className={pageLink}>Previous</Link>}
              <span className="tabular-nums">Page {page}</span>
              {hasNextPage && <Link href={pageHref(page + 1)} className={pageLink}>Next</Link>}
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
