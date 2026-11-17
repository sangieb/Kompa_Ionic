import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/** Resultado de pedir una foto al usuario. */
export interface FotoResultado {
  /** Ruta de la imagen para mostrarla, o null si el usuario canceló. */
  foto: string | null;
  /** Mensaje de error legible cuando la captura falla (distinto de cancelar). */
  error: string | null;
}

/**
 * Único punto para tomar o elegir fotos (cámara y galería). Devuelve webPath;
 * para guardar la imagen en el almacenamiento hay que comprimirla antes
 * (ver comprimirFoto en shared/utils/foto.ts).
 */
@Injectable({ providedIn: 'root' })
export class FotoService {
  async tomarFoto(): Promise<FotoResultado> {
    return this.obtener(CameraSource.Camera, 'No se pudo abrir la cámara');
  }

  async elegirDeGaleria(): Promise<FotoResultado> {
    return this.obtener(CameraSource.Photos, 'No se pudo abrir la galería');
  }

  private async obtener(source: CameraSource, mensajeError: string): Promise<FotoResultado> {
    try {
      const imagen = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source,
      });
      return { foto: imagen.webPath ?? null, error: null };
    } catch (error) {
      if (esCancelacion(error)) return { foto: null, error: null };
      console.warn('No se pudo obtener la foto', error);
      return { foto: null, error: mensajeError };
    }
  }
}

/** Capacitor rechaza con un mensaje que incluye "cancel" cuando se cancela. */
function esCancelacion(error: unknown): boolean {
  const mensaje = String((error as { message?: string })?.message ?? error).toLowerCase();
  return mensaje.includes('cancel');
}
