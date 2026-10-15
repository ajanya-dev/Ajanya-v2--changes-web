import { AbstractControl } from '@angular/forms';

/**
 * True only when a payee is selected and the email seeded from their record
 * has a value that fails the check (malformed, or the account holder's own
 * address). An empty email is not this case: with no payee the page points at
 * the payee field, and with a payee the missing-details prompt asks for it.
 */
export function storedPayeeEmailFailsCheck(
  email: AbstractControl,
  payeeSelected: boolean
): boolean {
  const value = typeof email.value === 'string' ? email.value.trim() : '';
  return payeeSelected && !!value && email.invalid;
}
