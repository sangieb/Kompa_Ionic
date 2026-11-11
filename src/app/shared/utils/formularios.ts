import type { FormGroup } from '@angular/forms';

/** Un mensaje de validación asociado a un error concreto de un control. */
export interface ReglaMensaje {
  /** Nombre del control; '' para errores del formulario completo. */
  control: string;
  /** Clave del error (la que devuelve hasError). */
  error: string;
  /** Mensaje que se muestra al usuario. */
  mensaje: string;
}

/**
 * Devuelve el primer mensaje de error según el orden de la tabla (el mismo
 * orden en el que la app valida los campos), o null si el formulario es
 * válido.
 */
export function primerMensajeError(form: FormGroup, reglas: readonly ReglaMensaje[]): string | null {
  for (const regla of reglas) {
    const objetivo = regla.control ? form.get(regla.control) : form;
    if (objetivo?.hasError(regla.error)) return regla.mensaje;
  }
  return null;
}
