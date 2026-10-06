import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PaymentData } from 'src/app/modules/payments/shared/components/payments-main-v35/payments-data-v35';
import {
  IAcc,
  IDefaultPayment,
  IPayAsItem,
  IPayFromItem
} from 'src/app/modules/payments/model/payments';
import { IPayFromSource } from 'src/app/shared/components/v4/dropdowns/pay-from-dropdown-v4/pay-from-dropdown-v4.component';
import { IPaymentMethodOption } from 'src/app/shared/components/v4/dropdowns/payment-method-dropdown-v4/payment-method-dropdown-v4.component';
import { SendStateService } from './send-state.service';
import { SendHydrationService } from './send-hydration.service';
import { DefaultPaymentCacheService } from './default-payment-cache.service';

/**
 * Sets the current send-form selection as the user's default payment when a star
 * is clicked in the pay-from / payment-method dropdowns. Optimistic: the default
 * signal moves immediately and the API call runs in the background (rolled back on failure).
 */
/** What a star click overrides on the live selection when saving the default. */
interface IDefaultOverride {
  sourceId?: string;
  methodId?: string;
  account?: IAcc;
}

@Injectable()
export class DefaultPaymentQuickSetService {
  private state = inject(SendStateService);
  private hydration = inject(SendHydrationService);
  private cache = inject(DefaultPaymentCacheService);
  private payments = inject(PaymentsService);
  private alert = inject(V4AlertService);

  readonly saving = signal(false);

  setSourceAsDefault(source: IPayFromSource): void {
    this.save({ sourceId: source.id });
  }

  setMethodAsDefault(method: IPaymentMethodOption): void {
    this.save({ methodId: method.id });
  }

  setAccountAsDefault(
    account: IBankDropdown | IExistingCreditCards | IWalletData
  ): void {
    const current = this.hydration.defaultPayment();
    // Clicking the star on the account that is already the default removes it,
    // keeping the default source and method.
    if (
      current?.paymentAc &&
      current.payFrom?.id === this.state.sourceId() &&
      this.accountId(current.paymentAc) === this.accountId(account as IAcc)
    ) {
      this.save({}, { ...current, paymentAc: undefined });
      return;
    }
    this.save({ account: account as IAcc });
  }

  private save(
    override: IDefaultOverride = {},
    next: IDefaultPayment = this.buildDefault(override)
  ): void {
    if (!this.passesAchGuard(next.paymentAc)) {
      return;
    }

 
    const previous = this.hydration.defaultPayment();
    if (this.isSameDefault(previous, next)) {
      return;
    }

    this.hydration.defaultPayment.set(next);
    this.cache.set(next);
    this.saving.set(true);

    this.payments
      .setDefaultPayment({ defaultPayment: next })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            this.rollback(previous);
          }
        },
        error: () => this.rollback(previous)
      });
  }

  /**
   * Whether the star would save what is already saved. Compared on the three ids
   * the payload is made of rather than the objects, which arrive from different
   * lists and are never the same instance.
   */
  private isSameDefault(
    previous: IDefaultPayment | undefined | null,
    next: IDefaultPayment
  ): boolean {
    if (!previous) {
      return false;
    }
    const key = (value: IDefaultPayment): string =>
      [
        value.payFrom?.id ?? '',
        value.payAs?.id ?? '',
        this.accountId(value.paymentAc)
      ].join('|');

    return key(previous) === key(next);
  }

  /** Each source names its account differently; any of them identifies the row. */
  private accountId(account: IAcc | undefined): string {
    const acc = account as
      | { id?: string; cardId?: string; uuId?: string }
      | undefined;
    return String(acc?.id ?? acc?.cardId ?? acc?.uuId ?? '');
  }

  /**
   * Build the API payload from the live form selection, with the starred item
   * overriding it. Starring is not choosing: the reference sets the default and
   * leaves both the selection and the open list alone.
   */
  private buildDefault(override: IDefaultOverride = {}): IDefaultPayment {
    const sourceId = override.sourceId ?? this.state.sourceId();
    const methodId = override.methodId ?? this.state.payAsId();
    const items = PaymentData.getPayFromItems();
    const payFrom: IPayFromItem | undefined = items.find((i) => i.id === sourceId);
    // Starring a source the current method does not belong to would otherwise
    // save a default with no method at all.
    const payAs: IPayAsItem | undefined =
      payFrom?.payOptions?.find((o) => o.id === methodId) ??
      payFrom?.payOptions?.[0];

    return {
      payFrom,
      payAs,
      paymentAc: override.account ?? this.currentAccount(),
      memo: this.hydration.defaultPayment()?.memo ?? ''
    };
  }

  private currentAccount(): IAcc | undefined {
    const c = this.state.coreForm.getRawValue();
    switch (this.state.sourceId()) {
      case 'wallet':
        return (c.wallet as IAcc) ?? undefined;
      case 'bankaccount':
        return (c.bankAc as IAcc) ?? undefined;
      case 'card':
        return (c.card as IAcc) ?? undefined;
      default:
        return undefined;
    }
  }

  /** Parity with the default-payment modal: a non-Zil, ACH-unapproved bank cannot be the default for ACH/Wire. */
  private passesAchGuard(account: IAcc | undefined): boolean {
    const bank = account as IBankDropdown | undefined;
    const methodId = this.state.payAsId();
    const blocked =
      !!bank &&
      this.state.sourceId() === 'bankaccount' &&
      (methodId === 'ach' || methodId === 'wire') &&
      !bank.isItZil &&
      bank.achApplicationStatus !== 1;

    if (blocked) {
      this.alert.warningAlert({
        content:
          'This bank account is not approved for ACH. Please select an ACH approved bank account.'
      });
      return false;
    }
    return true;
  }

  private rollback(previous: IDefaultPayment | null): void {
    this.hydration.defaultPayment.set(previous);
    this.cache.set(previous);
    this.alert.warningAlert({
      content: 'Could not update the default payment. Please try again.'
    });
  }
}
