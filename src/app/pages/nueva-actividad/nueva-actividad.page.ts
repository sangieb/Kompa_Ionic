import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  IonInput, IonTextarea, IonButton, IonIcon, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, images, search, imageOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';
import { ActividadService } from '../../services/actividad.service';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { PerfilService } from '../../services/perfil.service';
import { MensajeService } from '../../services/mensaje.service';
import { ORIGEN_LOCAL } from '../../models/actividad.model';
import { CONFIG_MAPA, crearCapaBase, crearIconoMarcador } from '../../core/mapa';
import { codigoPais } from '../../core/pais-por-nacionalidad';
import { comprimirFoto } from '../../core/foto';

/** Equivale a ui/nueva/NuevaActividadActivity.kt */
@Component({
  selector: 'app-nueva-actividad',
  templateUrl: './nueva-actividad.page.html',
  styleUrls: ['./nueva-actividad.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
    IonInput, IonTextarea, IonButton, IonIcon,
  ],
})
export class NuevaActividadPage implements OnDestroy {
  @ViewChild('mapa', { static: true }) contenedorMapa!: ElementRef<HTMLDivElement>;

  readonly fechaMinima = ahoraLocal();

  nombre = '';
  descripcion = '';
  duracionTexto = '';
  fechaTexto = ''; // "yyyy-MM-ddTHH:mm"
  ubicacion = signal('');
  fotoUri = signal<string | null>(null); // webPath para la vista previa
  guardando = signal(false);
  buscando = signal(false);

  private lat: number | null = null;
  private lon: number | null = null;
  private posicionDispositivo: { lat: number; lon: number } | null = null;
  private mapa?: L.Map;
  private marcador?: L.Marker;

  constructor(
    private actividades: ActividadService,
    private geo: GeocodificacionService,
    private perfilService: PerfilService,
    private mensajes: MensajeService,
    private navCtrl: NavController
  ) {
    addIcons({ camera, images, search, imageOutline });
  }

  ionViewDidEnter() {
    if (!this.mapa) {
      this.mapa = L.map(this.contenedorMapa.nativeElement)
        .setView([CONFIG_MAPA.latDefault, CONFIG_MAPA.lonDefault], 15);
      crearCapaBase().addTo(this.mapa);
      // Igual que singleTapConfirmedHelper(): tocar el mapa fija la ubicación
      this.mapa.on('click', (e: L.LeafletMouseEvent) => this.alTocarMapa(e.latlng.lat, e.latlng.lng));
      this.centrarEnDispositivoSiHayPermiso();
    }
    this.mapa.invalidateSize();
  }

  ngOnDestroy() {
    this.mapa?.remove();
  }

  // ---------- Foto: taller 4.3 ----------

  tomarFotografia() {
    return this.obtenerFoto(CameraSource.Camera);
  }

  elegirDeGaleria() {
    return this.obtenerFoto(CameraSource.Photos);
  }

  private async obtenerFoto(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source,
      });
      this.fotoUri.set(image.webPath || null);
    } catch (error) {
      console.log('Error o cancelación', error);
    }
  }

  // ---------- Mapa y ubicación ----------

  private async centrarEnDispositivoSiHayPermiso() {
    try {
      const permisos = await Geolocation.checkPermissions();
      if (permisos.location !== 'granted') return;
      const pos = await Geolocation.getCurrentPosition({ timeout: 10000, maximumAge: 60000 });
      this.posicionDispositivo = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      this.mapa?.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
    } catch {
      // Sin permiso o sin ubicación: el mapa se queda en Bogotá
    }
  }

  private async alTocarMapa(lat: number, lon: number) {
    this.fijarUbicacion(lat, lon);
    const nombre = await this.geo.nombreUbicacion(lat, lon);
    this.ubicacion.set(nombre || 'Ubicación seleccionada (sin nombre)');
  }

  private fijarUbicacion(lat: number, lon: number) {
    this.lat = lat;
    this.lon = lon;
    this.marcador?.remove();
    if (this.mapa) {
      this.marcador = L.marker([lat, lon], { icon: crearIconoMarcador('local') }).addTo(this.mapa);
    }
  }

  /** Igual que buscarDireccion(): cerca del dispositivo o en el país de la nacionalidad */
  async buscarDireccion() {
    const texto = this.ubicacion().trim();
    if (!texto) {
      this.mensajes.mostrar('Escribe una dirección para buscarla');
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur(); // ocultarTeclado()

    let viewbox: string | undefined;
    let paises: string | undefined;
    if (this.posicionDispositivo) {
      const m = 0.5;
      const { lat, lon } = this.posicionDispositivo;
      viewbox = `${lon - m},${lat - m},${lon + m},${lat + m}`;
    } else {
      paises = codigoPais(await this.perfilService.nacionalidad()) ?? undefined;
    }

    this.buscando.set(true);
    const resultado = await this.geo.buscarDireccion(texto, viewbox, paises);
    this.buscando.set(false);

    const lat = Number(resultado?.lat);
    const lon = Number(resultado?.lon);
    if (resultado && !isNaN(lat) && !isNaN(lon)) {
      this.fijarUbicacion(lat, lon);
      this.mapa?.flyTo([lat, lon], 16);
      this.ubicacion.set(resultado.display_name ?? texto);
    } else {
      this.mensajes.mostrar('No se encontró la dirección');
    }
  }

  // ---------- Guardar ----------

  async guardar() {
    if (this.guardando()) return;

    const nombre = this.nombre.trim();
    const descripcion = this.descripcion.trim();
    const duracion = Number(this.duracionTexto.trim());
    const fecha = this.fechaTexto ? new Date(this.fechaTexto).getTime() : NaN;

    // Mismas validaciones y en el mismo orden que guardarActividad()
    let error: string | null = null;
    if (!nombre) error = 'Escribe el nombre de la actividad';
    else if (nombre.length < 2) error = 'El nombre debe tener al menos 2 caracteres';
    else if (this.lat === null || this.lon === null) error = 'Toca el mapa para fijar la ubicación de la actividad';
    else if (descripcion.length < 10) error = 'Escribe una descripción de al menos 10 caracteres';
    else if (!Number.isInteger(duracion) || duracion <= 0) error = 'Escribe una duración válida en minutos';
    else if (isNaN(fecha)) error = 'Selecciona la fecha y hora de la actividad';
    else if (fecha <= Date.now()) error = 'La fecha de la actividad debe ser futura';

    if (error) {
      this.mensajes.mostrar(error);
      return;
    }

    this.guardando.set(true);
    try {
      const foto = this.fotoUri();
      const fotoRuta = foto ? await comprimirFoto(foto) : null;
      const perfil = await this.perfilService.perfilActual();

      await this.actividades.guardarNueva({
        id: crypto.randomUUID(),
        nombre,
        descripcion,
        ubicacion: this.ubicacion(),
        lat: this.lat!,
        lon: this.lon!,
        creadoPor: perfil?.nombre?.trim() || 'Tú',
        duracionMin: duracion,
        fechaCreacion: Date.now(),
        fechaActividad: fecha,
        fotoRuta,
        origen: ORIGEN_LOCAL,
      });

      await this.mensajes.mostrar('Actividad guardada');
      this.navCtrl.back(); // finish(): vuelve al mapa, que recarga los marcadores
    } finally {
      this.guardando.set(false);
    }
  }
}

/** Fecha y hora actual en formato "yyyy-MM-ddTHH:mm" (mínimo del calendario) */
function ahoraLocal(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}