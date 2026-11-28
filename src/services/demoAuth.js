const ACCOUNTS_KEY = "ad-demo-accounts";
const ADMIN_KEY = "ad-admin-account";
const DISABLED_ACCOUNTS_KEY = "ad-disabled-accounts";
const ROLE_VALUES = ["Customer", "Administrator"];
const PASSWORD_ITERATIONS = 120_000;
const encoder = new TextEncoder();

/** Reads registered demo accounts while handling missing or malformed browser data. */
function readAccounts() {
  try {
    const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/** Returns registered demo accounts without their stored password verifiers. */
export function getDemoAccounts() {
  return readAccounts().map(({ credential, ...account }) => account);
}

/** Updates a demo account's contact details while preserving its password verifier. */
export function updateDemoAccountProfile(currentEmail, changes) {
  const normalizedCurrent = currentEmail?.trim().toLowerCase();
  const normalizedEmail = changes.email.trim().toLowerCase();
  const accounts = readAccounts();
  const accountIndex = accounts.findIndex((account) => account.email === normalizedCurrent);
  if (accountIndex < 0) return null;
  if (accounts.some((account, index) => index !== accountIndex && account.email === normalizedEmail)) {
    throw new Error("Another demo account already uses that email address.");
  }
  const previous = accounts[accountIndex];
  const updated = {
    ...previous,
    name: changes.name.trim(),
    email: normalizedEmail,
    phone: changes.phone.trim(),
    address: changes.address?.trim() || previous.address || "",
  };
  accounts[accountIndex] = updated;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  const admin = readLegacyAdmin();
  if (admin?.email?.trim().toLowerCase() === normalizedCurrent) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ ...admin, email: normalizedEmail, name: updated.name }));
  }
  return toSessionUser(updated);
}

/** Reports whether an account is enabled in this browser demo. */
export function isDemoAccountActive(email) {
  try {
    const disabled = JSON.parse(localStorage.getItem(DISABLED_ACCOUNTS_KEY) || "[]");
    return !disabled.includes(email?.trim().toLowerCase());
  } catch {
    return true;
  }
}

/** Enables or disables a customer demo account by email. */
export function setDemoAccountActive(email, active) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find((entry) => entry.email === normalizedEmail);
  if (!account || account.role !== "Customer") {
    throw new Error("Only customer accounts can be managed here.");
  }
  let disabled = [];
  try {
    const stored = JSON.parse(localStorage.getItem(DISABLED_ACCOUNTS_KEY) || "[]");
    disabled = Array.isArray(stored) ? stored : [];
  } catch {
    disabled = [];
  }
  const next = active
    ? disabled.filter((item) => item !== normalizedEmail)
    : [...new Set([...disabled, normalizedEmail])];
  localStorage.setItem(DISABLED_ACCOUNTS_KEY, JSON.stringify(next));
  return active;
}

/** Permanently removes a registered customer account from this browser demo. */
export function deleteDemoAccount(email) {
  const normalizedEmail = email?.trim().toLowerCase();
  const accounts = readAccounts();
  const account = accounts.find((entry) => entry.email?.trim().toLowerCase() === normalizedEmail);
  if (!account || account.role !== "Customer") {
    throw new Error("Only registered customer accounts can be deleted.");
  }

  localStorage.setItem(
    ACCOUNTS_KEY,
    JSON.stringify(accounts.filter((entry) => entry.email?.trim().toLowerCase() !== normalizedEmail)),
  );
  try {
    const disabled = JSON.parse(localStorage.getItem(DISABLED_ACCOUNTS_KEY) || "[]");
    if (Array.isArray(disabled)) {
      localStorage.setItem(DISABLED_ACCOUNTS_KEY, JSON.stringify(disabled.filter((item) => item !== normalizedEmail)));
    }
  } catch {
    localStorage.removeItem(DISABLED_ACCOUNTS_KEY);
  }
  try {
    const session = JSON.parse(localStorage.getItem("ad-user") || "null");
    if (session?.email?.trim().toLowerCase() === normalizedEmail) localStorage.removeItem("ad-user");
  } catch {
    localStorage.removeItem("ad-user");
  }
  return { ...account, email: normalizedEmail };
}

/** Converts binary key material to a compact string safe to store in local storage. */
function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Generates a non-secret local identifier for a registered demo account. */
function createDemoId() {
  return toHex(crypto.getRandomValues(new Uint8Array(12)));
}

/** Reads the one-time administrator marker created by earlier demo versions. */
function readLegacyAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || "null");
  } catch {
    return null;
  }
}

/** Allows the existing one-time admin to set a verifier after the demo upgrade. */
function isLegacyAdminSetup(email, accounts) {
  const legacyAdmin = readLegacyAdmin();
  return (
    Boolean(legacyAdmin?.email) &&
    legacyAdmin.email.toLowerCase() === email &&
    !accounts.some((account) => account.role === "Administrator")
  );
}

/** Creates a salted PBKDF2 verifier so demo passwords are not kept as plain text. */
async function createPasswordVerifier(password, saltBytes = crypto.getRandomValues(new Uint8Array(16))) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Password verification needs a secure browser context. Open the app on localhost or over HTTPS, then try again.",
    );
  }
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const result = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return { salt: toHex(saltBytes), hash: toHex(new Uint8Array(result)) };
}

/** Registers a browser-local demo account and reserves the administrator role once. */
export async function registerDemoAccount({ name, email, password, role, serviceCenterId }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!ROLE_VALUES.includes(role)) throw new Error("Choose a valid account role.");
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
  if (readAccounts().some((account) => account.email === normalizedEmail)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }
  if (
    role === "Administrator" &&
    localStorage.getItem(ADMIN_KEY) &&
    !isLegacyAdminSetup(normalizedEmail, readAccounts())
  ) {
    throw new Error("An administrator account has already been created. Sign in with that account.");
  }

  const credential = await createPasswordVerifier(password);
  // Recheck after the async hash so two submissions in this browser cannot both claim an account.
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }
  if (
    role === "Administrator" &&
    localStorage.getItem(ADMIN_KEY) &&
    !isLegacyAdminSetup(normalizedEmail, accounts)
  ) {
    throw new Error("An administrator account has already been created. Sign in with that account.");
  }

  const account = {
    id: `demo-${createDemoId()}`,
    name: name.trim() || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    role,
    phone: "+91 98765 43210",
    credential,
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  if (role === "Administrator") {
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ email: normalizedEmail, name: account.name }));
  }
  return toSessionUser(account);
}

/** Removes the private password verifier before a profile enters shared app state. */
function toSessionUser(account) {
  const { credential, ...user } = account;
  return user;
}

/** Authenticates a demo user by email and password without allowing role selection at sign-in. */
export async function signInDemoAccount({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find((item) => item.email === normalizedEmail);
  if (!account?.credential) throw new Error("Email or password is incorrect.");
  if (!ROLE_VALUES.includes(account.role)) throw new Error("This account role is no longer supported.");
  if (!isDemoAccountActive(normalizedEmail)) {
    throw new Error("This account is inactive. Please contact the dealership administrator.");
  }
  const saltBytes = Uint8Array.from(
    account.credential.salt.match(/.{2}/g) || [],
    (pair) => Number.parseInt(pair, 16),
  );
  const candidate = await createPasswordVerifier(password, saltBytes);
  if (candidate.hash !== account.credential.hash) {
    throw new Error("Email or password is incorrect.");
  }
  return toSessionUser(account);
}

/** Reports whether the existing admin marker can still be upgraded to a password account. */
export function hasLegacyAdminSetup() {
  const accounts = readAccounts();
  return Boolean(readLegacyAdmin()) && !accounts.some((account) => account.role === "Administrator");
}

/** Reports whether a password-backed administrator account now exists in this browser. */
export function hasDemoAdministrator() {
  return readAccounts().some((account) => account.role === "Administrator");
}
