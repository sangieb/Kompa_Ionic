import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

/** Displays brief toast messages to the user. */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly toastCtrl = inject(ToastController);

  async show(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }

  async mostrar(mensaje: string): Promise<void> {
    return this.show(mensaje);
  }
}
