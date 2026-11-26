export const verificationAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const verificationCodeLength = 8;

export function normalizeVerificationCode(value: unknown) {
  if (typeof value !== "string") return "";
  const code = value.trim().toUpperCase();
  return code.length === verificationCodeLength && [...code].every((character) => verificationAlphabet.includes(character)) ? code : "";
}
