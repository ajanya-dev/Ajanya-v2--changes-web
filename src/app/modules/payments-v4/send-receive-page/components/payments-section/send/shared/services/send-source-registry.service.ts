import { Injectable, computed, inject } from '@angular/core';

import { BankCheckService } from '../../bank/services/bank-check.service';
import { BankPaymentService } from '../../bank/services/bank-payment.service';
import { CardPaymentService } from '../../card/services/card-payment.service';
import { WalletPaymentService } from '../../wallet/services/wallet-payment.service';
import { ISendSourceService } from '../models/send-source.model';
import { SendStateService } from './send-state.service';

/**
 * Resolves which pay-from source service is in charge, so the page can call the
 * `ISendSourceService` contract without knowing which source it is on.
 */
@Injectable()
export class SendSourceRegistryService {
  private state = inject(SendStateService);
  private wallet = inject(WalletPaymentService);
  private card = inject(CardPaymentService);
  private bank = inject(BankPaymentService);
  private bankCheck = inject(BankCheckService);

  /** A check drawn on a bank account: its own fields, and its own rail. */
  readonly isBankCheck = computed(
    () => this.state.sourceId() === 'bankaccount' && this.state.isCheckSelected()
  );

  /** Only the wallet, card and bank rails exist here. */
  readonly isSupportedSource = computed(() =>
    ['wallet', 'card', 'bankaccount'].includes(this.state.sourceId() ?? '')
  );

  /**
   * The service for the source the user picked. A bank check is a check record, not
   * a zil-payment — different endpoints, so a service of its own.
   */
  readonly active = computed<ISendSourceService>(() => {
    switch (this.state.sourceId()) {
      case 'card':
        return this.card;
      case 'bankaccount':
        return this.isBankCheck() ? this.bankCheck : this.bank;
      default:
        return this.wallet;
    }
  });
}
