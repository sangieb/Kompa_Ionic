import { Injectable } from '@angular/core';

import type { PasswordHashData } from '../../core/auth/password-hash';
import type { Consent } from '../../core/privacy/consent.service';
import type { Profile } from '../../core/profile/profile.model';

export interface RegistrationDraft {
  profile: Profile;
  /** Hashed credentials: plaintext password never leaves the form. */
  credentials: PasswordHashData;
  /** Explicit consent collected during registration. */
  consent: Omit<Consent, 'version'>;
  perfil?: Profile;
  credenciales?: PasswordHashData;
  consentimiento?: Omit<Consent, 'version'>;
}

export type BorradorRegistro = RegistrationDraft;

/**
 * Transfers registration data between steps (form -> preview -> confirmation).
 * Exists only in memory, never persisted.
 */
@Injectable({ providedIn: 'root' })
export class RegistrationDraftService {
  private draft: RegistrationDraft | null = null;

  save(draft: RegistrationDraft): void {
    this.draft = {
      ...draft,
      perfil: draft.profile ?? draft.perfil,
      credenciales: draft.credentials ?? draft.credenciales,
      consentimiento: draft.consent ?? draft.consentimiento,
    };
  }

  get(): RegistrationDraft | null {
    return this.draft;
  }

  clear(): void {
    this.draft = null;
  }

  guardar(borrador: RegistrationDraft): void {
    this.save(borrador);
  }

  obtener(): RegistrationDraft | null {
    return this.get();
  }

  limpiar(): void {
    this.clear();
  }
}
