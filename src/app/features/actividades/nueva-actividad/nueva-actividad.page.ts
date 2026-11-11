import type { ElementRef, OnDestroy } from '@angular/core';
import { Component, ViewChild, inject, signal } from '@angular/core';
import type { ValidatorFn } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonTextarea,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, imageOutline, images, search } from 'ionicons/icons';
import * as L from 'leaflet';

import { FotoService } from '../../../core/foto/foto.service';
import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { PerfilService } from '../../../core/perfil/perfil.service';
import { PermisosService } from '../../../core/permisos/permisos.service';
import { UbicacionService } from '../../../core/ubicacion/ubicacion.service';
import type { Coordenada } from '../../../core/ubicacion/ubicacion.service';
import { fechaHoraLocalAhora } from '../../../shared/utils/fechas';
import { primerMensajeError } from '../../../shared/utils/formularios';
import type { ReglaMensaje } from '../../../shared/utils/formularios';
import { comprimirFoto } from '../../../shared/utils/foto';
import { crearIconoMarcador, crearMapa } from '../../../shared/utils/mapa';
import { codigoPais } from '../../../shared/utils/pais-por-nacionalidad';
import { enteroPositivo, fechaFutura, longitudMinima, requeridoConContenido } from '../../../shared/utils/validadores';
import { ActividadService } from '../actividad.service';
import { GeocodificacionService } from '../geocodificacion.service';
import { ORIGEN_LOCAL } from '../models/actividad.model';

/** Validaciones de la nueva actividad, en el mismo orden que guardarActividad() en Kotlin. */
const ERRORES_ACTIVIDAD: ReglaMensaje[] = [
  { control: 'nombre', error: 'requerido', mensaje: 'Escribe el nombre de la actividad' },
  { control: 'nombre', error: 'longitudMinima', mensaje: 'El nombre debe tener al menos 2 caracteres' },
  { control: '', error: 'ubicacionRequerida', mensaje: 'Toca el mapa para fijar la ubicación de la actividad' },
  { control: 'descripcion', error: 'longitudMinima', mensaje: 'Escribe una descripción de al menos 10 caracteres' },
  { control: 'duracionTexto', error: 'enteroPositivo', mensaje: 'Escribe una duración válida en minutos' },
  { control: 'fechaTexto', error: 'requerido', mensaje: 'Selecciona la fecha y hora de la actividad' },
  { control: 'fechaTexto', error: 'fechaFutura', mensaje: 'La fecha de la actividad debe ser futura' },
];

/** La ubicación solo es válida si el mapa fijó latitud y longitud. */
const ubicacionRequerida: ValidatorFn = (control) => {
  const lat = control.get('latitud')?.value;
  const lon = control.get('longitud')?.value;
  return lat !== null && lon !== null ? null : { ubicacionRequerida: true };
};

/** Equivale a ui/nueva/NuevaActividadActivity.kt */
@Component({
  selector: 'app-nueva-actividad',
  templateUrl: './nueva-actividad.page.html',
  styleUrls: ['./nueva-actividad.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    ReactiveFormsModule,
  ],
})
export class NuevaActividadPage implements OnDestroy {
  @ViewChild('mapa', { static: true }) contenedorMapa!: ElementRef<HTMLDivElement>;

  readonly fechaMinima = fechaHoraLocalAhora();

  readonly formulario = new FormGroup(
    {
      nombre: new FormControl<string>('', {
        nonNullable: true,
        validators: [requeridoConContenido, longitudMinima(2)],
      }),
      descripcion: new FormControl<string>('', { nonNullable: true, validators: [longitudMinima(10)] }),
      duracionTexto: new FormControl<string>('', { nonNullable: true, validators: [enteroPositivo] }),
      fechaTexto: new FormControl<string>('', { nonNullable: true, validators: [requeridoConContenido, fechaFutura] }),
      ubicacionTexto: new FormControl<string>('', { nonNullable: true }),
      latitud: new FormControl<number | null>(null),
      longitud: new FormControl<number | null>(null),
    },
    { validators: [ubicacionRequerida] },
  );

  readonly fotoUri = signal<string | null>(null); // webPath para la vista previa
  readonly guardando = signal(false);
  readonly buscando = signal(false);

  private posicionDispositivo: Coordenada | null = null;
  private mapa?: L.Map;
  private marcador?: L.Marker;

  private readonly actividades = inject(ActividadService);
  private readonly geo = inject(GeocodificacionService);
  private readonly perfilService = inject(PerfilService);
  private readonly mensajes = inject(MensajeService);
  private readonly permisos = inject(PermisosService);
  private readonly ubicacion = inject(UbicacionService);
  private readonly fotos = inject(FotoService);
  private readonly navCtrl = inject(NavController);

  constructor() {
    addIcons({ camera, images, search, imageOutline });
  }

  ionViewDidEnter(): void {
    if (!this.mapa) {
      this.mapa = crearMapa(this.contenedorMapa.nativeElement, { zoom: 15 });
      // Igual que singleTapConfirmedHelper(): tocar el mapa fija la ubicación
      this.mapa.on('click', (e: L.LeafletMouseEvent) => this.alTocarMapa(e.latlng.lat, e.latlng.lng));
      void this.centrarEnDispositivoSiHayPermiso();
    }
    this.mapa.invalidateSize();
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  // ---------- Foto: taller 4.3 ----------

  async tomarFotografia(): Promise<void> {
    await this.obtenerFoto('camara');
  }

  async elegirDeGaleria(): Promise<void> {
    await this.obtenerFoto('galeria');
  }

  private async obtenerFoto(desde: 'camara' | 'galeria'): Promise<void> {
    const permitido = await (desde === 'camara' ? this.permisos.asegurarCamara() : this.permisos.asegurarGaleria());
    if (!permitido) return;

    const { foto, error } = desde === 'camara' ? await this.fotos.tomarFoto() : await this.fotos.elegirDeGaleria();
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }
    this.fotoUri.set(foto); // null si el usuario canceló
  }

  // ---------- Mapa y ubicación ----------

  private async centrarEnDispositivoSiHayPermiso(): Promise<void> {
    if (!(await this.permisos.verificarUbicacion())) return;
    const posicion = await this.ubicacion.posicionActual();
    if (!posicion) return; // sin permiso o sin señal: el mapa se queda en Bogotá
    this.posicionDispositivo = posicion;
    this.mapa?.flyTo([posicion.lat, posicion.lon], 15);
  }

  private async alTocarMapa(lat: number, lon: number): Promise<void> {
    this.fijarUbicacion(lat, lon);
    const nombre = await this.geo.nombreUbicacion(lat, lon);
    this.formulario.controls.ubicacionTexto.setValue(nombre || 'Ubicación seleccionada (sin nombre)');
  }

  private fijarUbicacion(lat: number, lon: number): void {
    this.formulario.controls.latitud.setValue(lat);
    this.formulario.controls.longitud.setValue(lon);
    this.marcador?.remove();
    if (this.mapa) {
      this.marcador = L.marker([lat, lon], { icon: crearIconoMarcador('local') }).addTo(this.mapa);
    }
  }

  /** Igual que buscarDireccion(): cerca del dispositivo o en el país de la nacionalidad */
  async buscarDireccion(): Promise<void> {
    const texto = this.formulario.controls.ubicacionTexto.value.trim();
    if (!texto) {
      await this.mensajes.mostrar('Escribe una dirección para buscarla');
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
      this.formulario.controls.ubicacionTexto.setValue(resultado.display_name ?? texto);
    } else {
      await this.mensajes.mostrar('No se encontró la dirección');
    }
  }

  // ---------- Guardar ----------

  async guardar(): Promise<void> {
    if (this.guardando()) return;

    const error = primerMensajeError(this.formulario, ERRORES_ACTIVIDAD);
    if (error) {
      await this.mensajes.mostrar(error);
      return;
    }

    this.guardando.set(true);
    try {
      const datos = this.formulario.getRawValue();
      const foto = this.fotoUri();
      const fotoRuta = foto ? await comprimirFoto(foto) : null;
      const perfil = await this.perfilService.perfilActual();
      const fecha = new Date(datos.fechaTexto).getTime();

      await this.actividades.guardarNueva({
        id: crypto.randomUUID(),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim(),
        ubicacion: this.formulario.controls.ubicacionTexto.value,
        lat: datos.latitud!,
        lon: datos.longitud!,
        creadoPor: perfil?.nombre?.trim() || 'Tú',
        duracionMin: Number(datos.duracionTexto.trim()),
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
