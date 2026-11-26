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

export function registerVisitor(name: string, interests: string[]) {
  const registrations = readRegistrations();
  const random = new Uint32Array(1);
  let code: string;

  do {
    code = `DEMO-${crypto.getRandomValues(random)[0].toString(36).toUpperCase()}`;
  } while (registrations.some((registration) => registration.code === code));

  registrations.push({ name, code, interests, checked: [], created: new Date().toISOString() });
  sessionStorage.setItem(storageKey, JSON.stringify(registrations));
  return code;
}

export function hasRegistration(code: string) {
  try {
    return readRegistrations().some((registration) => registration.code === code && registration.name);
  } catch {
    return false;
  }
}
