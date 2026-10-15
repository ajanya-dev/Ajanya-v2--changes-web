import { FormControl, Validators } from '@angular/forms';
import { storedPayeeEmailFailsCheck } from './payee-email-check';

describe('storedPayeeEmailFailsCheck', () => {
  const required = [Validators.required, Validators.email];

  it('is false with no payee selected, even though the required email is empty', () => {
    const email = new FormControl('', required);

    expect(storedPayeeEmailFailsCheck(email, false)).toBeFalse();
  });

  it('is false when a payee is selected but the email is simply missing', () => {
    const email = new FormControl('', required);

    expect(storedPayeeEmailFailsCheck(email, true)).toBeFalse();
  });

  it('is true when the selected payee has an email that fails the check', () => {
    const email = new FormControl('not-an-email', required);

    expect(storedPayeeEmailFailsCheck(email, true)).toBeTrue();
  });

  it('is false when the selected payee has a valid email', () => {
    const email = new FormControl('payee@example.com', required);

    expect(storedPayeeEmailFailsCheck(email, true)).toBeFalse();
  });
});
