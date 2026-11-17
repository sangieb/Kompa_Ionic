import { Injectable } from '@angular/core';

import { SEED_CATALOGS } from '../../../data/seed-catalogs';
import type { Catalogs } from '../../../data/seed-catalogs';

/** Supplies registration catalogs (nationalities, languages, interests). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  async getLocalCatalogs(): Promise<Catalogs> {
    return {
      nationalities: [...SEED_CATALOGS.nationalities],
      languages: [...SEED_CATALOGS.languages],
      interests: [...SEED_CATALOGS.interests],
      nacionalidades: [...SEED_CATALOGS.nationalities],
      idiomas: [...SEED_CATALOGS.languages],
      intereses: [...SEED_CATALOGS.interests],
    };
  }

  async catalogosLocales(): Promise<Catalogs> {
    return this.getLocalCatalogs();
  }
}
