import { Injectable, inject } from '@angular/core';

import { StorageKeys } from '../storage/storage-keys';
import { StorageService } from '../storage/storage.service';

import { isLegacyFormat, normalizeProfile } from './profile.model';
import type { Profile } from './profile.model';

/** Saves and reads the user profile on the device. */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly storage = inject(StorageService);

  async save(profile: Profile): Promise<void> {
    await this.storage.set(StorageKeys.profile, profile);
  }

  /**
   * Returns current stored profile (normalized with arrays).
   * If legacy comma-separated string format is detected, migrates and re-saves it.
   */
  async getCurrentProfile(): Promise<Profile | null> {
    const raw = await this.storage.get<unknown>(StorageKeys.profile, null);
    const profile = normalizeProfile(raw);
    if (profile && isLegacyFormat(raw)) {
      await this.save(profile);
    }
    return profile;
  }

  async getNationality(): Promise<string | null> {
    const profile = await this.getCurrentProfile();
    return profile?.nationality ?? null;
  }

  async guardar(perfil: Profile): Promise<void> {
    return this.save(perfil);
  }

  async perfilActual(): Promise<Profile | null> {
    return this.getCurrentProfile();
  }

  async nacionalidad(): Promise<string | null> {
    return this.getNationality();
  }
}
