import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  output,
  signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, Info, Phone } from 'lucide-angular';
import { distinctUntilChanged, finalize } from 'rxjs/operators';

import type { IPayeeBankDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonToggleV4Component } from 'src/app/shared/V4/common-toggle-v4/common-toggle-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { SpSelectDropdownComponent } from '../../../dropdowns/sp-select-dropdown/sp-select-dropdown.component';
import { SpCategoryDropdownComponent } from '../../../dropdowns/sp-category-dropdown/sp-category-dropdown.component';
import { SpPayeeBankDropdownComponent } from '../../../dropdowns/sp-payee-bank-dropdown/sp-payee-bank-dropdown.component';

import { syncCategoryWithPayee,
  INVOICE_TOOLTIP_REQUIRED
} from '../../../shared/models/details-form';
import { selectPayeeBank, setWireAllowed } from '../../../shared/models/payee-bank';
import {
  IShippingOption,
  toShippingOptions
} from '../../../shared/models/shipping-options';
import { SendStateService } from '../../../shared/services/send-state.service';
import {
  CardPaymentService,
  CARD_MEMO_MAX,
  PURPOSE_OTHER,
  toCardMemo
} from '../../services/card-payment.service';
import { ScheduleNotifyComponent } from '../../../schedule-notify/schedule-notify.component';

/** Methods that offer the payee bank list. */
const ACH_METHODS = ['ach', 'same-ach'];

/**
 * The additional-details fields for a credit-card payment. Submit logic and
 * `detailsForm` live in CardPaymentService, beside the payload that reads them.
 */
@Component({
  selector: 'app-card-payment',
  standalone: true,
  imports: [ScheduleNotifyComponent, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    LucideAngularModule,
    MatTooltip,
    CommonInputFieldV4Component,
    CommonToggleV4Component,
    V4ControlMessageComponent,
    SpCategoryDropdownComponent,
    SpSelectDropdownComponent,
    PhoneInputV4Component,
    SpPayeeBankDropdownComponent,
    WhiteLabelPipe
  ],
  templateUrl: './card-payment.component.html'
})
export class CardPaymentComponent {
  // ── Dependency injection ─────────────────────────────────────────────────

  private readonly destroyRef = inject(DestroyRef);
  private readonly sharedService = inject(SharedService);
  private readonly paymentsService = inject(PaymentsService);

  readonly invoiceTooltip = INVOICE_TOOLTIP_REQUIRED;

  readonly sendStateService = inject(SendStateService);
  readonly cardPaymentService = inject(CardPaymentService);

  // ── Outputs ──────────────────────────────────────────────────────────────

  /** SendComponent owns the fee calculation; shipping is one of its inputs. */
  readonly shippingTypeChange = output<void>();

  // ── Signals ──────────────────────────────────────────────────────────────

  readonly shippingTypes = signal<IShippingOption[]>([]);
  readonly shippingLoading = signal(false);

  /**
   * Owned by the service: it re-selects the purpose when an edited payment's memo is
   * loaded back in, which can happen before this component has fetched the options.
   */
  readonly purposeOptions = this.cardPaymentService.purposeOptions;

  /** The memo is the purpose, unless the purpose is "Other" — then it's free text. */
  readonly memoIsFreeText = this.cardPaymentService.purposeIsOther;
  readonly memoMaxLength = CARD_MEMO_MAX;
  purposeOtherTooltip = signal(`What this payment is for. Choose "Other" to write your own memo.`);

  // ── Computed signals ─────────────────────────────────────────────────────

  readonly isWire = computed(() => this.method() === 'wire');
  readonly isCheckMail = computed(() => this.method() === 'check_mail');
  readonly isAch = computed(() => ACH_METHODS.includes(this.method() ?? ''));

  /**
   * Vendor-decide is the one card method that does not ask for the payee's own
   * account number (let-payee-choose-details html L110: `@if (!isCardSource)`).
   */
  private readonly isLetPayeeChoose = computed(
    () => this.method() === 'let-payee-choose'
  );

  readonly showsPayeeIdNumber = computed(() => !this.isLetPayeeChoose());

  /**
   * ACH and wire offer the bank list; a mailed check does not. Only wire *requires* a
   * choice — an ACH left alone goes to the payee's default direct-deposit account.
   */
  readonly needsPayeeBank = computed(() => this.isAch() || this.isWire());

  // ── Form ─────────────────────────────────────────────────────────────────

  readonly form = this.cardPaymentService.detailsForm;

  // ── Public properties ────────────────────────────────────────────────────

  readonly PhoneIcon = Phone;
  readonly InfoIcon = Info;

  // ── Private properties ───────────────────────────────────────────────────

  private readonly method = this.sendStateService.methodId;

  // ── Constructor ──────────────────────────────────────────────────────────

  constructor() {
    this.registerEffects();
    this.registerFormSubscriptions();
    this.loadPurposeOptions();
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  private registerEffects(): void {
    // Re-apply required-ness whenever the method changes.
    effect(
      () => {
        this.cardPaymentService.applyMethodValidators(this.method());
      },
      { allowSignalWrites: true }
    );

    // Prefill the SMS number only: this effect re-runs on every source switch, so the
    // shared email/id fields are seeded by SharedDetailsSyncService, not clobbered here.
    effect(
      () => {
        const payee = this.sendStateService.payeeDetails();
        if (!payee) {
          return;
        }
        this.form.controls.payeeNumber.setValue(
          payee.payee_information?.payee_phone ?? '',
          { emitEvent: false }
        );
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const bank = this.sendStateService.selectedPayeeBank();
        this.form.controls.payeeBankAc.setValue(bank, { emitEvent: false });
      },
      { allowSignalWrites: true }
    );

    // A new payee empties the account until its own list lands and re-selects
    // one. The field is required for a wire and may already have been touched,
    // so without this the refusal appeared for that gap and then vanished.
    effect(() => {
      this.sendStateService.payeeId();
      untracked(() => this.form.controls.payeeBankAc.markAsUntouched());
    });

    // A mailed check is priced per carrier, so it has to know the carriers.
    effect(
      () => {
        if (this.isCheckMail()) {
          untracked(() => this.loadShippingTypes());
        }
      },
      { allowSignalWrites: true }
    );
  }

  private registerFormSubscriptions(): void {
    this.form.controls.sendSms.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cardPaymentService.applySmsValidators());
    this.form.controls.purposeOfPayment.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((purpose) => {
        const { memo } = this.form.controls;
        memo.setValue(
          purpose && purpose !== PURPOSE_OTHER ? toCardMemo(purpose) : ''
        );
        this.cardPaymentService.applyPurposeValidators();
        memo.markAsUntouched();
      });

    // Shipping is priced per carrier, so the fee has to follow the choice.
    this.form.controls.shippingType.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.shippingTypeChange.emit());

    syncCategoryWithPayee(
      this.form.controls.category,
      this.sendStateService,
      this.destroyRef
    );
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  onBankListSelected(bank: IPayeeBankDetails | null): void {
    selectPayeeBank(this.sendStateService, bank);
  }

  /** The bank list resolved whether the selected bank can take a wire. */
  onWireAllowedChange(allowed: boolean): void {
    setWireAllowed(this.sendStateService, allowed);
  }

  // ── API methods ──────────────────────────────────────────────────────────

  private loadPurposeOptions(): void {
    this.paymentsService.getPurposeOfPayment((options) => {
      this.cardPaymentService.purposeOptions.set(options ?? []);
      this.cardPaymentService.syncPurposeFromMemo();
    });
  }

  private loadShippingTypes(): void {
    this.shippingLoading.set(true);
    this.sharedService
      .getWalletShippingTypes()
      .pipe(
        finalize(() => this.shippingLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => this.shippingTypes.set(toShippingOptions(res?.data ?? [])),
        error: () => undefined
      });
  }
}
