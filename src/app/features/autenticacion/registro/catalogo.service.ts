import { Injectable } from '@angular/core';

import { CATALOGOS_SEMILLA } from '../../../data/catalogos-semilla';
import type { Catalogos } from '../../../data/catalogos-semilla';

/** Sirve los catálogos del registro (nacionalidades, idiomas, intereses). */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  async catalogosLocales(): Promise<Catalogos> {
    return {
      nacionalidades: [...CATALOGOS_SEMILLA.nacionalidades],
      idiomas: [...CATALOGOS_SEMILLA.idiomas],
      intereses: [...CATALOGOS_SEMILLA.intereses],
    };
  }
}
