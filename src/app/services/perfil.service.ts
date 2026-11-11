import { Injectable } from '@angular/core';
import { AlmacenamientoService } from './almacenamiento.service';
import { Perfil } from '../models/perfil.model';

/** Equivale a data/perfil/PerfilRepository.kt + PerfilStore.kt */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly CLAVE = 'perfil';

  constructor(private almacenamiento: AlmacenamientoService) {}

  guardar(perfil: Perfil): Promise<void> {
    return this.almacenamiento.guardar(this.CLAVE, perfil);
  }

  perfilActual(): Promise<Perfil | null> {
    return this.almacenamiento.leer<Perfil | null>(this.CLAVE, null);
  }

  async nacionalidad(): Promise<string | null> {
    return (await this.perfilActual())?.nacionalidad || null;
  }
}