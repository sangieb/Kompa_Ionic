import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close, locationOutline, warningOutline } from 'ionicons/icons';

/**
 * Non-blocking banner explaining permission status and offering actions.
 */
@Component({
  selector: 'app-permission-notice',
  templateUrl: './permission-notice.component.html',
  styleUrls: ['./permission-notice.component.scss'],
  imports: [IonButton, IonIcon, IonSpinner],
})
export class PermissionNoticeComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() icon = 'location-outline';
  @Input() actionText = '';
  @Input() secondaryActionText = '';
  @Input() compact = false;
  @Input() loading = false;

  @Input() set titulo(v: string) {
    this.title = v;
  }
  get titulo(): string {
    return this.title;
  }

  @Input() set mensaje(v: string) {
    this.message = v;
  }
  get mensaje(): string {
    return this.message;
  }

  @Input() set icono(v: string) {
    this.icon = v;
  }
  get icono(): string {
    return this.icon;
  }

  @Input() set accionTexto(v: string) {
    this.actionText = v;
  }
  get accionTexto(): string {
    return this.actionText;
  }

  @Input() set accionSecundariaTexto(v: string) {
    this.secondaryActionText = v;
  }
  get accionSecundariaTexto(): string {
    return this.secondaryActionText;
  }

  @Input() set compacto(v: boolean) {
    this.compact = v;
  }
  get compacto(): boolean {
    return this.compact;
  }

  @Input() set cargando(v: boolean) {
    this.loading = v;
  }
  get cargando(): boolean {
    return this.loading;
  }

  @Output() action = new EventEmitter<void>();
  @Output() secondary = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  // Compatibility outputs
  @Output() accion = this.action;
  @Output() secundaria = this.secondary;
  @Output() cerrar = this.dismissed;

  constructor() {
    addIcons({ locationOutline, warningOutline, close });
  }
}
