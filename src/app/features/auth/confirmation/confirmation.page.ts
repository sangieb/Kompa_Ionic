import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonToolbar, NavController } from '@ionic/angular';

import { AccountService } from '../../../core/auth/account.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MessageService } from '../../../core/message/message.service';
import { ConsentService } from '../../../core/privacy/consent.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { PlaneAnimationComponent } from '../../../shared/components/plane-animation.component';
import { RegistrationDraftService } from '../registration-draft.service';
import type { RegistrationDraft } from '../registration-draft.service';

/** Equivale a ui/perfil/confirmacion/ConfirmacionActivity.kt */
@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonButton, PlaneAnimationComponent],
})
export class ConfirmationPage implements OnInit {
  readonly mostrarBoton = signal(false);
  readonly guardando = signal(false);

  private datos: RegistrationDraft | null = null;

  private readonly borrador = inject(RegistrationDraftService);
  private readonly profileService = inject(ProfileService);
  private readonly consents = inject(ConsentService);
  private readonly accounts = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);

  async ngOnInit(): Promise<void> {
    this.datos = this.borrador.obtener();
    if (!this.datos || !this.datos.consent.terms || !this.datos.consent.data) {
      await this.router.navigateByUrl('/register', { replaceUrl: true });
      return;
    }
    await this.profileService.save(this.datos.profile); // persistirPerfil()
  }

  /** Igual que onFlightCompleted: muestra el botón cuando el avión termina */
  alTerminarVuelo(): void {
    this.mostrarBoton.set(true);
  }

  async continuar(): Promise<void> {
    if (!this.datos) return;
    this.guardando.set(true);

    const { profile, credentials, consent } = this.datos;
    // La aceptación queda registrada con la versión vigente y su fecha.
    await this.consents.save(consent);
    if (profile.email) {
      await this.accounts.register(profile.email, credentials);
      await this.auth.createSession(profile.email);
    }
    this.borrador.limpiar();

    await this.messages.show('¡Bienvenido a Kompa!');
    // navigateRoot borra el historial: equivale a FLAG_ACTIVITY_NEW_TASK | CLEAR_TASK
    this.navCtrl.navigateRoot('/home');
  }
}
