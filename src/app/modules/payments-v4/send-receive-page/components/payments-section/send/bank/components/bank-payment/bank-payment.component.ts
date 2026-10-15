import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  LucideAngularModule,
  History,
  Info,
  Minus,
  Plus
} from 'lucide-angular';

import type { IPayeeBankDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import type { IV3DropDownOnReady } from 'src/app/models/common';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonToggleV4Component } from 'src/app/shared/V4/common-toggle-v4/common-toggle-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { SpCategoryDropdownComponent } from '../../../dropdowns/sp-category-dropdown/sp-category-dropdown.component';
import { SpSelectDropdownComponent } from '../../../dropdowns/sp-select-dropdown/sp-select-dropdown.component';
import { SpPayeeBankDropdownComponent } from '../../../dropdowns/sp-payee-bank-dropdown/sp-payee-bank-dropdown.component';

import {
  INVOICE_TOOLTIP,
  syncCategoryWithPayee
} from '../../../shared/models/details-form';
import { selectPayeeBank, setWireAllowed } from '../../../shared/models/payee-bank';
import {
  RECURRING_END_IDS,
  RECURRING_FREQUENCIES,
  tomorrow
} from '../../../shared/models/recurring';
import { SendStateService } from '../../../shared/services/send-state.service';
import { BankPaymentService } from '../../services/bank-payment.service';
import { SpFocusAnchorDirective } from '../../../field-focus/sp-focus-anchor.directive';
import { ScheduleNotifyComponent } from '../../../schedule-notify/schedule-notify.component';

/**
 * The additional-details fields for a bank ACH or wire payment. A wire requires a
 * payee bank and a memo; an ACH offers SMS notification and a recurring schedule.
 */
@Component({
  selector: 'app-bank-payment',
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
    V4DatePickerComponent,
    PhoneInputV4Component,
    SpPayeeBankDropdownComponent,
    WhiteLabelPipe,
    SpFocusAnchorDirective
  ],
  templateUrl: './bank-payment.component.html',
  styleUrl: './bank-payment.component.scss'
})
export class BankPaymentComponent {
  // ── Dependencies ──
  private readonly destroyRef = inject(DestroyRef);

  readonly sendStateService = inject(SendStateService);
  readonly bankPaymentService = inject(BankPaymentService);
  readonly isApprovedReadOnly = input<boolean>(false);

  // ── Form ──
  readonly form = this.bankPaymentService.detailsForm;

  // ── Computed ──
  private readonly method = this.sendStateService.methodId;

  readonly isAch = computed(() => this.method() === 'ach');
  readonly isWire = computed(() => this.method() === 'wire');

  /**
   * The vendor picks how they are paid, so this payment names no payee bank — the
   * old form has no field for one (let-payee-choose-details html).
   */
  readonly isLetPayeeChoose = computed(
    () => this.method() === 'let-payee-choose'
  );

  /** ACH and wire land in a bank account; vendor-decide does not. */
  readonly needsPayeeBank = computed(() => !this.isLetPayeeChoose());

  /** Only a wire insists on a memo; ACH and vendor-decide leave it optional. */
  readonly needsMemo = computed(() => this.isWire() || this.isLetPayeeChoose());

  /**
   * Vendor-decide allows 150 — the `memoMaxLength` its old component declares (L71)
   * — where an ACH or a wire stops at 100.
   */
  readonly memoMaxLength = computed(() => (this.isLetPayeeChoose() ? 150 : 100));

  // ── Template constants ──
  readonly InfoIcon = Info;
  readonly HistoryIcon = History;
  readonly MinusIcon = Minus;
  readonly PlusIcon = Plus;

  readonly frequencies = RECURRING_FREQUENCIES;
  readonly recurringEndOptions = RECURRING_END_IDS;
  readonly minStartDate = tomorrow();
  readonly invoiceTooltip = INVOICE_TOOLTIP;

  /** The category dropdown's own id-resolver, handed over when its list is in. */
  private setCategoryById?: (id: string) => void;

  constructor() {
    // Re-apply required-ness whenever the method changes.
    effect(
      () => {
        this.bankPaymentService.applyMethodValidators(this.method());
      },
      { allowSignalWrites: true }
    );

    this.form.controls.sendSms.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.bankPaymentService.applySmsValidators());

    // Prefill the SMS number from the payee — `applySmsValidators` blanks it, so this must
    // keep putting it back. Email and id are shared; SharedDetailsSyncService seeds those.
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
  }


  onCategoryReady(event: IV3DropDownOnReady): void {
    this.setCategoryById = event.setItemWithId;

    const id = this.sendStateService.preferredCategoryId();
    if (id && event.setItemWithId) {
      event.setItemWithId(id);
    }
  }

  onBankListSelected(bank: IPayeeBankDetails | null): void {
    selectPayeeBank(this.sendStateService, bank);
  }

  /** The bank list resolved whether the selected bank can take a wire. */
  onWireAllowedChange(allowed: boolean): void {
    setWireAllowed(this.sendStateService, allowed);
  }

  // -------------------------------------------------------------------------
  // Recurring schedule
  // -------------------------------------------------------------------------

  selectRecurringEnd(id: string): void {
    this.form.controls.recurringEndSelect.setValue(id);
  }

}
