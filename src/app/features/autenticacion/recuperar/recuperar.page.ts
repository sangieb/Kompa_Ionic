import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { primerMensajeError } from '../../../shared/utils/formularios';
import type { ReglaMensaje } from '../../../shared/utils/formularios';
import { correoValido, requeridoConContenido } from '../../../shared/utils/validadores';

/** Validaciones de recuperar contraseña, en el mismo orden que la app original. */
const ERRORES_RECUPERAR: ReglaMensaje[] = [
  { control: 'correo', error: 'requerido', mensaje: 'Ingresa tu correo' },
  { control: 'correo', error: 'correo', mensaje: 'Ingresa un correo electrónico válido' },
];

@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.page.html',
  styleUrls: ['./recuperar.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonInput, IonButton, ReactiveFormsModule],
})
export class RecuperarPage {
  readonly formulario = new FormGroup({
    correo: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido, correoValido] }),
  });

  readonly cargando = signal(false);

  private readonly mensajes = inject(MensajeService);
  private readonly navCtrl = inject(NavController);
  private readonly authApi = inject(AuthApiService);

  /** Con API configurada se envía por el servidor; sin API se mantiene el modo local. */
  readonly usandoApi = environment.apis.auth.length > 0;

  async enviar(): Promise<void> {
    const error = primerMensajeError(this.formulario, ERRORES_RECUPERAR);
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }

    const correo = this.formulario.controls.correo.value.trim();

    if (!this.usandoApi) {
      await this.mensajes.mostrar('Te enviaremos un enlace de recuperación a tu correo');
      this.navCtrl.back(); // equivale a finish()
      return;
    }

    this.cargando.set(true);
    try {
      await this.authApi.solicitarRecuperacion(correo);
      await this.mensajes.mostrar('Si el correo está registrado, te enviamos un enlace de recuperación.');
    } catch {
      await this.mensajes.mostrar('No pudimos enviar el correo ahora. Inténtalo de nuevo en unos minutos.');
    } finally {
      this.cargando.set(false);
    }

    this.navCtrl.back(); // equivale a finish()
  }
}
