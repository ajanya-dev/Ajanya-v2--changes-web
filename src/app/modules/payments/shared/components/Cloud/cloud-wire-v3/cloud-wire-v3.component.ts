import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
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
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IApiRes } from 'src/app/models/api';
import {
  IInternationalBankAccountRequest,
  IInternationalPayeeAccount,
  IPuposeCodes
} from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import {
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { NewInternationalAccountComponent } from 'src/app/modules/payee/payee-v2/modals/new-international-account/new-international-account.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { environment } from 'src/environments/environment';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  IPaymentConfig,
  IPaymentSuccessData
} from 'src/app/modules/payments/model/payments';
import { IV3DropDownOnReady } from 'src/app/models/common';
import {
  ICloudBankAccountDetailsAirwallex,
  ICloudInternationalPayloadAirwallex,
  ICloudSendPaymentPayloadAirwallex
} from 'src/app/modules/cloud-bank/model/cloudbank';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CloudListV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-list-v35.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DropDownInternationalBankComponent } from '../../../../../../shared/components/drop-downs/drop-down-international-bank/drop-down-international-bank.component';
import { DropDownPayeeBankComponent as DropDownPayeeBankComponent_1 } from '../../../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CloudAccountDropdownV35Component } from '../../../../../../shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';

/**
 * @description This component handles the Cloud bank to gift card payment functionality.
 */
@Component({
  selector: 'app-cloud-wire-v3',
  templateUrl: './cloud-wire-v3.component.html',
  styleUrls: ['./cloud-wire-v3.component.scss'],
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
    DropDownInternationalBankComponent,
    CommonButtonV35Component,
    // IndustryTypesDropdownComponent
  ]
})
export class CloudWireV3Component implements OnInit, OnDestroy, OnChanges {
  /* Injecting dependencies using inject method */
  private cloudService = inject(CloudBankService);
  private fb = inject(FormBuilder);
  private paymentsService = inject(PaymentsService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  public cloudListV35Service = inject(CloudListV35Service);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private payeeModalService = inject(PayeeModalService);
  public payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);

  /* Variables */
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() error = new EventEmitter();
  @Output() success = new EventEmitter<IPaymentSuccessData>();
  @Output() calculateFee = new EventEmitter();
  @Input() wireType: string;
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() paymentConfig: IPaymentConfig;

  /**
   * Access DropDownCardComponent
   */
  @ViewChild('payeeBankDropDown')
  payeeBankDropDownComponent: DropDownPayeeBankComponent;

  wireForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    memo: ['', [Validators.required]],
    behalfOf: [''],
    payeeEmail: ['', [ValidationService.emailValidator]],
    payeeBankAc: [undefined, [Validators.required]],
    cloud: [undefined, [Validators.required]],
    payee: [null, [Validators.required]],
    ifsc: [''],
    payeeIdNumber: [''],
    // industryType: [null, [Validators.required]]
  });

  subscriptions: Subscription[] = [];
  utils = Utils;
  payeeDetails: IPayeeView;
  isBehalfOf = 0;
  submitting = false;
  sessionKey: string;
  purposeCode: string;
  purposeCodes: IPuposeCodes[] = [];
  pageNo = 1;
  searchTeam: string;
  payeeId: string;
  accountId: string;
  selectedAccount: string;
  internationWirePermissionLoaded = false;
  internationalWireEnabled: number | boolean;
  commentLabelName = 'Memo';
  selectedPayeeDetails: IPayeeDropdown;
  internationalAccountId: string;
  errorControlName = 'Please enter the memo';
  maxCharacters: string;
  isShowIfsc = false;
  selectedPayeeBankData: string | undefined;
  beneficiaryCountry = '';
  isSubmitBtnClicked = false;
  editBankName: string;
  payeeBankDetails: IPayeeBankDetails[] = [];
  isWireAllowed = true;
  defaultCDPayeeBank: IPayeeViewBank;
  internationalAccounts: IInternationalPayeeAccount[];
  faHistory = faClockRotateLeft;

  ngOnInit(): void {
    this.paymentsService.payeeDetails = undefined;
    this.checkInternationlWirePermission();
    this.setCommonFormValues();
    this.getCommentLabelName();

    this.subscriptions.push(
      this.wireForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          if (this.payeeId !== payee?.id) {
            this.payeeId = payee?.id;
            this.selectedPayeeDetails = payee;
            this.getPayeeDetails(payee.id);
          }
        }
      }),
      this.wireForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.selectedPayeeBankData = undefined;
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.wireForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email
        );
      }
    }
    if (changes?.wireType) {
      this.internationalWireEnabled =
        this.paymentTypeAccessService.internationalWireEnabled;
      this.wireForm.controls.payeeBankAc.setValue(undefined);
      if (this.wireType === 'domestic' && this.payeeId) {
        this.getPayeeDetails(this.payeeId);
        this.commentLabelName = 'Memo';
        this.wireForm.controls.memo.setValue('');
        this.payeeDetailsEvents.emit({
          payeeDropdownDetails: this.selectedPayeeDetails,
          isMoreDetailsLoading: false
        });
        this.isShowIfsc = false;
      } else if (this.wireType === 'international' && this.payeeId) {
        this.wireForm.controls.payeeBankAc.setValue(undefined);
        this.getPayeeDetails(this.payeeId);
        this.enableInternationWire();
        this.payeeDetailsEvents.emit({
          payeeDropdownDetails: this.selectedPayeeDetails,
          isMoreDetailsLoading: false
        });
        this.isShowIfsc = false;
      }

      this.subscriptions.push(
        this.wireForm.controls.amount.valueChanges
          .pipe(debounceTime(1500))
          .subscribe((val) => {
            const amount = Number(val);
            this.calculateFee.emit({
              amount,
              paymentSource: 'cloud-bank',
              paymentMethod:
                this.wireType === 'domestic' ? 'wire' : 'internationalWire',
              shippingType:
                this.wireType === 'domestic' ? 'wire' : 'internationalWire'
            });
          })
      );
    }

    if (this.changedInfo?.selectedPayeeBank) {
      this.changeSelectedBankAccount(this.changedInfo?.selectedPayeeBank);
    }
    if (this.changedInfo?.selectedInternationalPayeeBank) {
      this.changeSelectedInternationalBankAccount(
        this.changedInfo.selectedInternationalPayeeBank
      );
      this.getCommentLabelName();
    }

    if (changes?.paymentFormValue) {
      this.setCommonFormValues();
    }
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.subscriptions.push(
      this.wireForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig?.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig?.paymentFormValue) {
      this.wireForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }
  }

  enableInternationWire(): void {
    if (this.internationalWireEnabled !== 1) {
      const data = {
        content: 'Please contact our customer support to enable this feature..',
        isOk: true,
        isCancel: true,
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now'
      };
      const dialog = this.alertService.infoAlert(data);
      dialog.afterClosed().subscribe((res) => {
        if (res) {
          window.open(environment.zoho__support_chat);
        }
        this.wireType = 'domestic';
      });
    }
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description checks the permission for international wire transfers.
   * Updates the `internationalWireEnabled` property based on the permission status.
   */
  checkInternationlWirePermission(): void {}

  cloudDropDownChange(event: ICloudBankAccountDetailsAirwallex): void {
    if (event) {
      this.accountId = event?.id;
      this.wireForm.controls.cloud.setValue(event);
      this.cloudListV35Service.selectAccount(event);
    }
  }

  clearCloudAccount(): void {
    this.wireForm.controls.cloud.reset();
    this.cloudListV35Service.selectAccount(undefined);
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.a
   */
  getPayeeDetails(payeeId: string): void {
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, true)
        .pipe(debounceTime(100))
        .subscribe((res) => {
          this.payeeDetails = res;
          if (this.payeeDetails) {
            this.isWireAllowed = true;
            if (this.wireType !== 'international') {
              const defaultBankAcIndex =
                this.payeeDetails.bank_accounts?.findIndex(
                  (el) => el.is_default_for_direct_deposit
                );
              if (defaultBankAcIndex > -1) {
                this.wireForm.controls.payeeBankAc.setValue(
                  this.payeeDetails?.bank_accounts[defaultBankAcIndex] ?? null
                );
                const defaultCDPayeeBank =
                  this.payeeDetails.bank_accounts[defaultBankAcIndex];
                this.selectedPayeeBankData = `${
                  defaultCDPayeeBank.bank_name
                } - ${this.utils.getMaskedAcNo(
                  String(defaultCDPayeeBank.account_number)
                )}`;
              }
              this.defaultCDPayeeBank =
                this.payeeDetails.bank_accounts[defaultBankAcIndex];
              this.isWireAllowed = this.defaultCDPayeeBank
                ? this.defaultCDPayeeBank.is_allow_wire === 1
                : true;
              if (this.changedInfo?.selectedPayeeDetails?.id) {
                this.payeeDetailsEvents.emit({
                  payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                  isMoreDetailsLoading: false,
                  payeeBankDetails: this.wireForm.controls.payeeBankAc.value
                });
              } else {
                this.payeeDetailsEvents.emit({
                  payeeDropdownDetails: this.selectedPayeeDetails,
                  isMoreDetailsLoading: false,
                  payeeBankDetails: this.wireForm.controls.payeeBankAc.value
                });
              }
              this.payeeService
                .getPayeeBankData(payeeId)
                .subscribe((response) => {
                  if (response.success) {
                    this.payeeBankDetails = response.data;
                  }
                });
            } else {
              this.setDefaultBankForInternational();
              this.internationalAccounts =
                this.payeeDetails.international_payee_accounts;
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeInterBankData: this.wireForm.controls.payeeBankAc.value
              });
            }
            this.wireForm.controls.payeeIdNumber.setValue(
              this.payeeDetails?.payee_information.payee_id_number
            );
            this.wireForm.controls.payeeEmail.setValue(
              res.payee_information.payee_email
            );
            // this.wireForm.controls.industryType.setValue(
            //   res.payee_information.merchant_category
            // );
          }
        })
    );
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee(): void {
    this.wireForm.controls.payeeBankAc.reset();
    this.wireForm.controls.payee.reset();
    this.wireForm.controls.payeeIdNumber.reset();
    this.wireForm.controls.payeeEmail.reset();
    this.isWireAllowed = true;

    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.wireForm.controls.industryType.setValue(null);
  }

  /**
   * @description Sets the default bank account for domestic wire transfers.
   * If the payee details are available, it finds the index of the bank account marked as default for direct deposit.
   */
  setDefaultBankForDomestic(): void {
    if (this.payeeDetails) {
      const defaultBankAcIndex = this.payeeDetails.bank_accounts?.findIndex(
        (el) => el.is_default_for_direct_deposit
      );
      if (defaultBankAcIndex > -1) {
        this.wireForm.controls.payeeBankAc.setValue(
          this.payeeDetails?.bank_accounts[defaultBankAcIndex] ?? null
        );
      }
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false,
        payeeBankDetails: this.wireForm.controls.payeeBankAc.value
      });
    }
  }

  /**
   * @description Sets the default bank account for international wire transfers.
   *
   */
  setDefaultBankForInternational(): void {
    if (
      this.payeeDetails &&
      this.payeeDetails.international_payee_accounts?.length > 0
    ) {
      this.wireForm.controls.payeeBankAc.setValue(
        this.payeeDetails.international_payee_accounts[0]
      );
      const defaultPayeeBank =
        this.payeeDetails.international_payee_accounts[0];
      this.selectedPayeeBankData = `${
        defaultPayeeBank.bank_name
      } - ${this.utils.getMaskedAcNo(String(defaultPayeeBank.account_number))}`;
      this.getCommentLabelName();
      if (this.payeeDetails?.international_payee_accounts[0]?.ifsc) {
        this.wireForm.controls.ifsc.setValue(
          this.payeeDetails?.international_payee_accounts[0]?.ifsc
        );
      } else {
        this.wireForm.controls.ifsc.setValue('');
      }
      this.internationalAccountId =
        this.payeeDetails?.international_payee_accounts[0]?.encrypted_id;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false,
        payeeInterBankData: this.wireForm.controls.payeeBankAc.value
      });
    } else {
      this.wireForm.controls.payeeBankAc.setValue(undefined);
    }
  }

  /**
   * @description Changes the selected bank account for the payee in the wire transfer form.
   * @param selectedPayeeBank  -The selected bank account for the payee.
   */
  changeSelectedBankAccount(selectedPayeeBank: IPayeeViewBank): void {
    this.wireForm.controls.payeeBankAc.setValue(selectedPayeeBank);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeBankDetails: selectedPayeeBank
    });
    if (this.payeeDetails?.bank_accounts) {
      const bankAcIndex = this.payeeDetails.bank_accounts.findIndex(
        (ele) => ele.encrypted_id === selectedPayeeBank?.encrypted_id
      );
      if (bankAcIndex > -1) {
        this.payeeDetails.bank_accounts.splice(
          bankAcIndex,
          1,
          selectedPayeeBank
        );
      }
    }
  }

  /**
   * @description Changes the selected international bank account for the payee in the wire transfer form.
   * @param selectedPayeeBank  -The selected bank account for the payee.
   */
  changeSelectedInternationalBankAccount(
    selectedPayeeBank: IInternationalPayeeAccount
  ): void {
    this.wireForm.controls.payeeBankAc.setValue(selectedPayeeBank);
    this.internationalAccountId = selectedPayeeBank?.encrypted_id;
    if (selectedPayeeBank.ifsc) {
      this.wireForm.controls.ifsc.setValue(selectedPayeeBank.ifsc);
    } else {
      this.wireForm.controls.ifsc.setValue('');
    }
    this.getCommentLabelName();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeInterBankData: selectedPayeeBank
    });
    if (this.payeeDetails?.international_payee_accounts) {
      const bankAcIndex =
        this.payeeDetails.international_payee_accounts.findIndex(
          (ele) => ele.encrypted_id === selectedPayeeBank.encrypted_id
        );
      if (bankAcIndex > -1) {
        this.payeeDetails.international_payee_accounts.splice(
          bankAcIndex,
          1,
          selectedPayeeBank
        );
      }
    }
  }

  /**
   * @description Changes the bank account for the payee in the wire transfer form.
   * @param event -The selected bank account for the payee.
   */
  changeBankAccount(item: string | undefined): void {
    this.selectedPayeeBankData = undefined;
    if (!item) return;
    const bankAccount = this.payeeDetails?.bank_accounts.filter(
      (account) => account.encrypted_id === item
    )[0];
    this.isWireAllowed = bankAccount?.is_allow_wire === 1;
    this.wireForm.controls.payeeBankAc.setValue(bankAccount);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeBankDetails: bankAccount
    });
  }

  /**
   * @description Changes the international bank account for the payee in the wire transfer form.
   * @param event -The selected  international bank account for the payee.
   */
  changeInterBankAccount(event: IInternationalPayeeAccount): void {
    this.wireForm.controls.payeeBankAc.setValue(event);
    this.beneficiaryCountry =
      this.wireForm.controls.payeeBankAc.value?.beneficiaryBankDetails?.country;
    this.getCommentLabelName();

    if (event?.ifsc) {
      this.wireForm.controls.ifsc.setValue(event?.ifsc);
    } else {
      this.wireForm.controls.ifsc.setValue('');
    }
    this.internationalAccountId = event?.encrypted_id;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeInterBankData: event
    });
  }

  /**
   * @description clear the selected bank details for the payee
   * @param event -The selected bank account for the payee.
   */
  clearBankAccount(event: IPayeeViewBank): void {
    this.wireForm.controls.payeeBankAc.setValue(null);
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  /**
   * @description clear the selected international bank details for the payee
   * @param event -The selected international bank account for the payee.
   */
  clearInterBankAccount(event: IInternationalPayeeAccount): void {
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
    this.wireForm.controls.ifsc.reset();
  }

  /**
   * @description Adds a new international bank account for the payee.
   * Opens a dialog to capture the details of the new international bank account.
   * Updates the payee's bank accounts with the new international bank account.
   */
  addInternationalPayeeBankAc(): void {
    if (!this.payeeDetails?.payeeEncryptedId) {
      return;
    }
    const dialogRef = this.dialog.open(NewInternationalAccountComponent, {
      maxWidth: '95%',
      width: '600px',
      disableClose: true,
      data: {
        editMode: false,
        id: this.payeeDetails?.payeeEncryptedId
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((response: IApiRes<IInternationalBankAccountRequest>) => {
        if (response.success) {
          this.wireForm.controls.payeeBankAc.setValue(undefined);
          const newInternationalPayeeBancAc: IInternationalPayeeAccount = {
            payee_id: this.payeeDetails?.payeeEncryptedId,
            bank_name: response.data.bankName,
            account_number: response.data.accountNumber,
            swift_or_bic: response.data.identifierCode,
            account_type: response.data.accountType,
            bank_identifier_type: response.data.identifierType,
            bank_identifier_code: response.data.identifierCode,
            encrypted_id: response.data.id!,
            beneficiary: response.data.beneficiary,
            beneficiaryBankDetails: response.data.beneficiaryBankDetails,
            ifsc: response.data.ifsc
          };
          this.internationalAccounts.push(newInternationalPayeeBancAc);
          this.setDefaultBankForInternational();
          this.editBankName = `${newInternationalPayeeBancAc?.bank_name} - ${this.utils.getMaskedAcNo(
            newInternationalPayeeBancAc.account_number
          )}`;
          this.wireForm.controls.payeeBankAc.setValue(
            newInternationalPayeeBancAc
          );
          if (newInternationalPayeeBancAc.ifsc) {
            this.wireForm.controls.ifsc.setValue(
              newInternationalPayeeBancAc.ifsc
            );
          } else {
            this.wireForm.controls.ifsc.setValue('');
          }
          this.internationalAccountId =
            newInternationalPayeeBancAc?.encrypted_id;
          this.payeeDetailsEvents.emit({
            payeeDropdownDetails: this.selectedPayeeDetails,
            isMoreDetailsLoading: false,
            payeeInterBankData: newInternationalPayeeBancAc
          });
          this.alertService.successAlert({
            title: 'Success',
            content: ' Bank account added successfully',
            close: true
          });
          this.getCommentLabelName();
        }
      });
  }

  /**
   * @description  Enables wire transfer for the selected bank account.
   */
  enableWire() {
    const cloudFormBody = this.wireForm.value;
    const enableWireBody = cloudFormBody.payeeBankAc;
    enableWireBody.id = enableWireBody.encrypted_id;
    this.addNewBankAccount(true, enableWireBody);
  }

  /**
   * @description  Opens a dialog to add a new bank account for the payee.
   * @param editMode -Specifies whether the dialog is in edit mode or not.
   * @param datas -Optional. Contains the data of the payee bank account.
   */
  addNewBankAccount(editMode?: boolean, datas?: IPayeeViewBank) {
    if (
      !this.payeeDetails?.payeeEncryptedId ||
      this.bankModalService.isBankPermissionChecking()
    )
      return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankNormalModal({
          editMode,
          id: this.payeeDetails?.payeeEncryptedId,
          account: datas,
          from: 'wire'
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
                            response.data.bankingInstituteAddressLine1,
                          addressLine2: response.data.bankAccountAddress2,
                          city: response.data.bankingInstituteCity,
                          country: response.data.bankingInstituteCountry,
                          state: response.data.bankingInstituteState,
                          zip: response.data.bankAccountZip,
                          bankingInstituteName: response.data
                            .bankingInstituteName
                            ? response.data.bankingInstituteName
                            : ''
                        }
                      : undefined
                  };
                  this.alertService.successAlert({
                    title: 'Success',
                    content: ' Bank account added successfully',
                    close: true,
                    timeout: 2000
                  });
                  this.isWireAllowed = true;
                  const bankAccount = this.payeeDetails?.bank_accounts.filter(
                    (account) => account.encrypted_id === datas?.encrypted_id
                  )[0];
                  if (bankAccount) {
                    bankAccount.is_allow_wire = 1;
                  }
                  this.wireForm.controls.payeeBankAc.setValue(bankAccount);
                  const index = this.payeeDetails?.bank_accounts.findIndex(
                    (element) => element.encrypted_id === datas?.encrypted_id
                  );
                  if (this.payeeDetails) {
                    this.payeeDetails.bank_accounts[index as number] =
                      newPayeeBankAc;
                  }
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
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean): void {
    this.payeeBankDropDownComponent.clearSelection();
    this.payeeId = event?.encryptedId || '';
    this.selectedPayeeDetails = event;
    this.wireForm.controls.payeeBankAc.reset();
    this.wireForm.controls.payeeEmail.reset();
    this.isWireAllowed = true;
    this.getCommentLabelName();

    if (event?.id) {
      if (fromTemplate === false) {
        this.wireForm.controls.payee.setValue(event);
        this.getPayeeDetails(event.id);
      }
      this.wireForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
    }

    // this.wireForm.controls.industryType.setValue(event?.merchantCategory);

    if (event && event.email && event.email !== '')
      this.wireForm.controls.payeeEmail.setValue(event.email);
  }

  emitOnBehalfOfDetails(event: string): void {
    this.wireForm.controls.behalfOf.setValue(event);
  }

  /**
   * @description Handles the change event of a checkbox.
   * Updates the form controls and validators based on the checkbox state.
   * @param event -The change event object from the checkbox.
   */
  getCheckBoxChange(event: MatCheckboxChange): void {
    if (event.checked) {
      this.isBehalfOf = 1;
      this.wireForm.controls.behalfOf.setValidators(Validators.required);
      this.wireForm.controls.behalfOf.updateValueAndValidity();
    } else {
      this.isBehalfOf = 0;
      this.wireForm.controls.behalfOf.clearValidators();
      this.wireForm.controls.behalfOf.updateValueAndValidity();
      this.wireForm.controls.behalfOf.setValue('');
    }
  }

  /**
   *
   * @description Creates and returns the form body
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * For Airwallex integration
   * @returns -The payment body
   */
  formBody(): ICloudSendPaymentPayloadAirwallex {
    const wireFormData = this.wireForm.value;
    return {
      accountId: wireFormData.cloud?.id,
      amount: Number(wireFormData.amount),
      description: `${wireFormData.memo} ${
        this.isShowIfsc ? ` ifsc: ${wireFormData.ifsc}` : ''
      }${this.purposeCode ?? ''}`,
      payeeId: wireFormData.payee?.id,
      payeeBankAccount: wireFormData.payeeBankAc.encrypted_id,
      transferType: 'wire',
      payeeEmail: wireFormData.payeeEmail
    };
  }

  InternationalformBody(): ICloudInternationalPayloadAirwallex {
    const wireFormData = this.wireForm.value;
    return {
      accountId: wireFormData.cloud?.id,
      amount: Number(wireFormData.amount),
      description: `${wireFormData.memo} ${
        this.isShowIfsc ? ` ifsc: ${wireFormData.ifsc}` : ''
      }${this.purposeCode ?? ''}`,
      payeeId: wireFormData.payee?.id,
      payeeInternationalBankAccount: wireFormData.payeeBankAc.encrypted_id,
      payeeEmail: wireFormData.payeeEmail
    };
  }

  /**
   *
   * @description Updates the IFSC Code.
   */
  setIfscCode() {
    const body = {
      payee_id: this.payeeId,
      ifsc: this.wireForm.controls.ifsc.value
    };
    this.subscriptions.push(
      this.cloudService
        .addIfscCode(this.internationalAccountId, body)
        .subscribe((res) => {
          if (res.success) {
            this.getPayeeDetails(this.payeeId);
          }
        })
    );
  }

  /**
   *
   * @description Handles the form submission.
   * Submits the payment request and handles the response accordingly.
   */
  onSubmit(): void {
    this.wireForm.markAllAsTouched();
    this.isSubmitBtnClicked = true;
    if (this.wireForm.invalid) {
      return;
    }
    if (this.wireForm.controls.amount.value < 10) {
      this.alertService.warningAlert({
        content: 'The amount must be between 10 and 100000000.'
      });
      return;
    }
    const wireFormBody = this.wireForm.value;
    const enableWireBody = wireFormBody.payeeBankAc;
    enableWireBody.id = enableWireBody.encrypted_id;

    this.isSubmitBtnClicked = true;
    if (this.wireType === 'international') {
      this.airwallexInternationalPayment();
    } else {
      if (!wireFormBody.payeeBankAc?.is_allow_wire) {
        const alert = this.alertService.infoAlert({
          content:
            'Please enter the beneficiary and beneficiary bank details below in order to proceed with the payment!',
          isCancel: true,
          doneMsg: 'Add Now'
        });
        alert.afterClosed().subscribe((res) => {
          if (res) {
            this.addNewBankAccount(true, enableWireBody);
          }
        });
      }

      const dialogRef = this.paymentsService.openPaymentConfirmationModal({
        accNumber: this.wireForm.controls.cloud.value?.accountNumber,
        bankName: this.wireForm.controls.cloud.value?.accountName,
        payeeName: this.selectedPayeeDetails.name,
        paymentMethod: 'Wire',
        amount: Number(this.formBody().amount).toFixed(2),
        type: 'cloud'
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.submitting = true;
          this.paymentsService.isPaymentProcessingSubject.next(true);
          this.subscriptions.push(
            this.cloudService
              .sendPaymentAirwallex(this.formBody())
              .pipe(
                finalize(() => {
                  this.submitting = false;
                  this.paymentsService.isPaymentProcessingSubject.next(false);
                })
              )
              .subscribe({
                next: (res) => {
                  if (res.success) {
                    this.success.emit({ sourceType: 'cloud' });
                  }
                },
                error: (err) => {
                  this.sessionKey = err.error.session_key;
                  if (err.error.errorCode === '112') {
                    this.openOtpModal(err.error);
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
                              .subscribe(() => {})
                          );
                        }
                      });
                  }
                }
              })
          );
        }
      });
    }
  }

  airwallexInternationalPayment() {
    const body = this.InternationalformBody();
    const dialogRef = this.paymentsService.openPaymentConfirmationModal( {
      accNumber: this.wireForm.controls.cloud.value?.accountNumber,
      bankName: this.wireForm.controls.cloud.value?.accountName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: 'Wire',
      amount: Number(body.amount).toFixed(2),
      type: 'cloud'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.submitting = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        this.subscriptions.push(
          this.cloudService
            .sendInternationalPaymentAirwallex(body)
            .pipe(
              finalize(() => {
                this.submitting = false;
                this.paymentsService.isPaymentProcessingSubject.next(false);
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.success.emit({ sourceType: 'cloud' });
                }
              },
              error: (err) => {
                this.sessionKey = err.error.session_key;
                if (err.error.errorCode === '112') {
                  this.openOtpModal(err.error);
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
                            .subscribe(() => {})
                        );
                      }
                    });
                }
                if (err.error.errorCode === 100) {
                  this.openContactAlert(err.error.errorMsg);
                }
              }
            })
        );
      }
    });
  }

  openOtpModal(error: string) {
    const dialog = this.dialog.open(OtpModalComponent, {
      maxWidth: '410px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: error
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.onSubmit();
      }
    });
  }

  getMaskedAcNo(acNo: string): string {
    if (acNo && acNo.length >= 4) {
      return `*****${acNo.slice(-4)}`;
    }
    return acNo;
  }

  /**
   * Retrieves the comment label name based on the wire type and the selected payee bank account's country.
   */
  getCommentLabelName(): void {
    if (
      this.wireType === 'international' &&
      (this.wireForm.controls.payeeBankAc.value?.beneficiaryBankDetails
        ?.country === 'IN' ||
        this.wireForm.controls.payeeBankAc.value?.beneficiary?.country === 'IN')
    ) {
      this.isShowIfsc = true;
      this.wireForm.controls.ifsc.setValidators([Validators.required]);
      this.wireForm.controls.ifsc.updateValueAndValidity();
    } else {
      this.isShowIfsc = false;
      this.wireForm.controls.ifsc.setValidators([]);
      this.wireForm.controls.ifsc.updateValueAndValidity();
    }
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
        this.wireForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName = `${bank[0]?.bank_name} - ${this.utils.getMaskedAcNo(
          String(bank[0]?.account_number)
        )}`;
      } else {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) =>
            item.encrypted_id ===
            this.paymentConfig?.paymentFormValue?.payeeBankAccount
        );
        this.wireForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName = `${bank[0]?.bank_name} - ${this.utils.getMaskedAcNo(
          String(bank[0]?.account_number)
        )}`;
      }
    }
  }

  /**
   * @description to change the purpose code
   * @param event -new purpose code
   */
  getChangeCode(event: string): void {
    this.purposeCode = event;
    if (event == undefined) {
      this.wireForm.controls.purpose_code.setValue('');
    } else {
      this.wireForm.controls.purpose_code.setValue(event);
    }
  }

  /**
   * @description Retrieves additional purpose codes when the scroll reaches the end of the list.
   */
  onScrollToEnd(): void {
    const country =
      this.wireForm.controls.payeeBankAc.value?.beneficiaryBankDetails?.country;
    if (country) {
      this.pageNo += 1;
    }
  }

  /**
   * @description Performs a search for purpose codes based on the provided search term.
   * @param searchTerm -The term to search for purpose codes.
   */
  search(searchTerm: string): void {
    this.searchTeam = searchTerm;
  }

  clear(): void {
    this.searchTeam = '';
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  /**
   * @description Open info alert modal with contact button.
   * @param {string}msg - Alert message.
   */
  openContactAlert(msg: string): void {
    const data = {
      content: msg,
      isOk: true,
      isCancel: true,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now'
    };
    const dialog = this.alertService.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  // selectionChange(event: number) {
  //   this.wireForm.controls.industryType.setValue(event);
  // }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.paymentsService.hasAmount.update(() => false);
  }
}
