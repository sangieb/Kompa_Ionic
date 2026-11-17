import { createHmac, randomBytes } from 'node:crypto';

import { config } from '../config';

export interface TokenRecuperacion {
  token: string;
  expiraEn: number;
}

/**
 * Genera un token de recuperación de contraseña (opaco) y su fecha de
 * caducidad. El token se guarda en servidor con hash SHA-256 y se invalida
 * al consumirse o al expirar.
 */
export function crearTokenRecuperacion(): TokenRecuperacion {
  const token = randomBytes(24).toString('hex');
  const expiraEn = Date.now() + config.resetTokenTtlMs;
  return { token, expiraEn };
}

/** Genera el hash del token tal como se guarda en la base de datos. */
export function hashToken(token: string): string {
  const digest = createHmac('sha256', config.jwtSecret).update(token).digest('hex');
  return digest;
}
