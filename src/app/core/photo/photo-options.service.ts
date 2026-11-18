import { Injectable, inject } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, images } from 'ionicons/icons';

/** Source option for acquiring photos. */
export type PhotoSource = 'camera' | 'gallery';
export type FuenteFoto = 'camara' | 'galeria';

/**
 * Action sheet dialog prompting user to capture or choose a photo.
 */
@Injectable({ providedIn: 'root' })
export class PhotoOptionsService {
  private readonly actionSheetCtrl = inject(ActionSheetController);

  constructor() {
    addIcons({ camera, images });
  }

  /** Shows source selection sheet and resolves with selected option, or null if cancelled. */
  async selectSource(): Promise<PhotoSource | null> {
    let source: PhotoSource | null = null;

    const sheet = await this.actionSheetCtrl.create({
      header: 'Photo',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            source = 'camera';
          },
        },
        {
          text: 'Elegir de galería',
          icon: 'images',
          handler: () => {
            source = 'gallery';
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
    await sheet.present();
    await sheet.onDidDismiss();
    return source;
  }

  async elegirFuente(): Promise<FuenteFoto | null> {
    const src = await this.selectSource();
    if (src === 'camera') return 'camara';
    if (src === 'gallery') return 'galeria';
    return null;
  }
}
