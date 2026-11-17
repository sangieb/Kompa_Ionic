import { Injectable, inject } from '@angular/core';

import { AlmacenamientoService } from '../storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../storage/claves';

import { esFormatoViejo, normalizarPerfil } from './perfil.model';
import type { Perfil } from './perfil.model';

/** Guarda y lee el perfil del usuario en el dispositivo. */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly almacenamiento = inject(AlmacenamientoService);

  async guardar(perfil: Perfil): Promise<void> {
    await this.almacenamiento.guardar(ClavesAlmacenamiento.perfil, perfil);
  }

  /**
   * Devuelve el perfil guardado (normalizado a listas). Si encuentra el
   * formato viejo con texto separado por comas, lo migra y lo vuelve a
   * guardar.
   */
  async perfilActual(): Promise<Perfil | null> {
    const bruto = await this.almacenamiento.leer<unknown>(ClavesAlmacenamiento.perfil, null);
    const perfil = normalizarPerfil(bruto);
    if (perfil && esFormatoViejo(bruto)) {
      await this.guardar(perfil);
    }
    return perfil;
  }

  async nacionalidad(): Promise<string | null> {
    return (await this.perfilActual())?.nacionalidad || null;
  }
}
