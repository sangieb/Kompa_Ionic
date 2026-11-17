import { Injectable, inject } from '@angular/core';

import { AlmacenamientoService } from '../storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../storage/claves';

/**
 * Borra todos los datos que Kompa guarda en el dispositivo. Sirve para que
 * el derecho de supresión de la Ley 1581 sea real dentro de la app.
 */
@Injectable({ providedIn: 'root' })
export class DatosUsuarioService {
  private readonly almacenamiento = inject(AlmacenamientoService);

  async eliminarTodo(): Promise<void> {
    const claves = [
      ClavesAlmacenamiento.perfil,
      ClavesAlmacenamiento.cuentas,
      ClavesAlmacenamiento.sesion,
      ClavesAlmacenamiento.actividades,
      ClavesAlmacenamiento.publicaciones,
      ClavesAlmacenamiento.consentimiento,
      ClavesAlmacenamiento.ubicacionSolicitada,
    ];
    await Promise.all(claves.map((clave) => this.almacenamiento.borrar(clave)));
  }
}
