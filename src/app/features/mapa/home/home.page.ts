import type { ElementRef, OnDestroy } from '@angular/core';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, locate, person } from 'ionicons/icons';
import * as L from 'leaflet';

import { MensajeService } from '../../../core/mensaje/mensaje.service';
import type { EstadoPermisoUi } from '../../../core/permisos/permisos.service';
import { PermisosService } from '../../../core/permisos/permisos.service';
import type { ResultadoUbicacion } from '../../../core/ubicacion/ubicacion.service';
import { UbicacionService } from '../../../core/ubicacion/ubicacion.service';
import { AvisoPermisoComponent } from '../../../shared/components/aviso-permiso/aviso-permiso.component';
import { BarraInferiorComponent } from '../../../shared/components/barra-inferior/barra-inferior.component';
import { CONFIG_MAPA, crearGlobo, crearIconoMarcador, crearMapa } from '../../../shared/utils/mapa';
import { ActividadService } from '../../actividades/actividad.service';
import { ORIGEN_LOCAL } from '../../actividades/models/actividad.model';

type TipoAviso = 'none' | 'prompt' | 'denied' | 'gps' | 'unavailable';

/** Equivale a ui/home/HomeActivity.kt + HomeViewModel.kt */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonButton, IonIcon, AvisoPermisoComponent, BarraInferiorComponent],
})
export class HomePage implements OnDestroy {
  @ViewChild('mapa', { static: true }) contenedorMapa!: ElementRef<HTMLDivElement>;

  readonly estadoPermiso = signal<EstadoPermisoUi>('prompt');
  readonly problemaSenal = signal<'gps' | 'tiempo' | null>(null);
  readonly avisoDescartado = signal(false);
  readonly solicitandoUbicacion = signal(false);

  readonly tipoAviso = computed<TipoAviso>(() => {
    const estado = this.estadoPermiso();
    if (estado === 'granted' && this.problemaSenal()) return 'gps';
    if (estado === 'granted') return 'none';
    return estado;
  });

  readonly mostrarAviso = computed(() => !this.avisoDescartado() && this.tipoAviso() !== 'none');

  readonly tituloAviso = computed(() => {
    switch (this.tipoAviso()) {
      case 'denied':
        return 'La ubicación está desactivada';
      case 'gps':
        return 'No encontramos tu ubicación';
      case 'unavailable':
        return 'Ubicación no disponible';
      default:
        return 'Activa tu ubicación';
    }
  });

  readonly mensajeAviso = computed(() => {
    switch (this.tipoAviso()) {
      case 'denied':
        return 'El mapa seguirá funcionando, pero no podemos centrarlo en ti ni mostrarte actividades cerca. Actívala en los ajustes del teléfono.';
      case 'gps':
        return this.problemaSenal() === 'tiempo'
          ? 'La búsqueda tardó demasiado. Revisa que el GPS esté activo e inténtalo de nuevo.'
          : 'Revisa que el GPS del teléfono esté activado y vuelve a intentarlo.';
      case 'unavailable':
        return 'No pudimos consultar el permiso de ubicación. Puedes revisarlo en los ajustes de la app.';
      default:
        return 'Kompa usa tu ubicación para centrar el mapa y mostrarte actividades cerca. Puedes desactivarla cuando quieras.';
    }
  });

  readonly accionAviso = computed(() => {
    switch (this.tipoAviso()) {
      case 'denied':
        return 'Abrir ajustes';
      case 'gps':
      case 'unavailable':
        return 'Ajustes de ubicación';
      default:
        return 'Activar ubicación';
    }
  });

  readonly secundariaAviso = computed(() => (this.tipoAviso() === 'prompt' ? 'Ahora no' : 'Reintentar'));

  readonly iconoAviso = computed(() => (this.tipoAviso() === 'prompt' ? 'location-outline' : 'warning-outline'));

  private mapa?: L.Map;
  private capaMarcadores = L.layerGroup();
  private lat = CONFIG_MAPA.latDefault;
  private lon = CONFIG_MAPA.lonDefault;
  private reanudacion?: PluginListenerHandle;

  private readonly actividades = inject(ActividadService);
  private readonly ubicacion = inject(UbicacionService);
  private readonly permisos = inject(PermisosService);
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
    await this.verificarEstadoUbicacion(true);
    await this.escucharReanudacion();
  }

  ngOnDestroy(): void {
    void this.reanudacion?.remove();
    this.mapa?.remove(); // como mapa.onDetach()
  }

  /** Pide la ubicación a partir de una acción explícita del usuario. */
  async activarUbicacion(): Promise<void> {
    if (this.solicitandoUbicacion()) return;
    this.solicitandoUbicacion.set(true);
    const resultado = await this.ubicacion.obtenerPosicion();
    this.solicitandoUbicacion.set(false);
    await this.aplicarResultado(resultado);
  }

  /** Al tocar el FAB de centrar: si no hay permiso, muestra la explicación. */
  async centrarEnMiUbicacion(): Promise<void> {
    const estado = await this.permisos.estadoUbicacion();
    this.estadoPermiso.set(estado);
    if (estado === 'granted') {
      await this.aplicarResultado(await this.ubicacion.obtenerPosicion());
      return;
    }
    this.avisoDescartado.set(false);
  }

  alAccionAviso(): void {
    const tipo = this.tipoAviso();
    if (tipo === 'denied') {
      void this.permisos.abrirAjustesApp();
      return;
    }
    if (tipo === 'gps' || tipo === 'unavailable') {
      void this.permisos.abrirAjustesUbicacion();
      return;
    }
    void this.activarUbicacion();
  }

  alAccionSecundaria(): void {
    if (this.tipoAviso() === 'prompt') {
      this.avisoDescartado.set(true);
      return;
    }
    void this.activarUbicacion();
  }

  descartarAviso(): void {
    this.avisoDescartado.set(true);
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

  private async verificarEstadoUbicacion(centrar: boolean): Promise<void> {
    const estado = await this.permisos.estadoUbicacion();
    this.estadoPermiso.set(estado);
    if (estado === 'granted' && centrar) {
      await this.centrarConPermiso();
    }
  }

  private async centrarConPermiso(): Promise<void> {
    const resultado = await this.ubicacion.obtenerPosicion();
    await this.aplicarResultado(resultado, false);
  }

  private async aplicarResultado(resultado: ResultadoUbicacion, mostrarMensaje = true): Promise<void> {
    if (resultado.estado === 'ok') {
      this.estadoPermiso.set('granted');
      this.problemaSenal.set(null);
      this.avisoDescartado.set(false);
      this.moverMapa(resultado.coordenada.lat, resultado.coordenada.lon);
      return;
    }

    if (resultado.estado === 'sin-permiso') {
      this.problemaSenal.set(null);
      this.estadoPermiso.set(await this.permisos.estadoUbicacion());
      this.avisoDescartado.set(false);
      if (mostrarMensaje) {
        await this.mensajes.mostrar('Sin permiso de ubicación: el mapa seguirá en la ubicación por defecto.');
      }
      return;
    }

    this.estadoPermiso.set('granted');
    this.problemaSenal.set(resultado.motivo);
    this.avisoDescartado.set(false);
    if (mostrarMensaje) {
      await this.mensajes.mostrar('No pudimos obtener tu ubicación. Revisa que el GPS esté activado.');
    }
  }

  private moverMapa(lat: number, lon: number): void {
    this.lat = lat;
    this.lon = lon;
    this.mapa?.flyTo([lat, lon], this.mapa.getZoom());
    void this.cargarMarcadores();
  }

  private async escucharReanudacion(): Promise<void> {
    if (this.reanudacion) return;
    this.reanudacion = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void this.revisarAlVolver();
    });
  }

  /** Al volver de Ajustes se actualiza el estado y, si ya hay permiso, se centra. */
  private async revisarAlVolver(): Promise<void> {
    const estado = await this.permisos.estadoUbicacion();
    this.estadoPermiso.set(estado);
    if (estado !== 'granted') return;
    this.problemaSenal.set(null);
    this.avisoDescartado.set(false);
    await this.centrarConPermiso();
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
