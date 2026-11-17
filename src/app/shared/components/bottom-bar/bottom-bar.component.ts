import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, listOutline, mapOutline, personOutline } from 'ionicons/icons';

export interface Tab {
  route: string;
  label: string;
  icon: string;
  ruta?: string;
  etiqueta?: string;
  icono?: string;
}

export type Pestana = Tab;

/**
 * Bottom navigation bar for primary screens.
 */
@Component({
  selector: 'app-bottom-bar',
  templateUrl: './bottom-bar.component.html',
  styleUrls: ['./bottom-bar.component.scss'],
  imports: [IonIcon, RouterLink, RouterLinkActive],
})
export class BottomBarComponent {
  readonly tabs: Tab[] = [
    { route: '/home', label: 'Mapa', icon: 'map-outline', ruta: '/home', etiqueta: 'Mapa', icono: 'map-outline' },
    {
      route: '/activities',
      label: 'Actividades',
      icon: 'list-outline',
      ruta: '/activities',
      etiqueta: 'Actividades',
      icono: 'list-outline',
    },
    {
      route: '/feed',
      label: 'Feed',
      icon: 'chatbubbles-outline',
      ruta: '/feed',
      etiqueta: 'Feed',
      icono: 'chatbubbles-outline',
    },
    {
      route: '/profile',
      label: 'Perfil',
      icon: 'person-outline',
      ruta: '/profile',
      etiqueta: 'Perfil',
      icono: 'person-outline',
    },
  ];

  readonly pestanas = this.tabs;

  constructor() {
    addIcons({ mapOutline, listOutline, chatbubblesOutline, personOutline });
  }
}
