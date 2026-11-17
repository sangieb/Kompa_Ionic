import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

import { config } from '../config';

export interface TokenAcceso {
  token: string;
  expiraEn: number;
}

export interface TokenRefresh {
  token: string;
  expiraEn: number;
}

export interface UsuarioToken {
  id: string;
  correo: string;
}

/** Emite el access token (JWT corto) y su fecha de caducidad. */
export function crearTokenAcceso(usuario: UsuarioToken): TokenAcceso {
  const token = jwt.sign({ sub: usuario.id, correo: usuario.correo, tipo: 'acceso' }, config.jwtSecret, {
    expiresIn: config.jwtExpiracionMs / 1000,
  });
  const expiraEn = Math.floor(Date.now() / 1000) + config.jwtExpiracionMs / 1000;
  return { token, expiraEn };
}

/** Emite un refresh token opaco aleatorio y su fecha de caducidad. */
export function crearTokenRefresh(): TokenRefresh {
  const token = randomBytes(24).toString('hex');
  const expiraEn = Date.now() + config.jwtExpiracionMs * 2;
  return { token, expiraEn };
}

/** Verifica un access token JWT y devuelve el usuario o null si es inválido. */
export function verificarTokenAcceso(token: string): UsuarioToken | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; correo: string; tipo: string };
    if (payload.tipo !== 'acceso') return null;
    return { id: payload.sub, correo: payload.correo };
  } catch {
    return null;
  }
}
