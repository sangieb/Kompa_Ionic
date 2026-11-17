import { inject } from '@angular/core';
import type { CanActivateFn, UrlTree } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Solo deja pasar a las rutas privadas (mapa, lista, feed, perfil…) cuando
 * hay una sesión activa; si no, manda al inicio.
 */
export const sesionGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.sesionActiva()) return true;
  return router.parseUrl('/inicio');
};
