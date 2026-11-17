import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { edadDesdeIso } from './fechas';
import { esCorreoValido } from './validaciones';

/** Requerido que además rechaza puros espacios en blanco. */
export function requeridoConContenido(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim().length === 0 ? { requerido: true } : null;
}

/** Texto que, sin espacios de más, queda más corto que `min` caracteres. */
export function longitudMinima(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const texto = String(control.value ?? '').trim();
    return texto.length < min ? { longitudMinima: { min, actual: texto.length } } : null;
  };
}

/** Checkbox obligatorio: sin marcar cuenta como vacío. */
export function aceptadoRequerido(control: AbstractControl): ValidationErrors | null {
  return control.value === true ? null : { requerido: true };
}

/** Correo con formato válido (el vacío lo revisa requeridoConContenido). */
export function correoValido(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '').trim();
  if (!valor) return null;
  return esCorreoValido(valor) ? null : { correo: true };
}

/** Fecha "yyyy-mm-dd" de alguien menor de 18 años. */
export function mayorDeEdad(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  if (!valor) return null;
  return (edadDesdeIso(valor) ?? 0) < 18 ? { mayorDeEdad: true } : null;
}

/** Número entero mayor que cero (la cadena vacía también falla). */
export function enteroPositivo(control: AbstractControl): ValidationErrors | null {
  const numero = Number(String(control.value ?? '').trim());
  return !Number.isInteger(numero) || numero <= 0 ? { enteroPositivo: true } : null;
}

/** Fecha/hora en el futuro ("yyyy-MM-ddTHH:mm" del input datetime-local). */
export function fechaFutura(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  if (!valor) return null;
  const fecha = new Date(valor).getTime();
  return Number.isNaN(fecha) || fecha <= Date.now() ? { fechaFutura: true } : null;
}
