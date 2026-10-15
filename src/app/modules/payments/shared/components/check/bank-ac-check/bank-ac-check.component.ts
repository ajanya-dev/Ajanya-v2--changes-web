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
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of, firstValueFrom } from 'rxjs';
import { catchError, debounceTime, finalize, skip } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IConfirmAlert } from 'src/app/models/alert';
import { IApiRes } from 'src/app/models/api';
import {
  IBankDropdown,
  ICheckSerialNo,
  IRemittanceDetails
} from 'src/app/models/bank';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
  ICheckAttachmentData,
  ICheckData,
  ICheckDetailsData,
  IChequedata,
  IMailShippingCalculations,
  IMailShippingPayeeDetails,
  INewCheck,
  IShippingCostCalculation,
  IUpdateCheck,
  TCheckSendingMethod
} from 'src/app/modules/check/model/check';
import {
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import { CheckEmailModalComponent } from 'src/app/modules/check/modal/check-email-modal/check-email-modal.component';
import { DirectDepositComponent } from 'src/app/modules/check/modal/direct-deposit/direct-deposit.component';
import { CheckMailModalComponent } from 'src/app/modules/check/modal/mail-modals/check-mail-modal/check-mail-modal.component';
import { VerifySignatureModalComponent } from 'src/app/modules/check/modal/mail-modals/verify-signature-modal/verify-signature-modal.component';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import {
  IFreshBookExportsData,
  IPaymentConfig,
  IPaymentDetails,
  IPaymentExportsOptions,
  IQBDExportsData,
  IQBOExportsData,
  IUpdatePaymentBody,
  IpayeeEditData
} from 'src/app/modules/payments/model/payments';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import {
  IConnectedThirdPartyData,
  IFreshBookExpenseDetails,
  IQBOPushBackEnable,
  IpushBackEnableBody
} from 'src/app/modules/integration/model/integration';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatBadge } from '@angular/material/badge';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import {
  INetSuiteExportsData,
  INetSuitePushBack
} from 'src/app/modules/integration/netsuite/model/netsuite';
import { environment } from 'src/environments/environment';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { IHeaderData } from 'src/app/layout/model/header';
import { SubscriptionWarningModalComponent } from 'src/app/modules/subscription/modals/subscription-warning-modal/subscription-warning-modal.component';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { Store } from '@ngrx/store';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { IBillAttachment, IBillRemittance } from 'src/app/modules/bill/model/Bill';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddRemitanceV3Component } from '../../modals/add-remitance-v3/add-remitance-v3.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { BankAcDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';

enum ThirdpartyProviderCode {
  'xero' = 2,
  'zoho_books' = 3,
  'sage_business' = 5
}
interface IPaymentForm {
  amount: FormControl<string | null>;
  payee: FormControl<IPayeeDropdown | null>;
  bankAc: FormControl<IBankDropdown | null>;
  memo: FormControl<string | null>;
  issueDate: FormControl<string | null>;
  scheduleDate: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null | undefined>;
  remittance_type: FormControl<number | null>;
  remittance: FormControl<IRemittanceDetails[] | null>;
  commentIds: FormControl<string[] | null>;
  attachmentIds: FormControl<string[] | null>;
  chequeInvoiceNumber: FormControl<string | null>;
  checkNumber: FormControl<number | null>;
  noAmount: FormControl<boolean | null>;
  noSign: FormControl<boolean | null>;
  noPayee: FormControl<boolean | null>;
  noDate: FormControl<boolean | null>;
  payeeIdNumber: FormControl<string | undefined>;
  needRecurring: FormControl<boolean | null>;
}

/**
 * @description This component handles the bank to check payment functionality.
 */
@Component({
  selector: 'app-bank-ac-check',
  templateUrl: './bank-ac-check.component.html',
  styleUrls: ['./bank-ac-check.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    BankAcDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    CategoryDropdownV3Component,
    MatBadge,
    CommonButtonV35Component,
    MatMenuTrigger,
    MatMenu,
    MatCheckbox,
    MatMenuItem,
    WhiteLabelPipe,
    WhiteLabelDirective
  ]
})
export class BankAcCheckComponent implements OnInit, OnDestroy, OnChanges {
  /**
   * @description Dependancy injection using inject method
   */
  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private checkService = inject(CheckService);
  private paymentsService = inject(PaymentsService);
  public payeeDataService = inject(PayeeDataV35Service);
  private bankService = inject(BankService);
  private integrationService = inject(IntegrationService);
  private router = inject(Router);
  private billService = inject(BillService);
  private bankAccService = inject(BankAccountsService);
  private payeeService = inject(PayeeService);
  private scriptService = inject(ScriptService);
  private checkDesignService = inject(CheckDesignService);
  private invoiceService = inject(InvoiceService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private store = inject(Store);

  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() exportOptions = new EventEmitter<IPaymentExportsOptions>();
  @Input() QBOExportData: IQBOExportsData | undefined;
  @Input() FreshBookExportData: IFreshBookExportsData | undefined;
  @Input() QBDExportData: IQBDExportsData | undefined;
  @Input() paymentConfig: IPaymentConfig;
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Output() calculateFee = new EventEmitter();
  @Output() checkStatus = new EventEmitter<{ status: number }>();
  @Input() netSuiteExportData: INetSuiteExportsData | undefined;
  netsuiteExportEnabled = input<boolean>();
  payWithVendorCredit = input<boolean>();

  selectedBank: FormControl<IBankDropdown> = new FormControl();

  paymentForm: FormGroup<IPaymentForm>;
  loading: boolean;
  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  utils = Utils;

  faCircleQuestion = faCircleQuestion;
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);

  /**
   * @description This variable is used to display a warning message if the user attempts to submit a form with an already existing check field
   */
  isSubmitWithAlreadyExistedcheckfields: number;
  /**
   * @description This variable is used to display a warning message if the user attempts to submit a form with an already existing check number
   */
  isSubmitWithAlreadyExistedcheckNo: number;
  checkSendingMethod: string | undefined;
  selectedCheckPaperType: string;
  checkDetails: unknown[];
  bills: string[];
  checkdata: ICheckData = {};
  chequeAmount: unknown;
  errorCode: number;
  remitances: IRemittanceDetails[] | undefined;
  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  /**
   * @description This variable stores the configuration for QuickBooks export.
   */
  exportConfig: IPaymentExportsOptions = {
    isQBDPushBack: false,
    isQBOPushBack: false,
    isNetsuitePushBack: false,
    isFreshBooksPushBack: false,
  };

  isShowWarningForQBO: boolean;
  printLoading: boolean;
  remitanceTotal: number;
  remittanceGrandTotal: number;
  createdExistingAttachments: IAttachmentItem[] | ICheckAttachmentData[] | IBillAttachment[] = [];
  custom_elements: { id: number; custom_element: string }[] = [];
  customElementGroup: { [key: string]: string }[] = [];
  createdExistingComments: IComments[] = [];
  newRemittanceFormat: boolean;
  selectedPayeeDetails: IPayeeDropdown;
  commentsCount = 0;
  attachmentCount = 0;
  remittanceCount = 0;
  insertFromRemittance = false;
  isShowSendDropDown = false;
  isShowPrintDropDown = false;
  isBillCheck = false;
  customFieldFlag = false;
  IsCustom = false;
  remittanceType: number;
  thirdPartyProviderType: number;
  editPaymentForm: IpayeeEditData;
  hasRemitance: boolean;
  selectedBankAccount: IBankDropdown;
  faHistory = faClockRotateLeft;
  isWiygulEnterPrise = false;
  savedQboData$ = toObservable(this.paymentsService.onSaveQboDetails);
  encryptedPayeeId: string;
  headerData: IHeaderData;
  savedNetSuiteData$ = toObservable(this.paymentsService.onSaveNetSuiteDetails);
  savedFreshBooksData$ = toObservable(this.paymentsService.onSaveFreshBooksDetails);
  shouldReloadBankAccounts = signal(false);
  scheduledDate = signal(false);
  mindate: string | null = null;
  checkStatusValue: number | null = null;
  userPlugins = this.localStorageService.getItem('userPlugins');

  ngOnInit(): void {
    this.paymentsService.payeeDetails = undefined;
    this.checkStatusValue = Number(
      this.activatedRoute.snapshot.queryParams.checkStatus
    );
    this.initForm();
    this.initUpdate();
    this.loadCustomElements();
    this.getCheckPaperType();
    this.isPushBackEnable();
    this.handleCheckMailSuccess();
    this.billFetch();
    this.dropDownChanges();
    this.checkEnabledPlugins();
    this.waitForQbData();
    this.waitForFreshBooksData();
    this.encryptedPayeeId = this.activatedRoute.snapshot.queryParams?.payee_id;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    this.mindate = this.datePipe.transform(futureDate, 'yyyy-MM-dd');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.paymentConfig && changes.paymentConfig.currentValue?.paymentFormValue) {
      const {paymentFormValue} = changes.paymentConfig.currentValue;
      if (paymentFormValue && Object.keys(paymentFormValue).length > 0) {
        setTimeout(() => {
          if (this.paymentForm) {
            const issueDate = this.datePipe.transform(
              this.paymentConfig.paymentFormValue.issueDate,
              'yyyy-MM-dd'
            );
            this.paymentForm.patchValue({...paymentFormValue, issueDate} );
            this.selectedPayeeDetails = paymentFormValue.payee;
          }
        }, 0);
      }
    }
    
    this.checkChangesAndUpdateFormData(changes);
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        // Set selectedPayeeDetails immediately
        this.selectedPayeeDetails = this.changedInfo.selectedPayeeDetails;

        // Update form control
        if (this.paymentForm?.controls?.payee) {
          this.paymentForm.controls.payee.setValue(this.changedInfo.selectedPayeeDetails);
          this.paymentForm.controls.payeeIdNumber.setValue(
            this.changedInfo.selectedPayeeDetails.payeeIdNumber
          );
        }

        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
      }
    }
  }

  checkEnabledPlugins() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          this.headerData = res;
          if (res.enabledPlugins.includes('enterprise-wiygul')) {
            this.isWiygulEnterPrise = true;
            this.waitForNetSuiteData();
          }
        }
      })
    );
  }

  waitForQbData() {
    this.subscriptions.push(
      this.savedQboData$.subscribe((res) => {
        if (res) {
          this.checkSendingMethod = this.paymentConfig.mode === 'EDIT' ? 'update' : 'save';
          this.completeTransaction(this.checkSendingMethod as TCheckSendingMethod,res,'qbo');
        }
      })
    );
  }

  waitForNetSuiteData() {
    this.subscriptions.push(
      this.savedNetSuiteData$.subscribe((res) => {
        if (res) {
          this.completeTransaction(
            this.checkSendingMethod as TCheckSendingMethod,
            res,
            'netsuite'
          );
        }
      })
    );
  }

  waitForFreshBooksData() {
    this.subscriptions.push(
      this.savedFreshBooksData$.subscribe((res) => {
        if (res) {
          this.paymentForm.controls.amount.setValue(res.amount);
        }
      })
    );
  }

  /**
   * @description Fetch the bill details and populating all fields with the bill details
   */
  billFetch() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((response) => {
        if (response?.billId) {
          this.bills = [response.billId];
          if (typeof response.billId === 'string') {
            this.bills = response.billId.split(',');
          }
          this.subscriptions.push(
            this.billService
              .getBillBulkPaymentData(this.bills)
              .subscribe((res) => {
                if (res) {
                  this.isBillCheck = true;
                  let {totalAmount} = res.data;
                  if(this.payWithVendorCredit() && res.data.isVendorCreditAvailable === 1) {
                    totalAmount = res.data.amountAfterCreditApplied;
                  }
                  this.paymentForm.controls.amount.setValue(
                    totalAmount as string
                  );
                  let {memo} = res.data;
 
                  if (!this.userPlugins?.includes('no-bill-payment-memo-default') && !memo) {
                    memo = `Payment for Bill ${res.data.invoiceNumbers}`;
                  }
 
                  this.paymentForm.controls.memo.setValue(memo);
                  this.paymentForm.controls.chequeInvoiceNumber.setValue(
                    res.data.invoiceNumbers
                  );
                  this.thirdPartyProviderType = res.data.providerType;

                  if(res.data.remittance){
                    // Assign the remittance array if possible, else fallback to mapping over it and pushing each
                    if (Array.isArray(res.data.remittance)) {
                      this.remitances = res.data.remittance.map((remittance: IBillRemittance) => ({
                        invoiceNumber: remittance.invoiceNumber,
                        invoiceDate: remittance.invoiceDate,
                        itemDescription: remittance.description ?? remittance?.item_name,
                        grossAmount: remittance.total,
                      }));
                    }
                  }

                  const bankId = res.data.bankAccount.bankAccountId;
                  this.attachmentCount = res.data.attachments.length;
                  this.commentsCount = res.data.comment_count;
                  this.categoryId.set(res.data.category_id);
                  if (this.categorySetWithIdFunction && res.data.category_id) {
                    this.categorySetWithIdFunction(res.data.category_id);
                  }
                  const { payeeId } = res.data.payee;
                  this.loadCheckSerialNo(bankId);
                  this.subscriptions.push(
                    this.bankAccService
                      .getBankAccounts(
                        1,
                        res.data.bankAccount.bankAccountNickName
                      )
                      .subscribe((res1) => {
                        const bank = res1.data.find(
                          (el: IBankDropdown) => el.id === bankId
                        );
                        this.bankSelect(bank as IBankDropdown);
                      })
                  );
                  this.getPayee(res.data.payee.payeeName, payeeId);
                }
              })
          );
        }
      })
    );
  }

  getPayee(payeeName: string, payeeId: string){
    this.subscriptions.push(
      this.payeeService
        .getPayees(1, payeeName)
        .subscribe((res2) => {
          const payee = res2.data.find(
            (el: IPayeeDropdown) => el.id === payeeId
          );
            this.payeeSelect(payee as IPayeeDropdown, false);
        })
    );
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.paymentForm = new FormGroup<IPaymentForm>({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01)
      ]),
      payee: new FormControl(null, [Validators.required]),
      bankAc: new FormControl(null, [Validators.required]),
      memo: new FormControl(''),
      issueDate: new FormControl(
        (this.paymentConfig.mode === 'EDIT' || this.paymentConfig.mode === 'CLONE' ) ? 
        this.datePipe.transform(this.paymentConfig.paymentFormValue.issueDate, 'yyyy-MM-dd')
        : 
        this.dateToday,
        [Validators.required]
      ),
      scheduleDate: new FormControl(''),
      category: new FormControl(null),
      chequeInvoiceNumber: new FormControl(null),
      remittance_type: new FormControl(null),
      remittance: new FormControl(null),
      attachmentIds: new FormControl(null),
      commentIds: new FormControl(null),
      checkNumber: new FormControl(null, [Validators.required]),
      noAmount: new FormControl(false),
      noSign: new FormControl(false),
      noPayee: new FormControl(false),
      noDate: new FormControl(false),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      needRecurring: new FormControl(false)
    });
    if (this.paymentConfig.mode === 'EDIT') {
      this.paymentForm.disable();
    }
    this.subscriptions.push(
      this.paymentForm.controls.bankAc.valueChanges
        .pipe(skip(this.paymentConfig.mode === 'EDIT' ? 2 : 0))
        .subscribe((bankAc) => {
          if (bankAc?.id) {
            this.loadCheckSerialNo(bankAc.id);
          }
        }),
      this.paymentForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );
    this.subscriptions.push(
      this.paymentForm.controls.payee.valueChanges.subscribe((val) => {
        if (val && val.id) {
          this.getPayeeDetails(val.id);
        }
      })
    );
    this.subscriptions.push(
      this.paymentForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.calculateFee.emit({
            amount,
            paymentSource: 'bank',
            paymentMethod: 'mail'
          });
        })
    );
    this.setCommonFormValues();
    if (this.paymentConfig.mode !== 'EDIT') this.handleProcessWithout();
    this.editPaymentForm = this.paymentForm.getRawValue();
    this.makeCategoryRequired();
  }

  makeCategoryRequired() {
    if(this.userPlugins?.includes('enterprise-wiygul')){
      this.paymentForm.controls.category.setValidators([Validators.required]);
    }else{
      this.paymentForm.controls.category.clearValidators();
    }
    this.paymentForm.controls.category.updateValueAndValidity();
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
      this.paymentForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig.paymentFormValue) {
      this.paymentForm.patchValue({ ...this.paymentConfig.paymentFormValue });
      if (
        this.paymentConfig.mode === 'EDIT' ||
        this.paymentConfig.mode === 'CLONE'
      ) {
        const issueDate = this.datePipe.transform(
          this.paymentConfig.paymentFormValue.issueDate,
          'yyyy-MM-dd'
        );
        this.paymentForm.patchValue({issueDate});
      }
      if (
        !(
          this.paymentForm.getRawValue()?.chequeInvoiceNumber &&
          this.paymentForm.getRawValue()?.chequeInvoiceNumber !== ''
        ) &&
        (this.paymentConfig.mode === 'CREATE' ||
          this.paymentConfig.mode === 'CLONE')
      ) {
        this.paymentForm.controls.chequeInvoiceNumber.setValue(
          this.paymentConfig.paymentFormValue.invoiceNumber ?? ''
        );
      }
    }
  }

  /**
   * @description Handles the changes in the form controls for processing checks without certain fields.
   */
  handleProcessWithout() {
    this.subscriptions.push(
      this.paymentForm.controls.noAmount.valueChanges.subscribe(
        (changeValue) => {
          if (changeValue) {
            this.alertService.infoAlert({
              content:
                'This will enable processing check without amount, producing a blank check.'
            });
            if (!this.isBillCheck) {
              this.paymentForm.controls.amount.reset();
            }
            this.paymentForm.controls.amount.disable();
          } else if (!this.isBillCheck) {
            this.paymentForm.controls.amount.enable();
          }
        }
      )
    );
    this.subscriptions.push(
      this.paymentForm.controls.noPayee.valueChanges.subscribe(
        (changeValue) => {
          if (changeValue) {
            this.alertService.infoAlert({
              content: `This will enable processing check without check's ${
                environment.env_id === 'compass' ? 'vendor' : 'payee'
              }, producing a blank check.`
            });
            if (!this.isBillCheck) {
              this.paymentForm.controls.payee.reset();
            }
            this.paymentForm.controls.payee.disable();
          } else if (!this.isBillCheck) {
            this.paymentForm.controls.payee.enable();
          }
        }
      )
    );
    this.subscriptions.push(
      this.paymentForm.controls.noSign.valueChanges.subscribe((changeValue) => {
        if (changeValue) {
          this.alertService.infoAlert({
            content:
              'This will enable processing check without signature, producing a blank check.'
          });
        }
      })
    );
    this.subscriptions.push(
      this.paymentForm.controls.noDate.valueChanges.subscribe((changeValue) => {
        if (changeValue) {
          this.alertService.infoAlert({
            content:
              "This will enable processing check without check's date, producing a blank check."
          });
          if (!this.isBillCheck) {
            this.paymentForm.controls.issueDate.reset();
          }
          this.paymentForm.controls.issueDate.disable();
        } else if (!this.isBillCheck) {
          this.paymentForm.controls.issueDate.enable();
        }
      })
    );
  }

  initUpdate() {
    this.paymentConfig.checkDetails = undefined;
    if (this.paymentConfig.mode !== 'EDIT') return;
      const paymentDetails = this.paymentConfig?.paymentDetails;
      if (
        paymentDetails?.transferTypeCode === 'check' &&
        paymentDetails?.transfer?.id
      ) {
        this.getCheckData(paymentDetails.transfer.id);
        return;
      } 
      
      if (paymentDetails) {
        this.paymentForm.enable();
        this.handleProcessWithout();
      }
  }

  /**
   * @description Retrieves check data by selected ID and updates the payment configuration with the check details.
   * @param selectedId -The ID of the selected check.
   */
  getCheckData(selectedId: string) {
    this.subscriptions.push(
      this.checkService
        .getChecksById(selectedId)
        .subscribe((res: IApiRes<ICheckDetailsData>) => {
          if (res.success) {
            this.paymentForm.enable();
            /** setting the check details into payment config and select the process without option already selected */
            this.paymentConfig.checkDetails = res.data;
            if (
              this.paymentConfig.mode === 'EDIT' &&
              this.paymentConfig.checkDetails.status === 50
            ) {
              this.scheduledDate.set(true);
              this.paymentForm.controls.scheduleDate.setValue(
                res.data.scheduleDate
              );

              this.paymentForm.controls.scheduleDate.setValidators([
                Validators.required
              ]);
              this.paymentForm.controls.scheduleDate.updateValueAndValidity();

              this.paymentForm.controls.payee.disable();
              this.paymentForm.controls.issueDate.disable();
              this.paymentForm.controls.chequeInvoiceNumber.disable();
              this.paymentForm.controls.bankAc.disable();
              this.selectedBank.disable();
              this.paymentForm.controls.checkNumber.disable();
              this.paymentForm.controls.category.disable();
              this.paymentForm.controls.payeeIdNumber.disable();
              this.checkStatus.emit({
                status: this.paymentConfig.checkDetails.status
              });
            }
            this.getCustomElementsValue();
            this.hasRemitance = !!res.data.remittance.length;
            if (this.hasRemitance) {
              this.remitances = res.data.remittance;
              this.remitanceTotal = res.data.remittanceTotalAmount;
              this.insertFromRemittance = this.hasRemitance;
            }
            this.remittanceType = res.data.remittance_type;
            if (res.data.isNoAmount === 1) {
              this.paymentForm.controls.noAmount.setValue(
                res.data.isNoAmount === 1
              );
              this.paymentForm.controls.amount.reset();
              this.paymentForm.controls.amount.disable();
            }
            if (res.data.isNoPayee === 1) {
              this.paymentForm.controls.noPayee.setValue(true);
              this.paymentForm.controls.payee.reset();
              this.paymentForm.controls.payee.disable();
            }
            if (res.data.isNoDate === 1) {
              this.paymentForm.controls.noDate.setValue(
                res.data.isNoDate === 1
              );
              this.paymentForm.controls.issueDate.reset();
              this.paymentForm.controls.issueDate.disable();
            } else {
              this.paymentForm.controls.issueDate.setValue(res.data.date);
            }
            this.paymentForm.controls.noSign.setValue(res.data.isNoSign === 1);
            this.handleProcessWithout();
            this.getCheckAttachments();
            this.getCheckComments();
          }
        })
    );
  }

  /**
   * @description This function is for fetching check's attachments and set datas into the global variable "createdExistingAttachments"
   */
  getCheckAttachments() {
    if (this.paymentConfig?.checkDetails?.id)
      this.subscriptions.push(
        this.checkService
          .getCheckAttachment(this.paymentConfig?.checkDetails?.id)
          .subscribe((data: IApiRes<ICheckAttachmentData[]>) => {
            this.attachmentCount = data.data.length;
            this.createdExistingAttachments = data.data;
          })
      );
  }

  /**
   * @description This function is for fetching check's comments and set datas into the global variable "createdExistingComments"
   */
  getCheckComments() {
    if (this.paymentConfig?.checkDetails?.id)
      this.subscriptions.push(
        this.checkService
          .getAllCheckComments(this.paymentConfig?.checkDetails?.id)
          .subscribe((data: IApiRes<IComments[]>) => {
            this.commentsCount = data.data.length;
            this.createdExistingComments = data.data;
          })
      );
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean) {
    this.selectedPayeeDetails = event;
    if (event?.id) {
      if (fromTemplate === false) {
        this.paymentForm.controls.payee.setValue(event);
      }
      this.paymentForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee(): void {
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearBankAccount(event: IPayeeViewBank): void {
    this.paymentForm.controls.bankAc.reset();
    this.paymentForm.controls.bankAc.markAllAsTouched();
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  /**
   * @description Get bank drop down changes.
   */
  dropDownChanges() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((bankItem) => {
        if (bankItem !== this.selectedBankAccount) {
          this.selectedBankAccount = bankItem;
          this.bankSelect(bankItem);
        }
      })
    );
  }

  bankSelect(event: IBankDropdown) {
    const lastValue = this.paymentForm.controls.bankAc.value;
    if (event && lastValue !== event) {
      this.paymentForm.controls.bankAc.setValue(event);
      this.selectedBank.setValue(event); // Also set the selectedBank FormControl
    }
    if (
      (this.thirdPartyProviderType === 3 ||
        this.thirdPartyProviderType === 2 ||
        this.thirdPartyProviderType === 5) &&
      this.paymentForm.controls.bankAc.value != null
    ) {
      this.checkBanKAccount(this.paymentForm.controls.bankAc.value.id);
    }
  }

  /**
   * @description - Checks the validity of a bank account for a selected bank and handles errors.
   * @param selectedBank  - The selected bank for which the bank account is being checked.
   */
  checkBanKAccount(selectedBank: string) {
    this.subscriptions.push(
      this.invoiceService
        .Bankchecking(
          selectedBank,
          this.bills[0],
          'bill',
          ThirdpartyProviderCode[this.thirdPartyProviderType]
        )
        .pipe(
          catchError((error) => {
            if (error.error.errorCode === 600) {
              const dialog = this.alertService.confirmAlert({
                content: error.error.errorMsg
              });
              dialog.afterClosed().subscribe((res) => {
                if (!res) {
                  this.paymentForm.controls.bankAc.reset();
                  this.sharedService.setNewBankCreatedData('');
                  this.paymentForm.controls.checkNumber.reset();
                }
              });
            }
            return of(false);
          })
        )
        .subscribe()
    );
  }

  getPayeeCategory(payeeId: string) {
    this.subscriptions.push(
      this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
        if (res.data.id) {
          this.paymentForm.controls.category.setValue(res?.data);
          this.categoryId.set(res?.data?.id);
          if (this.categorySetWithIdFunction) {
            this.categorySetWithIdFunction(res?.data?.id);
          }
        } else {
          this.paymentForm.controls.category.setValue(undefined);
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

  /**
   * @description This function is triggered when a category is selected and sets the form control value
   * @param event - The selected category details from the category dropdown
   */
  categorySelect(event: ICategoryDropdown) {
    if (event?.id) {
      this.paymentForm.controls.category.setValue(event);
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
        .getPayeeDetails(payeeId)
        .pipe(debounceTime(100))
        .subscribe((res) => {
          if (res) {
            this.payeeDetails = res;
            if (this.changedInfo?.selectedPayeeDetails?.id) {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                isMoreDetailsLoading: false
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false
              });
            }
            this.getPayeeCategory(payeeId);
            if (this.paymentForm?.controls?.payeeIdNumber) {
            this.paymentForm.controls.payeeIdNumber.setValue(
              this.payeeDetails?.payee_information.payee_id_number
            );
          }
          }
        })
    );
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

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
        this.paymentForm.controls.category.setValue(res);
      }
    });
  }

  checkChangesAndUpdateFormData(changes: SimpleChanges) {
    const QBOTotal = changes?.QBOExportData?.currentValue?.QBOTotal;
    if (QBOTotal) {
      this.paymentForm?.controls.amount.setValue(QBOTotal);
    }
    const QBDTotal = changes?.QBDExportData?.currentValue?.QBDTotal;
    if (QBDTotal) {
      this.paymentForm?.controls.amount.setValue(QBDTotal);
    }

    const netSuiteTotal = changes?.netSuiteExportData?.currentValue?.netSuiteTotal;
    if (netSuiteTotal) {
      this.paymentForm?.controls.amount.setValue(netSuiteTotal);
    }
  }

  /**
   *
   *@description Creates and returns the payment body for saving a payment.
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * @returns -The payment body for saving a payment.
   */
  createCheckBody(
    checkSendingMethod: TCheckSendingMethod,
    thirdpartyData?: IQBOExportsData | INetSuiteExportsData | IFreshBookExpenseDetails,
    thirdPartyName?: 'netsuite' | 'qbo' | 'freshbooks'
  ): INewCheck {
    const formData = this.paymentForm.getRawValue();
    const issueDate = this.datePipe.transform(formData.issueDate, 'yyyy-MM-dd');
    const scheduleDate = this.datePipe.transform(
      formData.scheduleDate,
      'yyyy-MM-dd'
    );
    if (thirdpartyData && thirdPartyName === 'qbo') {
      this.QBOExportData = thirdpartyData as IQBOExportsData;
    }
    if (thirdpartyData && thirdPartyName === 'netsuite') {
      this.netSuiteExportData = thirdpartyData as INetSuiteExportsData;
    }
    if (thirdpartyData && thirdPartyName === 'freshbooks') {
      this.FreshBookExportData = thirdpartyData as IFreshBookExportsData;
    }
    return {
      bankAccount: formData.bankAc?.id,
      payee: formData.payee?.id ?? '',
      amount: formData.amount ?? '',
      checkIssueDate: issueDate,
      scheduleDate: scheduleDate,
      category: formData.category?.id ?? '',
      checkSerialNo: (formData.checkNumber as number) ?? '',
      accountNo: formData.payeeIdNumber ?? '',
      invoiceNo: formData.chequeInvoiceNumber ?? '',
      note: '',
      memo: formData.memo ?? '',
      no_amount: Number(formData.noAmount),
      no_sign: Number(formData.noSign),
      no_payee: Number(formData.noPayee),
      no_date: Number(formData.noDate),
      isVendorCreditApplied: 0,

      vendorCredit: 0,
      commentIds: this.createdExistingComments.map((e) => e.id),
      attachmentIds: this.createdExistingAttachments.map((e) => e.id),
      attachRemittanceToCheck: this.insertFromRemittance ? '1' : '0',
      attachCategoryToCheck: this.QBOExportData ? '1' : '0',
      attachExpenseToCheck: this.QBDExportData ? '1' : '0',
      attachNetsuiteExpenseToCheck: this.netSuiteExportData ? '1' : '0',
      remittance_type: this.isRemittanceModified(),
      remittance: this.insertFromRemittance ? this.remitances : [],
      categoryDetails: this.QBOExportData ? this.QBOExportData.formValue : [],
      expenseDetails: this.QBDExportData ? this.QBDExportData.formValue : '',
      netsuiteExpenseDetails: this.netSuiteExportData
        ? this.netSuiteExportData.formValue
        : '',
      realmId: this.QBOExportData ? this.QBOExportData.realmId : '',
      locationId: this.QBOExportData ? this.QBOExportData.locationId : '',
      mappingId: this.QBOExportData ? this.QBOExportData.qbBankId : '',
      qbBankId: this.QBDExportData?.qbdBankId ?? '',
      companyId: this.QBDExportData?.companyId ?? '',
      freshbookCompanyId: this.FreshBookExportData?.companyId ?? '',
      attachFreshbooksExpenseToCheck: this.FreshBookExportData?.attachFreshbooksExpenseToCheck ?? '',
      freshbookExpenseDetails: [{
        categoryId: this.FreshBookExportData?.categoryId ?? '',
        description: this.FreshBookExportData?.description ?? '',
        amount: this.FreshBookExportData?.amount ?? ''
      }],
      netsuiteBankId: this.netSuiteExportData?.netSuiteBankId ?? '',
      warning: this.paymentConfig.mode === 'CLONE' ? 1 : this.isSubmitWithAlreadyExistedcheckfields,
      checkNumberWarning: this.isSubmitWithAlreadyExistedcheckNo,
      bills: this.bills?.length > 0 ? this.bills : [],
      isMapping: 0,
      quickbook: 0,
      permission_action: (() => {
        if (
          checkSendingMethod === 'printCheck' ||
          checkSendingMethod === 'printWhiteCheck'
        ) {
          return 1;
        }
        if (checkSendingMethod === 'mail') {
          return 2;
        }
        if (checkSendingMethod === 'email') {
          return 3;
        }
        if (checkSendingMethod === 'ach') {
          return 4;
        }
        return 0;
      })(),
      customElements: this.customElementGroup,
      // this.customElementGroup,
      isCloned: 0
      // this.isClonedCheck? 1 : 0
    };
  }

  /**
   * @description Completes the transaction based on the selected check sending method.
   * @param checkSendingMethod -The selected check sending method.
   *
   */
  completeTransaction(checkSendingMethod: TCheckSendingMethod, thirdpartyData?: IQBOExportsData | INetSuiteExportsData | IFreshBookExpenseDetails,thirdPartyName?: 'netsuite' | 'qbo' | 'freshbooks') {
   
    if (checkSendingMethod === 'ach' && this.paymentsService.checkForComplianceFreeze()) {
      this.paymentsService.openComplianceFreezeModal();
      return;
    }

    const selectedPayee =
      this.selectedPayeeDetails ||
      this.changedInfo?.selectedPayeeDetails ||
      this.paymentForm.controls.payee.value;
    if (checkSendingMethod === 'ach' && selectedPayee?.isFreezed) {
      this.alertService.infoAlert({
        content: 'This payee is temporarily restricted from processing payments'
      });
      return;
    }

    this.checkSendingMethod = checkSendingMethod;
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const verificationDetails: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');
    if (verificationDetails.verification === 0) {
      this.router.navigate(['/manage/users/verify-email-phone'], {
        queryParams: {
          returnUrl: 'manage/payments-table/index'
        }
      });
      return;
    }

    const CategoryId = this.paymentForm.value.category?.id ?? '';
    if (
      this.isWiygulEnterPrise &&
      this.exportConfig.isNetsuitePushBack &&
      CategoryId === ''
    ) {
      this.openWarningAlert('Category field is required');
      return;
    }

    if (
      checkSendingMethod === 'mail' &&
      this.isPayeeEdited(this.paymentForm.getRawValue(), this.editPaymentForm)
    ) {
      this.sendMail();
      return;
    }
    if (
      checkSendingMethod === 'email' &&
      this.isPayeeEdited(this.paymentForm.getRawValue(), this.editPaymentForm)
    ) {
      this.sendEmail();
      return;
    }

    if (this.exportConfig.isQBOPushBack && this.netsuiteExportEnabled() && !thirdpartyData && !this.exportConfig.isFreshBooksPushBack) {
      this.paymentsService.onClickSaveButton.set(true);
      return;
    }

    if (this.isWiygulEnterPrise && this.exportConfig.isNetsuitePushBack && !thirdpartyData) {
      this.paymentsService.autoSaveNetSuiteDetails.set(true);
      return;
    }
    
    if (this.isShowWarningForQBO && ((!thirdpartyData && thirdPartyName === 'qbo') && this.netsuiteExportEnabled()) && this.QBOExportData?.hasQboExportData) {
      this.openWarningAlert('Category detail is required');
      return;
    }

    if (
      this.paymentConfig.paymentDetails?.transferTypeCode !== 'check' &&
      this.paymentConfig.mode === 'EDIT'
    ) {
      this.updateTransferTypeAndCompleteTransaction(checkSendingMethod);
      return;
    }

    this.saveAndUpdate(checkSendingMethod,thirdpartyData,thirdPartyName);
  }

  saveAndUpdate(
    checkSendingMethod: TCheckSendingMethod,
    thirdpartyData?: IQBOExportsData | INetSuiteExportsData | IFreshBookExpenseDetails,
    thirdPartyName?: 'netsuite' | 'qbo' | 'freshbooks'
  ) {
    const checkId = this.paymentConfig.paymentDetails?.transfer.id ?? '';
    const checkBody = this.createCheckBody(
      checkSendingMethod,
      thirdpartyData,
      thirdPartyName
    );

    const callCheckApi = () => {
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        (this.paymentConfig.mode === 'EDIT'
          ? this.checkService.updateCheck(checkId, checkBody)
          : this.checkService.createCheck(checkBody)
        )
          .pipe(
            finalize(() => {
              this.loading = false;
              if (
                checkSendingMethod === 'save' ||
                checkSendingMethod === 'update'
              ) {
                this.paymentsService.isPaymentProcessingSubject.next(false);
              }
            }),
            catchError((e) => {
              if (e?.error.errorCode === 190) {
                const warn = this.openConfirmAlert(
                  'Do you want to proceed anyway?',
                  e.error.errorMsg
                );
                warn.afterClosed().subscribe((r) => {
                  if (r) {
                    this.isSubmitWithAlreadyExistedcheckfields = 1;
                    this.completeTransaction(checkSendingMethod);
                  } else {
                    this.paymentsService.isPaymentProcessingSubject.next(false);
                  }
                });
              }
              if (e?.error.errorCode === 213) {
                const warn = this.openConfirmAlert(
                  'Do you want to proceed anyway?',
                  e.error.errorMsg
                );
                warn.afterClosed().subscribe((r) => {
                  if (r) {
                    this.isSubmitWithAlreadyExistedcheckNo = 1;
                    this.completeTransaction(checkSendingMethod);
                  } else {
                    this.paymentsService.isPaymentProcessingSubject.next(false);
                  }
                });
              }
              if (e?.error.errorCode === 515) {
                this.openPayeeWarning(e?.error.errorMsg);
              }
              if (
                ![213, 190].includes(e?.error.errorCode) &&
                e.status !== 422 &&
                e?.error.permissionRequired !== 'check-create' &&
                e?.error.errorCode
              ) {
                
                this.paymentsService.isPaymentProcessingSubject.next(false);
                this.alertService.warningAlert({
                  content: e?.error.errorMsg
                });
              }

              if (e?.error.errorCode === 731) {
                this.alertService.warningAlert({
                  title: 'No Bank Account Found',
                  content: e?.error.errorMsg,
                  doneMsg: 'Add Bank Account',
                  cancelMsg: 'Cancel',
                  isCancel: true
                }).afterClosed().subscribe((result) => {
                  if (result) {
                    this.router.navigate(['/manage/users/add-bank-account']);
                  }
                });
              }

              return of(false);
            })
          )
          .subscribe((res) => {
            const response = res as IUpdateCheck;
            this.paymentsService.autoSaveNetSuiteDetails.set(false);
            if (response.success) {
              this.isSubmitWithAlreadyExistedcheckNo = 0;
              this.isSubmitWithAlreadyExistedcheckfields = 0;
              // Reset amount after successful check process
              if (this.exportConfig.isFreshBooksPushBack) {
                this.paymentForm.controls.amount.reset();
                this.paymentsService.onSaveFreshBooksDetails.set(undefined);
              }
              
              this.localStorageService.updateNestedData(
                'gettingStartedData',
                'payment',
                1
              );
              this.onRedirect(
                checkSendingMethod,
                this.paymentConfig.mode === 'EDIT',
                response.data
              );
            } else {
              this.paymentsService.isPaymentProcessingSubject.next(false);
            }
          })
      );
    };

    if ((checkSendingMethod === 'save' || checkSendingMethod === 'update') && !this.exportConfig.isFreshBooksPushBack) {
      callCheckApi();
    } else {
      // Check if we actually have payee data
      const payeeData = this.selectedPayeeDetails || this.changedInfo?.selectedPayeeDetails || this.paymentForm.controls.payee.value;
      if (!payeeData) {
        this.alertService.warningAlert({
          content: 'Please select a payee before proceeding with the payment.',
          close: false
        });
        this.loading = false;
        return;
      }

      if(this.isSubmitWithAlreadyExistedcheckfields === 1 || this.isSubmitWithAlreadyExistedcheckNo === 1){
        callCheckApi();
        return;
      }

      const dialogRef = this.paymentsService.openPaymentConfirmationModal({
        accNumber: this.selectedBankAccount.accountNumber,
        bankName: this.selectedBankAccount.nickName,
        payeeName: payeeData.name || payeeData.nickName || '',
        paymentMethod:
          checkSendingMethod === 'ach'
            ? 'ACH / Direct Deposit'
            : checkSendingMethod === 'mail'
              ? 'Check Mail'
              : checkSendingMethod === 'email'
                ? 'E-Check'
                : checkSendingMethod === 'printCheck'
                  ? 'Check Print'
                  : checkSendingMethod === 'printWhiteCheck'
                    ? 'White Check Print'
                    : '',
        amount: Number(checkBody.amount).toFixed(2)
      });
      this.loading = false;
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          callCheckApi();
        }
      });
    }
  }

  /**
   * Enables user to mail when changes made on the cheque details
   */
  sendMail() {
    this.getMailPaperType();
    this.shippingType();
    const selectedCheckId: string[] = [];
    selectedCheckId.push(this.paymentConfig.paymentDetails?.transfer.id ?? '');
    this.subscriptions.push(
      this.checkService
        .getChequeDetails({ ids: selectedCheckId, is_signature: 1 })
        .pipe(
          finalize(() => {
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }),
          catchError((e) => {
            this.paymentsService.isPaymentProcessingSubject.next(false);
            if (e?.error.permissionRequired !== 'check-mail') {
              this.alertService.warningAlert({ content: e?.error.errorMsg });
            }
            return of(e);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.checkdata.chequedata = res.data;
            this.shippingCalculation();
          }
        })
    );
  }

  sendEmail() {
    const ids: string[] = [];
    ids.push(this.paymentConfig.paymentDetails?.transfer.id ?? '');
    this.subscriptions.push(
      this.checkService
        .getEmails({ ids })
        .pipe(
          finalize(() => {
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }),
          catchError((err) => {
            return of(false);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            const emailRows = data.data;
            this.dialog
              .open(CheckEmailModalComponent, {
                maxWidth: '93%',
                width: '1200px',
                disableClose: true,
                data: {
                  serverData: emailRows,
                  needRecurring: this.paymentForm.controls.needRecurring.value || false
                },
                panelClass: 'modal-overflow-visible'
              })
              .afterClosed()
              .subscribe((get) => {
                this.paymentsService.isPaymentProcessingSubject.next(false);
                
                if (!get) {
                  this.success.emit({
                    title: 'Your Payment is Saved',
                    content:
                      'Your payment has been saved. Please check the status in your records.'
                  });
                } else if (get.errorCode === 123) {
                  this.ApprovalCheck(get, 'E-mailed');
                  this.success.emit({
                    title: 'Your Payment is Saved',
                    content:
                      'Your payment has been saved. Please check the status in your records.'
                  });
                } else {
                  this.success.emit(true);
                }
              });
          }
        })
    );
  }

  /**
   * @description Function to check value changes
   * @returns
   */
  isPayeeEdited(
    paymentFormValue: IpayeeEditData,
    editFormValue: IpayeeEditData
  ): boolean {
    const keys = Object.keys(editFormValue);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (
        editFormValue[key as keyof IpayeeEditData] !==
        paymentFormValue[key as keyof IpayeeEditData]
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * @description Updates the transfer type to "check" and completes completes the transaction based on the selected check sending method.
   * @param checkSendingMethod -The selected check sending methode
   */
  updateTransferTypeAndCompleteTransaction(
    checkSendingMethod: TCheckSendingMethod
  ) {
    if (this.paymentConfig.paymentDetails?.id) {
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      const formData = this.paymentForm.getRawValue();
      const issueDate = this.datePipe.transform(
        formData.issueDate,
        'yyyy-MM-dd'
      );
      const sendingData: IUpdatePaymentBody = {
        transferType: 'check',
        amount: Number(formData.amount),
        description: formData.memo ?? '',
        payee: formData.payee?.id ?? '',
        paymentDueDate: issueDate as string,
        referenceNo: formData.chequeInvoiceNumber ?? '',
        sourceId: formData.bankAc?.id,
        sourceType: 'bankaccount',
        commentIds: this.createdExistingComments.map((e) => e.id),
        attachmentIds: this.createdExistingAttachments.map((e) => e.id),
        payeeIdNumber: formData.payeeIdNumber ?? '',
        payeeEmail: formData.payee?.email ?? ''
      };
      this.subscriptions.push(
        this.paymentsService
          .updatePayment(this.paymentConfig.paymentDetails?.id, sendingData)
          .subscribe(
            (res: IApiRes<IPaymentDetails>) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (res.success && res.data?.transfer?.id) {
                this.paymentConfig.paymentDetails = res.data;
                this.completeTransaction(checkSendingMethod);
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

  /**
   * @description Redirects the user based on the selected button type and performs corresponding actions.
   * @param buttonType -The selected check sending methode
   * @param edit -Indicates if the payment is being edited.
   * @param checkData -The data of the checks
   */
  onRedirect(
    buttonType: TCheckSendingMethod,
    edit: boolean,
    checkData: { id: string; serialNo?: string }
  ): void {
    const checkNo = checkData.serialNo;
    const createContent = `New check is created with serial number ${checkNo}.`;
    const UpdateContent = `Check is updated with serial number ${checkNo}.`;
    const AlertContent = !edit ? createContent : UpdateContent;
    switch (buttonType) {
      case 'save':
        this.success.emit({
          title: 'Your Payment is Saved',
          content:
            'Your payment has been saved. Please check the status in your records.'
        });
        this.payeeDetailsEvents.emit({
          payeeDropdownDetails: undefined,
          isMoreDetailsLoading: false
        });
        this.scriptService.gtagEventScript('check-created', {
          amount: this.chequeAmount
        });
        break;
      case 'update':
        this.success.emit({
          title: 'Your Payment has been Updated',
          content:
            'Your payment has been Updated. Please check the status in your records.'
        });
        this.scriptService.gtagEventScript('check-created', {
          amount: this.chequeAmount
        });
        break;
      case 'printCheck':
        this.onPrintCheck(edit, checkData.id, AlertContent, 'check');
        break;
      case 'printWhiteCheck':
        this.onPrintCheck(edit, checkData.id, AlertContent, 'white_paper');
        break;
      case 'mail':
        this.onMailCheck(edit, AlertContent, checkData.id);
        break;
      case 'email':
        this.onEmailCheck(edit, AlertContent, checkData.id);
        break;
      case 'ach':
        this.openDirectDepositModal(edit, AlertContent, checkData.id);
        break;
      default:
        break;
    }
  }

  onPrintCheck(
    edit: boolean,
    checkId: string,
    AlertContent: string,
    type: 'check' | 'white_paper'
  ): void {
    if (this.selectedBankAccount?.isVirtualAccount) {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${this.selectedBankAccount?.accountNumber}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(
            VirtualAccountConfirmationModalComponent,
            {
              maxWidth: '1200px',
              width: '100%',
              disableClose: true,
              data: { bankAccountIds: [this.selectedBankAccount?.id] }
            }
          );

          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true);
              this.store.dispatch(
                bankAccountsActions.loadBankAccounts({
                  searchTerm: '',
                  context: undefined,
                  isReload: true
                })
              );
              this.paymentsService.isPaymentProcessingSubject.next(true);
              this.processPrintCheck(edit, checkId, AlertContent, type);
            }
          });
        }
      });
    } else if (
      this.selectedBankAccount?.isVirtualAccount === 0 &&
      this.selectedBankAccount?.verifiedBy === 88 &&
      this.selectedBankAccount?.verified === 0
    ) {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      this.alertService
        .failedAlert({
          content:
            'Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const confirmationDialog = this.dialog.open(
              VirtualAccountConfirmationModalComponent,
              {
                maxWidth: '1200px',
                width: '100%',
                disableClose: true,
                data: { bankAccountIds: [this.selectedBankAccount?.id] }
              }
            );
            confirmationDialog.afterClosed().subscribe((result) => {
              if (result && result.success) {
                this.shouldReloadBankAccounts.set(true);
                this.paymentsService.isPaymentProcessingSubject.next(true);
                this.processPrintCheck(edit, checkId, AlertContent, type);
              }
            });
          }
        });
    } else {
      this.processPrintCheck(edit, checkId, AlertContent, type);
    }
  }

  /**
   * @description Prints the check based on the specified parameters.
   * @param  edit - Indicates if the payment is being edited.
   * @param  checkId - The ID of the check.
   * @param  AlertContent - The content for the success alert.
   * @param  type - The type of the check paper.
   *
   */
  processPrintCheck(
    edit: boolean,
    checkId: string,
    AlertContent: string,
    type: 'check' | 'white_paper'
  ): void {
    if (this.paymentForm.controls.bankAc.value?.isItZil) {
      this.zilBankCheck('printed');
      this.success.emit({
        title: 'Your Payment is Saved',
        content:
          'Your payment has been saved. Please check the status in your records.'
      });
      return;
    }
    this.printLoading = true;
    const itemIds: { checkId: string[]; paperType: string | number } = {
      checkId: [],
      paperType: type === 'check' ? this.selectedCheckPaperType : 6
    };
    itemIds.checkId = [checkId];

    this.subscriptions.push(
      this.checkService
        .printMultiCheck(itemIds)
        .pipe(
          finalize(() => {
            this.printLoading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }),

          catchError((error) => {
            if (error.error.errorCode === 'plaid_virtual_account') {
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if (res) {
                  const confirmationDialog = this.dialog.open(
                    VirtualAccountConfirmationModalComponent,
                    {
                      maxWidth: '1200px',
                      width: '100%',
                      disableClose: true,
                      data: error.error
                    }
                  );
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                      this.onPrintCheck(edit, checkId, AlertContent, type);
                    }
                  });
                }
              });
            }
            if (error.error.errorCode === 125) {
              this.alertService.warningAlert({
                content:
                  'This check cannot be printed. Administrator approval is required before proceeding'
              });
              // this.Onclickcheck(error);
            }
            if (error.error.errorCode === 123) {
              this.ApprovalCheck(error, 'printed');
              if (error) {
                // this.navigateByUrl('/manage/cheque');
              }
            }
            return of(false);
          })
        )

        .subscribe((res) => {
          const response = res as IApiRes<{ url: string }>;
          if (response?.success) {
            this.scriptService.gtagEventScript('check-printed', {
              amount: this.chequeAmount
            });
            const urlLoaded = window.open(response.data.url);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const dref = this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the pdf file. You may disable popup blocker from your browser settings',
                'Try Again'
              );

              dref.afterClosed().subscribe(() => {
                window.open(response.data.url);
                setTimeout(() => {
                  this.success.emit(true);
                }, 300);
              });
            } else {
              setTimeout(() => {
                this.success.emit(true);
              }, 300);
            }
          }
        })
    );
  }

  onMailCheck(_edit: boolean, AlertContent: string, id: string) {
    if (this.selectedBankAccount?.isVirtualAccount) {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${this.selectedBankAccount?.accountNumber}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(
            VirtualAccountConfirmationModalComponent,
            {
              maxWidth: '1200px',
              width: '100%',
              disableClose: true,
              data: { bankAccountIds: [this.selectedBankAccount?.id] }
            }
          );

          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true);
              this.paymentsService.isPaymentProcessingSubject.next(true);
              this.processMailCheck(_edit, AlertContent, id);
            }
          });
        }
      });
    } else if (
      this.selectedBankAccount?.isVirtualAccount === 0 &&
      this.selectedBankAccount?.verifiedBy === 88 &&
      this.selectedBankAccount?.verified === 0
    ) {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      this.alertService
        .failedAlert({
          content:
            'Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const confirmationDialog = this.dialog.open(
              VirtualAccountConfirmationModalComponent,
              {
                maxWidth: '1200px',
                width: '100%',
                disableClose: true,
                data: { bankAccountIds: [this.selectedBankAccount?.id] }
              }
            );
            confirmationDialog.afterClosed().subscribe((result) => {
              if (result && result.success) {
                this.shouldReloadBankAccounts.set(true);
                this.paymentsService.isPaymentProcessingSubject.next(true);
                this.processMailCheck(_edit, AlertContent, id);
              }
            });
          }
        });
    } else {
      this.processMailCheck(_edit, AlertContent, id);
    }
  }

  /**
   * @description Performs the mailing of a check.
   * @param  _edit - Indicates if the payment is being edited.
   * @param  AlertContent - The content of the alert message.
   * @param  id - The ID of the check.
   */
  processMailCheck(_edit: boolean, AlertContent: string, id: string) {
    if (this.paymentForm.controls.bankAc.value?.isItZil) {
      this.zilBankCheck('mailed');
      this.success.emit({
        title: 'Your Payment is Saved',
        content:
          'Your payment has been saved. Please check the status in your records.'
      });
      return;
    }
    this.shippingType();
    this.getMailPaperType();

    const ids: { ids: string[] } = { ids: [] };
    ids.ids.push(id);

    this.subscriptions.push(
      this.checkService
        .getChequeDetails(ids)
        .pipe(
          catchError((error) => {
            if (error.error?.errorCode === 1) {
              this.alertService.warningAlert({ content: error.error.errorMsg });
            }
            if (error.error?.errorCode === 123) {
              this.ApprovalCheck(error, 'mailed');
            }
            if (error.error?.errorCode === 2) {
              this.checkdata.errorMsg = error.error?.errorMsg;
              const checkNo = String(
                this.paymentForm.getRawValue().checkNumber
              );

              const verifyDialog = this.dialog.open(
                VerifySignatureModalComponent,
                {
                  maxWidth: '440px',
                  width: '100%',
                  minHeight: '200px',
                  disableClose: true,
                  data: {
                    ids,
                    data: this.checkdata,
                    bankAccountId:
                      checkNo === this.checkdata.errorMsg
                        ? this.paymentForm.getRawValue().bankAc?.id
                        : undefined,
                    isDisableNavigation: true
                  }
                }
              );
              verifyDialog.afterClosed().subscribe(() => {
                this.paymentsService.isPaymentProcessingSubject.next(false);
              });
            }

            if (this.errorCode === 106) {
              const warningAlert = this.alertService.warningAlert({
                content: error.error?.errorMsg,
                doneMsg: 'Verify',
                isCancel: true
              });
              warningAlert.afterClosed().subscribe((response) => {
                if (response) {
                  this.router.navigate([
                    '/manage/user-profile/verify-email-phone'
                  ]);
                }
              });
            }
            this.paymentsService.isPaymentProcessingSubject.next(false);
            if (
              error?.error.permissionRequired !== 'check-mail' &&
              ![1, 2, 123].includes(error.error?.errorCode) &&
              this.errorCode !== 106
            ) {
              this.alertService.warningAlert({
                content: error?.error.errorMsg
              });
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<IChequedata>;
          if (response.success) {
            this.checkdata.chequedata = response.data;
            this.chequeAmount = response.data.datas[0].cheque_amount;
            if (this.checkdata.chequedata) {
              this.shippingCalculation();
            } else {
              this.success.emit({
                title: 'Your Payment is Saved',
                content:
                  'Your payment has been saved. Please check the status in your records.'
              });
            }
          }
        })
    );
  }

  onEmailCheck(edit: boolean, AlertContent: string, checkId: string) {
    if (this.selectedBankAccount?.isVirtualAccount) {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${this.selectedBankAccount?.accountNumber}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(
            VirtualAccountConfirmationModalComponent,
            {
              maxWidth: '1200px',
              width: '100%',
              disableClose: true,
              data: { bankAccountIds: [this.selectedBankAccount?.id] }
            }
          );

          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true);
              this.paymentsService.isPaymentProcessingSubject.next(true);
              this.processEmailCheck(edit, AlertContent, checkId);
            }
          });
        }
      });
    } else if (
      this.selectedBankAccount?.isVirtualAccount === 0 &&
      this.selectedBankAccount?.verifiedBy === 88 &&
      this.selectedBankAccount?.verified === 0
    ) {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      this.alertService
        .failedAlert({
          content:
            'Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const confirmationDialog = this.dialog.open(
              VirtualAccountConfirmationModalComponent,
              {
                maxWidth: '1200px',
                width: '100%',
                disableClose: true,
                data: { bankAccountIds: [this.selectedBankAccount?.id] }
              }
            );
            confirmationDialog.afterClosed().subscribe((result) => {
              if (result && result.success) {
                this.shouldReloadBankAccounts.set(true);
                this.paymentsService.isPaymentProcessingSubject.next(true);
                this.processEmailCheck(edit, AlertContent, checkId);
              }
            });
          }
        });
    } else {
      this.processEmailCheck(edit, AlertContent, checkId);
    }
  }
  /**
   * @description Performs the E-mailing of a check.
   * @param  edit - Indicates if the payment is being edited.
   * @param  AlertContent - The content of the alert message.
   * @param  checkId - The ID of the check.
   */
  processEmailCheck(edit: boolean, AlertContent: string, checkId: string) {
    if (
      this.headerData.isSubscribed === 0 &&
      this.headerData.trialPeriodEndsInDays === 0
    ) {
      this.dialog.open(SubscriptionWarningModalComponent, {
        maxWidth: '370px',
        minWidth: '370px',
        width: '95%',
        disableClose: true,
        data: {
          content:
            'Your trial period has expired. Please update your subscription to continue.'
        },
        panelClass: 'ocw_alert_wrapper'
      });
      return;
    }
    if (this.paymentForm.controls.bankAc.value?.isItZil) {
      this.zilBankCheck('emailed');
      this.success.emit({
        title: 'Your Payment is Saved',
        content:
          'Your payment has been saved. Please check the status in your records.'
      });
      return;
    }

    const selectedCheckId: { action: string }[] = [];
    selectedCheckId.push({ action: checkId });
    const dialogRef = this.dialog.open(CheckEmailModalComponent, {
      maxWidth: '93%',
      width: '1200px',
      disableClose: true,
      data: {
        data: selectedCheckId,
        hideSuccessAlert: true,
        needRecurring: this.paymentForm.controls.needRecurring.value || false
      }
    });

    dialogRef.afterClosed().subscribe((get) => {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      if (!get) {
        this.success.emit({
          title: 'Your Payment is Saved',
          content:
            'Your payment has been saved. Please check the status in your records.'
        });
      } else if (get.errorCode === 123) {
        this.ApprovalCheck(get, 'E-mailed');
        this.success.emit({
          title: 'Your Payment is Saved',
          content:
            'Your payment has been saved. Please check the status in your records.'
        });
      } else {
        this.success.emit(true);
      }
    });
  }

  openDirectDepositModal(
    _edit: boolean,
    AlertContent: string,
    checkId: string
  ) {
    const modal = this.dialog.open(DirectDepositComponent, {
      width: '75%',
      data: [
        {
          action: checkId,
          openRecurringModal: this.paymentForm.controls.needRecurring.value
        }
      ],
      disableClose: true
    });

    modal.afterClosed().subscribe((res) => {
      this.paymentsService.isPaymentProcessingSubject.next(false);
      if (res.success) {
        this.success.emit(true);
        return;
      }

      if (!res.addInfoClicked) {
        this.success.emit({
          title: 'Your Payment is Saved',
          content:
            'Your payment has been saved. Please check the status in your records.'
        });
      }
    });
  }

  zilBankCheck(type: string) {
    this.openWarningAlert(
      `This check cannot be ${type}.Currently, the Zil account is only set up for ACH/Direct Deposit.`
    );
  }

  /**
   * @description Displays a warning alert when a check cannot be approved for a specific action.
   * @param  error - The error object containing information about the error.
   * @param  type - The type of action that is being restricted.
   */
  ApprovalCheck(error: HttpErrorResponse, type: string) {
    if (type === 'E-mailed') {
      const data = this.openWarningAlert(
        `This check cannot be ${type}.Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
      );
      data.afterClosed().subscribe((response) => {
        if (response) {
          this.success.emit({
            title: 'Your Payment is Saved',
            content:
              'Your payment has been saved. Please check the status in your records.'
          });
          this.paymentsService.isPaymentProcessingSubject.next(false);
        }
      });
    } else {
      this.openWarningAlert(
        `This check cannot be ${type}.Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
      );
      this.success.emit({
        title: 'Your Payment is Saved',
        content:
          'Your payment has been saved. Please check the status in your records.'
      });
      this.paymentsService.isPaymentProcessingSubject.next(false);
    }
  }

  openConfirmAlert(content: string, title?: string) {
    const data: IConfirmAlert = {
      title: title || 'Confirm',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * @description Checks if push back and QuickBooks Online (QBO) integration are enabled, and if QBD push back integration is enabled.
   * This function makes two API calls simultaneously: one for QBO and one for QBD.
   */
  isPushBackEnable() {
    // Execute both API calls simultaneously and wait for all to settle
    Promise.allSettled([
      firstValueFrom(this.checkService.isPushBackEnable()),
      firstValueFrom(this.checkService.isQBDPushBackEnable()),
      firstValueFrom(this.checkService.isNetSuitePushBackEnable()),
      firstValueFrom(this.integrationService.getDetails('freshbooks'))
    ]).then((results) => {
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const res = result.value;
          if (index === 0) {
            // Process the response for QBO
            const qboResponse = res.data as IQBOPushBackEnable;
            if (qboResponse.showWarning) {
              this.isShowWarningForQBO = true;
            }
            if (
              qboResponse.isPushBackEnabled &&
              qboResponse.isQucikBookConnected
            ) {
              this.exportConfig.isQBOPushBack = true;
            }
            this.exportConfig.isQBOPushBackPermitted =
              res.data.isPushBackEnabledInSua === 1;
          } else if (index === 1) {
            // Process the response for QBD
            const qbdResponse = res.data as IpushBackEnableBody;
            this.exportConfig.isQBDPushBackPermitted =
              qbdResponse.isPushBackEnabledInSua === 1;
            if (
              qbdResponse.isPushBackEnabled &&
              qbdResponse.isQucikBookDesktopConnected
            ) {
              this.exportConfig.isQBDPushBack = true;
            }
          } else if (index === 2) {
            // Process the response for NetSuite
            const netsuiteResponse = res.data as INetSuitePushBack;
            this.exportConfig.isNetSuitePushBackPermitted =
              netsuiteResponse.isPushBackEnabledInSua;
            if (
              netsuiteResponse.isPushBackEnabled &&
              netsuiteResponse.isNetsuiteConnected
            ) {
              this.exportConfig.isNetsuitePushBack = true;
            }
          } else if (index === 3) {
            // Process the response for Freshbooks
            const freshbooksResponse = res.data as IConnectedThirdPartyData;
            this.exportConfig.isFreshBooksPushBackPermitted = freshbooksResponse.module.freshbooksPushBackEnable === 0;
            if(freshbooksResponse.module.freshbooksExport === 1 && freshbooksResponse.connected === 1 && freshbooksResponse.module.freshbooksPushBackEnable === 1){
              this.exportConfig.isFreshBooksPushBack = true;
            }
            
          }
        } else if (index === 0) {
          this.exportConfig.isQBOPushBack = false;
          this.exportConfig.isQBOPushBackPermitted = false;
        } else if (index === 1) {
          this.exportConfig.isQBDPushBack = false;
          this.exportConfig.isQBDPushBackPermitted = false;
        } else if (index === 2) {
          this.exportConfig.isNetsuitePushBack = false;
          this.exportConfig.isNetSuitePushBackPermitted = false;
        } else if (index === 3) {
          this.exportConfig.isFreshBooksPushBack = false;
          this.exportConfig.isFreshBooksPushBackPermitted = false;
        }
      });

      this.exportOptions.emit(this.exportConfig);
    });
  }

  /**
   * @description Loads the check serial number for the specified bank and updates the check number field in the payment form.
   * @param bankId -The ID of the bank.
   */
  loadCheckSerialNo(bankId: string): void {
    if (!bankId || bankId === '') {
      return;
    }

    if (
      this.paymentConfig.mode === 'EDIT' &&
      this.paymentConfig.paymentDetails?.sourceId === bankId
    ) {
      if (this.paymentConfig.checkDetails?.serialNumber) {
        const checkNumber = Number(
          this.paymentConfig.checkDetails?.serialNumber
        );
        this.paymentForm.controls.checkNumber.setValue(checkNumber);
      }
      return;
    }
    // if(this.isClonedCheck && this.isLegalEnabled){
    //   const checkNumber = this.querySelector('#check_number');
    //   checkNumber.classList.add('disable_field');
    //   return;
    // }

    this.subscriptions.push(
      this.bankService
        .getCheckSerialNo(bankId)
        .subscribe((res: { success: boolean; data: ICheckSerialNo[] }) => {
          if (res.success === true) {
            const checkSerialNo: ICheckSerialNo = res.data[0];
            this.paymentForm.controls.checkNumber.setValue(
              checkSerialNo.serialNo
            );
          }
        })
    );
  }

  openWarningAlert(content: string, doneMsg = 'OK') {
    return this.alertService.warningAlert({ content, doneMsg });
  }

  // Load Default Check Paper Type
  getCheckPaperType(): void {
    this.subscriptions.push(
      this.checkService.getCheckPaperType().subscribe((res) => {
        if (res?.success) {
          if (!res?.data?.paperType) {
            this.selectedCheckPaperType = '1';
          } else {
            this.selectedCheckPaperType = res?.data?.paperType;
          }
        }
      })
    );
  }

  getMailPaperType(): void {
    this.subscriptions.push(
      this.checkService.getpaperType().subscribe((res) => {
        this.checkdata.paper = res.data;
      })
    );
  }

  // For Check Mail
  shippingType(): void {
    this.subscriptions.push(
      this.checkService.getShippingType().subscribe((res) => {
        this.checkdata.shipping = res.data;
      })
    );
  }

  /**
   * @description Performs the shipping calculation for the current check.
   * Updates the shipping cost and total amount in the payment form.
   *
   */
  shippingCalculation(edit?: boolean) {
    if (!this.checkdata?.chequedata?.datas) {
      return;
    }
    const mailShippingCalculationsdata: IMailShippingCalculations = {
      mail_check_ids: [],
      all_check_ids: [],
      shipping_rate_warning: 0,
      sent_to_customer_address: 0,
      Single_mail_options: 3,
      individual_envelope: 0
    };
    for (let i = 0; i < this.checkdata.chequedata.datas.length; i += 1) {
      const ids2 = this.checkdata.chequedata.datas[i].enc_id;
      mailShippingCalculationsdata.mail_check_ids.push(
        this.checkdata.chequedata.datas[i].enc_id
      );
      const idlist: IMailShippingPayeeDetails = {
        mail_type: 1,
        check_paper: 7,
        informed_payee_sms: 0,
        informed_payee_email: 0,
        payee_phone: '',
        payee_email: '',
        file_hidden: []
      };
      if (edit) {
        mailShippingCalculationsdata.mail_check_ids.push(ids2);
      }
      idlist.payee_email = this.checkdata.chequedata.datas[i].payee_email;
      idlist.payee_phone = this.checkdata.chequedata.datas[i].payee_phone;
      mailShippingCalculationsdata[ids2] = idlist;
    }
    this.subscriptions.push(
      this.checkService
        .ShippingCostCalculationGroup(mailShippingCalculationsdata)
        .pipe(
          finalize(() => {
            this.paymentsService.isPaymentProcessingSubject.next(false);
          })
        )
        .subscribe((res: IApiRes<IShippingCostCalculation>) => {
          if (res.success) {
            this.openCheckMailModal(res.data, mailShippingCalculationsdata);
          } else {
            this.success.emit({
              title: 'Your Payment is Saved',
              content:
                'Your payment has been saved. Please check the status in your records.'
            });
          }
        })
    );
  }

  openCheckMailModal(
    shippingCostRes: IShippingCostCalculation,
    mailShippingCalculationsdata: IMailShippingCalculations
  ) {
    if (
      this.checkdata.chequedata &&
      shippingCostRes &&
      mailShippingCalculationsdata
    ) {
      this.dialog.open(CheckMailModalComponent, {
        maxWidth: '1200px',
        width: '100%',
        minHeight: '380px',
        disableClose: true,
        data: {
          data: this.checkdata,
          ShippingCost: shippingCostRes,
          caldata: mailShippingCalculationsdata,
          isDisableNavigation: true,
          openRecurringModal: this.paymentForm.controls.needRecurring.value
        }
      });
    }
  }

  handleCheckMailSuccess() {
    this.subscriptions.push(
      this.checkService.getCheckMailEvents().subscribe((res) => {
        if (res.isSuccess) {
          this.success.emit(true);
        } else {
          this.success.emit({
            title: 'Your Payment is Saved',
            content:
              'Your payment has been saved. Please check the status in your records.'
          });
        }
      })
    );
  }

  openAddComment() {

    let dialogRef;
    if(this.bills?.[0]){
      dialogRef = this.dialog.open(AddCommentsModalComponent, {
        maxWidth: '800px',
        width: '93%',
        disableClose: true,
        data: {
          id: this.bills?.[0],
          existingData: this.createdExistingComments,
          type: 'bills',
          enableDelete: true
        }
      });
    }else{
      dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
        maxWidth: '800px',
        width: '93%',
        disableClose: true,
        data: {
          id: this.paymentConfig?.checkDetails?.id ?? 0,
          existingData: this.createdExistingComments,
        }
      });
    }

    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.createdExistingComments = res.existingData;
        this.commentsCount = res.existingData.length;
      }
    });
  }

  openAddAttachment() {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        billId: this.bills?.[0],
        existingData: this.createdExistingAttachments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      this.createdExistingAttachments = res.existingData;
      this.attachmentCount = res.existingData.length;
    });
  }

  /**
   *@description Opens the Add Remitance dialog.
   * Allows the user to select remitance options, such as format and total amount.
   * Updates the payment form with the selected remitance details.
   *
   */
  openAddRemitance() {
    this.dialog
      .open(AddRemitanceV3Component, {
        width: '1100px',
        data: {
          remitance: this.remitances,
          remittanceType: this.remittanceType,
          paymentTotal: this.remitanceTotal,
          grandTotal: this.remittanceGrandTotal,
          format: this.newRemittanceFormat,
          insert: this.insertFromRemittance,
          amount: Number(this.paymentForm.controls.amount.value),
          type: this.isBillCheck ? 'bill' : 'check',
          hideSwitchFormat: this.isBillCheck,
          isPaymentEdit: this.paymentConfig.mode === 'EDIT'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.newRemittanceFormat = res.format;
          this.remitanceTotal = res.paymentTotal;
          this.remittanceGrandTotal = res.grandTotal;
          this.remitances = res.data;
          const formatedRemittances = this.paymentsService.checkRemittanceCount(
            res.data
          );
          this.hasRemitance = !!formatedRemittances.hasRemittance && res.insert;
          this.remittanceType = res.remittanceType;
          this.paymentForm.controls.remittance_type.setValue(res.format);
          this.insertFromRemittance = res.insert;
          if (res.insert === true) {
            this.paymentsService.getRemitanceValue(res, this.paymentForm);
          } else {
            this.insertFromRemittance = false;
          }
        } else {
          this.newRemittanceFormat = true;
          this.remitanceTotal = 0.0;
        }
      });
  }

  isRemittanceModified() {
    if (this.newRemittanceFormat === true) {
      return 1;
    }
    return 0;
  }

  addBankEvent(event: IBankDropdown) {
    this.paymentsService.checkBankCanACH(event);
    this.paymentForm.controls.bankAc.setValue(event);
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  /**
   * @description Unchecking all process without options from the form. since its causing a glitch when coming back to the page
   */
  unCheckAllProcessWithout() {
    this.paymentForm.controls.noAmount.setValue(false);
    this.paymentForm.controls.noPayee.setValue(false);
    this.paymentForm.controls.noDate.setValue(false);
    this.paymentForm.controls.noSign.setValue(false);
  }

  /**
   * @description Used to detect the mat menu is closed and change arrow mark position in the case of send button and Print button.
   * @param {string} type - Indicate Button type
   */
  onMatMenuClosed(type: string) {
    if (type === 'send') {
      this.isShowSendDropDown = false;
    } else {
      this.isShowPrintDropDown = false;
    }
  }

  /**
   * @description show/hide the custom fields
   * @param toogle - [boolean]
   * @returns void
   */
  toggleCustomFields(toggle: boolean) {
    this.IsCustom = toggle;
  }

  /**
   * @description Load the custom elements
   * @returns void
   */
  loadCustomElements() {
    this.subscriptions.push(
      this.checkDesignService.getCustomElements().subscribe((res) => {
        this.custom_elements = res.data.custom_elements;
        if (this.custom_elements.length !== 0) {
          this.customFieldFlag = true;
        }
        this.customElementGroup = this.custom_elements.map((item) => ({
          [item.custom_element]: ''
        }));
      })
    );
  }

  /**
   * @description -Method to get custom field values
   */
  getCustomElementsValue() {
    const checkData = this.paymentConfig.checkDetails;
    if (checkData) {
      this.custom_elements = Object.keys(checkData.customElements).map(
        (key, index) => ({ id: index + 1, custom_element: key })
      );
      if (Object.keys(checkData.customElements).length !== 0) {
        this.customFieldFlag = true;
      }
      this.customElementGroup = Object.entries(checkData?.customElements).map(
        ([field, value]) => ({
          [field]: value ? String(value) : ''
        })
      );
    }
  }

  /**
   * @description Opens a warning alert message.
   * This warning message is displayed specifically for Bryan Cohen enterprise customers.
   * It triggers when the yearly transaction amount reaches $600 and either the payee's SSN/EIN or payee address is missing.
   * If a user attempts to create a check using such a payee, this warning message is shown.
   * @param {string} msg - The warning message to display.
   */
  openPayeeWarning(msg: string): void {
    const action = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Update',
      isCancel: true,
      cancelMsg: 'Not Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.payeeService.openPayeeEditModal.next(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.paymentsService.payeeDetails = undefined;
    this.paymentsService.isPaymentProcessingSubject.next(false);
    this.unCheckAllProcessWithout();
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.paymentsService.hasAmount.update(() => false);
    this.paymentsService.onClickSaveButton.set(false);
    this.paymentsService.onSaveQboDetails.set(undefined);
    this.paymentsService.onSaveNetSuiteDetails.set(undefined);
    this.paymentsService.autoSaveNetSuiteDetails.set(false);
    this.paymentsService.autoSaveFreshBooksDetails.set(false);
  }
}
