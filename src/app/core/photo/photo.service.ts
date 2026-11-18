import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/** Result of a photo request. */
export interface PhotoResult {
  photo: string | null;
  error: string | null;
}

export type FotoResultado = PhotoResult;

/**
 * Service for capturing or selecting photos from device camera / gallery.
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  async takePhoto(): Promise<PhotoResult> {
    return this.acquirePhoto(CameraSource.Camera, 'No se pudo abrir la cámara');
  }

  async pickFromGallery(): Promise<PhotoResult> {
    return this.acquirePhoto(CameraSource.Photos, 'No se pudo abrir la galería');
  }

  private async acquirePhoto(source: CameraSource, errorMessage: string): Promise<PhotoResult> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source,
      });
      return { photo: image.webPath ?? null, error: null };
    } catch (error) {
      if (isCancellation(error)) return { photo: null, error: null };
      console.warn('Failed to acquire photo', error);
      return { photo: null, error: errorMessage };
    }
  }

  async tomarFoto(): Promise<FotoResultado> {
    return this.takePhoto();
  }

  async elegirDeGaleria(): Promise<FotoResultado> {
    return this.pickFromGallery();
  }
}

function isCancellation(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  return message.includes('cancel');
}
