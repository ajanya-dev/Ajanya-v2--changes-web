import type { FormControl } from '@angular/forms';

/**
 * The ACH recurring schedule, shared by the bank and wallet rails: both submit the
 * same `recurring` payload and render the same three controls for it.
 */

/** `recurring.end_select` — the payment stops after `count` runs. */
export const END_AFTER_COUNT = '1';

/** `recurring.end_select` — the payment repeats until the user cancels it. */
export const END_UNTIL_CANCELLED = '3';

/** `recurring.frequency` codes. */
export const RECURRING_FREQUENCIES = [
  { value: '3', label: 'Monthly' },
  { value: '6', label: 'Bimonthly' },
  { value: '7', label: 'Quarterly' },
  { value: '5', label: 'Biweekly' },
  { value: '2', label: 'Weekly' },
  { value: '1', label: 'Daily' }
];

/** The two `end_select` choices, as the cards render them. Default first. */
export const RECURRING_END_OPTIONS = [
  {
    id: END_UNTIL_CANCELLED,
    name: 'Until I cancel',
    hint: 'Runs until you stop it'
  },
  {
    id: END_AFTER_COUNT,
    name: 'A set number of payments',
    hint: 'Stops automatically'
  }
];

/**
 * The same two, as the modal takes them. Staging's ACH recurring modal
 * (shared/modal/process-modal/recurring-modal) offers a frequency, a start date
 * and these two ends only — there is no end-date option and no one-time
 * schedule, so neither is offered here.
 */
export const RECURRING_END_IDS: readonly string[] = RECURRING_END_OPTIONS.map(
  (option) => option.id
);

/** `recurring.count` is a positive whole number of runs. */
export const MIN_RECURRING_COUNT = 1;
export const MAX_RECURRING_COUNT = 99999;

/** The recurrence must start no earlier than tomorrow. */
export function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The − / + buttons either side of the payment count. */
export function stepRecurringCount(
  control: FormControl<number | null>,
  delta: number
): void {
  const next = (control.value ?? MIN_RECURRING_COUNT) + delta;

  if (next < MIN_RECURRING_COUNT || next > MAX_RECURRING_COUNT) {
    return;
  }
  control.setValue(next);
}

/** Clamp a manually typed count to whole numbers within the allowed range. */
export function normalizeRecurringCount(
  control: FormControl<number | null>
): void {
  const value = Math.floor(Number(control.value));

  if (!Number.isFinite(value) || value < MIN_RECURRING_COUNT) {
    control.setValue(MIN_RECURRING_COUNT);
    return;
  }
  control.setValue(Math.min(value, MAX_RECURRING_COUNT));
}
