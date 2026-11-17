import { Component, inject } from '@angular/core';
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

import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { primerMensajeError } from '../../../shared/utils/formularios';
import type { ReglaMensaje } from '../../../shared/utils/formularios';
import { correoValido, requeridoConContenido } from '../../../shared/utils/validadores';

/** Validaciones de recuperar contraseña, en el mismo orden que la app original. */
const ERRORES_RECUPERAR: ReglaMensaje[] = [
  { control: 'correo', error: 'requerido', mensaje: 'Ingresa tu correo' },
  { control: 'correo', error: 'correo', mensaje: 'Ingresa un correo electrónico válido' },
];

/** Envía (simuladamente) el enlace para restablecer la contraseña. */
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

  private readonly mensajes = inject(MensajeService);
  private readonly navCtrl = inject(NavController);

  async enviar(): Promise<void> {
    const error = primerMensajeError(this.formulario, ERRORES_RECUPERAR);
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }

    // TODO (igual que en la app nativa): conectar con el backend para enviar el correo.
    await this.mensajes.mostrar('Te enviaremos un enlace de recuperación a tu correo');
    this.navCtrl.back(); // equivale a finish()
  }
}
