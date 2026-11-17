import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

/** Pantalla de bienvenida con el logo y el acceso a login y registro. */
@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  imports: [IonContent, IonButton],
})
export class InicioPage {
  private readonly router = inject(Router);

  irA(ruta: string): void {
    void this.router.navigateByUrl(ruta);
  }
}
