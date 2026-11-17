import { Injectable, inject } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

import { PermisosService } from '../permisos/permisos.service';

export interface Coordenada {
  lat: number;
  lon: number;
}

/** Resultado de intentar obtener la ubicación, con el motivo si falla. */
export type ResultadoUbicacion =
  | { estado: 'ok'; coordenada: Coordenada }
  | { estado: 'sin-permiso' }
  | { estado: 'sin-senal'; motivo: 'gps' | 'tiempo' };

const OPCIONES_POSICION = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000,
};

/**
 * Único punto para obtener la ubicación del dispositivo. Pide el permiso
 * cuando hace falta (en la web lo gestiona el propio navegador) y distingue
 * entre permiso denegado y falta de señal para que la pantalla explique bien
 * lo que ocurre.
 */
@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly permisos = inject(PermisosService);

  /**
   * Intenta obtener la posición actual. El llamador decide cómo avisar al
   * usuario según el estado devuelto.
   */
  async obtenerPosicion(): Promise<ResultadoUbicacion> {
    if (!(await this.permisos.solicitarUbicacion())) return { estado: 'sin-permiso' };
    try {
      const posicion = await Geolocation.getCurrentPosition(OPCIONES_POSICION);
      return {
        estado: 'ok',
        coordenada: { lat: posicion.coords.latitude, lon: posicion.coords.longitude },
      };
    } catch (error) {
      console.warn('No se pudo obtener la ubicación', error);
      const codigo = (error as { code?: number })?.code;
      return { estado: 'sin-senal', motivo: codigo === 3 ? 'tiempo' : 'gps' };
    }
  }

  /** Atajo para los llamadores que solo necesitan las coordenadas. */
  async posicionActual(): Promise<Coordenada | null> {
    const resultado = await this.obtenerPosicion();
    return resultado.estado === 'ok' ? resultado.coordenada : null;
  }
}
