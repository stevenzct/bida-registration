export function formatRegistrationCode(value: number) {
  return `BIDA-${value.toString(36).toUpperCase()}`;
}

export function isRegistrationCode(value: unknown): value is string {
  return typeof value === "string" && /^(?:BIDA|DEMO)-[A-Z0-9]{1,7}$/.test(value);
}
