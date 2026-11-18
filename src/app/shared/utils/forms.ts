import type { FormGroup } from '@angular/forms';

/** Validation error rule associated with a specific control error. */
export interface MessageRule {
  /** Control name; empty string for form-level errors. */
  control: string;
  /** Error key returned by hasError(). */
  error: string;
  /** Message displayed to the user. */
  message: string;
  mensaje?: string;
}

export type ReglaMensaje = MessageRule;

/**
 * Returns the first error message matching rule order, or null if form is valid.
 */
export function firstErrorMessage(form: FormGroup, rules: readonly MessageRule[]): string | null {
  for (const rule of rules) {
    const target = rule.control ? form.get(rule.control) : form;
    if (target?.hasError(rule.error)) return rule.message ?? rule.mensaje ?? null;
  }
  return null;
}
