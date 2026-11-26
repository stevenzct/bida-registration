"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { registerVisitor } from "./registration-session";

const activities = [
  "Spin Wheel",
  "Quick Quiz",
  "App Demo",
  "Photo Wall",
  "Scan & Discover",
  "Feedback Wall",
];

export function RegistrationForm() {
  const router = useRouter();
  const visitor = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const name = visitor.current?.value.trim();
    if (!name) {
      setStatus("Enter a full name to continue.");
      visitor.current?.focus();
      return;
    }

    const interests = new FormData(event.currentTarget).getAll("activities") as string[];
    try {
      const code = registerVisitor(name, interests);
      startTransition(() => router.push(`/registered#${code}`));
    } catch {
      setStatus("Could not save in this browser. Enable session storage and try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <label htmlFor="visitor" className="font-bold">Full name <b aria-hidden="true" className="text-[#b5149e]">*</b></label>
      <input
        id="visitor"
        ref={visitor}
        type="text"
        name="visitor"
        autoComplete="name"
        required
        maxLength={100}
        placeholder="Enter a sample full name"
        aria-describedby="status"
        className="mt-1.5 mb-4 w-full rounded-[10px] border border-form-border bg-white px-3.5 py-3 placeholder:text-[#757575]"
      />
      <fieldset className="min-w-0">
        <legend className="mb-[9px] font-bold">Activities (optional)</legend>
        <div className="grid grid-cols-2 gap-2">
          {activities.map((activity) => (
            <label
              key={activity}
              className="flex min-h-11 cursor-pointer items-center gap-[9px] rounded-[40px] border border-[#b99ae5] bg-[#f4eefc] px-[clamp(8px,2vw,18px)] py-[7px] text-[length:clamp(13px,2vw,18px)] font-bold text-[#100d42] has-checked:border-[#ac87df] has-checked:bg-[#ede0fb]"
            >
              <span className="grid size-[clamp(20px,3vw,26px)] shrink-0">
                <input
                  type="checkbox"
                  name="activities"
                  value={activity}
                  className="peer col-start-1 row-start-1 size-full cursor-pointer opacity-0 forced-colors:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none relative col-start-1 row-start-1 rounded-[22%] border-2 border-[#8f6bbb] bg-white peer-checked:border-transparent peer-checked:bg-[#531bb1] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#be6f00] after:absolute after:top-[43%] after:left-1/2 after:hidden after:h-[38%] after:w-[68%] after:-translate-x-1/2 after:-translate-y-1/2 after:-rotate-45 after:rounded-bl-[2px] after:border-b-[3px] after:border-l-[3px] after:border-white peer-checked:after:block forced-colors:invisible"
                />
              </span>
              {activity}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" disabled={isPending} className="primary-action mt-4 w-full rounded-xl px-[18px] py-[13px] text-[18px] font-bold text-white">
        Register my name →
      </button>
      <p id="status" role="status" className="text-[#94203d] not-empty:mt-2.5">{status}</p>
    </form>
  );
}
