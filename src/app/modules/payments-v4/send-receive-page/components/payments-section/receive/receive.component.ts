import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  ViewChild,
  afterNextRender,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { distinctUntilChanged, finalize } from 'rxjs';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  LucideAngularModule,
  Wallet,
  Info,
  SquarePen
} from 'lucide-angular';
import { NgxMaskDirective } from 'ngx-mask';

import { IBankDropdown, IBankQrCode } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import {
  IPayeeDropdown,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { AddPayeeModalV4Component } from 'src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { IRecurringDetails } from 'src/app/modules/payments/model/payments';
// eslint-disable-next-line import/no-cycle
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { INewReceivePayment } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { V4PaymentLinksCreateComponent } from 'src/app/modules/v4-pages/v4-payment-links/components/v4-payment-links-create/v4-payment-links-create.component';
import { AddEmailPayeeModalV4Component } from 'src/app/shared/modal/process-modal/add-email-payee-modal-v4/add-email-payee-modal-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { PaymentSecuredBadgeComponent } from '../shared/payment-secured-badge/payment-secured-badge.component';

import { FieldFocusRegistry } from '../send/field-focus/field-focus.registry';
import { focusField, shakeElement } from '../send/field-focus/shake';
import { SpFocusAnchorDirective } from '../send/field-focus/sp-focus-anchor.directive';
import {
  ConfirmPaymentModalComponent,
  type IConfirmPaymentModalData
} from '../send/confirm-modal/confirm-payment-modal.component';
import { ScheduleNotifyComponent } from '../send/schedule-notify/schedule-notify.component';
import {
  END_AFTER_COUNT,
  END_UNTIL_CANCELLED,
  RECURRING_END_IDS
} from '../send/shared/models/recurring';
import { SpBankAcDropdownComponent } from '../send/dropdowns/sp-bank-ac-dropdown/sp-bank-ac-dropdown.component';
import { SpPayeeDropdownComponent } from '../send/dropdowns/sp-payee-dropdown/sp-payee-dropdown.component';
import { BankPaymentService } from '../send/bank/services/bank-payment.service';
import { AccountVerificationService } from '../send/shared/services/account-verification.service';
import { SendStateService } from '../send/shared/services/send-state.service';
import { SharedDetailsSyncService } from '../send/shared/services/shared-details-sync.service';
import { ReceiveStateService } from './shared/receive-state.service';
import { INVOICE_TOOLTIP } from '../send/shared/models/details-form';

type ReceiveFrom = 'payee' | 'email' | 'sms';

interface ReceiveTab {
  id: ReceiveFrom;
  name: string;
}

/** A payment cannot be requested for less than this. */
const MIN_AMOUNT = 0.1;

/** The smallest amount the submit gate accepts once the mask is stripped. */
const MIN_SUBMIT_AMOUNT = 0.01;

const PHONE_MIN_LENGTH = 10;

/** The QR image is rendered by a lambda, which takes the payment URL as a query param. */
const QR_CODE_ENDPOINT =
  'https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr';

/** "No payment link on this bank account" — offer to create one. */
const ERR_LINK_NOT_FOUND = 110;

/** The account is not verified for receiving payments. */
const ERR_VERIFICATION_REQUIRED = 106;

/** The frequencies this endpoint accepts, in the app-wide codes. */
const RECEIVE_FREQUENCIES = [
  { value: '3', label: 'Monthly' },
  { value: '5', label: 'Bi-Weekly' },
  { value: '2', label: 'Weekly' }
] as const;

/** Canonical code -> the code `INewReceivePayment.frequency` expects. */
const RECEIVE_FREQUENCY_CODES: Record<string, string> = {
  2: '1', // Weekly
  5: '2', // Bi-Weekly
  3: '3' // Monthly
};

/**
 * Canonical `end_select` -> the code `INewReceivePayment.endSelect` expects.
 * The shared recurring modal speaks the ACH scale ('1' after a count, '3' until
 * cancelled); this endpoint only knows '1' and '2'.
 */
const RECEIVE_END_SELECT_CODES: Record<string, string> = {
  [END_UNTIL_CANCELLED]: '1', // Pay until I cancel
  [END_AFTER_COUNT]: '2' // Pay for a set number of payments
};

const futureDateValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(control.value);
  inputDate.setHours(0, 0, 0, 0);
  return inputDate <= today ? { futureDate: true } : null;
};

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/** Strip the display mask from a money string. */
function toRawAmount(value: unknown): string {
  return String(value).replace(/[$,]/g, '');
}

@Component({
  selector: 'app-receive',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    CommonAmountInputV4Component,
    PaymentSecuredBadgeComponent,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    SpPayeeDropdownComponent,
    SpBankAcDropdownComponent,
    ScheduleNotifyComponent,
    SpFocusAnchorDirective,
    V4ControlMessageComponent,
    V4DatePickerComponent,
    NgxMaskDirective
  ],
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiveComponent implements OnInit {
  // -------------------------------------------------------------------------
  // Dependency injection
  // -------------------------------------------------------------------------

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly hostEl = inject(ElementRef);
  private readonly fieldFocus = inject(FieldFocusRegistry);
  private readonly router = inject(Router);
  private readonly matDialog = inject(MatDialog);
  private readonly datePipe = inject(DatePipe);
  private readonly bankService = inject(BankService);
  private readonly v4AlertService = inject(V4AlertService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly paymentsV4Service = inject(PaymentsV4Service);
  private readonly payeeService = inject(PayeeService);
  private readonly payeeDataService = inject(PayeeDataV35Service);
  private readonly localStorageService = inject(LocalStorageService);

  private readonly sendStateService = inject(SendStateService);
  private readonly sharedDetailsSyncService = inject(SharedDetailsSyncService);
  private readonly bankPaymentService = inject(BankPaymentService);
  private readonly receiveStateService = inject(ReceiveStateService);
  private readonly accountVerificationService = inject(
    AccountVerificationService
  );

  // -------------------------------------------------------------------------
  // ViewChild
  // -------------------------------------------------------------------------

  @ViewChild('payeeDropdown')
  payeeDropdownV4Component: PayeeDropdownV4Component;

  // -------------------------------------------------------------------------
  // Signals
  // -------------------------------------------------------------------------

  readonly from = signal<ReceiveFrom>('payee');
  readonly editable = signal<boolean>(false);
  readonly loading = signal(false);
  readonly qrLoading = signal(false);
  readonly selectedBank = signal<IBankDropdown | null>(null);

  private readonly selectedPayee = signal<IPayeeDropdown | null>(null);

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  readonly memoMaxLength = 100;
  readonly minStartDate = getTomorrowDate();
  readonly minChequeDate = this.datePipe.transform(
    new Date(),
    'yyyy-MM-dd'
  ) as string;

  readonly form = this.fb.group({
    amount: ['', [Validators.required, Validators.min(MIN_AMOUNT)]],
    payee: [null as IPayeeDropdown | null, [Validators.required]],
    email: [''],
    phone: [''],
    bankAc: [null as IBankDropdown | null, [Validators.required]],
    invoice: ['', [Validators.required]],
    chequeDate: [this.minChequeDate, [Validators.required]],
    memo: ['', [Validators.required, Validators.maxLength(this.memoMaxLength)]],

    // Written by <app-schedule-notify>, which addresses controls by these names.
    needRecurring: [false],
    recurringFrequency: ['3'],
    recurringStartDate: [this.minStartDate, futureDateValidator],
    recurringEndSelect: [END_UNTIL_CANCELLED],
    recurringCount: [null as number | null]
  });

  readonly recurringFrequencies = RECEIVE_FREQUENCIES;
  readonly invoiceTooltip = INVOICE_TOOLTIP;
  readonly recurringEndOptions = RECURRING_END_IDS;

  // Read from the control so the marker cannot drift from the validator.
  memoRequired(): boolean {
    return this.form.controls.memo.hasValidator(Validators.required);
  }

  memoLength(): number {
    return (this.form.controls.memo.value ?? '').length;
  }

  // -------------------------------------------------------------------------
  // Public properties
  // -------------------------------------------------------------------------

  readonly WalletIcon = Wallet;
  readonly InfoIcon = Info;
  readonly EditableIcon = SquarePen;

  readonly tabs: ReceiveTab[] = [
    { id: 'payee', name: 'Payer' },
    { id: 'email', name: 'Email' },
    { id: 'sms', name: 'SMS' }
  ];

  isNumberMasked = false;

  // -------------------------------------------------------------------------
  // Private properties
  // -------------------------------------------------------------------------

  private payeeDetails: IViewPayee | undefined;
  private paymentLink = '';
  private qrCodeLink = '';
  private linkId = '';
  private selectedBankId = '';

  /** Guards the two-way sync with the Send form against re-entering itself. */
  private syncing = false;

  // -------------------------------------------------------------------------
  // Lifecycle hooks
  // -------------------------------------------------------------------------

  ngOnInit(): void {
    this.applyInitiatePayee();
    this.watchPayee();
    this.watchBank();
    this.setupSync();
    this.hostPayeeEditModal();
    this.watchFocusRequests();
  }

  // From ngOnInit, not the constructor, so the anchors are registered first.
  private watchFocusRequests(): void {
    effect(
      () => {
        const request = this.receiveStateService.focusRequest();
        if (!request) {
          return;
        }
        afterNextRender(() => this.revealField(request.key), {
          injector: this.injector
        });
      },
      { injector: this.injector }
    );
  }

  private revealField(key: string): void {
    // The start date lives in the schedule modal, so point at the row that opens it.
    const anchor = key === 'recurringStartDate' ? 'recurring' : key;
    const host = this.hostEl.nativeElement as HTMLElement;
    const el =
      this.fieldFocus.resolve(anchor) ??
      host.querySelector<HTMLElement>(`[data-field="${anchor}"]`) ??
      host.querySelector<HTMLElement>(`[formcontrolname="${key}"]`);
    if (!el) {
      return;
    }
    focusField(el);
    shakeElement(el);
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  setFrom(id: ReceiveFrom): void {
    this.from.set(id);
    const { payee } = this.form.controls;

    if (id !== 'payee') {
      this.selectedPayee.set(null);
      payee.setValue(null, { emitEvent: false });
      this.sendStateService.coreForm.controls.payee.setValue(null, {
        emitEvent: false
      });
      this.sendStateService.clearPayee();
      this.payeeDetails = undefined;
      payee.clearValidators();
    } else {
      payee.setValidators([Validators.required]);
    }
    payee.updateValueAndValidity({ emitEvent: false });
    payee.markAsUntouched();

    const emailValidators =
      id === 'email'
        ? [ValidationService.emailValidator, Validators.required]
        : [];
    const phoneValidators =
      id === 'sms'
        ? [Validators.required, Validators.minLength(PHONE_MIN_LENGTH)]
        : [];

    const { email, phone } = this.form.controls;
    email.setValidators(emailValidators);
    email.updateValueAndValidity();
    email.markAsUntouched();
    phone.setValidators(phoneValidators);
    phone.updateValueAndValidity();
    phone.markAsUntouched();
  }

  toggleEditable(): void {
    this.editable.update((v) => !v);
  }

  onPayeeReady(event: IV3DropDownOnReady): void {
    const payeeId = this.form.controls.payee.value?.encrypted_id;
    if (payeeId && event.setItemWithId) {
      event.setItemWithId(payeeId);
    }
  }

  onBankDropdownReady(event: IV3DropDownOnReady): void {
    const selectedBank = this.form.controls.bankAc.value;
    if (event?.setItemWithId && selectedBank && selectedBank?.id) {
      event.setItemWithId(selectedBank?.id);
    }
  }

  onSend(): void {
    this.submit();
  }

  // -------------------------------------------------------------------------
  // Watchers
  // -------------------------------------------------------------------------

  private watchPayee(): void {
    this.form.controls.payee.valueChanges
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            (a as IPayeeDropdown | null)?.id ===
            (b as IPayeeDropdown | null)?.id
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((payee) => {
        if (this.syncing) {
          return;
        }
        this.onPayeeSelected((payee as IPayeeDropdown) ?? null);
        this.writeToState('payee', payee ?? null);
      });
  }

  private watchBank(): void {
    this.form.controls.bankAc.valueChanges
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            (a as IBankDropdown | null)?.id === (b as IBankDropdown | null)?.id
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((bank) => {
        this.onBankSelected((bank as IBankDropdown) ?? null);
      });
  }

  private hostPayeeEditModal(): void {
    this.payeeService.openPayeeEditModal
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((request) => {
        if (!request) {
          return;
        }
        const page = typeof request === 'object' ? request.page : undefined;
        const payee = this.form.controls.payee.value;
        if (payee?.id) {
          this.openPayeeEditModal(payee.id, page);
        }
      });
  }

  // -------------------------------------------------------------------------
  // Two-way sync with the Send form
  // -------------------------------------------------------------------------

  private setupSync(): void {
    const core = this.sendStateService.coreForm.controls;

    const sharedAmount = core.amount.value;
    if (sharedAmount) {
      this.form.controls.amount.setValue(sharedAmount, { emitEvent: false });
    }
    const sharedPayee = core.payee.value;
    if (sharedPayee) {
      this.form.controls.payee.setValue(sharedPayee, { emitEvent: false });
      this.selectedPayee.set(sharedPayee);
    }
    const sharedMemo = this.bankPaymentService.detailsForm.controls.memo.value;
    if (sharedMemo) {
      this.form.controls.memo.setValue(sharedMemo, { emitEvent: false });
    }

    this.form.controls.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.writeToState('amount', value ?? ''));

    this.form.controls.memo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (this.syncing) {
          return;
        }
        this.syncing = true;
        this.sharedDetailsSyncService.seedMemo(value ?? '');
        this.syncing = false;
      });

    core.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.writeToForm('amount', value ?? ''));

    core.payee.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.writeToForm('payee', value ?? null));

    this.bankPaymentService.detailsForm.controls.memo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.writeToForm('memo', value ?? ''));
  }

  private writeToState(field: 'amount' | 'payee', value: unknown): void {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    this.sendStateService.coreForm.controls[field].setValue(value as never, {
      emitEvent: false
    });
    this.syncing = false;
  }

  private writeToForm(
    field: 'amount' | 'payee' | 'memo',
    value: unknown
  ): void {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    this.form.controls[field].setValue(value as never, { emitEvent: false });
    if (field === 'payee') {
      this.selectedPayee.set((value as IPayeeDropdown) ?? null);
    }
    this.syncing = false;
  }

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  private applyInitiatePayee(): void {
    const form = this.paymentsService.initiatePaymentForm;
    if (!form || !Object.keys(form).length) {
      return;
    }

    if (form.bankAc?.id) {
      this.form.controls.bankAc.setValue(form.bankAc);
    }

    if (form.payee?.encrypted_id) {
      this.form.controls.payee.setValue(form.payee);
    }
    this.paymentsService.initiatePaymentForm = {};
  }

  private onPayeeSelected(payee: IPayeeDropdown | null): void {
    this.selectedPayee.set(payee);
    if (payee?.id && payee?.name !== 'Payee Name') {
      this.sendStateService.loadPayee(payee.id);
      this.getPayeeDetails(payee.id);
    } else {
      this.sendStateService.clearPayee();
      this.payeeDetails = undefined;
    }
  }

  private onBankSelected(bank: IBankDropdown | null): void {
    this.selectedBank.set(bank);
    if (bank?.id) {
      this.selectedBankId = bank.id;
      this.getQRCode(bank.id);
    } else {
      this.linkId = '';
      this.selectedBankId = '';
      this.receiveStateService.clearQrCode();
    }
  }

  // -------------------------------------------------------------------------
  // Payee
  // -------------------------------------------------------------------------

  private openPayeeEditModal(payeeId: string, page?: string): void {
    this.matDialog
      .open(AddPayeeModalV4Component, {
        maxWidth: '700px',
        width: '95%',
        maxHeight: '90vh',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { edit: true, id: payeeId, page }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.success) {
          this.reselectEditedPayee(result);
        }
      });
  }

  /**
   * Re-reads the edited payee. Unlike Send, `watchPayee` here is keyed by id, so
   * re-setting the same payee would be dropped by `distinctUntilChanged` and never
   * refetch — so the details are reloaded directly (mirrors `addEmailToPayee`).
   */
  private reselectEditedPayee(result: IPayeeDropdown): void {
    const current = this.form.controls.payee.value;
    const updated = { ...current, ...result } as IPayeeDropdown;

    this.selectedPayee.set(updated);
    this.form.controls.payee.setValue(updated, { emitEvent: false });
    this.writeToState('payee', updated);

    if (updated.id) {
      this.sendStateService.loadPayee(updated.id);
      this.getPayeeDetails(updated.id);
    }
  }

  private getPayeeDetails(payeeId: string | undefined): void {
    if (!payeeId) {
      return;
    }
    this.payeeDetails = undefined;
    this.payeeService
      .showPayee(payeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.success) {
          return;
        }
        this.payeeDetails = res.data;
        if (res.data.email === null || res.data.email === '') {
          this.promptAddPayeeEmail(true);
        }
      });
  }

  /** Raised on selection with a title, and again at submit without one. */
  private promptAddPayeeEmail(withTitle: boolean): void {
    this.v4AlertService
      .warningAlert({
        ...(withTitle && { title: 'Error' }),
        content: 'Please add email address to selected Payee',
        doneMsg: 'Add Now',
        isCancel: true
      })
      .afterClosed()
      .subscribe((response) => {
        if (response) {
          this.addEmailToPayee(this.payeeDetails);
        }
      });
  }

  private addEmailToPayee(viewPayeeData: IViewPayee | undefined): void {
    this.matDialog
      .open(AddEmailPayeeModalV4Component, {
        disableClose: true,
        data: viewPayeeData,
        width: '550px',
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((email: string | false) => {
        const currentPayee = this.selectedPayee();
        if (!email || !currentPayee?.id) {
          return;
        }

        const updatedPayee: IPayeeDropdown = { ...currentPayee, email };
        this.selectedPayee.set(updatedPayee);
        this.form.controls.payee.setValue(updatedPayee, { emitEvent: false });
        this.payeeDataService.editedPayeeSignal.set(updatedPayee);
        this.payeeDataService.payeeDataSignal.set(updatedPayee);
        this.getPayeeDetails(updatedPayee.id);
      });
  }

  // -------------------------------------------------------------------------
  // QR code / payment link
  // -------------------------------------------------------------------------

  private getQRCode(id: string, showPermissionAlert = false): void {
    const headers = new HttpHeaders().set('disablePermission', 'true');
    this.qrLoading.set(true);

    this.bankService
      .qetQrCode(id, headers)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.qrLoading.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            const qrCodeDetails: IBankQrCode = res.data[0];
            this.generateQRCode(qrCodeDetails.payment_url, qrCodeDetails.id);
            this.paymentLink = qrCodeDetails.payment_url;
            this.linkId = qrCodeDetails.id;
          }
        },
        error: (err) => {
          this.receiveStateService.clearQrCode();
          if (err.error?.errorCode === ERR_LINK_NOT_FOUND) {
            this.linkId = '';
            this.promptCreatePaymentLink();
          }
          if (showPermissionAlert && err.error?.permissionType) {
            this.v4AlertService.warningAlert({
              content: `You don't have permission to do this action.`
            });
          }
        }
      });
  }

  private promptCreatePaymentLink(): void {
    this.v4AlertService
      .confirmAlert({
        title: 'Link not found !',
        content: 'Please add a payment link to the bank account',
        doneMsg: 'Generate a link',
        cancelMsg: 'No, cancel'
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.matDialog
          .open(V4PaymentLinksCreateComponent, {
            data: { selectedBankId: this.selectedBankId },
            panelClass: 'paddingless-modal-rounded',
            width: '600px'
          })
          .afterClosed()
          .subscribe((linkRes) => {
            if (linkRes) {
              this.getQRCode(this.selectedBankId);
            }
          });
      });
  }

  private generateQRCode(url: string, id: string): void {
    this.qrCodeLink = `${QR_CODE_ENDPOINT}?cht=qr&chl=${url}&chs=300x300`;
    this.receiveStateService.setQrCode({
      qrCode: this.qrCodeLink,
      // The copyable link is the payment URL, not the lambda that draws its QR.
      paymentLink: url,
      bank: this.selectedBank()?.nickName ?? '',
      paymentId: id
    });
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  private submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.receiveStateService.requestFieldFocus(this.firstInvalidKey());
      return;
    }

    // The only gate left that a Validators.required above does not already cover.
    if (this.from() === 'payee' && this.payeeDetails && !this.payeeDetails.email) {
      this.promptAddPayeeEmail(false);
      return;
    }

    const rawAmount = toRawAmount(this.form.controls.amount.value);
    if (!rawAmount || Number(rawAmount) < MIN_SUBMIT_AMOUNT) {
      this.form.controls.amount.markAsTouched();
      this.receiveStateService.requestFieldFocus('amount');
      return;
    }

    const gettingStartedData =
      this.localStorageService.getItem('gettingStartedData');
    if (gettingStartedData?.verification === 0) {
      this.promptEmailPhoneVerification();
      return;
    }

    if (!this.linkId) {
      this.getQRCode(this.selectedBankId, true);
      return;
    }

    this.confirmThenRequest(rawAmount);
  }

  // Ordered by where the fields sit on screen, not by the form declaration.
  private firstInvalidKey(): string | null {
    const order = [
      // 1 · Amount
      'amount',
      // 2 · Route + counterparty + memo
      'payee',
      'email',
      'phone',
      'bankAc',
      'memo',
      // 3 · Request details
      'invoice',
      'chequeDate',
      'recurringStartDate'
    ];
    const controls = this.form.controls as unknown as Record<
      string,
      AbstractControl
    >;
    return order.find((key) => controls[key]?.invalid) ?? null;
  }

  private confirmThenRequest(rawAmount: string): void {
    const isRecurring = this.recurrence().on ? 1 : 0;
    const body = this.requestBody(rawAmount);

    const ref = this.matDialog.open<
      ConfirmPaymentModalComponent,
      IConfirmPaymentModalData,
      boolean
    >(ConfirmPaymentModalComponent, {
      width: '510px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        from: this.recipientLabel(),
        toBankAccount: this.selectedBank()?.nickName ?? '',
        amount: rawAmount,
        mode: 'receive',
        recurringDetails: this.buildConfirmationRecurringDetails(isRecurring)
      }
    });

    // The modal never closes itself on confirm; it emits and leaves its spinner
    // running, so the caller dismisses it. Cancel closes false and skips this.
    ref.componentInstance.confirmed.subscribe(() => {
      ref.close();
      this.requestPayment(body);
    });
  }

  private recipientLabel(): string {
    if (this.from() === 'email') {
      return this.form.controls.email.value || '';
    }
    if (this.from() === 'sms') {
      return this.form.controls.phone.value || '';
    }
    return this.payeeDetails?.name ?? '';
  }

  private recurrence(): {
    on: boolean;
    frequency: string;
    startDate: string;
    endSelect: string;
    count: number | null;
  } {
    const c = this.form.controls;
    const endSelect = c.recurringEndSelect.value || END_UNTIL_CANCELLED;
    return {
      on: !!c.needRecurring.value,
      frequency: c.recurringFrequency.value || '3',
      startDate: c.recurringStartDate.value || '',
      endSelect,
      count: endSelect === END_AFTER_COUNT ? c.recurringCount.value : null
    };
  }

  private requestBody(rawAmount: string): INewReceivePayment {
    const r = this.recurrence();

    let requestPhone = '';
    if (this.from() === 'sms') {
      requestPhone = this.phoneNumberMask(
        (this.form.controls.phone.value || '').replace(/\D/g, '')
      );
    }

    return {
      amount: rawAmount,
      directLink: this.paymentLink,
      editable: this.editable() ? 1 : 0,
      // The only place this endpoint's own end_select scale is spoken.
      endSelect: r.on
        ? (RECEIVE_END_SELECT_CODES[r.endSelect] ??
          RECEIVE_END_SELECT_CODES[END_UNTIL_CANCELLED])
        : RECEIVE_END_SELECT_CODES[END_UNTIL_CANCELLED],
      link: this.linkId,
      memo: this.form.controls.memo.value || '',
      payerEmail: this.payeeDetails?.email ?? '',
      payerId: this.selectedPayee()?.id ?? '',
      paymentMethod: 2,
      recurring: r.on ? 1 : 0,
      requestEmail:
        this.from() === 'email' ? this.form.controls.email.value || '' : '',
      requestPaymentType: this.from(),
      requestPhone,
      senderBankAccount: this.selectedBankId,
      startDate: r.on ? r.startDate : '',
      months: r.on && r.count != null ? r.count : '',
      invoice_number: this.form.controls.invoice.value || '',
      // The only place this endpoint's own frequency scale is spoken.
      frequency: r.on
        ? (RECEIVE_FREQUENCY_CODES[r.frequency] ?? r.frequency)
        : '',
      cheque_date: this.form.controls.chequeDate.value || ''
    };
  }

  private buildConfirmationRecurringDetails(
    isRecurring: number
  ): IRecurringDetails {
    const r = this.recurrence();
    return {
      is_recurring_value: isRecurring,
      recurring: {
        frequency: r.frequency,
        start_date: r.startDate,
        count: r.count != null ? String(r.count) : '',
        end_select: r.endSelect
      }
    };
  }

  private requestPayment(body: INewReceivePayment): void {
    this.loading.set(true);
    this.paymentsService.isPaymentProcessingSubject.next(true);

    this.bankService
      .requestPayment(body)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.paymentsService.isPaymentProcessingSubject.next(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.paymentsV4Service.openPaymentSuccessModal({
            mode: 'receive',
            amount: body.amount,
            from: this.payeeDetails?.name ?? '',
            toBankAccount: this.selectedBank()?.nickName ?? ''
          });
          this.resetAfterSuccess();
        },
        error: (err) => {
          if (err.error?.errorCode === ERR_VERIFICATION_REQUIRED) {
            this.promptAccountVerification(err.error.errorMsg);
          }
        }
      });
  }

  private resetAfterSuccess(): void {
    this.syncing = true;
    this.form.reset({
      amount: '',
      payee: null,
      email: '',
      phone: '',
      bankAc: null,
      invoice: '',
      memo: '',
      chequeDate: this.minChequeDate,
      needRecurring: false,
      recurringFrequency: '3',
      recurringStartDate: this.minStartDate,
      recurringEndSelect: END_UNTIL_CANCELLED,
      recurringCount: null
    });
    this.syncing = false;

    this.selectedPayee.set(null);
    this.selectedBank.set(null);
    this.payeeDetails = undefined;
    this.paymentLink = '';
    this.qrCodeLink = '';
    this.linkId = '';
    this.selectedBankId = '';
    this.editable.set(false);
    this.payeeDropdownV4Component?.clearSelection();

    this.receiveStateService.clearQrCode();
    this.sendStateService.clearPayee();
    this.sendStateService.coreForm.controls.amount.setValue('', {
      emitEvent: false
    });
    this.sendStateService.coreForm.controls.payee.setValue(null, {
      emitEvent: false
    });
  }

  // -------------------------------------------------------------------------
  // Alerts
  // -------------------------------------------------------------------------

  private promptAccountVerification(errorMsg: string): void {
    this.v4AlertService
      .warningAlert({
        title: 'Error',
        content: errorMsg,
        doneMsg: 'Verify Now',
        isCancel: true,
        cancelMsg: 'Cancel'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.router.navigate(['/v4/manage/verification/index']);
        }
      });
  }

  private promptEmailPhoneVerification(): void {
    this.v4AlertService
      .warningAlert({
        title: 'Verification Required',
        content: 'Please verify your phone number to complete this payment.',
        doneMsg: 'Verify Now',
        isOk: true,
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.accountVerificationService
          .openEmailPhoneVerificationModal()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((isVerified) => {
            if (isVerified) {
              this.submit();
            }
          });
      });
  }

  // -------------------------------------------------------------------------
  // Utility methods
  // -------------------------------------------------------------------------

  private phoneNumberMask(phone: string): string {
    const num = String(phone);
    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);
    this.isNumberMasked = true;
    return `(${num1}) ${num2}-${num3}`;
  }
}
