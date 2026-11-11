import { Injectable, inject } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import { MensajeService } from '../mensaje/mensaje.service';

/** Estado de un permiso nativo, igual que PermissionState de Capacitor. */
export type EstadoPermiso =
  | 'granted'
  | 'granted-always'
  | 'limited'
  | 'denied'
  | 'prompt'
  | 'prompt-with-rationale';

export function permisoConcedido(estado: EstadoPermiso | null | undefined): boolean {
  // 'limited' es el acceso parcial a fotos de Android 14+: alcanza para elegir.
  return estado === 'granted' || estado === 'granted-always' || estado === 'limited';
}

/**
 * Punto único para pedir los permisos nativos de cámara, galería y ubicación.
 *
 * En la web no hay permisos de Android: la cámara/galería abren el selector de
 * archivos y la ubicación la pide el propio navegador, así que allí todo se
 * considera concedido y el permiso real lo gestiona el navegador.
 */
@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly mensajes = inject(MensajeService);

  async solicitarCamara(): Promise<boolean> {
    const estado = await this.pedir(async () => {
      return (await Camera.requestPermissions({ permissions: ['camera'] })).camera;
    });
    return permisoConcedido(estado);
  }

  async solicitarGaleria(): Promise<boolean> {
    const estado = await this.pedir(async () => {
      return (await Camera.requestPermissions({ permissions: ['photos'] })).photos;
    });
    return permisoConcedido(estado);
  }

  /** Pide el permiso de ubicación (diálogo del sistema si hace falta). */
  async solicitarUbicacion(): Promise<boolean> {
    const estado = await this.pedir(async () => {
      return (await Geolocation.requestPermissions()).location;
    });
    return permisoConcedido(estado);
  }

  /** Verifica la ubicación sin abrir el diálogo del sistema. */
  async verificarUbicacion(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      return permisoConcedido((await Geolocation.checkPermissions()).location);
    } catch (error) {
      console.warn('No se pudo verificar el permiso de ubicación', error);
      return false;
    }
  }

  /** Como solicitarCamara, pero avisa con un toast si el permiso se niega. */
  async asegurarCamara(): Promise<boolean> {
    if (await this.solicitarCamara()) return true;
    await this.mensajes.mostrar('Sin permiso de cámara. Actívalo en los ajustes del sistema para tomar fotos.');
    return false;
  }

  /** Como solicitarGaleria, pero avisa con un toast si el permiso se niega. */
  async asegurarGaleria(): Promise<boolean> {
    if (await this.solicitarGaleria()) return true;
    await this.mensajes.mostrar('Sin permiso de galería. Actívalo en los ajustes del sistema para elegir fotos.');
    return false;
  }

  /** Pide un permiso solo en la app nativa; en la web siempre se concede. */
  private async pedir(accion: () => Promise<EstadoPermiso | undefined>): Promise<EstadoPermiso | null> {
    if (!Capacitor.isNativePlatform()) return 'granted';
    try {
      return (await accion()) ?? 'denied';
    } catch (error) {
      console.warn('No se pudo pedir un permiso', error);
      return 'denied';
    }
  }
}
