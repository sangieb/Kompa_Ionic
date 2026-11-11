import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { AuthService } from '../../../core/auth/auth.service';
import type { Perfil } from '../../../core/perfil/perfil.model';
import { PerfilService } from '../../../core/perfil/perfil.service';
import { PerfilResumenComponent } from '../../../shared/components/perfil-resumen/perfil-resumen.component';

/**
 * Perfil del usuario en modo solo lectura (el registro es el único que lo edita).
 * Equivale a ui/perfil/PerfilActivity.kt sin el botón de editar.
 */
@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonSpinner,
    PerfilResumenComponent,
  ],
})
export class PerfilPage implements OnInit {
  readonly cargando = signal(true);
  readonly perfil = signal<Perfil | null>(null);

  private readonly perfilService = inject(PerfilService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);

  async ngOnInit(): Promise<void> {
    this.perfil.set(await this.perfilService.perfilActual());
    this.cargando.set(false);
  }

  irARegistro(): void {
    void this.router.navigateByUrl('/registro');
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    // navigateRoot borra el historial: equivale a FLAG_ACTIVITY_NEW_TASK | CLEAR_TASK
    this.navCtrl.navigateRoot('/inicio');
  }
}
