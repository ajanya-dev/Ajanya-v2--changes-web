import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  computed,
  untracked
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { PaymentsPayeeListComponent } from 'src/app/modules/payments-v4/shared/components/payments-payee-list/payments-payee-list.component';
import { PaymentsBankListComponent } from 'src/app/modules/payments-v4/shared/components/payments-bank-list/payments-bank-list.component';
import { AddRemittanceV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/add-remittance-v4/add-remittance-v4.component';
import { AddAttachmentModalV4Component } from 'src/app/shared/modal/attachment-modal/add-attachment-modal-v4/add-attachment-modal-v4.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import {
  IPayeeDropdown,
  IPayeeBankDetails,
  IShowPayeeDetails
} from 'src/app/modules/payee/payee-v2/model/payee';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import {
  AddPayeeBankV4Component,
  AddPayeeBankDialogData
} from 'src/app/modules/payee/payee-v4/v4-components/add-payee-bank-v4/add-payee-bank-v4.component';
import { ContactSupportModalV4Component } from 'src/app/shared/modal/contact-support-modal-v4/contact-support-modal-v4.component';
import { IBankDropdown, IRemittanceDetails } from 'src/app/models/bank';
import { INewCheckDraft } from 'src/app/modules/check-draft/model/Checkdraft';
import { IOtherDetails } from 'src/app/modules/check/model/check';
import { IGetAttachment, IGetComment } from 'src/app/models/common';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  DOUBLE_SIDE_MODAL_REF,
  DOUBLE_SIDE_MODAL_DATA
} from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
import {
  PayeeDetailsPanelComponent,
  type IPayeeBankDetailsExt,
  type IPayeePanelData
} from 'src/app/modules/payments-v4/shared/components/payee-details-panel/payee-details-panel.component';
import {
  PayeeSummaryPanelComponent,
  type IPayeeSummaryPanelData
} from 'src/app/modules/payments-v4/shared/components/payee-summary-panel/payee-summary-panel.component';

interface INewCheckDraftForm {
  amount: FormControl<string>;
  payeeId: FormControl<string>;
  bankAccountId: FormControl<string>;
  checkIssueDate: FormControl<string>;
  chequeSerialNumber: FormControl<string>;
  categoryId: FormControl<string>;
  memo: FormControl<string>;
  note: FormControl<string>;
  accountNumber: FormControl<string>;
  invoiceNumber: FormControl<string>;
}

@Component({
  standalone: true,
  selector: 'app-v4-new-checkdraft',
  templateUrl: './v4-new-checkdraft.component.html',
  styleUrls: ['./v4-new-checkdraft.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    PaymentsPayeeListComponent,
    PaymentsBankListComponent,
    PhoneInputV4Component,
    CategoryDropdownV4Component,
    V4DatePickerComponent,
    MatTooltipModule
  ],
  providers: [DatePipe, { provide: MatDialogRef, useValue: null }]
})
export class V4NewCheckdraftComponent implements OnInit, OnDestroy {
  readonly XIcon = X;

  private fb = inject(FormBuilder);
  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);
  private modalData = inject(DOUBLE_SIDE_MODAL_DATA) as {
    cloneId?: string;
  } | null;

  private dialog = inject(MatDialog);
  private router = inject(Router);
  private checkService = inject(CheckService);
  private checkDraftService = inject(CheckDraftService);
  private payeeService = inject(PayeeService);
  private payeeModalService = inject(PayeeModalService);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private datePipe = inject(DatePipe);

  private subscriptions: Subscription[] = [];

  form: FormGroup<INewCheckDraftForm>;

  // Payee
  selectedPayee = signal<IPayeeDropdown | null>(null);
  preSelectedPayeeId = signal<string | null>(null);
  payeeCheckId = signal('');
  payeeBankAccounts = signal<IPayeeBankDetails[]>([]);
  selectedPayeeBankData = signal<IPayeeBankDetailsExt | null>(null);
  payeeBankLoading = signal(false);
  showPayeePanel = signal(false);

  // Bank
  selectedBank = signal<IBankDropdown | null>(null);
  preSelectedBankId = signal<string | null>(null);

  preSelectedCategoryId = signal<string | null>(null);

  // Payee Summary
  payeeSummary = signal<IOtherDetails | null>(null);

  // Attachments & Comments
  attachmentList: IGetAttachment[] = [];
  allAttachments: string[] = [];
  commentsList: IGetComment[] = [];
  allComments: string[] = [];

  // UI state
  saving = signal(false);
  printing = signal(false);
  recurringLoading = signal(false);

  // App status (0 = approved, 1/2/3 = not approved)
  AppStatus: number;

  // Remittance
  remittances: IRemittanceDetails[] = [];
  remittanceGrandTotal = 0;
  remittancePaymentTotal = 0;
  remittanceFormat: boolean;
  remittanceInsert = false;
  remittanceType = 0;

  // Recurring
  showRecurring = signal(false);
  recurringFrequency = new FormControl('3', { nonNullable: true });
  recurringStartDate = new FormControl('', { nonNullable: true });
  recurringEndSelect = new FormControl('1', { nonNullable: true });
  recurringCount = new FormControl('1', { nonNullable: true });
  recurringUntilDate = new FormControl('', { nonNullable: true });

  // Permission
  isThisNeedPermission = new FormControl(false, { nonNullable: true });
  sendPermissionEmail = new FormControl(false, { nonNullable: true });
  permissionEmail = new FormControl('', { nonNullable: true });
  permissionSms = new FormControl(false, { nonNullable: true });
  permissionPhone = new FormControl('', { nonNullable: true });
  emailValidation: boolean | { invalidEmailAddress: boolean } = false;
  validPhoneNumber = true;
  isDisablePermissionSms = false;
  private isPhoneNumberUpdating = false;

  payeeBankConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Payee Bank Account',
    displayField: 'label',
    outputField: 'value'
  };

  frequencyDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Frequency',
    displayField: 'label',
    outputField: 'value'
  };

  payeeBankDropdownOptions = signal<{ value: string; label: string }[]>([]);
  selectedPayeeBankControl = new FormControl('', { nonNullable: true });

  frequencyOptions = [
    { value: '3', label: 'Monthly' },
    { value: '6', label: 'Bimonthly' },
    { value: '7', label: 'Quarterly' },
    { value: '5', label: 'Biweekly' },
    { value: '2', label: 'Weekly' },
    { value: '1', label: 'Daily' }
  ];

  canSubmit = computed(() => {
    const amt = this.form?.controls?.amount?.value;
    const payee = this.selectedPayee();
    const bank = this.selectedBank();
    return !!amt && !!payee && !!bank;
  });

  constructor() {
    // Rebuild right panel when payee panel visibility changes
    effect(
      () => {
        const showPanel = this.showPayeePanel();
        const payee = this.selectedPayee();
        untracked(() => this.rebuildRightPanel(showPanel && !!payee));
      },
      { allowSignalWrites: true }
    );
  }

  private rebuildRightPanel(showPayee: boolean): void {
    this.modalRef.clearRightPanels();

    if (showPayee) {
      const panelData: IPayeePanelData = {
        payee: this.selectedPayee,
        showEditButton: true,
        onEdit: () => this.openEditPayeeModal(),
        onBankEdit: () => this.editSelectedPayeeBank(),
        bankData: this.selectedPayeeBankData,
        bankLoading: this.payeeBankLoading,
        bankDropdown: {
          options: this.payeeBankDropdownOptions,
          control: this.selectedPayeeBankControl,
          config: this.payeeBankConfig,
          loading: this.payeeBankLoading,
          onAddBank: () => {
            const payeeId = this.selectedPayee()?.id;
            if (payeeId) this.openAddPayeeBankModal(payeeId);
          }
        }
      };
      this.modalRef.addRightPanel(PayeeDetailsPanelComponent, {
        width: '280px',
        data: panelData
      });

      // Payee Summary panel (below payee details)
      const summaryData: IPayeeSummaryPanelData = {
        payee: this.selectedPayee,
        payeeSummary: this.payeeSummary
      };
      this.modalRef.addRightPanel(PayeeSummaryPanelComponent, {
        width: '280px',
        data: summaryData
      });
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.initPermissionWatchers();
    this.loadAppStatus();
    this.subscriptions.push(
      this.selectedPayeeBankControl.valueChanges.subscribe((val) => {
        this.onPayeeBankChange(val);
      })
    );

    if (this.modalData?.cloneId) {
      this.loadCloneData(this.modalData.cloneId);
    }
  }

  private loadAppStatus(): void {
    this.subscriptions.push(
      this.checkDraftService.checkDraftStatus().subscribe((res) => {
        if (res?.success) {
          this.AppStatus = res.data;
        }
      })
    );
  }

  private loadCloneData(cloneId: string): void {
    this.subscriptions.push(
      this.checkDraftService.getCloneData(cloneId).subscribe((res) => {
        if (res?.success) {
          const { data } = res;

          this.form.controls.amount.setValue(data.amount ?? '');
          this.form.controls.chequeSerialNumber.setValue(
            String(data.chequeSerialNumber ?? '')
          );
          this.form.controls.categoryId.setValue(data.categoryId ?? '');
          this.form.controls.accountNumber.setValue(data.ac ?? '');
          this.form.controls.invoiceNumber.setValue(data.Inv ?? '');
          this.form.controls.note.setValue(data.Note ?? '');
          this.form.controls.memo.setValue(data.memo ?? '');

          if (data.payeeId) {
            this.preSelectedPayeeId.set(data.payeeId);
          }
          if (data.bankaccountId) {
            this.preSelectedBankId.set(data.bankaccountId);
          }
          if (data.categoryId) {
            this.preSelectedCategoryId.set(data.categoryId);
          }
        }
      })
    );
  }

  private initForm(): void {
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? '';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.recurringStartDate.setValue(
      this.datePipe.transform(tomorrow, 'yyyy-MM-dd') ?? ''
    );
    this.form = this.fb.group({
      amount: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)]
      }),
      payeeId: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      bankAccountId: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      checkIssueDate: new FormControl(today, {
        nonNullable: true,
        validators: [Validators.required]
      }),
      chequeSerialNumber: new FormControl('', { nonNullable: true }),
      categoryId: new FormControl('', { nonNullable: true }),
      memo: new FormControl('', { nonNullable: true }),
      note: new FormControl('', { nonNullable: true }),
      accountNumber: new FormControl('', { nonNullable: true }),
      invoiceNumber: new FormControl('', { nonNullable: true })
    });
  }

  private initPermissionWatchers(): void {
    this.subscriptions.push(
      this.permissionPhone.valueChanges.subscribe((phone) => {
        if (!this.isPhoneNumberUpdating && phone) {
          this.validPhoneNumber = phone.length > 10;
          if (!this.validPhoneNumber) {
            this.isDisablePermissionSms = true;
            this.permissionSms.patchValue(true);
          }
        }
        this.isPhoneNumberUpdating = false;
        if (!phone) {
          this.isDisablePermissionSms = false;
        }
      })
    );
    this.subscriptions.push(
      this.permissionSms.valueChanges.subscribe((permission) => {
        if (permission) {
          this.validPhoneNumber = this.permissionPhone.value?.length > 10;
        } else {
          this.validPhoneNumber = true;
        }
      })
    );
  }

  getEmail(): void {
    this.emailValidation = ValidationService.emailValidator(
      this.permissionEmail
    );
    if (this.emailValidation) {
      this.sendPermissionEmail.patchValue(false);
    } else {
      this.sendPermissionEmail.patchValue(true);
    }
  }

  /** Fetch serial number when payee is selected (same as reference) */
  private loadSerialNumber(): void {
    this.subscriptions.push(
      this.checkDraftService.getSerialNumber().subscribe((res) => {
        if (res?.success && res.data?.new_serial_no) {
          this.form.controls.chequeSerialNumber.setValue(
            String(res.data.new_serial_no)
          );
        }
      })
    );
  }

  /** Fetch payee bank accounts and set payeeCheckId from default CD account */
  private loadPayeeBankAccounts(payeeId: string): void {
    this.payeeBankLoading.set(true);
    this.subscriptions.push(
      this.payeeService
        .getPayeeBankData(payeeId)
        .pipe(finalize(() => this.payeeBankLoading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            const bankData: IPayeeBankDetails[] = res.data ?? [];
            this.payeeBankAccounts.set(bankData);

            // Build dropdown options
            this.payeeBankDropdownOptions.set(
              bankData.map((b) => ({
                value: b.id,
                label: `****${(String(b.accountNumber) || '').slice(-4)} - ${b.bankName || 'Account'}`
              }))
            );

            if (bankData.length === 0) {
              const ref = this.alertService.confirmAlert({
                content: 'Please add bank account for payee.',
                doneMsg: 'Add',
                cancelMsg: 'Cancel'
              });
              ref.afterClosed().subscribe((result) => {
                if (result) {
                  this.openAddPayeeBankModal(payeeId);
                }
              });
              return;
            }

            const defaultBank = bankData.find((b) => b.defaultCDAccount === 1);
            if (defaultBank) {
              this.payeeCheckId.set(defaultBank.id);
              this.selectedPayeeBankControl.setValue(defaultBank.id);
              this.loadPayeeSingleBankAccount(payeeId, defaultBank.id);
            } else {
              this.alertService.confirmAlert({
                content: 'Please select a payee bank account as default',
                doneMsg: 'Add',
                cancelMsg: 'Cancel'
              });
            }

            this.showPayeePanel.set(true);
          }
        })
    );
  }

  /** Fetch detailed single bank account data */
  private loadPayeeSingleBankAccount(payeeId: string, bankId: string): void {
    this.subscriptions.push(
      this.payeeService
        .getPayeeSingleBankData(payeeId, bankId)
        .subscribe((res) => {
          if (res?.success) {
            const bankAccount = this.payeeBankAccounts().find(
              (b) => b.id === bankId
            );
            this.selectedPayeeBankData.set({
              ...res.data,
              verified: bankAccount?.verified ?? 0,
              defaultCDAccount: bankAccount?.defaultCDAccount ?? 0,
              defaultDDAccount: bankAccount?.defaultDDAccount ?? 0
            } as unknown as IPayeeBankDetailsExt);
          }
        })
    );
  }

  /** Handle payee bank dropdown change */
  onPayeeBankChange(bankId: string): void {
    if (!bankId) {
      this.selectedPayeeBankData.set(null);
      this.payeeCheckId.set('');
      return;
    }
    const payeeId = this.selectedPayee()?.id;
    if (!payeeId) return;

    this.payeeCheckId.set(bankId);
    this.loadPayeeSingleBankAccount(payeeId, bankId);

    // Set as default
    this.subscriptions.push(
      this.checkDraftService
        .setDefaultCDBankAcc({ bankId, payeeId })
        .subscribe()
    );
  }

  private openAddPayeeBankModal(payeeId: string): void {
    const dialogData: AddPayeeBankDialogData = {
      payeeId,
      payeeName: this.selectedPayee()?.name
    };
    const ref = this.dialog.open(AddPayeeBankV4Component, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      data: dialogData
    });
    ref.afterClosed().subscribe((result: { success?: boolean } | undefined) => {
      if (result?.success) {
        this.loadPayeeBankAccounts(payeeId);
      }
    });
  }

  private editSelectedPayeeBank(): void {
    const payeeId = this.selectedPayee()?.id;
    const bankData = this.selectedPayeeBankData();
    if (!payeeId || !bankData) return;

    const dialogData: AddPayeeBankDialogData = {
      payeeId,
      payeeName: this.selectedPayee()?.name,
      edit: true,
      bankId: bankData.id
    };
    const ref = this.dialog.open(AddPayeeBankV4Component, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      data: dialogData
    });
    ref.afterClosed().subscribe((result: { success?: boolean } | undefined) => {
      if (result?.success) {
        this.loadPayeeBankAccounts(payeeId);
      }
    });
  }

  /** Open V4 edit payee modal with selected payee data */
  private openEditPayeeModal(): void {
    const payee = this.selectedPayee();
    if (!payee?.id) return;

    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(payee.id, undefined, { edit: true, id: payee.id }, true)
        .subscribe((dialogRef) => {
          if (!dialogRef) return;
          dialogRef.afterClosed().subscribe((result) => {
            if (result?.id) {
              // Update the selected payee with the edited data
              this.selectedPayee.set({
                ...payee,
                name: result.name ?? payee.name,
                email: result.email ?? payee.email,
                phone: result.phone ?? payee.phone,
                addressLine1: result.addressLine1 ?? payee.addressLine1,
                city: result.city ?? payee.city,
                state: result.state ?? payee.state,
                zip: result.zip,
                country: result.country ?? payee.country
              });
              this.showPayeePanel.set(true);
            }
          });
        })
    );
  }

  onPayeeSelected(payee: IPayeeDropdown | null): void {
    if(payee?.id === this.selectedPayee()?.id) return;
    this.selectedPayee.set(payee);
    this.form.controls.payeeId.setValue(payee?.id ?? '');
    this.payeeCheckId.set('');
    this.showPayeePanel.set(false);
    this.selectedPayeeBankData.set(null);
    this.payeeBankDropdownOptions.set([]);
    this.selectedPayeeBankControl.setValue('');
    this.payeeSummary.set(null);

    if (payee) {
      this.loadSerialNumber();
      this.loadPayeeBankAccounts(payee.id);
      this.autoFillPermissionFromPayee(payee.id);
      this.loadPayeeSummary(payee.id);
    } else {
      this.clearPermissionFields();
    }
  }

  /** Load payee summary (paid totals) */
  private loadPayeeSummary(payeeId: string): void {
    this.subscriptions.push(
      this.checkService.getPayeeSummary(payeeId).subscribe((res) => {
        if (res?.other) {
          this.payeeSummary.set(res.other);
        }
      })
    );
  }

  /** Auto-fill permission email/phone from payee data (same as reference selectPayeeData) */
  private autoFillPermissionFromPayee(payeeId: string): void {
    this.subscriptions.push(
      this.payeeService.showPayee(payeeId).subscribe((res) => {
        if (res?.success) {
          const payeeData: IShowPayeeDetails = res.data;

          if (payeeData?.phone) {
            this.permissionPhone.patchValue(payeeData.phone);
            if (payeeData.phone.length > 10) {
              this.permissionSms.patchValue(true);
            } else {
              this.permissionSms.patchValue(false);
            }
          } else {
            this.isPhoneNumberUpdating = true;
            this.permissionPhone.patchValue('');
            this.permissionSms.patchValue(false);
          }

          if (payeeData?.email) {
            this.permissionEmail.patchValue(payeeData.email);
            const validation = ValidationService.emailValidator(
              this.permissionEmail
            );
            this.sendPermissionEmail.patchValue(!validation);
          } else {
            this.permissionEmail.patchValue('');
            this.sendPermissionEmail.patchValue(false);
          }
        }
      })
    );
  }

  private clearPermissionFields(): void {
    this.isPhoneNumberUpdating = true;
    this.permissionPhone.patchValue('');
    this.permissionSms.patchValue(false);
    this.permissionEmail.patchValue('');
    this.sendPermissionEmail.patchValue(false);
  }

  onCategoryChange(category: ICategoryDropdown): void {
    this.form.controls.categoryId.setValue(category?.id ?? '');
  }

  onBankSelected(bank: IBankDropdown | null): void {
    if (!bank) {
      this.selectedBank.set(null);
      this.form.controls.bankAccountId.setValue('');
      return;
    }

    // Not approved check draft
    if (this.AppStatus === 1 || this.AppStatus === 2 || this.AppStatus === 3) {
      const ref = this.alertService.warningAlert({
        content:
          'You are not approved for check draft. This check draft will be voided, Are you sure you want to continue?',
        doneMsg: 'Yes',
        isCancel: true,
        cancelMsg: 'Not Now'
      });
      ref.afterClosed().subscribe((res: boolean | undefined) => {
        if (res) {
          this.selectedBank.set(bank);
          this.form.controls.bankAccountId.setValue(bank.id);
        } else {
          this.selectedBank.set(null);
          this.form.controls.bankAccountId.setValue('');
        }
      });
      return;
    }

    // Not verified bank account
    if (bank.verified === 0 && this.AppStatus === 0) {
      const ref = this.alertService.warningAlert({
        content:
          'This bank account is not verified. This check draft will be voided, Are you sure you want to continue?',
        doneMsg: 'Yes',
        isCancel: true,
        cancelMsg: 'Not Now'
      });
      ref.afterClosed().subscribe((res: boolean | undefined) => {
        if (res) {
          this.selectedBank.set(bank);
          this.form.controls.bankAccountId.setValue(bank.id);
        } else {
          this.selectedBank.set(null);
          this.form.controls.bankAccountId.setValue('');
        }
      });
      return;
    }

    // Default: approved and verified
    this.selectedBank.set(bank);
    this.form.controls.bankAccountId.setValue(bank.id);
  }

  /** Open Add Attachment modal (V4) */
  openAttachmentModal(): void {
    const dialogRef = this.dialog.open(AddAttachmentModalV4Component, {
      maxWidth: '600px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: 0,
        type: 'cheque-drafts',
        existingData: this.attachmentList
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { listData?: IGetAttachment[] } | undefined) => {
        if (res?.listData) {
          this.attachmentList = res.listData;
          this.allAttachments = res.listData.map(
            (el) => el.encrypted_id ?? el.id
          );
        }
      });
  }

  /** Open Add Comments modal (V4) */
  openAddCommentsModal(): void {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '800px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        id: 0,
        type: 'cheque-drafts',
        existingData: this.commentsList
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { existingData?: IGetComment[] } | undefined) => {
        if (res?.existingData) {
          this.commentsList = res.existingData;
          this.allComments = res.existingData.map(
            (el) => el.encrypted_id ?? el.id
          );
        }
      });
  }

  /** Build the INewCheckDraft body matching the reference */
  private buildCheckDraftBody(): INewCheckDraft {
    // Build remittance lists from saved modal data
    const invoiceNumberList: (string | number)[] = [];
    const itemNameList: string[] = [];
    const itemDescriptionList: string[] = [];
    const itemQuantityList: (string | number)[] = [];
    const itemUnitCostList: (string | number)[] = [];
    const totalSingleRowList: (string | number)[] = [];

    this.remittances.forEach((r) => {
      if (r.itemQuantity && r.itemUnitCost && r.totalSingleRow) {
        invoiceNumberList.push(r.invoiceNumber ?? '');
        itemNameList.push(r.itemName ?? '');
        itemDescriptionList.push(r.itemDescription ?? '');
        itemQuantityList.push(r.itemQuantity);
        itemUnitCostList.push(r.itemUnitCost);
        totalSingleRowList.push(r.totalSingleRow);
      }
    });

    const hasRemittance =
      this.remittanceInsert &&
      (this.remittanceGrandTotal !== 0 || this.remittancePaymentTotal !== 0);

    return {
      payeeId: this.form.controls.payeeId.value,
      payeeCheckId: this.payeeCheckId(),
      bankaccountId: this.form.controls.bankAccountId.value,
      amount: this.form.controls.amount.value,
      chequeSerialNumber:
        Number(this.form.controls.chequeSerialNumber.value) || 0,
      checkIssueDate: this.form.controls.checkIssueDate.value,
      categoryId: this.form.controls.categoryId.value,
      ac: this.form.controls.accountNumber.value,
      Inv: this.form.controls.invoiceNumber.value,
      Note: this.form.controls.note.value,
      memo: this.form.controls.memo.value,
      isThisNeedPermission: this.isThisNeedPermission.value,
      sendPermissionEmail: this.sendPermissionEmail.value ? 1 : 0,
      permissionEmail: this.permissionEmail.value,
      permissionSms: this.permissionSms.value ? 1 : 0,
      permissionPhone: this.permissionPhone.value,
      allAttachments: this.allAttachments,
      allComments: this.allComments,
      invoiceNumber: invoiceNumberList,
      itemName: itemNameList,
      itemDescription: itemDescriptionList,
      itemQuantity: itemQuantityList,
      itemUnitCost: itemUnitCostList,
      totalSingleRow: totalSingleRowList,
      attachRemittanceToCheck: hasRemittance ? 1 : 0
    };
  }

  close(): void {
    this.modalRef.close(false);
  }

  confirmClose(): void {
    const hasData =
      this.form.controls.amount.value ||
      this.selectedPayee() ||
      this.selectedBank();

    if (hasData) {
      const ref = this.alertService.warningAlert({
        content: 'Are you sure you want to discard this check draft?',
        doneMsg: 'Discard',
        isCancel: true,
        cancelMsg: 'Continue'
      });
      ref.afterClosed().subscribe((res: boolean | undefined) => {
        if (res) {
          this.modalRef.close(false);
        }
      });
    } else {
      this.modalRef.close(false);
    }
  }

  /** Save or Print — type 'S' = save, 'P' = print */
  save(type: 'S' | 'P'): void {
    if (!this.canSubmit()) return;

    const loading = type === 'P' ? this.printing : this.saving;
    loading.set(true);

    if (Number(this.form.controls.amount.value) > 100000000) {
      this.alertService.warningAlert({
        content: 'The check amount should be in-between 0 and 100000000.'
      });
      loading.set(false);
      return;
    }

    if (
      this.isThisNeedPermission.value &&
      !this.sendPermissionEmail.value &&
      !this.permissionSms.value
    ) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select either email or sms',
        doneMsg: 'OK'
      });
      loading.set(false);
      return;
    }

    const body = this.buildCheckDraftBody();
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    this.subscriptions.push(
      this.checkDraftService
        .createNewCheckDraft(body, headerOptions)
        .pipe(
          finalize(() => loading.set(false)),
          catchError((err) => {
            if (err.error?.errorCode === 102) {
              const ref = this.alertService.warningAlert({
                title: 'Error',
                content:
                  "You don't have enough balance to send this SMS. Please refill and try again.",
                cancelMsg: 'Cancel',
                isCancel: true,
                doneMsg: 'Refill Now'
              });
              ref.afterClosed().subscribe((res: boolean | undefined) => {
                if (res) {
                  this.modalRef.close(false);
                  this.router.navigateByUrl('manage/refill-credit');
                }
              });
            } else if (err.status === 422) {
              const errorMsg = err.error?.errorMsg || 'Validation error';
              const isBankError =
                errorMsg.toLowerCase().includes('bank account') &&
                errorMsg.toLowerCase().includes('payee');
              if (isBankError) {
                const ref = this.alertService.confirmAlert({
                  content: errorMsg,
                  doneMsg: 'Add',
                  cancelMsg: 'Cancel'
                });
                ref.afterClosed().subscribe((result) => {
                  if (result) {
                    const payeeId = this.selectedPayee()?.id;
                    if (payeeId) this.openAddPayeeBankModal(payeeId);
                  }
                });
              } else {
                this.alertService.warningAlert({ content: errorMsg });
              }
            } else if (err.status === 403) {
              this.alertService.warningAlert({
                content: "You don't have permission to do this action."
              });
            }
            return of({
              success: false,
              data: undefined as { id: string } | undefined
            });
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.headerService.setHeaderValueChanged(true);
            if (type === 'S') {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Check draft created'
              });
              this.modalRef.close({ type: 'save' });
            } else if (res.data?.id) {
              this.printCheckDraft(res.data.id);
            }
          }
        })
    );
  }

  /** Print check draft and close modal (same as reference) */
  private printCheckDraft(id: string): void {
    this.subscriptions.push(
      this.checkDraftService.getPrint(id).subscribe((res) => {
        if (res?.success) {
          if (res.data?.url) {
            window.open(res.data.url, '_blank');
          } else if (res.data?.printData) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(res.data.printData);
              printWindow.document.close();
              printWindow.focus();
              printWindow.print();
            }
          }
          this.alertService.successAlert({
            title: 'Success',
            content: 'Check draft created and sent to print'
          });
          this.modalRef.close({ type: 'save' });
        }
      })
    );
  }

  onRecurringToggle(checked: boolean): void {
    this.showRecurring.set(checked);
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.datePipe.transform(tomorrow, 'yyyy-MM-dd') ?? '';
  }

  /** Save with recurring settings */
  saveRecurring(): void {
    if (!this.canSubmit()) return;

    if (Number(this.form.controls.amount.value) > 100000000) {
      this.alertService.warningAlert({
        content: 'The check amount should be in-between 0 and 100000000.'
      });
      return;
    }

    if (!this.recurringFrequency.value) {
      this.alertService.warningAlert({ content: 'Please select a frequency.' });
      return;
    }
    if (!this.recurringStartDate.value) {
      this.alertService.warningAlert({
        content: 'Please select a starting date.'
      });
      return;
    }

    this.recurringLoading.set(true);

    const body = this.buildCheckDraftBody();
    // Remove attachment/comment/remittance data for recurring (same as reference)
    const {
      allAttachments: unusedAttachments,
      allComments: unusedComments,
      invoiceNumber: unusedInvoice,
      itemDescription: unusedDescription,
      itemName: unusedName,
      itemQuantity: unusedQuantity,
      itemUnitCost: unusedUnitCost,
      totalSingleRow: unusedTotalRow,
      ...recurringData
    } = body;

    const obj = {
      ...recurringData,
      frequency: this.recurringFrequency.value,
      startDate: this.recurringStartDate.value,
      endSelect: this.recurringEndSelect.value,
      count:
        this.recurringEndSelect.value === '1' ? this.recurringCount.value : '',
      until:
        this.recurringEndSelect.value === '2'
          ? this.recurringUntilDate.value
          : ''
    };

    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    this.subscriptions.push(
      this.checkDraftService
        .createNewCheckDraftWithRecurring(obj, headerOptions)
        .pipe(
          finalize(() => this.recurringLoading.set(false)),
          catchError((err) => {
            const content =
              err.error?.errorMsg ||
              'Something went wrong.Please try again';
            const ref = this.alertService.warningAlert({
              content,
              doneMsg: 'Contact Now',
              isCancel: true,
              cancelMsg: 'Not Now'
            });
            ref.afterClosed().subscribe((result) => {
              if (result) {
                this.dialog.open(ContactSupportModalV4Component, {
                  width: '400px',
                  disableClose: true,
                  panelClass: 'paddingless-modal-rounded'
                });
              }
            });
            return of({ success: false });
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            const successRef = this.alertService.successAlert({
              title: 'Success',
              content:
                'Check draft has set for recurring. You can manage them in recurring list.',
              timeout: 3000
            });
            successRef.afterClosed().subscribe(() => {
              this.modalRef.close({ type: 'recurring' });
            });
          }
        })
    );
  }

  /** Count only remittance rows that have actual data entered */
  get filledRemittanceCount(): number {
    return this.remittances.filter(
      (r) => r.itemQuantity && r.itemUnitCost && r.totalSingleRow
    ).length;
  }

  // ========== Remittance ==========

  openRemittanceModal(): void {
    const amount = Number(this.form.controls.amount.value) || 0;
    const dialogRef = this.dialog.open(AddRemittanceV4Component, {
      width: '1100px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        remitance: this.remittances.length ? this.remittances : undefined,
        remittanceType: this.remittanceType,
        paymentTotal: this.remittancePaymentTotal,
        grandTotal: this.remittanceGrandTotal,
        format: this.remittanceFormat,
        insert: this.remittanceInsert,
        amount,
        type: 'check',
        hideSwitchFormat: false
      }
    });

    dialogRef.afterClosed().subscribe(
      (
        res:
          | {
              format: boolean;
              paymentTotal: number;
              grandTotal: number;
              data: IRemittanceDetails[];
              insert: boolean;
              remittanceType: number;
            }
          | undefined
      ) => {
        if (res) {
          this.remittanceFormat = res.format;
          this.remittancePaymentTotal = res.paymentTotal;
          this.remittanceGrandTotal = res.grandTotal;
          this.remittances = res.data;
          this.remittanceInsert = res.insert;
          this.remittanceType = res.remittanceType;

          // If "Insert into checks" was checked, update the amount
          if (res.insert) {
            const total = res.format ? res.paymentTotal : res.grandTotal;
            if (total > 0) {
              this.form.controls.amount.setValue(total.toString());
            }
          }
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
