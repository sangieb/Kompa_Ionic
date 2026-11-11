import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
  IonChip, IonButton, IonIcon, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { RegistroBorradorService } from '../../services/registro-borrador.service';
import { Perfil } from '../../models/perfil.model';

/** Equivale a ui/perfil/preview/PerfilPreviewActivity.kt */
@Component({
  selector: 'app-perfil-preview',
  templateUrl: './perfil-preview.page.html',
  styleUrls: ['./perfil-preview.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,
    IonChip, IonButton, IonIcon,
  ],
})
export class PerfilPreviewPage implements OnInit {
  perfil: Perfil | null = null;
  idiomas: string[] = [];
  intereses: string[] = [];

  constructor(
    private borrador: RegistroBorradorService,
    private router: Router,
    private navCtrl: NavController
  ) {
    addIcons({ camera });
  }

  ngOnInit() {
    const datos = this.borrador.obtener();
    if (!datos) {
      // Sin datos del registro no hay nada que mostrar
      this.router.navigateByUrl('/registro', { replaceUrl: true });
      return;
    }
    this.perfil = datos.perfil;
    this.idiomas = separarPorComas(datos.perfil.idiomas);
    this.intereses = separarPorComas(datos.perfil.intereses);
  }

  confirmar() {
    this.router.navigateByUrl('/confirmacion');
  }

  editar() {
    this.navCtrl.back(); // equivale a finish(): vuelve al registro con los datos llenos
  }
}

/** Igual que agregarChipsDeTexto(): separa por comas y quita vacíos */
function separarPorComas(texto: string): string[] {
  return texto.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
}