import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  NavigationEnd,
  RouterLink
} from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, NgTemplateOutlet , Location, NgClass, CurrencyPipe } from '@angular/common';

import { Subscription, of, firstValueFrom } from 'rxjs';
import { delay, filter, finalize, take } from 'rxjs/operators';

import {
  IAcc,
  ICalcPaymentFeeRequest,
  IDebitCardDetails,
  IDefaultPayment,
  IPayAsItem,
  IPayFromItem,
  IPaymentConfig,
  IPaymentExportsOptions,
  IpayeeTypeDetails,
  IPaymentFeeDetailsItem,
  IPaymentSuccessData,
  IQBDExportsData,
  IQBOExportsData,
  IReceivePayItem,
  ISendPaymentContext,
  IPaymentFeeDetails,
  IFreshBookExportsData
} from 'src/app/modules/payments/model/payments';
import { DefaultPaymentV3Component } from 'src/app/modules/payments/shared/components/modals/default-payment-v3/default-payment-v3.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PaymentData } from 'src/app/modules/payments/shared/components/payments-main-v35/payments-data-v35';
import {
  IPayeeDetailsEvent,
  IPayeeEditedData,
  IPayeeModalData,
  IPayeeViewBank,
  IPayeeDropdown
} from 'src/app/modules/payee/payee-v2/model/payee';
import { NewInternationalAccountComponent } from 'src/app/modules/payee/payee-v2/modals/new-international-account/new-international-account.component';
import {
  IInternationalBankAccountRequest,
  IInternationalPayeeAccount
} from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IApiRes } from 'src/app/models/api';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { RaiseMyLimitModalComponent } from 'src/app/modules/payments/shared/components/modals/raise-my-limit-modal/raise-my-limit-modal.component';
import { BlankCheckModalComponent } from 'src/app/modules/check/components/create-blank-check-modal/blank-check-modal.component';
import { ScriptService } from 'src/app/core/services/script.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { Store } from '@ngrx/store';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { CloudListV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-list-v35.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { INetSuiteExportsData } from 'src/app/modules/integration/netsuite/model/netsuite';
import { environment } from 'src/environments/environment';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import {
  faArrowRight,
  faCircleQuestion,
  faCreditCard,
  faImage,
  faMicrophone,
  faPlay,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { IntroService } from 'src/app/modules/intro-tour/service/intro.service';
import { IntroTourButtonComponent } from 'src/app/modules/intro-tour/shared/intro-tour-button/intro-tour-button.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { ICountriesCache, IInternationalCountry } from 'src/app/models/wallet';
import { IPayeeModalResponse } from 'src/app/modules/intro-tour/pages/intro-payees/payeeModel';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { SuggestFeedbackComponent } from 'src/app/shared/modal/suggest-feedback/suggest-feedback.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { MaintenanceAlertModalComponent } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal.component';
import { AddRecipientModalComponent } from 'src/app/modules/international-payment/modal/add-recipient-modal/add-recipient-modal.component';
import { faCircleCheck } from '@fortawesome/pro-regular-svg-icons';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { RecieveEmailBankV3Component } from '../receive-payments/recieve-email-bank-v3/recieve-email-bank-v3.component';
import { ReceiveSmsBankV3Component } from '../receive-payments/receive-sms-bank-v3/receive-sms-bank-v3.component';
import { RecievePayerBankV3Component } from '../receive-payments/recieve-payer-bank-v3/recieve-payer-bank-v3.component';
import { QuickbooksExportCheckComponent } from '../others/quickbooks-export-check/quickbooks-export-check.component';
import { CloudWireV3Component } from '../Cloud/cloud-wire-v3/cloud-wire-v3.component';
import { CloudAchV3Component } from '../ACH/cloud-ach-v3/cloud-ach-v3.component';
import { CardCheckV3Component } from '../Check-Mail/card-check-v3/card-check-v3.component';
import { WalletCheckV3Component } from '../Check-Mail/wallet-check-v3/wallet-check-v3.component';
import { BankAccWireV3Component } from '../wire/bank-acc-wire-v3/bank-acc-wire-v3.component';
import { CardWireV3Component } from '../wire/card-wire-v3/card-wire-v3.component';
import { WalletWireV3Component } from '../wire/wallet-wire-v3/wallet-wire-v3.component';
import { CardsAchV3Component } from '../ACH/cards-ach-v3/cards-ach-v3.component';
import { BankAcAchV3Component } from '../ACH/bank-ac-ach-v3/bank-ac-ach-v3.component';
import { WalletAchV3Component } from '../ACH/wallet-ach-v3/wallet-ach-v3.component';
import { BankAcCheckComponent } from '../check/bank-ac-check/bank-ac-check.component';
import { PaymentSuccessComponent } from '../payment-success/payment-success.component';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { PayByCcToastComponent } from '../pay-by-cc-toast/pay-by-cc-toast.component';
import { WalletRtpComponent } from '../wire/wallet-rtp/wallet-rtp.component';
import { WalletInternationalComponent } from '../wire/wallet-international/wallet-international.component';
import { WalletVirtualCardRainV3Component } from '../virtual-card-rain/wallet-virtual-card-rain-v3/wallet-virtual-card-rain-v3.component';
import { WalletCheckPrintV3Component } from '../Check-Mail/wallet-check-print-v3/wallet-check-print-v3.component';
import { WalletCheckEmailComponent } from '../Check-Mail/wallet-check-mail/wallet-check-email.component';
import { SpeechToTextComponent } from '../../modal/speech-to-text/speech-to-text.component';
import { OpticalRecognitionModalComponent } from '../../modal/optical-recognition-modal/optical-recognition-modal.component';
import { PayeeCreationResult } from '../../services/speech-to-text.model';

/**
 * @description Payments main component.
 */
@Component({
  selector: 'app-payments-main-v35',
  templateUrl: './payments-main-v35.component.html',
  styleUrls: ['./payments-main-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonBackButtonV35Component,
    CommonButtonV35Component,
    MatTooltip,
    RouterLink,
    DemoVideoComponent,
    IntroTourButtonComponent,
    NgSelectModule,
    FormsModule,
    FaIconComponent,
    PaymentSuccessComponent,
    BankAcCheckComponent,
    WalletAchV3Component,
    BankAcAchV3Component,
    CardsAchV3Component,
    WalletWireV3Component,
    CardWireV3Component,
    BankAccWireV3Component,
    WalletCheckV3Component,
    CardCheckV3Component,
    CloudAchV3Component,
    CloudWireV3Component,
    QuickbooksExportCheckComponent,
    RecievePayerBankV3Component,
    ReceiveSmsBankV3Component,
    RecieveEmailBankV3Component,
    WhiteLabelPipe,
    CurrencyPipe,
    TruncatePipe,
    PayByCcToastComponent,
    WhiteLabelDirective,
    WalletRtpComponent,
    WalletInternationalComponent,
    WalletVirtualCardRainV3Component,
    WalletCheckPrintV3Component,
    WalletCheckEmailComponent,
    NgTemplateOutlet
  ]
})
export class PaymentsMainV35Component implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  public paymentsService = inject(PaymentsService);
  private bankAccountService = inject(BankAccountsService);
  private v3DataTableService = inject(V3DataTableService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private companyManagementService = inject(CompanyManagementService);
  private scriptService = inject(ScriptService);
  private psbService = inject(PsbService);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private sharedService = inject(SharedService);
  private location = inject(Location);
  private store = inject(Store);
  private paymentLinkService = inject(PaymentLinkService);
  public cloudListV35Service = inject(CloudListV35Service);
  private introService = inject(IntroService);
  private clickTrackingService = inject(ClickTrackingService);
  public env = environment;
  private personaHelperService = inject(PersonaHelperService);
  private userProfileService = inject(UserProfileService);
  private headerService = inject(HeaderService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private payeeModalService = inject(PayeeModalService);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);
  private bankModalService = inject(BankModalService);
  private gettingStartedService = inject(GettingStartedService);
  private datePipe = inject(DatePipe);

  private readonly COUNTRIES_BUSINESS_CACHE_KEY = 'international_countries_business_data';

  @Output() changePaymentConfigEvent = new EventEmitter<
    IPaymentConfig['mode']
  >();

  @Output() payeeDetailsOpen = new EventEmitter<{
    open: boolean;
    tabSwitch: boolean;
  }>();

  @Output() isKycDoneFromCard = new EventEmitter<{ success: boolean }>();

  @Output() paymentType = new EventEmitter<IPaymentConfig['type1']>();
  @Input() config: IPaymentConfig = { mode: 'CREATE' };
  @Input() isHomeNotificationsShown = {
    showMyRequests: true,
    newNotifications: true
  };

  @Input() isHomePage = false;
  childLoading = false;

  cardMaintenanceMessage = '';
  subscriptions: Subscription[] = [];
  customSwitch: 'RECEIVE' | 'PAY' = 'PAY';
  loading = false;
  payFromItems = this.getPayFromItems();
  isApprovalPolicyEnabled = signal(false);
  paymentDetailsStatus = signal<string | undefined>(undefined);

  /**
   * @description True when an already-approved payment is opened for editing
   * under an active approval policy. The payment has already passed approval,
   * so its details must not be modified.
   */
  isApprovedPaymentSkipUpdate= computed(
    () =>
      this.config?.mode === 'EDIT' &&
      (this.paymentDetailsStatus()?.toLowerCase() === 'approved' || this.isApprovalPolicyEnabled())
  );

  enablePaymentMethods = PaymentData.enablePaymentMethods('payment_home_page');
  selectedPayFromItem: IPayFromItem | undefined;
  selectedPayFromNgModel: IPayFromItem | undefined;
  payAsItems: IPayAsItem[] = [];
  selectedPayAsItem: IPayAsItem | undefined;
  selectedPayAsNgModel: IPayAsItem | undefined;
  defaultPayment: IDefaultPayment;
  receiveToItems = PaymentData.getReceiveToItems();
  selectedReceiveToItem: IReceivePayItem | undefined;
  selectedReceiveToNgModel: IReceivePayItem | undefined;
  receiveFromItems: IPayAsItem[] = [];
  selectedReceiveToZilBankItem = 'debit_pull';
  selectedReceiveFromItem: IPayAsItem | undefined;
  selectedReceiveFromNgModel: IPayAsItem | undefined;
  sendPaymentContext: ISendPaymentContext;
  isShowSuccess = false;
  isShowDetails = true;
  selectedPayeeBank: IPayeeViewBank;
  isSelectPayee = false;
  changedDetails: IPayeeEditedData | IPayeeDetailsEvent | undefined;
  bankDetailsArray: { key: string | undefined; value: string | undefined }[] =
    [];

  beneficiaryDetails: { key: string | undefined; value: string | undefined }[] =
    [];

  interBankDetails: { key: string | undefined; value: string | undefined }[] =
    [];

  interBeneficiaryDetails: {
    key: string | undefined;
    value: string | undefined;
  }[] = [];

  payeeAllData: IPayeeDetailsEvent;
  exportOptions: IPaymentExportsOptions;
  QBOExportData: IQBOExportsData;
  QBDExportData: IQBDExportsData;
  FreshBooksExportData: IFreshBookExportsData;
  netSuiteExportData: INetSuiteExportsData;
  successData: IPaymentSuccessData;
  selectedAccount: IAcc | undefined;
  disableMethods: string[] = [];
  editedPayeeData?: IPayeeModalData | IPayeeModalResponse;
  isUserToBeKybVerified = false;
  isShowPaymentDetail: boolean;
  isPaymentProcessing: boolean;
  isPermission = false;
  payMethode: string;
  showBankDetails = true;
  transactionFeatureCode: string;
  debitCardDetails: IDebitCardDetails | null;
  emitEditCardDetails = false;
  isClickDisabled = false;
  backUrl: string;
  payWithVendorCredit = signal(false);
  payeeCurrentBank: string | undefined;
  selectedNotificationBarTab: 'new' | 'details' = 'details';
  isAttachmentFeeLoading = signal(false);
  globalAttachmentFee = signal<number>(0);
  cloudToWireOptions: {
    id: string;
    label: string;
    fontAwesomeIconClass: string;
  }[] = [
    {
      id: 'domestic',
      label: 'Wire - Domestic',
      fontAwesomeIconClass: 'fa-solid fa-house'
    },
    {
      id: 'international',
      label: 'Wire - International',
      fontAwesomeIconClass: 'fa-solid fa-globe'
    }
  ];

  selectedReceiveToZilBankNgModel: IPayAsItem | undefined;

  paymentFeeDetails: IPaymentFeeDetailsItem = {
    isLoading: false,
    isError: false,
    isShow: false
  };

  isPaymentDisabled: { [key: string]: string | false } = {
    fromCreditCard: false
  };

  qrCodeLink: string;
  isScanQRCode = false;
  selectedBank: string;
  getPaymentId: string;
  isPrintQRCode = false;
  scaning = false;
  showCreditCardToast = true;

  faImage = faImage;
  faMicrophone = faMicrophone;
  faPlay = faPlay;
  faCreditCard = faCreditCard;
  faXmark = faXmark;
  showBanner = signal(false);
  showBannerForVerification = signal(true);
  isUserVerified = signal(true);
  userKycStatus = signal<number | undefined>(undefined);
  newUser = signal<number | undefined>(undefined);

  reduceMyFeeLoading = signal(false);
  isNetsuiteExportEnabled = signal(false);
  isItCardPayment = computed(
    () => this.paymentsService.currentPaymentMehtod()?.startsWith('CC') ?? false
  );
  checkStatusValue: number | null = null;

  isSubscribed = false;
  faCircleQuestion = faCircleQuestion;
  faArrowRight = faArrowRight;
  faCircleCheck = faCircleCheck;
  hasQboExportData = signal<boolean>(true);

  isInternationalPayment = false;
  internationalPaymentType: { business: boolean; personal: boolean } | null = null;

  isArcharina = environment.env_id === 'archarina' || environment.env_id === 'archarina-sandbox';

  ngOnInit(): void {
    this.payWithVendorCredit.set(history.state.payWithVendorCredit);
    this.checkStatusValue = Number(
      this.activatedRoute.snapshot.queryParams.checkStatus
    );
    this.customSwitch = this.activatedRoute.snapshot.queryParams.mode ?? 'PAY';
    this.configPayment();
    this.observeUserData();
    this.getCompanyChange();
    this.getCloudAccount();
    this.checkForPermission();
    this.paymentProcessingSubscription();
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
    if (this.router.url === '/manage/payments/main/pay/cloud/ach') {
      this.payeeService.fromCloudSendBtn.next(true);
    }
    this.subscriptions.push(
      this.payeeService.openPayeeEditModal.subscribe((res) => {
        if (res && typeof res === 'object' && res?.page) {
          // if pageId passed to open on modal.
          this.onPayeeEditClicked(res);
        } else if (res && typeof res === 'boolean') {
          // if res is boolean and value is true (instead of passing pageId)
          this.onPayeeEditClicked();
        }
      })
    );
    this.isUserAllowedToMakePayment();
    this.paymentType.emit(
      this.activatedRoute.snapshot.queryParams.mode ?? 'PAY'
    );
    this.subscriptions.push(
      this.paymentTypeAccessService.isDisabledPaymentSelected$.subscribe(
        (state) => {
          if (state === this.selectedPayAsNgModel?.id || state === this.selectedPayAsNgModel?.extraId) {
            if (this.customSwitch === 'PAY') {
              this.resetPaymentMethods('payAs');
            } else {
              this.resetPaymentMethods('payFrom');
            }
          }
        }
      )
    );
    this.subscriptions.push(
      this.paymentTypeAccessService.disabledMethods$.subscribe((state) => {
        if (state) this.disableMethods = state;
      })
    );
    this.listenForHeaderQuickNavigationChange();

    this.gettingStartedService.gettingStartedData$.subscribe((data) => {
      if (data) {
        this.isUserAllowedToMakePayment();
      }
    });

    this.checkAndFetchCountries();
  }

  onChildLoadingState(isLoading: boolean) {
    this.childLoading = isLoading;
  }

  /**
   * Checks if the user is allowed to make a payment based on their verification status.
   *
   * This method subscribes to the user verification status and updates the
   * 'isPaymentDisabled.fromCreditCard' property accordingly.
   *
   *  @example
   * // Usage example
   * yourInstance.isUserAllowedToMakePayment();
   */
  isUserAllowedToMakePayment() {
    const verificationStatus: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');
    this.userKycStatus.set(verificationStatus?.kycStatus);
    if (
      verificationStatus?.kycStatus === 3 ||
      verificationStatus?.kycStatus === 1
    ) {
      this.isPaymentDisabled.fromCreditCard = `${
        verificationStatus?.kycStatus === 3
          ? 'Your personal verification has failed,'
          : 'Your application for personal verification is under review,'
      } hence you can't proceed with credit card payment. Please contact support for further details.`;
    }
    if (verificationStatus?.kybStatus === 0) {
      this.isUserToBeKybVerified = true;
    }
  }

  /**
   * start intro tour
   */
  startIntroTour() {
    this.introService.isPageReloaded.set(false);
    this.introService.beforeUrl = this.router.url;
    this.router.navigate(['/intro-tour'], {
      queryParams: { flow: 'home' }
    });
    this.introService.introTrigger.next('initiateComponent');
  }

  paymentProcessingSubscription() {
    this.subscriptions.push(
      this.paymentsService.isPaymentProcessingSubject.subscribe((res) => {
        this.paymentsService.hasAmount.update(() => false);
        this.isPaymentProcessing = res;
      })
    );
  }

  /**
   * @description method to get the available payments when company is switched.
   */
  getCompanyChange() {
    this.subscriptions.push(
      this.companyManagementService.getCompanyChange$.subscribe()
    );
    this.paymentType.emit(this.customSwitch);
  }

  /**
   * @description Method invoked when pay/receive tabs are switched in template.
   * @param tab - Pay / Receive tab.
   */
  onChangeTab(tab: 'RECEIVE' | 'PAY') {
    this.customSwitch = tab;
    this.config.type1 = tab;
    this.isShowSuccess = false;
    this.isScanQRCode = false;
    if (tab === 'RECEIVE') {
      this.showBankDetails = false;
    } else {
      this.showBankDetails = true;
    }
    if (this.editedPayeeData) {
      this.changedDetails = { selectedPayeeDetails: this.editedPayeeData };
      this.config.paymentFormValue.payee = this.editedPayeeData;
      this.config.paymentFormValue.payeeEmail = this.editedPayeeData?.email;
    }
    this.showOrHidePaymentDetailsBar();
    this.paymentType.emit(tab);
  }

  /**
   * @description This method will listen to the header quick button navigation and act accordingly.
   */
  listenForHeaderQuickNavigationChange() {
    this.subscriptions.push(
      this.router.events.subscribe({
        next: (res) => {
          if (res instanceof NavigationEnd) {
            if (res.url === '/manage/payments/main/pay/bankaccount/ach') {
              this.onChangeTab('PAY');
            } else if (res.url === "/manage/payments/main/receive/''/''") {
              this.onChangeTab('RECEIVE');
            }
          }
        }
      })
    );
  }

  /**
   * @description method to set existing payment configuration.
   */
  configPayment() {
    this.newPayment();
    if (this.config) {
      if (this.config.mode === 'CREATE') {
        if (this.config?.type1 === 'PAY' || this.config?.type1 === 'RECEIVE') {
          this.customSwitch = this.config?.type1;
          if (this.customSwitch === 'PAY' && this.config?.type2) {
            const payFromItem = this.payFromItems.find(
              (ele) => ele.id === this.config?.type2
            );
            if (payFromItem) {
              this.payFromSelected(payFromItem);
              const payAsItem = this.payAsItems.find(
                (ele) => ele.id === this.config?.type3
              );
              if (payAsItem) {
                this.payAsSelected(payAsItem);
              }
            }
          } else if (
            this.customSwitch === 'RECEIVE' &&
            this.config?.type3 &&
            this.config?.type2
          ) {
            const receiveFromItem = this.receiveToItems.find(
              (ele) => ele.id === this.config?.type3
            );
            if (receiveFromItem) {
              this.receiveToSelected(receiveFromItem);
              const receiveToItem = this.receiveFromItems.find(
                (ele) => ele.id === this.config?.type2
              );
              if (receiveToItem) {
                this.receiveFromSelected(receiveToItem);
              }
            }
          }
          this.config.paymentFormValue = {
            ...this.paymentsService.initiatePaymentForm
          };
        } else {
          this.defaultPaymentLoad();
        }
      } else if (this.config.mode === 'EDIT' && this.config?.id) {
        this.disableNonUpdatableFlows();
        this.getPaymentDetailsAndEdit(this.config?.id);
      } else if (this.config.mode === 'CLONE' && this.config.id) {
        this.disableNonUpdatableFlows();
        this.getPaymentDetailsAndClone(this.config?.id);
      }
    }
  }

  /**
   * @description Method to hide non updatable items.
   */
  disableNonUpdatableFlows() {
    if (this.config.mode === 'EDIT') {
      const ele = this.payFromItems.find((el) => el.id === 'cloud');
      if (ele) {
        ele.isHide = true;
      }
    } else if (this.config.mode === 'CLONE') {
      this.payFromItems.forEach((paymentType) => {
        const payFromPaymentType = { ...paymentType };
        if (paymentType.id !== 'bankaccount') {
          payFromPaymentType.isHide = true;
        }
      });
    }
  }

  /**
   * @description Method to get payment details and clone the payment.
   * @param paymentId - Payment Id.
   */
  getPaymentDetailsAndClone(paymentId: string) {
    this.loading = true;
    this.subscriptions.push(
      this.paymentsService
        .getPaymentDetails(paymentId)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.config.paymentDetails = res.data;
              let payFromItem: IPayFromItem | undefined;
              switch (this.config.paymentDetails.sourceType) {
                case 'BANK':
                  payFromItem = this.payFromItems.find(
                    (ele) => ele.id === 'bankaccount'
                  );
                  break;
                case 'WALLET':
                  payFromItem = this.payFromItems.find(
                    (ele) => ele.id === 'wallet'
                  );
                  break;
                case 'CARD':
                  payFromItem = this.payFromItems.find(
                    (ele) => ele.id === 'card'
                  );
                  break;
                default:
                  break;
              }
              if (payFromItem) {
                this.payFromSelected(payFromItem);
                let payAsItem: IPayAsItem | undefined;
                switch (this.config.paymentDetails.transferTypeCode) {
                  case 'checkMail':
                    payAsItem = this.payAsItems.find(
                      (ele) => ele.id === 'check_mail'
                    );
                    break;
                  case 'internationalWire':
                    payAsItem = this.payAsItems.find(
                      (ele) => ele.id === 'wire'
                    );
                    break;
                  case 'virtualCard':
                    payAsItem = this.payAsItems.find(
                      (ele) => ele.id === 'virtual-card'
                    );
                    break;
                  case 'giftCard':
                    payAsItem = this.payAsItems.find(
                      (ele) => ele.id === 'virtual-card'
                    );
                    break;
                  case 'internationalPayment':
                    payAsItem = this.payAsItems.find(
                      (ele) => ele.id === 'international-payment'
                    );
                    break;
                  default:
                    payAsItem = this.payAsItems.find(
                      (ele) =>
                        ele.id === this.config.paymentDetails?.transferTypeCode
                    );
                    break;
                }
                if (payAsItem) {
                  this.payAsSelected(payAsItem);
                }
              }
              if (this.config.paymentDetails) {
                this.config.paymentFormValue = {
                  amount: this.config.paymentDetails.amount,
                  payee: this.config.paymentDetails.payee,
                  wallet:
                    this.selectedPayFromItem?.id === 'wallet'
                      ? this.config.paymentDetails.source
                      : undefined,
                  bankAc:
                    this.selectedPayFromItem?.id === 'bankaccount'
                      ? this.config.paymentDetails.source
                      : undefined,
                  card:
                    this.selectedPayFromItem?.id === 'card'
                      ? this.config.paymentDetails.source
                      : undefined,
                  cloud:
                    this.selectedPayFromItem?.id === 'cloud'
                      ? this.config.paymentDetails.source
                      : undefined,
                  memo: this.config.paymentDetails.description,
                  payeeEmail:
                    this.config.paymentDetails.payee?.email ?? undefined,
                  invoiceNumber: '',
                  category: this.config.paymentDetails.category ?? undefined,
                  noDate:
                    this.config.paymentDetails.transferTypeCode === 'check'
                      ? this.config.paymentDetails.transfer?.noDate
                      : undefined,
                  noPayee:
                    this.config.paymentDetails.transferTypeCode === 'check'
                      ? this.config.paymentDetails.transfer?.noPayee
                      : undefined,
                  checkNumber:
                    this.config.paymentDetails.transferTypeCode === 'check'
                      ? this.config.paymentDetails.transfer?.chequeSerialNumber
                      : undefined,
                  chequeInvoiceNumber: '',
                  payeeIdNumber:
                    this.config?.paymentDetails?.payee?.payeeIdNumber ??
                    undefined,
                  issueDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')
                };
              }
            }
          }
        })
    );
  }

  /**
   * @description - Fetches payment details and clones them for further processing.
   * @param paymentId -The ID of the payment for which to fetch details.
   */
  getPaymentDetailsAndEdit(paymentId: string) {
    this.loading = true;
    this.paymentsService
      .getPaymentDetails(paymentId)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.config.paymentDetails = res.data;
            this.paymentDetailsStatus.set(res.data.status);
            let payFromItem: IPayFromItem | undefined;
            switch (this.config.paymentDetails.sourceType) {
              case 'BANK':
                payFromItem = this.payFromItems.find(
                  (ele) => ele.id === 'bankaccount'
                );
                break;
              case 'WALLET':
                payFromItem = this.payFromItems.find(
                  (ele) => ele.id === 'wallet'
                );
                break;
              case 'CARD':
                payFromItem = this.payFromItems.find(
                  (ele) => ele.id === 'card'
                );
                break;
              case 'CLOUD':
                payFromItem = this.payFromItems.find(
                  (ele) => ele.id === 'cloud'
                );
                break;
              default:
                break;
            }
            if (payFromItem) {
              this.payFromSelected(payFromItem);
              let payAsItem: IPayAsItem | undefined;
              switch (this.config.paymentDetails.transferTypeCode) {
                case 'checkMail':
                  payAsItem = this.payAsItems.find(
                    (ele) => ele.id === 'check_mail'
                  );
                  break;
                case 'internationalWire':
                  payAsItem = this.payAsItems.find((ele) => ele.id === 'wire');
                  break;
                case 'virtualCard':
                  payAsItem = this.payAsItems.find(
                    (ele) => ele.id === 'virtual-card'
                  );
                  break;
                case 'check':
                  if(this.config.paymentDetails?.metadata?.paymentMethod === 'check_email'){
                    payAsItem = this.payAsItems.find(
                      (ele) => ele.id === 'check_email'
                    );
                  }else{
                    payAsItem = this.payAsItems.find(
                      (ele) => ele.id === 'check_print'
                    );
                  }
                  break;
                default:
                  payAsItem = this.payAsItems.find(
                    (ele) =>
                      ele.id === this.config.paymentDetails?.transferTypeCode
                  );
                  break;
              }
              if (payAsItem) {
                this.payAsSelected(payAsItem);
              }
            }
            if (this.config.paymentDetails) {
              this.config.paymentFormValue = {
                amount: this.config.paymentDetails.amount,
                payee: this.config.paymentDetails.payee_deleted
                  ? undefined
                  : this.config.paymentDetails.payee,
                wallet:
                  this.selectedPayFromItem?.id === 'wallet'
                    ? this.config.paymentDetails.source
                    : undefined,
                bankAc: this.getBankAccount(),
                card: this.getCard(),
                cloud:
                  this.selectedPayFromItem?.id === 'cloud'
                    ? this.config.paymentDetails.source
                    : undefined,
                memo: this.config.paymentDetails.description,
                payeeEmail:
                  this.config.paymentDetails.payee?.email ?? undefined,
                invoiceNumber: this.config.paymentDetails.referenceNo,
                category: this.config.paymentDetails.category ?? undefined,
                noDate:
                  this.config.paymentDetails.transferTypeCode === 'check'
                    ? this.config.paymentDetails.transfer?.noDate
                    : undefined,
                noPayee:
                  this.config.paymentDetails.transferTypeCode === 'check'
                    ? this.config.paymentDetails.transfer?.noPayee
                    : undefined,
                checkNumber:
                  this.config.paymentDetails.transferTypeCode === 'check'
                    ? this.config.paymentDetails.transfer?.chequeSerialNumber
                    : undefined,
                chequeInvoiceNumber: this.config.paymentDetails.transferTypeCode === 'check'
                    ? this.config.paymentDetails.transfer?.chequeInvoiceNumber
                    : undefined,
                payeeIdNumber:
                  this.config?.paymentDetails?.payee?.payeeIdNumber ??
                  undefined,
                shippingType:
                  this.config.paymentDetails?.transferTypeCode === 'checkMail'
                    ? this.config.paymentDetails?.metadata?.shippingType
                    : undefined,
                issueDate: this.config.paymentDetails.transfer?.chequeIssueDate
              };
            }
            this.hasQboExportData.set(this.config.paymentDetails.hasQboExportData === 1 ? true : false);
          }
        }
      });
  }

  /**
   * @description Gets the bank account information based on the selected payment method.
   * @returns The bank account information. Returns `undefined` if the conditions are not met.
   */
  getBankAccount() {
    if (
      this.config.paymentDetails &&
      this.selectedPayFromItem?.id === 'bankaccount'
    ) {
      if (!this.config.paymentDetails.source_deleted) {
        return this.config.paymentDetails.source;
      }
    }
    return undefined;
  }

  /**
   * @description Gets the card information based on the selected payment method.
   * @returns The card information. Returns `undefined` if the conditions are not met.
   */
  getCard() {
    if (this.config.paymentDetails && this.selectedPayFromItem?.id === 'card') {
      if (!this.config.paymentDetails.source_deleted) {
        return this.config.paymentDetails.source;
      }
    }
    return undefined;
  }

  /**
   * @description Opens modal for setting default payment.
   */
  openDefaultPaymentModal() {
    this.dialog
      .open(DefaultPaymentV3Component, {
        width: '450px',
        panelClass: 'overflow-visible',
        data: {
          defaultPayments: this.defaultPayment,
          disableMethods: this.disableMethods
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.defaultPayment) {
          this.config.paymentFormValue = '';
          this.defaultPaymentLoad();
        }
      });
  }

  /**
   * @description Method to set pay-from item and necessary settings.
   * @param item - Pay-from item.
   * @param payAs - Pay-as item.
   */
  payFromSelected(item: IPayFromItem, payAs?: IPayAsItem) {
    if (item.id !== 'card') {
      // Track when the credit card promoting toast is clicked and the no payment is done.
      this.clickTrackingService
        .ccToastClickedNoPaymentDone()
        ?.pipe(take(1))
        .subscribe();
    }

    if (
      item?.id === 'card' &&
      this.localStorageService.getItem('isCreditCardPaymentEnabled') === 0
    ) {
      
      this.dialog.open(MaintenanceAlertModalComponent, {
        panelClass: 'plaid-modal',
        width: 'fit-content',
        data: {
          content: this.cardMaintenanceMessage
        }
      });

      this.resetPaymentMethods('payAs');
      this.resetPaymentMethods('payFrom');
      return;
    }

    this.showCreditCardToast = true;
    this.cloudListV35Service.selectAccount(undefined);
    const payFromItem = this.payFromItems.find(
      (listItem) => item.id === listItem.id
    );
    const noPermission = {
      noPermission: false,
      payMethode: ''
    };
    this.paymentsService.isPermissionDenied.next(noPermission);
    this.showOrHidePaymentDetailsBar();
    if (
      payFromItem &&
      !this.paymentTypeAccessService.onInputChanges(payFromItem.id)
    ) {
      this.resetPaymentMethods('payFrom');
      return;
    }

    if (payAs?.id !== this.selectedPayAsItem?.id) {
      this.selectedPayAsItem = payAs;
      this.selectedPayAsNgModel = payAs;
    }
    this.selectedPayFromItem = payFromItem;
    this.selectedPayFromNgModel = payFromItem;
    if (payFromItem?.payOptions) {
      // Sort items based on isSelectable to show selectable items first
      this.payAsItems = this.sortSelectableFirst(payFromItem.payOptions);
      // Remove check_print option if payFrom id is 'card'
      if(payFromItem.id==='card'){
        this.payAsItems= this.payAsItems.filter((payItem) => payItem.id !=='check_print');
      }
    }
    const payAsItem = this.payAsItems.find(
      (listItem) => listItem.id === payAs?.id
    );
    this.payAsSelected(payAsItem ?? this.payAsItems[0]);
    // Preserve payee selection when changing pay from
    const preservedPayee = this.changedDetails?.selectedPayeeDetails || this.config.paymentFormValue?.payee || this.editedPayeeData;

    if (preservedPayee && !this.changedDetails?.selectedPayeeDetails) {
      this.changedDetails = { selectedPayeeDetails: preservedPayee };
      this.config.paymentFormValue.payee = preservedPayee;
      this.config.paymentFormValue.payeeEmail = preservedPayee?.email;
    }

    this.showCreditCardEnableBanner();
  }

  /**
   * Sorts an array so that items with isSelectable true come first, followed by those with isSelectable false or undefined.
   *
   * @template T - The type of items in the array, which may have an optional isSelectable boolean property.
   * @param {T[]} items - The array of items to sort.
   * @returns {T[]} A new array sorted with selectable items first.
   */
  sortSelectableFirst<T extends {isSelectable?:boolean}>(items:T[]) : T[] {
    return items.slice().sort((a,b) => (b.isSelectable ? 1 : 0) - (a.isSelectable ? 1 : 0) );
  }

  /**
   * @description Method to set pay-as item and necessary settings.
   * @param payAsItem - Pay-as item.
   */
  payAsSelected(payAsItem: IPayAsItem) {
    if (
      payAsItem?.id === 'virtual-card' &&
      this.selectedPayFromItem?.id !== 'wallet'
    ) {
      this.handleCommonPaymentFailure(payAsItem?.id, payAsItem?.label);
      return;
    }

    if (
      payAsItem?.id === 'rtp' &&
      (this.selectedPayFromItem?.id === 'card' ||
        this.selectedPayFromItem?.id === 'bankaccount' ||
        this.selectedPayFromItem?.id === 'cloud')
    ) {
      this.handleRtpPayment();
      return;
    }
    if (payAsItem?.id === 'wire' && (
      ((this.selectedPayFromItem?.id === 'card' ) && !this.paymentTypeAccessService.onInputChanges('card-wire-transfer'))
      ||
      ((this.selectedPayFromItem?.id === 'wallet' ) && !this.paymentTypeAccessService.onInputChanges('wallet-wire'))
    )
    ) {
      this.resetPaymentMethods('payAs');
      return;
    }

    // Check for international payment enablement via local storage
    if (payAsItem?.id === 'international-payment') {
      // Get the values from local storage
      const rippleBusinessEnabled = this.localStorageService.getItem('rippleBusinessInternationalPaymentEnabled');
      const ripplePersonalEnabled = this.localStorageService.getItem('ripplePersonalInternationalPaymentEnabled');
      
      // Check if at least one is enabled (value is 1)
      const isBusinessEnabled = rippleBusinessEnabled === 1 || rippleBusinessEnabled === '1';
      const isPersonalEnabled = ripplePersonalEnabled === 1 || ripplePersonalEnabled === '1';
      
      if (!isBusinessEnabled && !isPersonalEnabled) {
        // Both are disabled - show alert to contact support
        this.showInternationalPaymentDisabledAlert();
        this.resetPaymentMethods('payAs');
        return;
      }
      
      // At least one is enabled - proceed with the international payment
      // Store which type is enabled for potential future use
      this.internationalPaymentType = {
        business: isBusinessEnabled,
        personal: isPersonalEnabled
      };
      
      // Still check with payment type access service for other validations if needed
      if (!this.paymentTypeAccessService.onInputChanges(payAsItem.id, { disableAlert: false })) {
        // Additional validation failed
        this.resetPaymentMethods('payAs');
        return;
      }
    }

    if (
      (this.selectedPayFromItem?.id === 'bankaccount' &&
        (payAsItem?.id === 'same-ach' ||
          payAsItem?.id === 'international-payment' ||
          payAsItem?.id === 'wire')) ||
      (this.selectedPayFromItem?.id === 'card' &&
        (payAsItem?.id === 'international-payment' || payAsItem?.id === 'same-ach')) 
    ) {
      this.handleCommonPaymentFailure(payAsItem?.id, payAsItem?.label);
      return;
    }

    // if (payAsItem?.id === 'check_print') {
    //   this.openComingSoonMessage();
    //   this.resetPaymentMethods('payAs');
    //   return;
    // }

    if (
      this.selectedPayFromItem?.id === 'cloud' &&
      (payAsItem?.id === 'virtual-card' ||
        payAsItem?.id === 'rtp' ||
        payAsItem?.id === 'same-ach' ||
        payAsItem?.id === 'international-payment' ||
        payAsItem?.id === 'international-payment' ||
        payAsItem?.id === 'check_mail' ||
        payAsItem?.id === 'check_print')
    ) {
      this.handleCommonPaymentFailure(payAsItem?.id, payAsItem?.label);
      return;
    }

    if (this.editedPayeeData || this.payeeAllData?.payeeDropdownDetails || this.changedDetails?.selectedPayeeDetails) {
      const payeeDetails = this.editedPayeeData ||this.payeeAllData?.payeeDropdownDetails || this.changedDetails?.selectedPayeeDetails;
      this.changedDetails = { selectedPayeeDetails: payeeDetails };
      this.config.paymentFormValue.payee = payeeDetails;
      this.config.paymentFormValue.payeeEmail = payeeDetails?.email;

       // Ensure payeeAllData is also updated
    if (!this.payeeAllData?.payeeDropdownDetails) {
      this.payeeAllData = {
        ...this.payeeAllData,
        payeeDropdownDetails: payeeDetails,
        isMoreDetailsLoading: false
      };
    }

    }
    this.selectedPayAsItem = payAsItem;
    this.selectedPayAsNgModel = payAsItem;
    this.isShowSuccess = false;
    this.onPaymentContextChange();

    if (this.config?.paymentFormValue?.payeeBankAc === '') {
      this.config.paymentFormValue.payeeBankAc = undefined;
    }

    if(this.selectedPayFromItem?.id === 'wallet' && this.selectedPayAsItem?.id === 'check_email') {
      this.turnOffCardToast();
    }
  }

  handleRtpPayment() {
    this.alertService
      .infoAlert({
        content:
          '<span style="font-weight: 600;">Real Time Instant payments</span> are now allowed only from the <span style="font-weight: 600;">Wallet</span>. Would you like to proceed with the payment using your <span style="font-weight: 600;">Wallet</span>?',
        doneMsg: 'Proceed',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const wallet = this.payFromItems.find((el) => el.id === 'wallet');
          if (!wallet) return;
          const payAs = wallet.payOptions?.find((el) => el.id === 'rtp');
          this.payFromSelected(wallet, payAs);
        } else {
          this.resetPaymentMethods('payAs');
        }
      });
  }

  handleCommonPaymentFailure(paymentId: string, label: string) {
    this.alertService
      .infoAlert({
        content: `${label} payments are now allowed only from the wallet. Would you like to proceed with the payment using your wallet?`,
        doneMsg: 'Proceed',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const wallet = this.payFromItems.find((el) => el.id === 'wallet');
          if (!wallet) return;
          const payAs = wallet.payOptions?.find((el) => el.id === paymentId);
          this.payFromSelected(wallet, payAs);
        } else {
          this.resetPaymentMethods('payAs');
        }
      });
  }

  /**
   * @description Method to set receive-to item and necessary settings.
   * @param item - Receive-to item.
   */
  receiveToSelected(item: IReceivePayItem) {
    if (item.id === 'debit_pull' || item.id === 'check_deposit') {
      this.resetPaymentMethods('receiveTo');
      return;
    }
    // if (this.disableMethods.includes('cloud') && (item?.id === 'debit_pull' || item?.id === 'check_deposit')) {
    //   this.resetPaymentMethods('receiveTo');
    //   this.openCloudApplyMessage();
    //   return;
    // }
    this.isSelectPayee = false;
    this.selectedReceiveToItem = item;
    this.selectedReceiveToNgModel = item;
    this.selectedReceiveFromItem = undefined;
    this.receiveFromItems = item.payOptions ?? [];

    if (item?.id === 'bank') {
      this.selectedReceiveToZilBankItem = 'debit_pull';
      if (this.editedPayeeData || this.changedDetails) {
        this.isSelectPayee = true;
      }
    }

    // if (item?.id === 'debit_pull' && this.disableMethods.includes('debit_pull')) {
    //   this.selectedReceiveToZilBankItem = 'check_deposit';
    //   if (this.disableMethods.includes('check_deposit')) {
    //     this.selectedReceiveToZilBankItem = '';
    //   }
    // }
    // if (item.id === 'debit_pull' || item.id === 'check_deposit') {
    //   this.isSelectPayee = false;
    //   this.selectedReceiveToZilBankItem = item?.id;
    // }
    this.receiveFromSelected(this.receiveFromItems[0]);
  }

  /**
   * @description Method to set receive-from item and necessary settings.
   * @param item - Receive-from item.
   */
  receiveFromSelected(item: IPayAsItem) {
    const selectedReceiveFromItem = this.receiveFromItems.find(
      (receiveFromItem) => item.id === receiveFromItem.id
    );
    if (item.label !== 'Payee') {
      this.isSelectPayee = false;
    } else if (this.changedDetails || this.editedPayeeData) {
      this.isSelectPayee = true;
    }
    this.isShowSuccess = false;
    this.selectedReceiveFromItem = selectedReceiveFromItem;
    this.selectedReceiveFromNgModel = selectedReceiveFromItem;
    this.onPaymentContextChange();
  }

  /**
   * @description Method invoked when payment combination is changed
   */
  onPaymentContextChange() {
    this.paymentFeeDetails.isShow = false;
    this.isInternationalPayment = false; 
    // Preserve payee details during context change
    const currentPayee = this.changedDetails?.selectedPayeeDetails || this.config.paymentFormValue?.payee;
    this.showOrHidePaymentDetailsBar();
    // Restore payee if it was cleared
    if (currentPayee && !this.changedDetails?.selectedPayeeDetails) {
      this.changedDetails = { selectedPayeeDetails: currentPayee };
    }
  }

  openComingSoonMessage() {
    this.alertService.infoAlert({ content: 'Coming Soon!', close: true });
  }

  /**
   * Shows alert when international payment is not enabled for the account
   */
  showInternationalPaymentDisabledAlert(): void {
    const data = {
      content: 'International Payment transfer is not enabled for this account. Please contact the support team to enable it.',
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

  /**
   * @description Opens info alert showing cloud bank approval status.
   */
  openCloudApplyMessage(): void {
    const data = {
      content: 'Cloud Bank is not approved for this account',
      isOk: true,
      isCancel: true,
      doneMsg: 'Apply Now'
    };
    const dialog = this.alertService.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/cloud-bank/index']);
      }
    });
  }

  /**
   * @description Method invoke when success event is emitted from payment component.
   * @param data - Payment success data.
   */
  showSuccess(data: IPaymentSuccessData) {
    this.isShowSuccess = true;
    this.isSelectPayee = false;
    this.cloudListV35Service.selectAccount(undefined);
    this.isScanQRCode = false;
    this.paymentFeeDetails.isShow = false;
    if (data?.paymentReceived) {
      this.scriptService.gtagEventScript('payment-request', {
        amount: data.paymentReceived
      });
    }
    this.isApprovalPolicyEnabled.set(false);
    this.successData = data;
    this.config = {
      mode: 'CREATE',
      type1: this.customSwitch ?? 'PAY'
    };
    this.v3DataTableService.refreshV3DataTable();
    this.showOrHidePaymentDetailsBar();
    this.editedPayeeData = undefined;
    this.changedDetails = undefined;
    this.payeeAllData.payeeDropdownDetails = undefined;
    this.config.paymentFormValue = {};
    this.paymentsService.initiatePaymentForm = {};
  }

  /**
   * @description Method toi set default values for new payment.
   */
  newPayment(preserveSelection?: boolean, fromChildEvent?: boolean, isFromCard?: boolean) {
    this.editedPayeeData = undefined;
    this.changedDetails = undefined;
    this.config.paymentFormValue = {};
    this.isShowSuccess = false;
    if (fromChildEvent) {
      this.changePaymentConfigEvent.emit('CREATE');
    }
    if (preserveSelection) {
      return;
    }

    if (isFromCard) {
      this.loading = true;
      const payFromItem = this.payFromItems.find((el) => el.id === 'card') as IPayFromItem;
      const currentPayAsId = this.selectedPayAsItem?.id || 'ach';
      const payAsItem = payFromItem.payOptions?.find((el) => el.id === currentPayAsId) as IPayAsItem;
      this.payFromSelected(payFromItem);
      this.payAsSelected(payAsItem);
      setTimeout(() => {
        this.loading = false;
      }, 100);
    }else{
      this.payFromSelected(this.payFromItems[0]);
      this.payAsSelected(this.payAsItems[0]);
    }
  
    this.receiveToSelected(this.receiveToItems[0]);
    this.receiveFromSelected(this.receiveFromItems[0]);
  }

  /**
   * @description Method to set the default payment setting as per user settings.
   */
  defaultPaymentLoad() {
    this.loading = true;
    this.isShowSuccess = false;
    this.subscriptions.push(
      this.paymentsService
        .getDefaultPayment()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success && res.data?.default_payment_method) {
              this.defaultPayment = res.data.default_payment_method;
              const { payFrom, payAs } = res.data.default_payment_method;
              if (payFrom === undefined) {
                this.newPayment();
                return;
              }
              this.selectedAccount = res.data.default_payment_method.paymentAc;
              this.payFromSelected(payFrom, payAs ?? this.payAsItems[0]);
              this.receiveToSelected(this.receiveToItems[0]);
              this.config.paymentFormValue = {
                wallet:
                  payFrom.id === 'wallet'
                    ? res.data.default_payment_method.paymentAc
                    : undefined,
                bankAc:
                  payFrom.id === 'bankaccount'
                    ? res.data.default_payment_method.paymentAc
                    : undefined,
                card:
                  payFrom.id === 'card'
                    ? res.data.default_payment_method.paymentAc
                    : undefined,
                cloud:
                  payFrom.id === 'cloud'
                    ? res.data.default_payment_method.paymentAc
                    : undefined,
                memo: res.data.default_payment_method.memo
              };
            } else {
              this.newPayment();
            }
          },
          error: () => {
            this.newPayment();
          }
        })
    );
  }

  /**
   * @description Method to set payee details.
   * @param event - Payee details.
   */
  onPayeeDetails(event: IPayeeDetailsEvent): void {
    this.bankDetailsArray = [];
    this.beneficiaryDetails = [];
    this.interBankDetails = [];
    this.interBeneficiaryDetails = [];
    this.payeeAllData = event;

    if (this.payeeAllData?.payeeDropdownDetails?.id) {
      this.isSelectPayee = true;
    } else {
      this.isSelectPayee = false;
    }

    if (this.payeeAllData?.isMoreDetailsLoading === true) {
      this.editedPayeeData = undefined;
      this.changedDetails = this.payeeAllData as IPayeeDetailsEvent;
      this.config.paymentFormValue.payee =
        this.payeeAllData.payeeDropdownDetails;
      this.config.paymentFormValue.payeeEmail =
        this.payeeAllData.payeeDropdownDetails?.email;
    }
    if (this.config.paymentFormValue?.payee) {
      this.config.paymentFormValue.payee =
        this.payeeAllData.payeeDropdownDetails;
      this.config.paymentFormValue.payeeEmail =
        this.payeeAllData.payeeDropdownDetails?.email;
    }

    if (this.payeeAllData?.payeeDropdownDetails === undefined) {
      this.isSelectPayee = false;
      this.editedPayeeData = undefined;
      this.changedDetails = undefined;
      if (this.config.paymentFormValue?.payee) {
        this.config.paymentFormValue.payee = undefined;
        this.config.paymentFormValue.payeeEmail = undefined;
      }
    }

    if (this.payeeAllData.payeeBankDetails) {
      this.bankDetailsArray.push({
        key: 'Account No',
        value: this.getMaskedAcNo(
          this.payeeAllData.payeeBankDetails?.account_number
        )
      });
      this.bankDetailsArray.push({
        key: 'Routing No',
        value: this.payeeAllData.payeeBankDetails?.routing_number
      });
      this.bankDetailsArray.push({
        key: 'Account Type',
        value: this.getAccountType(this.payeeAllData.payeeBankDetails?.account_type)
      });
      this.subscriptions.push(
        this.bankAccountService
          .getroutingNumber(this.payeeAllData.payeeBankDetails.routing_number)
          .subscribe((res) => {
            if (res.data.name !== 'Bank Name') {
              const bankNameExists = this.bankDetailsArray.some(
                (item) => item.key === 'Bank Name'
              );
              if (!bankNameExists) {
                this.bankDetailsArray.push({
                  key: 'Bank Name',
                  value: res.data.name
                });
                this.payeeCurrentBank = res.data.name;
              }
              if (this.payeeAllData.payeeBankDetails?.beneficiaryBankDetails) {
                this.payeeAllData.payeeBankDetails.beneficiaryBankDetails.bankingInstituteName =
                  res.data.name;
              }
            } else {
              this.bankDetailsArray.push({
                key: 'Bank Name',
                value:
                  this.payeeAllData.payeeBankDetails?.beneficiaryBankDetails
                    ?.bankingInstituteName
              });
              this.payeeCurrentBank = undefined;
            }
          })
      );
      this.bankDetailsArray.push({
        key: 'Account Holder Name',
        value: this.payeeAllData.payeeBankDetails?.bank_name
      });
      if (this.payeeCurrentBank) {
        this.bankDetailsArray.push({
          key: 'Bank Name',
          value: this.payeeCurrentBank
        });
      }
    }

    if (this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails) {
      this.beneficiaryDetails.push({
        key: 'Address',
        value:
          this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails
            ?.addressLine1
      });
      this.beneficiaryDetails.push({
        key: 'City',
        value: this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails?.city
      });
      this.beneficiaryDetails.push({
        key: 'State',
        value:
          this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails?.state
      });
      this.beneficiaryDetails.push({
        key: 'Zip',
        value: this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails?.zip
      });
      this.beneficiaryDetails.push({
        key: 'Country',
        value:
          this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails?.country
      });
    }

    if (this.payeeAllData?.payeeInterBankData) {
      const isIbanBank = this.isIbanInterBank();
      const isIndiaBank = this.isIndiaInterBank();

      if (!isIbanBank) {
        this.interBankDetails.push({
          key: 'Account No',
          value: this.getMaskedAcNo(
            this.payeeAllData?.payeeInterBankData?.account_number
          )
        });
      }
      if (!isIbanBank && !isIndiaBank) {
        this.interBankDetails.push({
          key: 'Bank Indentifier Type',
          value: this.payeeAllData?.payeeInterBankData?.bank_identifier_type
        });
        this.interBankDetails.push({
          key: 'Bank Identification Code',
          value: this.payeeAllData?.payeeInterBankData?.bank_identifier_code
        });
      }
      this.interBankDetails.push({
        key: 'Account Type',
        value: this.payeeAllData?.payeeInterBankData?.account_type
      });
      this.interBankDetails.push({
        key: 'Bank name',
        value: this.payeeAllData?.payeeInterBankData?.bank_name
      });
      if (isIbanBank) {
        this.interBankDetails.push({
          key: 'IBAN',
          value: this.getMaskedAcNo(
            this.payeeAllData?.payeeInterBankData?.account_number
          )
        });
      }
      if (this.payeeAllData?.payeeInterBankData?.ifsc) {
        this.interBankDetails.push({
          key: 'IFSC Code',
          value: this.payeeAllData?.payeeInterBankData?.ifsc
        });
      }
    }

    if (this.payeeAllData?.payeeInterBankData?.beneficiaryBankDetails) {
      this.interBeneficiaryDetails.push({
        key: 'Address',
        value:
          this.payeeAllData?.payeeInterBankData?.beneficiaryBankDetails
            ?.addressLine1
      });
      this.interBeneficiaryDetails.push({
        key: 'City',
        value:
          this.payeeAllData?.payeeInterBankData?.beneficiaryBankDetails?.city
      });
      this.interBeneficiaryDetails.push({
        key: 'State',
        value:
          this.payeeAllData?.payeeInterBankData?.beneficiaryBankDetails?.state
      });
      this.interBeneficiaryDetails.push({
        key: 'Zip',
        value:
          this.payeeAllData?.payeeInterBankData?.beneficiaryBankDetails?.zip
      });
      this.interBeneficiaryDetails.push({
        key: 'Country',
        value:
          this.payeeAllData?.payeeInterBankData?.beneficiaryBankDetails?.country
      });
    }
    this.showOrHidePaymentDetailsBar();
  }

  getAccountType(accountType: string) {
    switch (accountType) {
      case 'CHECKING':
        return 'Checking';
      case 'SAVINGS':
        return 'Savings';
      case 'BUSINESS':
        return 'Business';
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

  /**
   * @description Checks whether to show or hide Payment details bar or notifications bar
   */
  showOrHidePaymentDetailsBar() {
    if (
      (this.isSelectPayee || this.paymentFeeDetails.isShow) &&
      this.isUserToBeKybVerified &&
      this.selectedPayFromItem?.id === 'card' &&
      this.customSwitch === 'PAY'
    ) {
      this.payeeDetailsOpen.emit({ open: true, tabSwitch: false });
      this.isShowPaymentDetail = true;
    } else if (
      this.isSelectPayee ||
      this.paymentFeeDetails.isShow ||
      this.isScanQRCode
    ) {
      this.payeeDetailsOpen.emit({ open: true, tabSwitch: false });
      this.isShowPaymentDetail = true;
      if (this.customSwitch === 'RECEIVE') {
        this.paymentFeeDetails.isShow = false;
        this.showBankDetails = false;
      }
    } else if (
      this.selectedPayFromItem?.label === 'Cloud Bank' &&
      this.cloudListV35Service.selectedAccountSignal()
    ) {
      this.payeeDetailsOpen.emit({ open: true, tabSwitch: false });
      this.isShowPaymentDetail = true;
    } else {
      this.payeeDetailsOpen.emit({ open: false, tabSwitch: false });
      this.isShowPaymentDetail = false;
    }
  }

  /**
   * @description Method to check for permissions.
   */
  checkForPermission() {
    this.subscriptions.push(
      this.paymentsService.isPermissionDenied.subscribe((res) => {
        this.isPermission = res.noPermission;
        this.payMethode = res.payMethode;
      })
    );
  }

  /**
   * @description Method to show alert and handle various error responses from payment components.
   * @param err - Error response.
   */
  onErrorFromPaymentComponent(err: HttpErrorResponse) {
    const msg = {
      content: `${err.error.errorMsg}. Please edit to continue`,
      isOk: true,
      isCancel: true,
      doneMsg: 'Edit Now'
    };
    const action = this.alertService.infoAlert(msg);
    action.afterClosed().subscribe((res) => {
      if (res) {
        switch (err.error.errorCode) {
          case '221':
            this.onPayeeEditClicked();
            break;
          case '222':
            this.editPayeeBank();
            break;
          default:
            break;
        }
      }
    });
  }

  /**
   * @description Method to edit payee.
   * @param modalData - page to be opened in modal, if provided modal will open asked page, if not modal will open default page
   */
  onPayeeEditClicked(modalData?: {
    page?:
      | 'addBankDetails'
      | 'addAddress'
      | 'addInternationalBankDetails'
      | 'addCompany'
      | 'payeeEmail';
  }): void {
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(
          this.payeeAllData?.payeeDropdownDetails?.id as string,
          undefined,
          {
            edit: true,
            id: this.payeeAllData?.payeeDropdownDetails?.id as string,
            page: modalData?.page ?? undefined
          }
        )
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((result) => {
                if (result?.id) {
                  this.subscriptions.push(
                    this.payeeService
                      .getPayeeBankData(result?.id)
                      .subscribe((data) => {
                        let newbankdata = data.data.filter(
                          (bank) => bank.id === this.payeeService.bankToEdit
                        )[0];
                        if (!newbankdata) {
                          newbankdata = data.data[0];
                        }

                        if (newbankdata) {
                          this.payeeAllData.payeeBankDetails = {
                            account_number:
                              newbankdata?.accountNumber.toString(),
                            account_type: newbankdata?.accountType,
                            bank_name: newbankdata?.bankName,
                            id: this.convertToStringOrFloat(newbankdata?.id),
                            routing_number:
                              newbankdata?.routingNumber.toString()
                          };
                        }

                        const editedData = {
                          payeeNickName: result?.nickName,
                          payeeDropdownDetails: result,
                          payeeName: result?.name,
                          isMoreDetailsLoading: false,
                          payeeBankDetails: this.payeeAllData?.payeeBankDetails,
                          payeeInterBankData:
                            this.payeeAllData?.payeeInterBankData
                        };

                        if (result?.success) {
                          const payee = {
                            id: result.id,
                            name: result.name,
                            nickName: result.nickName,
                            phone: result.phone,
                            addressLine1: result.addressLine1,
                            addressLine2: result.addressLine2,
                            city: result.city,
                            company: result.company,
                            country: result.country,
                            email: result.email,
                            encryptedId: result.id,
                            state: result.state,
                            zip: result.zip,
                            payeeIdNumber: result.payeeIdNumber,
                            payeeTypeId: result.payeeTypeId,
                            createdAt: '',
                            typeDetails: {} as IpayeeTypeDetails,
                            merchantCategory: result.merchantCategory,
                            entityType: result?.entityType
                          };
                          this.store.dispatch(
                            payeesActions.addUpdatedPayeeIntoPayees({ payee })
                          );
                          this.payeeService.setPayeeEditedData(payee);
                          // this.payeeService.openNoBankAccountWarning.next(true);
                          this.editedPayeeData = result;
                          this.onPayeeDetails(editedData);
                          this.config.paymentFormValue = {
                            payee: result,
                            payeeEmail: result?.email
                          };
                          this.changedDetails = {
                            selectedPayeeDetails: result
                          };
                          this.payeeService.checkPayeeNameUpdate = {
                            payeeNickName: result?.nickName,
                            payeeName: result?.name
                          };
                        }
                      })
                  );
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description This method takes a string and returns as string if it contains alphanumeric else it returns as float.
   * @param id string needs checking if the string contains any non digit.
   * @returns converted data
   */
  convertToStringOrFloat(id: string): string | number {
    return /[^0-9]/.test(id) ? id : parseFloat(id);
  }

  /**
   * @description Method to edit payee international bank account.
   */
  editInternationalPayeeBankAc(): void {
    const ComponentToOpen =
      this.selectedPayAsItem?.id === 'international-payment'
        ? AddRecipientModalComponent
        : NewInternationalAccountComponent;

    const dialogRef = this.dialog.open(ComponentToOpen as any, {
      maxWidth: '95%',
      width:
        this.selectedPayAsItem?.id === 'international-payment'
          ? '700px'
          : '600px',
      disableClose: true,
      data: {
        editMode: true,
        id: this.payeeAllData?.payeeDropdownDetails?.id,
        bankAcId: this.payeeAllData?.payeeInterBankData?.encrypted_id,
        recipientId: this.payeeAllData?.payeeDropdownDetails?.id,
        payeeEmail: this.payeeAllData?.payeeDropdownDetails?.email,
        payeePhone: this.payeeAllData?.payeeDropdownDetails?.phone
      }
    });
    dialogRef
      .afterClosed()
      .subscribe((response: IApiRes<IInternationalBankAccountRequest>) => {
        if (response.success) {
          const newInternationalPayeeBancAc: IInternationalPayeeAccount = {
            payee_id: this.payeeAllData?.payeeDropdownDetails?.id,
            bank_name: response.data.bankName,
            account_number: response.data.accountNumber,
            swift_or_bic: response.data.identifierCode,
            account_type: response.data.accountType,
            bank_identifier_type: response.data.identifierType,
            bank_identifier_code: response.data.identifierCode,
            encrypted_id: response.data.id ?? '',
            beneficiary: response.data.beneficiary,
            beneficiaryBankDetails: response.data.beneficiaryBankDetails,
            ifsc: response.data.ifsc
          };
          const editedData = {
            payeeDropdownDetails: this.payeeAllData?.payeeDropdownDetails,
            isMoreDetailsLoading: false,
            payeeInterBankData: newInternationalPayeeBancAc
          };
          if (editedData.payeeDropdownDetails && response.data.payeePhone) {
            editedData.payeeDropdownDetails = {
              ...(editedData.payeeDropdownDetails as any),
              phone: response.data.payeePhone
            };
          }
          this.onPayeeDetails(editedData);
          this.changedDetails = {
            selectedInternationalPayeeBank: newInternationalPayeeBancAc,
            updatedPayeePhone: response.data.payeePhone || undefined
          };
          this.alertService.successAlert({
            title: 'Success',
            content: ' Bank account updated successfully',
            close: true
          });
        }
      });
  }

  /**
   * @description Method ot edit payee bank account.
   */
  editPayeeBank(): void {
    const account = {
      id: this.payeeAllData?.payeeBankDetails?.encrypted_id,
      bankName: this.payeeAllData?.payeeBankDetails?.bank_name,
      routingNumber: this.payeeAllData?.payeeBankDetails?.routing_number,
      accountNumber: this.payeeAllData?.payeeBankDetails?.account_number,
      accountType: this.payeeAllData?.payeeBankDetails?.account_type,
      is_allow_wire: this.payeeAllData?.payeeBankDetails?.is_allow_wire,

      bankAccountFirstName: this.payeeAllData?.payeeBankDetails?.first_name,
      bankAccountLastName: this.payeeAllData?.payeeBankDetails?.last_name,
      bankAccountAddress1: this.payeeAllData?.payeeBankDetails?.address_line_1,
      bankAccountAddress2:
        this.payeeAllData?.payeeBankDetails?.bank_account_address2,
      bankAccountCity: this.payeeAllData?.payeeBankDetails?.bank_city,
      bankAccountState: this.payeeAllData?.payeeBankDetails?.bank_state,
      bankAccountZip: this.payeeAllData?.payeeBankDetails?.bank_zip,
      bankAccountCountry: this.payeeAllData?.payeeBankDetails?.country,

      bankingInstituteName:
        this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails
          ?.bankingInstituteName,
      bankingInstituteAddressLine1:
        this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails
          ?.addressLine1,
      bankingInstituteAddressLine2:
        this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails
          ?.addressLine2,
      bankingInstituteCity:
        this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails?.city,
      bankingInstituteState:
        this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails?.state,
      bankingInstituteZip:
        this.payeeAllData?.payeeBankDetails?.beneficiaryBankDetails?.zip
    };
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankNormalModal({
          editMode: true,
          id: this.payeeAllData?.payeeDropdownDetails?.id,
          account,
          from: this.selectedPayAsItem?.id
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
                            response.data.bankingInstituteAddressLine1 ?? '',
                          addressLine2: response.data.bankAccountAddress2 ?? '',
                          city: response.data.bankingInstituteCity ?? '',
                          country: response.data.bankingInstituteCountry ?? '',
                          state: response.data.bankingInstituteState ?? '',
                          zip: response.data.bankAccountZip ?? '',
                          bankingInstituteName: response.data
                            .bankingInstituteName
                            ? response.data.bankingInstituteName
                            : ''
                        }
                      : undefined
                  };
                  this.changedDetails = { selectedPayeeBank: newPayeeBankAc };
                  this.selectedPayeeBank = newPayeeBankAc;
                  this.alertService.successAlert({
                    title: 'Success',
                    content: ' Bank account updated successfully',
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
   * @description Method invoked when `calculateFee` event is emitted from some payment components.
   * Calculates fee for those payment components.
   * @param sendingData4FeeCalc - ICalcPaymentFeeRequest
   * @param amount: number payment amount
   * @param mode: number payment transaction mode number eg ach: 1
   * @param fee1Label,fee2Label: string; label to show in payment details bar
   * @description - shows all processing or service fee in payment details bar
   */
  calculateFee(sendingData4FeeCalc: ICalcPaymentFeeRequest) {
    if (sendingData4FeeCalc.amount && sendingData4FeeCalc.amount > 0) {
      this.paymentFeeDetails.isShow = true;
      this.paymentFeeDetails.isError = false;
      this.paymentFeeDetails.isLoading = true;
      this.paymentFeeDetails.calcFeeRequest = sendingData4FeeCalc;
      if (this.paymentFeeDetails.apiSubscription) {
        this.paymentFeeDetails.apiSubscription.unsubscribe();
      }
      const payload = {
        mode: sendingData4FeeCalc.mode,
        amount: sendingData4FeeCalc.amount,
        shippingType: sendingData4FeeCalc?.shippingType ?? undefined,
        isSameDay: sendingData4FeeCalc.isSameDay ?? false
      };
      this.paymentFeeDetails.apiSubscription = this.paymentsService
        .calculatePaymentFee(payload)
        .pipe(
          finalize(() => {
            this.paymentFeeDetails.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              res.data.originalAmount = Number(res.data.originalAmount).toFixed(
                2
              );
              res.data.serviceFeeWithoutAdditionalFee = Number(
                res.data.serviceFeeWithoutAdditionalFee
              ).toFixed(2);
              res.data.additionalFee = Number(res.data.additionalFee).toFixed(
                2
              );
              res.data.totalAmount = Number(res.data.totalAmount);
              this.paymentFeeDetails.feeDetails = {
                ...res.data,
                totalAmount: Number(res.data.totalAmount)
              };
            }
          },
          error: () => {
            this.paymentFeeDetails.isError = true;
          }
        });
    } else {
      this.paymentFeeDetails.isShow = false;
    }
    this.showOrHidePaymentDetailsBar();
  }

  getTransactionFeatureCode(
    paymentSource: string,
    paymentMethod: string
  ): void {
    this.transactionFeatureCode =
      this.paymentsService.getTransactionFeatureCode(
        paymentSource,
        paymentMethod
      );
  }

  checkStatusScheduled(checkStatus: { status: number }) {
    if (checkStatus?.status === 50) {
      this.checkStatusValue = checkStatus.status;
    }
  }

  /**
   * @description Method invoked when `calculateFee` event is emitted from some payment components.
   * Calculates fee for those payment components.
   * @param paymentDetails - Payment details.
   */
  calculatePaymentFee(paymentDetails: {
    amount: number;
    paymentSource: string;
    paymentMethod: string;
    shippingType?: string;
  }) {

    this.isInternationalPayment = paymentDetails.paymentMethod === "international";
    // For international payments, set fee to 0 but still show payment details
    if (this.isInternationalPayment) {
      this.paymentFeeDetails.isShow = true;
      const attachmentFee = this.globalAttachmentFee();
      const totalAmount = Number(paymentDetails.amount) + attachmentFee;
      
      const feeDetails = {
        originalAmount: Number(paymentDetails.amount).toFixed(2),
        serviceFeeWithoutAdditionalFee: '0.00',
        serviceFee: '0.00',
        additionalFee: '0.00',
        totalAmount: totalAmount,
        ...(attachmentFee > 0 && {
          attachmentFee: {
            fee: attachmentFee,
            title: 'Attachment fee'
          }
        })
      };
      this.paymentFeeDetails.feeDetails = feeDetails;
      this.paymentFeeDetails.isLoading = false;
      this.showOrHidePaymentDetailsBar();
      return;
    }

    if (paymentDetails.amount && paymentDetails.amount > 0) {
      this.paymentFeeDetails.isShow = true;
      this.paymentFeeDetails.isError = false;
      this.paymentFeeDetails.isLoading = true;
      const calcFeeRequest = {
        amount: paymentDetails.amount,
        mode: paymentDetails.amount,
        fee1Label: 'Transaction fee'
      };
      this.paymentFeeDetails.calcFeeRequest = calcFeeRequest;
      this.getTransactionFeatureCode(
        paymentDetails.paymentSource,
        paymentDetails.paymentMethod
      );
      const body = {
        featureCode: this.transactionFeatureCode,
        transactionAmount: paymentDetails.amount,
        shipping_type: paymentDetails.shippingType ?? undefined,
        ...(this.paymentsService.isSameDayAch() && {
          samedayFeatureCode: 'txn-zilpayment-sameday-ach-processing-fee'
        })
      };
      if (this.paymentFeeDetails.transactionFeeSubscription) {
        this.paymentFeeDetails.transactionFeeSubscription.unsubscribe();
      }
      if (paymentDetails.paymentSource === 'cloud-bank') {
        this.paymentFeeDetails.transactionFeeSubscription = this.psbService
          .getCloudBankTransactionFee(body.shipping_type)
          .pipe(
            finalize(() => {
              this.paymentFeeDetails.isLoading = false;
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                const serviceFee = Number(res.data.fees);
                const attachmentFee = this.globalAttachmentFee();
                const totalAmount = Number(paymentDetails.amount) + serviceFee + attachmentFee;
                
                const feeDetails = {
                  originalAmount: Number(paymentDetails.amount).toFixed(2),
                  serviceFeeWithoutAdditionalFee: Number(serviceFee).toFixed(2),
                  serviceFee: Number(serviceFee).toFixed(2),
                  additionalFee: '',
                  totalAmount: totalAmount,
                  ...(attachmentFee > 0 && {
                    attachmentFee: {
                      fee: attachmentFee,
                      title: 'Attachment fee'
                    }
                  })
                };
                this.paymentFeeDetails.feeDetails = feeDetails;
              }
            },
            error: () => {
              this.paymentFeeDetails.isError = true;
            }
          });
        return;
      }

      this.paymentFeeDetails.transactionFeeSubscription = this.psbService
        .getTransactionFee(body)
        .pipe(
          finalize(() => {
            this.paymentFeeDetails.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              const serviceFee = Number(res.data);
              const attachmentFee = this.globalAttachmentFee();
              const sameDayFee = res.samedayFee ? Number(res.samedayFee) : 0;
              const totalAmount = Number(paymentDetails.amount) + serviceFee + attachmentFee;

              const feeDetails = {
                originalAmount: Number(paymentDetails.amount).toFixed(2),
                serviceFeeWithoutAdditionalFee: Number(serviceFee).toFixed(2),
                serviceFee: Number(serviceFee).toFixed(2),
                additionalFee: '',
                totalAmount: totalAmount,
                ...(attachmentFee > 0 && {
                  attachmentFee: {
                    fee: attachmentFee,
                    title: 'Attachment fee'
                  }
                }),
                ...(sameDayFee > 0 && {
                  sameDayFee: {
                    title: 'Same day ACH processing fee',
                    fee: sameDayFee
                  }
                })
              };
              this.paymentFeeDetails.feeDetails = feeDetails;
            }
          },
          error: () => {
            this.paymentFeeDetails.isError = true;
          }
        });
    } else {
      this.paymentFeeDetails.isShow = false;
    }
    this.showOrHidePaymentDetailsBar();
  }

  /**
   * @description Handles attachment fee calculation based on attachment IDs
   * @param event - Object containing array of attachment IDs
   */
  getAttachmentFee(event: { ids: string[] }): void {
    if (this.hasValidAttachmentIds(event?.ids)) {
      this.calculateAttachmentFee(event.ids);
    } else {
      this.resetAttachmentFee();
    }
  }

  /**
   * @description Calculates attachment fee for given attachment IDs
   * @param attachmentIds - Array of attachment IDs to calculate fees for
   */
  calculateAttachmentFee(attachmentIds: string[]): void {
    if (!attachmentIds?.length) {
      this.resetAttachmentFee();
      return;
    }

    this.isAttachmentFeeLoading.set(true);

    this.subscriptions.push(
      this.paymentsService.getAttachmentFee(attachmentIds)
        .pipe(
          finalize(() => {
            this.isAttachmentFeeLoading.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res?.success) {
              const attachmentFee = res.data.total_attachment_fee || 0;
              this.globalAttachmentFee.set(attachmentFee);
              
              if (attachmentFee > 0) {
                this.updateFeeDetailsWithAttachmentFee(attachmentFee);
              } else {
                this.resetAttachmentFee();
              }
            }
          },
          error: () => {
            this.resetAttachmentFee();
          }
        })
    );
  }

  /**
   * @description Checks if attachment IDs array is valid and non-empty
   * @param ids - Array of attachment IDs to validate
   * @returns True if valid, false otherwise
   */
  private hasValidAttachmentIds(ids: string[] | undefined): boolean {
    return Array.isArray(ids) && ids.length > 0;
  }

  /**
   * @description Resets attachment fee and recalculates total amount without attachment fee
   */
  private resetAttachmentFee(): void {
    this.globalAttachmentFee.set(0);
    const currentFeeDetails = this.paymentFeeDetails.feeDetails;
    this.paymentFeeDetails.feeDetails = {
      ...currentFeeDetails,
      attachmentFee: undefined,
      totalAmount: this.calculateTotalAmountWithoutAttachment(currentFeeDetails)
    } as IPaymentFeeDetails;
  }

  /**
   * @description Updates fee details with attachment fee and recalculates total amount
   * @param attachmentFeeAmount - The attachment fee amount to add
   */
  private updateFeeDetailsWithAttachmentFee(attachmentFeeAmount: number): void {
    const currentFeeDetails = this.paymentFeeDetails.feeDetails;
    
    this.paymentFeeDetails.feeDetails = {
      ...currentFeeDetails,
      attachmentFee: {
        fee: attachmentFeeAmount,
        title: 'Attachment fee'
      },
      totalAmount: this.calculateTotalAmountWithAttachment(currentFeeDetails, attachmentFeeAmount)
    } as IPaymentFeeDetails;
  }

  /**
   * @description Gets the current global attachment fee value
   * @returns The current attachment fee amount
   */
  getGlobalAttachmentFee(): number {
    return this.globalAttachmentFee();
  }

  /**
   * @description Calculates total amount without attachment fee
   * @param feeDetails - Current fee details object
   * @returns Total amount excluding attachment fee
   */
  private calculateTotalAmountWithoutAttachment(feeDetails: IPaymentFeeDetails | undefined): number {
    return Number(feeDetails?.originalAmount || 0) + 
           Number(feeDetails?.serviceFee || 0) + 
           Number(feeDetails?.additionalFee || 0);
  }

  /**
   * @description Calculates total amount including attachment fee
   * @param feeDetails - Current fee details object
   * @param attachmentFeeAmount - Attachment fee amount to add
   * @returns Total amount including attachment fee
   */
  private calculateTotalAmountWithAttachment(feeDetails: IPaymentFeeDetails | undefined, attachmentFeeAmount: number): number {
    return this.calculateTotalAmountWithoutAttachment(feeDetails) + Number(attachmentFeeAmount || 0);
  }

  /**
   * @description Opens raise card limit modal.
   */
  openRaiseLimitModal() {
    this.dialog.open(RaiseMyLimitModalComponent, {
      width: '383px',
      height: '398px',
      disableClose: true
    });
  }

  /**
   * @description Opens blank check modal.
   */
  openBlankCheckModal(): void {
    this.dialog.open(BlankCheckModalComponent, {
      maxWidth: '450px',
      width: '93%',
      autoFocus: false,
      data: { hideDemoVideo: true }
    });
  }

  /**
   * @description Navigates to multiple check page.
   */
  goToMultipleCheck(): void {
    this.router.navigate(['/manage/cheque/multiplecheck/create']);
  }

  /**
   * @description Navigates to group check page.
   */
  goToGroupCheck(): void {
    this.router.navigate(['/manage/cheque/group/index']);
  }

  /**
   * @description Navigates to multiple check import page.
   */
  openImportCheckModal(): void {
    this.router.navigate(['/manage/cheque/multi_import/step1']);
  }

  /**
   * @description Method to crate masked account number.
   * @param acNo - Non masked account number.
   * @returns Account number, masked if given conditions are satisfied, else unmodified value.
   */
  getMaskedAcNo(acNo: string): string {
    if (acNo && acNo.length >= 4) {
      return `*****${acNo.slice(-4)}`;
    }
    return acNo;
  }

  /**
   * @description Updates export options
   * @param event - Payment export options.
   */
  updateExportOptions(event: IPaymentExportsOptions) {
    this.exportOptions = event;
  }

  /**
   * @description Sets QuickBooks Online export data.
   * @param event -  QuickNooks Online export data.
   */
  quickBooksOnlineExportSave(event: IQBOExportsData) {
    this.QBOExportData = event;
  }

  /**
   * @description Sets QuickBooks Desktop export data.
   * @param event -  QuickNooks Desktop export data.
   */
  quickBooksDesktopExportSave(event: IQBDExportsData) {
    this.QBDExportData = event;
  }

  /**
   * @description Sets FreshBooks export data.
   * @param event -  FreshBooks export data.
   */
  freshBooksExportSave(event: IFreshBookExportsData) {
    this.FreshBooksExportData = event;
  }

  /**
   * @description Sets NetSuite export data.
   * @param event -  NetSuite export data.
   */
  netSuitepExportSave(event: INetSuiteExportsData) {
    this.netSuiteExportData = event;
  }

  /**
   * @description Opens support window.
   */
  openSupport() {
    if (StaticWhiteLabelConditions.zohoSupportChat) {
      window.open(StaticWhiteLabelConditions.zohoSupportChat, '_blank');
    } else {
      window.open(StaticWhiteLabelConditions?.helpWebsite, '_blank');
    }
  }

  /**
   * @description Method to reset payment item to last selected item or default item,
   * if needed for cases when unavailable payment methods are selected from ng select.
   * Delay is given to override default ng select item selection.
   * @param type - Type of payment method.
   */
  async resetPaymentMethods(
    type: 'payFrom' | 'payAs' | 'receiveTo' | 'receiveFrom'
  ) {
    await firstValueFrom(of(1).pipe(delay(10)));
    if (type === 'payFrom') {
      this.selectedPayFromNgModel = this.selectedPayFromItem;
    } else if (type === 'payAs') {
      if(this.selectedPayAsItem?.id === 'same-ach' && this.selectedPayFromItem?.id === 'card'){
        this.selectedPayAsNgModel = this.payAsItems.find((payAsItem) => payAsItem.id === 'ach');
      }else{
        this.selectedPayAsNgModel = this.selectedPayAsItem;
      }
    } else if (type === 'receiveTo') {
      this.selectedReceiveToNgModel = this.selectedReceiveToItem;
    } else if (type === 'receiveFrom') {
      this.selectedReceiveFromNgModel = this.selectedReceiveFromItem;
    }
  }

  /**
   * @description Method invoked when tabs are toggled in notification bar. The same tabs are also created in `home component`, since notification section is part of `home component` and payment details section is part of `payments-main component`. Please make sure the logic and styles are in sync in both places.
   * @param tab - `new` - Notification section from home component. `details` - Payment details from payments-main component.
   */
  toggleNotificationTab(tab: 'new' | 'details') {
    if (tab === 'new') {
      this.isShowPaymentDetail = false;
      this.payeeDetailsOpen.emit({ open: false, tabSwitch: true });
    } else if (tab === 'details') {
      this.isShowPaymentDetail = true;
      this.payeeDetailsOpen.emit({ open: true, tabSwitch: true });
    }
  }

  /**
   * @description Emits debit card details and updates the `debitCardDetails` property.
   *
   * @param event - The debit card details to be emitted.
   */
  emitDebitCardDetails(event: IDebitCardDetails): void {
    this.isClickDisabled = false;
    this.debitCardDetails = event;
  }

  /**
   * @description Sets `isClickDisabled` to true and triggers the edit of debit card details
   * through the `editDebitCardDetails$` observable in the `sharedService`.
   *
   */
  editCardDetails(): void {
    this.isClickDisabled = true;
    this.sharedService.editDebitCardDetails$.next(true);
  }

  /**
   * @description Method to navigate back to the previous page or to the provided url - `backUrl`.
   */
  goBack() {
    if (this.backUrl) {
      this.router.navigate([this.backUrl]);
    } else {
      this.location.back();
    }
  }

  /**
   * @description Method for ngFor trackBy.
   * @param index - Index.
   * @param item - Item to track.
   * @returns Index.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackById(index: number, item: any) {
    return item.id;
  }

  /**
   * @description Show and hide the QRCode in right panel of payments page.
   * @param qrData Contain QR information.
   */
  onShowQrCode(qrData: { qrCode: string; bank: string; paymentId: string }) {
    if (qrData?.qrCode) {
      this.qrCodeLink = qrData.qrCode;
      this.selectedBank = qrData.bank;
      this.getPaymentId = qrData.paymentId;
      this.isScanQRCode = true;
      this.scaning = true;
      this.showOrHidePaymentDetailsBar();
      setTimeout(() => {
        this.scaning = false;
      }, 2000);
    } else {
      this.isScanQRCode = false;
      this.showOrHidePaymentDetailsBar();
    }
  }

  /**
   * @description Used to print Qrcode of payment link.
   */
  printQRCode() {
    this.isPrintQRCode = true;
    this.subscriptions.push(
      this.paymentLinkService
        .getPrintPaymentLink(this.getPaymentId)
        .pipe(
          finalize(() => {
            this.isPrintQRCode = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const iframes = document.querySelectorAll('iframe');
            for (const item of iframes) {
              if (item.id?.includes('print-iframe')) {
                item?.parentNode?.removeChild(item);
              }
            }
            const iframe = document.createElement('iframe');
            iframe.id = 'reqpay-print-iframe';
            iframe.srcdoc = res.data.printData;
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
          }
        })
    );
  }

  getCloudAccount() {
    this.subscriptions.push(
      this.cloudListV35Service.selectedAccount.subscribe(() => {
        this.showOrHidePaymentDetailsBar();
      })
    );
  }

  turnOffCardToast() {
    this.showCreditCardToast = false;
  }

  chooseCreditCard() {
    this.clickTrackingService.onTrackNow();
    const card = this.payFromItems.find((el) => el.id === 'card');
    if (!card) return;

    const payAsItem = card.payOptions?.find(
      (el) => el.id === this.selectedPayAsItem?.id
    );

    this.payFromSelected(card, payAsItem);
  }

  /**
   * @method observeUserData
   * @description Observes and processes user data from various services.
   * @returns {void}
   */
  observeUserData(): void {
    // Get header data
    this.subscriptions.push(
      this.headerService._headerData
        .pipe(filter((data): data is IHeaderData => data !== false))
        .subscribe({
          next: (headerData: IHeaderData) => {
            this.isSubscribed = !!headerData.isSubscribed;
            this.newUser.set(headerData.isNewUserForKycCreditCard);
            this.cardMaintenanceMessage = headerData.cardPaymentMaintananceMessage || '';
            this.isApprovalPolicyEnabled.set(headerData.managedPartner?.approvalPolicy === 1);
            // Get user verification data
            this.userProfileService.UserVerification$.pipe().subscribe({
              next: (verificationData) => {
                this.isUserAllowedToMakePayment();
                // Update values only if newUser is 1
                if (this.newUser() === 1) {
                  // Update isUserVerified
                  if (
                    verificationData.email_verified === 1 &&
                    verificationData.phone_verified === 1
                  ) {
                    this.isUserVerified.set(true);
                  } else {
                    this.isUserVerified.set(false);
                  }
                }
                this.showCreditCardEnableBanner();
              }
            });
          }
        })
    );
  }

  showCreditCardEnableBanner() {
    if (
      this.selectedPayFromItem?.id === 'card' &&
      (this.userKycStatus() === null ||
        this.userKycStatus() === 3 ||
        this.userKycStatus() === 1)
    ) {
      this.showBanner.set(true);
    } else {
      this.showBanner.set(false);
    }
  }

  openKycModal() {
    if (this.isUserVerified()) {
      if (environment.isV4Persona) {
        this.personaHelperService
          .openModal('kyc', CVSourceType.credit_card)
          .subscribe((res) => {
            if (res?.data?.inquiry_id) {
              this.userKycStatus.set(1);
              this.showBanner.set(false);
              this.isKycDoneFromCard.emit({ success: true });
            }
          });
      } else {
        this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
      }
    } else {
      this.verifyEmailAndMobile();
    }
  }

  openKycModalRtp() {
    if (this.isUserVerified()) {
      if (environment.isV4Persona) {
        this.personaHelperService
          .openModal('kyc', CVSourceType.credit_card, true)
          .subscribe((res) => {
            if (res?.data?.inquiry_id) {
              this.userKycStatus.set(1);
              this.showBanner.set(false);
              this.isKycDoneFromCard.emit({ success: true });
            }
          });
      } else {
        this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
      }
    } else {
      this.verifyEmailAndMobile();
    }
  }

  verifyEmailAndMobile() {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: { returnUrl: this.router.url }
        });
      }
    });
  }

  openChat() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  suggestFeedback() {
    this.dialog.open(SuggestFeedbackComponent, {
      maxWidth: '100%',
      disableClose: true
    });
  }

  goToSubscription() {
    this.reduceMyFeeLoading.update(() => true);
    this.router.navigate(['manage', 'subscription', 'plan'], {
      state: {
        returnUrl: this.router.url
      },
      queryParams: {
        type: 'cc'
      }
    });
  }

  verifyNow(): void {
    this.localStorageService.setItem('verificationStep', 'check');
    this.router.navigateByUrl('manage/verification/steps');
  }

  enableNetsuiteExport(isEnabled: boolean) {
    this.isNetsuiteExportEnabled.set(isEnabled);
  }

  private getCachedCountriesData() {
    try {
      const cached = this.localStorageService.getItem(this.COUNTRIES_BUSINESS_CACHE_KEY);
      if (!cached) return null;

      const parsedCache = JSON.parse(cached);
      return parsedCache;
    } catch (error) {
      return null;
    }
  }

  // Country code of the selected international bank (from beneficiary bank details).
  private getInterBankCountryCode(): string {
    return this.payeeAllData?.payeeInterBankData?.beneficiaryBankDetails?.country ?? '';
  }

  // India doesn't use bank identifier type/code (IFSC is used instead).
  private isIndiaInterBank(): boolean {
    return this.getInterBankCountryCode() === 'IN';
  }

  // European/IBAN countries: no account number or bank identifier; IBAN is shown instead.
  private isIbanInterBank(): boolean {
    const code = this.getInterBankCountryCode();
    if (!code) return false;
    const countries = (this.getCachedCountriesData() ?? {}) as ICountriesCache;
    const country = Object.values(countries).find(
      (c: IInternationalCountry) => c.countryCode === code
    );
    return country?.iban === 1;
  }

  private checkAndFetchCountries() {
    // Archarina check before cache check
    if (this.isArcharina) {
      // Set empty or minimal data in cache
      const emptyCountriesData = {};
      this.localStorageService.setItem(
        this.COUNTRIES_BUSINESS_CACHE_KEY,
        JSON.stringify(emptyCountriesData)
      );
      return;
    }

    const cachedData = this.getCachedCountriesData();
    if (cachedData) {
      return;
    }
    // Fetch countries if not cached
    this.subscriptions.push(
      this.paymentsService
      .enabledInternationalPaymentCountries()
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.localStorageService.setItem(this.COUNTRIES_BUSINESS_CACHE_KEY, JSON.stringify(res.data));
          }
        },
        error: () =>  null
      })
    );
  }
  
  openTextToSpeech() {
    this.dialog.open(SpeechToTextComponent, {
      maxWidth: '100%',
      width: '400px',
      disableClose: true
    }).afterClosed().subscribe((res) => {
      if (res.success) {
        this.populatePaymentFormWithOcrData(res.data);
      }
    });
  }

  openOcrModal() {
    this.dialog.open(OpticalRecognitionModalComponent, {
      maxWidth: '100%',
      width: '500px',
      disableClose: true
    }).afterClosed().subscribe((res) => {
      if (res) {
        this.populatePaymentFormWithOcrData(res);
      }
    });
  }

  /**
   * @description Populate payment form with OCR data
   */
  private populatePaymentFormWithOcrData(ocrData: PayeeCreationResult) {
    if (!ocrData) return;

    const amount = ocrData.amount;
    this.config.paymentFormValue = {
      ...this.config.paymentFormValue,
      amount: amount,
      memo: ocrData.memo,
      issueDate: this.datePipe.transform(ocrData.date, 'yyyy-MM-dd')
      
    };

    this.config.memo = ocrData.memo;

    const payeeData: Partial<IPayeeDropdown> = {
      id: ocrData.payeeId ?? '',
      name: ocrData.payeeName ?? '',
      email: ocrData.payeeEmail ?? undefined,
      phone: ocrData.payeePhone ?? undefined,
      addressLine1: ocrData.payeeAddress ?? undefined,
      city: ocrData.payeeCity ?? undefined,
      state: ocrData.payeeState ?? undefined,
      zip: ocrData.payeeZipCode ?? undefined,
      country: ocrData.payeeCountry ?? undefined
    };
    

    const hasValidPayeeData = payeeData.id && payeeData.name;

    this.config.paymentFormValue.payee = hasValidPayeeData ? payeeData as IPayeeDropdown : undefined;
    this.config.paymentFormValue.payeeEmail = payeeData.email ?? undefined;

    this.changedDetails = hasValidPayeeData ? { selectedPayeeDetails: payeeData as IPayeeDropdown } : undefined;

    if (hasValidPayeeData) {
      const payeeDetailsEvent: IPayeeDetailsEvent = {
        payeeDropdownDetails: payeeData as IPayeeDropdown,
        payeeBankDetails: null,
        isMoreDetailsLoading: false
      };

      this.onPayeeDetails(payeeDetailsEvent);
    }


    this.config = { ...this.config };
  }

  getPayFromItems() {
    if(this.env.env_id === 'csnhc') {
      const bankCheckOptions = PaymentData.getCompassPayFromItems()
      .map(item => ({
        ...item,
        payOptions: item.payOptions?.filter(option => option.id === 'check')
      }))
      .filter(item => item.payOptions && item.payOptions.length > 0);
      
      return bankCheckOptions;
    } 
    if(this.env.env_id === 'compass') {
      return PaymentData.getCompassPayFromItems();
    }
    return PaymentData.getPayFromItems();
  }


  ngOnDestroy(): void {
    // Track when the credit card promoting toast is clicked and the no payment is done.
    this.clickTrackingService
      .ccToastClickedNoPaymentDone()
      ?.pipe(take(1))
      .subscribe();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.paymentsService.hasAmount.update(() => false);
    this.userKycStatus.set(undefined);
  }
}
