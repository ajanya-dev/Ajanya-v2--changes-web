import {
  DestroyRef,
  Injectable,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import type { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, merge } from 'rxjs';
import { debounceTime, finalize, takeUntil } from 'rxjs/operators';

import type { IInternationalPayeeAccount } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import type {
  IInternationalCountry,
  IWalletInternationaPaymentCreate
} from 'src/app/models/wallet';
import type { ITransactionLimits } from 'src/app/modules/payments/model/payments';
import {
  AddPayeeInternationalBankV4Component,
  type AddPayeeInternationalBankDialogData
} from 'src/app/modules/payee/payee-v4/v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';

import { Utils } from 'src/app/data/utils';
import { SendStateService } from '../../shared/services/send-state.service';
import {
  INTL_MIN_AMOUNT,
  SOURCE_OF_FUNDS_COUNTRIES,
  WalletPaymentService
} from './wallet-payment.service';

/** Ripple's two recipient types. */
export type RecipientType = 'business' | 'personal';

/** A typed amount shouldn't re-quote on every keystroke. */
const QUOTE_DEBOUNCE_MS = 1500;

/** A country row, flattened from the enabled-countries map. */
export interface ICountryOption {
  key: string;
  countryCode: string;
  currency: string;
  flag: string | null;
  is_enabled: number;
}

/** A `{ CODE: 'Description', category?: string }` row from the purpose/source APIs. */
export interface ICodedOption {
  code: string;
  description: string;
  category?: string;
}

/** A bank enriched with a display label for the dropdown. */
export interface IIntlBankOption extends IInternationalPayeeAccount {
  _label?: string;
  _sub?: string;
}

/**
 * The limit card's imperative half. The card renders inside the recipient card,
 * so that component registers this and the service drives it from either half.
 */
export interface ILimitCardOps {
  clearState(): void;
  checkLimit(purposeCode: string, overrideQuoteId?: string): void;
}

/** The bank list API sometimes answers with an index-keyed object. */
function toBankArray(data: unknown): IInternationalPayeeAccount[] {
  if (Array.isArray(data)) {
    return data as IInternationalPayeeAccount[];
  }
  if (data && typeof data === 'object') {
    return Object.values(data) as IInternationalPayeeAccount[];
  }
  return [];
}

/** The purpose/source endpoints put the code in the first key. */
function toCodedOptions(rows: { [key: string]: string }[]): ICodedOption[] {
  return (rows ?? []).map((row) => {
    const code = Object.keys(row).find((k) => k !== 'category') ?? '';
    return {
      code,
      description: row[code],
      category: (row as { category?: string }).category
    };
  });
}

function bankCountry(bank: IInternationalPayeeAccount): string {
  return bank.beneficiaryBankDetails?.country ?? bank.country ?? '';
}

/**
 * Everything the international rail knows, held one level above its two views:
 * the "International recipient" card under the memo and the bank/purpose fields
 * in Additional Details. Provided on SendComponent, so both see one state.
 */
@Injectable()
export class InternationalPaymentUiService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly paymentsService = inject(PaymentsService);
  private readonly walletService = inject(WalletService);
  private readonly sendStateService = inject(SendStateService);
  private readonly walletPaymentService = inject(WalletPaymentService);

  readonly form = this.walletPaymentService.detailsForm;

  /** Registered by the card component, which hosts the limit card. */
  readonly limitCardOps = signal<ILimitCardOps | null>(null);

  /** Null until the user picks one: the type is their choice, not a default. */
  readonly recipientType = signal<RecipientType | null>(null);

  readonly transactionLimits = signal<ITransactionLimits | null>(null);
  readonly isLoadingLimits = signal(false);

  readonly countriesList = signal<ICountryOption[]>([]);
  readonly selectedCountry = signal<ICountryOption | null>(null);
  readonly countrySearchTerm = signal('');
  readonly showCountrySearch = signal(false);

  private readonly allBanks = signal<IInternationalPayeeAccount[]>([]);
  readonly bankLoading = this.walletPaymentService.internationalBankLoading;

  /**
   * Mirrors `interBankAc` for the dropdown's `[ngModel]`. A signal, not a computed:
   * a FormControl isn't reactive, so a computed over it would never update.
   */
  readonly selectedBankId = signal<string | null>(
    this.walletPaymentService.detailsForm.controls.interBankAc.value
      ?.encrypted_id ?? null
  );

  readonly quoteError = signal<string | null>(null);

  readonly purposeOptions = signal<ICodedOption[]>([]);
  readonly sourceOptions = signal<ICodedOption[]>([]);
  readonly purposeLoading = signal(false);
  readonly sourceLoading = signal(false);
  readonly countriesLoading = signal(false);

  private readonly prefilling = signal(false);

  private readonly prefillBusy = computed(
    () =>
      this.countriesLoading() ||
      this.bankLoading() ||
      this.purposeLoading() ||
      this.sourceLoading() ||
      this.walletPaymentService.quoteLoading()
  );

  readonly isPrefilling = computed(
    () => this.prefilling() && this.prefillBusy()
  );

  readonly isActive = computed(
    () => this.sendStateService.methodId() === 'international-payment'
  );

  readonly filteredCountries = computed(() => {
    const term = this.countrySearchTerm().toLowerCase();
    const list = this.countriesList().filter((c) => c.is_enabled !== 0);
    if (!term) {
      return list;
    }
    return list.filter(
      (c) =>
        c.key.toLowerCase().includes(term) ||
        c.currency.toLowerCase().includes(term)
    );
  });

  /** Banks whose country matches the chosen destination currency. */
  readonly banks = computed(() => {
    const all = this.allBanks();
    const country = this.selectedCountry()?.countryCode;
    if (!country) {
      return all;
    }
    return all.filter((b) => bankCountry(b) === country);
  });

  readonly banksForDropdown = computed<IIntlBankOption[]>(() =>
    this.banks().map((b) => ({
      ...b,
      _label: b.bank_name || this.buildBankLabel(b),
      _sub: this.buildBankSubLabel(b)
    }))
  );

  /** "Add New Bank Account" needs a payee to save the account against. */
  readonly canAddBank = computed(() => !!this.sendStateService.payeeId());

  /** Personal-only monthly limits, shown on the "Recipient limits" affordance. */
  readonly limitsTooltip = computed(() => {
    if (this.isLoadingLimits()) {
      return 'Loading recipient limits…';
    }
    const limits = this.transactionLimits();
    if (!limits) {
      return 'Recipient monthly limits';
    }
    const usd = (n: number) =>
      `$${Number(n ?? 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    return (
      `Monthly amount: ${usd(limits.amount_spent_this_month)} of ${usd(
        limits.monthly_amount_limit
      )} used
` +
      `Monthly transactions: ${limits.transaction_count_this_month} of ${limits.monthly_transaction_limit} used`
    );
  });

  readonly exchangeRate = computed(() => {
    const quote = this.walletPaymentService.quote();
    if (!quote) {
      return null;
    }
    return Number(parseFloat(quote.customer_exchange_rate).toFixed(4));
  });

  readonly selectedPurposeDescription = computed(() => {
    const code = this.form.controls.purpose.value;
    return (
      this.purposeOptions().find((o) => o.code === code)?.description ??
      'Maximum'
    );
  });

  /** Source of Funds only applies to India and the Philippines. */
  readonly isSourceOfFundsRequired = computed(() =>
    SOURCE_OF_FUNDS_COUNTRIES.includes(this.selectedCountry()?.countryCode ?? '')
  );

  private readonly cancelQuote$ = new Subject<void>();

  /**
   * The purpose / source codes an edit or clone arrived with. Held because loading
   * the banks clears the controls before either list exists; re-applied once the
   * matching list has loaded. Captured in `activate()`, not here — this service is
   * provided on SendComponent and so exists long before the form is prefilled.
   */
  private pendingPurpose: string | null = null;
  private pendingSourceOfCash: string | null = null;

  private purposesKey = '';
  private sourcesKey = '';

  private quoteErrored = false;
  private utils = Utils;

  constructor() {
    this.registerEffects();
    this.registerFormSubscriptions();
  }

  get bankMissing(): boolean {
    return !this.form.controls.interBankAc.value;
  }

  get bankErrorShown(): boolean {
    return this.bankMissing && this.form.controls.interBankAc.touched;
  }

  /** Red only once Confirm has run — an untouched blank toggle isn't a mistake yet. */
  get recipientTypeErrorShown(): boolean {
    return !this.recipientType() && this.form.controls.recipientType.touched;
  }

  /**
   * The payee's list came back empty: there is nothing to pick, so the block
   * under the dropdown says so and offers to add one.
   */
  get noBankOnFile(): boolean {
    return !this.bankLoading() && !this.banks().length;
  }

  /** One consolidated line under the bank dropdown: amber hint, red once Confirm ran. */
  get bankNote(): string | null {
    if (!this.bankMissing) {
      return null;
    }
    if (this.bankErrorShown) {
      return 'Please select a payee international bank account';
    }
    if (this.noBankOnFile) {
      return 'This payee has no international bank account on file.';
    }
    return null;
  }

  // ── Activation ───────────────────────────────────────────────────────────

  /**
   * The recipient card mounted: adopt a saved type (edit / clone) and load. A
   * fresh payment has none — the countries, banks and purposes all differ by
   * type, so there is nothing to load until the user picks one.
   */
  activate(): void {
    this.pendingPurpose = this.form.controls.purpose.value;
    this.pendingSourceOfCash = this.form.controls.sourceOfCash.value;

    const savedType = this.form.controls.recipientType.value;
    if (savedType === 'business' || savedType === 'personal') {
      this.recipientType.set(savedType);
      this.prefilling.set(this.sendStateService.mode() !== 'CREATE');
      this.loadCountries();
      if (savedType === 'personal') {
        this.loadTransactionLimits();
      }

      const saved = this.walletPaymentService.preferredInternationalCountry();
      if (saved) {
        this.selectCountry({
          key: '',
          countryCode: saved.countryCode,
          currency: saved.currency,
          flag: null,
          is_enabled: 1
        });
      }
    }
  }

  /** The rail left the screen: drop the quote and every list it was showing. */
  deactivate(): void {
    this.cancelQuote$.next();
    this.walletPaymentService.clearQuote();
    this.walletPaymentService.limitGate.set(null);
    this.limitCardOps.set(null);
    this.countriesList.set([]);
    this.selectedCountry.set(null);
    this.countrySearchTerm.set('');
    this.showCountrySearch.set(false);
    this.allBanks.set([]);
    this.purposeOptions.set([]);
    this.sourceOptions.set([]);
    this.transactionLimits.set(null);
    this.quoteError.set(null);
    this.quoteErrored = false;
    this.prefilling.set(false);
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  private registerEffects(): void {
    effect(
      () => {
        if (this.prefilling() && !this.prefillBusy()) {
          this.prefilling.set(false);
        }
      },
      { allowSignalWrites: true }
    );

    // Selecting international *is* what applies its method validators.
    effect(
      () => {
        if (!this.isActive()) {
          return;
        }
        this.walletPaymentService.applyMethodValidators(
          this.sendStateService.methodId()
        );
      },
      { allowSignalWrites: true }
    );

    // Prefill from the payee once it loads.
    effect(
      () => {
        const info = this.sendStateService.payeeDetails()?.payee_information;
        if (!this.isActive() || !info) {
          return;
        }
        this.form.patchValue(
          {
            payeeEmail: info.payee_email ?? '',
            payeeIdNumber: info.payee_id_number ?? '',
            payeePhone: info.payee_phone ?? ''
          },
          { emitEvent: false }
        );
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const category = this.sendStateService.payeeCategory();
        if (this.isActive() && category) {
          this.form.controls.category.setValue(category, { emitEvent: false });
        }
      },
      { allowSignalWrites: true }
    );

    // Banks are per payee and per recipient type; reload when either changes.
    // On an edit or clone, keep the bank the payment actually used — the payee's
    // default may be another bank, in another country.
    effect(
      () => {
        const payeeId = this.sendStateService.payeeId();
        const type = this.recipientType();
        if (this.isActive() && payeeId && type) {
          untracked(() =>
            this.loadBanks(
              payeeId,
              type,
              false,
              this.walletPaymentService.preferredInternationalBankId()
            )
          );
        }
      },
      { allowSignalWrites: true }
    );

    // The details rail edits the recipient bank, then bumps this to refresh the
    // dropdown, re-selecting the edited bank.
    effect(
      () => {
        const tick = this.walletPaymentService.internationalBankReloadTrigger();
        if (!this.isActive() || !tick) {
          return;
        }
        const payeeId = this.sendStateService.payeeId();
        const type = this.recipientType();
        if (payeeId && type) {
          untracked(() =>
            this.loadBanks(
              payeeId,
              type,
              false,
              this.walletPaymentService.preferredInternationalBankId()
            )
          );
        }
      },
      { allowSignalWrites: true }
    );

    // A new quote invalidates the previous limit check; re-run it.
    effect(
      () => {
        const quoteId = this.walletPaymentService.quote()?.quote_id ?? null;
        if (!this.isActive()) {
          return;
        }
        const purpose = untracked(() => this.form.controls.purpose.value);
        untracked(() => {
          this.limitCardOps()?.clearState();
          if (quoteId && purpose) {
            this.limitCardOps()?.checkLimit(purpose, quoteId);
          }
        });
      },
      { allowSignalWrites: true }
    );
  }

  private registerFormSubscriptions(): void {
    this.form.controls.purpose.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((code) => {
        if (!this.isActive()) {
          return;
        }
        this.onPurposeChange(code);
        // Each purpose has its own limit; re-check the new one, drop the old.
        this.limitCardOps()?.clearState();
        if (code) {
          this.limitCardOps()?.checkLimit(code);
        }
      });

    this.form.controls.sourceOfCash.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((code) => {
        if (this.isActive()) {
          this.onSourceChange(code);
        }
      });

    this.form.controls.recipientType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        // Null included: `resetDetails()` clears the control, and the toggle has
        // to let go of the old choice with it.
        this.recipientType.set(
          type === 'business' || type === 'personal' ? type : null
        );
      });

    // Re-quote on amount, bank or recipient-type change.
    merge(
      this.sendStateService.coreForm.controls.amount.valueChanges,
      this.form.controls.recipientType.valueChanges
    )
      .pipe(debounceTime(QUOTE_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isActive()) {
          this.recalculateQuote();
        }
      });
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  setRecipientType(type: RecipientType): void {
    if (this.recipientType() === type) {
      return;
    }
    this.recipientType.set(type);
    this.form.controls.recipientType.setValue(type);

    // Another type is another payment; the edit/clone answers no longer apply.
    this.pendingPurpose = null;
    this.pendingSourceOfCash = null;
    this.walletPaymentService.preferredInternationalBankId.set(undefined);
    this.walletPaymentService.preferredInternationalCountry.set(undefined);
    this.prefilling.set(false);

    this.limitCardOps()?.clearState();
    this.clearBank();
    this.walletPaymentService.clearQuote();
    this.quoteError.set(null);
    this.selectedCountry.set(null);
    this.purposeOptions.set([]);
    this.sourceOptions.set([]);

    this.loadCountries();
    if (type === 'personal') {
      this.loadTransactionLimits();
    } else {
      this.transactionLimits.set(null);
    }
  }

  selectCountry(country: ICountryOption): void {
    if (country.is_enabled === 0) {
      return;
    }
    this.selectedCountry.set(country);
    this.showCountrySearch.set(false);
    this.countrySearchTerm.set('');

    this.loadPurposes();
    this.walletPaymentService.applySourceOfFundsValidators();
    if (this.isSourceOfFundsRequired()) {
      this.loadSources();
    } else {
      this.sourceOptions.set([]);
    }

    // A country with no matching bank clears the selection.
    if (this.selectedBankId() && !this.banks().length) {
      this.clearBank();
    }
    this.recalculateQuote();
  }

  toggleCountrySearch(): void {
    // The list is loaded per recipient type; with none there is nothing to open.
    if (!this.recipientType() || this.isPrefilling()) {
      return;
    }
    this.showCountrySearch.update((v) => !v);
    if (!this.showCountrySearch()) {
      this.countrySearchTerm.set('');
    }
  }

  onBankDropdownChange(encryptedId: string | null): void {
    if (!encryptedId) {
      this.clearBank();
      this.walletPaymentService.clearQuote();
      return;
    }
    const bank = this.banks().find((b) => b.encrypted_id === encryptedId);
    if (bank) {
      this.selectBank(bank);
    }
  }

  /** "Add New Bank Account" — opens the international-bank modal, reloads on success. */
  openAddBank(): void {
    const payeeId = this.sendStateService.payeeId();
    if (!payeeId) {
      return;
    }

    const dialogData: AddPayeeInternationalBankDialogData = {
      payeeId,
      accordionMode: true,
      payeePhone: this.form.controls.payeePhone.value || '',
      // Account type and recipient type are the same choice. When this screen has
      // already made it the modal pre-selects and locks it instead of asking again;
      // with nothing chosen yet the modal asks, and `afterClosed` adopts its answer.
      paymentRecipientType: this.recipientType() ?? undefined
    };

    this.dialog
      .open(AddPayeeInternationalBankV4Component, {
        autoFocus: false,
        disableClose: true,
        maxWidth: '95%',
        width: '600px',
        panelClass: 'paddingless-modal-rounded',
        data: dialogData
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result?.success) {
          return;
        }
        // The saved bank names its account type; keep the toggle in step so the
        // right list reloads, and select the just-added bank (it lands last).
        const type: RecipientType =
          result.accountType === 'personal' ? 'personal' : 'business';
        if (this.recipientType() !== type) {
          this.recipientType.set(type);
          this.form.controls.recipientType.setValue(type, { emitEvent: false });
        }
        this.loadBanks(payeeId, type, true);
      });
  }

  refreshQuote(): void {
    this.recalculateQuote();
  }

  /**
   * The card's "Edit amount" panel re-quoted with a lower amount; adopt it as
   * the live quote and sync the hero amount.
   */
  onLimitCardAmountUpdated(event: {
    amount: number;
    quote: IWalletInternationaPaymentCreate;
  }): void {
    this.walletPaymentService.quote.set(event.quote);
    this.sendStateService.coreForm.controls.amount.setValue(
      String(event.amount),
      { emitEvent: false }
    );
  }

  /**
   * A non-305/312 limit failure means the purpose can't be used — clear it so
   * the user re-picks.
   */
  onPurposeLimitError(): void {
    this.form.controls.purpose.setValue(null);
    this.form.controls.purposeCategory.setValue(null);
    this.walletPaymentService.applyPurposeCategoryValidators();
    this.limitCardOps()?.clearState();
  }

  /**
   * The check refused the purpose only because the memo was empty. The purpose
   * itself is usable, so it stays chosen and the memo becomes required instead —
   * the field then says so where the user can act on it.
   */
  onPurposeMemoRequired(): void {
    this.walletPaymentService.memoRequiredByServer.set(true);
    this.walletPaymentService.applyPurposeCategoryValidators();
    // The message component only renders against a touched control.
    this.form.controls.memo.markAsTouched();
    this.sendStateService.requestFieldFocus('memo');
    this.limitCardOps()?.clearState();
  }

  // ── API methods ──────────────────────────────────────────────────────────

  private loadCountries(): void {
    const type = this.recipientType();
    if (!type) {
      return;
    }
    const api$ =
      type === 'personal'
        ? this.paymentsService.enabledInternationalPaymentCountriesPersonal()
        : this.paymentsService.enabledInternationalPaymentCountries();

    this.countriesLoading.set(true);
    api$
      .pipe(
        finalize(() => this.countriesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.setCountriesFromData(res.data);
        }
      });
  }

  private loadTransactionLimits(): void {
    this.isLoadingLimits.set(true);
    this.paymentsService
      .getTransactionLimits()
      .pipe(
        finalize(() => this.isLoadingLimits.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) =>
          this.transactionLimits.set(res.success ? res.data : null),
        error: () => this.transactionLimits.set(null)
      });
  }

  private loadBanks(
    payeeId: string,
    type: RecipientType,
    selectLast = false,
    preselectId?: string
  ): void {
    this.bankLoading.set(true);
    this.allBanks.set([]);
    this.clearBank();

    this.paymentsService
      .getInternationalBanksByRecipientType(payeeId, type)
      .pipe(
        finalize(() => this.bankLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          const list = toBankArray(data);
          this.allBanks.set(list);

          // The bank the user just added lands last. Pick it from the unfiltered list —
          // `banks()` is country-filtered and would hide a bank added for another one.
          if (selectLast && list.length) {
            this.selectBank(list[list.length - 1]);
            return;
          }

          // After an edit, keep the same bank selected so the rail and dropdown agree.
          if (preselectId) {
            const edited = list.find((b) => b.encrypted_id === preselectId);
            if (edited) {
              this.selectBank(edited);
              return;
            }
          }

          if (list.length) {
            this.selectBank(this.defaultBank(list, type));
          }
        },
        error: () => undefined
      });
  }

  private loadPurposes(): void {
    const countryCode = this.selectedCountry()?.countryCode;
    const type = this.recipientType();
    if (!countryCode || !type) {
      return;
    }

    const key = `${countryCode}|${type}`;
    if (
      key === this.purposesKey &&
      (this.purposeLoading() || this.purposeOptions().length)
    ) {
      this.applyPending(
        this.pendingPurpose,
        this.purposeOptions(),
        this.form.controls.purpose
      );
      return;
    }
    this.purposesKey = key;

    this.purposeLoading.set(true);
    this.walletService
      .getPurpose({ countryCode, type })
      .pipe(
        finalize(() => this.purposeLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res.success) {
          this.purposesKey = '';
          return;
        }
        const options = toCodedOptions(res.data);
        this.purposeOptions.set(options);

        // Drop a purpose the new country/type doesn't offer.
        const current = this.form.controls.purpose.value;
        if (current && !options.some((o) => o.code === current)) {
          this.form.controls.purpose.setValue(null);
          this.form.controls.purposeCategory.setValue(null);
          this.walletPaymentService.applyPurposeCategoryValidators();
        }

        this.applyPending(
          this.pendingPurpose,
          options,
          this.form.controls.purpose
        );
      });
  }

  private loadSources(): void {
    this.walletPaymentService.applySourceOfFundsValidators();

    const countryCode = this.selectedCountry()?.countryCode;
    const type = this.recipientType();
    if (!countryCode || !type || !this.isSourceOfFundsRequired()) {
      this.sourceOptions.set([]);
      return;
    }

    const key = `${countryCode}|${type}`;
    if (
      key === this.sourcesKey &&
      (this.sourceLoading() || this.sourceOptions().length)
    ) {
      this.applyPending(
        this.pendingSourceOfCash,
        this.sourceOptions(),
        this.form.controls.sourceOfCash
      );
      return;
    }
    this.sourcesKey = key;

    this.sourceLoading.set(true);
    this.walletService
      .getSourceOfCash({ countryCode, type })
      .pipe(
        finalize(() => this.sourceLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res.success) {
          this.sourcesKey = '';
        }
        if (res.success) {
          const options = toCodedOptions(res.data);
          this.sourceOptions.set(options);
          this.applyPending(
            this.pendingSourceOfCash,
            options,
            this.form.controls.sourceOfCash
          );
        }
      });
  }

  /**
   * Re-select an edit/clone code once its list has loaded, and only while nothing
   * is selected — a value the user picked meanwhile wins.
   */
  private applyPending(
    code: string | null,
    options: ICodedOption[],
    control: FormControl<string | null>
  ): void {
    if (code && !control.value && options.some((o) => o.code === code)) {
      control.setValue(code);
    }
  }

  private createQuote(amount: number): void {
    this.cancelQuote$.next();
    if (this.quoteErrored) {
      return;
    }

    const country = this.selectedCountry();
    const type = this.recipientType();
    if (!country || !type) {
      return;
    }

    this.walletPaymentService.quoteLoading.set(true);
    this.walletPaymentService.clearQuote();
    this.quoteError.set(null);

    this.walletService
      .createQuote({
        countryCode: country.countryCode,
        payoutCurrencyCode: country.currency,
        amount,
        type,
        isReceivingAmount: 0
      })
      .pipe(
        finalize(() => this.walletPaymentService.quoteLoading.set(false)),
        takeUntil(this.cancelQuote$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (this.selectedCountry()?.countryCode !== country.countryCode) {
            return;
          }
          if (res?.data) {
            this.walletPaymentService.quote.set(res.data);
          }
        },
        error: (err) => {
          this.quoteErrored = true;
          this.walletPaymentService.clearQuote();
          const failure = (
            err as {
              error?: { errorCode?: number | string; errorMsg?: string };
            }
          )?.error;
          if (failure?.errorCode === 312 || failure?.errorCode === '312') {
            this.walletPaymentService
              .limitGate()
              ?.transactionLimitMessage.set(
                failure.errorMsg ??
                  'Transaction limit exceeded for this purpose.'
              );
            return;
          }

          this.quoteError.set(
            failure?.errorMsg ?? 'Failed to get exchange rate. Please try again.'
          );
        }
      });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private setCountriesFromData(data: {
    [key: string]: IInternationalCountry;
  }): void {
    this.countriesList.set(
      Object.entries(data).map(([key, value]) => ({
        key,
        countryCode: value.countryCode,
        currency: value.currency,
        flag: value.flag ?? null,
        is_enabled: value.is_enabled
      }))
    );

    // The enabled-countries payload is the only place the IBAN flag reaches this
    // flow; keep the codes so the details rail can label IBAN banks correctly.
    const ibanCodes = new Set(
      this.walletPaymentService.internationalIbanCountries()
    );
    Object.values(data).forEach((value) => {
      if (value.iban === 1) {
        ibanCodes.add(value.countryCode);
      }
    });
    this.walletPaymentService.internationalIbanCountries.set(ibanCodes);

    const current = this.selectedCountry();
    const bank = this.form.controls.interBankAc.value;
    const code = current?.countryCode ?? (bank ? bankCountry(bank) : '');
    if (!code) {
      return;
    }
    const match = this.countriesList().find((c) => c.countryCode === code);
    if (!match) {
      if (current) {
        this.selectedCountry.set(null);
        this.purposeOptions.set([]);
        this.sourceOptions.set([]);
        this.walletPaymentService.clearQuote();
      }
      return;
    }
    if (current) {
      this.selectedCountry.set(match);
    } else {
      this.selectCountry(match);
    }
  }

  private defaultBank(
    banks: IInternationalPayeeAccount[],
    type: RecipientType
  ): IInternationalPayeeAccount {
    const field =
      type === 'business' ? 'is_default_for_business' : 'is_default_for_personal';
    return banks.find((b) => b[field] === 1) ?? banks[0];
  }

  private selectBank(bank: IInternationalPayeeAccount): void {
    this.form.controls.interBankAc.setValue(bank);
    this.selectedBankId.set(bank.encrypted_id ?? null);
    this.walletPaymentService.selectedInternationalBank.set(bank);

    // A bank names its own country; adopt it so the quote and lists match.
    const country = bankCountry(bank);
    if (country && country !== this.selectedCountry()?.countryCode) {
      const match = this.countriesList().find((c) => c.countryCode === country);
      if (match) {
        this.selectCountry(match);
        return;
      }
    }

    this.loadPurposes();
    this.loadSources();
    const quoteUnderway =
      !!this.walletPaymentService.quote() ||
      this.walletPaymentService.quoteLoading();
    if (!(this.prefilling() && quoteUnderway)) {
      this.recalculateQuote();
    }
  }

  private clearBank(): void {
    this.form.controls.interBankAc.setValue(null);
    this.selectedBankId.set(null);
    this.walletPaymentService.selectedInternationalBank.set(null);
    this.form.controls.purpose.setValue(null);
    this.form.controls.purposeCategory.setValue(null);
    this.walletPaymentService.applyPurposeCategoryValidators();
    this.walletPaymentService.applySourceOfFundsValidators();
  }

  private buildBankSubLabel(bank: IInternationalPayeeAccount): string {
    const currency = bank.currency ?? '';
    const num = bank.account_number
      ? this.utils.getMaskedAcNo(bank.account_number)
      : '';
    return [currency, num].filter(Boolean).join(' • ');
  }

  private buildBankLabel(bank: IInternationalPayeeAccount): string {
    const name = bank.bank_name ?? '';
    const currency = bank.currency ?? '';
    const num = bank.account_number
      ? this.utils.getMaskedAcNo(bank.account_number)
      : '';
    const sub = [currency, num].filter(Boolean).join(' • ');
    return name && sub ? `${name} — ${sub}` : name || sub || 'Bank Account';
  }

  private onPurposeChange(code: string | null): void {
    const purpose = this.purposeOptions().find((o) => o.code === code);
    this.form.controls.purposeCategory.setValue(purpose?.category ?? null);
    // The server's memo rule belonged to the purpose being left behind.
    this.walletPaymentService.memoRequiredByServer.set(false);
    this.walletPaymentService.applyPurposeCategoryValidators();
  }

  private onSourceChange(code: string | null): void {
    const source = this.sourceOptions().find((o) => o.code === code);
    this.form.controls.sourceOfCashName.setValue(source?.description ?? '');
  }

  private recalculateQuote(): void {
    const amount = Number(this.sendStateService.coreForm.controls.amount.value);

    if (amount >= INTL_MIN_AMOUNT && this.selectedCountry()) {
      this.quoteErrored = false;
      this.createQuote(amount);
    } else {
      this.walletPaymentService.clearQuote();
      this.quoteError.set(null);
    }
  }
}
