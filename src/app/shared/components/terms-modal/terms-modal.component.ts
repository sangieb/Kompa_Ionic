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

import { DATA_CONTROLLER, TERMS_DATE_TEXT, TERMS_VERSION } from '../../../core/privacy/terms';

/**
 * Informational modal with Terms and Conditions and Data Authorization.
 */
@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms-modal.component.html',
  styleUrls: ['./terms-modal.component.scss'],
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter],
})
export class TermsModalComponent {
  @Input() isOpen = false;

  @Input() set abierto(v: boolean) {
    this.isOpen = v;
  }
  get abierto(): boolean {
    return this.isOpen;
  }

  @Output() dismiss = new EventEmitter<void>();
  @Output() cerrado = this.dismiss;

  readonly version = TERMS_VERSION;
  readonly date = TERMS_DATE_TEXT;
  readonly fecha = TERMS_DATE_TEXT;
  readonly controller = DATA_CONTROLLER;
  readonly responsable = DATA_CONTROLLER;

  constructor() {
    addIcons({ close, shieldCheckmarkOutline });
  }

  closeModal(): void {
    this.dismiss.emit();
  }

  cerrar(): void {
    this.closeModal();
  }
}
