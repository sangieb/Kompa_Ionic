import type { ElementRef, OnDestroy } from '@angular/core';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { AlertController, IonButton, IonContent, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, locate, logOutOutline } from 'ionicons/icons';
import * as L from 'leaflet';

import { AuthService } from '../../../core/auth/auth.service';
import type { LocationResult } from '../../../core/location/location.service';
import { LocationService } from '../../../core/location/location.service';
import { MessageService } from '../../../core/message/message.service';
import type { PermissionUiState } from '../../../core/permissions/permissions.service';
import { PermissionsService } from '../../../core/permissions/permissions.service';
import { BottomBarComponent } from '../../../shared/components/bottom-bar/bottom-bar.component';
import { PermissionNoticeComponent } from '../../../shared/components/permission-notice/permission-notice.component';
import { MAP_CONFIG, createPopup, createMarkerIcon, createMap } from '../../../shared/utils/map';
import { ActivityService } from '../../activities/activity.service';
import { LOCAL_SOURCE } from '../../activities/models/activity.model';

export type NoticeType = 'none' | 'prompt' | 'denied' | 'services-off' | 'servicios-apagados' | 'gps' | 'unavailable';
export type TipoAviso = NoticeType;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonButton, IonIcon, PermissionNoticeComponent, BottomBarComponent],
})
export class HomePage implements OnDestroy {
  @ViewChild('mapa', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  get contenedorMapa(): ElementRef<HTMLDivElement> {
    return this.mapContainer;
  }

  readonly permissionState = signal<PermissionUiState>('prompt');
  readonly estadoPermiso = this.permissionState;

  readonly signalIssue = signal<'gps' | 'timeout' | 'accuracy' | 'tiempo' | 'precision' | null>(null);
  readonly problemaSenal = this.signalIssue;

  readonly noticeDismissed = signal(false);
  readonly avisoDescartado = this.noticeDismissed;

  readonly requestingLocation = signal(false);
  readonly solicitandoUbicacion = this.requestingLocation;

  readonly noticeType = computed<NoticeType>(() => {
    const state = this.permissionState();
    if (state === 'granted' && this.signalIssue()) return 'gps';
    if (state === 'granted') return 'none';
    return state;
  });
  readonly tipoAviso = this.noticeType;

  readonly showNotice = computed(() => !this.noticeDismissed() && this.noticeType() !== 'none');
  readonly mostrarAviso = this.showNotice;

  readonly noticeTitle = computed(() => {
    switch (this.noticeType()) {
      case 'denied':
        return 'La ubicación está desactivada';
      case 'services-off':
      case 'servicios-apagados':
        return 'Activa la ubicación del teléfono';
      case 'gps':
        return 'No encontramos tu ubicación';
      case 'unavailable':
        return 'Ubicación no disponible';
      default:
        return 'Activa tu ubicación';
    }
  });
  readonly tituloAviso = this.noticeTitle;

  readonly noticeMessage = computed(() => {
    switch (this.noticeType()) {
      case 'denied':
        return 'El mapa seguirá funcionando, pero no podemos centrarlo en ti ni mostrarte actividades cerca. Actívala en los ajustes del teléfono.';
      case 'services-off':
      case 'servicios-apagados':
        return 'La ubicación del sistema está apagada. Actívala en los ajustes del teléfono para centrar el mapa en ti.';
      case 'gps':
        if (this.signalIssue() === 'timeout' || this.signalIssue() === 'tiempo') {
          return 'La búsqueda tardó demasiado. Revisa que el GPS esté activo e inténtalo de nuevo.';
        }
        if (this.signalIssue() === 'accuracy' || this.signalIssue() === 'precision') {
          return 'La ubicación que recibimos no era lo bastante precisa. Sal al aire libre o inténtalo de nuevo.';
        }
        return 'Revisa que el GPS del teléfono esté activado y vuelve a intentarlo.';
      case 'unavailable':
        return 'No pudimos consultar el permiso de ubicación. Puedes revisarlo en los ajustes de la app.';
      default:
        return 'Kompa usa tu ubicación para centrar el mapa y mostrarte actividades cerca. Puedes desactivarla cuando quieras.';
    }
  });
  readonly mensajeAviso = this.noticeMessage;

  readonly noticeAction = computed(() => {
    switch (this.noticeType()) {
      case 'denied':
        return 'Abrir ajustes';
      case 'gps':
      case 'services-off':
      case 'servicios-apagados':
      case 'unavailable':
        return 'Ajustes de ubicación';
      default:
        return 'Activar ubicación';
    }
  });
  readonly accionAviso = this.noticeAction;

  readonly secondaryNoticeAction = computed(() => (this.noticeType() === 'prompt' ? 'Ahora no' : 'Reintentar'));
  readonly secundariaAviso = this.secondaryNoticeAction;

  readonly noticeIcon = computed(() => (this.noticeType() === 'prompt' ? 'location-outline' : 'warning-outline'));
  readonly iconoAviso = this.noticeIcon;

  private map?: L.Map;
  private markerLayer?: L.LayerGroup;
  private lat = MAP_CONFIG.defaultLat;
  private lon = MAP_CONFIG.defaultLon;
  private resumeListener?: PluginListenerHandle;
  private firstEntry = true;
  private isChecking = false;

  private readonly activityService = inject(ActivityService);
  private readonly locationService = inject(LocationService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertController);
  private readonly navCtrl = inject(NavController);

  constructor() {
    addIcons({ add, locate, logOutOutline });
  }

  async ionViewDidEnter(): Promise<void> {
    if (!this.map) {
      this.map = createMap(this.mapContainer.nativeElement, { zoomControl: false, zoom: MAP_CONFIG.zoom });
      this.markerLayer = L.layerGroup().addTo(this.map);
    }
    this.map.invalidateSize();
    await this.loadMarkers();
    const isFirstTime = this.firstEntry;
    this.firstEntry = false;
    await this.checkLocationState(isFirstTime);
    await this.listenForResume();
  }

  ngOnDestroy(): void {
    void this.resumeListener?.remove();
    this.map?.remove();
  }

  async activateLocation(): Promise<void> {
    if (this.requestingLocation()) return;
    this.requestingLocation.set(true);
    const result = await this.locationService.getCurrentPosition();
    this.requestingLocation.set(false);
    await this.applyResult(result);
  }

  async activarUbicacion(): Promise<void> {
    return this.activateLocation();
  }

  async centerOnMyLocation(): Promise<void> {
    const status = await this.permissionsService.locationStatus();
    this.permissionState.set(status);
    if (status === 'granted') {
      await this.applyResult(await this.locationService.getCurrentPosition());
      return;
    }
    this.noticeDismissed.set(false);
  }

  async centrarEnMiUbicacion(): Promise<void> {
    return this.centerOnMyLocation();
  }

  onNoticeAction(): void {
    const type = this.noticeType();
    if (type === 'denied') {
      void this.permissionsService.openAppSettings();
      return;
    }
    if (type === 'gps' || type === 'services-off' || type === 'servicios-apagados' || type === 'unavailable') {
      void this.permissionsService.openLocationSettings();
      return;
    }
    void this.activateLocation();
  }

  alAccionAviso(): void {
    this.onNoticeAction();
  }

  onSecondaryAction(): void {
    if (this.noticeType() === 'prompt') {
      this.noticeDismissed.set(true);
      return;
    }
    void this.activateLocation();
  }

  alAccionSecundaria(): void {
    this.onSecondaryAction();
  }

  dismissNotice(): void {
    this.noticeDismissed.set(true);
  }

  descartarAviso(): void {
    this.dismissNotice();
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Cerrar sesión',
      message: '¿Quieres salir de tu cuenta en este dispositivo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            void this.logout();
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmarCierreSesion(): Promise<void> {
    return this.confirmLogout();
  }

  goToNewActivity(): void {
    void this.router.navigateByUrl('/new-activity');
  }

  irANuevaActividad(): void {
    this.goToNewActivity();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.navCtrl.navigateRoot('/welcome');
  }

  private async checkLocationState(center: boolean): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;
    try {
      const status = await this.permissionsService.locationStatus();
      this.permissionState.set(status);
      if (status === 'granted' && center) {
        await this.centerWithPermission();
      }
    } finally {
      this.isChecking = false;
    }
  }

  private async centerWithPermission(): Promise<void> {
    const result = await this.locationService.getCurrentPosition();
    await this.applyResult(result, false);
  }

  private async applyResult(result: LocationResult, showMessage = true): Promise<void> {
    const isOk = 'state' in result ? result.state === 'ok' : result.estado === 'ok';
    const coord =
      ('coordinate' in result ? result.coordinate : undefined) ??
      ('coordenada' in result ? result.coordenada : undefined);

    if (isOk && coord) {
      this.permissionState.set('granted');
      this.signalIssue.set(null);
      this.noticeDismissed.set(false);
      this.moveMap(coord.lat, coord.lon);
      return;
    }

    const isNoPerm = 'state' in result ? result.state === 'no-permission' : result.estado === 'sin-permiso';
    if (isNoPerm) {
      this.signalIssue.set(null);
      this.permissionState.set(await this.permissionsService.locationStatus());
      this.noticeDismissed.set(false);
      if (showMessage) {
        await this.messageService.show('Sin permiso de ubicación: el mapa seguirá en la ubicación por defecto.');
      }
      return;
    }

    const isOff = 'state' in result ? result.state === 'services-off' : result.estado === 'servicios-apagados';
    if (isOff) {
      this.permissionState.set('servicios-apagados');
      this.signalIssue.set(null);
      this.noticeDismissed.set(false);
      if (showMessage) {
        await this.messageService.show('Activa la ubicación del teléfono para centrar el mapa.');
      }
      return;
    }

    this.permissionState.set('granted');
    const reason = ('reason' in result ? result.reason : undefined) ?? ('motivo' in result ? result.motivo : undefined);
    this.signalIssue.set(reason ?? null);
    this.noticeDismissed.set(false);
    if (showMessage) {
      const message =
        reason === 'timeout' || reason === 'tiempo'
          ? 'La búsqueda de ubicación tardó demasiado. Inténtalo de nuevo.'
          : reason === 'accuracy' || reason === 'precision'
            ? 'No obtuvimos una ubicación lo bastante precisa. Inténtalo de nuevo.'
            : 'No pudimos obtener tu ubicación. Revisa que el GPS esté activado.';
      await this.messageService.show(message);
    }
  }

  private moveMap(lat: number, lon: number): void {
    this.lat = lat;
    this.lon = lon;
    if (this.map) {
      this.map.flyTo([lat, lon], this.map.getZoom());
    }
    void this.loadMarkers();
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
      const prev = this.permissionState();
      const current = await this.permissionsService.locationStatus();
      this.permissionState.set(current);
      this.signalIssue.set(null);
      if (current !== 'granted') {
        this.noticeDismissed.set(false);
        return;
      }
      if (prev === 'granted') return;
      this.noticeDismissed.set(false);
      await this.centerWithPermission();
    } finally {
      this.isChecking = false;
    }
  }

  private async loadMarkers(): Promise<void> {
    const list = await this.activityService.getLocal();
    if (!this.markerLayer) return;
    this.markerLayer.clearLayers();
    list
      .filter((a) => a.lat !== 0 || a.lon !== 0)
      .forEach((a) => {
        const title = a.name ?? a.nombre ?? '';
        const source = a.source ?? a.origen;
        L.marker([a.lat, a.lon], {
          icon: createMarkerIcon(source === LOCAL_SOURCE ? 'local' : 'api'),
          title,
        })
          .bindPopup(createPopup(title))
          .addTo(this.markerLayer!);
      });
  }
}
