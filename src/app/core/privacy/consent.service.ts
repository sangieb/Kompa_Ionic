import { Injectable, inject } from '@angular/core';

import { AlmacenamientoService } from '../storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../storage/claves';

import { TERMINOS_VERSION } from './terminos';

/** Prueba local de que el usuario aceptó los documentos legales. */
export interface Consentimiento {
  version: string;
  /** Fecha y hora ISO en la que se otorgó la aceptación. */
  fecha: string;
  terminos: boolean;
  datos: boolean;
}

/** Guarda y consulta el consentimiento informado del usuario. */
@Injectable({ providedIn: 'root' })
export class ConsentimientoService {
  private readonly almacenamiento = inject(AlmacenamientoService);

  async guardar(consentimiento: Omit<Consentimiento, 'version'>): Promise<Consentimiento> {
    const registro: Consentimiento = { version: TERMINOS_VERSION, ...consentimiento };
    await this.almacenamiento.guardar(ClavesAlmacenamiento.consentimiento, registro);
    return registro;
  }

  async actual(): Promise<Consentimiento | null> {
    return this.almacenamiento.leer<Consentimiento | null>(ClavesAlmacenamiento.consentimiento, null);
  }

  /** La versión aceptada sigue siendo la vigente y cubre ambos documentos. */
  async estaVigente(): Promise<boolean> {
    const consentimiento = await this.actual();
    return consentimiento?.version === TERMINOS_VERSION && consentimiento.terminos && consentimiento.datos;
  }
}
