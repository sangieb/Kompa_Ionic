import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonToolbar, NavController } from '@ionic/angular';

import { AuthService } from '../../../core/auth/auth.service';
import { CuentaService } from '../../../core/auth/cuenta.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { PerfilService } from '../../../core/perfil/perfil.service';
import { AvionAnimacionComponent } from '../../../shared/components/avion-animacion.component';
import { RegistroBorradorService } from '../registro-borrador.service';
import type { BorradorRegistro } from '../registro-borrador.service';

/** Equivale a ui/perfil/confirmacion/ConfirmacionActivity.kt */
@Component({
  selector: 'app-confirmacion',
  templateUrl: './confirmacion.page.html',
  styleUrls: ['./confirmacion.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonButton, AvionAnimacionComponent],
})
export class ConfirmacionPage implements OnInit {
  readonly mostrarBoton = signal(false);
  readonly guardando = signal(false);

  private datos: BorradorRegistro | null = null;

  private readonly borrador = inject(RegistroBorradorService);
  private readonly perfilService = inject(PerfilService);
  private readonly cuentas = inject(CuentaService);
  private readonly auth = inject(AuthService);
  private readonly mensajes = inject(MensajeService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);

  async ngOnInit(): Promise<void> {
    this.datos = this.borrador.obtener();
    if (!this.datos) {
      await this.router.navigateByUrl('/registro', { replaceUrl: true });
      return;
    }
    await this.perfilService.guardar(this.datos.perfil); // persistirPerfil()
  }

  /** Igual que onFlightCompleted: muestra el botón cuando el avión termina */
  alTerminarVuelo(): void {
    this.mostrarBoton.set(true);
  }

  async continuar(): Promise<void> {
    if (!this.datos) return;
    this.guardando.set(true);

    const { perfil, credenciales } = this.datos;
    if (perfil.correo) {
      await this.cuentas.registrar(perfil.correo, credenciales);
      await this.auth.crearSesion(perfil.correo);
    }
    this.borrador.limpiar();

    await this.mensajes.mostrar('¡Bienvenido a Kompa!');
    // navigateRoot borra el historial: equivale a FLAG_ACTIVITY_NEW_TASK | CLEAR_TASK
    this.navCtrl.navigateRoot('/home');
  }
}
