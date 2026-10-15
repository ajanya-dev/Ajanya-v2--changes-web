import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  LucideAngularModule,
  History,
  Info,
  MapPin,
  Minus,
  Pencil,
  Plus
} from 'lucide-angular';
import { merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

import type { IMailBulkShippingAddress } from 'src/app/modules/check/model/check';
import { AddMailAddressModalV4Component } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal-v4/add-mail-address-modal-v4.component';
import type { IPayeeBankDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonToggleV4Component } from 'src/app/shared/V4/common-toggle-v4/common-toggle-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { SpCategoryDropdownComponent } from '../../../dropdowns/sp-category-dropdown/sp-category-dropdown.component';
import { SpSelectDropdownComponent } from '../../../dropdowns/sp-select-dropdown/sp-select-dropdown.component';
import { SpPayeeBankDropdownComponent } from '../../../dropdowns/sp-payee-bank-dropdown/sp-payee-bank-dropdown.component';

import { syncCategoryWithPayee,
  INVOICE_TOOLTIP
} from '../../../shared/models/details-form';
import { selectPayeeBank, setWireAllowed } from '../../../shared/models/payee-bank';
import {
  IShippingOption,
  toShippingOptions
} from '../../../shared/models/shipping-options';
import {
  END_AFTER_COUNT,
  MIN_RECURRING_COUNT,
  RECURRING_END_IDS,
  RECURRING_FREQUENCIES,
  tomorrow
} from '../../../shared/models/recurring';
import { SendStateService } from '../../../shared/services/send-state.service';
import { WalletPaymentService } from '../../services/wallet-payment.service';
import { ScheduleNotifyComponent } from '../../../schedule-notify/schedule-notify.component';

/** A custom delivery address rules out USPS First Class. */
const CUSTOM_ADDRESS_EXCLUDED_CARRIERS = [
  'USPS_FIRST_CLASS_MAIL',
  'USPS_FIRST_CLASS_WITH_TRACKING'
];

/** The wallet's card-issuing check is debounced behind the wallet dropdown. */
const WALLET_ONBOARDING_DEBOUNCE_MS = 500;

/** Methods whose payment lands in a payee bank account. */
const PAYEE_BANK_METHODS = ['ach', 'same-ach', 'wire', 'rtp'];

/** Methods that require a memo. */
const MEMO_REQUIRED_METHODS = ['wire', 'rtp', 'let-payee-choose'];

/**
 * Lets the address endpoints answer with `permissionRequired` instead of the
 * interceptor's global error.
 */
const DISABLE_PERMISSION_HEADER = new HttpHeaders().set(
  'disablePermission',
  'true'
);

/**
 * The additional-details fields for a Wallet payment, rendered inside SendComponent.
 * WalletPaymentService owns `detailsForm` and all submit logic.
 */
@Component({
  selector: 'app-wallet-payment',
  standalone: true,
  imports: [ScheduleNotifyComponent, 
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    LucideAngularModule,
    MatTooltip,
    CommonInputFieldV4Component,
    CommonToggleV4Component,
    V4ControlMessageComponent,
    SpCategoryDropdownComponent,
    SpSelectDropdownComponent,
    V4DatePickerComponent,
    PhoneInputV4Component,
    SpPayeeBankDropdownComponent,
    FormsModule,
    MatCheckboxModule,
    WhiteLabelPipe
  ],
  templateUrl: './wallet-payment.component.html'
})
export class WalletPaymentComponent {
  // ── Dependency injection ─────────────────────────────────────────────────

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly sharedService = inject(SharedService);
  private readonly checkService = inject(CheckService);
  private readonly walletDataService = inject(WalletDataV35Service);

  readonly invoiceTooltip = INVOICE_TOOLTIP;

  readonly sendStateService = inject(SendStateService);
  readonly walletPaymentService = inject(WalletPaymentService);

  // ── Outputs ──────────────────────────────────────────────────────────────

  readonly isApprovedReadOnly = input<boolean>(false);
  readonly shippingTypeChange = output<void>();

  // ── Signals ──────────────────────────────────────────────────────────────

  private readonly shippingTypes = signal<IShippingOption[]>([]);
  readonly filteredShippingTypes = signal<IShippingOption[]>([]);
  readonly shippingLoading = signal(false);

  readonly addressFrom = signal<IMailBulkShippingAddress[]>([]);
  readonly addressTo = signal<IMailBulkShippingAddress[]>([]);
  readonly addressFromLoading = signal(false);
  readonly addressToLoading = signal(false);
  readonly addressFromDenied = signal(false);
  readonly addressToDenied = signal(false);

  // ── Computed signals ─────────────────────────────────────────────────────

  readonly isAch = computed(
    () => this.method() === 'ach' || this.method() === 'same-ach'
  );

  readonly needsPayeeBank = computed(() =>
    PAYEE_BANK_METHODS.includes(this.method() ?? '')
  );

  readonly isCheckMail = computed(() => this.method() === 'check_mail');

  private readonly isCheckPrint = computed(
    () => this.method() === 'check_print'
  );

  /** Both offer a custom delivery address; only the mailed one ships anywhere. */
  readonly usesCustomAddress = computed(
    () => this.isCheckMail() || this.isCheckPrint()
  );

  readonly isVirtualCard = computed(() => this.method() === 'virtual-card');

  /**
   * Mirrors the methods whose `payeeEmail` gets `requiredEmail` in the service:
   * `check_print` leaves it optional, the virtual card asks for an email *or* a phone.
   */
  readonly needsPayeeEmail = computed(
    () =>
      !!this.method() &&
      this.method() !== 'check_print' &&
      this.method() !== 'virtual-card'
  );

  /** Only wire, RTP and vendor-decide demand a memo. */
  readonly needsMemo = computed(() =>
    MEMO_REQUIRED_METHODS.includes(this.method() ?? '')
  );

  /** Virtual card takes a phone but no invoice, category or memo. */
  readonly showsInvoiceAndMemo = computed(() => !this.isVirtualCard());

  // ── Form ─────────────────────────────────────────────────────────────────

  readonly form = this.walletPaymentService.detailsForm;

  // ── Public properties ────────────────────────────────────────────────────

  readonly InfoIcon = Info;
  readonly HistoryIcon = History;
  readonly MapPinIcon = MapPin;
  readonly PencilIcon = Pencil;
  readonly MinusIcon = Minus;
  readonly PlusIcon = Plus;

  /** `cardLimitType` is submitted verbatim. */
  readonly cardLimitOptions = [
    { value: 'onetime', label: 'One-time' },
    { value: 'monthly', label: 'Monthly' }
  ];

  /** A recurrence cannot start before tomorrow. */
  readonly minStartDate = tomorrow();
  readonly frequencies = RECURRING_FREQUENCIES;
  readonly recurringEndOptions = RECURRING_END_IDS;

  // ── Private properties ───────────────────────────────────────────────────

  private readonly method = this.sendStateService.methodId;

  // ── Constructor ──────────────────────────────────────────────────────────

  constructor() {
    this.registerEffects();
    this.registerFormSubscriptions();
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  private registerEffects(): void {
    // Re-apply required-ness whenever the method changes.
    effect(
      () => {
        this.walletPaymentService.applyMethodValidators(this.method());
        this.syncSmsPhoneValidators();
        this.syncRecurringValidators();
      },
      { allowSignalWrites: true }
    );

    // Prefill the phones from the payee. The email and id number are seeded by
    // SharedDetailsSyncService instead — this effect re-runs on every source switch
    // and would overwrite what the user typed. Neither phone is shared.
    effect(
      () => {
        const payee = this.sendStateService.payeeDetails();
        if (!payee) {
          return;
        }
        const info = payee.payee_information;
        this.form.patchValue(
          {
            payeeNumber: info?.payee_phone ?? '',
            payeePhone: info?.payee_phone ?? ''
          },
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

    // The bank list can settle before `getPayeeDetails`, leaving a `toViewBank`
    // selection with no `is_allow_wire`. Swap in the rich object once it arrives.
    effect(
      () => {
        const banks = this.sendStateService.payeeBanks();
        const current = untracked(() =>
          this.sendStateService.selectedPayeeBank()
        );
        if (!banks.length || !current) {
          return;
        }

        const known = banks.find(
          (b) =>
            String(b.encrypted_id ?? b.id) ===
            String(current.encrypted_id ?? current.id)
        );
        if (known && known !== current) {
          this.sendStateService.selectedPayeeBank.set(known);
        }
      },
      { allowSignalWrites: true }
    );

    // Selecting the virtual card checks the account's card-program status — and the
    // wallet's own card-issuing status with it: a wallet chosen *before* the method
    // was switched never passed through the dropdown's check, so this is its only chance.
    effect(
      () => {
        if (this.isVirtualCard()) {
          untracked(() => this.walletPaymentService.checkVirtualCardGates());
        }
      },
      { allowSignalWrites: true }
    );

    // A mailed check prices its shipping types; both check methods may need the
    // address lists if the custom-address toggle is already on (edit / clone).
    effect(
      () => {
        if (this.isCheckMail()) {
          untracked(() => this.loadShippingTypes());
        }
        if (
          this.usesCustomAddress() &&
          this.form.controls.isCustomAddress.value
        ) {
          untracked(() => {
            this.loadAddressFrom();
            if (this.isCheckMail()) {
              this.loadAddressTo();
            }
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  private registerFormSubscriptions(): void {
    this.form.controls.send_sms.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncSmsPhoneValidators());

    // "Until I cancel" drops the count field, and with it the count validator.
    merge(
      this.form.controls.needAchRecurring.valueChanges,
      this.form.controls.recurringEndSelect.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncRecurringValidators());

    // Shipping is priced per carrier, so the fee has to follow the choice.
    this.form.controls.shippingType.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.shippingTypeChange.emit());

    syncCategoryWithPayee(
      this.form.controls.category,
      this.sendStateService,
      this.destroyRef
    );

    // Each wallet is checked for card issuing on its own, debounced behind the
    // wallet dropdown.
    this.sendStateService.coreForm.controls.wallet.valueChanges
      .pipe(
        debounceTime(WALLET_ONBOARDING_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => {
        if (this.isVirtualCard()) {
          this.walletDataService.walletDataSignal.set(val ?? undefined);
          this.walletPaymentService.checkWalletCardOnboarding();
        }
      });
  }

  // ── Public methods ───────────────────────────────────────────────────────

  /** True while the schedule ends after a fixed number of runs. */
  readonly isFixedCount = (): boolean =>
    this.form.controls.recurringEndSelect.value === END_AFTER_COUNT;

  // ── Event handlers ───────────────────────────────────────────────────────

  onCustomAddressToggle(checked: boolean): void {
    this.form.controls.isCustomAddress.setValue(checked);
    this.walletPaymentService.applyCustomAddressValidators();
    this.filterShippingTypes();

    if (checked) {
      this.loadAddressFrom();
      if (this.isCheckMail()) {
        this.loadAddressTo();
      }
    }
  }

  /** Add or edit an address, then reload the list and select what came back. */
  openAddressModal(type: 'mail-from' | 'mail-to', isEdit = false): void {
    const isFrom = type === 'mail-from';
    const control = isFrom
      ? this.form.controls.customShippingFrom
      : this.form.controls.customShippingTo;

    this.dialog
      .open(AddMailAddressModalV4Component, {
        maxWidth: '700px',
        width: '98%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          dataKey: type,
          isForUpdate: isEdit,
          id: control.value ?? '',
          isWalletCheckCustomAddress: true
        }
      })
      .afterClosed()
      .subscribe((data) => {
        if (!data) {
          return;
        }

        if (data.type === 'delete') {
          control.setValue(null);
        } else if (data.id) {
          control.setValue(data.id);
        }

        if (isFrom) {
          this.loadAddressFrom();
        } else {
          this.loadAddressTo();
        }
      });
  }

  onBankListSelected(bank: IPayeeBankDetails | null): void {
    selectPayeeBank(this.sendStateService, bank);
  }

  onWireAllowedChange(allowed: boolean): void {
    setWireAllowed(this.sendStateService, allowed);
  }

  selectRecurringEnd(id: string): void {
    this.form.controls.recurringEndSelect.setValue(id);
  }

  // ── API methods ──────────────────────────────────────────────────────────

  /** The wallet endpoint returns `carrier_code`, which is what we submit. */
  private loadShippingTypes(): void {
    this.shippingLoading.set(true);
    this.sharedService
      .getWalletShippingTypes()
      .pipe(
        finalize(() => this.shippingLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.shippingTypes.set(toShippingOptions(res?.data ?? []));
          this.filterShippingTypes();
        },
        error: () => undefined
      });
  }

  private loadAddressFrom(): void {
    this.addressFromLoading.set(true);
    this.checkService
      .getAddressFrom(DISABLE_PERMISSION_HEADER)
      .pipe(
        finalize(() => this.addressFromLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => this.addressFrom.set(res?.data ?? []),
        // A 403 here means "no permission", not "no addresses".
        error: (err) =>
          this.addressFromDenied.set(!!err?.error?.permissionRequired)
      });
  }

  private loadAddressTo(): void {
    this.addressToLoading.set(true);
    this.checkService
      .getAddressTo(DISABLE_PERMISSION_HEADER)
      .pipe(
        finalize(() => this.addressToLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => this.addressTo.set(res?.data ?? []),
        error: (err) =>
          this.addressToDenied.set(!!err?.error?.permissionRequired)
      });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * The phone is only required while the ACH SMS toggle is on. Switching away from
   * ACH must drop the validator, or an unmounted control keeps the form invalid.
   */
  private syncSmsPhoneValidators(): void {
    const phone = this.form.controls.payeeNumber;

    if (this.isAch() && this.form.controls.send_sms.value) {
      phone.setValidators([
        Validators.required,
        ValidationService.phoneMinLength
      ]);
    } else {
      phone.clearValidators();
    }

    phone.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Same reasoning as the phone: the schedule fields are only required while the
   * recurring card is on screen, so leaving ACH or toggling off has to clear them.
   */
  private syncRecurringValidators(): void {
    const c = this.form.controls;
    const on = this.isAch() && !!c.needAchRecurring.value;

    if (on) {
      c.recurringFrequency.setValidators(Validators.required);
      c.recurringStartDate.setValidators(Validators.required);
    } else {
      c.recurringFrequency.clearValidators();
      c.recurringStartDate.clearValidators();
    }

    if (on && this.isFixedCount()) {
      c.recurringCount.setValidators([
        Validators.required,
        Validators.min(MIN_RECURRING_COUNT)
      ]);
    } else {
      c.recurringCount.clearValidators();
    }

    [c.recurringFrequency, c.recurringStartDate, c.recurringCount].forEach(
      (ctrl) => ctrl.updateValueAndValidity({ emitEvent: false })
    );
  }

  /** A custom address drops the USPS First Class options, and any selection of one. */
  private filterShippingTypes(): void {
    const all = this.shippingTypes();

    if (!this.form.controls.isCustomAddress.value) {
      this.filteredShippingTypes.set(all);
      return;
    }

    const allowed = all.filter(
      (t) => !CUSTOM_ADDRESS_EXCLUDED_CARRIERS.includes(t.carrier_code)
    );
    this.filteredShippingTypes.set(allowed);

    const current = this.form.controls.shippingType.value;
    if (current && !allowed.some((t) => t.carrier_code === current)) {
      this.form.controls.shippingType.setValue(
        allowed[0]?.carrier_code ?? null
      );
    }
  }
}
