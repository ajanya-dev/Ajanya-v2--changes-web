import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExternalBankComponent } from '../external-bank/external-bank.component';
import { PayeeBankVerificationComponent } from '../payee-bank-verification/payee-bank-verification.component';

/**
 * Serves the `/outside/external-bank-form` route. When the redirect carries
 * `?payeeVerification=true` it renders the payee bank-account verification flow,
 * otherwise it falls back to the existing external-bank form unchanged.
 */
@Component({
  selector: 'app-external-bank-form-wrapper',
  standalone: true,
  imports: [ExternalBankComponent, PayeeBankVerificationComponent],
  template: `
    @if (isPayeeVerification()) {
      <app-payee-bank-verification />
    } @else {
      <app-external-bank />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalBankFormWrapperComponent implements OnInit {
  private route = inject(ActivatedRoute);
  isPayeeVerification = signal(false);

  ngOnInit(): void {
    this.isPayeeVerification.set(
      this.route.snapshot.queryParamMap.get('payeeVerification') === 'true'
    );
  }
}
