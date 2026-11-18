import { Injectable, inject } from '@angular/core';

import { StorageKeys } from '../storage/storage-keys';
import { StorageService } from '../storage/storage.service';

import { AccountService } from './account.service';

/** Minimum password length. */
export const MIN_PASSWORD_LEN = 6;

/** Result of a login attempt. */
export enum LoginResult {
  SUCCESS = 'SUCCESS',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  WRONG_PASSWORD = 'WRONG_PASSWORD',
}

export interface Session {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const ACCESS_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * User session management.
 * Note: tokens are mock tokens for client-side persistence.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly accounts = inject(AccountService);

  async login(email: string, password: string): Promise<LoginResult> {
    if (!email.trim() || !password.trim() || password.length < MIN_PASSWORD_LEN) {
      return LoginResult.WRONG_PASSWORD;
    }
    if (!(await this.accounts.exists(email))) {
      return LoginResult.ACCOUNT_NOT_FOUND;
    }
    if (!(await this.accounts.verify(email, password))) {
      return LoginResult.WRONG_PASSWORD;
    }
    await this.createSession(email);
    return LoginResult.SUCCESS;
  }

  async createSession(email: string): Promise<void> {
    const session: Session = {
      userId: crypto.randomUUID(),
      email,
      accessToken: `mock_access_${crypto.randomUUID()}`,
      refreshToken: `mock_refresh_${crypto.randomUUID()}`,
      expiresAt: Date.now() + ACCESS_DURATION_MS,
    };
    await this.storage.set(StorageKeys.session, session);
  }

  async hasActiveSession(): Promise<boolean> {
    return this.storage.has(StorageKeys.session);
  }

  async getCurrentEmail(): Promise<string | null> {
    const session = await this.storage.get<Session | null>(StorageKeys.session, null);
    return session?.email ?? null;
  }

  async logout(): Promise<void> {
    await this.storage.remove(StorageKeys.session);
  }

  async crearSesion(correo: string): Promise<void> {
    return this.createSession(correo);
  }

  async sesionActiva(): Promise<boolean> {
    return this.hasActiveSession();
  }

  async correoActual(): Promise<string | null> {
    return this.getCurrentEmail();
  }
}
