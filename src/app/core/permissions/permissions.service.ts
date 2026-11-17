import { Injectable, inject } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import type { PermissionStatus } from '@capacitor/geolocation';
import { Geolocation } from '@capacitor/geolocation';
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';

import { MessageService } from '../message/message.service';

/** Native permission status matching Capacitor's PermissionState. */
export type PermissionState = 'granted' | 'granted-always' | 'limited' | 'denied' | 'prompt' | 'prompt-with-rationale';

export type EstadoPermiso = PermissionState;

/** Simplified UI permission state. */
export type PermissionUiState = 'granted' | 'prompt' | 'denied' | 'services-off' | 'servicios-apagados' | 'unavailable';
export type EstadoPermisoUi = PermissionUiState;

/** Plugin error code when system location service is disabled. */
export const SERVICES_OFF_CODE = 'OS-PLUG-GLOC-0007';

export function isPermissionGranted(state: PermissionState | null | undefined): boolean {
  return state === 'granted' || state === 'granted-always' || state === 'limited';
}

export const permisoConcedido = isPermissionGranted;

/**
 * Service managing device permissions (camera, gallery, geolocation).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly messages = inject(MessageService);

  async requestCamera(): Promise<boolean> {
    const state = await this.request(async () => {
      return (await Camera.requestPermissions({ permissions: ['camera'] })).camera;
    });
    return isPermissionGranted(state);
  }

  async requestGallery(): Promise<boolean> {
    if (Capacitor.getPlatform() !== 'ios') return true;
    const state = await this.request(async () => {
      return (await Camera.requestPermissions({ permissions: ['photos'] })).photos;
    });
    return isPermissionGranted(state);
  }

  async requestLocation(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const state = await Geolocation.checkPermissions();
      if (isPermissionGranted(state.location) || isPermissionGranted(state.coarseLocation)) return true;
      if (state.location === 'denied' && state.coarseLocation === 'denied') return false;

      const requested = await Geolocation.requestPermissions();
      return isPermissionGranted(requested.location) || isPermissionGranted(requested.coarseLocation);
    } catch (error) {
      console.warn('Could not request location permission', error);
      return false;
    }
  }

  async locationStatus(): Promise<PermissionUiState> {
    if (!Capacitor.isNativePlatform()) return this.webLocationStatus();
    try {
      return simplifyLocation(await Geolocation.checkPermissions());
    } catch (error) {
      console.warn('Could not check location permission', error);
      return isServicesOff(error) ? 'servicios-apagados' : 'unavailable';
    }
  }

  async cameraStatus(): Promise<PermissionUiState> {
    if (!Capacitor.isNativePlatform()) return 'prompt';
    try {
      return simplify((await Camera.checkPermissions()).camera);
    } catch (error) {
      console.warn('Could not check camera permission', error);
      return 'unavailable';
    }
  }

  async openAppSettings(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      await this.messages.show('Abre los ajustes del sitio en tu navegador para cambiar este permiso.');
      return;
    }
    try {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App,
      });
    } catch (error) {
      console.warn('Could not open app settings', error);
      await this.messages.show('Abre Ajustes › Aplicaciones › Kompa › Permisos.');
    }
  }

  async openLocationSettings(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      await this.messages.show('Activa la ubicación en los ajustes del navegador o del sistema.');
      return;
    }
    try {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.Location,
        optionIOS: IOSSettings.LocationServices,
      });
    } catch (error) {
      console.warn('Could not open location settings', error);
      await this.messages.show('Activa la ubicación en los ajustes del teléfono.');
    }
  }

  async ensureCamera(): Promise<boolean> {
    if (await this.requestCamera()) return true;
    await this.messages.show('Sin permiso de cámara. Actívalo en los ajustes del sistema para tomar fotos.');
    return false;
  }

  async ensureGallery(): Promise<boolean> {
    if (await this.requestGallery()) return true;
    await this.messages.show('Sin permiso de galería. Actívalo en los ajustes del sistema para elegir fotos.');
    return false;
  }

  private async request(action: () => Promise<PermissionState | undefined>): Promise<PermissionState | null> {
    if (!Capacitor.isNativePlatform()) return 'granted';
    try {
      return (await action()) ?? 'denied';
    } catch (error) {
      console.warn('Could not request permission', error);
      return 'denied';
    }
  }

  private async webLocationStatus(): Promise<PermissionUiState> {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'prompt';
    try {
      const state = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (state.state === 'granted') return 'granted';
      if (state.state === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  async solicitarCamara(): Promise<boolean> {
    return this.requestCamera();
  }

  async solicitarGaleria(): Promise<boolean> {
    return this.requestGallery();
  }

  async solicitarUbicacion(): Promise<boolean> {
    return this.requestLocation();
  }

  async estadoUbicacion(): Promise<PermissionUiState> {
    return this.locationStatus();
  }

  async estadoCamara(): Promise<PermissionUiState> {
    return this.cameraStatus();
  }

  async abrirAjustesApp(): Promise<void> {
    return this.openAppSettings();
  }

  async abrirAjustesUbicacion(): Promise<void> {
    return this.openLocationSettings();
  }

  async asegurarCamara(): Promise<boolean> {
    return this.ensureCamera();
  }

  async asegurarGaleria(): Promise<boolean> {
    return this.ensureGallery();
  }
}

function isServicesOff(error: unknown): boolean {
  return (error as { code?: unknown })?.code === SERVICES_OFF_CODE;
}

function simplifyLocation(status: PermissionStatus): PermissionUiState {
  if (isPermissionGranted(status.location) || isPermissionGranted(status.coarseLocation)) return 'granted';
  if (status.location === 'denied' || status.coarseLocation === 'denied') return 'denied';
  return 'prompt';
}

function simplify(state: PermissionState): PermissionUiState {
  if (isPermissionGranted(state)) return 'granted';
  if (state === 'denied') return 'denied';
  if (state === 'prompt' || state === 'prompt-with-rationale') return 'prompt';
  return 'unavailable';
}
