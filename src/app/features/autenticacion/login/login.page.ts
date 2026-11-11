import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService, ResultadoLogin } from '../../../core/auth/auth.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { primerMensajeError } from '../../../shared/utils/formularios';
import type { ReglaMensaje } from '../../../shared/utils/formularios';
import { correoValido, requeridoConContenido } from '../../../shared/utils/validadores';

/** Validaciones del login, en el mismo orden que la app original. */
const ERRORES_LOGIN: ReglaMensaje[] = [
  { control: 'correo', error: 'requerido', mensaje: 'Ingresa tu correo' },
  { control: 'correo', error: 'correo', mensaje: 'Ingresa un correo electrónico válido' },
  { control: 'password', error: 'requerido', mensaje: 'Ingresa tu contraseña' },
];

/** Inicio de sesión con correo y contraseña. */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {
  readonly formulario = new FormGroup({
    correo: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido, correoValido] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido] }),
  });

  readonly cargando = signal(false);

  private readonly auth = inject(AuthService);
  private readonly mensajes = inject(MensajeService);
  private readonly router = inject(Router);

  async iniciarSesion(): Promise<void> {
    const error = primerMensajeError(this.formulario, ERRORES_LOGIN);
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }

    this.cargando.set(true);
    const { correo, password } = this.formulario.getRawValue();
    const resultado = await this.auth.login(correo.trim(), password);
    this.cargando.set(false);

    switch (resultado) {
      case ResultadoLogin.EXITO:
        await this.mensajes.mostrar('¡Bienvenido a Kompa!');
        // replaceUrl evita volver al login con "atrás" (como FLAG_ACTIVITY_CLEAR_TASK)
        await this.router.navigateByUrl('/home', { replaceUrl: true });
        break;
      case ResultadoLogin.CUENTA_INEXISTENTE:
        await this.mensajes.mostrar('Este correo aún no está registrado');
        break;
      case ResultadoLogin.CONTRASENA_INCORRECTA:
        await this.mensajes.mostrar('Contraseña incorrecta');
        break;
    }
  }

  irARecuperar(): void {
    void this.router.navigateByUrl('/recuperar');
  }
}
