// SHA-256 of (salt + password) in hexadecimal.
// Note: on a real backend, hashing is performed on the server.
const SALT_SIZE = 16;

export interface PasswordHashData {
  salt: string;
  hash: string;
  sal?: string;
}

export async function hashPassword(password: string): Promise<PasswordHashData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const hash = await computeHash(salt, password);
  const saltHex = toHex(salt);
  const hashHex = toHex(hash);
  return { salt: saltHex, hash: hashHex, sal: saltHex };
}

export async function verifyPassword(password: string, saltHex: string, hashHex: string): Promise<boolean> {
  const salt = fromHex(saltHex);
  if (!salt) return false;
  const actualHash = toHex(await computeHash(salt, password));
  return actualHash === hashHex.toLowerCase();
}

export const verificarPassword = verifyPassword;

async function computeHash(salt: Uint8Array, password: string): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  const data = new Uint8Array(salt.length + passwordBytes.length);
  data.set(salt);
  data.set(passwordBytes, salt.length);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
