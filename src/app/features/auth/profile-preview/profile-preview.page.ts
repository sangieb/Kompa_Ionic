import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonToolbar, NavController } from '@ionic/angular';

import type { Profile } from '../../../core/profile/profile.model';
import { ProfileSummaryComponent } from '../../../shared/components/profile-summary/profile-summary.component';
import { RegistrationDraftService } from '../registration-draft.service';

/** Equivale a ui/perfil/preview/PerfilPreviewActivity.kt */
@Component({
  selector: 'app-profile-preview',
  templateUrl: './profile-preview.page.html',
  styleUrls: ['./profile-preview.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonButton, ProfileSummaryComponent],
})
export class ProfilePreviewPage implements OnInit {
  perfil: Profile | null = null;

  private readonly borrador = inject(RegistrationDraftService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);

  ngOnInit(): void {
    const datos = this.borrador.get();
    if (!datos || !datos.consent.terms || !datos.consent.data) {
      // Sin datos del registro, o sin consentimiento, no se puede continuar.
      void this.router.navigateByUrl('/register', { replaceUrl: true });
      return;
    }
    this.perfil = datos.profile;
  }

  confirmar(): void {
    void this.router.navigateByUrl('/confirmation');
  }

  editar(): void {
    this.navCtrl.back(); // equivale a finish(): vuelve al registro con los datos llenos
  }
}
