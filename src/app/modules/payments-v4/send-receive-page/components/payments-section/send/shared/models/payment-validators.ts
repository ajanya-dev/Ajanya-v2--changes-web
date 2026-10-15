import { FormControl, ValidatorFn, Validators } from '@angular/forms';

/**
 * ACH SMS rule: require the phone number only when ACH and the toggle is on.
 * `manageEnabled` also enables the control when on and clears + disables it when off
 * (the bank rail does this; the card rail sets validators only).
 */
export function applySmsValidators(
  toggle: FormControl<boolean | null>,
  phone: FormControl<string | null>,
  isAch: boolean,
  phoneMinLength: ValidatorFn,
  manageEnabled = false
): void {
  const on = isAch && !!toggle.value;

  phone.setValidators(on ? [Validators.required, phoneMinLength] : []);

  if (manageEnabled) {
    if (on) {
      phone.enable({ emitEvent: false });
    } else {
      phone.setValue(null, { emitEvent: false });
      phone.disable({ emitEvent: false });
    }
  }

  phone.updateValueAndValidity({ emitEvent: false });
}
