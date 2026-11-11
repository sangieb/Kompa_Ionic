import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonToolbar, NavController } from '@ionic/angular';

import type { Perfil } from '../../../core/perfil/perfil.model';
import { PerfilResumenComponent } from '../../../shared/components/perfil-resumen/perfil-resumen.component';
import { RegistroBorradorService } from '../registro-borrador.service';

/** Equivale a ui/perfil/preview/PerfilPreviewActivity.kt */
@Component({
  selector: 'app-perfil-preview',
  templateUrl: './perfil-preview.page.html',
  styleUrls: ['./perfil-preview.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonButton, PerfilResumenComponent],
})
export class PerfilPreviewPage implements OnInit {
  perfil: Perfil | null = null;

  private readonly borrador = inject(RegistroBorradorService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);

  ngOnInit(): void {
    const datos = this.borrador.obtener();
    if (!datos) {
      // Sin datos del registro no hay nada que mostrar
      void this.router.navigateByUrl('/registro', { replaceUrl: true });
      return;
    }
    this.perfil = datos.perfil;
  }

  confirmar(): void {
    void this.router.navigateByUrl('/confirmacion');
  }

  editar(): void {
    this.navCtrl.back(); // equivale a finish(): vuelve al registro con los datos llenos
  }
}
