import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close, locationOutline, warningOutline } from 'ionicons/icons';

/**
 * Tarjeta no bloqueante para explicar el estado de un permiso y ofrecer
 * acciones. La usa el home (flotando sobre el mapa) y nueva actividad.
 */
@Component({
  selector: 'app-aviso-permiso',
  templateUrl: './aviso-permiso.component.html',
  styleUrls: ['./aviso-permiso.component.scss'],
  imports: [IonButton, IonIcon, IonSpinner],
})
export class AvisoPermisoComponent {
  @Input() titulo = '';
  @Input() mensaje = '';
  @Input() icono = 'location-outline';
  @Input() accionTexto = '';
  @Input() accionSecundariaTexto = '';
  @Input() compacto = false;
  @Input() cargando = false;

  @Output() accion = new EventEmitter<void>();
  @Output() secundaria = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  constructor() {
    addIcons({ locationOutline, warningOutline, close });
  }
}
