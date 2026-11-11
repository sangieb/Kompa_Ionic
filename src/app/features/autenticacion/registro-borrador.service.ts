import { Injectable } from '@angular/core';

import type { PasswordHashData } from '../../core/auth/password-hash';
import type { Perfil } from '../../core/perfil/perfil.model';

export interface BorradorRegistro {
  perfil: Perfil;
  /** Contraseña ya hasheada: el texto plano nunca sale del formulario. */
  credenciales: PasswordHashData;
}

/**
 * Lleva los datos del registro a la vista previa y a la confirmación
 * (equivale al Bundle del Intent). Solo vive en memoria, nunca se guarda.
 */
@Injectable({ providedIn: 'root' })
export class RegistroBorradorService {
  private borrador: BorradorRegistro | null = null;

  guardar(borrador: BorradorRegistro): void {
    this.borrador = borrador;
  }

  obtener(): BorradorRegistro | null {
    return this.borrador;
  }

  limpiar(): void {
    this.borrador = null;
  }
}
