import { Injectable, inject } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, camera, images } from 'ionicons/icons';

/** Fuente de la que se quiere obtener la foto. */
export type FuenteFoto = 'camara' | 'galeria';

/**
 * Punto único para preguntar al usuario si quiere tomar la foto o elegirla en
 * la galería (action sheet de Ionic). Devuelve null si desistió.
 */
@Injectable({ providedIn: 'root' })
export class FotoOpcionesService {
  private readonly actionSheetCtrl = inject(ActionSheetController);

  constructor() {
    addIcons({ add, camera, images });
  }

  /** Muestra la elección de fuente y resuelve con la que el usuario seleccionó. */
  async elegirFuente(): Promise<FuenteFoto | null> {
    let fuente: FuenteFoto | null = null;

    const sheet = await this.actionSheetCtrl.create({
      header: 'Foto',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            fuente = 'camara';
          },
        },
        {
          text: 'Elegir de galería',
          icon: 'images',
          handler: () => {
            fuente = 'galeria';
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
    return fuente;
  }
}
