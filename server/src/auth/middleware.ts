import type { NextFunction, Request, Response } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

import { verificarTokenAcceso } from './tokens';

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: { id: string; correo: string };
  }
}

/** Valida el Bearer token de acceso y adjunta el usuario a la petición. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const cabecera = req.headers.authorization ?? '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
  const usuario = token ? verificarTokenAcceso(token) : null;
  if (!usuario) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  req.usuario = usuario;
  next();
}
