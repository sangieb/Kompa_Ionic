import { Injectable, inject } from '@angular/core';

import { StorageKeys } from '../storage/storage-keys';
import { StorageService } from '../storage/storage.service';

import { TERMS_VERSION } from './terms';

/** Record of user acceptance of legal documents. */
export interface Consent {
  version: string;
  /** ISO datetime when consent was granted. */
  date: string;
  terms: boolean;
  data: boolean;
  fecha?: string;
  terminos?: boolean;
  datos?: boolean;
}

export type Consentimiento = Consent;

/** Stores and queries user informed consent. */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly storage = inject(StorageService);

  async save(consent: Omit<Consent, 'version'>): Promise<Consent> {
    const record: Consent = {
      version: TERMS_VERSION,
      date: consent.date ?? consent.fecha ?? new Date().toISOString(),
      terms: consent.terms ?? consent.terminos ?? false,
      data: consent.data ?? consent.datos ?? false,
      fecha: consent.date ?? consent.fecha ?? new Date().toISOString(),
      terminos: consent.terms ?? consent.terminos ?? false,
      datos: consent.data ?? consent.datos ?? false,
    };
    await this.storage.set(StorageKeys.consent, record);
    return record;
  }

  async getCurrent(): Promise<Consent | null> {
    return this.storage.get<Consent | null>(StorageKeys.consent, null);
  }

  async isCurrent(): Promise<boolean> {
    const consent = await this.getCurrent();
    const isTermsOk = consent?.terms ?? consent?.terminos ?? false;
    const isDataOk = consent?.data ?? consent?.datos ?? false;
    return consent?.version === TERMS_VERSION && isTermsOk && isDataOk;
  }

  async guardar(consentimiento: Omit<Consent, 'version'>): Promise<Consent> {
    return this.save(consentimiento);
  }

  async actual(): Promise<Consent | null> {
    return this.getCurrent();
  }

  async estaVigente(): Promise<boolean> {
    return this.isCurrent();
  }
}
