import type { ElementRef, OnDestroy } from '@angular/core';
import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, locate, person } from 'ionicons/icons';
import * as L from 'leaflet';

import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { UbicacionService } from '../../../core/ubicacion/ubicacion.service';
import { CONFIG_MAPA, crearGlobo, crearIconoMarcador, crearMapa } from '../../../shared/utils/mapa';
import { ActividadService } from '../../actividades/actividad.service';
import { ORIGEN_LOCAL } from '../../actividades/models/actividad.model';

/** Equivale a ui/home/HomeActivity.kt + HomeViewModel.kt */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonButton, IonIcon],
})
export class HomePage implements OnDestroy {
  @ViewChild('mapa', { static: true }) contenedorMapa!: ElementRef<HTMLDivElement>;

  private mapa?: L.Map;
  private capaMarcadores = L.layerGroup();
  private lat = CONFIG_MAPA.latDefault;
  private lon = CONFIG_MAPA.lonDefault;
  private ubicacionPedida = false;

  private readonly actividades = inject(ActividadService);
  private readonly ubicacion = inject(UbicacionService);
  private readonly mensajes = inject(MensajeService);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ add, locate, person });
  }

  /** Se ejecuta cada vez que la pantalla aparece (como onResume) */
  async ionViewDidEnter(): Promise<void> {
    if (!this.mapa) {
      this.mapa = crearMapa(this.contenedorMapa.nativeElement, { zoomControl: false, zoom: CONFIG_MAPA.zoom });
      this.capaMarcadores.addTo(this.mapa);
    }
    this.mapa.invalidateSize();
    await this.cargarMarcadores();

    if (!this.ubicacionPedida) {
      this.ubicacionPedida = true;
      void this.centrarEnMiUbicacion();
    }
  }

  ngOnDestroy(): void {
    this.mapa?.remove(); // como mapa.onDetach()
  }

  /** Equivale a solicitarUbicacion() + centrarEnMiUbicacion() */
  async centrarEnMiUbicacion(): Promise<void> {
    const posicion = await this.ubicacion.posicionActual();
    if (posicion) {
      this.lat = posicion.lat;
      this.lon = posicion.lon;
    } else {
      await this.mensajes.mostrar('Usaremos la ubicación por defecto');
    }
    this.mapa?.flyTo([this.lat, this.lon], this.mapa.getZoom());
    await this.cargarMarcadores();
  }

  irALista(): void {
    void this.router.navigateByUrl('/lista');
  }

  irAFeed(): void {
    void this.router.navigateByUrl('/feed');
  }

  irAPerfil(): void {
    void this.router.navigateByUrl('/perfil');
  }

  irANuevaActividad(): void {
    void this.router.navigateByUrl('/nueva-actividad');
  }

  /** Equivale a pintarMarcadores() */
  private async cargarMarcadores(): Promise<void> {
    const lista = await this.actividades.obtenerLocales();
    this.capaMarcadores.clearLayers();
    lista
      .filter((a) => a.lat !== 0 || a.lon !== 0)
      .forEach((a) => {
        L.marker([a.lat, a.lon], {
          icon: crearIconoMarcador(a.origen === ORIGEN_LOCAL ? 'local' : 'api'),
          title: a.nombre,
        })
          .bindPopup(crearGlobo(a.nombre))
          .addTo(this.capaMarcadores);
      });
  }
}
