import { Component, OnInit, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  IonSpinner, IonButton,
} from '@ionic/angular';
import { PublicacionService } from '../../services/publicacion.service';
import { Publicacion } from '../../models/publicacion.model';
import { formatearFechaHora } from '../../core/fechas';

/** Equivale a FeedUiState: Cargando / Exito / Error */
type EstadoFeed = 'cargando' | 'exito' | 'error';

/** Equivale a ui/feed/FeedActivity.kt + FeedViewModel.kt + FeedAdapter.kt */
@Component({
  selector: 'app-feed',
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
    IonSpinner, IonButton,
  ],
})
export class FeedPage implements OnInit {
  estado = signal<EstadoFeed>('cargando');
  publicaciones = signal<Publicacion[]>([]);

  constructor(private servicio: PublicacionService) {}

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

  fecha(p: Publicacion): string {
    return p.fechaCreacion != null ? formatearFechaHora(p.fechaCreacion) : '—';
  }
}