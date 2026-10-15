import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { fromEvent, finalize } from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  X,
  CircleCheck,
  Pencil,
  CircleAlert
} from 'lucide-angular';

import {
  IShowPayeeDetails,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';

import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PaymentsInTabService } from 'src/app/modules/v4/payments-in/services/payments-in-tab.service';
import { AddEmailPayeeModalV4Component } from 'src/app/shared/modal/process-modal/add-email-payee-modal-v4/add-email-payee-modal-v4.component';
import { AddPayeeBankAccountV4Component } from 'src/app/shared/modal/process-modal/add-payee-bank-account-v4/add-payee-bank-account-v4.component';
import { ContactSupportModalComponent } from 'src/app/shared/modal/contact-support-modal/contact-support-modal.component';

@Component({
  selector: 'app-v4-run-ach-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonAmountInputV4Component,
    PayeeDropdownV4Component,
    BankAcDropdownV4Component,
    CommonButtonV4Component,
    V4DatePickerComponent,
    V4CommonDropDownSelectorComponent,
    LucideAngularModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTooltipModule,
    MatDialogClose,
    CurrencyPipe,
    TitleCasePipe
  ],
  templateUrl: './v4-run-ach-modal.component.html',
  styleUrl: './v4-run-ach-modal.component.scss'
})
export class V4RunAchModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4RunAchModalComponent>);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private requestPaymentsService = inject(RequestPaymentsService);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);

  private sharedService = inject(SharedService);
  private bankModalService = inject(BankModalService);
  private payeeModalService = inject(PayeeModalService);
  private paymentsInTabService = inject(PaymentsInTabService);
  private destroyRef = inject(DestroyRef);

  // Lucide icons
  readonly XIcon = X;
  readonly CircleCheckIcon = CircleCheck;
  readonly PencilIcon = Pencil;
  readonly CircleAlertIcon = CircleAlert;

  // Form
  manualAch!: FormGroup;
  payee = new FormControl();
  selectedBank = new FormControl();

  // ViewChildren for closing dropdowns on scroll
  bankDropdown = viewChild(BankAcDropdownV4Component);
  payeeDropdown = viewChild(PayeeDropdownV4Component);

  // State
  selectedPayee: IViewPayee = {} as IViewPayee;
  selectedPayeeId = '';
  selectedBankId = '';
  isPayeeDataLoading = signal(false);
  isProceedLoading = signal(false);
  paymentSuccess = signal(false);
  isDropdownOpen = signal(false);
  bankAchError = signal('');
  actionType: 'process' | 'schedule' | 'recurring' | null = null;

  // Payment mode: process (default), schedule, or recurring
  paymentMode: 'process' | 'schedule' | 'recurring' = 'process';

  // Schedule fields
  scheduleDate = '';
  minDate = '';

  // Recurring fields
  frequencyOptions = [
    { value: '3', label: 'Monthly' },
    { value: '6', label: 'Bimonthly' },
    { value: '7', label: 'Quarterly' },
    { value: '5', label: 'Biweekly' },
    { value: '2', label: 'Weekly' },
    { value: '1', label: 'Daily' }
  ];

  frequencyDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Frequency',
    displayField: 'label',
    outputField: 'value'
  };

  recurringFrequency = '3';
  recurringStartDate = '';
  recurringEndSelect = '3'; // '3' = pay until cancel, '1' = pay for X times
  recurringCount: number | '' = 1;

  ngOnInit(): void {
    this.initForm();
    this.subscribePayeeChanges();
    this.subscribeBankChanges();
    this.initDates();
    this.closeDropdownsOnScroll();
  }

  private closeDropdownsOnScroll(): void {
    fromEvent(document, 'scroll', { capture: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!this.isDropdownOpen()) return;
        const target = event.target as HTMLElement;
        if (target?.closest?.('.ng-dropdown-panel')) return;
        this.bankDropdown()?.close();
        this.payeeDropdown()?.close();
      });
  }

  private initDates(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const datePipe = new DatePipe('en-US');
    this.minDate = datePipe.transform(tomorrow, 'yyyy-MM-dd') || '';
    this.scheduleDate = this.minDate;
    this.recurringStartDate = this.minDate;
  }

  togglePaymentMode(mode: 'schedule' | 'recurring', checked: boolean): void {
    this.paymentMode = checked ? mode : 'process';
  }

  private initForm(): void {
    this.manualAch = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      memo: ['', [Validators.required, Validators.maxLength(150)]],
      isRecurringValue: [''],
      payerAccountNumber: [''],
      payerRoutingNumber: [''],
      payerAccountType: [''],
      payerId: ['', Validators.required],
      payerEmail: [''],
      senderBankAccountId: ['', Validators.required],
      recurring: [''],
      isSameDay: [false]
    });
  }

  private subscribePayeeChanges(): void {
    this.payee.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.id && res.id !== this.selectedPayeeId) {
          this.selectedPayeeId = res.id;
          this.getSelectedPayee(res);
        }
      });
  }

  private subscribeBankChanges(): void {
    this.selectedBank.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedBankId) return;
          this.selectedBankId = res.id;
          this.getSelectedBank(res);
        }
      });
  }

  // ── Payee handling ──

  getSelectedPayee(env: { name: string; id: string }): void {
    if (env && env.name !== 'Payee Name') {
      this.selectPayeeData(env.id);
    } else {
      this.selectedPayee = {} as IViewPayee;
    }
  }

  selectPayeeData(id: string): void {
    this.isPayeeDataLoading.set(true);
    this.payeeService
      .showPayee(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isPayeeDataLoading.set(false))
      )
      .subscribe((res) => {
        this.selectedPayee = res.data;
        this.syncPayeeDropdown(res.data);

        this.manualAch.controls.payerId.setValue(this.selectedPayee.id);

        // Validate email
        if (!this.selectedPayee.email) {
          this.failWarning();
          return;
        }

        this.manualAch.controls.payerEmail.setValue(this.selectedPayee.email);
        this.selectedPayee.hiddenAccountNum = this.getHiddenNum(
          this.selectedPayee.accountNumber
        );

        // Validate bank details
        if (
          !this.selectedPayee.accountNumber ||
          !this.selectedPayee.accountType ||
          !this.selectedPayee.routingNumber
        ) {
          this.AddPayeeMissing();
        } else {
          this.manualAch.controls.payerAccountNumber.setValue(
            this.selectedPayee.accountNumber
          );
          this.manualAch.controls.payerRoutingNumber.setValue(
            this.selectedPayee.routingNumber
          );
          this.manualAch.controls.payerAccountType.setValue(
            this.selectedPayee.accountType
          );
        }
      });
  }

  /**
   * The refetched record is the truth, but it carries only the payee's own
   * fields — merging keeps what the dropdown already holds and `showPayee` does
   * not return (payeeTypeId, isFreezed). Writing the control is what refreshes
   * the dropdown's selected label, so an email, name or nick name changed from
   * the details card is not left stale behind it.
   */
  private syncPayeeDropdown(data: IShowPayeeDetails): void {
    if (this.payee.value?.id !== data.id) return;
    this.payee.setValue({ ...this.payee.value, ...data }, { emitEvent: false });
  }

  // ── Bank handling ──

  getSelectedBank(env: {
    id: string;
    mAch: number;
    achApplicationStatus: number;
  }): void {
    if (env?.achApplicationStatus !== 1) {
      this.bankAchError.set('Manual ACH is not enabled for this bank account.');
      const modal = this.alertService.warningAlert({
        title: 'Alert!',
        content: 'ACH is not activated for this bank account.',
        doneMsg: 'Apply For ACH',
        cancelMsg: 'No, cancel!',
        isCancel: true
      });
      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.achVerificationRequiredAlert();
        } else {
          this.manualAch.controls.senderBankAccountId.reset();
          this.selectedBank.reset();
          this.manualAch.controls.senderBankAccountId.markAsTouched();
          this.selectedBankId = '';
        }
        this.bankAchError.set('');
      });
      return;
    }

    if (env?.mAch !== 1) {
      this.bankAchError.set(
        'This bank account is not eligible for Manual ACH. Please contact customer support.'
      );
      this.manualAch.controls.senderBankAccountId.reset();
      this.manualAch.controls.senderBankAccountId.markAsTouched();
      const action = this.alertService.warningAlert({
        content:
          'This bank account is not eligible for Manual ACH. Please contact customer support.',
        doneMsg: 'Contact Now',

        cancelMsg: 'Not Now',
        isCancel: true
      });
      action.afterClosed().subscribe((res) => {
        if (res) {
          this.dialog.open(ContactSupportModalComponent, {
            width: '400px',
            disableClose: true
          });
        }
        this.selectedBank.reset();
        this.selectedBankId = '';
        this.bankAchError.set('');
      });
      return;
    }

    this.bankAchError.set('');
    this.manualAch.controls.senderBankAccountId.setValue(env.id);
  }

  private achVerificationRequiredAlert(): void {
    const alert = this.alertService.warningAlert({
      content:
        'Some of your bank accounts are not approved for ACH, please apply to proceed.',
      doneMsg: 'See My Banks',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/bank-accounts/index']);
        this.dialogRef.close();
      }
    });
  }

  addNewBankAccount(): void {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.bankModalService
      .openAddBank()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankModal) => {
        if (bankModal) {
          bankModal.afterClosed().subscribe((result) => {
            if (result?.success) {
              this.sharedService.setNewBankCreatedData({
                bankAccountId: result.id
              });
              const modal = this.alertService.warningAlert({
                title: 'Alert!',
                content: 'This bank account not eligible for Manual ACH',
                doneMsg: 'Apply For ACH',
                cancelMsg: 'No,cancel!',
                isCancel: true
              });
              modal.afterClosed().subscribe((res) => {
                if (res) {
                  this.achVerificationRequiredAlert();
                } else {
                  this.manualAch.controls.senderBankAccountId.reset();
                  this.selectedBank.reset();
                }
              });
            }
          });
        }
      });
  }

  // ── Clear handlers ──

  onClearPayee(): void {
    this.manualAch.controls.payerId.reset();
    this.payee.reset();
    this.selectedPayeeId = '';
    this.manualAch.controls.payerId.markAsTouched();
    this.selectedPayee = {} as IViewPayee;
    // Also reset bank selection when payee is cleared
    this.onRemoveBank();
  }

  onRemoveBank(): void {
    this.bankAchError.set('');
    this.manualAch.controls.senderBankAccountId.reset();
    this.selectedBank.reset();
    this.selectedBankId = '';
    this.manualAch.controls.senderBankAccountId.markAsTouched();
  }

  // ── Validation helpers ──

  private validatePayee(): boolean {
    if (!this.selectedPayee.email) {
      this.failWarning();
      return false;
    }
    if (
      !this.selectedPayee.accountNumber ||
      !this.selectedPayee.accountType ||
      !this.selectedPayee.routingNumber
    ) {
      this.AddPayeeMissing();
      return false;
    }
    return true;
  }

  failWarning(): void {
    const response = this.alertService.failedAlert({
      title: 'Error',
      content: 'Please add Email Address to Selected Client',
      doneMsg: 'OK'
    });
    response.afterClosed().subscribe((res) => {
      if (res) {
        this.AddEmailToPayee(this.selectedPayee);
      }
    });
  }

  AddEmailToPayee(data: IViewPayee): void {
    const dialogRef = this.dialog.open(AddEmailPayeeModalV4Component, {
      width: '550px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.selectPayeeData(this.selectedPayee.id);
      }
    });
  }

  AddPayeeMissing(): void {
    const dialogRef = this.dialog.open(AddPayeeBankAccountV4Component, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      data: { ...this.selectedPayee, isPayer: true }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectPayeeData(this.selectedPayee.id);
      }
    });
  }

  // ── Actions ──

  submitPayment(): void {
    this.manualAch.markAllAsTouched();
    if (this.manualAch.invalid) return;
    if (!this.validatePayee()) return;

    if (this.paymentsService.checkForComplianceFreeze()) {
      this.paymentsService.openComplianceFreezeModal();
      return;
    }

    switch (this.paymentMode) {
      case 'process':
        this.processNow();
        break;
      case 'schedule':
        this.processSchedule();
        break;
      case 'recurring':
        this.processRecurring();
        break;
      default:
        break;
    }
  }

  private processNow(): void {
    this.manualAch.controls.recurring.setValue('');
    this.manualAch.controls.isRecurringValue.setValue(0);
    this.actionType = 'process';
    this.isProceedLoading.set(true);
    this.doAction();
  }

  private processSchedule(): void {
    if (!this.scheduleDate) return;

    this.manualAch.controls.recurring.setValue({
      schedule_date: this.scheduleDate
    });
    this.manualAch.controls.isRecurringValue.setValue(2);
    this.actionType = 'schedule';
    this.isProceedLoading.set(true);
    this.doAction();
  }

  private processRecurring(): void {
    if (!this.recurringStartDate || !this.recurringFrequency) return;

    const recurringData: Record<string, string | number | ''> = {
      frequency: this.recurringFrequency,
      start_date: this.recurringStartDate,
      end_select: this.recurringEndSelect,
      count: this.recurringEndSelect === '1' ? this.recurringCount : ''
    };

    this.manualAch.controls.recurring.setValue(recurringData);
    this.manualAch.controls.isRecurringValue.setValue(1);
    this.actionType = 'recurring';
    this.isProceedLoading.set(true);
    this.doAction();
  }

  private doAction(): void {
    const body = { ...this.manualAch.value };
    body.isSameDay = body.isSameDay ? 1 : 0;

    this.requestPaymentsService
      .createManualAch(body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isProceedLoading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.paymentSuccess.set(true);
        }
      });
  }

  // ── Payee edit ──

  editPayee(): void {
    this.payeeModalService
      .openEditPayee(
        this.selectedPayee.id,
        undefined,
        {
          edit: true,
          id: this.selectedPayee.id,
          page: undefined,
          entityLabel: 'Payer'
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((modalRef) => {
        if (modalRef) {
          modalRef.afterClosed().subscribe((res) => {
            if (res?.success) {
              this.selectPayeeData(res.id);
            }
          });
        }
      });
  }

  getAccountType(accountType: string): string {
    switch (accountType) {
      case 'CHECKING':
        return 'Checking';
      case 'SAVINGS':
        return 'Savings';
      case 'BUSINESS':
        return 'Business';
      case 'INDIVIDUAL':
        return 'Individual';
      case 'personalChecking':
        return 'Personal Checking';
      case 'businessChecking':
        return 'Business Checking';
      case 'personalSavings':
        return 'Personal Savings';
      case 'businessSavings':
        return 'Business Savings';
      default:
        return accountType;
    }
  }

  // ── Utility ──

  private getHiddenNum(num: string): string {
    if (!num) return '';
    return num
      .split('')
      .map((char, i) => (num.length - i > 4 ? '*' : char))
      .join('');
  }

  get successTitle(): string {
    switch (this.actionType) {
      case 'process':
        return 'ACH Debit Processed';
      case 'schedule':
        return 'ACH Debit Scheduled';
      case 'recurring':
        return 'ACH Debit Recurring Set Up';
      default:
        return 'ACH Debit Processed';
    }
  }

  get successMessage(): string {
    switch (this.actionType) {
      case 'process':
        return 'Your ACH debit has been successfully initiated.';
      case 'schedule':
        return 'Your ACH debit has been scheduled successfully.';
      case 'recurring':
        return 'Your recurring ACH debit has been set up successfully.';
      default:
        return 'Your ACH debit has been successfully initiated.';
    }
  }

  handleDone(): void {
    if (this.actionType === 'recurring' || this.actionType === 'schedule') {
      this.router.navigate(['/v4/manage/payments-in/recurring'], {
        queryParams: { ach: 1 }
      });
    } else {
      this.router.navigate(['/v4/manage/payments-in/detailed']);
      this.paymentsInTabService.switchTab({ tab: 'detailed', subTab: 'all' });
    }
    this.dialogRef.close({ success: true });
  }
}
