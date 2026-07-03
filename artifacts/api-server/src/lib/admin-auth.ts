import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const PIN_SALT = "aditya-general-store-admin-salt";

// SHA-256 hash of the store PIN, computed with a fixed salt. The plaintext PIN
// is never stored or compared directly — only its hash is checked.
const ADMIN_PIN_HASH = hashPin("9675");

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSessionSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required for admin authentication.");
  }
  return secret;
}

function hashPin(pin: string): string {
  return createHash("sha256").update(`${PIN_SALT}:${pin}`).digest("hex");
}

export function verifyPin(pin: string): boolean {
  const candidateHash = hashPin(pin);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(ADMIN_PIN_HASH, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function issueAdminToken(): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${expiresAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [payload, signature] = decoded.split(".");
    if (!payload || !signature) return false;

    const expectedSignature = sign(payload);
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expectedSignature, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

    const expiresAt = Number(payload);
    if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return false;

    return true;
  } catch {
    return false;
  }
}
