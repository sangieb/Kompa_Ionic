import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonButton, NavController,
} from '@ionic/angular';
import { AvionAnimacionComponent } from '../../components/avion-animacion.component';
import { RegistroBorradorService, BorradorRegistro } from '../../services/registro-borrador.service';
import { PerfilService } from '../../services/perfil.service';
import { CuentaService } from '../../services/cuenta.service';
import { AuthService } from '../../services/auth.service';
import { MensajeService } from '../../services/mensaje.service';

/** Equivale a ui/perfil/confirmacion/ConfirmacionActivity.kt */
@Component({
  selector: 'app-confirmacion',
  templateUrl: './confirmacion.page.html',
  styleUrls: ['./confirmacion.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonButton,
    AvionAnimacionComponent,
  ],
})
export class ConfirmacionPage implements OnInit {
  mostrarBoton = signal(false);
  guardando = signal(false);
  private datos: BorradorRegistro | null = null;

  constructor(
    private borrador: RegistroBorradorService,
    private perfilService: PerfilService,
    private cuentas: CuentaService,
    private auth: AuthService,
    private mensajes: MensajeService,
    private router: Router,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.datos = this.borrador.obtener();
    if (!this.datos) {
      this.router.navigateByUrl('/registro', { replaceUrl: true });
      return;
    }
    await this.perfilService.guardar(this.datos.perfil); // persistirPerfil()
  }

  /** Igual que onFlightCompleted: muestra el botón cuando el avión termina */
  alTerminarVuelo() {
    this.mostrarBoton.set(true);
  }

  async continuar() {
    if (!this.datos) return;
    this.guardando.set(true);

    const { perfil, password } = this.datos;
    if (perfil.correo && password) {
      await this.cuentas.registrar(perfil.correo, password);
      await this.auth.crearSesion(perfil.correo);
    }
    this.borrador.limpiar();

    await this.mensajes.mostrar('¡Bienvenido a Kompa!');
    // navigateRoot borra el historial: equivale a FLAG_ACTIVITY_NEW_TASK | CLEAR_TASK
    this.navCtrl.navigateRoot('/home');
  }
}