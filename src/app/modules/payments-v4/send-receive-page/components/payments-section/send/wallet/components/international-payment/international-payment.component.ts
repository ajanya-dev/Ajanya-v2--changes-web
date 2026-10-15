import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewChild,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Building2,
  CircleAlert,
  Globe,
  Info,
  Search,
  User
} from 'lucide-angular';

import { V4TransactionLimitCardComponent } from 'src/app/modules/payments-v4/shared/components/v4-transaction-limit-card/v4-transaction-limit-card.component';

import { SendStateService } from '../../../shared/services/send-state.service';
import { WalletPaymentService } from '../../services/wallet-payment.service';
import {
  InternationalPaymentUiService,
  type ICountryOption,
  type RecipientType
} from '../../services/international-payment-ui.service';

/**
 * The "International recipient" card that renders under the memo: recipient type,
 * destination currency, personal limits and the transaction-limit card. The bank
 * account, purpose and source fields render in Additional Details, from the same
 * `InternationalPaymentUiService`.
 */
@Component({
  selector: 'app-international-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    V4TransactionLimitCardComponent
  ],
  templateUrl: './international-payment.component.html',
  styleUrl: './international-payment.component.scss'
})
export class InternationalPaymentComponent implements AfterViewInit, OnDestroy {
  readonly sendStateService = inject(SendStateService);
  readonly walletPaymentService = inject(WalletPaymentService);
  readonly intl = inject(InternationalPaymentUiService);

  @ViewChild('limitCard') limitCard?: V4TransactionLimitCardComponent;

  readonly form = this.walletPaymentService.detailsForm;

  /**
   * One line under the recipient block: a failed quote, or the "no rate yet"
   * message a refused Confirm leaves until a quote arrives.
   */
  readonly rateMessage = computed(
    () =>
      this.intl.quoteError() ??
      (this.walletPaymentService.quote()
        ? null
        : this.walletPaymentService.quoteSubmitError())
  );

  readonly InfoIcon = Info;
  readonly GlobeIcon = Globe;
  readonly Building2Icon = Building2;
  readonly UserIcon = User;
  readonly SearchIcon = Search;
  readonly CircleAlertIcon = CircleAlert;

  constructor() {
    this.intl.activate();
  }

  ngAfterViewInit(): void {
    this.walletPaymentService.limitGate.set(this.limitCard ?? null);
    this.intl.limitCardOps.set(this.limitCard ?? null);
  }

  ngOnDestroy(): void {
    this.intl.deactivate();
  }

  setRecipientType(type: RecipientType): void {
    this.intl.setRecipientType(type);
  }

  selectCountry(country: ICountryOption): void {
    this.intl.selectCountry(country);
  }
}
