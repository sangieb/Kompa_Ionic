import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';

export interface PasswordHashData {
  salt: string;
  hash: string;
}

const LONGITUD_HASH = 64;

/** Genera un hash scrypt para la contraseña: `saltHex:hashHex`. */
export function hashPassword(password: string): PasswordHashData {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, LONGITUD_HASH);
  return { salt: aHex(salt), hash: aHex(hash) };
}

/** Verifica una contraseña contra un hash scrypt generado por `hashPassword`. */
export function verificarPassword(password: string, hashData: PasswordHashData): boolean {
  const [salHex, hashHex] = hashData.salt.includes(':') ? hashData.salt.split(':') : [hashData.salt, hashData.hash];
  const salt = hexToBytes(salHex);
  const hashReal = scryptSync(password, salt, LONGITUD_HASH);
  const hashGuardado = hexToBytes(hashHex);
  if (salt.length === 0 || hashReal.length !== hashGuardado.length) return false;
  return timingSafeEqual(hashReal, hashGuardado);
}

function aHex(bytes: Buffer | Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Buffer {
  const clean = hex.toLowerCase();
  if (clean.length % 2 !== 0) return Buffer.alloc(0);
  const bytes = Buffer.alloc(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  return bytes;
}
