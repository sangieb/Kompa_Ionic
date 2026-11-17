import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import type { PositionOptions } from '@capacitor/geolocation';
import { Geolocation } from '@capacitor/geolocation';

import { PermisosService, permisoConcedido } from '../permisos/permisos.service';

export interface Coordenada {
  lat: number;
  lon: number;
}

/** Motivo por el que no se pudo obtener una posición utilizable. */
export type MotivoSinUbicacion = 'gps' | 'tiempo' | 'precision';

/** Resultado de intentar obtener la ubicación, con el motivo si falla. */
export type ResultadoUbicacion =
  | { estado: 'ok'; coordenada: Coordenada }
  | { estado: 'sin-permiso' }
  | { estado: 'servicios-apagados' }
  | { estado: 'sin-senal'; motivo: MotivoSinUbicacion };

const OPCIONES_POSICION: PositionOptions = {
  // Se ajusta en opcionesSegunPermiso(): alta precisión sólo si el permiso
  // preciso está concedido, porque el plugin elige el alias del permiso según
  // este valor y pedirlo de más volvería a abrir el diálogo nativo.
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

/** Lecturas por encima de este radio no sirven para centrar un mapa urbano. */
const PRECISION_MAXIMA_METROS = 2000;

/**
 * Único punto para obtener la ubicación del dispositivo. Pide el permiso
 * cuando hace falta (en la web lo gestiona el propio navegador) y distingue
 * entre permiso denegado, servicios apagados y falta de señal para que la
 * pantalla explique bien lo que ocurre.
 */
@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly permisos = inject(PermisosService);

  /**
   * Intenta obtener la posición actual. El llamador decide cómo avisar al
   * usuario según el estado devuelto.
   */
  async obtenerPosicion(opciones?: PositionOptions): Promise<ResultadoUbicacion> {
    const estado = await this.permisos.estadoUbicacion();
    if (estado === 'servicios-apagados') return { estado: 'servicios-apagados' };
    if (estado !== 'granted' && !(await this.permisos.solicitarUbicacion())) {
      return { estado: 'sin-permiso' };
    }

    try {
      const posicion = await Geolocation.getCurrentPosition(opciones ?? (await this.opcionesSegunPermiso()));
      const { latitude, longitude, accuracy } = posicion.coords;
      if (!coordenadaValida(latitude, longitude, accuracy)) {
        return { estado: 'sin-senal', motivo: 'precision' };
      }
      return { estado: 'ok', coordenada: { lat: latitude, lon: longitude } };
    } catch (error) {
      console.warn('No se pudo obtener la ubicación', error);
      return clasificarError(error);
    }
  }

  /**
   * Con solo ubicación aproximada hay que usar el alias `coarseLocation`;
   * pedir precisión en cada lectura volvería a abrir el diálogo nativo.
   */
  private async opcionesSegunPermiso(): Promise<PositionOptions> {
    if (!Capacitor.isNativePlatform()) return OPCIONES_POSICION;
    try {
      const estado = await Geolocation.checkPermissions();
      return { ...OPCIONES_POSICION, enableHighAccuracy: permisoConcedido(estado.location) };
    } catch {
      return OPCIONES_POSICION;
    }
  }
}

/** Descarta lecturas incompletas, fuera de rango o demasiado imprecisas. */
function coordenadaValida(lat: number, lon: number, precision: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    Number.isFinite(precision) &&
    precision >= 0 &&
    precision <= PRECISION_MAXIMA_METROS
  );
}

/**
 * El plugin de Android devuelve códigos de texto (`OS-PLUG-GLOC-00XX`) y el
 * navegador códigos numéricos, así que se contemplan ambos formatos.
 */
function clasificarError(error: unknown): ResultadoUbicacion {
  const codigo = (error as { code?: unknown })?.code;
  switch (codigo) {
    case 'OS-PLUG-GLOC-0003':
      return { estado: 'sin-permiso' };
    case 'OS-PLUG-GLOC-0007':
      return { estado: 'servicios-apagados' };
    case 'OS-PLUG-GLOC-0010':
      return { estado: 'sin-senal', motivo: 'tiempo' };
    default:
      if (codigo === 1) return { estado: 'sin-permiso' };
      if (codigo === 3) return { estado: 'sin-senal', motivo: 'tiempo' };
      return { estado: 'sin-senal', motivo: 'gps' };
  }
}
