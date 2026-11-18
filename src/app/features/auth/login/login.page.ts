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

import { AuthService, LoginResult } from '../../../core/auth/auth.service';
import { MessageService } from '../../../core/message/message.service';
import { firstErrorMessage } from '../../../shared/utils/forms';
import type { MessageRule } from '../../../shared/utils/forms';
import { validEmail, requiredWithContent } from '../../../shared/utils/validators';

const LOGIN_ERRORS: MessageRule[] = [
  { control: 'correo', error: 'required', message: 'Ingresa tu correo' },
  { control: 'correo', error: 'requerido', message: 'Ingresa tu correo' },
  { control: 'correo', error: 'email', message: 'Ingresa un correo electrónico válido' },
  { control: 'correo', error: 'correo', message: 'Ingresa un correo electrónico válido' },
  { control: 'password', error: 'required', message: 'Ingresa tu contraseña' },
  { control: 'password', error: 'requerido', message: 'Ingresa tu contraseña' },
];

/** User sign-in screen. */
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
  readonly form = new FormGroup({
    correo: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent, validEmail] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent] }),
  });
  readonly formulario = this.form;

  readonly loading = signal(false);
  readonly cargando = this.loading;

  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  async signIn(): Promise<void> {
    const error = firstErrorMessage(this.form, LOGIN_ERRORS);
    if (error) {
      await this.messageService.show(error);
      return;
    }

    this.loading.set(true);
    const { correo, password } = this.form.getRawValue();
    const result = await this.auth.login(correo.trim(), password);
    this.loading.set(false);

    switch (result) {
      case LoginResult.SUCCESS:
        await this.messageService.show('¡Bienvenido a Kompa!');
        await this.router.navigateByUrl('/home', { replaceUrl: true });
        break;
      case LoginResult.ACCOUNT_NOT_FOUND:
        await this.messageService.show('Este correo aún no está registrado');
        break;
      case LoginResult.WRONG_PASSWORD:
        await this.messageService.show('Contraseña incorrecta');
        break;
    }
  }

  iniciarSesion(): Promise<void> {
    return this.signIn();
  }

  goToRecover(): void {
    void this.router.navigateByUrl('/recover');
  }

  irARecuperar(): void {
    this.goToRecover();
  }
}
