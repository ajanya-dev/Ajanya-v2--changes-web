import {
  faCircleInfo,
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
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
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown, IRemittanceDetails } from 'src/app/models/bank';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import {
  IPaymentBody,
  IPaymentConfig,
  IPaymentExportsOptions,
  IRecurringDetails,
  ISavePaymentBody,
  IUpdatePaymentBody,
  TPaymentProcessingContext
} from 'src/app/modules/payments/model/payments';
import { HttpHeaders } from '@angular/common/http';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute } from '@angular/router';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
// import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { DropDownPayeeBankComponent as DropDownPayeeBankComponent_1 } from '../../../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { BankAcDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { ControlMessageComponent } from '../../../../../../shared/components/control-message/control-message/control-message.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { Store } from '@ngrx/store';
import { RecurringModalComponent } from 'src/app/shared/modal/process-modal/recurring-modal/recurring-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { INetSuiteExportsData } from 'src/app/modules/integration/netsuite/model/netsuite';
import { toObservable } from '@angular/core/rxjs-interop';

interface IBankForm {
  amount: FormControl<string | null>;
  payee: FormControl<IPayeeDropdown | null>;
  bankAc: FormControl<IBankDropdown | null>;
  memo: FormControl<string | null>;
  payeeEmail: FormControl<string | null>;
  payeeName: FormControl<string | null>;
  payeeNumber: FormControl<string | null>;
  send_sms: FormControl<boolean | null>;
  payeeBankAc: FormControl<IPayeeViewBank | null>;
  category: FormControl<ICategoryDropdown | null>;
  invoiceNumber: FormControl<string | null>;
  payeeIdNumber: FormControl<string | undefined>;
  // isSameDay: FormControl<boolean | null>;
  // industryType: FormControl<number | string | null>;
  needAchRecurring: FormControl<boolean | null>;
}


/**
 * @description This component handles the functionality for bank-to-ACH payments..
 */
@Component({
  selector: 'app-bank-ac-ach-v3',
  templateUrl: './bank-ac-ach-v3.component.html',
  styleUrls: ['./bank-ac-ach-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    ControlMessageComponent,
    BankAcDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    V35ControlMessageComponent,
    DropDownPayeeBankComponent_1,
    CategoryDropdownV3Component,
    MatTooltip,
    MatCheckboxModule,
    MatBadge,
    CommonButtonV35Component,
    WhiteLabelPipe,
    // IndustryTypesDropdownComponent,
    NewPhoneInputComponent,
    MatSlideToggleModule
  ]
})
export class BankAcAchV3Component implements OnInit, OnChanges, OnDestroy {
  private paymentsService = inject(PaymentsService);
  private psbService = inject(PsbService);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private sharedService = inject(SharedService);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private validationService = inject(ValidationService);
  private store = inject(Store);
  private checkService = inject(CheckService);
  private recurringRedirect = inject(RecurringRedirectService);
  // private router = inject(Router);
  // private localStorageService = inject(LocalStorageService);

  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() calculateFee = new EventEmitter();
  @Output() exportOptions = new EventEmitter<IPaymentExportsOptions>();
  @Input() paymentConfig: IPaymentConfig;
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() netSuiteExportData: INetSuiteExportsData | undefined;
  netsuiteExportEnabled = input<boolean>();
  isApprovedReadOnly = input<boolean>(false);

  faCircleQuestion = faCircleQuestion;
  faCircleInfo = faCircleInfo;

  paymentForm: FormGroup<IBankForm>;
  loading: boolean;
  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  utils = Utils;
  /**
   * @description The action variable holds the action that the user wants to perform.
   *
   */
  paymentProcessingContext: TPaymentProcessingContext;
  selectedPayeeDetails: IPayeeDropdown | undefined;
  warningRef: MatDialogRef<WarningAlertComponent, boolean> | undefined;
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
  bankAccExist: IBankDropdown = {} as IBankDropdown;
  dateToday: string = this.datePipe.transform(
    new Date(),
    'yyyy-MM-dd'
  ) as string;
  recurringData: IRecurringDetails | null = null;

  amountInputDisabled = false;
  faHistory = faClockRotateLeft;
  proccessed = false;
  phoneValidation: { [key: string]: boolean } | null;
  message: string = 'Please enter the phone number';
  toggleOn = signal<boolean>(false);
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);
  exportConfig: IPaymentExportsOptions = {
    isQBDPushBack: false,
    isQBOPushBack: false,
    isNetsuitePushBack: false,
    isFreshBooksPushBack: false,
  };

  // NetSuite export properties
  savedNetSuiteData$ = toObservable(this.paymentsService.onSaveNetSuiteDetails);

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
    this.waitForNetSuiteData();
    this.isPushBackEnable();
  }

  /**
   * @description Waits for NetSuite data to be saved and then completes the transaction
   */
  waitForNetSuiteData() {
    this.subscriptions.push(
      this.savedNetSuiteData$.subscribe((res) => {
        if (res) {
          this.netSuiteExportData = res;
          this.submitPayment(this.paymentProcessingContext,false);
        }
      })
    );
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
          this.paymentForm.patchValue({ ...paymentFormValue });
        }, 0);
      }
    }
    
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.paymentForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email || ''
        );
        this.paymentForm.controls.payeeName.setValue(
          this.changedInfo?.selectedPayeeDetails?.name || ''
        );
      }
      if (changes?.changedInfo?.currentValue?.payeeDropdownDetails) {
        this.paymentForm.controls.payeeNumber.setValue(
          this.payeeDetails?.payee_information.payee_phone || ''
        );
      }
    }
    if (this.changedInfo?.selectedPayeeBank) {
      this.changeBankAccount(this.changedInfo?.selectedPayeeBank.encrypted_id);
    }

    if (changes.changedInfo?.currentValue?.selectedPayeeBank) {
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
    // Update the amount in the form if the NetSuite export data is changed
    const netSuiteTotal = changes?.netSuiteExportData?.currentValue?.netSuiteTotal;
    if (netSuiteTotal) {
      this.paymentForm?.controls.amount.setValue(netSuiteTotal);
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.paymentForm = new FormGroup<IBankForm>({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01)
      ]),
      payee: new FormControl(null, [Validators.required]),
      bankAc: new FormControl(null, [Validators.required]),
      memo: new FormControl(''),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      payeeName: new FormControl(null),
      payeeNumber: new FormControl(null),
      send_sms: new FormControl(null),
      payeeBankAc: new FormControl(null),
      category: new FormControl(null),
      invoiceNumber: new FormControl(null),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      // isSameDay: new FormControl(false),
      // industryType: new FormControl(null, Validators.required),
      needAchRecurring: new FormControl(false)
    });
    this.subscriptions.push(
      this.paymentForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.paymentForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      }),
      this.paymentForm.controls.bankAc.valueChanges
        .pipe(distinctUntilChanged((a, b) => a?.id === b?.id))
        .subscribe((bank) => {
          const isAchVerified =
            !!bank?.isItZil || bank?.achApplicationStatus === 1;
          this.paymentsService.resolvePayeeBankVerificationRequired(
            isAchVerified ? bank?.id : null
          );
        })
    );

    this.paymentForm.controls.send_sms.valueChanges.subscribe({
      next: (isSmsKey: boolean | null) => {
        const smsControl = this.paymentForm.get('payeeNumber');
        if (isSmsKey) {
          smsControl?.enable();
          smsControl?.addValidators([Validators.required]);
          this.toggleOn.set(true);
          this.paymentForm.controls.payeeNumber.setValue(
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

    this.subscriptions.push(
      this.paymentForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const paymentAmount = Number(val);
          this.calculateFee.emit({
            amount: paymentAmount,
            paymentSource: 'bank',
            paymentMethod: 'ach'
          });
        })
      // this.paymentForm.controls.isSameDay.valueChanges.subscribe((val) => {
      //   this.paymentsService.isSameDayAch.update(() => Boolean(val));
      // })
    );
    this.setCommonFormValues();
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  isPushBackEnable() {
    this.checkService.isNetSuitePushBackEnable().subscribe((res) => {
      if(res.data.isPushBackEnabled && res.data.isNetsuiteConnected) {
        this.exportConfig.isNetsuitePushBack = true;
        this.exportOptions.emit(this.exportConfig);
      }
    });
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.subscriptions.push(
      this.paymentForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig.paymentFormValue) {
      this.paymentForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }
    if (this.paymentConfig.mode === 'CLONE') {
      this.paymentForm.controls.invoiceNumber.setValue(null);
    }
  }

  /**
   * @description checking and validating the phone number
   */
  getPhoneNumber() {
    this.phoneValidation = ValidationService.phoneMinLength(
      this.paymentForm.controls.payeeNumber
    );
    this.paymentForm.controls.payeeNumber.setValidators([
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
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payeeName.reset();
    this.paymentForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
    this.paymentForm.controls.payeeBankAc.setValue(null);
    if (event?.id) {
      if (fromTemplate === false) {
        this.paymentForm.controls.payee.setValue(event);
        this.getPayeeDetails(event.id);
      }
      if (event.email) {
        this.paymentForm.controls.payeeEmail.setValue(event.email);
        this.paymentForm.controls.payeeName.setValue(event.name);
      } else {
        this.paymentForm.controls.payeeEmail.setValue(null);
        this.paymentForm.controls.payeeName.setValue(null);
      }
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      // this.paymentForm.controls.industryType.setValue(
      //   event?.merchantCategory as number
      // );
      const payeeData = this.paymentForm.controls?.payee?.value;
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    }
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
              remitance: res?.data?.items_by_array,
              remittanceType: res?.data?.type
            };
            this.hasRemitance = !!res?.data?.items_by_array;
          })
      );
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee(): void {
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payeeName.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeBankDetails = [];
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    this.selectedPayeeDetails = undefined;
    // this.paymentForm.controls.industryType.setValue(null);
  }

  /**
   * @description This function is triggered when a bank is selected from the dropdown.
   * @param event -The selected bank details from the bank dropdown component.
   */
  bankSelect(event: IBankDropdown) {
    const lastValue = this.paymentForm.controls.bankAc.value;
    this.paymentsService.checkBankCanACH(event);
    if (event && event !== lastValue) {
      this.paymentForm.controls.bankAc.setValue(event);
    }
    this.bankAccExist = lastValue as IBankDropdown;
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
        .pipe(debounceTime(100))
        .subscribe((res) => {
          this.payeeDetails = res;
          this.getPayeeCategory(payeeId);
          if (this.payeeDetails) {
            this.paymentForm.controls.payeeNumber.setValue(
              this.payeeDetails.payee_information.payee_phone
            );
            const defaultBankAcIndex =
              this.payeeDetails.bank_accounts?.findIndex(
                (el) => el.is_default_for_direct_deposit
              );
            if (this.paymentConfig?.paymentFormValue?.payeeBankAccount) {
              this.onShowPayeeBank();
            } else if (defaultBankAcIndex > -1) {
              this.paymentForm.controls.payeeBankAc.setValue(
                this.payeeDetails?.bank_accounts[defaultBankAcIndex] ?? null
              );
              const defaultCDPayeeBank =
                this.payeeDetails.bank_accounts[defaultBankAcIndex];
              this.selectedPayeeBankData = `${defaultCDPayeeBank?.bank_name} - ${this.utils.getMaskedAcNo(
                String(defaultCDPayeeBank?.account_number)
              )}`;
            }
            if (this.changedInfo?.selectedPayeeDetails?.id) {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.paymentForm.controls.payeeBankAc.value
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.paymentForm.controls.payeeBankAc.value
              });
            }
            this.paymentForm.controls.payeeIdNumber.setValue(
              this.payeeDetails?.payee_information.payee_id_number
            );
            this.paymentForm.controls.payeeEmail.setValue(
              res.payee_information.payee_email
            );
            this.paymentForm.controls.payeeName.setValue(
              res.payee_information.payee_name
            );
            // this.paymentForm.controls.industryType.setValue(
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
        this.paymentForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName = `${bank[0]?.bank_name} - ${this.utils.getMaskedAcNo(
          String(bank[0]?.account_number)
        )}`;
      } else {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) =>
            item.encrypted_id ===
            this.paymentConfig?.paymentFormValue?.payeeBankAccount
        );
        this.paymentForm.controls.payeeBankAc.setValue(bank[0] ?? null);
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
    const amount = Number(this.paymentForm.controls.amount.value);
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
            this.paymentsService.getRemitanceValue(res, this.paymentForm);
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
    const selectedBankAcc = this.paymentForm.controls.payeeBankAc.value;
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
          const bankName = selectedBankAcc?.bank_name;
          const accountNumber = this.utils.getMaskedAcNo(
            String(selectedBankAcc?.account_number)
          );
          this.selectedPayeeBankData = `${bankName} - ${accountNumber}`;
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
                          addressLine1: response.data
                            ?.bankingInstituteAddressLine1 as string,
                          addressLine2: response.data
                            ?.bankAccountAddress2 as string,
                          city: response.data.bankingInstituteCity as string,
                          country: response.data
                            .bankingInstituteCountry as string,
                          state: response.data.bankingInstituteState as string,
                          zip: response.data.bankAccountZip as string,
                          bankingInstituteName: response.data
                            .bankingInstituteName
                            ? response.data.bankingInstituteName
                            : ''
                        }
                      : undefined
                  };
                  if (this.selectedPayeeDetails)
                    this.getPayeeBankData(this.selectedPayeeDetails.id);
                  this.payeeDetails?.bank_accounts.push(newPayeeBankAc);
                  this.onShowPayeeBank(response.data.id);
                  this.paymentForm.controls.payeeBankAc.setValue(
                    newPayeeBankAc
                  );
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
    this.editBankName = undefined;
    if (!event) return;
    const bankAc = this.payeeDetails?.bank_accounts.filter(
      (ele) => ele?.encrypted_id === event
    )[0];
    this.paymentForm.controls.payeeBankAc.setValue(bankAc ?? null);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeBankDetails: bankAc
    });
    if (this.selectedPayeeDetails) {
      this.getPayeeBankData(this.selectedPayeeDetails.id);
    }
  }

  /**
   * @description  This function is called to clear the selected bank account for the payee.
   * @param event -The event object containing the details of the bank account to be cleared.
   */
  clearBankAccount(event: IPayeeViewBank): void {
    this.paymentForm.controls.payeeBankAc.setValue(null);
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  clearBank() {
    this.paymentForm.controls.bankAc.reset();
    this.paymentForm.controls.bankAc.markAllAsTouched();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false
    });
  }

  /**
   * @description  Submits the payment based on the provided payment processing context.
   * @param paymentProcessingContext -The payment processing context determines the action to be taken.
   *
   */
  submitPayment(paymentProcessingContext: TPaymentProcessingContext, needNetSuiteAutoSave: boolean = true) {
    this.paymentProcessingContext = paymentProcessingContext;
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    this.removeTrailingSpacesInForm();
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const payeeData = this.paymentForm.controls?.payee?.value;

    const isAddressMissing =
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    if (isAddressMissing) {
      return;
    }

    if (
      this.paymentForm.value.bankAc &&
      !this.paymentsService.checkBankCanACH(this.paymentForm.value.bankAc)
    ) {
      return;
    }

    // Check if NetSuite auto-save is needed for wiygul enterprise
    if (
      this.exportConfig?.isNetsuitePushBack &&
      this.netsuiteExportEnabled() &&
      !this.netSuiteExportData && needNetSuiteAutoSave
    ) {
      this.paymentsService.autoSaveNetSuiteDetails.set(true);
      return;
    }

    if(this.isApprovedReadOnly()){
      this.afterUpdatePayment();
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

  /**
   * @description Completes the transaction by initiating the payment.
   */
  completeTransaction() {
    const paymentFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    const baseBody: IPaymentBody = {
      type: 'bankaccount',
      bankaccountId: paymentFormBody.bankAc?.id,
      amount: paymentFormBody.amount,
      send_sms: paymentFormBody.send_sms,
      payee_phone: paymentFormBody.payeeNumber,
      category: paymentFormBody.category?.id ?? '',
      payees: [
        {
          invoiceNumber: paymentFormBody.invoiceNumber,
          id: paymentFormBody.payee?.id,
          amount: paymentFormBody.amount,
          email: paymentFormBody.payeeEmail,
          phone: paymentFormBody.payeeNumber,
          memo: paymentFormBody.memo,
          bankAccount: paymentFormBody.payeeBankAc?.encrypted_id,
          payeeIdNumber: paymentFormBody.payeeIdNumber,
          bills: []
        }
      ],
      mode: '1',
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      achRecurring: paymentFormBody.needAchRecurring ? 1 : 0
      // isSameDay: paymentFormBody.isSameDay ? 1 : 0
    };

    baseBody.payees[0].bills = this.billService.billId() ?? [];

    if (paymentFormBody.needAchRecurring && this.recurringData?.recurring) {
      const mergedBody = { ...baseBody, ...this.recurringData };
      this.openConfirmationModal(mergedBody, this.recurringData);
    } else {
      this.openConfirmationModal(baseBody);
    }
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
        .subscribe({
          next: (response) => {
            if(response?.isApprovalRequired){
              this.success.emit({
                title: 'Administrator approval is required',
                content:
                  'Your payment has been saved. But requires administrator approval for processing.'
              });
            } else {
              if (this.paymentForm.controls.needAchRecurring.value) {
                this.recurringRedirect.mark('ach', true);
              }
              this.success.emit();
            }
            this.billService.billId.set(undefined);
            if (this.paymentForm.controls.payeeNumber.value) {
              this.store.dispatch(
                payeesActions.loadPayees({
                  searchTerm: '',
                  skipEmpty: true,
                  isReload: true
                })
              );
            }
          },
          error: () => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }
        })
    );
  }

  /**
   * @description Opens confirmation modal with recurring details
   */
  private openConfirmationModal(body: IPaymentBody, recurringData?: IRecurringDetails) {
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: String(this.bankAccExist.accountNumber),
      bankName: this.bankAccExist.nickName,
      payeeName: this.paymentForm.controls.payeeName.value ?? '',
      paymentMethod: 'ACH / Direct Deposit',
      amount: Number(this.paymentForm.controls.amount.value).toFixed(2),
      type: 'bankaccount',
      recurringDetails: recurringData,
      isPayeeBankVerified: !(
        this.paymentsService.isPayeeBankVerificationRequired &&
        this.paymentForm.controls.payeeBankAc.value?.verified !== 1
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
              this.paymentForm.controls.needAchRecurring.setValue(false);
            }
          }
        )
      );
    } else {
      // Unchecked - drop any collected recurring details.
      this.recurringData = null;
    }
  }

  removeTrailingSpacesInForm() {
    if (this.paymentForm.controls.memo.value) {
      this.paymentForm.controls.memo.setValue(
        this.paymentForm.controls.memo.value.trim()
      );
    }
  }

  /**
   * @description Saves the payment information without initiating the payment.
   */
  savePayment() {
    const paymentFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });
    const sendingData: ISavePaymentBody = {
      referenceNo: paymentFormBody.invoiceNumber as string,
      transferType: 'ach',
      amount: Number(paymentFormBody.amount),
      category: paymentFormBody.category?.id,
      payeeBankAccount: paymentFormBody.payeeBankAc?.encrypted_id,
      description: paymentFormBody.memo ?? '',
      payee: paymentFormBody.payee?.id,
      paymentDueDate: this.dateToday,
      sourceId: paymentFormBody.bankAc?.id,
      sourceType: 'bankaccount',
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      payeeIdNumber: paymentFormBody.payeeIdNumber,
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      payeeEmail: paymentFormBody?.payeeEmail as string,
      // NetSuite export data
      attachNetsuiteExpenseToCheck: this.netSuiteExportData ? '1' : '0',
      netsuiteExpenseDetails: this.netSuiteExportData
        ? this.netSuiteExportData.formValue
        : '',
      netsuiteBankId: this.netSuiteExportData?.netSuiteBankId ?? ''
    };
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.paymentsService.savePayment(sendingData).subscribe(
        (res) => {
          this.loading = false;
          this.paymentsService.isPaymentProcessingSubject.next(false);
          if (res.success) {
            this.payeeDetailsEvents.emit({
              payeeDropdownDetails: undefined,
              isMoreDetailsLoading: false
            });
            this.success.emit({
              title: 'Your Payment is Saved',
              content:
                'Your payment has been saved. Please check the status in your records.'
            });
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
   * @description Updates the payment information.
   * @param payAfterUpdate -Flag indicating whether to initiate the payment after updating.
   */
  updatePayment(payAfterUpdate?: boolean) {
    if (this.paymentConfig.paymentDetails?.id) {
      const paymentFormBody = this.paymentForm.value;
      const commentIds: string[] = [];
      const attachmentIds: string[] = [];
      this.createdExistingComments.map((el) =>
        commentIds.push(el.encrypted_id)
      );
      this.createdExistingAttachments.forEach((el) => {
        if (el.encrypted_id) {
          attachmentIds.push(el.encrypted_id);
        }
      });
      const sendingData: IUpdatePaymentBody = {
        transferType: 'ach',
        amount: Number(paymentFormBody.amount),
        category: paymentFormBody.category?.id,
        payeeBankAccount: paymentFormBody.payeeBankAc?.encrypted_id,
        description: paymentFormBody.memo ?? '',
        payee: paymentFormBody.payee?.id,
        paymentDueDate: this.dateToday,
        sourceId: paymentFormBody.bankAc?.id,
        sourceType: 'bankaccount',
        commentIds,
        attachmentIds,
        items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
        remittanceType: this.paymentsService.remittanceData?.remittanceType,
        referenceNo: paymentFormBody.invoiceNumber as string,
        payeeIdNumber: paymentFormBody.payeeIdNumber,
        payeeEmail: paymentFormBody.payeeEmail as string,
        // NetSuite export data
        attachNetsuiteExpenseToCheck: this.netSuiteExportData ? '1' : '0',
        netsuiteExpenseDetails: this.netSuiteExportData
          ? this.netSuiteExportData.formValue
          : '',
        netsuiteBankId: this.netSuiteExportData?.netSuiteBankId ?? ''
      };

      if (!paymentFormBody.needAchRecurring) {
        this.recurringData = null;
      }
      this.executeUpdatePayment(sendingData, payAfterUpdate);
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
        .updatePayment(this.paymentConfig.paymentDetails?.id, sendingData)
        .subscribe(
          (res) => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
            if (res.success) {
              if (payAfterUpdate) {
                this.afterUpdatePayment();
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

  afterUpdatePayment(){
    const dialogRef =
      this.paymentsService.openPaymentConfirmationModal({
        accNumber: String(this.bankAccExist.accountNumber),
        bankName: this.bankAccExist.nickName,
        payeeName:
          this.paymentForm.controls.payeeName.value ?? '',
        paymentMethod: 'ACH / Direct Deposit',
        amount: Number(this.paymentForm.controls.amount.value),
        type: 'bankaccount',
        recurringDetails: this.recurringData ?? undefined,
        isPayeeBankVerified: !(
          this.paymentsService.isPayeeBankVerificationRequired &&
          this.paymentForm.controls.payeeBankAc.value?.verified !==
            1
        )
      });
    dialogRef.afterClosed().subscribe((res) => {
      if (!res) {
        this.loading = false;
        return;
      }
      this.completeTransactionUsingZilPaymentApi();
    });
  }

  /**
   * @description Completes the transaction using the Zil Payment API.
   */
  completeTransactionUsingZilPaymentApi() {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = {
        payee_bank_account_id: this.paymentForm.value.payeeBankAc?.encrypted_id,
        payee_email: this.paymentForm.value.payeeEmail ?? undefined,
        achRecurring: this.paymentForm.value.needAchRecurring ? 1 : 0,
        ...(this.recurringData && { recurring: this.recurringData.recurring })
      };
      const headerOptions = new HttpHeaders({
        'Content-Type': 'application/json',
        isDisable422: 'true'
      });
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .processPayment(
            this.paymentConfig.paymentDetails?.id,
            sendingData,
            headerOptions
          )
          .subscribe(
            (res) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              const wasRecurring =
                !!this.paymentForm.controls.needAchRecurring.value;
              this.recurringData = null; // Reset recurring data after successful processing
              if (res.success) {
                if (wasRecurring) {
                  this.recurringRedirect.mark('ach', true);
                }
                this.success.emit(true);
              }
            },
            (err) => {
              
              this.warningRef = this.alertService.warningAlert({
                content: err.error?.errorMsg
              });
              if (this.warningRef) {
                this.subscriptions.push(
                  this.warningRef.afterClosed().subscribe(() => {
                    this.warningRef = undefined;
                  })
                );
              }
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
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
      this.paymentForm.controls.category.setValue(null);
    } else {
      this.paymentForm.controls.category.setValue(event);
    }
  }

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res: ICategoryDropdown) => {
        if (res?.success) {
          this.categoryId.set(res.id);
          this.paymentForm.controls.category.setValue(res);
        }
      })
    );
  }

  addBankEvent(event: IBankDropdown) {
    this.paymentsService.checkBankCanACH(event);
    this.paymentForm.controls.bankAc.setValue(event);
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  selectionChange(event: number) {
    // this.paymentForm.controls.industryType.setValue(event);
  }

  getPayeeCategory(payeeId: string) {
    this.subscriptions.push(
      this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
        if (res.data.id) {
          this.paymentForm.controls.category.setValue(res?.data);

          if (this.categorySetWithIdFunction) {
            this.categorySetWithIdFunction(res?.data?.id);
          }
        } else {
          this.paymentForm.controls.category.setValue(null);
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
    // this.paymentsService.isSameDayAch.update(() => false);
  }
}
