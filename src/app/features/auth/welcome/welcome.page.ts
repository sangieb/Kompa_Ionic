import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

/** Welcome landing screen with logo and entry points for login and registration. */
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  imports: [IonContent, IonButton],
})
export class WelcomePage {
  private readonly router = inject(Router);

  navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
  }
}
