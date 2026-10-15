import {
  Injectable,
  OnDestroy,
  computed,
  inject,
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, filter, finalize } from 'rxjs';
import { IHeaderData } from 'src/app/layout/model/header';
import { SelectBusinessComponent } from 'src/app/modules/bank/bank-v2/modals/select-business/select-business.component';
import {
  ISelectBizData,
  CVSourceType,
  IActionLoaderData
} from 'src/app/modules/common-verification/model/common-verification';
import { AddBillModalComponent } from 'src/app/modules/bill/modals/add-bill-modal/add-bill-modal.component';
import { BlankCheckModalComponent } from 'src/app/modules/check/components/create-blank-check-modal/blank-check-modal.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { AddInvoiceComponent } from 'src/app/modules/invoices/modals/add-invoice/add-invoice.component';
import { BookADemoComponent } from 'src/app/modules/user-support/modals/book-a-demo/book-a-demo.component';
import { NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FundYourWalletV35Component } from 'src/app/modules/wallet/wallet-v3/modals-v35/fund-your-wallet-v35/fund-your-wallet-v35.component';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { UploadDocumentModalComponent } from 'src/app/modules/business-tools/document-mail/components/upload-document-modal/upload-document-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { LoomService } from 'src/app/modules/loom-video/loom/service/loom.service';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { PaymentData } from 'src/app/modules/payments/shared/components/payments-main-v35/payments-data-v35';
import {
  ICardPaymentReqDocRes,
  IPayFromItem
} from 'src/app/modules/payments/model/payments';
import { IBusinessDetails } from 'src/app/models/bank';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import {
  IPayeeDropdown,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  VerifyCardModalComponent,
  IVerifyCardInvoiceDialogData
} from 'src/app/modules/payments/shared/components/modals/verify-card-modal/verify-card-modal.component';
import { IBusinessTools } from 'src/app/modules/business-tools/model/business-tools';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { VerifyCardModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/verify-card-modal/verify-card-modal-v4.component';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { EmailPhoneVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/email-phone-verification-modal-v4/email-phone-verification-modal-v4.component';
import { TrailPeriodAlertModalComponent } from 'src/app/modules/trial-period-alert/modals/trail-period-alert-modal/trail-period-alert-modal.component';
import { TrailPeriodAlertModalV4Component } from 'src/app/modules/trial-period-alert/modals/trail-period-alert-modal-v4/trail-period-alert-modal-v4.component';
import { TrialPeriodOfferModalComponent } from 'src/app/modules/trial-period-alert/modals/trial-period-offer-modal/trial-period-offer-modal.component';
import { TrialPeriodOfferModalV4Component } from 'src/app/modules/trial-period-alert/modals/trial-period-offer-modal-v4/trial-period-offer-modal-v4.component';
import { Utils } from '../../../data/utils';
import { LocalStorageService } from '../storage/local-storage.service';
import { CommonVerificationService } from '../common/common-verification.service';
import { LoaderModalComponent } from '../../modal/loader-modal/loader-modal.component';
import { PayeeService } from '../payee/payee.service';
import * as LayoutActions from '../../../layout/v3-layout/state/layout.actions';
import { DataTableService } from '../data-table/data-table.service';
import { AlertService } from '../alert/alert.service';
import { V4AlertService } from '../alert/v4-alert.service';
import { NewUserModalLatestComponent } from '../../modal/user-modal/new-user-modal-latest/new-user-modal-latest.component';
import { FeatureRequestModalComponent } from '../../modal/feature-request-modal/feature-request-modal.component';
import { HeaderService } from '../header/header.service';
import { BusinessToolsService } from '../business-tools/business-tools.service';
import { TextUsComponent } from '../../modal/text-us/text-us.component';
import { PayeeModalService } from '../payee-modal/payee-modal.service';
import { BankModalService } from '../../bank-modal/service/bank-modal.service';
import { UserService } from '../user/user.service';
import { PositivePayService } from '../positive-pay/positive-pay.service';

@Injectable({
  providedIn: 'root'
})
export class CommonOnInitService implements OnDestroy {
  private headerService = inject(HeaderService);
  private verificationService = inject(CommonVerificationService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private dataTableService = inject(DataTableService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private store = inject(Store);
  private payeeService = inject(PayeeService);
  private bankDataService = inject(BankDataV35Service);
  private bankModalService = inject(BankModalService);
  private loomService = inject(LoomService);
  private v3DataTableService = inject(V3DataTableService);
  private cardsDataService = inject(CardsDataServiceService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private businessToolsService = inject(BusinessToolsService);
  private payeeModalService = inject(PayeeModalService);
  private userService = inject(UserService);
  private positivePayService = inject(PositivePayService);
  private gettingStartedService = inject(GettingStartedService);
  private destroyRef = inject(DestroyRef);

  utils = Utils;

  loading = signal(false);

  isV4LayoutEnabled = signal(
    this.localStorageService.getItem('isV4LayoutEnabled') === 1
  );

  private get alert() {
    return this.isV4LayoutEnabled() ? this.v4AlertService : this.alertService;
  }

  payFromItems: IPayFromItem[] = this.utils.deepCopy(
    PaymentData.getPayFromItems()
  );

  subscriptions: Subscription[] = [];
  kycLoading = false;
  kycKybStatus: { kycStatus: number; kybStatus: number };
  demoVideos: string;

  currentTab = computed(() => this.cardsDataService.cardsData().currentTab);

  onInitFunctions() {
    this.triggerAchModal();
    this.syncV4FlagWithRoute();
  }

  /**
   * Keeps `isV4LayoutEnabled` aligned with the active layout route so services
   * branching on the flag stay consistent with what the user is actually
   * viewing (deeplinks, manual URL edits, browser back, etc.).
   */
  syncV4FlagWithRoute(): void {
    this.subscriptions.push(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((event) => {
          const version = this.getLayoutVersionFromUrl(event.urlAfterRedirects);
          if (!version) return;
          const desired = version === 'v4' ? 1 : 0;
          if (
            this.localStorageService.getItem('isV4LayoutEnabled') !== desired
          ) {
            this.localStorageService.setItem('isV4LayoutEnabled', desired);
            this.isV4LayoutEnabled.set(desired === 1);
          }
        })
    );
  }

  private getLayoutVersionFromUrl(url: string): 'v3' | 'v4' | null {
    const path = url.split('?')[0].split('#')[0];
    if (path.startsWith('/v4/manage/')) return 'v4';
    // company_management serves a V4 component at a /manage/ URL (flag-driven
    // switch) and onboarding has no /v4/ variant — both are reached by V4
    // users, so the /manage/ prefix isn't an authoritative layout signal here.
    if (
      path.startsWith('/manage/company_management')
    ) {
      return null;
    }
    if (path.startsWith('/manage/')) return 'v3';
    return null;
  }

  /**
   * @description Listens for the trigger event and call the user business api.
   */
  triggerAchModal() {
    this.subscriptions.push(
      this.headerService.triggerApplyForachModal$.subscribe((res) => {
        if (res) {
          this.getBusinesses();
        }
      })
    );
  }

  /**
   * @description Retrieves the user's businesses and selects a business based on the response.
   */
  getBusinesses() {
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(
          finalize(() => {
            this.kycLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.selectBusiness(res.data);
          }
        })
    );
  }

  /**
   * @description Opens a dialog to select a business and handles the result.
   * @param businessDetails The details of the business to be selected.
   */
  selectBusiness(businessDetails: IBusinessDetails[]) {
    const dialog = this.dialog.open<SelectBusinessComponent, ISelectBizData>(
      SelectBusinessComponent,
      {
        width: '450px',
        maxWidth: '95%',
        data: {
          applyACH: true,
          applicationStatus: this.kycKybStatus,
          isShowBankDropDown: true,
          sourceType: CVSourceType.ACH,
          bankData: { businessDetails }
        }
      }
    );
    dialog
      .afterClosed()
      .subscribe((res: { businessId: string; bankAccountId: string }) => {
        if (res?.businessId && res?.bankAccountId) {
          this.openLoaderModal(res.businessId, res.bankAccountId);
        }
      });
  }

  /**
   * @description Opens a loader modal to display a loading indicator while performing an action.
   * @param {string} businessId - The ID of the selected business.
   * @param {string} bankAccountId - The ID of the selected bank account.
   */
  openLoaderModal(businessId: string, bankAccountId: string) {
    this.dialog.open<LoaderModalComponent, IActionLoaderData>(
      LoaderModalComponent,
      {
        maxWidth: '400px',
        width: '80%',
        minHeight: '200px',
        height: 'unset',
        disableClose: true,
        data: { type: { ach: { businessId, bankAccountId } } }
      }
    );
  }

  /**
   * @description Open tutorial in youtube.
   */
  onVideoTutorial() {
    window.open(
      'https://www.youtube.com/channel/UC4rjiWXUxv-6V4drscMQDwA',
      '_blank'
    );
  }

  /**
   * @description Open the Feature request modal.
   */
  onFeatureRequest() {
    this.dialog.open(FeatureRequestModalComponent, {
      maxWidth: '100%'
    });
    this.loomService.loomVideos = [];
  }

  /**
   * @description Open the text us modal.
   */
  onTextUs() {
    this.dialog.open(TextUsComponent, {
      maxWidth: '100%'
    });
    this.loomService.loomVideos = [];
  }

  /**
   * @description Handles the action of opening the help tutorial.
   */
  onHelpTutorial() {
    /**
     * Opens the support website in a new browser tab.
     * @param {string} DynamicWhiteLabelService.supportWebsite - The URL of the support website.
     */
    window.open(StaticWhiteLabelConditions.supportWebsite, '_blank');
  }

  /**
   * @description  Handles the action of opening the "Book a Demo" section.
   */
  onDemoSection() {
    this.dialog.open(BookADemoComponent, {
      maxWidth: '800px',
      width: ' 100%',
      disableClose: true,
      panelClass: 'paddingless-modal'
    });
  }

  /**
   * @description Opens the instant demo in a new browser tab.
   * @param {string} url instant demo url.
   */
  openOutside(url: string | undefined) {
    window.open(url);
  }

  /**
   * @description Navigates to a specific route.
   * @param {string | undefined} link - The link or route to navigate to.
   */
  navigateToRoute(link: string | undefined, extras?: NavigationExtras) {
    this.router.navigate([link], extras);
  }

  /**
   * @description Opens the invoice modal.
   */
  openInvoiceModal() {
    this.router.navigate(['/manage/invoice']);
    const dialogRef = this.dialog.open(AddInvoiceComponent, {
      maxWidth: '1010px',
      width: '93%',
      maxHeight: '80%'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success)
        /**
         * Sets the refresh status of the data table.
         * @param {boolean} true - The refresh status value.
         */
        this.dataTableService.setRefreshStatus(true);
    });
  }

  /**
   * @description Opens the bill modal.
   */
  openBillModal() {
    this.router.navigate(['/manage/bill']);
    const dialogRef = this.dialog.open(AddBillModalComponent, {
      // open modal
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: { mode: 'new' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.alert.successAlert({ content: 'Bill succesfully added' });
        this.dataTableService.setRefreshStatus(true);
      } else if (result?.success === false) {
        this.alert.failedAlert({ content: result?.errorMsg });
      }
    });
  }

  /**
   * @description Opens the blank check modal.
   */
  openBlankCheckModal() {
    this.router.navigate(['/manage/cheque/checkrecords']);
    const dialogRef = this.dialog.open(BlankCheckModalComponent, {
      maxWidth: '450px',
      width: '93%',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   * @description Opens the add payee modal.
   */
  openAddPayeeModal() {
    this.router.navigate(['/manage/payees']);
    this.subscriptions.push(
      this.payeeModalService.openAddPayee().subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(
            payeeModal.afterClosed().subscribe((modalRes) => {
              if (modalRes?.success) {
                this.payeeService.setNewPayee(modalRes);
                this.dataTableService.setRefreshStatus(true);
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description Opens the add payee modal.
   */
  openBankAccountModal() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.bankDataService.setNewBank();
                this.dataTableService.setRefreshStatus(true);
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description opens the New user modal.
   */
  openUserModal() {
    const dialogRef = this.dialog.open(NewUserModalLatestComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   * @description Opens the fund wallet modal.
   */
  openFundYourWalletModal() {
    this.router.navigate(['/manage/wallet/transactions']);
    this.dialog.open(FundYourWalletV35Component, {
      width: '722px',
      maxWidth: '93%',
      disableClose: true
    });
  }

  /** trial period section start */

  /**
   * @description Determines whether to show the trail period over modal based on the provided key.
   * @param {string} key - The key used to store the information in the local storage.
   * @returns {boolean} - Returns true if the trail period over modal should be shown, or false otherwise.
   */
  showTrailPeroidOverModal(key: LocalStorageKeys): boolean {
    const newDate = new Date();
    const date = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDay()}`;
    const shown = this.localStorageService.getItem(key)
      ? this.localStorageService.getItem(key)
      : null;

    if (
      date === shown?.date &&
      this.localStorageService.getItem('activeCompanyId') ===
        shown?.activeCompanyId
    ) {
      return false;
    }
    return true;
  }

  /**
   * @description Opens the trial period over modal.
   */
  openTrialPeriodOverModal() {
    if (this.localStorageService.getItem('showTrialOverAlertShown') === '1') {
      return;
    }
    this.localStorageService.setItem('showTrialOverAlertShown', '1');

    const newDate = new Date();
    const date = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDay()}`;
    const activeCompanyId = this.localStorageService.getItem('activeCompanyId');
    this.localStorageService.setItem('showTrialOver', {
      date,
      activeCompanyId
    });
    this.headerService.enqueueModal('TrailPeriodAlertModalComponent');
    this.subscriptions.push(
      this.headerService.modalQueue$.subscribe((modalQueue) => {
        if (
          modalQueue.length &&
          modalQueue[0].modal === 'TrailPeriodAlertModalComponent' &&
          !modalQueue[0].wasOpened
        ) {
          this.headerService.updateModalStatus();
          const dialog = this.dialog.open(TrailPeriodAlertModalComponent, {
            width: '500px',
            maxWidth: '95%',
            height: 'auto',
            disableClose: true,
            autoFocus: false
          });
          dialog.afterClosed().subscribe(() => {
            this.headerService.dequeueModal();
          });
        }
      })
    );
  }

  /**
   * @description Opens the V4 trial period over modal.
   */
  openTrialPeriodOverModalV4() {
    if (this.localStorageService.getItem('showTrialOverAlertShown') === '1') {
      return;
    }
    this.localStorageService.setItem('showTrialOverAlertShown', '1');

    const newDate = new Date();
    const date = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDay()}`;
    const activeCompanyId = this.localStorageService.getItem('activeCompanyId');
    this.localStorageService.setItem('showTrialOver', {
      date,
      activeCompanyId
    });
    this.headerService.enqueueModal('TrailPeriodAlertModalV4Component');
    this.subscriptions.push(
      this.headerService.modalQueue$.subscribe((modalQueue) => {
        if (
          modalQueue.length &&
          modalQueue[0].modal === 'TrailPeriodAlertModalV4Component' &&
          !modalQueue[0].wasOpened
        ) {
          this.headerService.updateModalStatus();
          const dialog = this.dialog.open(TrailPeriodAlertModalV4Component, {
            width: '500px',
            maxWidth: '95%',
            height: 'auto',
            panelClass: 'paddingless-modal-rounded',
            disableClose: true,
            autoFocus: false
          });
          dialog.afterClosed().subscribe(() => {
            this.headerService.dequeueModal();
          });
        }
      })
    );
  }

  /**
   * @description Opens the trial period offer alert modal.
   *
   *  sets the `showTrialOffer` value in the local storage to indicate that the trial period offer modal has been shown.
   * @param remainingDays The number of remaining days in the trial period.
   */
  openTrialPeriodOfferAlertModal(remainingDays: number) {
    const newDate = new Date();
    const date = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDay()}`;
    const activeCompanyId = this.localStorageService.getItem('activeCompanyId');
    this.localStorageService.setItem('showTrialOffer', {
      date,
      activeCompanyId
    });
    this.headerService.enqueueModal('TrialPeriodOfferModal');
    this.subscriptions.push(
      this.headerService.modalQueue$.subscribe((modalQueue) => {
        if (
          modalQueue.length &&
          modalQueue[0].modal === 'TrialPeriodOfferModal' &&
          !modalQueue[0].wasOpened
        ) {
          this.headerService.updateModalStatus();
          const dialog = this.dialog.open(TrialPeriodOfferModalComponent, {
            width: '550px',
            maxWidth: '95%',
            height: 'auto',
            data: { remainingDays },
            disableClose: true
          });
          dialog.afterClosed().subscribe(() => {
            this.headerService.dequeueModal();
          });
        }
      })
    );
  }
  openTrialPeriodOfferAlertModalV4(remainingDays: number) {
    const newDate = new Date();
    const date = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDay()}`;
    const activeCompanyId = this.localStorageService.getItem('activeCompanyId');
    this.localStorageService.setItem('showTrialOffer', {
      date,
      activeCompanyId
    });
    this.headerService.enqueueModal('TrialPeriodOfferModal');
    this.subscriptions.push(
      this.headerService.modalQueue$.subscribe((modalQueue) => {
        if (
          modalQueue.length &&
          modalQueue[0].modal === 'TrialPeriodOfferModal' &&
          !modalQueue[0].wasOpened
        ) {
          this.headerService.updateModalStatus();
          const dialog = this.dialog.open(TrialPeriodOfferModalV4Component, {
            width: '550px',
            maxWidth: '95%',
            height: 'auto',
            panelClass: 'paddingless-modal-rounded',
            data: { remainingDays },
            disableClose: true
          });
          dialog.afterClosed().subscribe(() => {
            this.headerService.dequeueModal();
          });
        }
      })
    );
  }
  /** trial period section end */

  /**
   * @description Store data received from header to ngrx store
   * @param headerData : from api call in header service
   * @param profilePic : from v3 header component
   */
  storeHeaderDataInNgrx(headerData: IHeaderData, profilePic: string) {
    this.store.dispatch(
      LayoutActions.storeVariables({
        emailVerified: headerData?.userInfo?.email_verified,
        phoneVerified: headerData?.userInfo?.phone_verified,
        activeCompanyName: headerData?.allCompanies?.activeCompanyName,
        achEnabled: headerData?.achEnabled,
        internationalPaymentEnabled: headerData.internationalPaymentEnabled,
        pingPongEnabled: headerData.pingpongEnabled,
        email: headerData.personalInfo?.email,
        userId: headerData.userInfo.userId,
        phone: headerData.personalInfo.phone,
        encryptedUserId: headerData.userInfo.encrypted_id,
        isSubscribed: headerData.isSubscribed,
        companyName: headerData.BusinessInfo.companyName,
        profilePicLink: profilePic ?? ''
      })
    );
  }

  uploadMailDocuments() {
    this.router.navigate(['/manage/business-tools/document-mail']);
    const dialogRef = this.dialog.open(UploadDocumentModalComponent, {
      disableClose: true,
      width: '650px'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        // this.payeeService.setNewPayee(res);
        this.dataTableService.setRefreshStatus(true);
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  addNewCreditCard() {
    this.cardsDataService.openAddNewModal(this.currentTab());
  }

  /**
   * Method to check that user have permission for shipping label
   */
  goToShippingLabel() {
    this.subscriptions.push(
      this.businessToolsService.getBusinessTools().subscribe((res) => {
        const shippingLabel = res?.find(
          (item: IBusinessTools) => item.product_name === 'Shipping Label'
        );
        if (
          shippingLabel.applicationStatus === 0 &&
          shippingLabel.isApprovalRequired === 1
        ) {
          this.contactAlert(
            'You are not eligible for this feature. Please contact support for more information.'
          );
        } else {
          this.router.navigate([
            '/manage/business-tools/shipping-label/quick-label'
          ]);
        }
      })
    );
  }

  setAch() {}

  /**
   * @description Checks if the customer Brayan Cohen based on enabledPlugins.
   * @returns {boolean} Returns true if the customer Brayan Cohen is enabled, otherwise false.
   */
  isBrayanCohenCustomer(): boolean {
    let isEnable = false;
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes('enterprise-bryancohen')) {
            isEnable = true;
          } else {
            isEnable = false;
          }
        }
      })
    );
    return isEnable;
  }

  /**
   * @description Displays a contact alert message and prompts the user to contact customer support.
   * @param {string} [msg] - Optional message to display in the contact alert. If not provided, a default message will be shown.
   */
  contactAlert(msg?: string): void {
    const data = {
      content:
        msg ?? 'Please contact our customer support to enable this feature.',
      isOk: true,
      isCancel: true,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now'
    };
    const dialog = this.alert.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  /**
   * @description We call this function when there is a payment to be made by cards. in the modal, we collecting required documents,
   * submitting it to backend and getting response and we returning that response throgh this function.
   * this funciton is called in v3 card payment components ,psb payment components, and new check component.
   * wrote this function in service since this is common for all.
   * @param card - Entire existing card object
   * @param amount - payment amount
   * @param requiredDocuments - required documents, either invoice or both card and invoice.
   * @returns - dialogRef
   */
  openVerifyCardInvoiceModal(
    card: IExistingCreditCards,
    amount: string,
    mode: string,
    invoiceNumber: string,
    requiredDocuments: ['invoice'?, 'card'?, 'authDoc'?],
    payee?: IPayeeDropdown | IViewPayee,
    paymentType?: string,
    isSameDay?: number
  ) {
    return this.dialog.open<
      VerifyCardModalComponent,
      IVerifyCardInvoiceDialogData,
      { success: boolean; data: ICardPaymentReqDocRes; authSign?: string }
    >(VerifyCardModalComponent, {
      width: '528px',
      minHeight: '583px',
      disableClose: true,
      data: {
        card,
        requiredDocuments,
        amount,
        payee,
        invoiceNumber,
        mode,
        paymentType,
        isSameDay
      }
    });
  }

  /**
   * @description We call this function when there is a payment to be made by cards. in the modal, we collecting required documents,
   * submitting it to backend and getting response and we returning that response throgh this function.
   * this funciton is called in v3 card payment components ,psb payment components, and new check component.
   * wrote this function in service since this is common for all.
   * @param card - Entire existing card object
   * @param amount - payment amount
   * @param requiredDocuments - required documents, either invoice or both card and invoice.
   * @returns - dialogRef
   */
  openV4VerifyCardInvoiceModal(
    card: IExistingCreditCards,
    amount: string,
    mode: string,
    invoiceNumber: string,
    requiredDocuments: ['invoice'?, 'card'?, 'authDoc'?],
    payee?: IPayeeDropdown | IViewPayee,
    paymentType?: string,
    isSameDay?: number
  ) {
    return this.dialog.open<
      VerifyCardModalV4Component,
      IVerifyCardInvoiceDialogData,
      { success: boolean; data: ICardPaymentReqDocRes; authSign?: string }
    >(VerifyCardModalV4Component, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        card,
        requiredDocuments,
        amount,
        payee,
        invoiceNumber,
        mode,
        paymentType,
        isSameDay
      }
    });
  }

  openVerifyCardInvoiceModalPayroll(
    card: IExistingCreditCards,
    amount: string,
    mode: string,
    invoiceNumber: string,
    requiredDocuments: ['invoice'?, 'card'?, 'authDoc'?],
    payrollId: string,
    companyType: string,
    paymentType?: string
  ) {
    return this.dialog.open<
      VerifyCardModalComponent,
      IVerifyCardInvoiceDialogData,
      { success: boolean; data: ICardPaymentReqDocRes; authSign?: string }
    >(VerifyCardModalComponent, {
      width: '528px',
      minHeight: '583px',
      maxHeight: '791px',
      disableClose: true,
      data: {
        card,
        requiredDocuments,
        amount,
        invoiceNumber,
        mode,
        paymentType,
        payrollId,
        companyType
      }
    });
  }

  isEnterPriseCustomer(plugin: string): boolean {
    let isEnable = false;
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes(plugin)) {
            isEnable = true;
          } else {
            isEnable = false;
          }
        }
      })
    );
    return isEnable;
  }

  openEmailPhoneVerificationModal(): void {
    const dialogRef = this.dialog.open(EmailPhoneVerificationModalV4Component, {
      width: '550px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (
          result: { emailVerified: boolean; phoneVerified: boolean } | undefined
        ) => {
          if (result?.emailVerified && result?.phoneVerified) {
            this.getGettingStartedData();
          }
        }
      );
  }

  getGettingStartedData(): void {
    this.loading.set(true);
    this.subscriptions.push(
      this.gettingStartedService
        .getGettingStartedDataApi()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.localStorageService.setItem('gettingStartedData', res.data);
            }
          }
        })
    );
  }

  checkPostivePayPermission() {
    const isV4 = this.localStorageService.getItem('isV4LayoutEnabled') === 1;
    const alertService = isV4 ? this.v4AlertService : this.alertService;
    const addBankAccountUrl = isV4
      ? '/v4/manage/users/add-bank-account'
      : '/manage/users/add-bank-account';
    const positivePayIndexUrl = isV4
      ? '/v4/manage/positivepay/index'
      : '/manage/positivepay/index';
    const positivePayRestrictionsUrl = isV4
      ? '/v4/manage/positivepay/restrictions'
      : '/manage/positivepay/getPositivePayRestrictions';

    this.subscriptions.push(
      this.userService.userOverallData.subscribe((res) => {
        if (res?.bankAccountCount === 0) {
          const data = {
            title: 'Error!',
            content:
              'Please add/connect your bank account and try to setup Positive Pay.',
            isCancel: true,
            doneMsg: 'Add Bank Account'
          };
          alertService
            .warningAlert(data)
            .afterClosed()
            .subscribe((confirm) => {
              if (confirm) {
                this.router.navigateByUrl(addBankAccountUrl);
              }
            });
        } else {
          this.positivePayService.checkPositivePayPermission().subscribe({
            next: (result) => {
              if (result.success) {
                this.router.navigateByUrl(positivePayIndexUrl);
              }
            },
            error: (err) => {
              if (!err.error.success && err.error.errorCode === 121) {
                this.router.navigateByUrl(positivePayRestrictionsUrl);
              }
            }
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
