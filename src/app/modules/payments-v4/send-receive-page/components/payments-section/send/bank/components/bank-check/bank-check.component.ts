import {
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, Info, Plus, X } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';

import type { ICustomElement } from 'src/app/modules/check/model/check';
import type { IPayeeBankDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import type { IV3DropDownOnReady } from 'src/app/models/common';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { SpCategoryDropdownComponent } from '../../../dropdowns/sp-category-dropdown/sp-category-dropdown.component';
import { SpPayeeBankDropdownComponent } from '../../../dropdowns/sp-payee-bank-dropdown/sp-payee-bank-dropdown.component';

import { SpFocusAnchorDirective } from '../../../field-focus/sp-focus-anchor.directive';
import {
  INVOICE_TOOLTIP,
  syncCategoryWithPayee
} from '../../../shared/models/details-form';
import { selectPayeeBank } from '../../../shared/models/payee-bank';
import { tomorrow } from '../../../shared/models/recurring';
import { SendStateService } from '../../../shared/services/send-state.service';
import { BankCheckService } from '../../services/bank-check.service';
import { ScheduleNotifyComponent } from '../../../schedule-notify/schedule-notify.component';

/** What each "process without" toggle leaves off the printed check. */
const PROCESS_WITHOUT = [
  { key: 'noAmount', label: 'Amount' },
  { key: 'noPayee', label: 'Payee' },
  { key: 'noSign', label: 'Signature' },
  { key: 'noDate', label: 'Date' }
] as const;

/**
 * The additional-details fields for a check drawn on a bank account. The check number
 * and the custom fields belong to the account, so both are refetched when it changes.
 */
@Component({
  selector: 'app-bank-check',
  standalone: true,
  imports: [ScheduleNotifyComponent, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    WhiteLabelPipe,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    SpCategoryDropdownComponent,
    SpPayeeBankDropdownComponent,
    V4DatePickerComponent,
    SpFocusAnchorDirective
  ],
  templateUrl: './bank-check.component.html',
  styleUrl: './bank-check.component.scss'
})
export class BankCheckComponent implements OnDestroy {
  // ── Dependencies ──
  private readonly destroyRef = inject(DestroyRef);
  private readonly checkDesignService = inject(CheckDesignService);
  readonly sendStateService = inject(SendStateService);
  readonly bankCheckService = inject(BankCheckService);

  readonly form = this.bankCheckService.detailsForm;
  readonly customFields = signal<ICustomElement[]>([]);
  readonly showCustomFields = signal(false);

  readonly hasCustomFields = computed(() => this.customFields().length > 0);

  readonly InfoIcon = Info;
  readonly PlusIcon = Plus;
  readonly CloseIcon = X;
  readonly invoiceTooltip = INVOICE_TOOLTIP;

  private setCategoryById?: (id: string) => void;
  readonly minScheduleDate = tomorrow();

  /**
   * The three deliveries do not share a schedule. Each mirrors the modal it
   * replaces — `check-mail-modal-v4`, `check-email-modal-v4` and
   * `direct-deposit-v4` — because each posts to its own endpoint and they
   * disagree on everything: which intervals exist, what the codes mean (mail's
   * `1` is Weekly, the other two's is Daily), which ends are allowed, and
   * whether there is a "count this payment" flag at all.
   */
  private static readonly MAIL_FREQUENCIES = [
    { value: '1', label: 'Weekly' },
    { value: '2', label: 'Bi-Weekly' },
    { value: '3', label: 'Monthly' },
    { value: '4', label: 'Quarterly' },
    { value: '5', label: 'Yearly' }
  ];

  /** Email and deposit both take the zil-payment set, shortest interval first. */
  private static readonly ZIL_FREQUENCIES = [
    { value: '1', label: 'Daily' },
    { value: '2', label: 'Weekly' },
    { value: '5', label: 'Bi-Weekly' },
    { value: '3', label: 'Monthly' },
    { value: '6', label: 'Bi-Monthly' },
    { value: '7', label: 'Quarterly' }
  ];

  private readonly isDeposit = computed(
    () => this.sendStateService.checkDelivery() === 'ach'
  );

  private readonly isMail = computed(
    () => this.sendStateService.checkDelivery() === 'mail'
  );

  readonly recurringFrequencies = computed(() =>
    this.isMail()
      ? BankCheckComponent.MAIL_FREQUENCIES
      : BankCheckComponent.ZIL_FREQUENCIES
  );

  /** Mail opens on Weekly, email on Daily, a deposit on Monthly. */
  readonly recurringDefaultFrequency = computed(() => {
    if (this.isMail()) {
      return '1';
    }
    return this.isDeposit() ? '3' : '1';
  });

  /** A deposit has no end date — `direct-deposit-v4` offers only the two. */
  readonly recurringEndOptions = computed<readonly string[]>(() =>
    this.isDeposit() ? ['3', '1'] : ['3', '1', '2']
  );

  /** Only the mailed cheque asks. `check-mail-modal-v4` renders the tick; the
   *  e-cheque and deposit modals send the flag without offering it. */
  readonly showsIncludeThisPayment = this.isMail;

  // ── Direct deposit ──

  private readonly isDirectDeposit = computed(
    () => this.sendStateService.checkDelivery() === 'ach'
  );

  /**
   * Shown for every deposit. `direct-deposit-v4` draws no such division: the
   * account is its own column and the wallet-bypass tick is another, because
   * the two answer different questions — which account the payee withdraws to,
   * and whether the money waits in their wallet first. Hiding the account
   * behind the tick made one look like a consequence of the other, and losing
   * an account the user had already chosen.
   */
  readonly needsPayeeBank = this.isDirectDeposit;

  onDepositBankSelected(bank: IPayeeBankDetails | null): void {
    selectPayeeBank(this.sendStateService, bank);
  }

  constructor() {
    syncCategoryWithPayee(
      this.form.controls.category,
      this.sendStateService,
      this.destroyRef
    );

    // A bill names its category by id, and the dropdown is what resolves an id.
    effect(
      () => {
        const id = this.sendStateService.preferredCategoryId();
        if (id && this.setCategoryById) {
          this.setCategoryById(id);
        }
      },
      { allowSignalWrites: true }
    );

    this.loadCustomFields();
  }

  toggleCustomFields(): void {
    this.showCustomFields.update((open) => !open);
  }

  onCategoryReady(event: IV3DropDownOnReady): void {
    this.setCategoryById = event.setItemWithId;

    const id = this.sendStateService.preferredCategoryId();
    if (id && event.setItemWithId) {
      event.setItemWithId(id);
    }
  }

  onCustomFieldInput(field: string, value: string): void {
    this.bankCheckService.setCustomFieldValue(field, value);
  }

  customFieldValue(field: string): string {
    return this.bankCheckService.customFieldValue(field);
  }

  private loadCustomFields(): void {
    this.checkDesignService
      .getCustomElements()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const fields = res?.data?.custom_elements ?? [];
          this.customFields.set(fields);
          // The design is the list; an edited check may already have filled some
          // of it in, and the order the two arrive in is not ours to choose.
          this.bankCheckService.customElements = fields.map((f) => ({
            [f.custom_element]: this.bankCheckService.customFieldValue(f.custom_element)
          }));
        }
      });
  }

  ngOnDestroy(): void {
    PROCESS_WITHOUT.forEach(({ key }) => {
      this.form.controls[key].setValue(false);
    });
  }
}
