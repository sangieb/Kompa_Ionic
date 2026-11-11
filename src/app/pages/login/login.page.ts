import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
  IonInput, IonInputPasswordToggle, IonButton,
} from '@ionic/angular';
import { AuthService, ResultadoLogin } from '../../services/auth.service';
import { MensajeService } from '../../services/mensaje.service';
import { esCorreoValido } from '../../core/validaciones';

/** Equivale a ui/auth/login/LoginActivity.kt */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
    IonInput, IonInputPasswordToggle, IonButton,
  ],
})
export class LoginPage {
  correo = '';
  password = '';
  cargando = false;

  constructor(
    private auth: AuthService,
    private mensajes: MensajeService,
    private router: Router
  ) {}

  async iniciarSesion() {
    if (!this.validarCampos()) return;

    this.cargando = true;
    const resultado = await this.auth.login(this.correo.trim(), this.password);
    this.cargando = false;

    switch (resultado) {
      case ResultadoLogin.EXITO:
        await this.mensajes.mostrar('¡Bienvenido a Kompa!');
        // replaceUrl evita volver al login con "atrás" (como FLAG_ACTIVITY_CLEAR_TASK)
        this.router.navigateByUrl('/home', { replaceUrl: true });
        break;
      case ResultadoLogin.CUENTA_INEXISTENTE:
        this.mensajes.mostrar('Este correo aún no está registrado');
        break;
      case ResultadoLogin.CONTRASENA_INCORRECTA:
        this.mensajes.mostrar('Contraseña incorrecta');
        break;
    }
  }

  irARecuperar() {
    this.router.navigateByUrl('/recuperar');
  }

  private validarCampos(): boolean {
    const correo = this.correo.trim();
    if (!correo) {
      this.mensajes.mostrar('Ingresa tu correo');
      return false;
    }
    if (!esCorreoValido(correo)) {
      this.mensajes.mostrar('Ingresa un correo electrónico válido');
      return false;
    }
    if (!this.password.trim()) {
      this.mensajes.mostrar('Ingresa tu contraseña');
      return false;
    }
    return true;
  }
}