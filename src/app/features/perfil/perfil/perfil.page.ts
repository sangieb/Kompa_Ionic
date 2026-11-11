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
import { FotoOpcionesService } from '../../../core/foto/foto-opciones.service';
import { FotoService } from '../../../core/foto/foto.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import type { Perfil } from '../../../core/perfil/perfil.model';
import { PerfilService } from '../../../core/perfil/perfil.service';
import { PermisosService } from '../../../core/permisos/permisos.service';
import { PerfilResumenComponent } from '../../../shared/components/perfil-resumen/perfil-resumen.component';
import { comprimirFoto } from '../../../shared/utils/foto';

/**
 * Perfil del usuario en modo solo lectura (excepto la foto, que se puede cambiar).
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
  private readonly fotos = inject(FotoService);
  private readonly permisos = inject(PermisosService);
  private readonly mensajes = inject(MensajeService);
  private readonly opciones = inject(FotoOpcionesService);

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

  /** Elige la fuente de la foto (cámara o galería) y actualiza el perfil. */
  async cambiarFoto(): Promise<void> {
    const fuente = await this.opciones.elegirFuente();
    if (!fuente) return;

    const permitido = await (fuente === 'camara' ? this.permisos.asegurarCamara() : this.permisos.asegurarGaleria());
    if (!permitido) return;

    const { foto, error } = fuente === 'camara' ? await this.fotos.tomarFoto() : await this.fotos.elegirDeGaleria();
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }
    if (!foto) return; // el usuario canceló

    const actual = this.perfil();
    if (!actual) return;
    const actualizado: Perfil = { ...actual, fotoUri: await comprimirFoto(foto, 400, 0.7) };
    await this.perfilService.guardar(actualizado);
    this.perfil.set(actualizado);
    await this.mensajes.mostrar('Foto de perfil actualizada');
  }
}
