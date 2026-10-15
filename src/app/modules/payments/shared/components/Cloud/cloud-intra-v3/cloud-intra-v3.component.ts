import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription, delay, finalize } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import {
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IPaymentSuccessData,
  IPaymentConfig,
  IInterBankCloudForm
} from 'src/app/modules/payments/model/payments';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { ICloudIntraTransferPayload } from 'src/app/data/data/cloud-bank';
import { CloudListV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-list-v35.service';
import { ICloudBankAccountDetailsAirwallex } from 'src/app/modules/cloud-bank/model/cloudbank';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DropDownPayeeBankComponent as DropDownPayeeBankComponent_1 } from '../../../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CloudAccountDropdownV35Component } from '../../../../../../shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';

@Component({
  selector: 'app-cloud-intra-v3',
  templateUrl: './cloud-intra-v3.component.html',
  styleUrls: ['./cloud-intra-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    V35ControlMessageComponent,
    CloudAccountDropdownV35Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    DropDownPayeeBankComponent_1,
    CommonButtonV35Component
  ]
})
export class CloudIntraV3Component implements OnInit, OnDestroy {
  /* Injectors */
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  private fb = inject(FormBuilder);
  private paymentsService = inject(PaymentsService);
  private cloudService = inject(CloudBankService);
  public cloudListV35Service = inject(CloudListV35Service);
  private payeeModalService = inject(PayeeModalService);
  public payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);

  /* Variables */
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() paymentConfig: IPaymentConfig;
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() error = new EventEmitter();
  @Output() success = new EventEmitter<IPaymentSuccessData>();

  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  sessionKey: string;
  utils = Utils;
  submitting = false;
  quickPayForm: FormGroup<IInterBankCloudForm>;
  selectedPayeeDetails: IPayeeDropdown;
  payeeBankDetails: IPayeeBankDetails[] = [];
  selectedPayeeBankData: string;
  commentsCount: number;
  attachmentCount: number;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  editBankName: string;
  faHistory = faClockRotateLeft;
  /**
   * Access DropDownCardComponent
   */
  @ViewChild('payeeBankDropDown')
  payeeBankDropDownComponent: DropDownPayeeBankComponent;

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * @description This function creates form controls for the quickPay form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm(): void {
    this.quickPayForm = this.fb.group({
      cloud: [undefined, [Validators.required]],
      payee: [undefined, [Validators.required]],
      payeeBankAc: [undefined, [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      memo: ['', Validators.required],
      payeeEmail: [''],
      payeeIdNumber: ['']
    }) as FormGroup<IInterBankCloudForm>;

    this.subscriptions.push(
      this.quickPayForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.quickPayForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );
    this.setCommonFormValues();
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.subscriptions.push(
      this.quickPayForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig.paymentFormValue) {
      this.quickPayForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }

    this.cloudService.getEditPayee().subscribe((res: IPayeeViewBank) => {
      this.getPayeeDetails(this.selectedPayeeDetails.id);
      const index = this.payeeDetails?.bank_accounts.findIndex(
        (element) => element.encrypted_id === res.encrypted_id
      );
      this.changeBankAccount(res.encrypted_id, res);
      if (this.payeeDetails) {
        this.payeeDetails.bank_accounts[index as number] = res;
        this.changeBankAccount(res.encrypted_id);
      }
    });
  }

  /**
   * @description This function is called when cloud bank account is changed, and it updates the selected cloud bank account for the payee.
   * @param event -The event object containing the details of the selected cloud bank account.
   */
  cloudDropDownChange(event: ICloudBankAccountDetailsAirwallex): void {
    if (event) {
      this.quickPayForm.controls.cloud.setValue(event);
      this.cloudListV35Service.selectAccount(event);
    }
  }

  /**
   * @description Clear the selected cloud account.
   */
  clearCloudAccount(): void {
    this.quickPayForm.controls.cloud.reset();
    this.cloudListV35Service.selectAccount(undefined);
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the quickPay form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean): void {
    this.payeeBankDropDownComponent.clearSelection();
    this.quickPayForm.controls.payeeBankAc.reset();
    this.selectedPayeeDetails = event;
    if (event?.id) {
      if (fromTemplate === false) {
        this.quickPayForm.controls.payee.setValue(event);
      }
      this.quickPayForm.controls.payeeEmail.setValue(event.email ?? null);
      this.quickPayForm.controls.payeeIdNumber.setValue(
        event.payeeIdNumber ?? null
      );
      this.getPayeeDetails(event.id);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the quickPay form.
   */
  clearPayee(): void {
    this.quickPayForm.controls.payeeBankAc.setValue(undefined);
    this.quickPayForm.controls.payee.setValue(undefined);
    this.paymentConfig.paymentFormValue = undefined;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
  }

  /**
   * @description Handles the addition of a new payee.
   * @param {IPayeeDropdown} event - The event object representing the newly added payee.
   */
  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  /**
   * @description Function triggered when click pay button in payment table.
   * Used to populate selected payee bank instead of default bank account.
   */
  onShowPayeeBank(encryptedId?: string) {
    if (this.payeeDetails) {
      if (encryptedId) {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) => item.encrypted_id === encryptedId
        );
        this.quickPayForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName =
          bank[0]?.bank_name +
          ' - ' +
          this.utils.getMaskedAcNo(String(bank[0]?.account_number));
      } else {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) =>
            item.encrypted_id ===
            this.paymentConfig?.paymentFormValue?.payeeBankAccount
        );
        this.quickPayForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName =
          bank[0]?.bank_name +
          ' - ' +
          this.utils.getMaskedAcNo(String(bank[0]?.account_number));
      }
    }
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string) {
    this.payeeDetails = undefined;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, true)
        ?.pipe(delay(100))
        .subscribe((res) => {
          this.payeeDetails = res;
          if (this.payeeDetails) {
            const defaultBankAcIndex =
              this.payeeDetails.bank_accounts?.findIndex(
                (el) => el.is_default_for_direct_deposit
              );
            if (defaultBankAcIndex > -1) {
              this.quickPayForm.controls.payeeBankAc.setValue(
                this.payeeDetails?.bank_accounts[defaultBankAcIndex] ?? null
              );
              const defaultCDPayeeBank =
                this.payeeDetails.bank_accounts[defaultBankAcIndex];
              this.selectedPayeeBankData =
                defaultCDPayeeBank.bank_name +
                ' - ' +
                this.utils.getMaskedAcNo(
                  String(defaultCDPayeeBank.account_number)
                );
            }
            if (this.changedInfo?.selectedPayeeDetails?.id) {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.quickPayForm.controls.payeeBankAc.value
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.quickPayForm.controls.payeeBankAc.value
              });
            }
          }
          this.quickPayForm.controls.payeeEmail.setValue(
            res.payee_information.payee_email
          );
        })
    );
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
        }
      })
    );
  }

  /**
   *
   * @description This function is called when a bank account is changed, and it updates the selected bank account for the payee.
   * @param event -The event object containing the details of the selected bank account.
   */
  changeBankAccount(event?: string, changedBank?: IPayeeViewBank): void {
    if (!event) return;
    if (changedBank) {
      this.quickPayForm.controls.payeeBankAc.setValue(changedBank ?? null);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false,
        payeeBankDetails: changedBank
      });
      this.getPayeeBankData(this.selectedPayeeDetails.id);
    } else {
      const bankAc = this.payeeDetails?.bank_accounts.filter(
        (ele) => ele?.encrypted_id == event
      )[0];
      this.quickPayForm.controls.payeeBankAc.setValue(bankAc ?? null);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false,
        payeeBankDetails: bankAc
      });
      this.getPayeeBankData(this.selectedPayeeDetails.id);
    }
  }

  /**
   * @description  This function is called to clear the selected bank account for the payee.
   * @param event -The event object containing the details of the bank account to be cleared.
   */
  clearBankAccount(event: IPayeeViewBank): void {
    this.quickPayForm.controls.payeeBankAc.setValue(null);
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  /**
   * @description Retrieves bank data for a specific payee.
   * @param {string} payeeId - The unique identifier for the payee.
   */
  getPayeeBankData(payeeId: string) {
    const selectedBankAcc = this.quickPayForm.controls.payeeBankAc.value;
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
          this.selectedPayeeBankData =
            selectedBankAcc?.bank_name +
            ' - ' +
            this.utils.getMaskedAcNo(String(selectedBankAcc?.account_number));
        }
      })
    );
  }

  /**
   *
   * @description This function is used to add a new bank account for the selected payee.
   */
  addPayeeBankAc() {
    if (
      !this.payeeDetails?.payeeEncryptedId ||
      this.bankModalService.isBankPermissionChecking()
    )
      return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankNormalModal({
          editMode: false,
          id: this.payeeDetails?.payeeEncryptedId
        })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscriptions.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success) {
                  const newPayeeBankAc: IPayeeViewBank = {
                    encrypted_id: response.data.id,
                    account_number: response.data.accountNumber,
                    account_type: response.data.accountType,
                    bank_name: response.data.bankName,
                    routing_number: response.data.routingNumber,
                    is_allow_wire: response.data.isAllowWire,
                    address_line_1: response.data.bankAccountAddress1,
                    bank_account_address2: response.data.bankAccountAddress2,
                    bank_city: response.data.bankAccountCity,
                    bank_state: response.data.bankAccountState,
                    bank_zip: response.data.bankAccountZip,
                    country: response.data.bankAccountCountry,
                    first_name: response.data.bankAccountFirstName,
                    last_name: response.data.bankAccountLastName,
                    beneficiaryBankDetails: response.data.isAllowWire
                      ? {
                          addressLine1:
                            response.data.bankingInstituteAddressLine1!,
                          addressLine2: response.data.bankAccountAddress2!,
                          city: response.data.bankingInstituteCity!,
                          country: response.data.bankingInstituteCountry!,
                          state: response.data.bankingInstituteState!,
                          zip: response.data.bankAccountZip!,
                          bankingInstituteName: response.data
                            .bankingInstituteName
                            ? response.data.bankingInstituteName
                            : ''
                        }
                      : undefined
                  };
                  this.getPayeeBankData(this.selectedPayeeDetails.id);
                  this.payeeDetails?.bank_accounts.push(newPayeeBankAc);
                  this.quickPayForm.controls.payeeBankAc.setValue(
                    newPayeeBankAc
                  );
                  this.onShowPayeeBank(response.data.id);
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: this.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails: newPayeeBankAc
                  });
                  this.alertService.successAlert({
                    title: 'Success',
                    content: ' Bank account added successfully',
                    close: true
                  });
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description Generates a request body object based on form values.
   * @returns {ICloudIntraTransferPayload} The request body object containing various properties like accountId, payee, amount, memo, type, etc.
   */
  formBody(): ICloudIntraTransferPayload {
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.map((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });
    const formValues = this.quickPayForm?.value;
    return {
      accountId: formValues?.cloud?.id as string,
      amount: (formValues?.amount ?? 0) as number,
      description: formValues?.memo as string,
      payeeBankAccount: formValues?.payeeBankAc?.encrypted_id as string,
      payeeId: formValues?.payee?.id as string,
      payeeEmail: formValues?.payeeEmail as string
    };
  }

  /**
   * @description Submits the quick quickPay form and initiates the payment process.
   */
  onSubmit(): void {
    if (this.quickPayForm?.invalid) {
      this.quickPayForm?.markAllAsTouched();
      return;
    }
    if (
      ((new Number(this.quickPayForm?.value?.amount) ?? 0) as number) < 10.0
    ) {
      this.alertService.failedAlert({
        title: 'Failed',
        content: 'Minimum transaction amount should be $10.00'
      });
      this.paymentsService.isPaymentProcessingSubject.next(false);
      return;
    }
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.cloudService
      .cloudBankIntraTransfer(this.formBody())
      .pipe(
        finalize(() => {
          this.paymentsService.isPaymentProcessingSubject.next(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.success.emit({
              sourceType: 'cloud',
              id: this.quickPayForm?.value?.payeeBankAc?.encrypted_id
            });
          }
        },
        error: (err) => {
          if (err.error.errorCode === '112') {
            const dialog = this.dialog.open(OtpModalComponent, {
              maxWidth: '410px',
              width: '100%',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) {
                this.onSubmit();
              }
            });
          }
          if (
            err.error.errorCode === '221' ||
            err.error.errorCode === '222' ||
            err.error.errorCode === '223'
          ) {
            this.error.emit(err);
          }
          if (err.error.errorCode === 216) {
            this.alertService
              .infoAlert({
                content: err.error.errorMsg,
                doneMsg: 'Add Now',
                isCancel: true
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) {
                  this.subscriptions.push(
                    this.payeeModalService
                      .openEditPayee(
                        this.quickPayForm?.value.payee?.id as string,
                        '',
                        {
                          edit: true,
                          id: this.quickPayForm?.value.payee?.id as string,
                          page: 'addAddress'
                        }
                      )
                      .subscribe(() => {})
                  );
                }
              });
          }
        }
      });
  }

  /**
   *@description Open modal for adding attachment and gives the added data when its closed
   */
  openAddAttachment() {
    this.paymentsService
      .openAddAttachment(this.createdExistingAttachments)
      .subscribe((attachments: IAttachmentItem[]) => {
        this.createdExistingAttachments = attachments;
        this.attachmentCount = attachments.length;
      });
  }

  /**
   * @description Open modal for adding comment and gives the added data when its closed
   */
  openAddComment() {
    this.subscriptions.push(
      this.paymentsService
        .openAddComment(this.createdExistingComments)
        .subscribe((comments: IComments[]) => {
          this.createdExistingComments = comments;
          this.commentsCount = comments.length;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.paymentsService.hasAmount.update(() => false);
  }
}
