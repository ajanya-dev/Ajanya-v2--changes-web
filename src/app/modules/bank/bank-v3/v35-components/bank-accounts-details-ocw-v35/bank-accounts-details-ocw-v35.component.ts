/* eslint-disable no-underscore-dangle */
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { IBankAuditTrial, IBankData, IBankEditForm } from 'src/app/models/bank';
import { of, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IApiRes } from 'src/app/models/api';
import { catchError, finalize } from 'rxjs/operators';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { fabric } from 'fabric';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { TransferDetailsService } from 'src/app/modules/transfers/services/transfer-details.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { ICheckDesignData } from 'src/app/models/check-design';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AsyncPipe, CurrencyPipe, NgClass } from '@angular/common';
import {
  faArrowsRotate,
  faChartPieSimpleCircleDollar,
  faEye
} from '@fortawesome/pro-solid-svg-icons';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RelativeTimePipe } from 'src/app/pipes/relative-time.pipe';
import { PlanDataAlertModalComponent } from 'src/app/shared/modal/plan-data-alert-modal/plan-data-alert-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IWarningAlert } from 'src/app/models/alert';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { environment } from 'src/environments/environment';
import { EditBankAccountModalComponent } from '../../../bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { BankDataV35Service } from '../../v35-services/bank-data-v35.service';
import { CloneCheckDesignComponent } from '../../../bank-v2/modals/clone-check-design/clone-check-design.component';
import { BankAccountsTransactionsOcwV35Component } from '../bank-accounts-transactions-ocw-v35/bank-accounts-transactions-ocw-v35.component';
import { OcwPreventMultiClickDirective } from '../../../../../directive/ocw-prevent-multi-click.directive';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ScrollListenerDirective } from '../../../../../directive/scroll-listner.directive';
import { ConnectBankAccountModalComponent } from '../connect-bank-account-modal/connect-bank-account-modal.component';
import { BankAccountRecordsComponent } from '../bank-account-records/bank-account-records.component';
import { IBankBalancePlaidRes, IBankDataRes } from '../../model/bank-v35';
import { UpdatedImportedBanksModalComponent } from '../../../bank-v2/modals/updated-imported-banks-modal/updated-imported-banks-modal.component';

/**
 * @description Details component of selected bank account
 */
@Component({
  selector: 'app-bank-accounts-details-ocw-v35',
  templateUrl: './bank-accounts-details-ocw-v35.component.html',
  styleUrls: ['./bank-accounts-details-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    ScrollListenerDirective,
    CommonButtonV35Component,
    MatTooltip,
    OcwPreventMultiClickDirective,
    BankAccountsTransactionsOcwV35Component,
    CurrencyPipe,
    BankAccountRecordsComponent,
    RelativeTimePipe,
    AsyncPipe,
    WhiteLabelDirective
  ]
})
export class BankAccountsDetailsOcwV35Component implements OnInit, OnDestroy {
  /**
   * @description Injecting dependencies using inject method
   */
  public bankDataService = inject(BankDataV35Service);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private positivePayService = inject(PositivePayService);
  private checkDesignCanvasService = inject(CheckdesignCanvasService);
  private checkDesignService = inject(CheckDesignService);
  private alertService = inject(AlertService);
  private transferDetailsService = inject(TransferDetailsService);
  private paymentsService = inject(PaymentsService);
  private companyManagementService = inject(CompanyManagementService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private bankAccountService = inject(BankAccountsService);
  private bankRecordService = inject(BankDataService);
  private headerService = inject(HeaderService);
  private plaidHelperService = inject(PlaidHelperService);
  /**
   * @description Variables
   */
  public canvas: fabric.Canvas;
  subscriptions: Subscription[] = [];
  bankAccountData: IBankData;
  bankAccountCheckDesignData: ICheckDesignData;
  checkTemplate = '';
  isLoading = false;
  auditTrailLoading = false;
  checkDesignPermission = true;
  utils = Utils;
  noAccounts = false;
  auditTrails: IBankAuditTrial[];
  selectedTab: 'account' | 'info' | 'audit-trail' | 'all' = 'all';
  switchArray = [
    { id: 0, name: 'account', title: 'Account' },
    { id: 1, name: 'info', title: 'Info' },
    { id: 2, name: 'audit-trail', title: 'Audit Trail' }
  ] as const;

  transactionTabs = ['Zil Payments', 'Bank Account'] as const;
  selectedTransactionTab: (typeof this.transactionTabs)[number] =
    'Zil Payments';

  bankDataSubject?: IBankDataRes;
  bankDataFetched = false;
  bankDataError = false;

  canFetch = computed<boolean>(() => {
    const selectedBank = this.bankDataService.selectedBankAccountSignal();

    if (!selectedBank) return false;

    return Boolean(
      (selectedBank.mark_as_verified === 1 &&
        selectedBank.plaid_detail?.plaid_account_id) ||
        selectedBank.bank_account_nature_type === 2
    );
  });

  faEye = faEye;
  faArrowsRotate = faArrowsRotate;
  faChartPieSimpleCircleDollar = faChartPieSimpleCircleDollar;

  totalAccountsCount: number | undefined;
  isUserHaveBanks: boolean = false;
  selectedBankAccount$ = toObservable(
    this.bankDataService.selectedBankAccountSignal
  );

  bankAccountCount$ = toObservable(this.bankDataService.bankAccountCountSignal);
  statusFetchingSignal$ = toObservable(
    this.bankDataService.statusFetchingSignal
  );

  personaResponse$ = toObservable(this.bankDataService.statusFetchingSignal);

  fetchingDetails = false;
  balanceFetching = false;
  mappingAccount = false;

  bankData = {
    bankAccountBalance: <number | undefined>undefined,
    lastUpdated: <string | undefined>undefined
  };

  date = new Date();
  env = environment;

  /**
   * @description Checks the current environment id and
   * returns "QuickBanked" if it is quickbanked or quickbanked-sandbox
   */
  transFormData(inputString: string | undefined): string {
    if (
      inputString === 'ZilBank' &&
      (this.dynamicWhiteLabelService.currentEnvironmentId === 'quickbanked' ||
        this.dynamicWhiteLabelService.currentEnvironmentId ===
          'quickbanked-sandbox')
    ) {
      return 'QuickBanked';
    }
    return inputString ?? '';
  }

  isShadow: boolean;

  @ViewChild('mainSection') mainSection: ElementRef<HTMLDivElement>;

  ngOnInit() {
    this.getBankAccountDetails();
    this.observeCompanyChange();
    this.checkKycKybStatus();
    this.listenForDesignUpdate();
    this.getIndex(true);
  }

  getIndex(isDisable?: boolean) {
    if (!this.bankDataFetched) {
      this.bankRecordService.getIndex(isDisable).subscribe({
        next: (val) => {
          if (!val.success) return;
          this.bankDataSubject = val.data;
          this.bankDataFetched = true;
        },
        error: () => {
          this.bankDataError = true;
        }
      });
    }
  }

  /**
   * Function for observing company changes.
   * if there is any comany change, we will clear bank data in bank data service
   * due to it causes for an error and its unecessary.
   */
  private observeCompanyChange() {
    this.companyManagementService.getCompanyChange$.subscribe((res) => {
      if (res === true) {
        this.bankDataService.resetSignal();
      }
    });
  }

  /**
   *@description  Get details of the bank account from bankDataService and country, next check number from bankAccountsService
   */
  getBankAccountDetails() {
    this.subscriptions.push(
      this.bankAccountCount$.subscribe((res) => {
        this.noAccounts = !res;
      }),
      this.selectedBankAccount$.subscribe((res) => {
        this.bankData.lastUpdated = undefined;
        this.bankData.bankAccountBalance = undefined;
        this.selectedTransactionTab = 'Zil Payments';
        const bankData = res as IBankData;
        this.bankAccountData = bankData;
        if (this.bankAccountData?.encrypted_bankacc_id) {
          if (this.selectedTab === 'all') {
            this.toggleAccountDetails('account');
          } else {
            this.getTabDetails(bankData.encrypted_bankacc_id, this.selectedTab);
          }
        } else {
          this.toggleAccountDetails('all');
        }
        if (this.bankAccountData?.id === 0) {
          this.bankDataService.setTotalBankAccountsCount();
        }
      }),
      this.bankDataService.getTotalBankAccountsCount.subscribe((res) => {
        this.totalAccountsCount = res;
        this.isLoading = false;
        if (res !== 0) {
          this.isUserHaveBanks = true;
        } else {
          this.isUserHaveBanks = false;
        }
      })
    );
  }

  getTabDetails(bankId: string, selectedTab: string) {
    switch (selectedTab) {
      case 'account':
        this.getTemplate(bankId);
        break;
      case 'info':
        this.bankDataService.setCheckNumberAndAddress(bankId);
        break;
      case 'audit-trail':
        this.bankDataService.getAuditTrial(bankId);
        break;
      default:
    }
  }

  /**
   * @description Toggle tabs
   */
  toggleAccountDetails(tabName: 'account' | 'info' | 'audit-trail' | 'all') {
    if (tabName === this.selectedTab) return;
    this.bankDataService.accountNumberVisible = false;
    switch (tabName) {
      case 'account':
        this.getTemplate(this.bankAccountData.encrypted_bankacc_id);
        this.selectedTab = 'account';
        break;
      case 'info':
        this.selectedTab = 'info';
        this.bankDataService.setCheckNumberAndAddress(
          this.bankAccountData.encrypted_bankacc_id
        );
        break;
      case 'audit-trail':
        this.selectedTab = 'audit-trail';
        this.bankDataService.getAuditTrial(
          this.bankAccountData.encrypted_bankacc_id
        );
        break;
      default:
        this.selectedTab = 'all';
        break;
    }
  }

  /**
   * @description Emits the selected bank data when apply for ach
   * @param val Bank account details
   */
  applyAchClick(val: IBankData | undefined) {
    /**
     * ach_application_status = 0 (pending)
     * ach_application_status = 1 (completed)
     * ach_application_status = 2 (more document-GENERAL)
     * ach_application_status = 3 (reject)
     * ach_application_status = 4 (more document-VIP)
     * ach_application_status = 5 (show_all)
     * ach_application_status = 6 (ready to upload)
     * ach_application_status = 7 (partner approved)
     * ach_application_status = 8 (partner rejected)
     *
     * verified_by = 2 - is verified by MD,
     * verified_by = 3 - is waiting for confirmation MD,
     * verified_by = 4 - is requested MD,
     * verified_by = 5 - is approved request MD,
     * verified_by = 6 - Rejected Requests
     * verified_by = 7 - AUTO_VERIFYBY YODLY
     * verified_by = 8 - VERIFIED BY ADMIN
     * verified_by = 9 - AUTO_VERIFYBY YODLY FROM OUTSIDE
     * verified_by = 10- Allow MD Do it Again
     * verified_by = 11- Softly verified //only verified last 4 digits of the account number
     * verified_by = 12- Confirm MD attempt Completed
     * verified_by = 13- cloud bank auto verication
     * verified_by = 14- verified using documents
     */
    this.bankDataService.applyAchClick(val as IBankData);
  }

  /**
   * @description Emits @param encrypted_bankacc_id  through verifyAccount output variable and opens verify bank modal
   * @param encrypted_bankacc_id
   * @param noConfirmation If true, will verify the bank account instantly without confirmation
   */
  openBankVerifyModal(bankAcData: IBankData | undefined, noConfirmation?: boolean) {
    if (noConfirmation) {
      this.bankDataService.verifyInstantly(bankAcData as IBankData);
      return;
    }
    const data = {
      title: 'Error',
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.alertService.warningAlert(data);
    res.afterClosed().subscribe((resp) => {
      if (resp) {
        if (this.bankAccountData.bank_account_country === 'Canada') {
          this.alertService.warningAlert({
            content: 'Verification for Canadian bank accounts is not permitted.'
          });
          return;
        }
        this.bankDataService.openBankVerifyModal(bankAcData as IBankData);
      }
    });
  }

  /**
   * @description Emits @param val through confirmMicroDeposit output variable for micro deposit
   * @param val @type IBankData
   */
  microDeposit(val: IBankData | undefined) {
    this.bankDataService.microDeposit(val as IBankData);
  }

  /**
   * @description hide/show account number
   */
  displayAccountNumber() {
    this.bankDataService.accountNumberVisible =
      !this.bankDataService.accountNumberVisible;
  }

  /**
   * @description Modal opens for bank account editing
   * @param val Bank account details
   */
  onEditRow(val: IBankData | undefined) {
    const editBankModal = this.dialog.open<
      EditBankAccountModalComponent,
      IBankData,
      IBankEditForm
    >(EditBankAccountModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val as IBankData
    });
    editBankModal.afterClosed().subscribe((res) => {
      if (res) {
        this.bankAccountData.bank_account_account_name = res.bankAccountName;
        this.bankAccountData.bank_account_nick_name = res.bankAccountNickName;
        this.bankAccountData.bank_account_account_number =
          res.bankAccountNumber;
        this.bankAccountData.bank_routing_number = res.bankRoutingNumber;
        this.bankAccountData.bank_name = res.bankName;
        this.bankDataService.updateAccounts({
          ...(val as IBankData),
          bank_account_address_line_1: res.bankAccountAddressLine1,
          bank_account_address_line_2: res.bankAccountAddressLine2,
          bank_account_phone: res.bankAccountPhone,
          bank_account_email: res.bankAccountEmail,
          bank_account_city: res.bankAccountCity,
          bank_account_state: res.bankAccountState,
          bank_account_country: <'Canada'>res.bankAccountCountry,
          bank_account_zip: res.bankAccountZip
        });
      }
    });
  }

  /**
   * @description Navigate into check design page
   * @param val Bank account details
   */
  goToCheckDesign(selectedRow: IBankData | undefined) {
    if (!this.checkDesignPermission) {
      this.alertService.warningAlert({
        content: "You don't have permission to do this action."
      });
      return;
    }
    this.localStorageService.setItem('selectedBankTemp', selectedRow);
    this.localStorageService.setItem(
      'isGridView',
      this.bankDataService.isGridView
    );
    window.location.href = `checkdesign/edit/${selectedRow?.encrypted_bankacc_id}?from=v3`;
  }

  /**
   * @description Opens @component 'CloneCheckDesignComponent' and after closing refresh the data table if changes made
   * @param val Bank account details
   */
  onCloneDesignRow(val: IBankData | undefined) {
    const dialogRef = this.dialog.open(CloneCheckDesignComponent, {
      maxWidth: '450px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val as IBankData
    });

    dialogRef.afterClosed().subscribe((_result) => {
      if (_result) {
        this.dataTableService.setRefreshStatus(true);
        this.bankDataService.setAccounts();
      }
    });
  }

  /**
   * @description Check positive pay permission and navigate into corresponding pages
   */
  positivePay() {
    if (this.noAccounts && !this.bankDataService.accountLoadingSignal()) {
      const data = {
        title: 'Error',
        content:
          'Please add/connect your bank account and try to setup Positive Pay.',
        isCancel: true
      };
      this.alertService.warningAlert(data);
      return;
    }

    this.subscriptions.push(
      this.positivePayService
        .checkPositivePayPermission()
        .pipe(
          catchError((err) => {
            if (!err.error.success && err.error.errorCode === 121) {
              this.router.navigateByUrl(
                '/manage/positivepay/getPositivePayRestrictions'
              );
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.router.navigateByUrl('/manage/positivepay/index');
          }
        })
    );
  }

  /**
   * @description Navigate into import bank account page
   */
  importFromExel() {
    this.router.navigateByUrl('/manage/bankaccount/import-bankaccount/step1');
  }

  /**
   * @description Get template of bank check design
   * @param bankacc_id Bank account id
   */
  getTemplate(bankacc_id: string) {
    this.isLoading = true;
    this.subscriptions.push(
      this.checkDesignService
        .getTemplate(bankacc_id)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (data) => {
            if (data?.success) {
              this.bankAccountCheckDesignData = data.data;
              this.canvas = new fabric.Canvas('canvas');
              try {
                this.checkTemplate = JSON.parse(
                  data.data.checkDesign as string
                );
              } catch (e) {
                this.checkTemplate = '';
              }
              this.checkDesignCanvasService.removeNullText(this.checkTemplate);
              this.canvas.loadFromJSON(this.checkTemplate, () => 1);
            }
          },
          error: (error) => {
            if (error.status === 403) this.checkDesignPermission = false;
          }
        })
    );
  }

  /**
   * @description Navigate into transfer component by setting selected bank account via @service 'transferDetailsService'
   * @param bankAccountData Bank account details
   * @returns
   */
  transferFromBankAccount(bankAccountData: IBankData | undefined) {
    if (
      bankAccountData?.encrypted_bankacc_id &&
      ((!bankAccountData?.verified_by &&
        (bankAccountData?.mark_as_verified === 0 ||
          !bankAccountData?.mark_as_verified)) ||
        (bankAccountData?.ach_application_status !== 1 &&
          (bankAccountData?.verified_by === 6 ||
            bankAccountData?.verified_by === 10 ||
            bankAccountData?.verified_by === 12)))
    ) {
      const alertData = {
        content: 'Please verify your bank account first.',
        isCancel: true,
        doneMsg: 'Verify Now',
        cancelMsg: 'Not Now'
      };
      const alert = this.alertService.warningAlert(alertData);
      alert.afterClosed().subscribe((res) => {
        if (res) {
          if (
            bankAccountData?.verified_by === 6 ||
            bankAccountData?.verified_by === 12
          ) {
            this.bankDataService.verifyInstantly(bankAccountData);
          } else {
            this.openBankVerifyModal(bankAccountData);
          }
        }
      });
      return;
    }

    if (
      (bankAccountData?.verified_by === 3 ||
        bankAccountData?.verified_by === 4) &&
      bankAccountData?.mark_as_verified !== 1
    ) {
      this.alertService.warningAlert({
        content:
          'This bank account is not verified.Please select a verified bank account.'
      });
      return;
    }

    if (
      bankAccountData?.encrypted_bankacc_id &&
      ((!bankAccountData?.ach_application_status &&
        bankAccountData?.ach_application_status !== 0 &&
        bankAccountData?.mark_as_verified === 1 &&
        bankAccountData?.ach_application_status !== 1) ||
        bankAccountData?.ach_application_status === 3)
    ) {
      const alertData = {
        content:
          'The bank account must be ACH verified to transfer the funds. Would you like to apply for ACH verification now?',
        isCancel: true,
        doneMsg: 'Apply Now',
        cancelMsg: 'Not Now'
      };
      const alert = this.alertService.warningAlert(alertData);
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.applyAchClick(bankAccountData);
        }
      });
      return;
    }

    if (
      bankAccountData?.encrypted_bankacc_id &&
      bankAccountData?.ach_application_status !== 1
    ) {
      this.alertService.warningAlert({
        content:
          'This bank account is not ACH verified.Please select an ACH verified bank account.'
      });
      return;
    }

    this.transferDetailsService.setData({
      transferFrom: 1,
      transferFromId: bankAccountData?.encrypted_bankacc_id as string,
      displayName: bankAccountData?.bank_account_nick_name
        ? bankAccountData?.bank_account_nick_name
        : ''
    });
    this.router.navigate(['/manage/transfers']);
  }

  /**
   * @description Navigate into home page payments page and populate the bank account on bank dropdown . @param mode will decide send payment or recieve payment
   * @param mode 'pay' or 'recieve'
   */
  goToPayments(mode: 'pay' | 'receive') {
    const bankAc = {
      accountNumber: this.bankAccountData?.bank_account_account_number,
      achApplicationStatus: this.bankAccountData?.ach_application_status,
      bankName: this.bankAccountData?.bank_name,
      id: this.bankAccountData?.encrypted_bankacc_id,
      isItZil: Number(this.bankAccountData?.is_neo_bank),
      name: this.bankAccountData?.bank_account_account_name,
      nickName: this.bankAccountData?.bank_account_nick_name,
      routingNumber: Number(this.bankAccountData?.bank_routing_number),
      verified: Number(this.bankAccountData?.mark_as_verified)
    };
    this.paymentsService.initiatePaymentForm = {
      bankAc,
      senderBankAccount: bankAc
    };
    if (mode === 'pay') {
      this.router.navigate(['/manage/payments/main/pay/bankaccount/check'], {
        state: { backUrl: this.router.url }
      });
    } else {
      this.router.navigate(['/manage/payments/main/receive/payer/bank'], {
        state: { backUrl: this.router.url }
      });
    }
  }

  /**
   * @description Navigate into add new bank route
   */
  onNew() {
    this.router.navigate([`/manage/users/add-bank-account`]);
  }

  onScroll() {
    const mainSectionElement = this.mainSection.nativeElement;
    if (mainSectionElement.scrollTop > 0) {
      this.isShadow = true;
    } else {
      this.isShadow = false;
    }
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array.
   * @param {IBankAuditTrial}item Audit trail data.
   */
  trackByDate(item: IBankAuditTrial) {
    return item.formattedCreatedAt;
  }

  /**
   * Checks the status of the application.
   *
   * This method subscribes to the statusFetchingSignal$ Observable to fetch the application status details.
   * Once the status details are fetched, it updates the fetchingDetails property accordingly.
   *
   * @returns {void}
   */
  checkKycKybStatus(): void {
    this.subscriptions.push(
      this.statusFetchingSignal$.subscribe((res) => {
        this.fetchingDetails = res.loading;
        if (res.autoClick) {
          this.applyAchClick(this.bankDataService.selectedBankAccountSignal());
        }
      }),

      this.personaHelperService.kycKybVerifivationResult$.subscribe((res) => {
        if (res?.data?.inquiry_type === 'kyb') {
          this.applyAchClick(this.bankDataService.selectedBankAccountSignal());
        }
      })
    );
  }

  /** Method for listening cheque design changes */
  listenForDesignUpdate() {
    this.subscriptions.push(
      this.bankDataService.isLoadDesign$.subscribe((reload) => {
        if (reload) {
          this.getTemplate(this.bankAccountData.encrypted_bankacc_id);
        }
      })
    );
  }

  openWarningAlert(content: string) {
    const data: IWarningAlert = {
      content,
      isCancel: false
    };
    this.alertService.warningAlert(data);
  }

  fetchBalance(alertType: 'balance' | 'record') {
    if (this.bankDataError) {
      this.openWarningAlert("You don't have permission to do this action.");
      return;
    }
    const selectedBank = this.bankDataService.selectedBankAccountSignal();
    this.date = new Date();

    if (!selectedBank) return;

    if (selectedBank.mark_as_verified !== 1) {
      this.openBankVerifyModal(selectedBank);
      return;
    }

    const fetchBalance = Boolean(
      selectedBank.mark_as_verified === 1 &&
        selectedBank.plaid_detail?.plaid_account_id
    );

    const headerData = this.headerService._headerData.value;

    if (fetchBalance && (headerData === false || !headerData.isSubscribed)) {
      this.dialog.open(PlanDataAlertModalComponent, {
        width: '353px',
        autoFocus: false,
        data: { target: 'plans' },
        disableClose: true
      });
      return;
    }

    // Either the account has verified and mapped,
    // or the bank account is cloud bank account
    if (fetchBalance) {
      this.balanceFetching = true;
      const sub = this.bankAccountService
        .fetchBankBalance(selectedBank.encrypted_bankacc_id)
        .pipe(
          finalize(() => {
            this.balanceFetching = false;
          })
        )
        .subscribe({
          next: this.onFetchBalance,
          error: (err: HttpErrorResponse) => {
            const { success, errorCode } = err.error;

            if (!success && errorCode?.data?.error?.providerAccountId) {
              this.reConnectPlaid(errorCode?.data?.error?.providerAccountId);
            }else if(!success && errorCode?.data?.errorMsg){
              this.alertService.warningAlert({
                content: `${errorCode?.data?.errorMsg}`
              });
            }
          }
        });
      this.subscriptions.push(sub);
      return;
    }

    // Bank account has verified but not mapped with plaid
    if (
      [1, 7, 9, 11, null].includes(selectedBank?.verified_by) &&
      selectedBank.mark_as_verified === 1
    ) {
      this.mappingAccount = true;
      const sub = this.bankAccountService
        .mapPlaidAccount(selectedBank.encrypted_bankacc_id)
        .pipe(
          finalize(() => {
            this.mappingAccount = false;
          })
        )
        .subscribe((val) => {
          if (!val.success) return;

          if (val.success && !val.data.is_mapped) {
            this.plaidHelperService.openPlaidModal({ isVerify: true,selectedBankId:selectedBank.encrypted_bankacc_id }).subscribe((response) => {
              if (response?.success) {
                this.getPlaidDetails(selectedBank);
              }
            });
            return;
          }

          this.bankDataService.bankAccountsStateSignal.update((acc) => ({
            ...acc,
            selectedBankAccount: {
              ...selectedBank,
              plaid_detail: {
                plaid_account_id: val.data.plaid_account_id as string
              }
            }
          }));
          this.fetchBalance(alertType);
        });

      this.subscriptions.push(sub);
      return;
    }
    if (!selectedBank.verified_by) return;

    // Now the bank account is either not verified,
    // or verified by MD, or by admins
    // In this we have to make user verify their bank account with yodlee.

    this.openConnectBankModal(alertType, selectedBank);

  }

  onFetchBalance = (
    val: IApiRes<{
      balance: number;
      plaid_response: IBankBalancePlaidRes;
    }>
  ) => {
    if (!val.success) return;

    if (val.data.balance) {
      this.bankData.bankAccountBalance = val.data.balance;
      this.bankData.lastUpdated = val.data.plaid_response.lastUpdated;
    }
  };

  reConnectPlaid(bankId:string) {
    this.plaidHelperService
      .openPlaidModal({
        isVerify: false,
        selectedBankId: bankId,
        page: 'bankData'
      })
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.fetchBalance('balance');
          }
        }
      });
  }

  openConnectBankModal(alertType: 'balance' | 'record', account: IBankData) {
    const ref = this.dialog.open<
      ConnectBankAccountModalComponent,
      unknown,
      { success: boolean }
    >(ConnectBankAccountModalComponent, {
      width: '394px',
      data: { alertType, account }
    });
    
    ref.afterClosed().subscribe((val) => {
      if (val?.success) {
        this.getPlaidDetails(account);
      }
    });
  }

  getPlaidDetails(account: IBankData){
    this.subscriptions.push(
      this.bankAccountService
      .getPlaidId(account.encrypted_bankacc_id)
      .subscribe((res) => {
        if (res.success) {
          const banks =
            this.bankDataService.bankAccountsStateSignal().bankAccountList;

          for (let i = 0; i < banks.length; i += 1) {
            const el = banks[i];

            if (el.encrypted_bankacc_id === account.encrypted_bankacc_id) {
              el.plaid_detail = { plaid_account_id: res.data.plaid_account_id };
            }
          }

          this.bankDataService.bankAccountsStateSignal.update((state) => ({
            ...state,
            bankAccountList: banks,
            selectedBankAccount: {
              ...account,
              plaid_detail: { plaid_account_id: res.data.plaid_account_id }
            }
          }));
        }
      })
    );
  }

  changeTransactionTab(tab: typeof this.selectedTransactionTab) {
    if (tab === 'Bank Account') {
      if (this.bankDataError) {
        this.openWarningAlert("You don't have permission to do this action.");
        return;
      }
      this.getIndex();
      const selectedBank = this.bankDataService.selectedBankAccountSignal();

      if (!selectedBank) return;

      if (selectedBank.mark_as_verified !== 1) {
        this.openBankVerifyModal(selectedBank);
      }
      
      const fetchBalance = Boolean(
        (selectedBank.mark_as_verified === 1 &&
          selectedBank.plaid_detail?.plaid_account_id)
      );

      const headerData = this.headerService._headerData.value;

      if (fetchBalance && (headerData === false || !headerData.isSubscribed)) {
        this.dialog.open(PlanDataAlertModalComponent, {
          width: '353px',
          autoFocus: false,
          data: { target: 'plans' },
          disableClose: true
        });
        return;
      }

      if (
        fetchBalance ||
        ([1, 7, 9, 11, null].includes(selectedBank?.verified_by) &&
          selectedBank.mark_as_verified === 1)
      ) {
        this.selectedTransactionTab = tab;
        return;
      }

      this.openConnectBankModal('record', selectedBank);
      return;
    }

    this.selectedTransactionTab = tab;
  }

  onBankAccountError(_err: HttpErrorResponse) {
    this.changeTransactionTab('Zil Payments');
  }

  /**
   * @description Unsubscribe all subscriptions when the component destroys
   */
  ngOnDestroy(): void {
    this.bankDataService.statusFetchingSignal.set({
      loading: false,
      autoClick: undefined
    });
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.bankDataService.isFromService = null;
    this.personaHelperService.kycKybVerifivationResult.set(undefined);
  }

  updateBankAccount() {
    const dialogRef = this.dialog.open(UpdatedImportedBanksModalComponent, {
      disableClose: true,
      width: '700px',
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bankDataService.setAccounts(undefined);
        this.bankDataService.setTotalBankAccountsCount();
        this.bankDataService.setCheckNumberAndAddress(this.bankAccountData.encrypted_bankacc_id,true);
      }
    });
  }

}
