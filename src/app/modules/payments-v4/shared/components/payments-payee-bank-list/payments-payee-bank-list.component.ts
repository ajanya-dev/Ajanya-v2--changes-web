import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, distinctUntilChanged, of, skip, switchMap } from 'rxjs';
import { LucideAngularModule, TriangleAlert } from 'lucide-angular';

import type { IPayeeBankDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { SendPaymentStateService } from 'src/app/modules/payments-v4/send-payment/services/send-payment-state.service';
import { PaymentMethod } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import type { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import {
  AddPayeeBankV4Component,
  type AddPayeeBankDialogData
} from 'src/app/modules/payee/payee-v4/v4-components/add-payee-bank-v4/add-payee-bank-v4.component';

interface IPayeeBankDetailsExt extends IPayeeBankDetails {
  name?: string;
  accountName?: string;
  bankInstitutionName?: string;
  _label?: string;
}

@Component({
  selector: 'app-payments-payee-bank-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, V4CommonDropDownSelectorComponent],
  templateUrl: './payments-payee-bank-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsPayeeBankListComponent implements OnInit {
  private payeeService = inject(PayeeService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  /**
   * Only the Send Payment flow provides this. Callers outside it (the Send /
   * Receive page) pass `payeeEncryptedId` and `payeeName` instead.
   */
  readonly state = inject(SendPaymentStateService, { optional: true });

  /** Payee ID passed explicitly from the parent — drives bank loading */
  readonly payeeId = input<string | null | undefined>(null);
  /** Increment this to force a reload without changing the payeeId (e.g. after an external bank edit) */
  readonly reloadTrigger = input<number>(0);

  /** The add-bank form's payee, for callers with no SendPaymentStateService. */
  readonly payeeEncryptedId = input<string>('');
  readonly payeeName = input<string>('');

  /**
   * Select this bank once the list loads, in preference to the payee's default.
   * Set it when editing a payment, so the bank it was saved with wins.
   */
  readonly preselectBankId = input<string | undefined>(undefined);

  /**
   * The payment method the parent is collecting a bank for. Wire is the only one
   * that needs beneficiary details on the bank, so it's the only one that changes
   * what this component shows.
   */
  readonly paymentMethod = input<string | null | undefined>(null);

  /** Explicit inputs win; otherwise fall back to the Send Payment state. */
  readonly addBankPayeeId = computed(
    () => this.payeeEncryptedId() || this.state?.selectedPayee()?.encryptedId || ''
  );

  readonly addBankPayeeName = computed(
    () => this.payeeName() || this.state?.selectedPayee()?.name || ''
  );

  readonly bankSelected = output<IPayeeBankDetails | null>();

  /**
   * Whether the selected bank can receive a wire. Parents gate submission on this —
   * it stays `true` while no bank is selected, and for non-wire methods, so it never
   * blocks a flow that doesn't care.
   */
  readonly wireAllowedChange = output<boolean>();

  readonly banks = signal<IPayeeBankDetailsExt[]>([]);
  readonly loading = signal(false);
  readonly selectedBank = signal<IPayeeBankDetailsExt | null>(null);

  readonly wireAllowed = signal(true);
  readonly wireChecking = signal(false);
  /** Bumped after a bank dialog saves, to force the wire flag to be re-fetched. */
  private readonly wireCheckTrigger = signal(0);

  readonly TriangleAlertIcon = TriangleAlert;

  /** What the dropdown binds to — its `outputField` is the bank's `id`. */
  readonly selectedBankId = computed(() => this.selectedBank()?.id ?? null);

  readonly isWireMethod = computed(() => this.paymentMethod() === PaymentMethod.Wire);

  /**
   * The bank list endpoint doesn't return the wire flag, so it's fetched per
   * selected bank. Null means there's nothing to check (not a wire payment, or
   * no bank selected yet).
   */
  private readonly wireCheckTarget = computed(() => {
    const payeeId = this.payeeId();
    const bankId = this.selectedBank()?.id;
    if (!this.isWireMethod() || !payeeId || !bankId) return null;
    return `${payeeId}|${bankId}|${this.wireCheckTrigger()}`;
  });

  /**
   * Wire needs beneficiary and beneficiary-bank details saved against the payee's
   * bank. Offer to add them when the selected bank has none. Held back while the
   * check is in flight so the prompt doesn't flash on every selection.
   */
  readonly showWireDetailsPrompt = computed(
    () => this.isWireMethod() && !!this.selectedBank() && !this.wireChecking() && !this.wireAllowed()
  );

  /** Banks list enriched with display fields for the dropdown */
  readonly banksForDropdown = computed(() =>
    this.banks().map((b) => {
      const masked = this.getMaskedAccountNumber(b);
      return {
        ...b,
        _label: this.getDisplayName(b) || masked || 'Bank Account',
        _maskedAccount: masked
      };
    })
  );

  /**
   * "Add New Bank Account" is only offered once we know which payee the bank
   * would belong to — without `addBankPayeeId` the add-bank form has no payee
   * to save against.
   */
  readonly bankDropdownConfig = computed<Iv4ngSelectConfig>(() => ({
    placeholder: 'Select bank account',
    displayField: '_label',
    displaySubField: '_maskedAccount',
    outputField: 'id',
    enableAddNew: !!this.addBankPayeeId(),
    addNewLabel: 'Add New Bank Account'
  }));

  ngOnInit(): void {
    // toObservable emits the current value immediately and on every subsequent change.
    // This is more reliable than constructor effects for signal inputs with OnPush rendering.
    toObservable(this.payeeId, { injector: this.injector })
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => {
        if (id) {
          this.loadBanks(id);
        } else {
          this.banks.set([]);
          this.selectedBank.set(null);
          this.cdr.markForCheck();
        }
      });

    // When reloadTrigger increments (skip initial emission), reload the bank list
    // and try to restore the previously selected bank instead of defaulting to first
    toObservable(this.reloadTrigger, { injector: this.injector })
      .pipe(
        skip(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const id = this.payeeId();
        if (id) {
          this.loadBanks(
            id,
            undefined,
            String(this.selectedBank()?.id ?? ''),
            false,
            true
          );
        }
      });

    this.watchWireSupport();
  }

  /**
   * Resolves whether the selected bank is wire-enabled. `getPayeeBankData` (the
   * list) doesn't carry `isAllowWire`, so the single-bank endpoint is the only
   * source for it. switchMap drops the answer for a bank the user has already
   * moved off of.
   */
  private watchWireSupport(): void {
    toObservable(this.wireCheckTarget, { injector: this.injector })
      .pipe(
        distinctUntilChanged(),
        switchMap((target) => {
          if (!target) {
            // Not a wire payment, or nothing selected — nothing to warn about.
            this.wireChecking.set(false);
            this.setWireAllowed(true);
            this.cdr.markForCheck();
            return EMPTY;
          }
          const [payeeId, bankId] = target.split('|');
          this.wireChecking.set(true);
          this.cdr.markForCheck();
          return this.payeeService
            .getPayeeSingleBankData(payeeId, bankId)
            .pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.wireChecking.set(false);
        // A failed lookup is treated as "no wire details" — prompting to add them
        // is recoverable, letting an un-wireable bank through to submit is not.
        this.setWireAllowed(!!res?.data?.isAllowWire);
        this.cdr.markForCheck();
      });
  }

  private setWireAllowed(allowed: boolean): void {
    this.wireAllowed.set(allowed);
    this.wireAllowedChange.emit(allowed);
  }

  /**
   * `keepSelection` is for a refresh of the same payee's list — a bank was added
   * or the payee was edited. Clearing first emitted `null` to whoever owns the
   * form control, and a control that is required and already touched (the user
   * has just been refused once) drew "please select a bank account" over an
   * account that was still perfectly well chosen, until the fetch came back.
   * Only a *different* payee makes the current selection wrong.
   */
  private loadBanks(
    payeeId: string,
    onComplete?: () => void,
    preserveId?: string,
    selectLast?: boolean,
    keepSelection = false
  ): void {
    this.loading.set(true);
    if (!keepSelection) {
      this.banks.set([]);
      this.selectedBank.set(null);
      this.bankSelected.emit(null);
    }
    this.cdr.markForCheck();

    this.payeeService
      .getPayeeBankData(payeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          const data = (res?.data ?? []) as IPayeeBankDetailsExt[];
          this.banks.set(data);

          let bankToSelect: IPayeeBankDetailsExt | undefined;
          if (selectLast && data.length) {
            // After adding a bank, select the one just created. Match on its id
            // when the caller knows it; otherwise assume it's last in the list.
            bankToSelect =
              (preserveId ? data.find((b) => String(b.id) === preserveId) : undefined)
              ?? data[data.length - 1];
          } else {
            // Re-select the previously selected bank, then the one the caller
            // asked for (an edited payment's own bank), then the payee default.
            const preselectId = this.preselectBankId();
            bankToSelect = (preserveId ? data.find((b) => String(b.id) === preserveId) : undefined)
              ?? (preselectId ? data.find((b) => String(b.id) === preselectId) : undefined)
              ?? data.find((b) => b.defaultDDAccount === 1);
          }
          if (bankToSelect) {
            this.selectBank(bankToSelect);
          } else if (
            keepSelection &&
            !data.some(
              (b) => String(b.id) === String(this.selectedBank()?.id ?? '')
            )
          ) {
            // Held on to across the refresh, but the list came back without it.
            this.selectedBank.set(null);
            this.bankSelected.emit(null);
          }
          onComplete?.();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          onComplete?.();
          this.cdr.markForCheck();
        }
      });
  }

  selectBank(bank: IPayeeBankDetailsExt): void {
    this.selectedBank.set(bank);
    this.bankSelected.emit(bank);
    this.cdr.markForCheck();
  }

  onDropdownChange(id: string | null): void {
    // Clearing the dropdown is how a bank is now deselected.
    if (!id) {
      this.selectedBank.set(null);
      this.bankSelected.emit(null);
      this.cdr.markForCheck();
      return;
    }
    // Use String() comparison to guard against number/string id type mismatch at runtime
    const bank = this.banks().find((b) => String(b.id) === String(id));
    if (bank) this.selectBank(bank);
  }

  addNewBankAccount(): void {
    const addBankPayeeId = this.addBankPayeeId();
    // No payee to attach the bank to — the option is hidden in this state anyway.
    if (!addBankPayeeId) return;

    this.openBankDialog({
      payeeId: addBankPayeeId,
      payeeName: this.addBankPayeeName(),
      // Adding a bank to pay by wire: open with the wire toggle already on, so the
      // beneficiary details get collected up front instead of on a second pass.
      ...(this.isWireMethod() && { from: 'wire' })
    });
  }

  /**
   * Adds the missing wire details to the *selected* bank: the same form, opened in
   * edit mode on that bank with the wire section on.
   */
  openWireDetails(): void {
    const addBankPayeeId = this.addBankPayeeId();
    const bankId = this.selectedBank()?.id;
    if (!addBankPayeeId || !bankId) return;

    this.openBankDialog(
      {
        payeeId: addBankPayeeId,
        payeeName: this.addBankPayeeName(),
        edit: true,
        bankId: String(bankId),
        from: 'wire'
      },
      String(bankId)
    );
  }

  /**
   * @param reselectBankId Bank to re-select if the dialog closes without naming one.
   */
  private openBankDialog(dialogData: AddPayeeBankDialogData, reselectBankId?: string): void {
    this.dialog
      .open(AddPayeeBankV4Component, {
        width: '600px',
        maxWidth: '95vw',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: dialogData
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (
          result:
            | { success?: boolean; data?: { id?: string | number } }
            | undefined
        ) => {
          const payeeId = this.payeeId();
          if (!result?.success || !payeeId) return;

          // The saved bank's wire flag has just changed — make the next check re-fetch it
          // rather than reuse the answer cached for this same payee/bank pair.
          this.wireCheckTrigger.update((n) => n + 1);

          // Reload so the bank the user just saved appears in the dropdown, and select
          // it. The dialog hands back the bank it saved, so select by its id.
          const savedBankId = result.data?.id;
          this.loadBanks(
            payeeId,
            undefined,
            savedBankId != null ? String(savedBankId) : reselectBankId,
            true,
            // Same payee, one more bank: whatever was chosen stays chosen until
            // the new list names its replacement.
            true
          );
        }
      );
  }

  protected getDisplayName(bank: IPayeeBankDetailsExt): string {
    // Use || so empty strings also fall through to the next candidate
    return bank.bankName || bank.name || bank.accountName || bank.bankInstitutionName || '';
  }

  protected getMaskedAccountNumber(bank: IPayeeBankDetailsExt): string {
    if (!bank.accountNumber) return '';
    const acNo = String(bank.accountNumber);
    return acNo.length >= 4 ? `*****${acNo.slice(-4)}` : acNo;
  }
}
