"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RegistrationList, type Registration } from "./registration-list";

export function RegistrationSearch({ search, maxLength, rows, page, offset, hasNextPage }: {
  search: string;
  maxLength: number;
  rows?: Registration[];
  page: number;
  offset: number;
  hasNextPage: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(search);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function restoreSearch() {
      setValue(new URLSearchParams(window.location.search).get("q") ?? "");
    }

    window.addEventListener("popstate", restoreSearch);
    return () => {
      window.removeEventListener("popstate", restoreSearch);
    };
  }, []);

  function searchTerm(nextValue: string) {
    return nextValue.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
  }

  function applySearch(nextValue: string) {
    setValue(nextValue);
    const q = searchTerm(nextValue);
    router.replace(q ? `/admin?${new URLSearchParams({ q })}` : "/admin", { scroll: false });
  }

  const term = searchTerm(value);
  const pending = term !== search;
  const needle = term.toLowerCase();
  const visibleRows = pending
    ? rows?.filter(({ name, code, interests }) => [name, code, interests.join(", ")]
      .some((field) => field.toLowerCase().includes(needle)))
    : rows;

  return (
    <>
      <form
        action="/admin"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch(value);
        }}
        className="mt-5 rounded-2xl border border-[#e5dcf0] bg-white p-4 sm:mt-6 sm:px-5"
      >
        <label htmlFor="registration-search" className="text-sm font-semibold text-[#2b2042]">Search registrations</label>
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={input}
            id="registration-search"
            name="q"
            type="search"
            placeholder="Name, code, or activity"
            maxLength={maxLength}
            value={value}
            onChange={(event) => applySearch(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-[#cfc2df] bg-white px-3 text-base text-[#221539] placeholder:text-[#635575] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                applySearch("");
                input.current?.focus();
              }}
              className="min-h-11 shrink-0 rounded-lg border border-[#d9cdeb] px-3.5 text-sm font-semibold text-[#531bb1] hover:bg-[#f2ebfc]"
            >
              Clear
            </button>
          )}
        </div>
      </form>
      {visibleRows ? (
        <RegistrationList rows={visibleRows} page={page} offset={offset} hasNextPage={hasNextPage} search={search} pending={pending} />
      ) : (
        <p role="status" className="mt-5 rounded-2xl border border-[#e5dcf0] bg-white p-5 text-sm text-[#635575]">Could not load registrations. The dashboard will retry automatically.</p>
      )}
    </>
  );
}
