import { Injectable } from '@angular/core';
import { Perfil } from '../models/perfil.model';

export interface BorradorRegistro {
  perfil: Perfil;
  password: string;
}

/**
 * Lleva los datos del registro a la vista previa y a la confirmación
 * (equivale al Bundle del Intent). Solo vive en memoria, nunca se guarda.
 */
@Injectable({ providedIn: 'root' })
export class RegistroBorradorService {
  private borrador: BorradorRegistro | null = null;

  guardar(borrador: BorradorRegistro) {
    this.borrador = borrador;
  }

  obtener(): BorradorRegistro | null {
    return this.borrador;
  }

  limpiar() {
    this.borrador = null;
  }
}