import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import type { PositionOptions } from '@capacitor/geolocation';
import { Geolocation } from '@capacitor/geolocation';

import { PermissionsService, isPermissionGranted } from '../permissions/permissions.service';

export interface Coordinate {
  lat: number;
  lon: number;
}

export type Coordenada = Coordinate;

/** Reason why a usable location could not be acquired. */
export type NoLocationReason = 'gps' | 'timeout' | 'accuracy' | 'tiempo' | 'precision';
export type MotivoSinUbicacion = NoLocationReason;

/** Location query result. */
export type LocationResult =
  | { state: 'ok'; coordinate: Coordinate; estado?: 'ok'; coordenada?: Coordinate }
  | { state: 'no-permission'; estado?: 'sin-permiso' }
  | { state: 'services-off'; estado?: 'servicios-apagados' }
  | { state: 'no-signal'; reason: NoLocationReason; estado?: 'sin-senal'; motivo?: NoLocationReason }
  | { estado: 'ok'; coordenada: Coordinate; state?: 'ok'; coordinate?: Coordinate }
  | { estado: 'sin-permiso'; state?: 'no-permission' }
  | { estado: 'servicios-apagados'; state?: 'services-off' }
  | { estado: 'sin-senal'; motivo: NoLocationReason; state?: 'no-signal'; reason?: NoLocationReason };

export type ResultadoUbicacion = LocationResult;

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

const MAX_ACCURACY_METERS = 2000;

/**
 * Service for acquiring device geolocation.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly permissions = inject(PermissionsService);

  async getCurrentPosition(options?: PositionOptions): Promise<LocationResult> {
    const status = await this.permissions.locationStatus();
    if (status === 'services-off' || status === 'servicios-apagados') {
      return { state: 'services-off', estado: 'servicios-apagados' };
    }
    if (status !== 'granted' && !(await this.permissions.requestLocation())) {
      return { state: 'no-permission', estado: 'sin-permiso' };
    }

    try {
      const position = await Geolocation.getCurrentPosition(options ?? (await this.optionsByPermission()));
      const { latitude, longitude, accuracy } = position.coords;
      if (!isValidCoordinate(latitude, longitude, accuracy)) {
        return { state: 'no-signal', reason: 'accuracy', estado: 'sin-senal', motivo: 'precision' };
      }
      const coord: Coordinate = { lat: latitude, lon: longitude };
      return { state: 'ok', coordinate: coord, estado: 'ok', coordenada: coord };
    } catch (error) {
      console.warn('Could not acquire location', error);
      return classifyError(error);
    }
  }

  private async optionsByPermission(): Promise<PositionOptions> {
    if (!Capacitor.isNativePlatform()) return POSITION_OPTIONS;
    try {
      const status = await Geolocation.checkPermissions();
      return { ...POSITION_OPTIONS, enableHighAccuracy: isPermissionGranted(status.location) };
    } catch {
      return POSITION_OPTIONS;
    }
  }

  async obtenerPosicion(opciones?: PositionOptions): Promise<LocationResult> {
    return this.getCurrentPosition(opciones);
  }
}

function isValidCoordinate(lat: number, lon: number, accuracy: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    Number.isFinite(accuracy) &&
    accuracy >= 0 &&
    accuracy <= MAX_ACCURACY_METERS
  );
}

function classifyError(error: unknown): LocationResult {
  const code = (error as { code?: unknown })?.code;
  switch (code) {
    case 'OS-PLUG-GLOC-0003':
      return { state: 'no-permission', estado: 'sin-permiso' };
    case 'OS-PLUG-GLOC-0007':
      return { state: 'services-off', estado: 'servicios-apagados' };
    case 'OS-PLUG-GLOC-0010':
      return { state: 'no-signal', reason: 'timeout', estado: 'sin-senal', motivo: 'tiempo' };
    default:
      if (code === 1) return { state: 'no-permission', estado: 'sin-permiso' };
      if (code === 3) return { state: 'no-signal', reason: 'timeout', estado: 'sin-senal', motivo: 'tiempo' };
      return { state: 'no-signal', reason: 'gps', estado: 'sin-senal', motivo: 'gps' };
  }
}
