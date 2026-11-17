import { Injectable, inject } from '@angular/core';

import { StorageKeys } from '../storage/storage-keys';
import { StorageService } from '../storage/storage.service';

import type { Account } from './models/account.model';
import { verifyPassword } from './password-hash';
import type { PasswordHashData } from './password-hash';

/** Saves and manages registered accounts on the device. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly storage = inject(StorageService);

  /** Registers or updates an account with hashed credentials. */
  async register(email: string, credentials: PasswordHashData): Promise<void> {
    const salt = credentials.salt ?? credentials.sal ?? '';
    const accounts = (await this.getAll()).filter((c) => (c.email ?? c.correo) !== email);
    accounts.push({
      email,
      salt,
      hash: credentials.hash,
      correo: email,
      sal: salt,
    });
    await this.storage.set(StorageKeys.accounts, accounts);
  }

  async exists(email: string): Promise<boolean> {
    return (await this.getAll()).some((c) => (c.email ?? c.correo) === email);
  }

  async verify(email: string, password: string): Promise<boolean> {
    const account = (await this.getAll()).find((c) => (c.email ?? c.correo) === email);
    if (!account) return false;
    const salt = account.salt ?? account.sal ?? '';
    return verifyPassword(password, salt, account.hash);
  }

  async getAll(): Promise<Account[]> {
    return this.storage.get<Account[]>(StorageKeys.accounts, []);
  }

  async registrar(correo: string, credenciales: PasswordHashData): Promise<void> {
    return this.register(correo, credenciales);
  }

  async existe(correo: string): Promise<boolean> {
    return this.exists(correo);
  }

  async verificar(correo: string, password: string): Promise<boolean> {
    return this.verify(correo, password);
  }

  async todas(): Promise<Account[]> {
    return this.getAll();
  }
}
