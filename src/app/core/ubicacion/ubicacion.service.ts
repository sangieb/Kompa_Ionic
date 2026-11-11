import { Injectable, inject } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

import { PermisosService } from '../permisos/permisos.service';

export interface Coordenada {
  lat: number;
  lon: number;
}

const OPCIONES_POSICION = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000,
};

/**
 * Único punto para obtener la ubicación del dispositivo. Pide el permiso
 * cuando hace falta (en la web lo gestiona el propio navegador).
 */
@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly permisos = inject(PermisosService);

  /**
   * Devuelve la posición actual o null si no hay permiso o señal.
   * El llamador decide cómo avisar al usuario.
   */
  async posicionActual(): Promise<Coordenada | null> {
    if (!(await this.permisos.solicitarUbicacion())) return null;
    try {
      const posicion = await Geolocation.getCurrentPosition(OPCIONES_POSICION);
      return { lat: posicion.coords.latitude, lon: posicion.coords.longitude };
    } catch (error) {
      console.warn('No se pudo obtener la ubicación', error);
      return null;
    }
  }
}
