import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
  IonInput, IonButton, NavController,
} from '@ionic/angular';
import { MensajeService } from '../../services/mensaje.service';
import { esCorreoValido } from '../../core/validaciones';

/** Equivale a ui/auth/recuperar/RecuperarContrasenaActivity.kt */
@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.page.html',
  styleUrls: ['./recuperar.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
    IonInput, IonButton,
  ],
})
export class RecuperarPage {
  correo = '';

  constructor(
    private mensajes: MensajeService,
    private navCtrl: NavController
  ) {}

  async enviar() {
    if (!this.validarCampo()) return;

    // TODO (igual que en Kotlin): conectar con el backend para enviar el correo.
    await this.mensajes.mostrar('Te enviaremos un enlace de recuperación a tu correo');
    this.navCtrl.back(); // equivale a finish()
  }

  private validarCampo(): boolean {
    const correo = this.correo.trim();
    if (!correo) {
      this.mensajes.mostrar('Ingresa tu correo');
      return false;
    }
    if (!esCorreoValido(correo)) {
      this.mensajes.mostrar('Ingresa un correo electrónico válido');
      return false;
    }
    return true;
  }
}