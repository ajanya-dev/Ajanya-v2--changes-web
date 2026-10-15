import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

import type { IBankDropdown } from 'src/app/models/bank';
import type { IBillBulkPaymentData } from 'src/app/modules/bill/model/Bill';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

import type {
  IDefaultPayment,
  IPaymentDetails
} from 'src/app/modules/payments/model/payments';
import type {
  ISendPageConfig,
  SendMode
} from '../../../../../services/send-receive-page.service';
import { BankCheckService } from '../../bank/services/bank-check.service';
import { DefaultPaymentCacheService } from './default-payment-cache.service';
import { PaymentActivityService } from './payment-activity.service';
import { PaymentFeeService } from './payment-fee.service';
import { SendSourceRegistryService } from './send-source-registry.service';
import { SendStateService } from './send-state.service';
import { SharedDetailsSyncService } from './shared-details-sync.service';

/** `ICheckDetailsData.status` — queued to go out on its schedule date. */
const CHECK_SCHEDULED = 50;

/**
 * Accounting apps whose bills are paid from an account they must know about too.
 * Key is the bill's `providerType`.
 */
const THIRD_PARTY_PROVIDER_CODE: Record<number, string | undefined> = {
  2: 'xero',
  3: 'zoho_books',
  5: 'sage_business'
};


@Injectable()
export class SendHydrationService {
  private payments = inject(PaymentsService);
  private bills = inject(BillService);
  private payeeService = inject(PayeeService);
  private bankAccounts = inject(BankAccountsService);
  private invoices = inject(InvoiceService);
  private shared = inject(SharedService);
  private alert = inject(V4AlertService);
  private state = inject(SendStateService);
  private sources = inject(SendSourceRegistryService);
  private bankCheck = inject(BankCheckService);
  private activity = inject(PaymentActivityService);
  private fees = inject(PaymentFeeService);
  private sync = inject(SharedDetailsSyncService);
  private cache = inject(DefaultPaymentCacheService);
  private destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly billLocked = signal(false);

  /** The bill being paid, held until a source exists to apply it to. */
  private readonly pendingBill = signal<IBillBulkPaymentData | null>(null);

  /** Which accounting app the bill came from, if any (`checkBillBankMapped`). */
  private billProviderType = 0;

  private billIds: string[] = [];
  
  payWithVendorCredit = signal(false);
  readonly defaultPayment = signal<IDefaultPayment | null>(null);

  constructor() {
    // eslint-disable-next-line no-restricted-globals
    this.payWithVendorCredit.set(history.state.payWithVendorCredit);
    this.applyBillWhenSourceExists();
  }

  private applyBillWhenSourceExists(): void {
    effect(
      () => {
        const bill = this.pendingBill();
        const source = this.state.sourceId();
        if (!bill || !source) {
          return;
        }
        untracked(() => this.sources.active().patchDetailsFromBill?.(bill));
      },
      // The card's patch re-points its Purpose dropdown, which is a signal.
      { allowSignalWrites: true }
    );
  }

  hydrate(config: ISendPageConfig): void {
    this.state.mode.set(config.mode);
    this.state.paymentId.set(config.id);
    this.billIds = config.billIds ?? [];

    this.lockScheduledCheck(config.checkStatus);

    if (config.mode !== 'CREATE' && config.id) {
      this.loadPayment(config.id, config.mode);
      return;
    }

    this.preselectPayee(config.payeeId);
    this.preselectSource(config);
    this.applyInitiateForm();

    if (config.billIds?.length) {
      this.loadBill(config.billIds);
    }
  }

  /**
   * A queued check was built from the account it names, so that account cannot be
   * changed under it 
   */
  private lockScheduledCheck(checkStatus: number | undefined): void {
    if (checkStatus !== CHECK_SCHEDULED) {
      return;
    }
    this.bankCheck.isScheduled.set(true);
    this.state.coreForm.controls.bankAc.disable({ emitEvent: false });
  }

  /** `?payee_id` names the payee to pay; the dropdown resolves the id. */
  private preselectPayee(payeeId: string | undefined): void {
    if (payeeId) {
      this.state.preferredPayeeId.set(payeeId);
    }
  }

  /**
   * A bill says what is owed and to whom, never what it is paid *from*, so the
   * default payment still picks the source 
   */
  private preselectSource(config: ISendPageConfig): void {    
    if (
      config.sourceId &&
      this.state.selectSourceById(config.sourceId, config.methodId)
    ) {
      return;
    }
    this.loadDefaultPayment();
  }

  /**
   * A "Send" button on a bank / wallet / card / payee page stashes the chosen item on
   * PaymentsService.initiatePaymentForm and routes here. Consumed once and cleared so it cannot leak into the next payment.
   */
  private applyInitiateForm(): void {
    const form = this.payments.initiatePaymentForm;
    if (!form || !Object.keys(form).length) {
      return;
    }
    
    if (form.bankAc?.id) {
      this.state.coreForm.controls.bankAc.setValue(form.bankAc);
    } else if (form.wallet?.id) {
      this.state.coreForm.controls.wallet.setValue(form.wallet);
    } else if (form.card?.cardId) {
      this.state.coreForm.controls.card.setValue(form.card);
    } else if( form?.amount){
      this.state.coreForm.controls.amount.setValue(form?.amount);
    }

    // Payee is source-agnostic; setting it drives loadPayee via watchPayee.
    const payeeId = form.payee?.encrypted_id ?? form.payee?.encryptedId;
    if (payeeId) {
      this.preselectPayee(payeeId);
    }

    this.payments.initiatePaymentForm = {};
  }

  // ---------------------------------------------------------------------------
  // Edit / clone
  // ---------------------------------------------------------------------------

  private loadPayment(id: string, mode: Exclude<SendMode, 'CREATE'>): void {
    this.loading.set(true);
    this.payments
      .getPaymentDetails(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.applyLoadedPayment(res.data, mode);
        }
      });
  }

  private applyLoadedPayment(
    details: IPaymentDetails,
    mode: Exclude<SendMode, 'CREATE'>
  ): void {
    // Core first: it decides the source, and so which service `active()` is.
    this.state.patchCoreFromPayment(details, mode);
    this.sources.active().patchDetailsFromPayment?.(details);
    this.activity.loadForPayment(details);
    this.fees.recompute();
  }

  loadDefaultPayment(): void {
    // Skeleton only when there is nothing cached to show.
    if (!this.cache.hasFresh()) {
      this.loading.set(true);
    }
    this.cache
      .get()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((method) => this.applyDefaultPayment(method));
  }

  /** Force a fresh fetch after the Set-Default modal changed the stored default. */
  reloadDefaultPayment(): void {
    this.cache.invalidate();
    this.loadDefaultPayment();
  }

  private applyDefaultPayment(method: IDefaultPayment | null): void {
    this.defaultPayment.set(method);
    if (!method?.payFrom?.id) {
      return;
    }
    this.state.selectSourceById(method.payFrom.id, method.payAs?.id);
    this.payments.initiatePaymentForm = {
      wallet: method.payFrom.id === 'wallet' ? method.paymentAc : undefined,
      bankAc: method.payFrom.id === 'bankaccount' ? method.paymentAc : undefined,
      card: method.payFrom.id === 'card' ? method.paymentAc : undefined,
    };
    this.applyInitiateForm();

    // The default payment may carry a memo; seed it into the Additional
    // Details memo field across every source, as the payee fields are seeded.
    if (method.memo) {
      this.sync.seedMemo(method.memo);
    }
  }

  // ---------------------------------------------------------------------------
  // Bill
  // ---------------------------------------------------------------------------
  private loadBill(billIds: string[]): void {
    this.bills.billId.set(billIds);
    this.billLocked.set(true);

    this.bills
      .getBillBulkPaymentData(billIds)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const bill = res?.data;
        if (!bill) {
          this.billLocked.set(false);
          return;
        }
        this.applyBill(bill, billIds[0]);
      });
  }

  private applyBill(bill: IBillBulkPaymentData, billId: string): void {
    // Read before the bank is selected: selecting it is what asks the accounting
    // app whether the account is mapped over there
    this.billProviderType = bill.providerType ?? 0;
    let {totalAmount} = bill;

    if(this.payWithVendorCredit() && bill.isVendorCreditAvailable === 1) {
      totalAmount = bill.amountAfterCreditApplied;
    }
    this.state.coreForm.controls.amount.setValue(String(totalAmount ?? ''));
    this.fees.recompute();

    this.selectBillPayee(bill.payee?.payeeId, bill.payee?.payeeName);
    this.selectBillBank(
      bill.bankAccount?.bankAccountId,
      bill.bankAccount?.bankAccountNickName
    );
    this.activity.loadForBill(billId);

    // The bill already carries these; without them the toolbar comes up empty and
    // the category the bill was coded to is lost .
    this.activity.setCommentCountFromBill(bill.comment_count ?? 0);
    this.state.preferredCategoryId.set(bill.category_id || undefined);

    // Not applied here: the active source is still being decided (default-payment
    // call in flight). The effect above applies the bill to whichever source wins.
    this.pendingBill.set(bill);
  }

  private selectBillPayee(payeeId?: string, payeeName?: string): void {
    if (!payeeId || !payeeName) {
      return;
    }

    this.payeeService
      .getPayees(1, payeeName)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const payee = res?.data?.find((p) => p.id === payeeId);
        if (payee) {
          // Setting the control is what selects the payee — the form's payee
          // watcher picks it up and fetches their banks, category and details.
          this.state.coreForm.controls.payee.setValue(payee);
        }
      });
  }

  /**
   * The bill names the account it is paid from: look it up by nickname, then
   * match it back by id.
   */
  private selectBillBank(bankId?: string, nickName?: string): void {
    if (!bankId) {
      return;
    }

    this.bankAccounts
      .getBankAccounts(1, nickName ?? '')
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const bank = res?.data?.find((b: IBankDropdown) => b.id === bankId);
        if (bank) {
          this.state.coreForm.controls.bankAc.setValue(bank);
        }
      });
  }

  /**
   * A bill from Xero, Zoho Books or Sage is paid from an account the accounting app
   * must know about; a 600 says it does not, and declining puts the account back.
   * Check rail only
   */
  checkBillBankMapped(): void {
    const provider = THIRD_PARTY_PROVIDER_CODE[this.billProviderType];
    const bank = this.state.coreForm.controls.bankAc.value;
    const billId = this.billIds[0];

    if (!provider || !bank || !billId || !this.sources.isBankCheck()) {
      return;
    }

    this.askBillBankMapped(bank.id, billId, provider);
  }

  private askBillBankMapped(
    bankId: string,
    billId: string,
    provider: string
  ): void {
    this.invoices
      .Bankchecking(bankId, billId, 'bill', provider)
      .pipe(
        catchError((error: { error?: { errorCode?: number; errorMsg?: string } }) => {
          if (error?.error?.errorCode === 600) {
            this.confirmUnmappedBillBank(error.error.errorMsg);
          }
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private confirmUnmappedBillBank(message: string | undefined): void {
    this.alert
      .confirmAlert({ content: message })
      .afterClosed()
      .subscribe((proceed?: boolean) => {
        if (!proceed) {
          this.state.coreForm.controls.bankAc.reset();
          this.shared.setNewBankCreatedData('');
          this.bankCheck.detailsForm.controls.checkNumber.reset();
        }
      });
  }
}
