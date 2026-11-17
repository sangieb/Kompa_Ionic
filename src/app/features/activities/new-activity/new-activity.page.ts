import type { ElementRef, OnDestroy } from '@angular/core';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import type { ValidatorFn } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
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
import { camera, imageOutline, images, locateOutline, search } from 'ionicons/icons';
import * as L from 'leaflet';

import type { Coordinate, LocationResult } from '../../../core/location/location.service';
import { LocationService } from '../../../core/location/location.service';
import { MessageService } from '../../../core/message/message.service';
import type { PermissionUiState } from '../../../core/permissions/permissions.service';
import { PermissionsService } from '../../../core/permissions/permissions.service';
import { PhotoOptionsService } from '../../../core/photo/photo-options.service';
import { PhotoService } from '../../../core/photo/photo.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { PermissionNoticeComponent } from '../../../shared/components/permission-notice/permission-notice.component';
import { countryCode } from '../../../shared/utils/country-by-nationality';
import { localDateTimeNow } from '../../../shared/utils/dates';
import { firstErrorMessage } from '../../../shared/utils/forms';
import type { MessageRule } from '../../../shared/utils/forms';
import { createMarkerIcon, createMap } from '../../../shared/utils/map';
import { compressPhoto } from '../../../shared/utils/photo';
import { futureDate, minLength, positiveInteger, requiredWithContent } from '../../../shared/utils/validators';
import { ActivityService } from '../activity.service';
import { GeocodingService } from '../geocoding.service';
import { LOCAL_SOURCE } from '../models/activity.model';

const ACTIVITY_ERRORS: MessageRule[] = [
  { control: 'nombre', error: 'required', message: 'Escribe el nombre de la actividad' },
  { control: 'nombre', error: 'requerido', message: 'Escribe el nombre de la actividad' },
  { control: 'nombre', error: 'minLength', message: 'El nombre debe tener al menos 2 caracteres' },
  { control: 'nombre', error: 'longitudMinima', message: 'El nombre debe tener al menos 2 caracteres' },
  { control: '', error: 'ubicacionRequerida', message: 'Toca el mapa para fijar la ubicación de la actividad' },
  { control: '', error: 'locationRequired', message: 'Toca el mapa para fijar la ubicación de la actividad' },
  { control: 'descripcion', error: 'minLength', message: 'Escribe una descripción de al menos 10 caracteres' },
  { control: 'descripcion', error: 'longitudMinima', message: 'Escribe una descripción de al menos 10 caracteres' },
  { control: 'duracionTexto', error: 'positiveInteger', message: 'Escribe una duración válida en minutos' },
  { control: 'duracionTexto', error: 'enteroPositivo', message: 'Escribe una duración válida en minutos' },
  { control: 'fechaTexto', error: 'required', message: 'Selecciona la fecha y hora de la actividad' },
  { control: 'fechaTexto', error: 'requerido', message: 'Selecciona la fecha y hora de la actividad' },
  { control: 'fechaTexto', error: 'futureDate', message: 'La fecha de la actividad debe ser futura' },
  { control: 'fechaTexto', error: 'fechaFutura', message: 'La fecha de la actividad debe ser futura' },
];

const locationRequired: ValidatorFn = (control) => {
  const lat = control.get('latitud')?.value;
  const lon = control.get('longitud')?.value;
  return lat !== null && lon !== null ? null : { locationRequired: true, ubicacionRequerida: true };
};

@Component({
  selector: 'app-new-activity, app-nueva-actividad',
  templateUrl: './new-activity.page.html',
  styleUrls: ['./new-activity.page.scss'],
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
    PermissionNoticeComponent,
  ],
})
export class NewActivityPage implements OnDestroy {
  @ViewChild('mapa', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  get contenedorMapa(): ElementRef<HTMLDivElement> {
    return this.mapContainer;
  }

  readonly minDate = localDateTimeNow();
  readonly fechaMinima = this.minDate;

  readonly form = new FormGroup(
    {
      nombre: new FormControl<string>('', {
        nonNullable: true,
        validators: [requiredWithContent, minLength(2)],
      }),
      descripcion: new FormControl<string>('', { nonNullable: true, validators: [minLength(10)] }),
      duracionTexto: new FormControl<string>('', { nonNullable: true, validators: [positiveInteger] }),
      fechaTexto: new FormControl<string>('', { nonNullable: true, validators: [requiredWithContent, futureDate] }),
      ubicacionTexto: new FormControl<string>('', { nonNullable: true }),
      latitud: new FormControl<number | null>(null),
      longitud: new FormControl<number | null>(null),
    },
    { validators: [locationRequired] },
  );
  readonly formulario = this.form;

  readonly photoUri = signal<string | null>(null);
  readonly fotoUri = this.photoUri;

  readonly saving = signal(false);
  readonly guardando = this.saving;

  readonly searching = signal(false);
  readonly buscando = this.searching;

  readonly locationState = signal<PermissionUiState>('prompt');
  readonly estadoUbicacion = this.locationState;

  readonly requestingLocation = signal(false);
  readonly solicitandoUbicacion = this.requestingLocation;

  readonly locationWarningDismissed = signal(false);
  readonly avisoUbicacionDescartado = this.locationWarningDismissed;

  readonly showLocationWarning = computed(
    () =>
      !this.locationWarningDismissed() &&
      (this.locationState() === 'denied' ||
        this.locationState() === 'services-off' ||
        this.locationState() === 'servicios-apagados' ||
        this.locationState() === 'unavailable'),
  );
  readonly mostrarAvisoUbicacion = this.showLocationWarning;

  private devicePosition: Coordinate | null = null;
  private map?: L.Map;
  private marker?: L.Marker;
  private resumeListener?: PluginListenerHandle;
  private isChecking = false;

  private readonly activityService = inject(ActivityService);
  private readonly geocodingService = inject(GeocodingService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly photoOptionsService = inject(PhotoOptionsService);
  private readonly locationService = inject(LocationService);
  private readonly photoService = inject(PhotoService);
  private readonly navCtrl = inject(NavController);

  constructor() {
    addIcons({ camera, images, search, imageOutline, locateOutline });
  }

  async ionViewDidEnter(): Promise<void> {
    if (!this.map) {
      this.map = createMap(this.mapContainer.nativeElement, { zoom: 15 });
      this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapTap(e.latlng.lat, e.latlng.lng));
      await this.updateLocationStatus(true);
    }
    this.map.invalidateSize();
    await this.listenForResume();
  }

  ngOnDestroy(): void {
    void this.resumeListener?.remove();
    this.map?.remove();
  }

  async takePhoto(): Promise<void> {
    await this.acquirePhoto('camera');
  }

  async tomarFotografia(): Promise<void> {
    return this.takePhoto();
  }

  async pickFromGallery(): Promise<void> {
    await this.acquirePhoto('gallery');
  }

  async elegirDeGaleria(): Promise<void> {
    return this.pickFromGallery();
  }

  async pickPhoto(): Promise<void> {
    const source = await this.photoOptionsService.selectSource();
    if (!source) return;
    await this.acquirePhoto(source);
  }

  async elegirFoto(): Promise<void> {
    return this.pickPhoto();
  }

  private async acquirePhoto(source: 'camera' | 'gallery'): Promise<void> {
    const allowed =
      source === 'camera'
        ? await this.permissionsService.ensureCamera()
        : await this.permissionsService.ensureGallery();
    if (!allowed) return;

    const { photo, error } =
      source === 'camera' ? await this.photoService.takePhoto() : await this.photoService.pickFromGallery();

    if (error) {
      await this.messageService.show(error);
      return;
    }
    this.photoUri.set(photo);
  }

  async useMyLocation(): Promise<void> {
    if (this.requestingLocation()) return;
    this.requestingLocation.set(true);
    const result = await this.locationService.getCurrentPosition();
    this.requestingLocation.set(false);
    await this.applyLocation(result, true);
  }

  async usarMiUbicacion(): Promise<void> {
    return this.useMyLocation();
  }

  onLocationWarningAction(): void {
    const state = this.locationState();
    if (state === 'denied') {
      void this.permissionsService.openAppSettings();
      return;
    }
    if (state === 'services-off' || state === 'servicios-apagados') {
      void this.permissionsService.openLocationSettings();
      return;
    }
    void this.useMyLocation();
  }

  alAccionAvisoUbicacion(): void {
    this.onLocationWarningAction();
  }

  get locationWarningAction(): string {
    const state = this.locationState();
    if (state === 'denied') return 'Abrir ajustes';
    if (state === 'services-off' || state === 'servicios-apagados') return 'Ajustes de ubicación';
    return 'Reintentar';
  }

  get accionAvisoUbicacion(): string {
    return this.locationWarningAction;
  }

  dismissLocationWarning(): void {
    this.locationWarningDismissed.set(true);
  }

  descartarAvisoUbicacion(): void {
    this.dismissLocationWarning();
  }

  private async updateLocationStatus(center: boolean): Promise<void> {
    const state = await this.permissionsService.locationStatus();
    this.locationState.set(state);
    if (state !== 'granted' || !center) return;
    await this.applyLocation(await this.locationService.getCurrentPosition(), false);
  }

  private async applyLocation(result: LocationResult, notify: boolean): Promise<void> {
    const isOk = 'state' in result ? result.state === 'ok' : result.estado === 'ok';
    const coord =
      ('coordinate' in result ? result.coordinate : undefined) ??
      ('coordenada' in result ? result.coordenada : undefined);

    if (isOk && coord) {
      this.locationState.set('granted');
      this.locationWarningDismissed.set(false);
      this.devicePosition = coord;
      this.map?.flyTo([coord.lat, coord.lon], 15);
      return;
    }

    const isNoPerm = 'state' in result ? result.state === 'no-permission' : result.estado === 'sin-permiso';
    if (isNoPerm) {
      this.locationState.set(await this.permissionsService.locationStatus());
      this.locationWarningDismissed.set(false);
      if (notify) {
        await this.messageService.show('Sin permiso de ubicación. Puedes tocar el mapa para fijar la actividad.');
      }
      return;
    }

    const isOff = 'state' in result ? result.state === 'services-off' : result.estado === 'servicios-apagados';
    if (isOff) {
      this.locationState.set('servicios-apagados');
      this.locationWarningDismissed.set(false);
      if (notify) {
        await this.messageService.show('Activa la ubicación del teléfono o toca el mapa para fijar la actividad.');
      }
      return;
    }

    if (notify) {
      const reason =
        ('reason' in result ? result.reason : undefined) ?? ('motivo' in result ? result.motivo : undefined);
      const message =
        reason === 'timeout' || reason === 'tiempo'
          ? 'La búsqueda de ubicación tardó demasiado. Toca el mapa para fijarla.'
          : reason === 'accuracy' || reason === 'precision'
            ? 'No obtuvimos una ubicación precisa. Toca el mapa para fijarla.'
            : 'No pudimos obtener tu ubicación. Revisa el GPS o toca el mapa para fijarla.';
      await this.messageService.show(message);
    }
  }

  private async listenForResume(): Promise<void> {
    if (this.resumeListener) return;
    try {
      this.resumeListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void this.checkOnReturn();
      });
    } catch (error) {
      console.warn('Could not listen for app resume', error);
    }
  }

  private async checkOnReturn(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;
    try {
      const prev = this.locationState();
      const current = await this.permissionsService.locationStatus();
      this.locationState.set(current);
      if (current !== 'granted' || prev === 'granted') return;
      this.locationWarningDismissed.set(false);
      await this.applyLocation(await this.locationService.getCurrentPosition(), false);
    } finally {
      this.isChecking = false;
    }
  }

  private async onMapTap(lat: number, lon: number): Promise<void> {
    this.setLocation(lat, lon);
    const name = await this.geocodingService.getLocationName(lat, lon);
    this.form.controls.ubicacionTexto.setValue(name || 'Ubicación seleccionada (sin nombre)');
  }

  private setLocation(lat: number, lon: number): void {
    this.form.controls.latitud.setValue(lat);
    this.form.controls.longitud.setValue(lon);
    this.marker?.remove();
    if (this.map) {
      this.marker = L.marker([lat, lon], { icon: createMarkerIcon('local') }).addTo(this.map);
    }
  }

  async searchAddress(): Promise<void> {
    const text = this.form.controls.ubicacionTexto.value.trim();
    if (!text) {
      await this.messageService.show('Escribe una dirección para buscarla');
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur();

    let viewbox: string | undefined;
    let countries: string | undefined;
    if (this.devicePosition) {
      const m = 0.5;
      const { lat, lon } = this.devicePosition;
      viewbox = `${lon - m},${lat - m},${lon + m},${lat + m}`;
    } else {
      countries = countryCode(await this.profileService.getNationality()) ?? undefined;
    }

    this.searching.set(true);
    const result = await this.geocodingService.searchAddress(text, viewbox, countries);
    this.searching.set(false);

    const lat = Number(result?.lat);
    const lon = Number(result?.lon);
    if (result && !isNaN(lat) && !isNaN(lon)) {
      this.setLocation(lat, lon);
      this.map?.flyTo([lat, lon], 16);
      this.form.controls.ubicacionTexto.setValue(result.display_name ?? text);
    } else {
      await this.messageService.show('No se encontró la dirección');
    }
  }

  async buscarDireccion(): Promise<void> {
    return this.searchAddress();
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    const error = firstErrorMessage(this.form, ACTIVITY_ERRORS);
    if (error) {
      await this.messageService.show(error);
      return;
    }

    this.saving.set(true);
    try {
      const data = this.form.getRawValue();
      const photo = this.photoUri();
      const photoPath = photo ? await compressPhoto(photo) : null;
      const profile = await this.profileService.getCurrentProfile();
      const date = new Date(data.fechaTexto).getTime();
      const duration = data.duracionTexto.trim() ? Number(data.duracionTexto.trim()) : null;

      await this.activityService.saveNew({
        id: crypto.randomUUID(),
        name: data.nombre.trim(),
        description: data.descripcion.trim(),
        location: this.form.controls.ubicacionTexto.value,
        lat: data.latitud ?? 0,
        lon: data.longitud ?? 0,
        createdBy: profile?.name?.trim() || 'Tú',
        durationMin: Number.isNaN(duration) ? null : duration,
        createdAt: Date.now(),
        activityDate: date,
        photoPath,
        source: LOCAL_SOURCE,
      });

      await this.messageService.show('Actividad guardada');
      this.navCtrl.back();
    } finally {
      this.saving.set(false);
    }
  }

  async guardar(): Promise<void> {
    return this.save();
  }
}
