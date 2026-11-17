import type { OnDestroy } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, locationOutline, shieldCheckmarkOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/auth/auth.service';
import { FotoOpcionesService } from '../../../core/foto/foto-opciones.service';
import { FotoService } from '../../../core/foto/foto.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import type { Perfil } from '../../../core/perfil/perfil.model';
import { PerfilService } from '../../../core/perfil/perfil.service';
import type { EstadoPermisoUi } from '../../../core/permisos/permisos.service';
import { PermisosService } from '../../../core/permisos/permisos.service';
import type { Consentimiento } from '../../../core/privacidad/consentimiento.service';
import { ConsentimientoService } from '../../../core/privacidad/consentimiento.service';
import { DatosUsuarioService } from '../../../core/privacidad/datos-usuario.service';
import { PerfilResumenComponent } from '../../../shared/components/perfil-resumen/perfil-resumen.component';
import { TerminosModalComponent } from '../../../shared/components/terminos-modal/terminos-modal.component';
import { formatearFecha } from '../../../shared/utils/fechas';
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
    IonIcon,
    IonSkeletonText,
    PerfilResumenComponent,
    TerminosModalComponent,
  ],
})
export class PerfilPage implements OnDestroy {
  readonly cargando = signal(true);
  readonly perfil = signal<Perfil | null>(null);
  readonly consentimiento = signal<Consentimiento | null>(null);
  readonly estadoUbicacion = signal<EstadoPermisoUi>('prompt');
  readonly estadoCamara = signal<EstadoPermisoUi>('prompt');
  readonly modalTerminosAbierto = signal(false);

  private reanudacion?: PluginListenerHandle;
  private revisandoPermisos = false;

  private readonly perfilService = inject(PerfilService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly fotos = inject(FotoService);
  private readonly permisos = inject(PermisosService);
  private readonly mensajes = inject(MensajeService);
  private readonly opciones = inject(FotoOpcionesService);
  private readonly consentimientos = inject(ConsentimientoService);
  private readonly datosUsuario = inject(DatosUsuarioService);
  private readonly alertas = inject(AlertController);

  constructor() {
    addIcons({ cameraOutline, locationOutline, shieldCheckmarkOutline });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
    await this.escucharReanudacion();
  }

  ionViewWillLeave(): void {
    void this.reanudacion?.remove();
    this.reanudacion = undefined;
  }

  ngOnDestroy(): void {
    void this.reanudacion?.remove();
  }

  get consentimientoTexto(): string {
    const consentimiento = this.consentimiento();
    if (!consentimiento) return 'Aún no hay registro de aceptación en este dispositivo.';
    const fecha = formatearFecha(new Date(consentimiento.fecha).getTime());
    return `Aceptaste la versión ${consentimiento.version} el ${fecha}.`;
  }

  get estadoUbicacionTexto(): string {
    return this.textoEstado(this.estadoUbicacion());
  }

  get estadoCamaraTexto(): string {
    return this.textoEstado(this.estadoCamara());
  }

  get accionUbicacion(): string {
    const estado = this.estadoUbicacion();
    return estado === 'denied' || estado === 'servicios-apagados' ? 'Ajustes' : 'Activar';
  }

  get accionCamara(): string {
    return this.estadoCamara() === 'denied' ? 'Ajustes' : 'Activar';
  }

  irARegistro(): void {
    void this.router.navigateByUrl('/registro');
  }

  abrirTerminos(): void {
    this.modalTerminosAbierto.set(true);
  }

  cerrarTerminos(): void {
    this.modalTerminosAbierto.set(false);
  }

  async gestionarUbicacion(): Promise<void> {
    const estado = this.estadoUbicacion();
    if (estado === 'granted') {
      await this.mensajes.mostrar('La ubicación ya está activa.');
      return;
    }
    if (estado === 'servicios-apagados') {
      await this.permisos.abrirAjustesUbicacion();
      return;
    }
    if (estado === 'denied') {
      await this.permisos.abrirAjustesApp();
      return;
    }
    const concedido = await this.permisos.solicitarUbicacion();
    this.estadoUbicacion.set(concedido ? 'granted' : await this.permisos.estadoUbicacion());
    if (!concedido) await this.permisos.abrirAjustesApp();
  }

  async gestionarCamara(): Promise<void> {
    if (this.estadoCamara() === 'granted') {
      await this.mensajes.mostrar('La cámara ya está activa.');
      return;
    }
    if (this.estadoCamara() === 'denied') {
      await this.permisos.abrirAjustesApp();
      return;
    }
    const concedido = await this.permisos.solicitarCamara();
    this.estadoCamara.set(concedido ? 'granted' : 'denied');
    if (!concedido) await this.permisos.abrirAjustesApp();
  }

  async cerrarSesion(): Promise<void> {
    const alerta = await this.alertas.create({
      header: 'Cerrar sesión',
      message: '¿Quieres salir de tu cuenta en este dispositivo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            void this.salir();
          },
        },
      ],
    });
    await alerta.present();
  }

  async eliminarCuenta(): Promise<void> {
    const alerta = await this.alertas.create({
      header: 'Eliminar cuenta y datos',
      message:
        'Se borrarán tu perfil, tu cuenta, tus publicaciones, tus actividades y el consentimiento guardados en este dispositivo. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar todo',
          role: 'destructive',
          handler: () => {
            void this.borrarDatos();
          },
        },
      ],
    });
    await alerta.present();
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

  private async escucharReanudacion(): Promise<void> {
    if (this.reanudacion) return;
    try {
      this.reanudacion = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void this.revalidarPermisos();
      });
    } catch (error) {
      console.warn('No se pudo escuchar la reanudación de la app', error);
    }
  }

  /** Al volver de Ajustes se refrescan los permisos sin abrir diálogos. */
  private async revalidarPermisos(): Promise<void> {
    if (this.revisandoPermisos) return;
    this.revisandoPermisos = true;
    try {
      const [ubicacion, camara] = await Promise.all([this.permisos.estadoUbicacion(), this.permisos.estadoCamara()]);
      this.estadoUbicacion.set(ubicacion);
      this.estadoCamara.set(camara);
    } finally {
      this.revisandoPermisos = false;
    }
  }

  private async cargar(): Promise<void> {
    const [perfil, consentimiento, estadoUbicacion, estadoCamara] = await Promise.all([
      this.perfilService.perfilActual(),
      this.consentimientos.actual(),
      this.permisos.estadoUbicacion(),
      this.permisos.estadoCamara(),
    ]);
    this.perfil.set(perfil);
    this.consentimiento.set(consentimiento);
    this.estadoUbicacion.set(estadoUbicacion);
    this.estadoCamara.set(estadoCamara);
    this.cargando.set(false);
  }

  private async salir(): Promise<void> {
    await this.auth.logout();
    // navigateRoot borra el historial: equivale a FLAG_ACTIVITY_NEW_TASK | CLEAR_TASK
    await this.navCtrl.navigateRoot('/inicio');
  }

  private async borrarDatos(): Promise<void> {
    await this.datosUsuario.eliminarTodo();
    await this.mensajes.mostrar('Tus datos locales fueron eliminados.');
    await this.navCtrl.navigateRoot('/inicio');
  }

  private textoEstado(estado: EstadoPermisoUi): string {
    switch (estado) {
      case 'granted':
        return 'Activa';
      case 'denied':
        return 'Desactivada';
      case 'servicios-apagados':
        return 'Ubicación del teléfono apagada';
      case 'unavailable':
        return 'No disponible';
      default:
        return 'Se pedirá permiso al usarla';
    }
  }
}
