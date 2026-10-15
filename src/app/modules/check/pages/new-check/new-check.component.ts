import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  AfterViewChecked,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormArray
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';
import {
  ICheckPayee,
  ICreateNewCheck,
  IDesignData,
  IExpenseDetails,
  IExpenseDetails2,
  INewCheck,
  ISvbACHCompleteTransaction,
  ISvbCardCompleteTransaction,
  IUpdateCheck
} from 'src/app/modules/check/model/check';
import {
  DatePipe,
  NgIf,
  NgFor,
  NgStyle,
  NgClass,
  JsonPipe,
  SlicePipe,
  CurrencyPipe
} from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Utils } from 'src/app/data/utils';
import { IConfirmAlert, ISuccessAlert } from 'src/app/models/alert';
import {
  IPayeeBankDetails,
  IPayeeVendorcredit,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IBankDropdown,
  ICheckSerialNo,
  IRemittanceDetails
} from 'src/app/models/bank';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { BlankCheckModalComponent } from 'src/app/modules/check/components/create-blank-check-modal/blank-check-modal.component';
import { AddEmailPayeeModalComponent } from 'src/app/shared/modal/process-modal/add-email-payee-modal/add-email-payee-modal.component';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { AddPayeeBankModalComponent } from 'src/app/shared/modal/payee-bank-modal/add-payee-bank-modal/add-payee-bank-modal.component';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { ILocation, IQboDetails } from 'src/app/modules/integration/model/integration';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ICardPaymentReqDocRes } from 'src/app/modules/payments/model/payments';
// import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { NgxMaskDirective } from 'ngx-mask';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { INetSuiteClass } from 'src/app/modules/integration/netsuite/model/netsuite';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import {
  faCheck,
  faCircleQuestion,
  faFloppyDisk,
  faMinus,
  faPlus,
  faQuestionCircle,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { IEmailPhoneVerificationState } from 'src/app/shared/service/auth/verification-message.service';
import { IApiRes } from 'src/app/models/api';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { PayByCcToastComponent } from 'src/app/modules/payments/shared/components/pay-by-cc-toast/pay-by-cc-toast.component';
import { DropDownPayeeBankComponent } from '../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { DropDownCategoryComponent } from '../../../../shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { DropDownPayeeComponent as DropDownPayeeComponent_1 } from '../../../../shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownWalletComponent as DropDownWalletComponent_1 } from '../../../../shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DemoVideoComponent } from '../../../../shared/components/demo-video/demo-video.component';
import { WalletAchModalComponent } from '../../modal/wallet-ach-modal/wallet-ach-modal.component';
import { CheckEmailModalComponent } from '../../modal/check-email-modal/check-email-modal.component';
import { VerifySignatureModalComponent } from '../../modal/mail-modals/verify-signature-modal/verify-signature-modal.component';
import { DirectDepositComponent } from '../../modal/direct-deposit/direct-deposit.component';
import { CheckAddAttachmentCommonModalComponent } from '../../modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckAddCommentModalComponent } from '../../modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { CheckMailModalComponent } from '../../modal/mail-modals/check-mail-modal/check-mail-modal.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';

type ProcessType = 'card' | 'wallet' | 'bank';

enum thirdpartyProviderCode {
  'xero' = 2,
  'zoho_books' = 3,
  'sage_business' = 5
}

interface ICardCompleteTransaction extends ISvbCardCompleteTransaction {
  documents?: ICardPaymentReqDocRes;
}

@Component({
  selector: 'app-new-check',
  templateUrl: './new-check.component.html',
  styleUrls: ['./new-check.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    DemoVideoComponent,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    DropDownWalletComponent_1,
    DropDownBankComponent,
    MatTooltip,
    DropDownPayeeComponent_1,
    AmountInputComponent,
    NgStyle,
    FaIconComponent,
    DropDownCategoryComponent,
    NgClass,
    NgxMaskDirective,
    RouterLink,
    DropDownPayeeBankComponent,
    JsonPipe,
    SlicePipe,
    CurrencyPipe,
    DatePipe,
    FontAwesomeModule,
    WhiteLabelPipe,
    PayByCcToastComponent,
    WhiteLabelDirective
  ]
})
export class NewCheckComponent
  implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy
{
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  private fb = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private validationService = inject(ValidationService);
  private payeeService = inject(PayeeService);
  private checkService = inject(CheckService);
  private billService = inject(BillService);
  private bankService = inject(BankService);
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private activatedRoute = inject(ActivatedRoute);
  private dtCacheService = inject(DataTableCacheService);
  private userService = inject(UserProfileService);
  private invoiceService = inject(InvoiceService);
  private gettingStartedService = inject(GettingStartedService);
  private scriptService = inject(ScriptService);
  private cyberSourceService = inject(CybersourceService);
  public checkDesignService = inject(CheckDesignService);
  private headerService = inject(HeaderService);
  private v3PaymentsService = inject(PaymentsService);
  // private localStorageService = inject(LocalStorageService);
  public bankAccountsService = inject(BankAccountsService);
  private commonService = inject(CommonOnInitService);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private authDataService = inject(AuthDataService);
  private openAddCardService = inject(OpenAddCardService);
  private userProfileService = inject(UserProfileService);
  private clickTrackingService = inject(ClickTrackingService);
  private payeeModalService = inject(PayeeModalService);
  private bankModalService = inject(BankModalService);

  cardNgSelect: NgSelectComponent;
  isLegalEnabled: boolean;
  payeePhone: string;
  @ViewChild('cardNgSelect', { static: false }) set content(
    content: NgSelectComponent
  ) {
    if (content) {
      this.cardNgSelect = content;
    }
  }

  @ViewChild('payeeDropDown') payeeDropDown: DropDownPayeeComponent;
  @ViewChild('walletDropDown') walletDropDown: DropDownWalletComponent;

  checkForm!: UntypedFormGroup;
  subscriptions: Subscription[] = [];

  creditCardList: IExistingCreditCards[] = [];
  selectedCreditCard: IExistingCreditCards;
  paymentProcessType: ProcessType = 'bank';
  paymentProcessLabels = [
    // { value: 'card', name: 'Credit Card' },
    // { value: 'wallet', name: 'Wallet' },
    { value: 'bank', name: 'Bank Account' }
  ] as const;

  payeeBankControl = new UntypedFormControl(null);
  controlErrors: { required: { [key: string]: boolean } } = { required: {} };

  payeeBankDetails: IPayeeBankDetails[] = [];
  selectedPayeeBank: any = {};
  defaultCDPayeeBank: any;

  dateToday: any = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

  remittanceItem: string[] = [];
  payeeVendorCredit: IPayeeVendorcredit | null;
  getPayeeVendorCredit = 0;
  isVendorCreditApplied = 0; // edit

  isRemittanceSaved = false;
  isRemittence = false;
  disableRemitAddBtn = true;

  isNotVerified: boolean = false;
  editMode: boolean | string = false;

  isClonedCheck: string;
  thirdParty: string;
  isFromBill = false;
  dataFromBill: any;
  selectedBillIds: string[] = [];

  checkId: string;
  billId: string;
  checkData: any;

  utils = Utils;

  selectedCheckData: any;
  quickBookImportedData: any;
  grandTotal = 0;
  page = 1;
  categoryPage = 2;
  customerPage = 2;
  classPage = 2;
  companyPage = 1;
  bankPage = 1;

  loading = false;
  loadingOptional = false;
  buttonType: string;
  selectedCreditCardName: string | undefined;

  isAmountChecked = false;
  isPayeeChecked = false;
  isDateChecked = false;
  isSignChecked = false;

  selectedBank: IBankDropdown | null;
  selectedPayee: IViewPayee | undefined;
  selectedPayeeSummary: ICheckPayee | null;
  isItZilBank: number;

  payeeId: string | null;
  selectedPayeeIdOnEdit: string; // edit
  selectedCatagory: any;

  createdExistingComments: any[] = [];
  createdExistingAttachments: any[] = [];

  checkdata: any = {};
  checkDetails: any;
  ShippingCostRes: any;
  expandedWhiteCheckPapperBtn: boolean;
  selectedCheckPaperType = '1';
  chequeAmount: number;

  isSubmitWithAlreadyExistedcheckfields = 0;
  isSubmitWithAlreadyExistedcheckNo = 0;

  cloneCheckVal: any = '';
  isNotVerfied = false;
  userVerification: IEmailPhoneVerificationState | null = null;

  isPushBack = false;
  /**
   * @descriptionflag indicating whether imported location is enabled or not
   */
  isLocation = false;
  isPushBackExportBtn = false;
  isCategory = false;
  /**
   * @description currently selected location dropdown value
   */
  selectedLocationId: string;
  readonly paymentMode = '3';

  companies: IQboDetails;

  errorCode: any;
  err_msg: any;

  caldata: any = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 3
  };

  thirdpartyprovider: number;
  importedBillId: string;

  QBCategoryItem: any[] = [];
  QBClassItem: any[] = [];
  QBCustomerItem: any[] = [];
  QBBankAccounts: any[] = [];
  /**
   * @description array of imported locations from QuickBooks
   */
  QBLocation: ILocation[];

  QBCompanyName: string | null;
  QBBankAccountName: string | null;
  QBCategoryItemName: any = [];
  QBClassItemName: any = [];
  QBCustomerItemName: any = [];

  ShowWarningForCategory = false;

  isCategorySaved = false;
  disableCategoryAddBtn = true;
  categoryTotal: number;

  types = ['category-items', 'customers', 'classes'];
  realmid: any;
  LocationId: string | undefined;

  isExpense = false;
  isQBDPushback = false;
  isPushBackQBDExportBtn = false;
  QBDCompanyName: string | null;
  QBDBankAccountName: string | null;
  QBDExpenseItem: { name: string; id: string }[] = [];
  QBDClassItem: { name: string; id: string }[] = [];
  QBDcustomersItem: { name: string; id: string }[] = [];
  QBDExpenseItemName: (string | null)[] = [];
  QBDClassItemName: (string | null)[] = [];
  QBDCustomerItemName: (string | null)[] = [];
  qbdexpensePage = 2;
  qbdcustomerPage = 2;
  qbdclassPage = 2;
  isExpenseSaved = false;
  disableExpenseAddBtn = true;
  expenseTotal: number;
  bankAccountId: string;
  custom_elements: { id: number; custom_element: string }[] = [];
  customFieldFlag = false;
  customElementGroup: { [key: string]: string }[] = [];
  designData: IDesignData;
  designElements: string[] = [];
  buttonClicked = 0;

  discountTotal = 0;
  netTotal = 0;
  paymentTotal = 0;
  grossTotal = 0;
  newTableFormatEnabled = 'true';

  isNetSuitePushBackEnable = false;
  isEnableNetSuiteExport = true;
  netSuiteBankName: string | undefined;
  netSuiteBankId: string | undefined;
  netSuiteClass: INetSuiteClass[];
  netSuitePayee: INetSuiteClass[];
  netSuiteExpense: INetSuiteClass[];
  netSuiteLocations: INetSuiteClass[] = [];
  netSuiteTotal: number;
  isNetSuiteSaved: boolean;
  netSuiteClassPage = 2;
  netSuitePayeePage = 2;
  netSuiteExpensePage = 2;
  isShowNetSuite = false;
  isNetSuiteConnected = false;
  whiteLabelPayeeName = environment.env_id === 'compass' ? 'vendor' : 'payee';
  netSuiteExpenseLoading = signal(false);

  creditCardToastShown = true;
  isWiygulEnterPrise = false;

  faTrash = faTrash;
  faCircle = faQuestionCircle;
  faPlus = faPlus;
  faMinus = faMinus;
  faSave = faFloppyDisk;
  faTick = faCheck;
  faCircleQuestion=faCircleQuestion;
  selectedPayeeCategory: { id: string; name: string; type: number } | undefined;

  shouldReloadBankAccounts = signal(false);

  ngOnInit(): void {
    this.isUserVerified();
    this.loadCustomElements();
    this.initCheckForm();
    this.loadControlErrors();
    this.setCheckDate();
    this.loadedHeaderDataAndProcess();
    this.customFieldFlag = false;

    this.newTableFormatEnabled = 'true';
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.changePaymentTypeSelected(2);
    if (!this.editMode) {
      this.removeLoadedSkelton();
    }
  }

  loadedHeaderDataAndProcess() {
    this.subscriptions.push(
      this.headerService._headerData.subscribe((headerData) => {
        if (headerData) {
          this.isPushBackEnable();
          this.isQBDPushBackEnable();
          this.isNetSuiteEnable();
          this.GetDataFromParams();
          this.loadRemittanceRow();
          this.getRemittanceGrandTotal();
          this.loadRemittanceItems();
          this.getCheckPaperType();
          this.checkUserVerification();
          this.getExistingCreditCards();
          if (
            headerData.personalInfo?.isLegalEnabled === '1' ||
            headerData.personalInfo?.isLegalEnabled === 1
          ) {
            this.isLegalEnabled = true;
          }
          if (headerData.enabledPlugins.includes('enterprise-wiygul')) {
            this.isWiygulEnterPrise = true;
          }
        }
      })
    );
  }

  initCheckForm(): void {
    this.checkForm = this.fb.group({
      bankAccount: ['', [Validators.required]],
      payee: ['', [Validators.required]],
      checkAmount: [null, [Validators.required]],
      checkDate: ['', [Validators.required]],
      category: [''],
      check_no: ['', [Validators.required]],
      acc_no: ['', [Validators.maxLength(30)]],
      inv_no: [''],
      comment: [''],
      memo: [''],
      no_amount: ['0'],
      no_sign: ['0'],
      no_date: ['0'],
      no_payee: ['0'],
      wallet: [null],
      attachRemittanceToCheck: ['0'],
      attachCategoryToCheck: ['0'],
      attachExpenseToCheck: ['0'],
      attachNetsuiteExpenseToCheck: ['0'],
      realmId: [''],
      mappingId: [''],
      companyId: [''],
      qbBankId: [''],
      netsuiteBankId: [''],
      locationId: [null],
      remittance: this.fb.array([this.remittanceFormBody()]),
      categoryDetails: this.fb.array([this.categoryFormBody()]),
      expenseDetails: this.fb.array([this.ExpenseFormBody()]),
      netsuiteExpenseDetails: this.fb.array([this.netSuiteFormBody()]),
      customElements: [this.customElementGroup]
    });
  }

  // LOAD REMITTANCE TABLE ROW
  loadRemittanceRow() {
    const addRow = this.getRemittanceFormControl();
    for (let i = 1; i <= 5; i++) {
      addRow.push(this.remittanceFormBody());
    }

    if (!this.checkId) {
      const CategoryRows = this.getCategoryFormControl();
      for (let i = 1; i <= 4; i++) {
        CategoryRows.push(this.categoryFormBody());
      }

      const ExpenseRows = this.getExpenseFormControl();
      for (let i = 1; i <= 4; i++) {
        ExpenseRows.push(this.ExpenseFormBody());
      }

      if (!this.editMode) {
        const netSuiteRow = this.getNetSuiteFormControl();
        for (let i = 1; i <= 4; i += 1) {
          netSuiteRow.push(this.netSuiteFormBody());
        }
      }
    }
  }

  //= ====GET REMITTANCE GRAND TOTAL
  getRemittanceGrandTotal() {
    this.subscriptions.push(
      this.getGrandTotal.valueChanges.subscribe((data) => {
        const total = data.reduce(
          (a: number, b: { totalSingleRow: string | number }) =>
            a + +b.totalSingleRow,
          0
        );
        this.grandTotal = total;
        this.grossTotal = data.reduce(
          (a: number, b: { grossAmount: string | number }) =>
            a + +b.grossAmount,
          0
        );
        this.discountTotal = data.reduce(
          (a: number, b: { discountAmount: string | number }) =>
            a + +b.discountAmount,
          0
        );
        this.netTotal = data.reduce(
          (a: number, b: { netAmount: string | number }) => a + +b.netAmount,
          0
        );
        this.paymentTotal = data.reduce(
          (a: number, b: { thisPayment: string | number }) =>
            a + +b.thisPayment,
          0
        );
      })
    );
  }

  //= ====GET SELECTED CHECK ID
  GetDataFromParams() {
    let bankAccountIdFromParams: string;
    let getIdsFromBill: string;

    this.activatedRoute.queryParams.subscribe((data) => {
      bankAccountIdFromParams = data?.bankAccount;
      this.checkId = data?.id;
      this.isClonedCheck = data?.clone;
      this.cloneCheckVal = this.isClonedCheck;
      this.importedBillId = data?.bills || data?.billid;

      getIdsFromBill = data?.bills || data?.billid;
      if (data?.billid) {
        this.billId = data.billid;
      }
    });

    this.activatedRoute.fragment.subscribe((res) => {
      this.thirdParty = res!;
    }); // Redirect From Imported Quick book Data in Check List

    if (bankAccountIdFromParams!) {
      // Redirect from Wallet
      this.loadCheckSerialNo(bankAccountIdFromParams);
      this.sharedService.setNewBankCreatedData({
        bankAccountId: bankAccountIdFromParams
      });
      this.setCheckFormValue('bankAccount', bankAccountIdFromParams);
    }

    if (getIdsFromBill!) {
      // Redirect from Bills
      this.isFromBill = true;
      this.loadBillPayData(getIdsFromBill);
    }

    if (this.checkId || getIdsFromBill! || this.thirdParty) {
      this.loadSelectedCheckData(this.checkId);
      this.isClonedCheck! || this.isFromBill
        ? (this.editMode = false)
        : (this.editMode = true);
    } else this.removeLoadedSkelton();
  }

  // Load Check Data
  loadSelectedCheckData(selectedId: string) {
    if (!selectedId) {
      return;
    }

    this.subscriptions.push(
      this.checkService
        .getChecksById(selectedId)
        .pipe(
          finalize(() => {
            this.removeLoadedSkelton();
          })
        )
        .subscribe((res: any) => {
          if (res.success) {
            this.selectedCheckData = res.data;
            this.getCustomElementsValue();
            if (this.selectedCheckData.remittance_type === 0) {
              this.newTableFormatEnabled = 'false';
            }
            this.payeeId = this.selectedCheckData?.payee.payeeId;
            this.selectedPayeeIdOnEdit = this.selectedCheckData?.payee.payeeId;
            this.isVendorCreditApplied =
              this.selectedCheckData?.isVendorCreditApplied;
            this.quickBookImportedData = this.selectedCheckData?.thirdParty;
            this.thirdpartyprovider = res.data.providerType;

            if (this.isClonedCheck) {
              this.loadCheckSerialNo(
                this.selectedCheckData.bankAccount.bankAccountId
              );
            }

            this.loadPayeeDetails(this.selectedCheckData?.payee.payeeId);
            this.setCheckData();
          }
        })
    );
  }

  getPayeeBankAccounts(id: string) {
    if (!id) {
      this.payeeBankControl.patchValue(null);
      return;
    }
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(id).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
          this.defaultCDPayeeBank = res.data.filter(
            (e: any) => e.defaultCDAccount == 1
          )[0];
          if (this.defaultCDPayeeBank) {
            this.getPayeeSingleBankAccount(
              this.payeeId!,
              this.defaultCDPayeeBank.id
            );
          } else {
            this.payeeBankControl.patchValue(null);
          }
        }
      })
    );
  }

  getPayeeSingleBankAccount(id: string, bankId: string) {
    this.subscriptions.push(
      this.payeeService.getPayeeSingleBankData(id, bankId).subscribe((res) => {
        if (res.success) {
          this.selectedPayeeBank = res.data;
          this.payeeBankControl.patchValue(this.selectedPayeeBank.id);
        }
      })
    );
  }

  getExistingCreditCards() {
    this.subscriptions.push(
      this.cyberSourceService.getExistingCards().subscribe((res) => {
        if (res?.success) {
          this.creditCardList = res?.data;
        }
      })
    );
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

  // Load Check Serial Number
  loadCheckSerialNo(bankId: string): void {
    if (!bankId || bankId == '') {
      return;
    }
    if (this.isClonedCheck && this.isLegalEnabled) {
      const checkNumber = this.querySelector('#check_number');
      checkNumber.classList.add('disable_field');
      return;
    }

    this.subscriptions.push(
      this.bankService.getCheckSerialNo(bankId).subscribe((res: any) => {
        if (res.success == true) {
          const checkSerialNo: ICheckSerialNo = res.data[0];
          this.setCheckFormValue('check_no', checkSerialNo.serialNo);
        }
      })
    );
  }

  /**
   * @description Load payee details
   * @param payeeId
   *
   */
  loadPayeeDetails(payeeId: string) {
    if (!payeeId) {
      this.setCheckFormValue('acc_no', null);
      return;
    }
    /** getting payee details */
    this.subscriptions.push(
      this.payeeService.showPayee(payeeId).subscribe((res: any) => {
        if (res?.success) {
          this.selectedPayee = res.data;
          this.payeePhone =
            this.selectedPayee?.phone != null ? this.selectedPayee?.phone : '';
          /** setting the selected payee account number */
          if (res?.data?.payeeIdNumber) {
            this.setCheckFormValue('acc_no', res.data.payeeIdNumber);
          } else {
            this.setCheckFormValue('acc_no', null);
          }
          /** Setting the selected payee category */
          if (res?.data?.cheque_category && res?.data?.cheque_category_name) {
            this.setCheckFormValue('category', res.data.cheque_category);
            this.sharedService.setNewCategoryCreatedData({
              categoryName: res.data.cheque_category_name
            });
          } else if (payeeId) {
            /** Setting the payee default category, if it's not stored with the check */
            this.subscriptions.push(
              this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
                if(res.data?.id){
                  this.selectedPayeeCategory = res.data;
                  this.setCheckFormValue('category', res?.data?.id);
                  this.sharedService.setNewCategoryCreatedData({
                    categoryId: res?.data?.id
                  });
                }else{
                  this.selectedPayeeCategory = undefined;
                  this.setCheckFormValue('category', null);
                  this.sharedService.setNewCategoryCreatedData({
                    categoryId: ''
                  });
                }
              })
            );
          } else {
            this.setCheckFormValue('category', null);
            this.sharedService.setNewCategoryCreatedData({
              categoryName: null
            });
          }
        }
      })
    );
  }

  // Load Payee Vendor Credit
  loadPayeeVendorCredit(payeeId: string) {
    this.subscriptions.push(
      this.payeeService.getVendorCredit(payeeId).subscribe((res) => {
        if (res?.success) {
          this.payeeVendorCredit = res.data.total;
        }
      })
    );
  }

  // Redirecting From bill by clicking pay bill
  loadBillPayData(ids: string) {
    const billIds = ids.split(',');
    this.selectedBillIds = billIds;

    this.subscriptions.push(
      this.billService
        .getBillBulkPaymentData(billIds)
        .pipe(
          finalize(() => {
            this.removeLoadedSkelton();
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.dataFromBill = res.data;
            this.thirdpartyprovider = res.data.providerType;
            this.setCheckFormUsingBillData();
          }
        })
    );
  }

  // setCheckDataUsingBillData
  setCheckFormUsingBillData() {
    const memoTextInvNo = this.dataFromBill.invoiceNumbers.split(',');

    const element: NodeListOf<HTMLInputElement> = document.querySelectorAll(
      '#disable_amount,#disable_payee,#invoiceNo'
    )!;
    element.forEach((e) => {
      e.classList.add('disable_field');
    });
    this.addStyleCursorNoDrop('dropdown');

    const { bankAccountName } = this.dataFromBill.bankAccount;
    const { bankAccountNickName } = this.dataFromBill.bankAccount;
    const { payeeName } = this.dataFromBill.payee;

    this.sharedService.setNewBankCreatedData(
      this.dataFromBill
        ? bankAccountNickName
          ? { bankAccountNickName }
          : bankAccountName
            ? { bankAccountNickName: bankAccountName }
            : null
        : null
    );
    this.sharedService.setNewPayeeCreatedData(payeeName ? { payeeName } : '');
    this.payeeDropDownChange({ id: this.dataFromBill.payee.payeeId });
    this.loadCheckSerialNo(this.dataFromBill.bankAccount.bankAccountId); // get check serial number based on bank account

    this.checkForm.patchValue({
      bankAccount: this.dataFromBill.bankAccount.bankAccountId,
      payee: this.dataFromBill.payee.payeeId,
      checkAmount: this.dataFromBill.totalAmount,
      inv_no: this.dataFromBill.invoiceNumbers,
      memo: this.dataFromBill?.memo
        ? this.dataFromBill?.memo
        : `Payment for ${memoTextInvNo.length == 1 ? 'Bill' : 'Bills'} ${
            this.dataFromBill.invoiceNumbers
          }`
    });
  }

  // Add Vendor Credit
  onAddVendorCredit() {
    const data = this.checkForm.value;

    const vendorCreditValue = Number(
      this.querySelector('#vendorCreditInput').value?.replace(/,/g, '')
    );
    const vendorCreditErr = this.querySelector('#vendorCredit_err');

    if (data.checkAmount == 0) {
      this.openWarningAlert('Enter check amount before apply vendor credit.');
      return;
    }

    if (vendorCreditValue == 0) {
      this.openWarningAlert('Enter credit amount before apply vendor credit.');
      return;
    }

    if (data.checkAmount <= vendorCreditValue && vendorCreditErr) {
      vendorCreditErr.innerText = 'Amount cannot exceed the check amount.';
      vendorCreditErr.style.color = 'var(--text_danger_lite)';
      return;
    }

    if (Number(this.payeeVendorCredit && vendorCreditErr) < vendorCreditValue) {
      vendorCreditErr.innerText = 'Amount cannot exceed the credit amount.';
      vendorCreditErr.style.color = 'var(--text_danger_lite)';
      return;
    }

    if (Number(this.payeeVendorCredit) < vendorCreditValue) {
      vendorCreditErr.innerText = 'Amount cannot exceed the available credit.';
      vendorCreditErr.style.color = 'var(--text_danger_lite)';
      return;
    }

    this.setCheckFormValue('memo', `Credit $${vendorCreditValue} applied`);
    if (vendorCreditErr) {
      vendorCreditErr.innerText = `Credit $${vendorCreditValue} applied`;
      vendorCreditErr.style.color = 'var(--brand-color)';
    }

    this.setCheckFormValue(
      'checkAmount',
      Number(this.checkForm.value.checkAmount) - vendorCreditValue
    );

    this.getPayeeVendorCredit = vendorCreditValue;
  }

  onClearVendorCreditInput(type: string) {
    const vendorCreditValue = this.querySelector(
      '#vendorCreditInput'
    ) as HTMLInputElement;
    const vendorCreditErr = this.querySelector('#vendorCredit_err');

    if (vendorCreditValue?.value) {
      this.setCheckFormValue('memo', '');
    }

    this.getPayeeVendorCredit = 0;
    if (!vendorCreditErr) return;
    type !== 'vendorCredit' ? (vendorCreditValue.value = '') : '';
    vendorCreditErr.innerText = '';
  }

  // Load Payee Summary
  loadPayeeSummary(payeeId: string) {
    if (payeeId == '' || payeeId == undefined) {
      return;
    }
    this.subscriptions.push(
      this.checkService.getPayeeSummary(payeeId).subscribe((res) => {
        this.selectedPayeeSummary = res;
      })
    );
  }

  // Go to Payee Transaction History
  onShowAllPayee() {
    if (!this.payeeId) return;
    const type = 1;
    this.router.navigate([
      `manage/payee/transaction-history/${this.payeeId}/${type}`
    ]);
  }

  // Go to Check View Page
  onCheckView(id: string) {
    this.router.navigate(['/manage/cheque/view/', id]);
  }

  changePaymentTypeSelected(position: number): void {
    const ids = '#singleTab_card,#singleTab_wallet,#singleTab_bank';
    const singleTab: NodeListOf<HTMLDivElement> =
      document.querySelectorAll(ids);
    singleTab[position]?.classList.add('active');
  }

  changePaymentType(
    singletabRef: HTMLDivElement,
    item: { value: ProcessType; name: string }
  ): void {
    this.clearProcessWithoutDetails();
    this.isCategory = false;
    this.isRemittence = false;
    this.setCheckFormValue('bankAccount', null);
    this.setCheckFormValue('wallet', null);
    this.paymentProcessType = item.value;
    this.addFormValidators();
    this.payeeDropDownChange({ ...this.selectedPayee });
    this.clear('ocwBank');

    this.creditCardToastShown = true;

    const ids = '#singleTab_card,#singleTab_wallet,#singleTab_bank';
    const singleTab: NodeListOf<HTMLDivElement> =
      document.querySelectorAll(ids);
    singleTab?.forEach((s) => {
      if (s.classList.contains('active')) s.classList.remove('active');
    });
    singletabRef?.classList.toggle('active');

    setTimeout(() => {
      this.removeLoadedSkelton();
    }, 2);

    this.loadControlErrors();

    /** To open the credit card ng select drop down automatically */
    setTimeout(() => {
      this.cardNgSelect?.open();
      this.loadRequiredLabel(true);
    }, 100);
  }

  onSelectCreditCard(id: string): void {
    this.selectedCreditCard = this.creditCardList?.find(
      (e: IExistingCreditCards) => e.cardId === id
    ) as IExistingCreditCards;
    this.selectedCreditCardName = this.selectedCreditCard.nickName;
    if (this.selectedCreditCard) {
      this.loadRequiredLabel(false);
    } else {
      this.loadRequiredLabel(true);
    }
  }

  // Load Remittance Items
  loadRemittanceItems() {
    this.subscriptions.push(
      this.checkService
        .getCheckRemiitanceItems(this.page, '')
        .subscribe((res) => {
          if (res.success) this.remittanceItem = res.data.items;
        })
    );
  }

  // set check Data
  setCheckData() {
    if (!this.selectedCheckData) {
      return;
    }

    this.getCompany(this.selectedCheckData?.bankAccount?.bankAccountId);

    const bankAccountName =
      this.selectedCheckData?.bankAccount?.bankAccountName;
    const bankAccountNickName =
      this.selectedCheckData?.bankAccount.bankAccountNickName;
    const payeeName = this.selectedCheckData?.payee?.payeeName;
    const categoryName = this.selectedCheckData?.category?.categoryName;

    // set value to common Drop Down
    this.sharedService.setNewBankCreatedData(
      this.selectedCheckData.bankAccount
        ? bankAccountNickName
          ? { bankAccountNickName }
          : { bankAccountNickName: bankAccountName }
        : ''
    );
    this.sharedService.setNewPayeeCreatedData(payeeName ? { payeeName } : '');
    this.sharedService.setNewCategoryCreatedData(
      categoryName ? { categoryName } : ''
    );

    const boxAmount = this.querySelector('#amount');
    const inputAmount = this.querySelector('#disable_amount');
    const boxSign = this.querySelector('#sign');
    const boxPayee = this.querySelector('#payee');
    const inputPayee = this.querySelector('#disable_payee');
    const boxDate = this.querySelector('#date');
    const inputDate = this.querySelector('#disable_date');

    if (this.selectedCheckData.isNoAmount == 1) {
      this.isAmountChecked = true;
      boxAmount.checked = true;
      inputAmount.classList.add('disable_field');
      this.addStyleCursorNoDrop('dropdown');
    }

    if (this.selectedCheckData.isNoSign == 1) {
      this.isSignChecked = true;
      boxSign.checked = true;
    }

    if (this.selectedCheckData.isNoPayee == 1) {
      this.isPayeeChecked = true;
      boxPayee.checked = true;
      inputPayee.classList.add('disable_field');
      this.addStyleCursorNoDrop('dropdown');
    }

    if (this.isVendorCreditApplied == 1) {
      inputPayee.classList.add('disable_field');
      this.addStyleCursorNoDrop('dropdown');
    }

    if (this.selectedCheckData.isNoDate == 1) {
      this.isDateChecked = true;
      boxDate.checked = true;
      inputDate.classList.add('disable_field');
      this.addStyleCursorNoDrop('dropdown');
    }

    this.loadPayeeSummary(this.selectedCheckData?.payee?.payeeId);

    this.selectedCheckData?.remittance?.forEach((e: any) => {
      e.itemUnitCost = e.itemUnitCost?.replace(/,/g, '');
    });

    this.checkForm.patchValue({
      bankAccount: this.selectedCheckData.bankAccount.bankAccountId
    });

    this.checkForm.patchValue({
      LocationId: this.selectedCheckData.locationId
    });
    this.selectedLocationId = this.selectedCheckData.locationId;

    const CategoryRows = this.getCategoryFormControl();
    for (let i = 0; i < this.selectedCheckData.categoryDetails.length; i++) {
      CategoryRows.push(this.categoryFormBody());
    }

    const ExpenseRows = this.getExpenseFormControl();
    for (let i = 0; i < this.selectedCheckData.expenseDetails.length; i++) {
      ExpenseRows.push(this.ExpenseFormBody());
    }

    if (this.isPushBack) {
      this.getCompany(this.selectedCheckData?.bankAccount?.bankAccountId);
    }

    if (this.isQBDPushback) {
      this.getQBDCompany(this.selectedCheckData?.bankAccount?.bankAccountId);
    }

    if (this.isNetSuitePushBackEnable) {
      this.getNetSuiteBank(this.selectedCheckData?.bankAccount?.bankAccountId);
    }

    this.OnItemChangeQB(this.selectedCheckData?.qboCompany?.realmId);

    this.QBCompanyName = this.selectedCheckData?.qboCompany?.companyName;
    this.QBBankAccountName = this.selectedCheckData?.qboBankAccount?.name;

    this.QBDCompanyName = this.selectedCheckData?.qbdCompany?.companyName;
    this.QBDBankAccountName = this.selectedCheckData?.qbdBankAccount?.name;

    this.selectedCheckData.categoryDetails.forEach((ele: any, i: number) => {
      if (ele) {
        this.isCategory = true;
      }

      this.QBCategoryItemName[i] = ele.categoryName;
      this.QBCustomerItemName[i] = ele.customerName;
      this.QBClassItemName[i] = ele.className;
    });

    this.selectedCheckData.expenseDetails.forEach(
      (ele: IExpenseDetails, i: number) => {
        if (ele) {
          this.isExpense = true;
        }

        this.QBDExpenseItemName[i] = ele.expenseName;
        this.QBDCustomerItemName[i] = ele.customerName;
        this.QBDClassItemName[i] = ele.className;
      }
    );

    if (this.selectedCheckData.netsuiteDetails?.length > 0) {
      this.initUpdateNetSuite();
      this.isNetSuiteSaved = true;
    }

    this.checkForm.patchValue({
      bankAccount: this.selectedCheckData.bankAccount.bankAccountId,
      payee: this.selectedCheckData?.payee?.payeeId,
      checkAmount: this.selectedCheckData.amount,
      checkDate: this.isClonedCheck
        ? this.dateToday
        : this.selectedCheckData.isNoDate == '0'
          ? this.selectedCheckData.date
          : '',
      category: this.selectedCheckData?.category?.categoryId,
      check_no:
        !this.isClonedCheck || (this.isClonedCheck && this.isLegalEnabled)
          ? this.selectedCheckData.serialNumber
          : null,
      acc_no: this.selectedCheckData.accountNumber,
      inv_no: this.selectedCheckData.invoiceNumber,
      comment: this.selectedCheckData.note,
      memo: this.selectedCheckData.memo,
      no_amount: this.selectedCheckData.isNoAmount,
      no_sign: this.selectedCheckData.isNoSign,
      no_date: this.selectedCheckData.isNoDate,
      no_payee: this.selectedCheckData.isNoPayee,
      remittance: this.selectedCheckData.remittance,
      categoryDetails: this.selectedCheckData.categoryDetails,
      expenseDetails: this.selectedCheckData.expenseDetails,
      realmId: this.selectedCheckData.qboCompany.realmId,
      mappingId: this.selectedCheckData.qboBankAccount.id,
      companyId: this.selectedCheckData.qbdCompany.companyId,
      qbBankId: this.selectedCheckData.qbdBankAccount.id,
      customElements: this.checkForm.setControl(
        'customElements',
        new FormControl(this.customElementGroup)
      ) // custom element
    });

    this.CategoryTotal();
    this.ExpenseTotal();
    this.updateNetSuiteExpenseTotal();
  }

  onLocationChange(value: string) {
    this.checkForm.controls.locationId.setValue(value);
  }

  createCheckBody(): INewCheck {
    const data = this.checkForm.value;
    this.dateToday = this.datePipe.transform(data.checkDate, 'yyyy-MM-dd')!;
    const updatedRemittance = data.remittance;
    if (this.newTableFormatEnabled === 'true') {
      updatedRemittance.map((obj: IRemittanceDetails) => {
        delete obj.itemName;
        delete obj.itemUnitCost;
        delete obj.itemQuantity;
        delete obj.totalSingleRow;
        return obj;
      });
    } else {
      updatedRemittance.map((obj: IRemittanceDetails) => {
        delete obj.invoiceDate;
        delete obj.grossAmount;
        delete obj.discountAmount;
        delete obj.netAmount;
        delete obj.thisPayment;
        return obj;
      });
    }

    return {
      freshbookCompanyId: data.freshbookCompanyId,
      attachFreshbooksExpenseToCheck: data.attachFreshbooksExpenseToCheck,
      freshbookExpenseDetails: data.freshbookExpenseDetails,
      bankAccount: this.selectedBank?.id
        ? this.selectedBank!.id
        : data.bankAccount,
      payee: this.isPayeeChecked
        ? ''
        : this.selectedPayee
          ? this.selectedPayee.id
          : data.payee,
      amount: this.isAmountChecked ? null : data.checkAmount,
      checkIssueDate: this.isDateChecked ? '' : this.dateToday,
      category: this.selectedCatagory ? this.selectedCatagory : data.category,
      checkSerialNo: data.check_no,
      accountNo: data.acc_no,
      invoiceNo: data.inv_no,
      note: data.comment,
      memo: data.memo,
      no_amount: Number(data.no_amount),
      no_sign: Number(data.no_sign),
      no_payee: Number(data.no_payee),
      no_date: Number(data.no_date),
      isVendorCreditApplied: this.getPayeeVendorCredit != 0 ? 1 : 0,
      vendorCredit: this.getPayeeVendorCredit,
      commentIds: this.createdExistingComments.map((e) => e.id),
      attachmentIds: this.createdExistingAttachments.map((e) => e.id),
      attachRemittanceToCheck: this.isRemittanceSaved ? '1' : '0',
      attachCategoryToCheck: this.isCategorySaved && this.isPushBack  ? '1' : '0',
      attachExpenseToCheck: this.isExpenseSaved ? '1' : '0',
      attachNetsuiteExpenseToCheck: this.isNetSuiteSaved ? '1' : '0',
      remittance_type: this.isRemittanceModified(),
      remittance: this.isRemittanceSaved ? updatedRemittance : '',
      categoryDetails: this.isCategorySaved
        ? this.categoryTotal == 0
          ? ''
          : data.categoryDetails
        : '',
      expenseDetails: this.isExpenseSaved
        ? this.expenseTotal == 0
          ? ''
          : data.expenseDetails
        : '',
      netsuiteExpenseDetails: this.isNetSuiteSaved
        ? this.netSuiteTotal === 0
          ? ''
          : data.netsuiteExpenseDetails
        : '',
      realmId: data.realmId,
      locationId: data.locationId,
      mappingId: data.mappingId,
      qbBankId: data.qbBankId,
      companyId: data.companyId,
      netsuiteBankId: data.netsuiteBankId,
      warning: this.isClonedCheck ? 1 : this.isSubmitWithAlreadyExistedcheckfields,
      checkNumberWarning: this.isSubmitWithAlreadyExistedcheckNo,
      bills: this.selectedBillIds, // when pay bill
      isMapping: this.thirdParty ? 1 : 0,
      quickbook: this.selectedCheckData?.isImportedFromQb == 1 ? 1 : 0,
      permission_action: this.buttonClicked,
      customElements: this.customElementGroup,
      isCloned: this.isClonedCheck ? 1 : 0
    };
  }

  remittanceFormBody() {
    return this.fb.group({
      invoiceNumber: [''],
      itemName: [],
      itemDescription: [''],
      itemQuantity: [''],
      itemUnitCost: [''],
      totalSingleRow: [''],
      invoiceDate: [''],
      grossAmount: [''],
      discountAmount: [''],
      netAmount: [''],
      thisPayment: ['']
    });
  }

  isRemittanceModified() {
    if (this.newTableFormatEnabled === 'true') {
      return 1;
    }
    return 0;
  }

  categoryFormBody() {
    return this.fb.group({
      categoryId: [],
      description: [''],
      customerId: [],
      classId: [],
      amount: ['']
    });
  }

  ExpenseFormBody() {
    return this.fb.group({
      expenseId: [],
      description: [''],
      customerId: [],
      classId: [],
      amount: ['']
    });
  }

  netSuiteFormBody() {
    return this.fb.group({
      expenseId: [],
      description: [''],
      customerId: [],
      classId: [],
      locationId: [],
      amount: ['']
    });
  }

  createWalletACHFormBody(): ISvbACHCompleteTransaction {
    const data = this.checkForm.value;
    return {
      type: 'wallet',
      mode: '1',
      walletId: data.wallet,
      amount: Number(data.checkAmount),
      payees: [
        {
          id: data.payee,
          amount: data.checkAmount,
          email: this.selectedPayee!.email,
          bankAccount: this.payeeBankControl.value,
          bills: this.selectedBillIds
        }
      ]
    };
  }

  createCreditCardBody(): ISvbCardCompleteTransaction {
    const data = this.checkForm.value;
    return {
      cardId: this.selectedCreditCard?.cardId,
      amount: data.checkAmount,
      mode: '1',
      payees: [
        {
          id: data.payee,
          amount: data.checkAmount,
          email: this.selectedPayee!.email,
          invoiceNumber: data.inv_no,
          memo: data.memo,
          category: data.category ?? '',
          bills: this.selectedBillIds
        }
      ]
    };
  }

  onSubmit(buttonType: string): void {
    this.buttonClicked = 0;
    if (buttonType === 'printCheck' || buttonType === 'printWhiteCheck') {
      this.buttonClicked = 1;
    } else if (buttonType === 'mail') {
      this.buttonClicked = 2;
    } else if (buttonType === 'email') {
      this.buttonClicked = 3;
    } else if (buttonType === 'ACH') {
      this.buttonClicked = 4;
    }
    this.chequeAmount = this.checkForm.value.checkAmount;

    this.buttonType = buttonType;
    this.checkForm.markAllAsTouched();

    if (!this.validateCheckForm()) return;

    if (this.isNotVerfied) {
      this.authDataService.verifyEmailAndMobile(
        this.authDataService.getVerificationMessage(this.userVerification),
        'Not Now'
      );
      return;
    }

    let categoryId = '';
    if(this.selectedCatagory){
      categoryId = this.selectedCatagory;
    }else if(this.checkForm.value.category){
      categoryId = this.checkForm.value.category;
    }
    
    if (this.isWiygulEnterPrise || (this.isWiygulEnterPrise && this.isNetSuitePushBackEnable && categoryId === '')) {
      this.openWarningAlert('Category field is required');
      return;
    }

    if (buttonType === 'ACH' && this.paymentProcessType === 'card') {
      this.manageCardPayment();
      return;
    }

    if (buttonType === 'ACH' && this.paymentProcessType === 'wallet') {
      this.onCompleteTransaction(this.createWalletACHFormBody());
      return;
    }

    if(this.isWiygulEnterPrise){      
      this.isCategorySaved = true;
      this.CategoryTotal();
      this.netSuiteSaveExpense(buttonType);
      return;
    }

    if (!this.editMode) this.onNewCheck(buttonType);
    else this.onUpdateCheck(buttonType);
  }

  WarningForCategoryDetails() {
    if (this.ShowWarningForCategory && !this.isCategorySaved) {
      this.openWarningAlert('Category details is required');
      return false;
    }
    return true;
  }

  getFormControls(name: string) {
    return this.checkForm.get(name);
  }

  // New Check
  onNewCheck(buttonType: string) {    
    if (this.WarningForCategoryDetails()) {
      this.loading = true;
      this.creditCardToastShown = false;
      this.subscriptions.push(
        this.checkService
          .createCheck(this.createCheckBody())
          .pipe(
            finalize(() => (this.loading = false)),
            catchError((e) => {
              if (e?.error.errorCode === 190) {
                const warn = this.openConfirmAlert(
                  'Do you want to proceed anyway?',
                  e.error.errorMsg
                );
                warn.afterClosed().subscribe((r) => {
                  if (r) {
                    this.isSubmitWithAlreadyExistedcheckfields = 1;
                    this.onNewCheck(buttonType);
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
                    this.onNewCheck(buttonType);
                  }
                });
              }
              return of(false);
            })
          )
          .subscribe((res) => {
            const response = res as ICreateNewCheck;
            if (response.success) {
              this.gettingStartedService.updatedGettingStartedData = 5;
              this.onRedirect(buttonType, false, response.data);
            }
          })
      );
    }
  }

  // Update Check
  onUpdateCheck(buttonType: string) {
    if (
      this.isVendorCreditApplied == 1 &&
      this.selectedPayeeIdOnEdit !== this.payeeId
    ) {
      // prevent edit payee
      this.openWarningAlert(
        'Please remove all applied credit from the check before update the payee.'
      );
      return;
    }

    if (this.selectedCheckData.isImportedCheck == 1) {
      this.isSubmitWithAlreadyExistedcheckNo = 1;
    }

    if (this.WarningForCategoryDetails()) {
      this.loading = true;
      this.creditCardToastShown = false;
      const checkBody = this.createCheckBody();
      this.subscriptions.push(
        this.checkService
          .updateCheck(this.checkId, checkBody)
          .pipe(
            finalize(() => (this.loading = false)),
            catchError((e) => {
              if (e?.error.errorCode === 190) {
                const warn = this.openConfirmAlert(
                  'Do you want to proceed anyway?',
                  e.error.errorMsg
                );
                warn.afterClosed().subscribe((r) => {
                  if (r) {
                    this.isSubmitWithAlreadyExistedcheckfields = 1;
                    this.onUpdateCheck(buttonType);
                  }
                });
              }
              if (
                e?.error.errorCode === 213 &&
                this.selectedCheckData.isImportedCheck != 1
              ) {
                const warn = this.openConfirmAlert(
                  'Do you want to proceed anyway?',
                  e.error.errorMsg
                );
                warn.afterClosed().subscribe((r) => {
                  if (r) {
                    this.isSubmitWithAlreadyExistedcheckNo = 1;
                    this.onNewCheck(buttonType);
                  }
                });
              } else if (
                this.selectedCheckData.isImportedCheck == 1 &&
                e?.error.errorCode === 213
              ) {
                this.onUpdateCheck(buttonType);
              }
              return of(false);
            })
          )
          .subscribe((res) => {
            const response = res as IUpdateCheck;
            if (response.success) {
              this.onRedirect(buttonType, true, {
                ...response.data,
                serialNo: checkBody.checkSerialNo
              });
            }
          })
      );
    }
  }

  addFormValidators(): void {
    if (
      this.paymentProcessType === 'wallet' ||
      this.paymentProcessType === 'card'
    ) {
      this.setCheckFormValue('check_no', null);

      this.checkForm.controls.bankAccount.clearValidators();
      this.checkForm.controls.check_no.clearValidators();
      this.checkForm.controls.bankAccount.updateValueAndValidity();
      this.checkForm.controls.check_no.updateValueAndValidity();

      this.checkForm.controls.payee.setValidators([Validators.required]);
      this.checkForm.controls.checkAmount.setValidators([Validators.required]);
      this.checkForm.controls.checkDate.setValidators([Validators.required]);
      this.checkForm.controls.payee.updateValueAndValidity();
      this.checkForm.controls.checkAmount.updateValueAndValidity();
      this.checkForm.controls.checkDate.updateValueAndValidity();
    } else {
      this.checkForm.controls.inv_no.clearValidators();
      this.checkForm.controls.memo.clearValidators();
      this.checkForm.controls.inv_no.updateValueAndValidity();
      this.checkForm.controls.memo.updateValueAndValidity();

      this.checkForm.controls.bankAccount.setValidators([Validators.required]);
      this.checkForm.controls.check_no.setValidators([Validators.required]);
      this.checkForm.controls.bankAccount.updateValueAndValidity();
      this.checkForm.controls.check_no.updateValueAndValidity();
    }

    if (
      this.paymentProcessType === 'card' ||
      this.paymentProcessType === 'bank'
    ) {
      this.checkForm.controls.wallet.clearValidators();
      this.checkForm.controls.wallet.updateValueAndValidity();
    }

    if (this.paymentProcessType === 'card') {
      this.checkForm.controls.inv_no.setValidators([Validators.required]);
      this.checkForm.controls.memo.setValidators([Validators.required]);
      this.checkForm.controls.inv_no.updateValueAndValidity();
      this.checkForm.controls.memo.updateValueAndValidity();
    }

    if (this.paymentProcessType === 'wallet') {
      this.checkForm.controls.wallet.setValidators([Validators.required]);
      this.checkForm.controls.inv_no.clearValidators();
      this.checkForm.controls.memo.clearValidators();
      this.checkForm.controls.memo.updateValueAndValidity();
      this.checkForm.controls.inv_no.updateValueAndValidity();
      this.checkForm.controls.wallet.updateValueAndValidity();
    }
  }

  // Check Form Validate
  validateCheckForm(): boolean {
    const validateBank: UntypedFormControl =
      this.validationService.getValidationError(
        this.checkForm.controls.bankAccount
      );
    const validatePayee: UntypedFormControl =
      this.validationService.getValidationError(this.checkForm.controls.payee);
    const validateAmount: UntypedFormControl =
      this.validationService.getValidationError(
        this.checkForm.controls.checkAmount
      );
    const validateDate: UntypedFormControl =
      this.validationService.getValidationError(
        this.checkForm.controls.checkDate
      );
    const validateInvoiceNo: UntypedFormControl =
      this.validationService.getValidationError(this.checkForm.controls.inv_no);
    const validateMemo: UntypedFormControl =
      this.validationService.getValidationError(this.checkForm.controls.memo);
    const wallet: UntypedFormControl =
      this.validationService.getValidationError(this.checkForm.controls.wallet);
    const validateAccNo =
      this.validationService.getValidationError(this.checkForm.controls.acc_no);
    if (!this.selectedCreditCard && this.paymentProcessType === 'card') {
      this.openWarningAlert('Please select card.');
      return false;
    }
    if (!wallet && this.paymentProcessType === 'wallet') {
      this.openWarningAlert('Please select wallet.');
      return false;
    }
    if (!validateBank) {
      this.openWarningAlert('Please select bank account.');
      return false;
      // } else if (buttonType === 'ACH' && this.paymentProcessType === 'bank' && this.selectedBank!?.status !== 4) {
      //   this.openWarningAlert('Please verify your bank account.');
      //   return false;
    }
    if (!validatePayee && !this.isPayeeChecked) {
      this.openWarningAlert('Please select payee.');
      return false;
    }
    if (!validateAmount && !this.isAmountChecked) {
      this.openWarningAlert('Please enter amount.');
      return false;
    }
    if (
      !this.isNumeric(this.checkForm.value.checkAmount) &&
      this.checkForm.value.checkAmount !== null
    ) {
      this.openWarningAlert('The amount must be a number.');
      return false;
    }
    if (this.checkForm.value.checkAmount == 0 && !this.isAmountChecked) {
      this.openWarningAlert('The Amount should be greater than $0.01');
      return false;
    }
    if (!validateDate && !this.isDateChecked) {
      this.openWarningAlert('Please select date.');
      return false;
    }
    if (!validateInvoiceNo) {
      this.openWarningAlert('Please enter Invoice No.');
      return false;
    }
    if (!validateMemo) {
      this.openWarningAlert('Please enter memo.');
      return false;
    }
    if (typeof validateAccNo === 'string') {
      this.openWarningAlert('Payee ID cannot exceed 30 characters.');
      return false;
    }
    return true;
  }

  // Check Which action button clicked
  onRedirect(buttonType: string, edit: boolean, checkData: any): void {
    const checkNo = checkData.serialNo;
    const createContent = `New check is created with serial number ${checkNo}.`;
    const UpdateContent = `Check is updated with serial number ${checkNo}.`;
    const AlertContent = !edit ? createContent : UpdateContent;

    switch (buttonType) {
      case 'save':
        this.onSaveCheck(AlertContent);
        break;
      case 'saveAndNew':
        this.onSaveAndNew(AlertContent);
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
      case 'ACH':
        this.openDirectDepositModal(edit, AlertContent, checkData.id);
        break;
      default:
        break;
    }
  }

  onSaveCheck(AlertContent: string) {
    this.openSuccessAlert(AlertContent, true, 2000);
    this.dtCacheService.firstLoadFromCache = false;
    this.navigateByUrl('/manage/cheque');
    this.scriptService.gtagEventScript('check-created', {
      amount: this.chequeAmount
    });
  }

  onSaveAndNew(AlertContent: string, reset?: boolean) {
    if (!reset) this.openSuccessAlert(AlertContent);

    this.scriptService.gtagEventScript('check-created', {
      amount: this.chequeAmount
    });
    if (this.editMode) {
      this.router.navigateByUrl('manage/cheque/create');
      this.editMode = false;
      this.paymentProcessType = 'bank';
      setTimeout(() => {
        this.changePaymentTypeSelected(2);
      }, 50);
    }

    const amountEl = this.querySelector('#amount');
    const signEl = this.querySelector('#sign');
    const payeeEl = this.querySelector('#payee');
    const dateEl = this.querySelector('#date');

    const variables = [
      this.isRemittanceSaved,
      this.isAmountChecked,
      this.isSignChecked,
      this.isPayeeChecked,
      this.isDateChecked
    ];
    const elVariables = [amountEl, signEl, payeeEl, dateEl];

    for (let _e of variables) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _e = false;
    }

    for (const el of elVariables) {
      el.checked = false;
    }

    this.checkForm.reset();
    this.setCheckFormValue('checkDate', this.dateToday);
    this.sharedService.setNewBankCreatedData();
    this.sharedService.setNewPayeeCreatedData(null);
    this.sharedService.setNewCategoryCreatedData(null);

    const input: NodeListOf<HTMLInputElement> = document.querySelectorAll(
      '#disable_payee,#disable_date,#disable_amount'
    );
    input.forEach((e) => {
      e.classList.remove('disable_field');
    });

    this.getPayeeVendorCredit = 0;
    this.payeeVendorCredit = null;
    this.payeeId = '';
    this.isVendorCreditApplied = 0;
    this.quickBookImportedData = null;
    this.selectedPayee = undefined;
    this.selectedPayeeSummary = null;
    this.isRemittanceSaved = false;
    this.isSubmitWithAlreadyExistedcheckfields = 0;
    this.isSubmitWithAlreadyExistedcheckNo = 0;
    this.expandedWhiteCheckPapperBtn = !this.expandedWhiteCheckPapperBtn;
  }

  onCompleteTransaction(payload: ISvbACHCompleteTransaction): void {
    payload.payees[0]!.name = this.selectedPayee?.name;
    const modal = this.dialog.open(WalletAchModalComponent, {
      width: '45%',
      data: payload,
      disableClose: true
    });

    modal.afterClosed().subscribe((res) => {
      if (res) {
        this.checkForm.reset();
        this.payeeDropDown.clearSelectedItem();
        this.walletDropDown.clearSelection();
      }
    });
  }

  /**
   * @description Complete transaction function for card payment. if Payment completed successfully, we simply navigates to '/manage/payment-rail/paid'
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  onCompleteCreditCardTransaction(documents?: ICardPaymentReqDocRes): void {
    const body: ICardCompleteTransaction = this.createCreditCardBody();
    body.documents = documents;

    this.loading = true;
    this.creditCardToastShown = false;
    this.subscriptions.push(
      this.cyberSourceService
        .capturePayment(body)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.cyberSourceService.replaceIdempotencyKey();
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            // Track when the credit card promoting toast is clicked and the payment is done.
            this.clickTrackingService
              .ccToastClickedPaymentDone(res.data?.payment_ids[0])
              ?.pipe(take(1))
              ?.subscribe();

            // this.scriptService.trackMatomoEvent(
            //   'Creditcard',
            //   'CreditcardUser',
            //   'CreditcardUser',
            //   this.localStorageService.getItem('userId')
            // );
            this.alertService.successAlert({ content: res.message });
            this.checkForm.reset();
            this.cardNgSelect.handleClearClick();
            this.payeeDropDown.clearSelectedItem();
          }
        })
    );
  }

  /**
   * @description Function for managing payments with card. where ever we create a payment with card, we call this function first,
   * and and from this function, firstly we checking if there is any documents required to make a payment with this card.
   * if required, we opens a modal and collects all the required documents and submits from the modal. and gets the response from the modal,
   * and with the response, we completes the payment.
   * if not required, we simply make the payment normally. without documents details.
   */
  manageCardPayment() {
    const card = this.selectedCreditCard;
    const amount = this.checkForm.controls.checkAmount.value;
    const invoiceNumber = this.checkForm.controls.inv_no.value;
    const mode = this.paymentMode;

    const body = {
      cardId: card?.cardId ?? '',
      amount: amount ?? '',
      paymentType: 'rail'
    };
    this.loading = true;
    this.creditCardToastShown = false;
    this.subscriptions.push(
      this.v3PaymentsService
        .getRequiredDocumentsDetails(body)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const invoiceRequired = res.data.required_docs.includes('invoice');
            const cardRequired = res.data.required_docs.includes('card');
            if (cardRequired || invoiceRequired) {
              if (card) {
                this.loading = false;
                const dialogRef = this.commonService.openVerifyCardInvoiceModal(
                  card,
                  amount,
                  mode,
                  invoiceNumber,
                  res.data.required_docs,
                  <IViewPayee>this.selectedPayee
                );
                dialogRef.afterClosed().subscribe((res) => {
                  if (res?.success) {
                    this.loading = true;
                    this.creditCardToastShown = false;
                    this.onCompleteCreditCardTransaction(res?.data);
                  } else if (res?.success === false) {
                    this.alertService.failedAlert({
                      content:
                        "Sorry.! Couldn't verify your documents, Please Verify all the documents to make a payment"
                    });
                  }
                });
              } else {
                this.loading = false;
              }
            } else {
              this.onCompleteCreditCardTransaction();
              this.loading = false;
            }
          } else {
            this.loading = false;
          }
        })
    );
  }

  Onclickcheck(error: any) {
    this.openWarningAlert(
      `These checks cannot be printed. Administrator approval is required before proceeding. <br> Check Number - ${error.error.errorMsg.checkSerialNumber}`
    );
  }

  ApprovalCheck(error: any, type: string): any {
    if (type == 'E-mailed') {
      const data = this.openWarningAlert(
        `This check can't be ${type}.For now Neo-bank account is ready for ACH/Direct Deposit only.`
      );
      data.afterClosed().subscribe((response: any) => {
        if (response) {
          this.navigateByUrl('/manage/cheque');
        }
      });
    } else {
      this.openWarningAlert(
        `This check can't be ${type}.For now Neo-bank account is ready for ACH/Direct Deposit only.`
      );
    }
  }

  zilBankCheck(type: string): any {
    const data = this.openWarningAlert(
      `This check can't be ${type}.For now ZilBank account is ready for ACH/Direct Deposit only.`
    );
    data.afterClosed().subscribe((Response: any) => {
      if (Response) {
        this.navigateByUrl('/manage/cheque');
      }
    });
  }

  onPrintCheck(
    edit: boolean,
    checkId: string,
    AlertContent: string,
    type: 'check' | 'white_paper'
  ): void {
    if (this.selectedBank?.isVirtualAccount) {
      this.loadingOptional = true;
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${this.selectedBank?.accountNumber}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          this.loadingOptional = true;
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [this.selectedBank?.id] }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true);
              this.processPrintCheck(edit, checkId, AlertContent, type);
            }
          });
        }
        this.loadingOptional = false;
      });
    }
    else if(this.selectedBank?.isVirtualAccount === 0 && this.selectedBank?.verifiedBy === 88 && this.selectedBank?.verified === 0){
      this.alertService.failedAlert({
        content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
        doneMsg: 'Update',
        isCancel: true
      }).afterClosed().subscribe((res) => {
        if (res) {
          this.loadingOptional = true;
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [this.selectedBank?.id] }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true);
              this.processPrintCheck(edit, checkId, AlertContent, type);
            }
          });
        }
        this.loadingOptional = false;        
      })
    }
    else{
      this.processPrintCheck(edit, checkId, AlertContent, type);
    }    
  }

  // Print Multiple Check
  processPrintCheck(
    edit: boolean,
    checkId: string,
    AlertContent: string,
    type: 'check' | 'white_paper'
  ): void {
    if (this.isItZilBank) {
      this.zilBankCheck('printed');
      return;
    }
    this.loadingOptional = true;
    this.creditCardToastShown = false;

    const itemIds: any = {
      checkId: [],
      paperType: type == 'check' ? this.selectedCheckPaperType : 6
    };
    itemIds.checkId = [checkId];

    this.subscriptions.push(
      this.checkService
        .printMultiCheck(itemIds)
        .pipe(
          finalize(() => {
            this.loadingOptional = false;
          }),

          catchError((error) => {
            if (error.error.errorCode === "plaid_virtual_account"){
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if(res){
                  const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error
                  });
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                    this.onPrintCheck(edit, checkId, AlertContent, type);
                    }
                  });
                }
              });
            }
            this.errorCode = error.error.errorCode;
            this.err_msg = error.error.errorMsg;
            if (error.error.errorCode == 125) {
              this.Onclickcheck(error);
            }
            if (error.error.errorCode == 123) {
              this.ApprovalCheck(error, 'printed');
              if (error) {
                this.navigateByUrl('/manage/cheque');
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
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                'Try Again'
              );

              dref.afterClosed().subscribe(() => {
                window.open(response.data.url);
              });
            }

            const alert = this.openSuccessAlert(AlertContent, false);
            alert.afterClosed().subscribe((res) => {
              if (res && !edit) this.navigateByUrl('/manage/cheque');
            });
          }
        })
    );
  }
  onMailCheck(_edit: boolean, AlertContent: string, id: string) {
    if (this.selectedBank?.isVirtualAccount) {
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${this.selectedBank?.accountNumber}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [this.selectedBank?.id] }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true)
              this.processMailCheck(_edit, AlertContent, id);
            }
          });
        }
      });
    }
    else if(this.selectedBank?.isVirtualAccount === 0 && this.selectedBank?.verifiedBy === 88 && this.selectedBank?.verified === 0){
      this.alertService.failedAlert({
        content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
        doneMsg: 'Update',
        isCancel: true
      }).afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [this.selectedBank?.id] }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true)
              this.processMailCheck(_edit, AlertContent, id);
            }
          });
        }
      });
    }else{
      this.processMailCheck(_edit, AlertContent, id);
    }
  }

  processMailCheck(_edit: boolean, AlertContent: string, id: string) {
    if (this.isItZilBank) {
      this.zilBankCheck('mailed');
      return;
    }
    this.openSuccessAlert(AlertContent, false);

    this.shippingType();
    this.paperType();

    const ids: any = { ids: [] };
    ids.ids.push(id);

    this.subscriptions.push(
      this.checkService
        .getChequeDetails(ids)
        .pipe(
          catchError((error) => {
            this.errorCode = error.error.errorCode;
            this.err_msg = error.error.errorMsg;

            if (error.error.errorCode == 123) {
              this.ApprovalCheck(error, 'mailed');
              if (error) {
                this.navigateByUrl('/manage/cheque');
              }
            }
            return of(false);
          })
        )
        .subscribe((res: any) => {
          if (res.success) {
            this.checkdata.chequedata = res.data;
            this.checkDetails = res.data.datas;
            this.chequeAmount = res.data.datas[0].cheque_amount;
            if (this.checkdata.chequedata) {
              this.ShippingCalculation();
            }
          }

          if (this.errorCode == 2) {
            this.checkdata.errorMsg = this.err_msg;
            const checkNo = String(this.checkForm.value.check_no);

            if (checkNo === this.checkdata.errorMsg) {
              this.bankAccountId = this.checkForm.value.bankAccount;
            }

            this.dialog.open(VerifySignatureModalComponent, {
              maxWidth: '440px',
              width: '100%',
              minHeight: '200px',
              disableClose: true,
              data: {
                ids,
                data: this.checkdata,
                bankAccountId: this.bankAccountId
              }
            });
          }

          if (!res && this.errorCode == 106) {
            if (this.errorCode == 106) {
              const warningAlert = this.alertService.warningAlert({
                content: this.err_msg,
                doneMsg: 'Verify',
                isCancel: true
              });
              warningAlert.afterClosed().subscribe((response: any) => {
                if (response) {
                  this.router.navigate([
                    '/manage/user-profile/verify-email-phone'
                  ]);
                }
              });
            }
          }
        })
    );
  }

  // For Check Mail
  shippingType(): void {
    this.subscriptions.push(
      this.checkService.getShippingType().subscribe((res: any) => {
        this.checkdata.shipping = res.data;
      })
    );
  }

  paperType(): void {
    this.subscriptions.push(
      this.checkService.getpaperType().subscribe((res: any) => {
        this.checkdata.paper = res.data;
      })
    );
  }

  ShippingCalculation() {
    for (let i = 0; i < this.checkDetails.length; i++) {
      const ids2 = this.checkDetails[i].enc_id;
      this.caldata.mail_check_ids.push(this.checkDetails[i].enc_id);
      const idlist = {
        mail_type: 1,
        check_paper: 7,
        informed_payee_sms: 0,
        informed_payee_email: 0,
        payee_phone: '',
        payee_email: '',
        file_hidden: []
      };
      idlist.payee_email = this.checkDetails[i].payee_email;
      idlist.payee_phone = this.checkDetails[i].payee_phone;
      this.caldata[ids2] = idlist;
    }

    this.subscriptions.push(
      this.checkService
        .ShippingCostCalculationGroup(this.caldata)
        .subscribe((res: any) => {
          this.ShippingCostRes = res.data;
          if (res.success) {
            this.openModal();
          }
        })
    );
  }

  /** ***************************** open mail modal */
  openModal() {
    if (this.checkdata.chequedata && this.ShippingCostRes && this.caldata) {
      this.dialog.open(CheckMailModalComponent, {
        maxWidth: '1200px',
        width: '100%',
        minHeight: '380px',
        disableClose: true,
        data: {
          data: this.checkdata,
          ShippingCost: this.ShippingCostRes,
          caldata: this.caldata
        }
      });
    }
  }

  onEmailCheck(edit: boolean, AlertContent: string, checkId: string) {
    if (this.selectedBank?.isVirtualAccount) {
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${this.selectedBank?.accountNumber}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [this.selectedBank?.id] }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true)
              this.processEmailCheck(edit, AlertContent, checkId);
            }
          });
        }
      });
    }
    else if(this.selectedBank?.isVirtualAccount === 0 && this.selectedBank?.verifiedBy === 88 && this.selectedBank?.verified === 0){
      this.alertService.failedAlert({
        content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
        doneMsg: 'Update',
        isCancel: true
      }).afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [this.selectedBank?.id] }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.shouldReloadBankAccounts.set(true)
              this.processEmailCheck(edit, AlertContent, checkId);
            }
          });
        }
      });
    }else{
      this.processEmailCheck(edit, AlertContent, checkId);
    }
  }

  processEmailCheck(edit: boolean, AlertContent: string, checkId: string) {
    if (this.isItZilBank) {
      this.zilBankCheck('E-mailed');
      return;
    }

    const selectedCheckId: any[] = [];
    selectedCheckId.push({ action: checkId });
    const dialogRef = this.dialog.open(CheckEmailModalComponent, {
      maxWidth: '93%',
      width: '1200px',
      disableClose: true,
      data: {
        data: selectedCheckId
      }
    });

    dialogRef.afterClosed().subscribe((get) => {
      if (!get) {
        const alert = this.openSuccessAlert(AlertContent, false);
        alert.afterClosed().subscribe(() => {
          if (get && !edit) {
            this.navigateByUrl('/manage/cheque');
          }
        });
      } else if (get.errorCode == 123) {
        this.ApprovalCheck(get, 'E-mailed');
      } else {
        this.navigateByUrl('/manage/cheque');
      }
    });
  }

  openDirectDepositModal(_edit: boolean, AlertContent: string, checkId: any) {
    const modal = this.dialog.open(DirectDepositComponent, {
      width: '75%',
      data: [{ action: checkId }],
      disableClose: true
    });

    modal.afterClosed().subscribe((res) => {
      if (res.success) {
        this.openSuccessAlert('Successfully done.');
        this.navigateByUrl('/manage/cheque');
        return;
      }

      if (!res.addInfoClicked) {
        this.openSuccessAlert(AlertContent, false);
        this.navigateByUrl('/manage/cheque');
      }
    });
  }

  /**
   * @description  Handle the payee dropdown changes
   * @param event
   *
   */
  payeeDropDownChange(event: any): void {
    /** Setting the payee default category */
    if (event?.id) {
      this.subscriptions.push(
        this.checkService.getPayeeCategory(event?.id).subscribe((res) => {
          if(res.data?.id){
            this.selectedPayeeCategory = res.data;
            this.setCheckFormValue('category', res?.data?.id);
            this.sharedService.setNewCategoryCreatedData({
              categoryId: res?.data?.id
            });
            this.autoUpdateNetsuiteCategory();
            if(this.realmid){
              const category = {
                id:this.selectedPayeeCategory?.id as string,
                name:this.selectedPayeeCategory?.name as string
              };
              this.autoSelectQBCategory(category);
            }
          }else{
            this.selectedPayeeCategory = undefined;
            this.setCheckFormValue('category', null);
            this.sharedService.setNewCategoryCreatedData({
              categoryId: ''
            });
            this.QBCategoryItemName[0] = null;
          }
        })
      );
    } else {
      this.setCheckFormValue('category', null);
      this.sharedService.setNewCategoryCreatedData({
        categoryId: ''
      });
      this.afterPayeeSelected(event);
      this.QBCategoryItemName[0] = null;
      return;
    }
    if (
      (this.paymentProcessType === 'wallet' ||
        this.paymentProcessType === 'card') &&
      !event?.email
    ) {
      this.payeeEmailRequired(event);
    } else {
      this.afterPayeeSelected(event);
    }
  }

  afterPayeeSelected(data: any): void {
    this.selectedPayee = data;
    this.payeeId = data?.id;
    this.loadPayeeSummary(this.payeeId!);
    this.loadPayeeVendorCredit(this.payeeId!);
    this.loadPayeeDetails(this.payeeId!);
    this.checkForm.controls.payee.markAsTouched();
    this.setCheckFormValue('payee', this.payeeId!);
    this.getPayeeBankAccounts(this.payeeId!);

    if (!this.payeeId) {
      this.selectedPayee = undefined;
    }
    if (this.getPayeeVendorCredit > 0) {
      this.setCheckFormValue(
        'checkAmount',
        Number(this.checkForm.value.checkAmount) + this.getPayeeVendorCredit
      );
      this.getPayeeVendorCredit = 0;
      this.setCheckFormValue('memo', '');
      const vendorCreditErr = this.querySelector('#vendorCredit_err');
      vendorCreditErr.innerText = ``;
    }
  }

  getSelectedPayeeBank(id: string | null) {
    if (id) {
      this.payeeBankControl.patchValue(id);
      this.getPayeeSingleBankAccount(this.payeeId!, id);
    } else {
      this.selectedPayeeBank = {};
      this.payeeBankControl.patchValue(null);
    }
  }

  walletDropDownChange(event: any): void {
    if (event?.id) this.setCheckFormValue('wallet', event.uuId);
    else this.setCheckFormValue('wallet', null);
  }

  // Bank Dropdown change
  bankDropDownChange(event: any): void {
    const cardEl = document.getElementById('singleTab_card') as HTMLDivElement;

    if (event === 'pay_using_credit_card') {
      this.changePaymentType(cardEl, { name: 'Credit Card', value: 'card' });
      return;
    }

    this.clear('ocwBank');
    this.selectedBank = event;
    this.isItZilBank = event?.isItZil;

    // checed the zoho mapped bank Accound check
    if (
      (this.thirdpartyprovider == 3 ||
        this.thirdpartyprovider == 2 ||
        this.thirdpartyprovider == 5) &&
      this.selectedBank != null
    ) {
      this.checkBanKAccount(this.selectedBank?.id);
    } else if (this.thirdpartyprovider == 3 && this.selectedBank == null) {
      this.setCheckFormValue('check_no', '');
    }
    // END

    // get the check serial no
    if (this.selectedCheckData) {
      if (this.selectedCheckData.loadSerialNumber != 1) {
        // In QB not get the check serial number
        this.loadCheckSerialNo(this.selectedBank?.id);
      } else if (
        this.selectedCheckData.serialNumber == 0 ||
        this.selectedCheckData.serialNumber == '' ||
        this.selectedCheckData.serialNumber == null
      ) {
        this.loadCheckSerialNo(this.selectedBank?.id); // get check serial number on chenging bank account
      }
    } else {
      this.loadCheckSerialNo(this.selectedBank?.id); // get check serial number on chenging bank account
    }
    // end

    this.checkForm.controls.bankAccount.markAsTouched();
    this.setCheckFormValue('bankAccount', event?.id);

    if (this.isPushBack) {
      this.getCompany(event?.id);
    }

    if (this.isQBDPushback) {
      this.getQBDCompany(event.id);
    }

    if (this.isNetSuitePushBackEnable && event?.id) {
      this.getNetSuiteBank(event.id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  checkBanKAccount(selectedBank: string) {
    this.subscriptions.push(
      this.invoiceService
        .Bankchecking(
          selectedBank,
          this.importedBillId ? this.importedBillId : this.checkId,
          this.importedBillId ? 'bill' : 'check',
          thirdpartyProviderCode[this.thirdpartyprovider]
        )
        .pipe(
          catchError((error) => {
            if (error.error.errorCode == 600) {
              const dialog = this.alertService.confirmAlert({
                content: error.error.errorMsg
              });
              dialog.afterClosed().subscribe((res: any) => {
                if (!res) {
                  this.selectedBank = null;
                  this.setCheckFormValue('bankAccount', '');
                  this.setCheckFormValue('check_no', '');
                  this.sharedService.setNewBankCreatedData();
                }
              });
            }

            return of(false);
          })
        )
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .subscribe(() => {})
    );
  }

  // category Dropdown change
  catagoryDropDownChange(event: { id: string; name: string }): void {
    this.autoUpdateNetsuiteCategory(event);
    if (event === undefined) {
      this.selectedCatagory = '';
      this.checkForm.controls.category.setValue('');
    } else {
      this.selectedCatagory = event?.id;
      this.autoSelectQBCategory(event);
    }
  }

  autoSelectQBAmount(amount: string) {
    this.categoryTotal = 0;
    const categoryArray = this.getCategoryFormControl();
    categoryArray.controls[0].patchValue({
      amount
    });
    this.categoryTotal = Number(amount.replace(/[^0-9\.]+/g, ''));
  }

  autoSelectQBCategory(category: { id: string; name: string }) {
    if (!this.realmid) return;
    this.subscriptions.push(
      this.checkService
        .getQbCategory(this.realmid, category.id)
        .subscribe((res) => {
          if (res.success && res.data) {
            const { id } = res.data;
            const categoryArray = this.getCategoryFormControl();
            categoryArray.controls[0].patchValue({
              categoryId: id
            });
            this.QBCategoryItemName[0] = category.name;
            this.onScrollCompanyDetails('category-items');
            this.QBCategoryItem.push(category);
          }
        })
    );
  }

  // Process Without Amount
  checkedAmount(): void {
    const element = this.querySelector('#amount');
    const inputEl = this.querySelector('#disable_amount');
    if (element.checked) {
      const alert = this.openInfoAlert(
        'This will enable processing check without amount, producing a blank check.'
      );
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.isAmountChecked = true;
          this.setCheckFormValue('no_amount', 1);
          inputEl.classList.add('disable_field');
          this.addStyleCursorNoDrop('input');
          this.checkForm.controls.checkAmount.clearValidators();
          this.checkForm.controls.checkAmount.updateValueAndValidity();
          this.loadControlErrors();
        } else {
          element.checked = false;
          this.isAmountChecked = false;
        }
      });
      return;
    }
    this.isAmountChecked = false;
    this.setCheckFormValue('no_amount', 0);
    inputEl.classList.remove('disable_field');
    this.addStyleCursorNoDrop('input');
    this.checkForm.controls.checkAmount.setValidators([Validators.required]);
    this.checkForm.controls.checkAmount.updateValueAndValidity();
    this.loadControlErrors();
  }

  // Process Without sign
  checkedSign(): void {
    const element = this.querySelector('#sign');
    if (element.checked) {
      const alert = this.openInfoAlert(
        'This will enable processing check without signature, producing a blank check.'
      );
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.isSignChecked = true;
          this.setCheckFormValue('no_sign', 1);
        } else {
          element.checked = false;
          this.isSignChecked = false;
        }
      });
      return;
    }
    this.isSignChecked = false;
    this.setCheckFormValue('no_sign', 0);
  }

  // Process Without Payee
  checkedPayee(): void {
    const element = this.querySelector('#payee');
    const inputEl = this.querySelector('#disable_payee');

    if (element.checked) {
      const alert = this.openInfoAlert(
        `This will enable processing check without check's ${this.whiteLabelPayeeName}, producing a blank check.`
      );
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.isPayeeChecked = true;
          this.sharedService.setNewPayeeCreatedData(null);
          this.setCheckFormValue('no_payee', 1);
          this.setCheckFormValue('payee', null);
          inputEl.classList.add('disable_field');
          this.addStyleCursorNoDrop('dropdown');
          this.selectedPayee = undefined;
          this.payeeId = '';
          this.checkForm.controls.payee.clearValidators();
          this.checkForm.controls.payee.updateValueAndValidity();
          this.loadControlErrors();
        } else {
          element.checked = false;
          this.isPayeeChecked = false;
        }
      });
      return;
    }

    this.isPayeeChecked = false;
    this.setCheckFormValue('no_payee', 0);
    this.setCheckFormValue('payee', null);
    inputEl.classList.remove('disable_field');
    this.addStyleCursorNoDrop('dropdown');
    this.checkForm.controls.payee.setValidators([Validators.required]);
    this.checkForm.controls.payee.updateValueAndValidity();
    this.loadControlErrors();
  }

  // Process Without Date
  checkedDate(): void {
    const element = this.querySelector('#date');
    const inputEl = this.querySelector('#disable_date');
    if (element.checked) {
      const alert = this.openInfoAlert(
        'This will enable processing check without check’s date, producing a blank check.'
      );
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.isDateChecked = true;
          this.setCheckFormValue('checkDate', '');
          this.setCheckFormValue('no_date', 1);
          inputEl.classList.add('disable_field');
          this.addStyleCursorNoDrop('input');
          this.checkForm.controls.checkDate.clearValidators();
          this.checkForm.controls.checkDate.updateValueAndValidity();
          this.loadControlErrors();
        } else {
          element.checked = false;
          this.isDateChecked = false;
        }
      });
      return;
    }
    this.isDateChecked = false;
    inputEl.classList.remove('disable_field');
    this.setCheckFormValue('no_date', 0);
    this.setCheckFormValue('checkDate', null);
    this.addStyleCursorNoDrop('input');
    this.checkForm.controls.checkDate.setValidators([Validators.required]);
    this.checkForm.controls.checkDate.updateValueAndValidity();
    this.loadControlErrors();
  }

  // ------------------------------->REMITTANCE-----------------------------
  onSaveRemittance(): void {
    this.isRemittanceSaved = true;
    this.isRemittence = !this.isRemittence;
  }

  addNewRow(type: string): void {
    if (type == 'category') {
      const addRow = this.getCategoryFormControl();
      addRow.push(this.categoryFormBody());

      if (this.getCategoryFormControl().controls.length >= 10) {
        this.disableCategoryAddBtn = false;
      }
    } else if (type == 'expense') {
      const addRow = this.getExpenseFormControl();
      addRow.push(this.ExpenseFormBody());

      if (this.getExpenseFormControl().controls.length >= 10) {
        this.disableExpenseAddBtn = false;
      }
    } else if (type === 'netsuite') {
      const netSuiteForm = this.getNetSuiteFormControl();
      netSuiteForm.push(this.netSuiteFormBody());
    } else {
      const addRow = this.getRemittanceFormControl();
      addRow.push(this.remittanceFormBody());

      if (this.getRemittanceFormControl().controls.length >= 10) {
        this.disableRemitAddBtn = false;
      }
    }
  }

  removeRow(type: string): void {
    if (type == 'category') {
      const removeitem = this.getCategoryFormControl();
      if (removeitem.length > 1) {
        removeitem.removeAt(removeitem.length - 1);
        this.QBCategoryItemName[removeitem.length] = null;
        this.QBClassItemName[removeitem.length] = null;
        this.QBCustomerItemName[removeitem.length] = null;
        this.CategoryTotal();
      }
      this.disableCategoryAddBtn = true;
    } else if (type == 'expense') {
      const removeitem = this.getExpenseFormControl();
      if (removeitem.length > 1) {
        removeitem.removeAt(removeitem.length - 1);
        this.QBDExpenseItemName[removeitem.length] = null;
        this.QBDClassItemName[removeitem.length] = null;
        this.QBDCustomerItemName[removeitem.length] = null;
        this.ExpenseTotal();
      }
      this.disableExpenseAddBtn = true;
    } else if (type === 'netsuite') {
      const netSuiteForm = this.getNetSuiteFormControl();
      if (netSuiteForm.length > 1) {
        netSuiteForm.removeAt(netSuiteForm.length - 1);
        this.updateNetSuiteExpenseTotal();
      }
    } else {
      const removeitem = this.getRemittanceFormControl();
      if (removeitem.length > 1) removeitem.removeAt(removeitem.length - 1);

      if (this.getRemittanceFormControl().controls.length < 10) {
        this.disableRemitAddBtn = true;
      }
    }
  }

  removeSelectedRow(i: number, type: string) {
    if (type == 'category') {
      const removeitem = this.getCategoryFormControl();
      if (removeitem.length > 1) {
        removeitem.removeAt(i);
        this.QBCategoryItemName.splice(i, 1);
        this.QBClassItemName.splice(i, 1);
        this.QBCustomerItemName.splice(i, 1);
        this.isCategorySaved = false;
        this.disableCategoryAddBtn = true;
      }

      this.CategoryTotal();
    } else if (type == 'expense') {
      const removeitem = this.getExpenseFormControl();
      if (removeitem.length > 1) {
        removeitem.removeAt(i);
        this.QBDExpenseItemName.splice(i, 1);
        this.QBDClassItemName.splice(i, 1);
        this.QBDCustomerItemName.splice(i, 1);
        this.isExpenseSaved = false;
        this.disableExpenseAddBtn = true;
      }
    } else if (type === 'netsuite') {
      const netSuiteForm = this.getNetSuiteFormControl();
      if (netSuiteForm.length > 1) {
        netSuiteForm.removeAt(i);
        this.isNetSuiteSaved = false;
      }
    } else {
      const removeitem = this.getRemittanceFormControl();
      if (removeitem.length > 1) {
        removeitem.removeAt(i);
        this.isRemittanceSaved = false;
        this.disableRemitAddBtn = true;
      }
    }
  }

  clearAllRow(type: string) {
    const alert = this.openConfirmAlert(
      'Are you sure you want to clear all data?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        if (type == 'category') {
          const removeitem = this.getCategoryFormControl();
          removeitem.reset();
          this.categoryTotal = 0;
          this.QBCategoryItemName = [];
          this.QBClassItemName = [];
          this.QBCustomerItemName = [];
          this.isCategorySaved = false;
        } else if (type == 'expense') {
          const removeitem = this.getExpenseFormControl();
          removeitem.reset();
          this.expenseTotal = 0;
          this.QBDExpenseItemName = [];
          this.QBDClassItemName = [];
          this.QBDCustomerItemName = [];
          this.isExpenseSaved = false;
        } else if (type === 'netsuite') {
          const netSuiteForm = this.getNetSuiteFormControl();
          netSuiteForm.reset();
          this.netSuiteTotal = 0;
          this.isNetSuiteSaved = false;
        } else {
          const removeitem = this.getRemittanceFormControl();
          removeitem.reset();
          this.grandTotal = 0;
          this.isRemittanceSaved = false;
        }
      }
    });
  }

  insertRemiValueToCheck(): void {
    const insertTotal =
      this.newTableFormatEnabled === 'true'
        ? this.paymentTotal
        : this.grandTotal;
    if (insertTotal > 100000000) {
      this.openWarningAlert(
        'The check amount must be between 0 and 100000000.'
      );
      return;
    }

    this.setCheckFormValue(
      'checkAmount',
      this.isAmountChecked ? 0 : insertTotal
    );
    this.isRemittence = !this.isRemittence;
  }

  total(i: number) {
    const formGroup = this.getRemittanceFormControl().controls[
      i
    ] as UntypedFormGroup;
    const quantity = Number(formGroup.get('itemQuantity')?.value);
    const unitCost = Number(formGroup.get('itemUnitCost')?.value);
    const gross = Number(formGroup.get('grossAmount')?.value);
    const discount = Number(formGroup.get('discountAmount')?.value);

    const totalSingleRow = quantity * unitCost;
    const netAmount = gross - discount;

    if (!isNaN(totalSingleRow)) {
      // Avoid NaN of field
      formGroup.get('totalSingleRow')?.setValue(totalSingleRow);
    } else {
      formGroup.get('totalSingleRow')?.setValue(0.0);
    }
    if (!isNaN(netAmount) && netAmount > 0) {
      formGroup.get('netAmount')?.setValue(netAmount);
      formGroup.get('thisPayment')?.setValue(netAmount);
    } else {
      formGroup.get('netAmount')?.setValue(0.0);
      formGroup.get('thisPayment')?.setValue(0.0);
    }
  }

  get getGrandTotal() {
    return this.checkForm.get('remittance') as UntypedFormArray;
  }

  setCheckDate(): void {
    const newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.setCheckFormValue('checkDate', newDate);
  }

  getRemittanceFormControl(): UntypedFormArray {
    return this.checkForm.get('remittance') as UntypedFormArray;
  }

  getCategoryFormControl(): UntypedFormArray {
    return this.checkForm.get('categoryDetails') as UntypedFormArray;
  }

  getExpenseFormControl(): UntypedFormArray {
    return this.checkForm.get('expenseDetails') as UntypedFormArray;
  }

  getNetSuiteFormControl(): FormArray {
    return this.checkForm.get('netsuiteExpenseDetails') as FormArray;
  }

  showRemittence(): void {
    this.isRemittence = !this.isRemittence;
    this.isCategory = false;
    this.isExpense = false;
  }

  // ------------->Remittance Item Drop Down-------------------------

  onScrollItems() {
    this.page++;
    this.subscriptions.push(
      this.checkService
        .getCheckRemiitanceItems(this.page, '')
        .subscribe((res) => {
          const that = this;
          res.data.items.forEach((element: string) => {
            that.remittanceItem.push(element);
          });
        })
    );
  }

  onSearchItems(event: any) {
    const searchTerm = event.target.value;
    this.subscriptions.push(
      this.checkService
        .getCheckRemiitanceItems(this.page, searchTerm)
        .subscribe((res) => {
          this.remittanceItem = res.data.items;
        })
    );
  }

  numberOnly(event: any): any {
    const charCode = event.which ? event.which : event.keyCode;
    if (
      charCode != 45 &&
      charCode > 31 &&
      (charCode < 48 || charCode > 57) &&
      charCode != 46
    ) {
      return false;
    }
    return true;
  }

  isNumeric(num: string | number) {
    return /^-?[0-9]+(?:\.[0-9]+)?$/.test(`${num}`);
  }

  addStyleCursorNoDrop(inputType: string) {
    let inputField: NodeListOf<HTMLInputElement>;

    if (inputType == 'input') {
      inputField = document.querySelectorAll('.single_input .input_style');
    } else {
      inputField = document.querySelectorAll('.single_input .drop_style');
    }
    inputField.forEach((item) => {
      if (item.classList.contains('disable_field')) {
        item.parentElement!.style.cursor = 'no-drop';
      }
    });
  }

  setCheckFormValue(name: string, value: any) {
    return this.checkForm.get(name)?.setValue(value);
  }

  getCheckFormValue() {
    return this.checkForm.value;
  }

  navigateByUrl(url: string) {
    this.router.navigateByUrl(url);
  }

  querySelector(element: string) {
    return document.querySelector(element) as HTMLInputElement;
  }

  payeeEmailRequired(payeeDetails: any) {
    const response = this.openWarningAlert('Please add email address to payee');
    response.afterClosed().subscribe((res) => {
      if (res) {
        this.addEmailToPayee(payeeDetails);
      }
    });
  }

  addEmailToPayee(payeeDetails: any) {
    this.selectedPayee = undefined;
    this.payeeId = null;
    const dialog = this.dialog.open(AddEmailPayeeModalComponent, {
      disableClose: true,
      data: { ...payeeDetails, heading: 'Add email to payee' },
      width: '550px'
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) this.afterPayeeSelected(payeeDetails);
      else this.sharedService.setNewPayeeCreatedData(null);
    });
  }

  openPayeeModal(
    selectedItem?: { [key: string]: string } | string,
    editMode?: boolean
  ) {
    if (!editMode) {
      this.subscriptions.push(
        this.payeeModalService
          .openAddPayee('addPayeeModal')
          .subscribe((payeeModal) => {
            if (payeeModal) {
              this.subscriptions.push(
                payeeModal.afterClosed().subscribe((res) => {
                  if (res?.success) {
                    this.sharedService.setNewPayeeCreatedData({
                      payeeId: res.id
                    });
                    this.setCheckFormValue('payee', res.id);
                    this.payeeId = res.id;
                    setTimeout(() => {
                      this.payeeDropDownChange(res);
                    }, 1000);
                  }
                })
              );
            }
          })
      );
    } else {
      this.subscriptions.push(
        this.payeeModalService
          .openEditPayee(selectedItem as string, 'addPayeeModal', {
            edit: editMode,
            id: selectedItem as string
          })
          .subscribe((payeeModal) => {
            if (payeeModal) {
              this.subscriptions.push(
                payeeModal.afterClosed().subscribe((res) => {
                  if (res?.success) {
                    this.sharedService.setNewPayeeCreatedData({
                      payeeId: res.id
                    });
                    this.setCheckFormValue('payee', res.id);
                    this.payeeId = res.id;
                    setTimeout(() => {
                      this.payeeDropDownChange(res);
                    }, 1000);
                  }
                })
              );
            }
          })
      );
    }
  }

  clearPayeeSelection() {
    this.selectedPayee = undefined;
    this.payeePhone = '';
  }

  openBankAccModal() {
    if(this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              
              if (result?.success) {
                  this.sharedService.setNewBankCreatedData({
                    bankAccountId: result.id
                  });
                  this.checkForm.controls.bankAccount.setValue(result.id);
                  this.setCheckFormValue('check_no', result?.check_no);
              }
            })
          );
        }
      })
    );
  }

  addNewCreditCard() {
    if (this.isNotVerified) {
      this.router.navigate(['/manage/users/verify-email-phone']);
      return;
    }

    if(this.openAddCardService.isLoading()) return;
    const sub = this.openAddCardService
      .openAddCard()
      .subscribe((cardModal) => {
        if(cardModal){
          cardModal
          .afterClosed()
          .subscribe((res) => {
            if (res && res.success) {
              this.creditCardList.push(res.data.metaData);
              this.selectedCreditCard = res.data.metaData;
              this.selectedCreditCardName = res.data.metaData.cardId;
              if (this.selectedCreditCard) {
                this.loadRequiredLabel(false);
              } else {
                this.loadRequiredLabel(true);
              }
              this.getExistingCreditCards();
              this.alertService.successAlert({ content: res.data.message });
            } else if (res?.cardCreated) {
              // Backed out of "Confirm Card": the card exists (unconfirmed).
              this.getExistingCreditCards();
            }
          });
        }
      });
    this.subscriptions.push(sub);
  }

  /**
   * @description Checks the user verification status and updates the `isNotVerified` property accordingly.
   */
  isUserVerified() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isNotVerified =
          res.email_verified === 0 || res.phone_verified === 0;
      })
    );
  }

  addBankAccountToPayeeModal(): void {
    const dialog = this.dialog.open(AddPayeeBankModalComponent, {
      width: '600px',
      data: { payeeId: this.payeeId, editMode: false }
    });
    dialog.afterClosed().subscribe((r) => {
      if (r) {
        this.openSuccessAlert('Bank account created');
        this.getPayeeBankAccounts(this.payeeId!);
      }
    });
  }

  editBankAccountToPayeeModal(): void {
    this.selectedPayeeBank.editMode = true;
    this.selectedPayeeBank.payeeId = this.payeeId;
    const dialog = this.dialog.open(AddPayeeBankModalComponent, {
      width: '600px',
      data: this.selectedPayeeBank
    });

    dialog.afterClosed().subscribe((r) => {
      if (r) {
        this.openSuccessAlert('Bank account updated');
        this.getPayeeBankAccounts(this.payeeId!);
      }
    });
  }

  openCalculator(): void {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: {addAmountButton : true}
    });

    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.setCheckFormValue('checkAmount', calculatedValue);
      }
    });
  }

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
        this.checkForm.controls.category.setValue(res.id);
      }
    });
  }

  openAttachment(): void {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        id: !this.editMode ? 0 : this.checkId,
        existingData: this.createdExistingAttachments,
        billId: this.billId
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.createdExistingAttachments = res.existingData;
      }
    });
  }

  openComments(): void {
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: {
        id: !this.editMode ? 0 : this.checkId,
        existingData: this.createdExistingComments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) this.createdExistingComments = res.existingData;
    });
  }

  openBlankCheckModal(): void {
    this.dialog.open(BlankCheckModalComponent, {
      maxWidth: '450px',
      width: '93%',
      autoFocus: false
    });
  }

  goToMultipleCheck(): void {
    this.navigateByUrl('/manage/cheque/multiplecheck/create');
  }

  goToGroupCheck(): void {
    this.navigateByUrl('/manage/cheque/group/index');
  }

  openImportCheckModal(): void {
    this.navigateByUrl('/manage/cheque/multi_import/step1');
  }

  //= ==> Remove skelton loader
  removeLoadedSkelton() {
    const main_common_module: NodeListOf<HTMLElement> =
      document.querySelectorAll('.main_common_module .skelton')!;
    main_common_module.forEach((item) => item.classList.remove('skelton'));
  }

  //= ===> Alerts
  openConfirmAlert(content: string, title?: string) {
    const data: IConfirmAlert = {
      title: title || 'Confirm',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  openSuccessAlert(content?: string, _disable?: boolean, timeout?: number) {
    const data: ISuccessAlert = {
      title: 'Success!',
      content: content || 'Check created.',
      close: true,
      timeout: timeout || 2000
    };
    return this.alertService.successAlert(data);
  }

  openWarningAlert(content: string, doneMsg = 'OK') {
    return this.alertService.warningAlert({ content, doneMsg });
  }

  openInfoAlert(content: string) {
    return this.alertService.infoAlert({ content });
  }

  //= ========check user verified or not
  checkUserVerification() {
    this.subscriptions.push(
      this.userService.UserVerification$.subscribe((res) => {
        this.userVerification = res;
        if (res.email_verified == 0 || res.phone_verified == 0) {
          this.isNotVerfied = true;
        } else {
          this.isNotVerfied = false;
        }
      })
    );
  }

  //= ======== QuickBooks online  Push Back

  isPushBackEnable() {
    this.subscriptions.push(
      this.checkService.isPushBackEnable().subscribe((res) => {
        if (res.data.showWarning) {
          this.ShowWarningForCategory = true;
        }
        if (!res?.data?.isPushBackEnabledInSua) {
          this.isPushBackExportBtn = true;
        }
        if (res.data.isPushBackEnabled && res.data.isQucikBookConnected) {
          this.isPushBack = true;
          this.isCategory = true;
        }
        if (res.data.isLocationEnabled) {
          this.isLocation = true;
        }
      })
    );
  }

  showCategory() {
    this.isCategory = !this.isCategory;
    this.isRemittence = false;
  }

  showExpense() {
    this.isExpense = !this.isExpense;
    this.isRemittence = false;
  }

  showNetSuite() {
    this.isShowNetSuite = !this.isShowNetSuite;
    this.isRemittence = false;
    if(!this.isShowNetSuite){
      this.isNetSuiteSaved = false;
    }
  }

  //  QuickBooks Bank Accounts

  OnItemChangeQBBank(event: any) {
    this.checkForm.controls.mappingId.setValue(event);
  }

  getQBBankAccount(realmId: string) {
    this.subscriptions.push(
      this.checkService
        .GetQBBankAccount(realmId, this.checkForm.value.bankAccount)
        .subscribe((res: any) => {
          this.QBBankAccounts = res.data;
        })
    );
  }

  onScrollItemsQBBank() {
    this.bankPage++;
    this.subscriptions.push(
      this.checkService
        .GetQBBankAccountPaination(
          this.realmid,
          this.checkForm.value.bankAccount,
          this.bankPage,
          ''
        )
        .subscribe((res) => {
          const that = this;
          res.data.forEach((element: any) => {
            that.QBBankAccounts.push(element);
          });
        })
    );
  }

  onSearchItemsQBBank(event: any) {
    const searchTerm = event.target.value;
    this.subscriptions.push(
      this.checkService
        .GetQBBankAccountPaination(
          this.realmid,
          this.checkForm.value.bankAccount,
          this.bankPage,
          searchTerm
        )
        .subscribe((res) => {
          this.QBBankAccounts = res.data;
        })
    );
  }

  // QuickBooks Company

  getCompany(id: string) {
    this.subscriptions.push(
      this.checkService.getCompanies(id).subscribe((res: any) => {
        this.checkForm.controls.realmId.setValue(res.data.realmId);
        this.checkForm.controls.mappingId.setValue(res.data.qbBankId);
        this.QBCompanyName = res.data.companyName;
        this.QBBankAccountName = res.data.qbBankName;

        this.OnItemChangeQB(res.data.realmId);
        this.companies = res.data;
        if(!res.data.realmId){
          this.checkForm.controls.locationId.setValue(null);
        }
        if(this.companies.classMappingId){
          this.QBClassItemName[0] = this.companies.classMappingId;
        }
      })
    );
  }

  /**
   * @description Retrieves the locations for a specific realm ID.
   */
  getLocations() {
    this.subscriptions.push(
      this.checkService.getLocations(this.realmid).subscribe((res) => {
        this.QBLocation = res.data;
        if (res.data.length)
          if(this.companies.locationMappingId){
            this.checkForm.controls.locationId.setValue(this.companies.locationMappingId);
          }else{
            this.checkForm.controls.locationId.setValue(res.data[0].id);
          }
      })
    );
  }

  OnItemChangeQB(event: any) {
    if (event) {
      this.realmid = event;
      // this.clear('');
      this.getQBBankAccount(event);
      this.getLocations();
      const category = {
        id:this.selectedPayeeCategory?.id as string,
        name:this.selectedPayeeCategory?.name as string
      };
      if(this.realmid && this.selectedPayeeCategory?.id){
        this.autoSelectQBCategory(category);
      }
      this.types.forEach((el: any) => {
        this.subscriptions.push(
          this.checkService
            .GetCompanyDetails(el, event)
            .subscribe((res: any) => {
              if (res.success) {
                if (el == 'category-items') {
                  this.QBCategoryItem = res.data;
                } else if (el == 'customers') {
                  this.QBCustomerItem = res.data;
                } else {
                  this.QBClassItem = res.data;
                }
              }
            })
        );
      });
    }
  }

  onScrollItemsQB() {
    this.companyPage++;
    this.subscriptions.push(
      this.checkService
        .getCompany(this.companyPage, '', this.checkForm.value.bankAccount)
        .subscribe((res) => {
          this.companies = res.data;
        })
    );
  }

  onSearchItemsQB(event: any) {
    const searchTerm = event.target.value;
    this.subscriptions.push(
      this.checkService
        .getCompany(
          this.companyPage,
          searchTerm,
          this.checkForm.value.bankAccount
        )
        .subscribe((res) => {
          this.companies = res.data;
        })
    );
  }

  // pagination & search of categor , customer & class

  OnItemChangeCategoryDetails(event: any, i: number) {
    const invoice_type = this.getFormControls(
      'categoryDetails'
    ) as UntypedFormArray;
    const formGrp = invoice_type.controls[i] as UntypedFormGroup;
    formGrp.get('categoryId')?.setValue(event || null);
  }

  OnItemChangeCustomerDetails(event: any, i: number) {
    const invoice_type = this.getFormControls(
      'categoryDetails'
    ) as UntypedFormArray;
    const formGrp = invoice_type.controls[i] as UntypedFormGroup;
    formGrp.get('customerId')?.setValue(event || null);
  }

  OnItemChangeClassDetails(event: any, i: number) {
    const invoice_type = this.getFormControls(
      'categoryDetails'
    ) as UntypedFormArray;
    const formGrp = invoice_type.controls[i] as UntypedFormGroup;
    formGrp.get('classId')?.setValue(event || null);
  }

  onScrollCompanyDetails(type: string) {
    let page = 0;
    const searchTerm = '';

    if (type == 'customers') {
      page = this.customerPage;
    } else if (type == 'category-items') {
      page = this.categoryPage;
    } else {
      page = this.classPage;
    }

    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination(type, this.realmid, page, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element: any) => {
              if (type == 'customers') {
                this.QBCustomerItem.push(element);
              } else if (type == 'category-items') {
                this.QBCategoryItem.push(element);
              } else {
                this.QBClassItem.push(element);
              }
            });

            if (type == 'customers') {
              this.customerPage++;
            } else if (type == 'category-items') {
              this.categoryPage++;
            } else {
              this.classPage++;
            }
          }
        })
    );
  }

  onSearchItemsCompanyDetails(event: any, type: string) {
    const searchTerm = event.target.value;
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination(type, this.realmid, this.page, searchTerm)
        .subscribe((res) => {
          if (type == 'customers') {
            this.QBCustomerItem = res.data;
          } else if (type == 'category-items') {
            this.QBCategoryItem = res.data;
          } else {
            this.QBClassItem = res.data;
          }
        })
    );
  }

  // save category

  onSaveCategory(): void {
    if (this.checkForm.value.realmId) {
      if (this.checkForm.value.mappingId == '') {
        this.openWarningAlert('The QuickBooks Bank field is required');
        return;
      }
    }

    for (let i = 0; i <= this.getCategoryFormControl().value.length; i++) {
      if (
        this.getCategoryFormControl().value[i]?.categoryId &&
        (this.getCategoryFormControl().value[i]?.amount == null ||
          this.getCategoryFormControl().value[i]?.amount == '')
      ) {
        this.openWarningAlert(`The amount field is required in row ${i + 1}`);
        return;
      }
      if (
        this.getCategoryFormControl().value[i]?.categoryId == null &&
        this.getCategoryFormControl().value[i]?.amount
      ) {
        this.openWarningAlert(`The category field is required in row ${i + 1}`);
        return;
      }
    }

    if (this.categoryTotal == 0 || !this.categoryTotal) {
      this.isCategorySaved = false;
    } else {
      this.isCategorySaved = true;
      if (this.categoryTotal > 100000000 || this.categoryTotal <= 0) {
        this.openWarningAlert(
          'The check amount must be between 0 and 100000000.'
        );
        return;
      }

      this.setCheckFormValue('checkAmount', this.categoryTotal);
    }

    this.isCategory = !this.isCategory;
  }

  // CategoryTotal

  CategoryTotal() {
    this.categoryTotal = 0;
    this.getCategoryFormControl().value.forEach((ele: any) => {
      this.categoryTotal += Number(ele.amount);
    });
  }

  validateInput(event: Event) {
    const { value } = event.target as HTMLInputElement;
    if (value.startsWith('-00')) {
      (event.target as HTMLInputElement).value = value.slice(0, -1);
    }
  }

  ExpenseTotal() {
    this.expenseTotal = 0;
    this.getExpenseFormControl().value.forEach((ele: any) => {
      this.expenseTotal += Number(ele.amount);
    });
  }

  // clear all company datas

  clear(mode: string) {
    if (mode == 'bank') {
      this.checkForm.controls.mappingId.setValue('');
    } else if (mode == 'ocwBank') {
      this.QBCompanyName = null;
      this.clearQBDatas();
      this.clearQBDDatas();
      this.clearNetSuite();
      this.checkForm.controls.realmId.setValue('');
    } else {
      this.clearQBDatas();
    }
  }

  loadControlErrors(): void {
    const controls = Object.keys(this.checkForm.controls);
    for (const c of controls) {
      this.controlErrors.required[c] = Utils.isRequiredControl(
        this.checkForm,
        c
      );
    }
  }

  clearQBDatas() {
    this.QBBankAccountName = null;
    this.QBCategoryItemName = [];
    this.QBClassItemName = [];
    this.QBCustomerItemName = [];
    this.QBCategoryItem = [];
    this.QBClassItem = [];
    this.QBCustomerItem = [];
    this.QBBankAccounts = [];

    const removeitem = this.getCategoryFormControl();
    removeitem.reset();
    this.categoryTotal = 0;
    this.checkForm.controls.mappingId.setValue('');
    this.isCategorySaved = false;
  }

  clearQBDDatas() {
    this.QBDCompanyName = null;
    this.QBDBankAccountName = null;
    this.QBDExpenseItem = [];
    this.QBDClassItem = [];
    this.QBDcustomersItem = [];
    this.QBDExpenseItemName = [];
    this.QBDClassItemName = [];
    this.QBDCustomerItemName = [];
    this.isExpenseSaved = false;
    this.disableExpenseAddBtn = true;
    this.expenseTotal = 0;
    const removeitem = this.getExpenseFormControl();
    removeitem.reset();
    this.checkForm.controls.companyId.setValue('');
    this.checkForm.controls.qbBankId.setValue('');
  }

  clearNetSuite() {
    this.netSuiteBankName = undefined;
    this.netSuiteBankId = undefined;
    this.netSuiteClass = [];
    this.netSuitePayee = [];
    this.netSuiteExpense = [];
    this.netSuiteTotal = 0;
    const netsuiteForm = this.getNetSuiteFormControl();
    netsuiteForm.reset();
    this.isNetSuiteSaved = false;
    this.checkForm.controls.netsuiteBankId.setValue('');
  }

  //= ======== End QuickBooks online  Push Back
  //= ======== QuickBooks Desktop  Push Back

  isQBDPushBackEnable() {
    this.subscriptions.push(
      this.checkService.isQBDPushBackEnable().subscribe((res) => {
        if (!res.data.isPushBackEnabledInSua) {
          this.isPushBackQBDExportBtn = true;
        }
        if (
          res.data.isPushBackEnabled &&
          res.data.isQucikBookDesktopConnected
        ) {
          this.isQBDPushback = true;
          this.isExpense = true;
        }
      })
    );
  }

  isNetSuiteEnable(): void {
    this.subscriptions.push(
      this.checkService.isNetSuitePushBackEnable().subscribe((res) => {
        if (!res.data.isPushBackEnabledInSua) {
          this.isEnableNetSuiteExport = false;
          this.isShowNetSuite = false;
        }
        if (
          res.data.isNetsuiteConnected &&
          res.data.isPushBackEnabled &&
          res.data.isPushBackEnabledInSua
        ) {
          this.isNetSuitePushBackEnable = true;
          this.isShowNetSuite = true;
          this.amountChanges();
        }

        if (res.data.isNetsuiteConnected) {
          this.isNetSuiteConnected = true;
        }
      })
    );
  }

  getQBDCompany(bankId: string) {
    this.subscriptions.push(
      this.checkService.getQBDCompanies(bankId).subscribe((res) => {
        this.checkForm.controls.companyId.setValue(res.data.companyId);
        this.checkForm.controls.qbBankId.setValue(res.data.qbBankId);
        this.QBDCompanyName = res.data.companyName;
        this.QBDBankAccountName = res.data.qbBankName;
        this.QBDExpenseItem = res.data.expenses;
        this.QBDcustomersItem = res.data.customers;
        this.QBDClassItem = res.data.classes;

        // this.OnItemChangeQB(res.data.realmId);
        // this.companies = res.data;
      })
    );
  }

  OnQBDItemChangeExpenseDetails(event: string, i: number) {
    const invoice_type = this.getFormControls(
      'expenseDetails'
    ) as UntypedFormArray;
    const formGrp = invoice_type.controls[i] as UntypedFormGroup;
    formGrp.get('expenseId')?.setValue(event || null);
  }

  OnQBDItemChangeCustomerDetails(event: string, i: number) {
    const invoice_type = this.getFormControls(
      'expenseDetails'
    ) as UntypedFormArray;
    const formGrp = invoice_type.controls[i] as UntypedFormGroup;
    formGrp.get('customerId')?.setValue(event || null);
  }

  OnQBDItemChangeClassDetails(event: string, i: number) {
    const invoice_type = this.getFormControls(
      'expenseDetails'
    ) as UntypedFormArray;
    const formGrp = invoice_type.controls[i] as UntypedFormGroup;
    formGrp.get('classId')?.setValue(event || null);
  }

  onQBDScrollCompanyDetails(type: string) {
    let page = 0;
    const searchTerm = '';
    const { companyId } = this.checkForm.value;

    if (type == 'customers') {
      page = this.qbdcustomerPage;
    } else if (type == 'expense-items') {
      page = this.qbdexpensePage;
    } else {
      page = this.qbdclassPage;
    }

    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, page, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              if (type == 'customers') {
                this.QBDcustomersItem.push(element);
              } else if (type == 'expense-items') {
                this.QBDExpenseItem.push(element);
              } else {
                this.QBDClassItem.push(element);
              }
            });

            if (type == 'customers') {
              this.qbdcustomerPage++;
            } else if (type == 'expense-items') {
              this.qbdexpensePage++;
            } else {
              this.qbdclassPage++;
            }
          }
        })
    );
  }

  onQBDSearchItemsCompanyDetails(event: any, type: string) {
    const searchTerm = event.target.value;
    const { companyId } = this.checkForm.value;
    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, this.page, searchTerm)
        .subscribe((res) => {
          if (type == 'customers') {
            this.QBDcustomersItem = res.data;
          } else if (type == 'expense-items') {
            this.QBDExpenseItem = res.data;
          } else {
            this.QBDClassItem = res.data;
          }
        })
    );
  }

  onSaveExpense(): void {
    if (this.checkForm.value.companyId) {
      if (this.checkForm.value.qbBankId == '') {
        this.openWarningAlert('The QuickBooks Bank field is required');
        return;
      }
    }

    for (let i = 0; i <= this.getExpenseFormControl().value.length; i++) {
      if (
        this.getExpenseFormControl().value[i]?.expenseId &&
        (this.getExpenseFormControl().value[i]?.amount == null ||
          this.getExpenseFormControl().value[i]?.amount == '')
      ) {
        this.openWarningAlert(`The amount field is required in row ${i + 1}`);
        return;
      }
      if (
        this.getExpenseFormControl().value[i]?.expenseId == null &&
        this.getExpenseFormControl().value[i]?.amount
      ) {
        this.openWarningAlert(`The Expense field is required in row ${i + 1}`);
        return;
      }
    }

    if (this.expenseTotal == 0 || !this.expenseTotal) {
      this.isExpenseSaved = false;
    } else {
      this.isExpenseSaved = true;
      if (this.expenseTotal > 100000000) {
        this.openWarningAlert(
          'The check amount must be between 0 and 100000000.'
        );
        return;
      }
      this.setCheckFormValue('checkAmount', this.expenseTotal);
    }
    this.isExpense = !this.isExpense;
  }

  clearProcessWithoutDetails(): void {
    const inputAmount = this.querySelector('#disable_amount');
    const inputPayee = this.querySelector('#disable_payee');
    const inputDate = this.querySelector('#disable_date');
    const boxAmount = this.querySelector('#amount');
    const boxSign = this.querySelector('#sign');
    const boxPayee = this.querySelector('#payee');
    const boxDate = this.querySelector('#date');

    this.isAmountChecked = false;
    this.isSignChecked = false;
    this.isPayeeChecked = false;
    this.isDateChecked = false;

    inputAmount.checked = false;
    inputDate.checked = false;
    inputPayee.checked = false;

    boxAmount.checked = false;
    boxSign.checked = false;
    boxPayee.checked = false;
    boxDate.checked = false;

    inputAmount.classList.remove('disable_field');
    this.addStyleCursorNoDrop('dropdown');
    inputPayee.classList.remove('disable_field');
    this.addStyleCursorNoDrop('dropdown');
    inputDate.classList.remove('disable_field');
    this.addStyleCursorNoDrop('dropdown');
  }

  loadRequiredLabel(isShow: boolean): void {
    const selectEl = document.querySelectorAll(
      `#drop_down_card_select .ng-select-container .ng-value-container .ng-placeholder`
    );
    if (isShow) selectEl[0]?.classList.add('drop_down_required_star');
    else selectEl[0]?.classList.remove('drop_down_required_star');
  }

  loadCustomElements() {
    if (!this.editMode) {
      this.subscriptions.push(
        this.checkDesignService.getCustomElements().subscribe((res: any) => {
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
  }

  getCustomElementsValue() {
    const checkData = this.selectedCheckData;
    this.custom_elements = Object.keys(checkData.customElements).map(
      (key, index) => ({ id: index + 1, custom_element: key })
    );
    if (Object.keys(checkData.customElements).length !== 0) {
      this.customFieldFlag = true;
    }
    this.customElementGroup = Object.keys(checkData.customElements).map(
      (key) => ({ [key]: checkData.customElements[key] })
    );
  }

  toggleFormat() {
    this.newTableFormatEnabled =
      this.newTableFormatEnabled === 'false' ? 'true' : 'false';
  }

  openExportCheckEnableInfo() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  initUpdateNetSuite() {
    const netSuiteForm = this.getNetSuiteFormControl();
    netSuiteForm.clear();
    this.selectedCheckData.netsuiteDetails.forEach(
      (ele: IExpenseDetails2, i: number) => {
        netSuiteForm.push(this.netSuiteFormBody());
        this.getNetSuiteFormControl()
          ?.at(i)
          ?.setValue({
            amount: ele.amount ?? '',
            classId: ele.classId,
            customerId: ele.customerId,
            locationId: ele.locationId,
            description: ele.description ?? '',
            expenseId: ele.expenseId
          });
      }
    );
  }

  getNetSuiteBank(bankId: string): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteBank(bankId)
        .subscribe((res) => {
          if (res.success) {
            this.netSuiteBankName = res.data.netsuiteBankName;
            this.netSuiteBankId = res.data.netsuiteBankId;
            this.checkForm.controls.netsuiteBankId.setValue(
              this.netSuiteBankId
            );
            if (res.data.netsuiteBankId) {
              this.onNetSuiteDetails('expense-accounts', '');
              this.onNetSuiteDetails('classes', '');
              this.onNetSuiteDetails('payees', '');
              this.getNetSuiteLocations();
            }
          }
        })
    );
  }

  getNetSuiteLocations(): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteLocations()
        .subscribe((res) => {
          if (res.success) {
            this.netSuiteLocations = res.data;
          }
        })
    );
  }

  onNetSuiteDetails(
    type: 'expense-accounts' | 'classes' | 'payees',
    searchTerm: string
  ): void {
    this.netSuiteExpenseLoading.set(true);
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteExportDetails(type, searchTerm)
        .pipe(finalize(() => this.netSuiteExpenseLoading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            if (type === 'expense-accounts') {
              this.netSuiteExpense = res.data;
              this.autoUpdateNetsuiteCategory();
            } else if (type === 'payees') {
              this.netSuitePayee = res.data;
            } else {
              this.netSuiteClass = res.data;
            }
          }
        })
    );
  }

  onScrollNetSuiteDetails(
    type: 'expense-accounts' | 'classes' | 'payees'
  ): void {
    let page = 1;
    if (type === 'expense-accounts') {
      page = this.netSuiteExpensePage;
    } else if (type === 'classes') {
      page = this.netSuiteClassPage;
    } else {
      page = this.netSuitePayeePage;
    }

    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteExportDetails(type, '', page)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              if (type === 'expense-accounts') {
                this.netSuiteExpense.push(element);
              } else if (type === 'payees') {
                this.netSuitePayee.push(element);
              } else {
                this.netSuiteClass.push(element);
              }
            });
            if (type === 'expense-accounts') {
              this.netSuiteExpensePage += 1;
            } else if (type === 'classes') {
              this.netSuiteClassPage += 1;
            } else {
              this.netSuitePayeePage += 1;
            }
          }
        })
    );
  }

  updateNetSuiteExpenseTotal() {
    this.netSuiteTotal = 0;
    this.getNetSuiteFormControl().value.forEach((ele: { amount: any }) => {
      this.netSuiteTotal += Number(ele.amount);
    });
  }

  netSuiteSaveExpense(buttonType?:string) {
    this.updateNetSuiteExpenseTotal();
    if (this.netSuiteBankId) {
      if (this.netSuiteBankId === '') {
        this.openWarningAlert('The NetSuite Bank field is required');
        return;
      }
    }

    for (let i = 0; i <= this.getNetSuiteFormControl().value.length; i += 1) {
      if (
        this.getNetSuiteFormControl().value[i]?.expenseId &&
        (this.getNetSuiteFormControl().value[i]?.amount == null ||
          this.getNetSuiteFormControl().value[i]?.amount === '')
      ) {
        this.openWarningAlert(`The amount field is required in row ${i + 1}`);
        return;
      }
      if (
        this.getNetSuiteFormControl().value[i]?.expenseId == null &&
        this.getNetSuiteFormControl().value[i]?.amount
      ) {
        this.openWarningAlert(`The Expense field is required in row ${i + 1}`);
        return;
      }
    }
    if (this.netSuiteTotal === 0 || !this.netSuiteTotal) {
      this.isNetSuiteSaved = false;
    } else {
      this.isNetSuiteSaved = true;
      if (this.netSuiteTotal > 100000000) {
        this.isNetSuiteSaved = false;
        this.openWarningAlert(
          'The check amount must be between 0 and 100000000.'
        );
        return;
      }
      this.setCheckFormValue('checkAmount', this.netSuiteTotal);
    }
    if(buttonType){
      if (!this.editMode) this.onNewCheck(buttonType);
      else this.onUpdateCheck(buttonType);
    }
  }

  amountChanges() {    
    this.subscriptions.push(
      this.checkForm.controls.checkAmount?.valueChanges.subscribe((value) => {        
        const netSuiteFormArray = this.getNetSuiteFormControl();
        
        if (!netSuiteFormArray.at(1)?.get('expenseId')?.value && value) {
          netSuiteFormArray.at(0)?.patchValue({ amount: value });
        }
      })
    );
  }
  

  autoUpdateNetsuiteCategory(selectedCategory?:{ id: string; name: string }) {    
    if (!this.isWiygulEnterPrise)
      return;
    const netSuiteFormArray = this.getNetSuiteFormControl();
    const selectedCategoryId = selectedCategory?.id ?? this.checkForm.controls.category.value;
    if(!selectedCategoryId) {
      netSuiteFormArray.at(0)?.patchValue({ expenseId: null });
      return;
    }
    this.subscriptions.push(
      this.checkService
        .getNetsuiteExpense(selectedCategoryId as string)
        .subscribe((res) => {
          if (res.success && res.data) {
            const category = res.data;
            const categoryExists = this.netSuiteExpense.find(
              (existingCategory) => existingCategory?.id === category.id
            );

            if (!categoryExists) {
              this.netSuiteExpense = [...this.netSuiteExpense, category];
              netSuiteFormArray.at(0)?.patchValue({ expenseId: category?.id });

            }else{
              netSuiteFormArray.at(0)?.patchValue({ expenseId: categoryExists?.id });
            }

          }
        })
    );
  }

  closePayByCC() {
    this.creditCardToastShown = false;
  }

  payByCcClick() {
    /**
     * Removed this code for now as it is not used; after the industry type is required, redirect to the payment page.
     */

    // this.clickTrackingService.onTrackNow();
    // const item = this.paymentProcessLabels.find((el) => el.value === 'card');
    // if (!item) return;
    // const singleTabElm = <HTMLDivElement>(
    //   document.querySelector(`#singleTab_${item.value}`)
    // );
    // this.changePaymentType(singleTabElm, item);
    if(this.selectedCheckData){
      this.navigateToPaymentPage('card', this.selectedCheckData.uuid);
    }else{
      this.navigateToPaymentPage('card');
    }
    
  }

  navigateToPaymentPage(paymentType: 'card' | 'wallet', uuid?: string): void {
    let url = '';
    switch (paymentType) {
      case 'card':
        if(uuid){
          url = `manage/payments/main/edit/${uuid}`;
        }else{
          url = 'manage/payments/main/pay/card/ach';
        }
        break;
      case 'wallet':
        url = 'manage/payments/main/pay/wallet/ach';
        break;
      default:
        break;
    }
    this.router.navigateByUrl(url);
  }

  ngOnDestroy(): void {
    // Track when the credit card promoting toast is clicked and the no payment is done.
    this.clickTrackingService
      .ccToastClickedNoPaymentDone()
      ?.pipe(take(1))
      .subscribe();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
