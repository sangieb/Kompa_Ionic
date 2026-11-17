import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close, shieldCheckmarkOutline } from 'ionicons/icons';

import { RESPONSABLE_DATOS, TERMINOS_FECHA_TEXTO, TERMINOS_VERSION } from '../../../core/privacidad/terminos';

/**
 * Modal informativo con los Términos y Condiciones y la autorización de
 * tratamiento de datos. No marca aceptaciones por sí solo: los checkboxes
 * del registro son los que recogen el consentimiento expreso.
 */
@Component({
  selector: 'app-terminos-modal',
  templateUrl: './terminos-modal.component.html',
  styleUrls: ['./terminos-modal.component.scss'],
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter],
})
export class TerminosModalComponent {
  @Input() abierto = false;

  @Output() cerrado = new EventEmitter<void>();

  readonly version = TERMINOS_VERSION;
  readonly fecha = TERMINOS_FECHA_TEXTO;
  readonly responsable = RESPONSABLE_DATOS;

  constructor() {
    addIcons({ close, shieldCheckmarkOutline });
  }

  cerrar(): void {
    this.cerrado.emit();
  }
}
