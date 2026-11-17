import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, listOutline, mapOutline, personOutline } from 'ionicons/icons';

interface Pestana {
  ruta: string;
  etiqueta: string;
  icono: string;
}

/**
 * Barra de navegación inferior de las pantallas principales.
 * Es un componente aparte para poder reutilizarlo en más páginas.
 */
@Component({
  selector: 'app-barra-inferior',
  templateUrl: './barra-inferior.component.html',
  styleUrls: ['./barra-inferior.component.scss'],
  imports: [IonIcon, RouterLink, RouterLinkActive],
})
export class BarraInferiorComponent {
  readonly pestanas: Pestana[] = [
    { ruta: '/home', etiqueta: 'Mapa', icono: 'map-outline' },
    { ruta: '/lista', etiqueta: 'Lista', icono: 'list-outline' },
    { ruta: '/feed', etiqueta: 'Feed', icono: 'chatbubbles-outline' },
    { ruta: '/perfil', etiqueta: 'Perfil', icono: 'person-outline' },
  ];

  constructor() {
    addIcons({ mapOutline, listOutline, chatbubblesOutline, personOutline });
  }
}
