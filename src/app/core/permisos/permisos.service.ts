import { Injectable, inject } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';

import { MensajeService } from '../mensaje/mensaje.service';
import { AlmacenamientoService } from '../storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../storage/claves';

/** Estado de un permiso nativo, igual que PermissionState de Capacitor. */
export type EstadoPermiso = 'granted' | 'granted-always' | 'limited' | 'denied' | 'prompt' | 'prompt-with-rationale';

/** Estado simplificado que consumen las pantallas. */
export type EstadoPermisoUi = 'granted' | 'prompt' | 'denied' | 'unavailable';

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
  private readonly almacenamiento = inject(AlmacenamientoService);

  async solicitarCamara(): Promise<boolean> {
    const estado = await this.pedir(async () => {
      return (await Camera.requestPermissions({ permissions: ['camera'] })).camera;
    });
    return permisoConcedido(estado);
  }

  async solicitarGaleria(): Promise<boolean> {
    // En Android el selector de galería del sistema no requiere permiso y la
    // pide (Camera.requestPermissions con alias 'photos') nunca resuelve (bug
    // conocido de @capacitor/camera). En iOS sí hace falta pedirlos.
    if (Capacitor.getPlatform() !== 'ios') return true;
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
    if (Capacitor.isNativePlatform()) {
      await this.almacenamiento.guardar(ClavesAlmacenamiento.ubicacionSolicitada, true);
    }
    return permisoConcedido(estado);
  }

  /** Consulta la ubicación sin abrir el diálogo del sistema. */
  async estadoUbicacion(): Promise<EstadoPermisoUi> {
    if (!Capacitor.isNativePlatform()) return this.estadoUbicacionWeb();
    try {
      return simplificar((await Geolocation.checkPermissions()).location);
    } catch (error) {
      console.warn('No se pudo verificar el permiso de ubicación', error);
      return 'unavailable';
    }
  }

  /** Consulta la cámara sin abrir el diálogo del sistema. */
  async estadoCamara(): Promise<EstadoPermisoUi> {
    if (!Capacitor.isNativePlatform()) return 'prompt';
    try {
      return simplificar((await Camera.checkPermissions()).camera);
    } catch (error) {
      console.warn('No se pudo verificar el permiso de cámara', error);
      return 'unavailable';
    }
  }

  /** Verifica la ubicación sin abrir el diálogo del sistema. */
  async verificarUbicacion(): Promise<boolean> {
    return (await this.estadoUbicacion()) === 'granted';
  }

  /** Abre los ajustes de la app para cambiar permisos (nativo). */
  async abrirAjustesApp(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      await this.mensajes.mostrar('Abre los ajustes del sitio en tu navegador para cambiar este permiso.');
      return;
    }
    try {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App,
      });
    } catch (error) {
      console.warn('No se pudieron abrir los ajustes de la app', error);
      await this.mensajes.mostrar('Abre Ajustes › Aplicaciones › Kompa › Permisos.');
    }
  }

  /** Abre los ajustes de ubicación del sistema (GPS y modo de precisión). */
  async abrirAjustesUbicacion(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      await this.mensajes.mostrar('Activa la ubicación en los ajustes del navegador o del sistema.');
      return;
    }
    try {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.Location,
        optionIOS: IOSSettings.LocationServices,
      });
    } catch (error) {
      console.warn('No se pudieron abrir los ajustes de ubicación', error);
      await this.mensajes.mostrar('Activa la ubicación en los ajustes del teléfono.');
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

  /** En la web se consulta la Permissions API cuando el navegador la ofrece. */
  private async estadoUbicacionWeb(): Promise<EstadoPermisoUi> {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'prompt';
    try {
      const estado = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (estado.state === 'granted') return 'granted';
      if (estado.state === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }
}

function simplificar(estado: EstadoPermiso): EstadoPermisoUi {
  if (permisoConcedido(estado)) return 'granted';
  if (estado === 'denied') return 'denied';
  if (estado === 'prompt' || estado === 'prompt-with-rationale') return 'prompt';
  return 'unavailable';
}
