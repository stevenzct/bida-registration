export const verificationCodePrefix = "BIDA-";
export const verificationDigitCount = 4;
export const legacyVerificationCodeLength = 8;

export function parseVerificationDigits(value: unknown) {
  return typeof value === "string" ? /^(?:BIDA-)?([0-9]{4})$/i.exec(value)?.[1] ?? "" : "";
}

export function normalizeLegacyVerificationCode(value: unknown) {
  if (typeof value !== "string") return "";
  const code = value.trim().toUpperCase();
  return /^[A-HJ-NP-Z2-9]{8}$/.test(code) ? code : "";
}

export function normalizeVerificationCode(value: unknown) {
  const digits = parseVerificationDigits(value);
  return digits ? `${verificationCodePrefix}${digits}` : normalizeLegacyVerificationCode(value);
}
