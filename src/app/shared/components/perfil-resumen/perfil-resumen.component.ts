import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonChip, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';

import type { Perfil } from '../../../core/perfil/perfil.model';
import { edadDesdeFechaTexto } from '../../utils/fechas';

/**
 * Muestra el resumen de un perfil (foto, datos y chips). Lo usan la vista
 * previa del registro y la página de perfil.
 *
 * Con `editable` el avatar se vuelve un botón que avisa al consumidor (página
 * de perfil) que debe mostrar el selector de foto; la captura sigue en el
 * consumidor, porque el selector necesita un punto de integración.
 */
@Component({
  selector: 'app-perfil-resumen',
  templateUrl: './perfil-resumen.component.html',
  styleUrls: ['./perfil-resumen.component.scss'],
  imports: [IonChip, IonIcon],
})
export class PerfilResumenComponent {
  @Input({ required: true }) perfil!: Perfil;
  /** Si es true, el avatar se muestra como botón para cambiar la foto. */
  @Input() editable = false;

  @Output() editarFoto = new EventEmitter<void>();

  constructor() {
    addIcons({ camera });
  }

  /** "31/05/2000 (25 años)" o solo la fecha si no se puede calcular la edad. */
  get nacimiento(): string {
    const edad = edadDesdeFechaTexto(this.perfil.fechaNacimiento);
    return edad !== null ? `${this.perfil.fechaNacimiento} (${edad} años)` : this.perfil.fechaNacimiento;
  }

  get conectar(): string {
    return this.perfil.conectar.join(', ');
  }
}
