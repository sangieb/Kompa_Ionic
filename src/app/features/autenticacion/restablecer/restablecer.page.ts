import { Component, type OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { MIN_PASSWORD_LEN } from '../../../core/auth/auth.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { primerMensajeError } from '../../../shared/utils/formularios';
import type { ReglaMensaje } from '../../../shared/utils/formularios';
import { longitudMinima, requeridoConContenido } from '../../../shared/utils/validadores';

const ERRORES_RESET: ReglaMensaje[] = [
  { control: 'password', error: 'requerido', mensaje: 'Ingresa una nueva contraseña' },
  {
    control: 'password',
    error: 'longitudMinima',
    mensaje: `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres`,
  },
  { control: 'confirmar', error: 'requerido', mensaje: 'Confirma la nueva contraseña' },
];

@Component({
  selector: 'app-restablecer',
  templateUrl: './restablecer.page.html',
  styleUrls: ['./restablecer.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    ReactiveFormsModule,
  ],
})
export class RestablecerPage implements OnInit {
  readonly token = signal<string | null>(null);
  readonly cargando = signal(false);

  readonly formulario = new FormGroup({
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [requeridoConContenido, longitudMinima(MIN_PASSWORD_LEN)],
    }),
    confirmar: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido] }),
  });

  private readonly route = inject(ActivatedRoute);
  private readonly navCtrl = inject(NavController);
  private readonly mensajes = inject(MensajeService);
  private readonly authApi = inject(AuthApiService);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.token.set(params.get('token'));
    });
  }

  get tokenValido(): boolean {
    const token = this.token();
    return token !== null && token.trim().length > 0;
  }

  get contrasenaCoincide(): boolean {
    const password = this.formulario.controls.password.value;
    const confirmar = this.formulario.controls.confirmar.value;
    if (!password || !confirmar) return true;
    return password === confirmar;
  }

  async enviar(): Promise<void> {
    if (this.cargando()) return;

    if (!this.tokenValido) {
      await this.mensajes.mostrar('El enlace de recuperación no es válido.');
      return;
    }

    const error = primerMensajeError(this.formulario, ERRORES_RESET);
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }

    const password = this.formulario.controls.password.value;
    if (password !== this.formulario.controls.confirmar.value) {
      await this.mensajes.mostrar('Las contraseñas no coinciden.');
      return;
    }

    if (!environment.apis.auth.length) {
      await this.mensajes.mostrar(
        'El servidor de recuperación no está configurado. No se puede restablecer la contraseña.',
      );
      return;
    }

    this.cargando.set(true);
    try {
      const respuesta = await this.authApi.restablecerContrasena(this.token() as string, password);
      if (respuesta.error) {
        await this.mensajes.mostrar('El enlace de recuperación no es válido o ya fue usado.');
        return;
      }
      await this.mensajes.mostrar('Tu contraseña se actualizó. Inicia sesión con tu nueva contraseña.');
      await this.navCtrl.navigateRoot('/login');
    } catch {
      await this.mensajes.mostrar('No pudimos restablecer la contraseña. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
