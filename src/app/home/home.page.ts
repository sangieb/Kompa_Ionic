import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, locate } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';
import { ActividadService } from '../services/actividad.service';
import { AuthService } from '../services/auth.service';
import { MensajeService } from '../services/mensaje.service';
import { ORIGEN_LOCAL } from '../models/actividad.model';
import { CONFIG_MAPA, crearCapaBase, crearGlobo, crearIconoMarcador } from '../core/mapa';

/** Equivale a ui/home/HomeActivity.kt + HomeViewModel.kt */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, IonButton, IonIcon],
})
export class HomePage implements OnDestroy {
  @ViewChild('mapa', { static: true }) contenedorMapa!: ElementRef<HTMLDivElement>;

  private mapa?: L.Map;
  private capaMarcadores = L.layerGroup();
  private lat = CONFIG_MAPA.latDefault;
  private lon = CONFIG_MAPA.lonDefault;
  private ubicacionPedida = false;

  constructor(
    private actividades: ActividadService,
    private auth: AuthService,
    private mensajes: MensajeService,
    private router: Router,
    private navCtrl: NavController
  ) {
    addIcons({ add, locate });
  }

  /** Se ejecuta cada vez que la pantalla aparece (como onResume) */
  async ionViewDidEnter() {
    if (!this.mapa) {
      this.mapa = L.map(this.contenedorMapa.nativeElement, { zoomControl: false })
        .setView([this.lat, this.lon], CONFIG_MAPA.zoom);
      crearCapaBase().addTo(this.mapa);
      this.capaMarcadores.addTo(this.mapa);
    }
    this.mapa.invalidateSize();
    await this.cargarMarcadores();

    if (!this.ubicacionPedida) {
      this.ubicacionPedida = true;
      this.centrarEnMiUbicacion();
    }
  }

  ngOnDestroy() {
    this.mapa?.remove(); // como mapa.onDetach()
  }

  /** Equivale a solicitarUbicacion() + centrarEnMiUbicacion() */
  async centrarEnMiUbicacion() {
    try {
      // En Android pide el permiso de ubicación la primera vez
      const posicion = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      });
      this.lat = posicion.coords.latitude;
      this.lon = posicion.coords.longitude;
    } catch {
      this.mensajes.mostrar('Usaremos la ubicación por defecto');
    }
    this.mapa?.flyTo([this.lat, this.lon], this.mapa.getZoom());
    await this.cargarMarcadores();
  }

  irALista() {
    this.router.navigateByUrl('/lista');
  }

  /** En la app nativa el botón "Feed" abre ProximamenteActivity */
  irAFeed() {
    this.router.navigateByUrl('/proximamente');
  }

  irANuevaActividad() {
    this.router.navigateByUrl('/nueva-actividad');
  }

  async salir() {
    await this.auth.logout();
    this.navCtrl.navigateRoot('/inicio');
  }

  /** Equivale a pintarMarcadores() */
  private async cargarMarcadores() {
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