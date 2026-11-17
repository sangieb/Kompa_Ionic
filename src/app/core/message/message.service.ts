import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

/** Muestra mensajes breves al usuario (toasts). */
@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly toastCtrl = inject(ToastController);

  async mostrar(mensaje: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
