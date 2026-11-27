"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { legacyVerificationCodeLength, parseVerificationDigits, verificationCodePrefix, verificationDigitCount } from "./verification-code";

export function VerificationInput({ disabled, onEdit }: { disabled: boolean; onEdit: () => void }) {
  const [digits, setDigits] = useState(() => Array<string>(verificationDigitCount).fill(""));
  const [useLegacy, setUseLegacy] = useState(false);
  const fields = useRef<(HTMLInputElement | null)[]>([]);

  function fillCode(code: string) {
    setDigits([...code]);
    onEdit();
    fields.current[verificationDigitCount - 1]?.focus();
  }

  function changeDigit(index: number, value: string) {
    if (/^[0-9]?$/.test(value)) {
      setDigits((previous) => previous.map((digit, position) => position === index ? value : digit));
      onEdit();
      if (value) fields.current[index + 1]?.focus();
      return;
    }

    const code = parseVerificationDigits(value);
    if (code) fillCode(code);
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    changeDigit(index, event.clipboardData.getData("text"));
  }

  function handleBackspace(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== "Backspace" || digits[index] || index === 0) return;
    event.preventDefault();
    changeDigit(index - 1, "");
    fields.current[index - 1]?.focus();
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="font-bold">Verification code</legend>
      {useLegacy ? (
        <input
          name="legacyCode"
          aria-label="Older verification code"
          onChange={onEdit}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={legacyVerificationCodeLength}
          placeholder="Enter your 8-character code"
          required
          className="mt-1.5 min-h-12 w-full rounded-[10px] border border-form-border bg-white px-3.5 py-2.5 text-base placeholder:text-[#757575]"
        />
      ) : (
        <div className="mt-1.5 flex items-center justify-center gap-2 sm:justify-start">
          <span className="shrink-0 font-bold text-[#531bb1]">{verificationCodePrefix}</span>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(field) => { fields.current[index] = field; }}
              name="digit"
              aria-label={`Digit ${index + 1} of ${verificationDigitCount}`}
              value={digit}
              onChange={(event) => changeDigit(index, event.currentTarget.value)}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => handleBackspace(event, index)}
              onPaste={(event) => pasteCode(event, index)}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              pattern="[0-9]"
              required
              className="h-12 w-11 min-w-0 rounded-[10px] border border-[#d9cdeb] bg-white text-center text-base font-bold"
            />
          ))}
        </div>
      )}
      <button type="button" onClick={() => { setUseLegacy(!useLegacy); onEdit(); }} className="mt-1.5 block text-sm text-[#635575] underline">
        {useLegacy ? "Use a four-digit code" : "Have an older code?"}
      </button>
    </fieldset>
  );
}
