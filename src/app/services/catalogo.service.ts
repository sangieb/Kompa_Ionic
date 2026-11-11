import { Injectable } from '@angular/core';
import { Catalogos, CATALOGOS_SEMILLA } from '../data/catalogos-semilla';

/**
 * Equivale a data/catalogo/CatalogoRepository.kt.
 * La API de Kompa (api.kompa.example) es de demostración y no existe,
 * así que se usan siempre los catálogos semilla.
 */
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