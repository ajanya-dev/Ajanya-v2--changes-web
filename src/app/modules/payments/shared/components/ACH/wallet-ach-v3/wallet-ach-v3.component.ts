import { DatePipe, NgClass } from '@angular/common';
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
  inject,
  input,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, finalize, map } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IWalletData } from 'src/app/models/wallet';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { IRemittanceDetails } from 'src/app/models/bank';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import {
  IPaymentBody,
  IPaymentConfig,
  IRecurringDetails,
  IUpdatePaymentBody,
  TPaymentProcessingContext
} from 'src/app/modules/payments/model/payments';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute, Router } from '@angular/router';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import {
  faCircleInfo,
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { environment } from 'src/environments/environment';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { DropDownPayeeBankComponent as DropDownPayeeBankComponent_1 } from '../../../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { Store } from '@ngrx/store';
import { RecurringModalComponent } from 'src/app/shared/modal/process-modal/recurring-modal/recurring-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';

interface IWalletForm {
  amount: FormControl<string | null>;
  payee: FormControl<IPayeeDropdown | null>;
  wallet: FormControl<IWalletData | null>;
  memo: FormControl<string | null>;
  payeeEmail: FormControl<string | null>;
  payeeNumber: FormControl<string | null>;
  send_sms: FormControl<boolean | null>;
  payeeBankAc: FormControl<IPayeeViewBank | null>;
  category: FormControl<ICategoryDropdown | null>;
  invoiceNumber: FormControl<string | null>;
  payeeIdNumber: FormControl<string | undefined>;
  isSameDay: FormControl<boolean | null>;
  needAchRecurring: FormControl<boolean | null>;
  // industryType: FormControl<number | string | null>;
}

/**
 * @description This component handles the wallet to ACH payment functionality.
 */
@Component({
  selector: 'app-wallet-ach-v3',
  templateUrl: './wallet-ach-v3.component.html',
  styleUrls: ['./wallet-ach-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    WalletDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    DropDownPayeeBankComponent_1,
    CategoryDropdownV3Component,
    MatTooltip,
    MatBadge,
    CommonButtonV35Component,
    // IndustryTypesDropdownComponent,
    NewPhoneInputComponent,
    MatSlideToggleModule
  ]
})
export class WalletAchV3Component implements OnInit, OnDestroy, OnChanges {
  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private billService = inject(BillService);
  private psbService = inject(PsbService);
  payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private validationService = inject(ValidationService);
  private store = inject(Store);
  private checkService = inject(CheckService);
  private walletDataService = inject(WalletDataV35Service);
  private recurringRedirect = inject(RecurringRedirectService);

  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() calculateFee = new EventEmitter();
  @Input() paymentConfig: IPaymentConfig;
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Input() selectedWallet: IWalletData | undefined = undefined;

  @Input() changedInfo: IPayeeEditedData | undefined;
  isSameDay = input(false);
  isApprovedReadOnly = input<boolean>(false);

  faCircleQuestion = faCircleQuestion;
  faCircleInfo = faCircleInfo;

  walletForm: FormGroup<IWalletForm>;
  loading: boolean;
  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  utils = Utils;
  paymentProcessingContext: string;
  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  selectedPayeeDetails: IPayeeDropdown;
  attachmentCount: number;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  commentsCount: number;
  remitances: IRemittanceDetails[] | undefined;
  remitanceTotal: number;
  newRemittanceFormat: boolean;
  insertFromRemittance = false;
  encId: string;
  hasRemitance: boolean;
  payeeBankDetails: IPayeeBankDetails[] = [];
  selectedPayeeBankData: string | undefined;
  remittanceGrandTotal: number;
  remittanceType: number;
  editBankName: string | undefined;
  amountInputDisabled = false;
  faHistory = faClockRotateLeft;
  proccessed = false;
  phoneValidation: { [key: string]: boolean } | null;
  message: string = 'Please enter the phone number';
  toggleOn = signal<boolean>(false);
  recurringData: IRecurringDetails|null = null;
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);

  /**
   * Access DropDownCardComponent
   */
  @ViewChild('payeeBankDropDown')
  payeeBankDropDownComponent: DropDownPayeeBankComponent;

  ngOnInit(): void {
    this.initForm();
    this.getCount();
    this.paymentsService.payeeDetails = undefined;
    this.isBillPayment();
  }

  isBillPayment() {
    const billId = this.activatedRoute.snapshot.queryParamMap.get('billId');
    if (billId) {
      this.amountInputDisabled = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.paymentConfig && changes.paymentConfig.currentValue?.paymentFormValue) {
      const {paymentFormValue} = changes.paymentConfig.currentValue;
      
      // Re-patch form when paymentConfig.paymentFormValue is updated
      if (paymentFormValue && Object.keys(paymentFormValue).length > 0) {
        setTimeout(() => {
          if (this.walletForm) {
            this.walletForm.patchValue({ ...paymentFormValue });
          }
        }, 0);
      }
    }
    
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.walletForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email || ''
        );
      }

      if (changes?.changedInfo.currentValue.payeeDropdownDetails) {
        this.walletForm.controls.payeeNumber.setValue(
          this.payeeDetails?.payee_information.payee_phone || ''
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
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.walletForm = new FormGroup<IWalletForm>({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01)
      ]),
      payee: new FormControl(null, [Validators.required]),
      wallet: new FormControl(null, [Validators.required]),
      memo: new FormControl(''),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      payeeNumber: new FormControl(null),
      send_sms: new FormControl(null),
      payeeBankAc: new FormControl(null),
      category: new FormControl(null),
      invoiceNumber: new FormControl(''),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      isSameDay: new FormControl(false),
      needAchRecurring: new FormControl(false)
      // industryType: new FormControl(null, Validators.required),
    });

    this.subscriptions.push(
      this.walletForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.walletForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      }),
      this.walletForm.controls.wallet.valueChanges.subscribe((wallet) => {
        this.paymentsService.resolvePayeeBankVerificationRequired(
          wallet?.bankAccount_id
        );
      })
    );

    this.walletForm.controls.send_sms.valueChanges.subscribe({
      next: (isSmsKey: boolean | null) => {
        const smsControl = this.walletForm.get('payeeNumber');
        if (isSmsKey) {
          smsControl?.enable();
          smsControl?.addValidators([Validators.required]);
          this.toggleOn.set(true);
          this.walletForm.controls.payeeNumber.setValue(
            this.payeeDetails?.payee_information.payee_phone || ''
          );
        } else {
          smsControl?.clearValidators();
          this.toggleOn.set(false);
          smsControl?.setValue(null);
          smsControl?.disable();
        }
        smsControl?.updateValueAndValidity();
      }
    });

    if (this.isSameDay()) {
      this.paymentsService.isSameDayAch.update(() => Boolean(true));
    } else {
      this.paymentsService.isSameDayAch.update(() => Boolean(false));
      this.walletForm.controls.isSameDay.valueChanges.subscribe((val) => {
        this.paymentsService.isSameDayAch.update(() => Boolean(val));
      });
    }

    this.subscriptions.push(
      this.walletForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.calculateFee.emit({
            amount,
            paymentSource: 'wallet',
            paymentMethod: 'ach'
          });
        })
    );
    this.setCommonFormValues();
  }

  /**
   * @description Populate the dropdown by fetching the data using the id
   * @param ev
   * @param id
   */
  populateOnEdit(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.subscriptions.push(
      this.walletForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig.paymentFormValue) {
      this.walletForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }

    if (this.paymentConfig.mode === 'CLONE') {
      this.walletForm.controls.invoiceNumber.setValue(null);
    }
  }

  /**
   * @description checking and validating the phone number
   */
  getPhoneNumber() {
    this.phoneValidation = ValidationService.phoneMinLength(
      this.walletForm.controls.payeeNumber
    );
    this.walletForm.controls.payeeNumber.setValidators([
      Validators.required,
      ValidationService.phoneMinLength
    ]);
    this.message = 'This field requires 10 digits';
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean) {
    if (this.proccessed) {
      this.proccessed = false;
      return;
    }
    this.proccessed = true;
    this.payeeBankDropDownComponent.clearSelection();
    this.walletForm.controls.payeeBankAc.reset();
    this.walletForm.controls.payeeEmail.reset();
    this.walletForm.controls.payeeBankAc.setValue(null);
    if (event?.id) {
      if (fromTemplate === false) {
        this.walletForm.controls.payee.setValue(event);
      }
      if (event.email) {
        this.walletForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.walletForm.controls.payeeEmail.setValue(null);
      }
      this.walletForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
      this.selectedPayeeDetails = event;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      // this.walletForm.controls.industryType.setValue(
      //   event?.merchantCategory as number
      // );
      const payeeData = this.walletForm.controls?.payee?.value;
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee(): void {
    this.walletForm.controls.payeeBankAc.reset();
    this.walletForm.controls.payee.reset();
    this.walletForm.controls.payeeEmail.reset();
    this.walletForm.controls.payeeIdNumber.reset();
    this.payeeBankDetails = [];
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.walletForm.controls.industryType.setValue(null);
  }

  /**
   * @description This function is triggered when a wallet is selected from the dropdown.
   * @param event The selected wallet details from the wallet dropdown component.
   */
  walletSelect(event: IWalletData) {
    this.walletForm.controls.wallet.setValue(event);
  }

  clearWallet() {
    this.walletForm.controls.wallet.reset();
  }

  /**
   * @description -Retrieves and sets the counts of attachments and comments.
   */
  getCount() {
    if (this.paymentConfig.paymentDetails?.zilpaymentId) {
      this.encId = this.paymentConfig.paymentDetails?.zilpaymentId;
      this.subscriptions.push(
        this.sharedService
          .getAttachment('zil-payments', this.encId)
          .subscribe((res) => {
            this.attachmentCount = res.data.length;
          })
      );
      this.subscriptions.push(
        this.sharedService
          .getZilPaymentsComments(this.encId)
          .subscribe((res) => {
            this.commentsCount = res.data.length;
          })
      );
      this.subscriptions.push(
        this.sharedService
          .getZilPaymentsRemitance(this.encId)
          .subscribe((res) => {
            this.paymentsService.remittanceData = {
              remitance: res.data.items_by_array,
              remittanceType: res.data.type
            };
            this.hasRemitance = !!res.data?.items_by_array;
          })
      );
    }
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string) {
    this.payeeDetails = undefined;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, true)
        .pipe(debounceTime(100))
        .subscribe((res) => {
          this.payeeDetails = res;
          this.getPayeeCategory(payeeId);
          if (this.payeeDetails) {
            this.walletForm.controls.payeeNumber.setValue(
              this.payeeDetails?.payee_information.payee_phone || ''
            );
            const defaultBankAcIndex =
              this.payeeDetails.bank_accounts?.findIndex(
                (el) => el.is_default_for_direct_deposit
              );
            if (this.paymentConfig?.paymentFormValue?.payeeBankAccount) {
              this.onShowPayeeBank();
            } else if (defaultBankAcIndex > -1) {
              this.walletForm.controls.payeeBankAc.setValue(
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
            if (this.changedInfo?.selectedPayeeDetails?.id) {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.walletForm.controls.payeeBankAc.value
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.walletForm.controls.payeeBankAc.value
              });
            }
            this.walletForm.controls.payeeIdNumber.setValue(
              this.payeeDetails?.payee_information.payee_id_number
            );
            this.walletForm.controls.payeeEmail.setValue(
              res.payee_information.payee_email
            );
            // this.walletForm.controls.industryType.setValue(
            //   res.payee_information.merchant_category
            // );
          }
        }),
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
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
        this.walletForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName = `${bank[0]?.bank_name} - ${this.utils.getMaskedAcNo(
          String(bank[0]?.account_number)
        )}`;
      } else {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) =>
            item.encrypted_id ===
            this.paymentConfig?.paymentFormValue?.payeeBankAccount
        );
        this.walletForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName = `${bank[0]?.bank_name} - ${this.utils.getMaskedAcNo(
          String(bank[0]?.account_number)
        )}`;
      }
    }
  }

  /**
   * @description Open modal for adding attachment and gives the added data when its closed
   */

  openAddAttachment() {
    this.subscriptions.push(
      this.paymentsService
        .openAddAttachment(this.createdExistingAttachments, this.encId)
        .subscribe((attachments: IAttachmentItem[]) => {
          this.createdExistingAttachments = attachments;
          this.attachmentCount = attachments.length;
        })
    );
  }

  /**
   * @description Open modal for adding comment and gives the added data when its closed
   */

  openAddComment() {
    this.subscriptions.push(
      this.paymentsService
        .openAddComment(this.createdExistingComments, this.encId)
        .subscribe((comments: IComments[]) => {
          this.createdExistingComments = comments;
          this.commentsCount = comments.length;
        })
    );
  }

  /**
   * @description Open modal for adding remittance and gives the added data when its closed
   */
  openAddRemitance() {
    const amount = Number(this.walletForm.controls.amount.value);
    const remitanceData = this.paymentsService.createRemitanceData(
      amount,
      this.insertFromRemittance || this.hasRemitance,
      this.paymentConfig.mode === 'EDIT'
    );
    this.subscriptions.push(
      this.paymentsService
        .openAddRemitanceModal(remitanceData)
        .subscribe((res) => {
          if (res) {
            this.paymentsService.getRemitanceValue(res, this.walletForm);
          } else {
            this.resetRemittanceData();
          }
          const allRemittances = res.data;
          this.hasRemitance = false;
          const formatedRemittances =
            this.paymentsService.checkRemittanceCount(allRemittances);
          this.hasRemitance = !!formatedRemittances.hasRemittance && res.insert;
          this.insertFromRemittance = this.hasRemitance;
          if (allRemittances && this.paymentsService.remittanceData) {
            this.paymentsService.remittanceData.remitance =
              formatedRemittances.remittanceList;
            this.paymentsService.updateRemittanceData(
              formatedRemittances.remittanceList,
              this.hasRemitance,
              this.paymentConfig.mode,
              this.encId,
              res.remittanceType
            );
          }
        })
    );
  }

  /**
   * @description -Resets remittance-related data to its initial state.
   */
  resetRemittanceData() {
    this.newRemittanceFormat = true;
    this.remitanceTotal = 0.0;
  }

  getPayeeBankData(payeeId: string) {
    const selectedBankAcc = this.walletForm.controls.payeeBankAc.value;
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
          this.selectedPayeeBankData = `${selectedBankAcc?.bank_name} - ${this.utils.getMaskedAcNo(
            String(selectedBankAcc?.account_number)
          )}`;
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
                  this.walletForm.controls.payeeBankAc.setValue(newPayeeBankAc);
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
   * @description  Submits the payment based on the provided payment processing context.
   * @param paymentProcessingContext -The payment processing context determines the action to be taken.
   *
   */
  submitPayment(paymentProcessingContext: TPaymentProcessingContext) {
    this.paymentProcessingContext = paymentProcessingContext;
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    this.removeTrailingSpacesInForm();
    if (this.walletForm.invalid) {
      this.walletForm.markAllAsTouched();
      return;
    }

    const payeeData = this.walletForm.controls?.payee?.value;
    const isAddressMissing =
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    if (isAddressMissing) {
      return;
    }

    switch (paymentProcessingContext) {
      case 'pay':
        this.completeTransaction();
        break;
      case 'updateAndPay':
        this.updatePayment(true);
        break;
      case 'save':
        this.savePayment();
        break;
      case 'update':
        this.updatePayment();
        break;
      default:
        break;
    }
  }

  openRecurringModal(edit?: boolean) {
    const dialogRef = this.dialog.open(RecurringModalComponent, {
      width: '40%',
      disableClose: true
    });

    return dialogRef.afterClosed().pipe(
      map((res) => {
        if (!res || res === '') {
          return null;
        }
        const recurringData = {
          is_recurring_value: 1,
          recurring: res
        };
        return recurringData;
      })
    );
  }

  onRecurringToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement)?.checked;
    if (checked) {
      this.subscriptions.push(
        this.openRecurringModal(this.paymentConfig.mode === 'EDIT').subscribe(
          (recurringData) => {
            if (recurringData && recurringData.recurring) {
              this.recurringData = recurringData;
            } else {
              // User cancelled the modal - revert the checkbox and clear data.
              this.recurringData = null;
              this.walletForm.controls.needAchRecurring.setValue(false);
            }
          }
        )
      );
    } else {
      // Unchecked - drop any collected recurring details.
      this.recurringData = null;
    }
  }

  /**
   *
   *@description Creates and returns the form body
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * @returns -The say payment body
   */
  createSavePaymentBody(): IUpdatePaymentBody {
    const paymentFormBody = this.walletForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    return {
      transferType: 'ach',
      amount: Number(paymentFormBody.amount),
      category: paymentFormBody.category?.id,
      payeeBankAccount: paymentFormBody.payeeBankAc?.encrypted_id,
      description: paymentFormBody.memo ?? '',
      payee: paymentFormBody.payee?.id,
      paymentDueDate: this.dateToday ?? undefined,
      referenceNo: paymentFormBody.invoiceNumber as string,
      sourceId: paymentFormBody.wallet?.uuId,
      sourceType: 'wallet',
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      payeeIdNumber: paymentFormBody.payeeIdNumber,
      payeeEmail: paymentFormBody.payeeEmail as string,
      bills: this.billService.billId() ?? []
    };
  }

  /**
   * @description Saves the payment information without initiating the payment.
   */
  savePayment() {
    if (this.isUserUnverified()) {
      this.goToVerify();
      return;
    }

    const sendingData = this.createSavePaymentBody();
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.paymentsService.savePayment(sendingData).subscribe({
        next: (res) => {
          this.loading = false;
          this.paymentsService.isPaymentProcessingSubject.next(false);
          if (res.success) {
            this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
              this.walletDataService.transactionUpdated$.next(true);
            });
            this.success.emit({
              title: 'Your Payment is Saved',
              content:
                'Your payment has been saved. Please check the status in your records.'
            });
          }
        },
        error: (err) => {
          this.loading = false;
          this.paymentsService.isPaymentProcessingSubject.next(false);
          if (err?.error?.errorCode === 441) {
            if (environment.isV4Persona) {
              this.personaHelperService
                .openModal('kyc', CVSourceType.other, true)
                .subscribe((res) => {
                  if (res?.data?.inquiry_id) {
                    this.savePayment();
                  }
                });
            } else {
              this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
            }
          }
        }
      })
    );
  }

  /**
   * @description Updates the payment information.
   * @param payAfterUpdate -Flag indicating whether to initiate the payment after updating.
   */
  updatePayment(payAfterUpdate?: boolean) {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = this.createSavePaymentBody();
      const walletFormBody = this.walletForm.value;

      if (!walletFormBody.needAchRecurring) {
        this.recurringData = null;
      }
      if (this.isApprovedReadOnly()) {
        this.executePaymentWithoutUpdate();
      } else {
        this.executeUpdatePayment(sendingData, payAfterUpdate);
      }
    }
  }

  /**
   * @description Executes the update payment API call
   * @param sendingData - The payment data to send
   * @param payAfterUpdate - Flag indicating whether to initiate the payment after updating
   */
  private executeUpdatePayment(sendingData: IUpdatePaymentBody, payAfterUpdate?: boolean) {
    if (!this.paymentConfig.paymentDetails?.id) {
      return;
    }
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.paymentsService
        .updatePayment(this.paymentConfig.paymentDetails.id, sendingData)
        .subscribe(
          (res) => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
            if (res.success) {
              if (payAfterUpdate) {
                this.executePaymentWithoutUpdate();
              } else {
                this.success.emit({
                  title: 'Your Payment has been Updated',
                  content:
                    'Your payment has been Updated. Please check the status in your records.'
                });
              }
            }
          },
          () => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }
        )
    );
  }

  /**
   * @description Opens the payment confirmation modal and, on confirmation,
   * processes the existing payment as-is — without updating its details first.
   */
  executePaymentWithoutUpdate() {
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: this.paymentConfig?.paymentFormValue?.wallet.bankAccountNumber,
      bankName: this.paymentConfig?.paymentFormValue?.wallet.walletName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: this.isSameDay()
        ? 'Same Day ACH'
        : 'ACH / Direct Deposit',
      amount: Number(this.walletForm.controls.amount.value).toFixed(2),
      type: 'wallet',
      recurringDetails: this.recurringData ?? undefined,
      isPayeeBankVerified: !(
        this.paymentsService.isPayeeBankVerificationRequired &&
        this.walletForm.controls.payeeBankAc.value?.verified !== 1
      )
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (!res) return;
      this.completeTransactionUsingZilPaymentApi();
    });
  }

  /**
   * @description Completes the transaction using the Zil Payment API.
   */
  completeTransactionUsingZilPaymentApi() {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = {
        payee_bank_account_id: this.walletForm.value.payeeBankAc?.encrypted_id,
        payee_email: this.walletForm.value.payeeEmail ?? undefined,
        achRecurring: this.walletForm.value.needAchRecurring ? 1 : 0,
        ...(this.recurringData && { recurring: this.recurringData.recurring })
      };
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .processPayment(this.paymentConfig.paymentDetails?.id, sendingData)
          .subscribe(
            (res) => {
              this.loading = false;
              this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
                this.walletDataService.transactionUpdated$.next(true);
              });
              this.paymentsService.isPaymentProcessingSubject.next(false);
              const wasRecurring =
                !!this.walletForm.controls.needAchRecurring.value;
              this.recurringData = null; // Reset recurring data after successful processing
              if (res.success) {
                if (wasRecurring) {
                  this.recurringRedirect.mark('ach', true);
                }
                this.success.emit(true);
              }
            },
            () => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            }
          )
      );
    }
  }

  catagoryDropDownChange(event: ICategoryDropdown): void {
    if (event === undefined) {
      this.walletForm.controls.category.setValue(null);
    } else {
      this.walletForm.controls.category.setValue(event);
    }
  }

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
          this.walletForm.controls.category.setValue(res);
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
    this.editBankName = undefined;
    if (!event) return;
    const bankAc = this.payeeDetails?.bank_accounts.filter(
      (ele) => ele?.encrypted_id === event
    )[0];
    this.walletForm.controls.payeeBankAc.setValue(bankAc ?? null);
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
    this.walletForm.controls.payeeBankAc.setValue(null);
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  /**
   * @description Completes the transaction by initiating the payment.
   */
  completeTransaction() {
    if (this.isUserUnverified()) {
      this.goToVerify();
      return;
    }

    this.removeTrailingSpacesInForm();
    if (this.walletForm.invalid) {
      this.walletForm.markAllAsTouched();
      return;
    }

    const walletFormBody = this.walletForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    const baseBody: IPaymentBody = {
      type: 'wallet',
      walletId: walletFormBody.wallet?.uuId,
      amount: walletFormBody.amount,
      send_sms: walletFormBody.send_sms,
      payee_phone: walletFormBody.payeeNumber,
      category: walletFormBody.category?.id ?? '',
      payees: [
        {
          id: walletFormBody.payee?.id,
          amount: walletFormBody.amount,
          email: walletFormBody.payeeEmail,
          phone: walletFormBody.payeeNumber,
          memo: walletFormBody.memo,
          bankAccount: walletFormBody.payeeBankAc?.encrypted_id,
          invoiceNumber: walletFormBody.invoiceNumber,
          bills: []
        }
      ],
      mode: '1',
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      // eslint-disable-next-line no-nested-ternary
      isSameDay: this.isSameDay() ? 1 : 0,
      achRecurring: walletFormBody.needAchRecurring ? 1 : 0
    };


    if (walletFormBody.needAchRecurring && this.recurringData?.recurring) {
      const mergedBody = { ...baseBody, ...this.recurringData };
      this.openConfirmationModal(mergedBody, this.recurringData);
    } else {
      this.openConfirmationModal(baseBody);
    }
  }

  /**
   * @description Opens confirmation modal with recurring details
   */
  private openConfirmationModal(body: IPaymentBody, recurringData?: IRecurringDetails) {
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: this.paymentConfig?.paymentFormValue?.wallet.bankAccountNumber,
      bankName: this.paymentConfig?.paymentFormValue?.wallet.walletName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: this.isSameDay() ? 'Same Day ACH' : 'ACH / Direct Deposit',
      amount: Number(this.walletForm.controls.amount.value).toFixed(2),
      type: 'wallet',
      recurringDetails: recurringData ?? undefined,
      isPayeeBankVerified: !(
        this.paymentsService.isPayeeBankVerificationRequired &&
        this.walletForm.controls.payeeBankAc.value?.verified !== 1
      )
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        body.payees[0].bills = this.billService.billId() ?? [];
        this.paymentCreation(body);
      } else {
        this.paymentsService.isPaymentProcessingSubject.next(false);
      }
    });
  }

  paymentCreation(body: IPaymentBody){
    this.subscriptions.push(
      this.psbService
        .completeTransaction(body)
        .pipe(
          finalize(() => {
            this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
          })
        )
        .subscribe(
          (response) => {
            this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
              this.walletDataService.transactionUpdated$.next(true);
            });
            
            if(response?.isApprovalRequired){
              this.success.emit({
                title: 'Administrator approval is required',
                content:
                  'Your payment has been saved. But requires administrator approval for processing.'
              });
            } else {
              if (this.walletForm.controls.needAchRecurring.value) {
                this.recurringRedirect.mark('ach', true);
              }
              this.success.emit();
            }
            this.billService.billId.set(undefined);
            if (this.walletForm.controls.payeeNumber.value) {
              this.store.dispatch(
                payeesActions.loadPayees({
                  searchTerm: '',
                  skipEmpty: true,
                  isReload: true
                })
              );
            }
          },
          (err) => {
            
            this.paymentsService.afterGetingError(
              err?.error?.errorCode,
              err?.error?.errorMsg
            );
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }
        )
    );
  }

  removeTrailingSpacesInForm() {
    if (this.walletForm.controls.memo.value) {
      this.walletForm.controls.memo.setValue(
        this.walletForm.controls.memo.value.trim()
      );
    }
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  isUserUnverified(): boolean {
    const gettingStartedData =
      this.localStorageService.getItem('gettingStartedData');
    return gettingStartedData?.verification === 0;
  }

  goToVerify() {
    this.router.navigate(['/manage/users/verify-email-phone'], {
      queryParams: {
        returnUrl: '/manage/payments/main/pay/wallet/check_mail'
      }
    });
  }

  selectionChange(event: number) {
    // this.walletForm.controls.industryType.setValue(event);
  }

  getPayeeCategory(payeeId: string) {
    this.subscriptions.push(
      this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
        if (res.data.id) {
          this.walletForm.controls.category.setValue(res?.data);
          this.categoryId.set(res?.data?.id);
          if (this.categorySetWithIdFunction) {
            this.categorySetWithIdFunction(res?.data?.id);
          }
        } else {
          this.walletForm.controls.category.setValue(null);
        }
      })
    );
  }

  setDropDownAPIAndBindId(ev: IV3DropDownOnReady, id: string|undefined) {
    if (ev.setItemWithId) {
      this.categorySetWithIdFunction = ev.setItemWithId;
    }
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }
 

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.paymentsService.remittanceData = undefined;
    this.paymentsService.hasAmount.update(() => false);
    this.paymentsService.isSameDayAch.update(() => false);
  }
}
