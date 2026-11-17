import type { OnDestroy } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, locationOutline, shieldCheckmarkOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/auth/auth.service';
import { MessageService } from '../../../core/message/message.service';
import type { PermissionUiState } from '../../../core/permissions/permissions.service';
import { PermissionsService } from '../../../core/permissions/permissions.service';
import { PhotoOptionsService } from '../../../core/photo/photo-options.service';
import { PhotoService } from '../../../core/photo/photo.service';
import type { Consent } from '../../../core/privacy/consent.service';
import { ConsentService } from '../../../core/privacy/consent.service';
import { UserDataService } from '../../../core/privacy/user-data.service';
import type { Profile } from '../../../core/profile/profile.model';
import { ProfileService } from '../../../core/profile/profile.service';
import { ProfileSummaryComponent } from '../../../shared/components/profile-summary/profile-summary.component';
import { TermsModalComponent } from '../../../shared/components/terms-modal/terms-modal.component';
import { formatDate } from '../../../shared/utils/dates';
import { compressPhoto } from '../../../shared/utils/photo';

@Component({
  selector: 'app-profile, app-perfil',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonSpinner,
    IonIcon,
    IonSkeletonText,
    ProfileSummaryComponent,
    TermsModalComponent,
  ],
})
export class ProfilePage implements OnDestroy {
  readonly loading = signal(true);
  readonly cargando = this.loading;

  readonly profile = signal<Profile | null>(null);
  readonly perfil = this.profile;

  readonly consent = signal<Consent | null>(null);
  readonly consentimiento = this.consent;

  readonly locationState = signal<PermissionUiState>('prompt');
  readonly estadoUbicacion = this.locationState;

  readonly cameraState = signal<PermissionUiState>('prompt');
  readonly estadoCamara = this.cameraState;

  readonly termsModalOpen = signal(false);
  readonly modalTerminosAbierto = this.termsModalOpen;

  private resumeListener?: PluginListenerHandle;
  private isCheckingPermissions = false;

  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly photoService = inject(PhotoService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly messageService = inject(MessageService);
  private readonly photoOptionsService = inject(PhotoOptionsService);
  private readonly consentService = inject(ConsentService);
  private readonly userDataService = inject(UserDataService);
  private readonly alertCtrl = inject(AlertController);

  constructor() {
    addIcons({ cameraOutline, locationOutline, shieldCheckmarkOutline });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.load();
    await this.listenForResume();
  }

  ionViewWillLeave(): void {
    void this.resumeListener?.remove();
    this.resumeListener = undefined;
  }

  ngOnDestroy(): void {
    void this.resumeListener?.remove();
  }

  get consentText(): string {
    const consent = this.consent();
    if (!consent) return 'Aún no hay registro de aceptación en este dispositivo.';
    const dateVal = consent.date ?? consent.fecha ?? '';
    const formatted = formatDate(new Date(dateVal).getTime());
    return `Aceptaste la versión ${consent.version} el ${formatted}.`;
  }

  get consentimientoTexto(): string {
    return this.consentText;
  }

  get locationStateText(): string {
    return this.getStateText(this.locationState());
  }

  get estadoUbicacionTexto(): string {
    return this.locationStateText;
  }

  get cameraStateText(): string {
    return this.getStateText(this.cameraState());
  }

  get estadoCamaraTexto(): string {
    return this.cameraStateText;
  }

  get locationAction(): string {
    const state = this.locationState();
    return state === 'denied' || state === 'services-off' || state === 'servicios-apagados' ? 'Ajustes' : 'Activar';
  }

  get accionUbicacion(): string {
    return this.locationAction;
  }

  get cameraAction(): string {
    return this.cameraState() === 'denied' ? 'Ajustes' : 'Activar';
  }

  get accionCamara(): string {
    return this.cameraAction;
  }

  goToRegister(): void {
    void this.router.navigateByUrl('/register');
  }

  irARegistro(): void {
    this.goToRegister();
  }

  openTerms(): void {
    this.termsModalOpen.set(true);
  }

  abrirTerminos(): void {
    this.openTerms();
  }

  closeTerms(): void {
    this.termsModalOpen.set(false);
  }

  cerrarTerminos(): void {
    this.closeTerms();
  }

  async manageLocation(): Promise<void> {
    const state = this.locationState();
    if (state === 'granted') {
      await this.messageService.show('La ubicación ya está activa.');
      return;
    }
    if (state === 'services-off' || state === 'servicios-apagados') {
      await this.permissionsService.openLocationSettings();
      return;
    }
    if (state === 'denied') {
      await this.permissionsService.openAppSettings();
      return;
    }
    const granted = await this.permissionsService.requestLocation();
    this.locationState.set(granted ? 'granted' : await this.permissionsService.locationStatus());
    if (!granted) await this.permissionsService.openAppSettings();
  }

  async gestionarUbicacion(): Promise<void> {
    return this.manageLocation();
  }

  async manageCamera(): Promise<void> {
    if (this.cameraState() === 'granted') {
      await this.messageService.show('La cámara ya está activa.');
      return;
    }
    if (this.cameraState() === 'denied') {
      await this.permissionsService.openAppSettings();
      return;
    }
    const granted = await this.permissionsService.requestCamera();
    this.cameraState.set(granted ? 'granted' : 'denied');
    if (!granted) await this.permissionsService.openAppSettings();
  }

  async gestionarCamara(): Promise<void> {
    return this.manageCamera();
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Quieres salir de tu cuenta en este dispositivo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            void this.signOut();
          },
        },
      ],
    });
    await alert.present();
  }

  async cerrarSesion(): Promise<void> {
    return this.confirmLogout();
  }

  async deleteAccount(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar cuenta y datos',
      message:
        'Se borrarán tu perfil, tu cuenta, tus publicaciones, tus actividades y el consentimiento guardados en este dispositivo. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar todo',
          role: 'destructive',
          handler: () => {
            void this.deleteData();
          },
        },
      ],
    });
    await alert.present();
  }

  async eliminarCuenta(): Promise<void> {
    return this.deleteAccount();
  }

  async changePhoto(): Promise<void> {
    const source = await this.photoOptionsService.selectSource();
    if (!source) return;

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
    if (!photo) return;

    const current = this.profile();
    if (!current) return;
    const updated: Profile = {
      ...current,
      photoUri: await compressPhoto(photo, 400, 0.7),
    };
    await this.profileService.save(updated);
    this.profile.set(updated);
    await this.messageService.show('Foto de perfil actualizada');
  }

  async cambiarFoto(): Promise<void> {
    return this.changePhoto();
  }

  private async listenForResume(): Promise<void> {
    if (this.resumeListener) return;
    try {
      this.resumeListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void this.revalidatePermissions();
      });
    } catch (error) {
      console.warn('Could not listen for app resume', error);
    }
  }

  private async revalidatePermissions(): Promise<void> {
    if (this.isCheckingPermissions) return;
    this.isCheckingPermissions = true;
    try {
      const [location, camera] = await Promise.all([
        this.permissionsService.locationStatus(),
        this.permissionsService.cameraStatus(),
      ]);
      this.locationState.set(location);
      this.cameraState.set(camera);
    } finally {
      this.isCheckingPermissions = false;
    }
  }

  private async load(): Promise<void> {
    const [profile, consent, locationStatus, cameraStatus] = await Promise.all([
      this.profileService.getCurrentProfile(),
      this.consentService.getCurrent(),
      this.permissionsService.locationStatus(),
      this.permissionsService.cameraStatus(),
    ]);
    this.profile.set(profile);
    this.consent.set(consent);
    this.locationState.set(locationStatus);
    this.cameraState.set(cameraStatus);
    this.loading.set(false);
  }

  private async signOut(): Promise<void> {
    await this.auth.logout();
    await this.navCtrl.navigateRoot('/welcome');
  }

  private async deleteData(): Promise<void> {
    await this.userDataService.deleteAll();
    await this.messageService.show('Tus datos locales fueron eliminados.');
    await this.navCtrl.navigateRoot('/welcome');
  }

  private getStateText(state: PermissionUiState): string {
    switch (state) {
      case 'granted':
        return 'Activa';
      case 'denied':
        return 'Desactivada';
      case 'services-off':
      case 'servicios-apagados':
        return 'Ubicación del teléfono apagada';
      case 'unavailable':
        return 'No disponible';
      default:
        return 'Se pedirá permiso al usarla';
    }
  }
}
