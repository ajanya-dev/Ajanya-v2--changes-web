import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  Building2,
  X,
  Plus,
  CircleAlert
} from 'lucide-angular';

import type { IInternationalPayeeBankResponse } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SendPaymentStateService } from 'src/app/modules/payments-v4/send-payment/services/send-payment-state.service';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import type { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { AddPayeeInternationalBankV4Component } from 'src/app/modules/payee/payee-v4/v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IIntlBankExt extends IInternationalPayeeBankResponse {
  _label?: string;
}

@Component({
  selector: 'app-payments-payee-intl-bank-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    V4CommonDropDownSelectorComponent,
    AddPayeeInternationalBankV4Component,
    CommonButtonV4Component
  ],
  templateUrl: './payments-payee-intl-bank-list.component.html',
  styleUrl: './payments-payee-intl-bank-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsPayeeIntlBankListComponent implements OnInit {
  private paymentsService = inject(PaymentsService);
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private cdr = inject(ChangeDetectorRef);
  readonly state = inject(SendPaymentStateService);

  recipientType = input<'business' | 'personal'>('business');
  selectedCountryCode = input<string | null>(null);
  readonly bankSelected = output<IInternationalPayeeBankResponse | null>();
  /** Parent should update payment recipient type (toggle + form) before/while banks reload — keeps API list in sync with saved account type. */
  readonly recipientTypeSyncRequested = output<'business' | 'personal'>();

  private readonly allBanks = signal<IIntlBankExt[]>([]);
  readonly loading = signal(false);
  readonly selectedBank = signal<IIntlBankExt | null>(null);
  readonly showAddForm = signal(false);

  readonly Building2Icon = Building2;
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly CircleAlertIcon = CircleAlert;

  /** Filter banks by selected country (like old setInternationalBankList) */
  readonly banks = computed(() => {
    const all = this.allBanks();
    const countryCode = this.selectedCountryCode();
    if (!countryCode || all.length === 0) return all;

    const filtered = all.filter(bank => {
      const bankCountry =
        bank.beneficiaryBankDetails?.country ||
        bank.country ||
        '';
      return bankCountry === countryCode;
    });

    return filtered;
  });

  /** True when loading finished and no banks exist */
  readonly noBanksFound = computed(() => !this.loading() && this.banks().length === 0 && this.lastPayeeId !== null);

  readonly banksForDropdown = computed(() =>
    this.banks().map(b => ({
      ...b,
      _label: this.buildLabel(b)
    }))
  );

  /** The payee any new bank would be saved against. */
  readonly addBankPayeeId = computed(() => this.state.selectedPayee()?.id ?? '');

  /**
   * "Add New Bank Account" is only offered once we know which payee the bank would
   * belong to — without a payee id the add-bank form has nothing to save against.
   */
  readonly bankDropdownConfig = computed<Iv4ngSelectConfig>(() => ({
    placeholder: 'Select International Bank Account',
    displayField: '_label',
    outputField: 'encrypted_id',
    enableAddNew: !!this.addBankPayeeId(),
    addNewLabel: 'Add New Bank Account'
  }));

  private lastPayeeId: string | null = null;
  private lastRecipientType: string | null = null;
  private lastCountryCode: string | null = null;
  private lastReloadTrigger = 0;

  ngOnInit(): void {
    const initialPayee = this.state.selectedPayee();
    if (initialPayee?.id) {
      this.lastPayeeId = initialPayee.id;
      this.lastRecipientType = this.recipientType();
      this.loadBanks(initialPayee.id, this.recipientType());
    }

    // Watch for payee, recipient type, country, or external reload trigger changes
    effect(() => {
      const payee = this.state.selectedPayee();
      const type = this.recipientType();
      const country = this.selectedCountryCode();
      const reloadTrigger = this.state.bankListReloadTrigger();

      if (!payee?.id) return;

      const payeeChanged = payee.id !== this.lastPayeeId;
      const typeChanged = type !== this.lastRecipientType;
      const countryChanged = country !== this.lastCountryCode;
      const triggerChanged = reloadTrigger !== this.lastReloadTrigger;

      // Payee, type, or external trigger changed → reload banks from API
      if (payeeChanged || typeChanged || triggerChanged) {
        this.lastPayeeId = payee.id;
        this.lastRecipientType = type;
        this.lastCountryCode = country;
        this.lastReloadTrigger = reloadTrigger;
        this.loadBanks(payee.id, type);
        return;
      }

      // Only country changed → re-select from already loaded banks
      if (countryChanged && this.allBanks().length > 0) {
        this.lastCountryCode = country;
        this.selectedBank.set(null);
        this.bankSelected.emit(null);
        this.autoSelectDefault(type);
        this.cdr.markForCheck();
      }
    }, { injector: this.injector, allowSignalWrites: true });
  }

  private loadBanks(payeeId: string, type: 'business' | 'personal', selectLast = false): void {
    this.loading.set(true);
    this.allBanks.set([]);
    this.selectedBank.set(null);
    this.bankSelected.emit(null);
    this.cdr.markForCheck();

    this.paymentsService
      .getInternationalBanksByRecipientType(payeeId, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.loading.set(false);
          // API sometimes returns an object with numeric keys instead of an array
          let banksData: IIntlBankExt[] = [];
          if (data) {
            if (Array.isArray(data)) {
              banksData = data as IIntlBankExt[];
            } else if (typeof data === 'object') {
              banksData = Object.values(data) as IIntlBankExt[];
            }
          }
          this.allBanks.set(banksData);

          if (selectLast && banksData.length) {
            this.selectBank(banksData[banksData.length - 1]);
          } else {
            this.autoSelectDefault(type);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  private autoSelectDefault(type: 'business' | 'personal'): void {
    const filteredBanks = this.banks();
    if (filteredBanks.length === 0) return;

    const defaultField = type === 'business' ? 'is_default_for_business' : 'is_default_for_personal';
    const defaultBank = filteredBanks.find(b => b[defaultField] === 1) ?? filteredBanks[0];
    if (defaultBank) {
      this.selectBank(defaultBank);
    }
  }

  selectBank(bank: IIntlBankExt): void {
    const enriched = this.banksForDropdown().find(
      b => b.encrypted_id === bank.encrypted_id
    ) ?? bank;
    this.selectedBank.set(enriched);
    this.bankSelected.emit(bank);
    this.cdr.markForCheck();
  }

  onDropdownChange(encryptedId: string | null): void {
    if (!encryptedId) return;
    const bank = this.banks().find(b => b.encrypted_id === encryptedId);
    if (bank) this.selectBank(bank);
  }

  removeSelectedBank(): void {
    this.selectedBank.set(null);
    this.bankSelected.emit(null);
    this.cdr.markForCheck();
  }

  makeDefault(bank: IIntlBankExt): void {
    const payee = this.state.selectedPayee();
    if (!payee?.id) return;

    this.walletService
      .setDefaultBank({
        accountId: bank.encrypted_id,
        payeeId: payee.id,
        type: this.recipientType()
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const defaultField = this.recipientType() === 'business'
            ? 'is_default_for_business'
            : 'is_default_for_personal';

          this.allBanks.update(list =>
            list.map(b => ({
              ...b,
              [defaultField]: b.encrypted_id === bank.encrypted_id ? 1 : 0
            }))
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.alertService.failedAlert({ content: 'Failed to set default bank account' });
        }
      });
  }

  onBankAdded(event: { accountType: 'business' | 'personal'; phone: string | null }): void {
    this.showAddForm.set(false);
    const payee = this.state.selectedPayee();
    if (!payee?.id) return;

    if (event.phone) {
      this.state.selectedPayee.update(p => p ? { ...p, phone: event.phone! } : p);
    }

    // Avoid a second reload when parent input `recipientType` updates after sync
    this.lastRecipientType = event.accountType;
    this.recipientTypeSyncRequested.emit(event.accountType);
    this.loadBanks(payee.id, event.accountType, true);
  }

  getDisplayName(bank: IIntlBankExt): string {
    return bank.bank_name || '';
  }

  getSubLine(bank: IIntlBankExt): string {
    const currency = bank.currency ?? '';
    const num = bank.account_number
      ? `****${String(bank.account_number).slice(-4)}`
      : '';
    const parts = [currency, num].filter(Boolean);
    return parts.join(' \u2022 ');
  }

  getAccountType(bank: IIntlBankExt): string {
    return bank.account_type
      ? bank.account_type.charAt(0).toUpperCase() + bank.account_type.slice(1)
      : '';
  }

  isDefault(bank: IIntlBankExt): boolean {
    const field = this.recipientType() === 'business'
      ? 'is_default_for_business'
      : 'is_default_for_personal';
    return bank[field] === 1;
  }

  private buildLabel(bank: IIntlBankExt): string {
    const name = this.getDisplayName(bank);
    const sub = this.getSubLine(bank);
    return name && sub ? `${name} \u2014 ${sub}` : name || sub || 'Bank Account';
  }
}
