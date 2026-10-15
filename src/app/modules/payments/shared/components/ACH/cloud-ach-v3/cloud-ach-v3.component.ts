import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, delay, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  IACHCloudForm,
  IPaymentConfig,
  IPaymentSuccessData
} from 'src/app/modules/payments/model/payments';
import { IV3DropDownOnReady } from 'src/app/models/common';
import {
  ICloudBankAccountDetailsAirwallex,
  ICloudSendPaymentPayloadAirwallex
} from 'src/app/modules/cloud-bank/model/cloudbank';
import { Location } from '@angular/common';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CloudListV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-list-v35.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DropDownPayeeBankComponent as DropDownPayeeBankComponent_1 } from '../../../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CloudAccountDropdownV35Component } from '../../../../../../shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';

/**
 * @description This component handles the Cloud bank to ACH payment functionality.
 */
@Component({
  selector: 'app-cloud-ach-v3',
  templateUrl: './cloud-ach-v3.component.html',
  styleUrls: ['./cloud-ach-v3.component.scss'],
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
    CommonButtonV35Component,
    // IndustryTypesDropdownComponent
  ]
})
export class CloudAchV3Component implements OnInit, OnDestroy, OnChanges {
  /* Injecting dependencies using inject method */
  private _cloudService = inject(CloudBankService);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  private checkService = inject(CheckService);
  private sharedService = inject(SharedService);
  private location = inject(Location);
  public cloudListV35Service = inject(CloudListV35Service);
  private payeeModalService = inject(PayeeModalService);
  public payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private validationService = inject(ValidationService);

  /* Variables */
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() error = new EventEmitter();
  @Output() success = new EventEmitter<IPaymentSuccessData>();
  @Output() calculateFee = new EventEmitter();
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() paymentConfig: IPaymentConfig;

  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  sessionKey: string;
  utils = Utils;
  submitting = false;
  achForm: FormGroup<IACHCloudForm>;
  /**
   * @description Flag to identify if payment is being sent on behalf of someone else.
   */
  isBehalfOf = 0;
  selectedAccount: string;
  accountId: string;
  payeeId: string;
  selectedPayeeDetails: IPayeeDropdown;
  payeeBankDetails: IPayeeBankDetails[] = [];
  selectedPayeeBankData: string | undefined;
  amountField = false;
  selectedCloudAccount?: ICloudBankAccountDetailsAirwallex;

  editBankName: string;
  faHistory = faClockRotateLeft;
  proccessed = false;
  /**
   * Access DropDownCardComponent
   */
  @ViewChild('payeeBankDropDown')
  payeeBankDropDownComponent: DropDownPayeeBankComponent;

  ngOnInit(): void {
    this.initForm();
    this.paymentsService.payeeDetails = undefined;
    if (
      this.location?.path() === '/manage/payments/main/pay/cloud/ach' &&
      this.payeeService.fromCloudSendBtn.getValue()
    ) {
      this.payeeService.fromCloudSendBtn.next(true);
    }
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */

  initForm() {
    this.achForm = new FormGroup<IACHCloudForm>({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01)
      ]),
      memo: new FormControl('', [Validators.required]),
      payeeBankAc: new FormControl(undefined, [Validators.required]),
      behalfOf: new FormControl(''),
      payeeEmail: new FormControl('', [
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      cloud: new FormControl(null, [Validators.required]),
      payee: new FormControl(null, [Validators.required]),
      payeeIdNumber: new FormControl(''),
      // industryType: new FormControl(null, Validators.required)
    });
    this.subscriptions.push(
      this.achForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.achForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );
    if (
      this.paymentsService.initiatePaymentForm.cloud &&
      this.location?.path() === '/manage/payments/main/pay/cloud/ach'
    ) {
      this.selectedCloudAccount =
        this.paymentsService.initiatePaymentForm.cloud;
      this.achForm.controls.cloud.setValue(
        this.paymentsService.initiatePaymentForm.cloud
      );
      this.cloudListV35Service.selectAccount(
        this.paymentsService.initiatePaymentForm.cloud
      );
    }

    this.subscriptions.push(
      this.achForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.calculateFee.emit({
            amount,
            paymentSource: 'cloud-bank',
            paymentMethod: 'ach',
            shippingType: 'ach'
          });
        })
    );
    this.setCommonFormValues();
    this.amountField = true;
  }

  setCommonFormValues() {
    this.achForm?.valueChanges?.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = {
        ...this.paymentConfig.paymentFormValue,
        ...formValueChanges
      };
    });
    if (this.paymentConfig.paymentFormValue) {
      this.achForm?.patchValue({
        ...this.paymentConfig.paymentFormValue,
        cloud:
          this.selectedCloudAccount ?? this.paymentConfig.paymentFormValue.cloud
      });
    }
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id?: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.selectedPayeeBankData = undefined;
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.achForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email ?? ''
        );
      }
    }
    if (this.changedInfo?.selectedPayeeBank) {
      this.changeBankAccount(this.changedInfo?.selectedPayeeBank.encrypted_id);
    }
    if (changes.changedInfo.currentValue?.selectedPayeeBank) {
      const index = this.payeeDetails?.bank_accounts.findIndex(
        (element) =>
          element.encrypted_id ===
          this.changedInfo?.selectedPayeeBank?.encrypted_id
      );
      if (this.payeeDetails) {
        this.payeeDetails.bank_accounts[index as number] =
          changes.changedInfo.currentValue.selectedPayeeBank;
      }
      this.changeBankAccount(this.changedInfo?.selectedPayeeBank?.encrypted_id);
    }
    this.setCommonFormValues();
  }

  /**
   *
   * @description This function is called when cloud bank account is changed, and it updates the selected cloud bank account for the payee.
   * @param event -The event object containing the details of the selected cloud bank account.
   */
  cloudDropDownChange(event: ICloudBankAccountDetailsAirwallex): void {
    if (event) {
      this.accountId = event?.id;
      this.achForm.controls.cloud.setValue(event);
      this.cloudListV35Service.selectAccount(event);
    }
  }

  /**
   * @description  This function is called to clear the selected cloud bank account for the payee.
   * @param event -The event object containing the details of the  cloud bank account to be cleared.
   */
  clearCloudAccount(): void {
    this.achForm.controls.cloud.reset();
    this.cloudListV35Service.selectAccount(undefined);
  }

  getPayeeCategory(payeeId: string) {
    this.subscriptions.push(
      this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
        this.achForm.controls.category?.setValue(res?.data?.id);
        this.sharedService.setNewCategoryCreatedData({
          categoryId: res?.data?.id
        });
      })
    );
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
              this.achForm.controls.payeeBankAc.setValue(
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
                payeeBankDetails: this.achForm.controls.payeeBankAc.value
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.achForm.controls.payeeBankAc.value
              });
            }
            this.getPayeeCategory(payeeId);
            this.achForm.controls.payeeIdNumber.setValue(
              this.payeeDetails?.payee_information.payee_id_number
            );
            this.achForm.controls.payeeEmail.setValue(
              res.payee_information.payee_email
            );
            // this.achForm.controls.industryType.setValue(
            //   res.payee_information.merchant_category
            // );
          }
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

  getPayeeBankData(payeeId: string) {
    const selectedBankAcc = this.achForm.controls.payeeBankAc.value;
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
   * @description Function triggered when click pay button in payment table.
   * Used to populate selected payee bank instead of default bank account.
   */
  onShowPayeeBank(encryptedId?: string) {
    if (this.payeeDetails) {
      if (encryptedId) {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) => item.encrypted_id === encryptedId
        );
        this.achForm.controls.payeeBankAc.setValue(bank[0] ?? null);
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
        this.achForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName =
          bank[0]?.bank_name +
          ' - ' +
          this.utils.getMaskedAcNo(String(bank[0]?.account_number));
      }
    }
  }

  emitOnBehalfOfDetails(event: string): void {
    this.achForm.controls.behalfOf.setValue(event);
  }

  getMaskedAcNo(acNo: string): string {
    if (acNo && acNo.length >= 4) {
      return '*****' + acNo.slice(-4);
    }
    return acNo;
  }

  /**
   * @description Handles the change event of a checkbox.
   * Updates the form controls and validators based on the checkbox state.
   * @param event -The change event object from the checkbox.
   */
  getCheckBoxChange(event: MatCheckboxChange): void {
    if (event.checked) {
      this.isBehalfOf = 1;
      this.achForm.controls.behalfOf.setValidators(Validators.required);
      this.achForm.controls.behalfOf.updateValueAndValidity();
    } else {
      this.isBehalfOf = 0;
      this.achForm.controls.behalfOf.clearValidators();
      this.achForm.controls.behalfOf.updateValueAndValidity();
      this.achForm.controls.behalfOf.setValue('');
    }
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean): void {
    if (this.proccessed) {
      this.proccessed = false;
      return;
    }
    this.proccessed = true;
    this.payeeBankDropDownComponent.clearSelection();
    this.achForm.controls.payeeBankAc.reset();
    this.achForm.controls.payeeEmail.reset();
    this.selectedPayeeDetails = event;
    if (event?.id) {
      if (fromTemplate === false) {
        this.achForm.controls.payee.setValue(event);
      }
      if (event.email) {
        this.achForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.achForm.controls.payeeEmail.setValue(null);
      }
      this.payeeId = event?.encryptedId || '';
      this.achForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
      // this.achForm.controls.industryType.setValue(
      //   event?.merchantCategory as number
      // );
      const payeeData = this.achForm.controls?.payee?.value;
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee(): void {
    this.achForm.controls.payeeBankAc.setValue(undefined);
    this.achForm.controls.payee.setValue(undefined);
    this.achForm.controls.payeeIdNumber.reset();
    this.achForm.controls.payeeEmail.reset();
    this.payeeBankDetails = [];
    this.paymentConfig.paymentFormValue = undefined;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.achForm.controls.industryType.setValue(null);
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
                  this.achForm.controls.payeeBankAc.setValue(newPayeeBankAc);
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
   *
   * @description This function is called when a bank account is changed, and it updates the selected bank account for the payee.
   * @param event -The event object containing the details of the selected bank account.
   */
  changeBankAccount(event?: string): void {
    this.selectedPayeeBankData = undefined;
    if (!event) return;
    const bankAc = this.payeeDetails?.bank_accounts.filter(
      (ele) => ele?.encrypted_id === event
    )[0];
    this.achForm.controls.payeeBankAc.setValue(bankAc ?? null);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeBankDetails: bankAc
    });
    this.getPayeeBankData(this.selectedPayeeDetails.id);
  }

  /**
   * @description  This function is called to clear the selected bank account for the payee.
   * @param event -The event object containing the details of the bank account to be cleared.
   */
  clearBankAccount(event: IPayeeViewBank): void {
    this.achForm.controls.payeeBankAc.setValue(null);
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  /**
   *
   *@description Creates and returns the form body
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * For Airwallex integration
   * @returns -The form body
   */
  formBody(): ICloudSendPaymentPayloadAirwallex {
    const achFormData = this.achForm.value;
    return {
      accountId: achFormData.cloud?.id as string,
      amount: Number(achFormData.amount),
      description: achFormData.memo as string,
      payeeId: achFormData.payee?.id as string,
      payeeBankAccount: achFormData.payeeBankAc?.encrypted_id as string,
      transferType: 'ach' as const,
      payeeEmail: achFormData.payeeEmail as string
    };
  }

  /**
   *
   * @description Handles the form submission.
   * Submits the payment request and handles the response accordingly.
   */
  onSubmit(): void {
    this.achForm.markAllAsTouched();

    const payeeData = this.achForm.controls?.payee?.value;
    const isAddressMissing =
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    if (isAddressMissing) {
      return;
    }

    if (this.achForm.invalid) {
      return;
    }
    if (
      this.achForm.controls.amount?.value !== null &&
      this.achForm.controls.amount?.value < 10
    ) {
      this.alertService.warningAlert({
        content: 'The amount must be between 10 and 100000000.'
      });
      return;
    }
    const body = this.formBody();
    const dialogRef = this.paymentsService.openPaymentConfirmationModal( {
      accNumber: this.achForm.controls.cloud.value?.accountNumber!,
      bankName: this.achForm.controls.cloud.value?.accountName!,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: 'ACH',
      amount: Number(body.amount).toFixed(2),
      type: 'cloud'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.submitting = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        this.subscriptions.push(
          this._cloudService
            .sendPaymentAirwallex(this.formBody())
            .pipe(
              finalize(() => {
                this.submitting = false;
                this.paymentsService.isPaymentProcessingSubject.next(false);
              })
            )
            .subscribe(
              (res) => {
                if (res.success) {
                  this.success.emit({ sourceType: 'cloud' });
                }
              },
              (err) => {
                this.sessionKey = err.error.session_key;
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
                if (err.error.errorCode === 100) {
                  this.paymentsService.amountLimitWarning(err.error.errorMsg);
                  return;
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
                            .openEditPayee(this.payeeId, '', {
                              edit: true,
                              id: this.payeeId,
                              page: 'addAddress'
                            })
                            .subscribe((payeeModal) => {
                              if (payeeModal) {
                                this.subscriptions.push(
                                  payeeModal
                                    .afterClosed()
                                    .subscribe((response) => {
                                      if (response?.success) {
                                        this.payeeDetailsEvents.emit({
                                          payeeDropdownDetails: response,
                                          isMoreDetailsLoading: false,
                                          payeeBankDetails:
                                            this.achForm.controls.payeeBankAc
                                              .value
                                        });
                                      }
                                    })
                                );
                              }
                            })
                        );
                      }
                    });
                }
              }
            )
        );
      }
    });
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  // selectionChange(event: number) {
  //   this.achForm.controls.industryType.setValue(event);
  // }

  ngOnDestroy(): void {
    this.payeeService.fromCloudSendBtn.next(false);
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.paymentsService.hasAmount.update(() => false);
  }
}
