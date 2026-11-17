import { inject } from '@angular/core';
import type { CanActivateFn, UrlTree } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Restricts private routes (map, activities, feed, profile) to active sessions.
 * Redirects to /welcome (or /inicio) when not logged in.
 */
export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.hasActiveSession()) return true;
  return router.parseUrl('/welcome');
};
