// Equivale a core/util/PasswordHash.kt: SHA-256 de (sal + contraseña), en hexadecimal.
const TAMANO_SAL = 16;

export interface PasswordHashData {
  sal: string;
  hash: string;
}

export async function hashPassword(password: string): Promise<PasswordHashData> {
  const sal = crypto.getRandomValues(new Uint8Array(TAMANO_SAL));
  const hash = await calcular(sal, password);
  return { sal: aHex(sal), hash: aHex(hash) };
}

export async function verificarPassword(
  password: string,
  salHex: string,
  hashHex: string
): Promise<boolean> {
  const sal = deHex(salHex);
  if (!sal) return false;
  const hashReal = aHex(await calcular(sal, password));
  return hashReal === hashHex.toLowerCase();
}

async function calcular(sal: Uint8Array, password: string): Promise<Uint8Array> {
  const bytesPassword = new TextEncoder().encode(password);
  const datos = new Uint8Array(sal.length + bytesPassword.length);
  datos.set(sal);
  datos.set(bytesPassword, sal.length);
  const resumen = await crypto.subtle.digest('SHA-256', datos);
  return new Uint8Array(resumen);
}

function aHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function deHex(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}