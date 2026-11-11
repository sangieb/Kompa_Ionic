import { Component, OnInit, ViewChild, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  IonSpinner, IonButton, IonInput, IonTextarea, IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { PublicacionService } from '../../services/publicacion.service';
import { PerfilService } from '../../services/perfil.service';
import { AuthService } from '../../services/auth.service';
import { MensajeService } from '../../services/mensaje.service';
import { Publicacion } from '../../models/publicacion.model';
import { formatearFechaHora } from '../../core/fechas';

/** Equivale a FeedUiState: Cargando / Exito / Error */
type EstadoFeed = 'cargando' | 'exito' | 'error';

const MAX_TITULO = 80;
const MAX_CUERPO = 500;

/** Feed de publicaciones: basado en FeedActivity.kt, con la opción de publicar */
@Component({
  selector: 'app-feed',
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
    IonSpinner, IonButton, IonInput, IonTextarea, IonIcon,
  ],
})
export class FeedPage implements OnInit {
  @ViewChild(IonContent) contenido?: IonContent;

  readonly maxTitulo = MAX_TITULO;
  readonly maxCuerpo = MAX_CUERPO;

  estado = signal<EstadoFeed>('cargando');
  publicaciones = signal<Publicacion[]>([]);
  mostrarFormulario = signal(false);
  publicando = signal(false);

  nuevoTitulo = '';
  nuevoCuerpo = '';

  constructor(
    private servicio: PublicacionService,
    private perfilService: PerfilService,
    private auth: AuthService,
    private mensajes: MensajeService
  ) {
    addIcons({ add });
  }

  ngOnInit() {
    this.cargar();
  }

  /** Igual que FeedViewModel.cargar(): primero lo local, luego intenta la API */
  async cargar() {
    this.estado.set('cargando');
    this.publicaciones.set(await this.servicio.publicacionesLocales());
    this.estado.set('exito');

    this.servicio.refrescar().subscribe({
      next: (lista) => {
        this.publicaciones.set(lista);
        this.estado.set('exito');
      },
      error: () => this.estado.set('error'),
    });
  }

  abrirFormulario() {
    this.mostrarFormulario.set(true);
    this.contenido?.scrollToTop(300);
  }

  cancelar() {
    this.nuevoTitulo = '';
    this.nuevoCuerpo = '';
    this.mostrarFormulario.set(false);
  }

  async publicar() {
    const titulo = this.nuevoTitulo.trim();
    const cuerpo = this.nuevoCuerpo.trim();
    if (!titulo) {
      this.mensajes.mostrar('Escribe un título');
      return;
    }
    if (!cuerpo) {
      this.mensajes.mostrar('Escribe un mensaje');
      return;
    }

    this.publicando.set(true);
    await this.servicio.publicar({ titulo, cuerpo, autor: await this.nombreAutor() });
    this.publicaciones.set(await this.servicio.publicacionesLocales());
    this.estado.set('exito');
    this.publicando.set(false);
    this.cancelar();
    this.mensajes.mostrar('Publicación compartida');
  }

  fecha(p: Publicacion): string {
    return p.fechaCreacion != null ? formatearFechaHora(p.fechaCreacion) : '—';
  }

  /** Nombre del perfil si corresponde a la sesión; si no, el correo */
  private async nombreAutor(): Promise<string> {
    const correo = await this.auth.correoActual();
    const perfil = await this.perfilService.perfilActual();
    if (perfil?.nombre && perfil.correo === correo) return perfil.nombre;
    return correo ?? 'Viajero Kompa';
  }
}