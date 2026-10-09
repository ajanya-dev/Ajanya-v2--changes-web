import {
  Component,
  computed,
  DestroyRef,
  HostBinding,
  inject,
  OnInit,
  signal,
  ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe, CurrencyPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { fabric } from 'fabric';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { IBankData, IBankEditForm } from 'src/app/models/bank';
import { IApiRes } from 'src/app/models/api';
import { ICheckDesignData } from 'src/app/models/check-design';
import { IWarningAlert } from 'src/app/models/alert';

import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';

import { Utils } from 'src/app/data/utils';
import { environment } from 'src/environments/environment';

import { RelativeTimePipe } from 'src/app/pipes/relative-time.pipe';
import { OcwPreventMultiClickDirective } from 'src/app/directive/ocw-prevent-multi-click.directive';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { PlanDataAlertModalV4Component } from 'src/app/shared/modal/plan-data-alert-modal-v4/plan-data-alert-modal-v4.component';

import { V4TransferFundsModalComponent } from 'src/app/shared/modal/v4-transfer-funds/v4-transfer-funds-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { AddBankMethodChoiceModalComponent } from '../../v4-modals/add-bank-method-choice-modal/add-bank-method-choice-modal.component';
import { EditBankAccountModalComponent } from '../../../bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { CloneCheckDesignV4Component } from '../../v4-modals/clone-check-design-v4/clone-check-design-v4.component';
import { UploadStatementModalV4Component } from 'src/app/modules/bank/bank-v2/modals/upload-statement-modal/v4/upload-statement-modal-v4.component';
import { ConnectBankAccountV4Component } from '../../v4-modals/connect-bank-account-v4/connect-bank-account-v4.component';
import { UpdatedImportedBanksModalComponent } from '../../../bank-v2/modals/updated-imported-banks-modal/updated-imported-banks-modal.component';

import { BankDataV35Service } from '../../../bank-v3/v35-services/bank-data-v35.service';
import { BankDataV4Service } from '../../v4-services/bank-data-v4.service';
import {
  IBankBalancePlaidRes,
  IBankDataRes
} from '../../../bank-v3/model/bank-v35';
import { BankVerificationModalV4Component } from '../../../../user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { BusinessVerificationModalV4Component } from '../../../../user/user-v4/modals/business-verification-modal-v4/business-verification-modal-v4.component';
import { ConfirmMicroDepositModalV4Component } from '../../../../user/user-v4/modals/confirm-micro-deposit-modal-v4/confirm-micro-deposit-modal-v4.component';
import { EditBankAccountModalV4Component } from '../../../../user/user-v4/modals/edit-bank-account-modal-v4/edit-bank-account-modal-v4.component';
import { EmailPhoneVerificationModalV4Component } from '../../../../user/user-v4/modals/email-phone-verification-modal-v4/email-phone-verification-modal-v4.component';
import { MicroDepositModalV4Component } from '../../../../user/user-v4/modals/micro-deposit-modal-v4/micro-deposit-modal-v4.component';

@Component({
  standalone: true,
  selector: 'app-bank-details-v4',
  templateUrl: './bank-details-v4.component.html',
  styleUrls: ['./bank-details-v4.component.scss'],
  imports: [
    NgClass,
    AsyncPipe,
    CurrencyPipe,
    LucideAngularModule,
    MatTooltip,
    RelativeTimePipe,
    OcwPreventMultiClickDirective,
    WhiteLabelDirective,
    V4TransferFundsModalComponent,
    CommonButtonV4Component,
    CommonTabV4Component,
    NgOptimizedImage
  ],
  providers: [CheckdesignCanvasService]
})
export class BankDetailsV4Component implements OnInit {

  @HostBinding('class') hostClass = 'block h-full';

  public bankDataService = inject(BankDataV35Service);
  public bankDataV4Service = inject(BankDataV4Service);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private checkDesignCanvasService = inject(CheckdesignCanvasService);
  private checkDesignService = inject(CheckDesignService);
  private alertService = inject(V4AlertService);
  private paymentsService = inject(PaymentsService);
  private companyManagementService = inject(CompanyManagementService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private bankAccountService = inject(BankAccountsService);
  private bankRecordService = inject(BankDataService);
  private headerService = inject(HeaderService);
  private plaidHelperService = inject(PlaidHelperService);
  private destroyRef = inject(DestroyRef);
  private clipboard = inject(Clipboard);
  private viewContainerRef = inject(ViewContainerRef);
  private customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private payeeOnboardingService = inject(PayeeOnboardingService);

  public canvas: fabric.Canvas;
  bankAccountData: IBankData;
  bankAccountCheckDesignData: ICheckDesignData;
  checkTemplate = '';
  isLoading = false;
  checkDesignPermission = true;
  utils = Utils;
  noAccounts = false;
  hasEverHadAccounts = false;
  selectedTab: 'account' | 'audit-trail' | 'all' = 'all';
  totalAccountsCount: number | undefined;
  isUserHaveBanks = false;
  fetchingDetails = false;
  balanceFetching = false;
  mappingAccount = false;
  bankDataFetched = false;
  bankDataError = false;
  bankDataSubject?: IBankDataRes;
  env = environment;
  private lastTemplateLoadedForBankId: string | null = null;

  switchArray = [
    { id: 0, name: 'account', title: 'Account' },
    { id: 1, name: 'audit-trail', title: 'Audit Trail' }
  ] as const;

  canFetch = computed<boolean>(() => {
    const selectedBank = this.bankDataService.selectedBankAccountSignal();
    if (!selectedBank) return false;
    return Boolean(
      (selectedBank.mark_as_verified === 1 &&
        selectedBank.plaid_detail?.plaid_account_id) ||
        selectedBank.bank_account_nature_type === 2
    );
  });

  selectedBankAccount$ = toObservable(
    this.bankDataService.selectedBankAccountSignal
  );

  bankAccountCount$ = toObservable(this.bankDataService.bankAccountCountSignal);

  statusFetchingSignal$ = toObservable(
    this.bankDataService.statusFetchingSignal
  );

  personaResponse$ = toObservable(this.bankDataService.statusFetchingSignal);

  bankData = {
    bankAccountBalance: <number | undefined>undefined,
    lastUpdated: <string | undefined>undefined
  };

  date = new Date();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.bankDataV4Service.unregisterFetchBankRecords();
      this.bankDataService.statusFetchingSignal.set({
        loading: false,
        autoClick: undefined
      });
      this.bankDataService.isFromService = null;
      this.personaHelperService.kycKybVerifivationResult.set(undefined);
    });
  }

  ngOnInit() {
    // The transactions grid below sits in a sibling component with no handle on
    // this one, so its empty-state CTA asks for the flow through the shared v4
    // bank service instead of re-building the payment payload.
    this.bankDataV4Service.sendPaymentRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.goToPayments('pay'));
    this.getBankAccountDetails();
    this.observeCompanyChange();
    this.checkKycKybStatus();
    this.listenForDesignUpdate();
    this.getIndex(true);
    this.bankDataV4Service.registerFetchBankRecords(
      () => this.fetchBalance('record'),
      () => ({
        canFetch:
          !!this.bankDataService.selectedBankAccountSignal() &&
          !this.canFetch(),
        loading: this.balanceFetching || this.mappingAccount
      })
    );
  }

  getIndex(isDisable?: boolean) {
    if (!this.bankDataFetched) {
      this.bankRecordService
        .getIndex(isDisable)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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

  private observeCompanyChange() {
    this.companyManagementService.getCompanyChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res === true) {
          this.bankDataService.resetSignal();
        }
      });
  }

  getBankAccountDetails() {
    this.bankAccountCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.noAccounts = !res;
        this.hasEverHadAccounts = !!res;
      });

    this.selectedBankAccount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.bankData.lastUpdated = undefined;
        this.bankData.bankAccountBalance = undefined;
        // Dispose old canvas and reset tracking so it reloads for the new bank
        if (this.canvas) {
          this.canvas.dispose();
          this.canvas = null as unknown as fabric.Canvas;
        }
        this.lastTemplateLoadedForBankId = null;
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
      });

    this.bankDataService.getTotalBankAccountsCount
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.totalAccountsCount = res;
        this.isLoading = false;
        this.isUserHaveBanks = res !== 0;
      });
  }

  onTabChange(tabName: string) {
    const tab = tabName as 'account' | 'audit-trail' | 'all';
    this.bankDataV4Service.selectedDetailsTab.set(tab);
    this.bankDataService.accountNumberVisible = false;
    this.selectedTab = tab;
    if (this.bankAccountData?.encrypted_bankacc_id) {
      this.getTabDetails(this.bankAccountData.encrypted_bankacc_id, tabName);
    }
  }

  getTabDetails(bankId: string, selectedTab: string) {
    switch (selectedTab) {
      case 'account':
        this.getTemplate(bankId);
        // Check printing & holder details sit on the Account tab (no separate Info tab)
        this.bankDataService.setCheckNumberAndAddress(bankId);
        break;
      case 'audit-trail':
        this.bankDataService.getAuditTrial(bankId);
        break;
      default:
    }
  }

  toggleAccountDetails(tabName: 'account' | 'audit-trail' | 'all') {
    if (tabName === this.selectedTab) return;
    this.bankDataService.accountNumberVisible = false;
    switch (tabName) {
      case 'account':
        if (this.lastTemplateLoadedForBankId !== this.bankAccountData.encrypted_bankacc_id) {
          this.getTemplate(this.bankAccountData.encrypted_bankacc_id);
        }
        this.bankDataService.setCheckNumberAndAddress(
          this.bankAccountData.encrypted_bankacc_id
        );
        this.selectedTab = 'account';
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
    this.bankDataV4Service.selectedDetailsTab.set(this.selectedTab);
  }

  applyAchClick(val: IBankData | undefined) {
    this.bankDataV4Service.applyAchClick(val as IBankData);
  }

  openBankVerifyModal(
    bankAcData: IBankData | undefined,
    noConfirmation?: boolean
  ) {
    if (noConfirmation) {
      this.bankDataService.verifyInstantly(bankAcData as IBankData);
      return;
    }
    const data = {
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.alertService.warningAlert(data);
    res.afterClosed().subscribe((resp) => {
      if (resp) {
        this.launchBankVerification(bankAcData);
      }
    });
  }

  private launchBankVerification(bankAcData: IBankData | undefined): void {
    if (this.bankAccountData.bank_account_country === 'Canada') {
      this.alertService.warningAlert({
        content: 'Verification for Canadian bank accounts is not permitted.'
      });
      return;
    }
    this.bankDataV4Service.openBankVerifyModal(bankAcData as IBankData);
  }

  microDeposit(val: IBankData | undefined) {
    this.bankDataV4Service.microDeposit(val);
  }

  displayAccountNumber() {
    this.bankDataService.accountNumberVisible =
      !this.bankDataService.accountNumberVisible;
  }

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
    window.location.href = `checkdesign/edit/${selectedRow?.encrypted_bankacc_id}?returnUrl=${encodeURIComponent('/v4/manage/bank-accounts/index?selectPrev=true')}&from=v4`;
  }

  openUploadStatementModal() {
    const selected = this.bankDataService.selectedBankAccountSignal();
    if (!selected) return;
    this.dialog.open(UploadStatementModalV4Component, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        encrypted_bankacc_id: selected.encrypted_bankacc_id,
        accountNumber: selected.bank_account_account_number,
        routingNumber: selected.bank_routing_number,
        bankAccountId: selected.bank_account_bank_id || ''
      }
    });
  }

  onCloneDesignRow(val: IBankData | undefined) {
    const dialogRef = this.dialog.open(CloneCheckDesignV4Component, {
      maxWidth: '450px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val as IBankData,
      panelClass: 'paddingless-modal-rounded',
      viewContainerRef: this.viewContainerRef
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataTableService.setRefreshStatus(true);
        this.bankDataService.setAccounts();
      }
    });
  }

  getTemplate(bankacc_id: string) {
    this.isLoading = true;
    this.checkDesignService
      .getTemplate(bankacc_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data?.success) {
            this.bankAccountCheckDesignData = data.data;
            try {
              this.checkTemplate = JSON.parse(data.data.checkDesign as string);
            } catch (e) {
              this.checkTemplate = '';
            }
            this.checkDesignCanvasService.removeNullText(this.checkTemplate);
            this.isLoading = false;
            // Defer canvas init to next tick so Angular renders the canvas element first
            setTimeout(() => {
              if (this.canvas) {
                this.canvas.dispose();
              }
              this.canvas = new fabric.Canvas('canvas');
              this.canvas.loadFromJSON(this.checkTemplate, () => 1);
              this.lastTemplateLoadedForBankId = bankacc_id;
            });
          } else {
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 403) this.checkDesignPermission = false;
        }
      });
  }

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
            this.launchBankVerification(bankAccountData);
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

    this.dialog.open(V4TransferFundsModalComponent, {
      maxWidth: '560px',
      width: '100%',
      autoFocus: false,
      disableClose: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        transferFrom: 1,
        transferFromId: bankAccountData?.encrypted_bankacc_id
      }
    });
  }

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
      this.paymentsService.initiatePaymentForm = { bankAc };
      this.router.navigate(['/v4/manage/payments/pay/bankaccount/check'], {
        state: { backUrl: this.router.url }
      });
    } else {
      this.paymentsService.initiatePaymentForm = { bankAc };
      this.router.navigate(['/v4/manage/payments/receive'], {
        state: { backUrl: this.router.url }
      });
    }
  }

  onNew() {
    if (this.bankAccountService.isPermissionPopupEnabled) {
      return;
    }

    if (this.payeeOnboardingService.payeeOnboardingSignal().initiatorId) {
      this.router.navigate(['/v4/manage/payee-onboarding/set-password']);
      return;
    }

    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        if (isUser) {
          this.bankAccountService.isPermissionPopupEnabled = true;
          this.bankAccountService
            .AddBank({ permission_check_to_create_bank_account: '' })
            .pipe(
              finalize(() => {
                this.bankAccountService.isPermissionPopupEnabled = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
              next: () => {
                this.openAddBankMethodChoiceModal();
              }
            });
        } else {
          this.openAddBankMethodChoiceModal();
        }
      });
  }

  private openAddBankMethodChoiceModal(): void {
    this.customDoubleSideModalService.open(
      AddBankMethodChoiceModalComponent,
      { width: '480px', disableClose: true }
    );
  }

  checkKycKybStatus(): void {
    this.statusFetchingSignal$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.fetchingDetails = res.loading;
        if (res.autoClick) {
          this.applyAchClick(this.bankDataService.selectedBankAccountSignal());
        }
      });

    this.personaHelperService.kycKybVerifivationResult$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data?.inquiry_type === 'kyb') {
          this.applyAchClick(this.bankDataService.selectedBankAccountSignal());
        }
      });
  }

  listenForDesignUpdate() {
    this.bankDataService.isLoadDesign$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((reload) => {
        if (reload) {
          this.getTemplate(this.bankAccountData.encrypted_bankacc_id);
        }
      });
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

    // eslint-disable-next-line no-underscore-dangle
    const headerData = this.headerService._headerData.value;

    if (fetchBalance && (headerData === false || !headerData.isSubscribed)) {
      this.dialog.open(PlanDataAlertModalV4Component, {
        width: '353px',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { target: 'plans' },
        disableClose: true
      });
      return;
    }

    if (fetchBalance) {
      this.balanceFetching = true;
      this.bankAccountService
        .fetchBankBalance(selectedBank.encrypted_bankacc_id)
        .pipe(
          finalize(() => {
            this.balanceFetching = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: this.onFetchBalance,
          error: (err: HttpErrorResponse) => {
            const { success, errorCode } = err.error;
            if (!success && errorCode?.data?.error?.providerAccountId) {
              this.reConnectPlaid(errorCode?.data?.error?.providerAccountId);
            } else if (!success && errorCode?.data?.errorMsg) {
              this.alertService.warningAlert({
                content: `${errorCode?.data?.errorMsg}`
              });
            }
          }
        });
      return;
    }

    if (
      [1, 7, 9, 11, null].includes(selectedBank?.verified_by) &&
      selectedBank.mark_as_verified === 1
    ) {
      this.mappingAccount = true;
      this.bankAccountService
        .mapPlaidAccount(selectedBank.encrypted_bankacc_id)
        .pipe(
          finalize(() => {
            this.mappingAccount = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((val) => {
          if (!val.success) return;

          if (val.success && !val.data.is_mapped) {
            this.plaidHelperService
              .openPlaidModal({
                isVerify: true,
                selectedBankId: selectedBank.encrypted_bankacc_id,
                isV4: true
              })
              .subscribe((response) => {
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
      return;
    }

    if (!selectedBank.verified_by) return;

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

  reConnectPlaid(bankId: string) {
    this.plaidHelperService
      .openPlaidModal({
        isVerify: false,
        selectedBankId: bankId,
        page: 'bankData',
        isV4: true
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
      ConnectBankAccountV4Component,
      unknown,
      { success: boolean }
    >(ConnectBankAccountV4Component, {
      maxWidth: '440px',
      width: '100%',
      disableClose: false,
      autoFocus: false,
      data: { alertType, account },
      panelClass: 'paddingless-modal-rounded'
    });
    ref.afterClosed().subscribe((val) => {
      if (val?.success) {
        this.getPlaidDetails(account);
      }
    });
  }

  getPlaidDetails(account: IBankData) {
    this.bankAccountService
      .getPlaidId(account.encrypted_bankacc_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          const banks =
            this.bankDataService.bankAccountsStateSignal().bankAccountList;

          for (let i = 0; i < banks.length; i += 1) {
            const el = banks[i];
            if (el.encrypted_bankacc_id === account.encrypted_bankacc_id) {
              el.plaid_detail = {
                plaid_account_id: res.data.plaid_account_id
              };
            }
          }

          this.bankDataService.bankAccountsStateSignal.update((state) => ({
            ...state,
            bankAccountList: banks,
            selectedBankAccount: {
              ...account,
              plaid_detail: {
                plaid_account_id: res.data.plaid_account_id
              }
            }
          }));
        }
      });
  }

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

  updateBankAccount() {
    const dialogRef = this.dialog.open(UpdatedImportedBanksModalComponent, {
      disableClose: true,
      width: '700px'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.bankDataService.setAccounts(undefined);
        this.bankDataService.setTotalBankAccountsCount();
        this.bankDataService.setCheckNumberAndAddress(
          this.bankAccountData.encrypted_bankacc_id,
          true
        );
      }
    });
  }

  trackByIndex(index: number) {
    return index;
  }

  // ===== V4 Modal Triggers =====

  openBankVerificationV4(): void {
    const selectedBank = this.bankDataService.selectedBankAccountSignal();
    this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        bankId: selectedBank?.encrypted_bankacc_id,
        bankDetails: selectedBank
          ? {
              verifiedBy: selectedBank.verified_by ?? undefined,
              country: selectedBank.bank_account_country
            }
          : undefined
      }
    });
  }

  openBusinessVerificationV4(): void {
    this.dialog.open(BusinessVerificationModalV4Component, {
      width: '100%',
      maxWidth: '440px',
      panelClass: 'paddingless-modal',
      disableClose: false
    });
  }

  openConfirmMicroDepositV4(): void {
    const selectedBank = this.bankDataService.selectedBankAccountSignal();
    if (!selectedBank?.encrypted_bankacc_id) {
      this.alertService.warningAlert({
        content: 'Please select a bank account first.'
      });
      return;
    }
    this.dialog.open(ConfirmMicroDepositModalV4Component, {
      width: '100%',
      maxWidth: '448px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { bankAccountId: selectedBank.encrypted_bankacc_id }
    });
  }

  /** One-line holder address, skipping empty parts so no stray commas show. */
  holderAddress(): string {
    const info = this.bankDataService.checkNumberSignal();
    if (!info) return '';
    const join = (parts: (string | number | undefined)[], sep: string) =>
      parts.map((p) => String(p ?? '').trim()).filter(Boolean).join(sep);
    return join(
      [
        join([info.bankAccountAddressLine1, info.bankAccountAddressLine2], ' '),
        join([info.bankAccountCity, info.bankAccountState, info.bankAccountZip], ' '),
        info.bankAccountCountry
      ],
      ', '
    );
  }

  /** Which meta-line field was just copied; its icon shows a tick briefly. */
  copiedField = signal<'account' | 'routing' | undefined>(undefined);

  copyValue(value: string | undefined, field: 'account' | 'routing'): void {
    if (!value) return;
    this.clipboard.copy(value);
    this.copiedField.set(field);
    setTimeout(() => {
      if (this.copiedField() === field) this.copiedField.set(undefined);
    }, 1500);
  }

  openEditBankAccountV4(): void {
    const selectedBank = this.bankDataService.selectedBankAccountSignal();
    if (!selectedBank?.encrypted_bankacc_id) {
      this.alertService.warningAlert({
        content: 'Please select a bank account first.'
      });
      return;
    }
    this.dialog.open(EditBankAccountModalV4Component, {
      width: '100%',
      maxWidth: '510px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { id: selectedBank.encrypted_bankacc_id }
    });
  }

  openEmailPhoneVerificationV4(): void {
    this.dialog.open(EmailPhoneVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal',
      disableClose: false
    });
  }

  openMicroDepositV4(): void {
    const selectedBank = this.bankDataService.selectedBankAccountSignal();
    if (!selectedBank?.encrypted_bankacc_id) {
      this.alertService.warningAlert({
        content: 'Please select a bank account first.'
      });
      return;
    }
    this.dialog.open(MicroDepositModalV4Component, {
      width: '100%',
      maxWidth: '510px',
      panelClass: 'paddingless-modal',
      disableClose: true,
      data: { encrypted_bankacc_id: selectedBank.encrypted_bankacc_id }
    });
  }
}
