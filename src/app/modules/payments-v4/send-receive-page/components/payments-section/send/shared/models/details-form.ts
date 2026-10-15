import { DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormControl } from '@angular/forms';

import type { ICategoryDropdown } from 'src/app/modules/category/model/category';
import type { SendStateService } from '../services/send-state.service';

/** The Additional Details fields every source form renders the same way. */

export const INVOICE_TOOLTIP =
  "The invoice this payment settles — handy for your records.";

/**
 * The same guidance for a rail that insists on one. A card payment carries
 * `Validators.required` on this field, so offering to leave it blank told the
 * user to do the one thing the form will refuse.
 */
export const INVOICE_TOOLTIP_REQUIRED =
  '• Enter number from your bill/invoice. \n• Helps track your payment later.';

/**
 * Two-way binding between a source form's category control and the page-wide
 * `payeeCategory` signal.
 *
 * The signal → control direction seeds the payee's default category, and "no
 * category" has to clear the field or the previous payee's category stays on this
 * payment. The control → signal direction is what keeps that seeding from undoing
 * the user's own pick: these components are re-created on every source switch, and
 * the effect re-runs on each one.
 *
 * Must be called from an injection context (a component constructor).
 */
export function syncCategoryWithPayee(
  control: FormControl<ICategoryDropdown | null>,
  state: SendStateService,
  destroyRef: DestroyRef
): void {
  effect(
    () => {
      control.setValue(state.payeeCategory(), { emitEvent: false });
    },
    { allowSignalWrites: true }
  );

  control.valueChanges
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((category) => {
      const picked = category ?? null;
      if (picked?.id !== state.payeeCategory()?.id) {
        state.payeeCategory.set(picked);
      }
    });
}
