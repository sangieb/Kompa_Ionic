import type { OnInit } from '@angular/core';
import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { PerfilService } from '../../../core/perfil/perfil.service';
import { formatearFechaHora } from '../../../shared/utils/fechas';
import { primerMensajeError } from '../../../shared/utils/formularios';
import type { ReglaMensaje } from '../../../shared/utils/formularios';
import { requeridoConContenido } from '../../../shared/utils/validadores';
import type { Publicacion } from '../models/publicacion.model';
import { PublicacionService } from '../publicacion.service';

/** Equivale a FeedUiState: Cargando / Exito / Error */
type EstadoFeed = 'cargando' | 'exito' | 'error';

const MAX_TITULO = 80;
const MAX_CUERPO = 500;

/** Validaciones de la nueva publicación, en el mismo orden que la app original. */
const ERRORES_FEED: ReglaMensaje[] = [
  { control: 'titulo', error: 'requerido', mensaje: 'Escribe un título' },
  { control: 'cuerpo', error: 'requerido', mensaje: 'Escribe un mensaje' },
];

/** Feed de publicaciones: basado en FeedActivity.kt, con la opción de publicar */
@Component({
  selector: 'app-feed',
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonSpinner,
    IonButton,
    IonInput,
    IonTextarea,
    IonIcon,
    ReactiveFormsModule,
  ],
})
export class FeedPage implements OnInit {
  @ViewChild(IonContent) contenido?: IonContent;

  readonly maxTitulo = MAX_TITULO;
  readonly maxCuerpo = MAX_CUERPO;

  readonly formulario = new FormGroup({
    titulo: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido] }),
    cuerpo: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido] }),
  });

  readonly estado = signal<EstadoFeed>('cargando');
  readonly publicaciones = signal<Publicacion[]>([]);
  readonly mostrarFormulario = signal(false);
  readonly publicando = signal(false);

  private readonly servicio = inject(PublicacionService);
  private readonly perfilService = inject(PerfilService);
  private readonly auth = inject(AuthService);
  private readonly mensajes = inject(MensajeService);

  constructor() {
    addIcons({ add });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  /** Igual que FeedViewModel.cargar(): primero lo local, luego intenta la API */
  async cargar(): Promise<void> {
    this.estado.set('cargando');
    this.publicaciones.set(await this.servicio.publicacionesLocales());

    try {
      this.publicaciones.set(await firstValueFrom(this.servicio.refrescar()));
      this.estado.set('exito');
    } catch {
      // Sin conexión o API caída: se mantiene el caché local (offline-first)
      this.estado.set(this.publicaciones().length > 0 ? 'exito' : 'error');
    }
  }

  abrirFormulario(): void {
    this.mostrarFormulario.set(true);
    void this.contenido?.scrollToTop(300);
  }

  cancelar(): void {
    this.formulario.reset();
    this.mostrarFormulario.set(false);
  }

  async publicar(): Promise<void> {
    const error = primerMensajeError(this.formulario, ERRORES_FEED);
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }

    this.publicando.set(true);
    try {
      const { titulo, cuerpo } = this.formulario.getRawValue();
      await this.servicio.publicar({ titulo: titulo.trim(), cuerpo: cuerpo.trim(), autor: await this.nombreAutor() });
      this.publicaciones.set(await this.servicio.publicacionesLocales());
      this.estado.set('exito');
      this.cancelar();
      await this.mensajes.mostrar('Publicación compartida');
    } finally {
      this.publicando.set(false);
    }
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
