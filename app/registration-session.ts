import { formatRegistrationCode } from "./registration-code";

const storageKey = "bida-hk-demo-v1";

type Registration = {
  name: string;
  code: string;
  interests: string[];
  checked: string[];
  created: string;
};

function readRegistrations(): Registration[] {
  return JSON.parse(sessionStorage.getItem(storageKey) || "[]");
}

export function registerVisitor(name: string, interests: string[], confirmedCode?: string) {
  const registrations = readRegistrations();
  let code = confirmedCode;
  if (!code) {
    const random = new Uint32Array(1);
    do {
      code = formatRegistrationCode(crypto.getRandomValues(random)[0]);
    } while (registrations.some((registration) => registration.code === code));
  }

  registrations.push({ name, code, interests, checked: [], created: new Date().toISOString() });
  sessionStorage.setItem(storageKey, JSON.stringify(registrations));
  return code;
}

export function checkRegistrationStorage() {
  const registrations = readRegistrations();
  if (!Array.isArray(registrations)) throw new Error("Invalid registration storage");
  sessionStorage.setItem(storageKey, JSON.stringify(registrations));
}

export function hasRegistration(code: string) {
  try {
    return readRegistrations().some((registration) => registration.code === code && registration.name);
  } catch {
    return false;
  }
}
