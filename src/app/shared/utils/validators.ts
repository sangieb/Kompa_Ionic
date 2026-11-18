import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { ageFromIso } from './dates';
import { isValidEmail } from './validations';

/** Required field validator that rejects whitespace-only inputs. */
export function requiredWithContent(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim().length === 0 ? { required: true, requerido: true } : null;
}

/** Minimum length validator after trimming whitespace. */
export function minLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = String(control.value ?? '').trim();
    return text.length < min
      ? { minLength: { min, actual: text.length }, longitudMinima: { min, actual: text.length } }
      : null;
  };
}

/** Checkbox mandatory validator: unchecked counts as empty. */
export function requiredAccepted(control: AbstractControl): ValidationErrors | null {
  return control.value === true ? null : { required: true, requerido: true };
}

/** Valid email format validator. */
export function validEmail(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return isValidEmail(value) ? null : { email: true, correo: true };
}

/** Age validation ensuring user is at least 18 years old. */
export function legalAge(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null;
  return (ageFromIso(value) ?? 0) < 18 ? { legalAge: true, mayorDeEdad: true } : null;
}

/** Positive integer validator. */
export function positiveInteger(control: AbstractControl): ValidationErrors | null {
  const num = Number(String(control.value ?? '').trim());
  return !Number.isInteger(num) || num <= 0 ? { positiveInteger: true, enteroPositivo: true } : null;
}

/** Future datetime validator ("yyyy-MM-ddTHH:mm"). */
export function futureDate(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) || time <= Date.now() ? { futureDate: true, fechaFutura: true } : null;
}
