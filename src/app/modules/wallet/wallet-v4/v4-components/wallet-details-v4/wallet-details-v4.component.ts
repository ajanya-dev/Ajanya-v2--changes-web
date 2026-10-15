import { Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { LucideAngularModule } from 'lucide-angular';
import { v4LucideIconsMap } from 'src/app/layout/v4-layout/lucide-v4-icons';
import { IWalletData } from 'src/app/models/wallet';
// import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatDialog } from '@angular/material/dialog';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCircleArrowDown,
  faCircleArrowUp,
  faDownload,
  faGlobe,
  faPaperPlane,
  faPlus,
  faRightLeft
} from '@fortawesome/pro-solid-svg-icons';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { AddBankMethodChoiceModalComponent } from 'src/app/modules/bank/bank-v4/v4-modals/add-bank-method-choice-modal/add-bank-method-choice-modal.component';
import { V4TransferFundsModalComponent } from 'src/app/shared/modal/v4-transfer-funds/v4-transfer-funds-modal.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { combineLatest, filter, finalize, take } from 'rxjs';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { CommonButtonV4Component } from '../../../../../shared/V4/buttons/common-button-v4/common-button-v4.component';
import { WalletDataV35Service } from '../../../wallet-v3/services/wallet-data-v35.service';
import { DownloadStatementV4ModalComponent } from '../../modals/download-statement-v4/download-statement-v4-modal.component';
import { FundYourWalletV4ModalComponent } from '../../modals/fund-your-wallet-v4/fund-your-wallet-v4-modal.component';
import { RechargeCreditsV4ModalComponent } from '../../modals/recharge-credits-v4/recharge-credits-v4-modal.component';
import { WithdrawFundsV4ModalComponent } from '../../modals/withdraw-funds-v4/withdraw-funds-v4-modal.component';
import { VerificationRequiredModalComponent } from 'src/app/shared/modal/verification-required-modal/verification-required-modal.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WalletV4EventsService } from '../../v4-services/wallet-v4-events.service';

@Component({
  standalone: true,
  selector: 'app-wallet-details-v4',
  templateUrl: './wallet-details-v4.component.html',
  styleUrls: ['./wallet-details-v4.component.scss'],
  imports: [
    NgClass,
    NgOptimizedImage,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class WalletDetailsV4Component {
  /** Lucide icons for action buttons (use with [img] in template) */
  readonly icons = v4LucideIconsMap;

  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPaperPlane,
      faRightLeft,
      faPlus,
      faCircleArrowDown,
      faCircleArrowUp,
      faDownload,
      faGlobe
    );

    // Refresh wallet balance after any payment completion
    this.paymentsV4Service.paymentCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.walletDataService
          .refreshWalletDataAndStore()
          .pipe(take(1))
          .subscribe();
      });

    // The transactions grid below sits in a sibling component with no handle on
    // this one, so its empty-state CTA asks for the flow through the shared
    // events service instead of re-implementing the verification gate and
    // payment payload.
    this.walletV4Events.sendMoneyRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sendPayments());

    this.openWithdrawForArrivingPayee();
  }

  /** Magic-link arrival: open withdraw once the flag and the payee's auto-selected wallet are both ready. */
  private openWithdrawForArrivingPayee(): void {
    combineLatest([
      toObservable(this.payeeOnboardingService.openWithdrawOnArrival),
      toObservable(this.walletDataService.walletDataSignal)
    ])
      .pipe(
        filter(([requested, wallet]) => requested && !!wallet?.id),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([, wallet]) => {
        this.payeeOnboardingService.openWithdrawOnArrival.set(false);
        this.menuAction(wallet, 4);
      });
  }

  public walletDataService = inject(WalletDataV35Service);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  // private paymentsService = inject(PaymentsService);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private headerService = inject(HeaderService);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private v4AlertService = inject(V4AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private destroyRef = inject(DestroyRef);
  private paymentsV4Service = inject(PaymentsV4Service);
  private banAccountService = inject(BankAccountsService);
  private customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private commonOnInitService = inject(CommonOnInitService);
  private paymentsService = inject(PaymentsService);
  private walletV4Events = inject(WalletV4EventsService);

  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  externalTokenSignal = computed(
    () => this.payeeOnboardingService.payeeOnboardingSignal().externalToken
  );

  isAllWalletsView = computed(
    () =>
      !this.walletDataService.walletDataSignal()?.id ||
      this.walletDataService.walletDataSignal()?.id === ''
  );

  walletName = computed(
    () => this.walletDataService.walletDataSignal()?.walletName || 'All Wallets'
  );

  walletLogo = computed(() => this.walletDataService.walletDataSignal()?.logo);

  displayBalance = computed(() => {
    const wallet = this.walletDataService.walletDataSignal();
    if (wallet?.id && wallet.id !== '') {
      return {
        label1: 'CURRENT BALANCE',
        value1: wallet.currentBalance,
        label2: 'AVAILABLE',
        value2: wallet.availableBalance
      };
    }
    const accounts = this.walletDataService.walletAccountsSignal();
    return {
      label1: 'TOTAL BALANCE',
      value1: accounts?.totalCurrentBalance,
      label2: 'AVAILABLE',
      value2: accounts?.totalAvailableBalance
    };
  });

  activeCount = computed(
    () =>
      this.walletDataService.walletAccountsSignal()?.totalCount ??
      this.walletDataService.walletAccountsSignal()?.data?.length ??
      0
  );

  hasWalletAccounts = computed(
    () =>
      (this.walletDataService.walletAccountsSignal()?.data?.length ?? 0) !== 0
  );

  /**
   * Executes an action on a wallet based on the provided parameters.
   */
  menuAction(wallet?: IWalletData, walletAction?: number) {
    if (!walletAction) return;
    if (walletAction === 1) {
      this.dialog.open(FundYourWalletV4ModalComponent, {
        width: '700px',
        maxWidth: '93%',
        panelClass: 'paddingless-modal-rounded',
        data: wallet,
        disableClose: true
      });
      return;
    }
    if (walletAction === 2) {
      this.dialog.open(RechargeCreditsV4ModalComponent, {
        width: '650px',
        maxWidth: '93%',
        panelClass: 'paddingless-modal-rounded',
        data: wallet,
        disableClose: true
      });
      return;
    }
    if (walletAction === 4) {
      this.dialog.open(WithdrawFundsV4ModalComponent, {
        width: '650px',
        maxWidth: '93%',
        panelClass: 'paddingless-modal-rounded',
        data: wallet,
        disableClose: true
      });
      return;
    }
    if (walletAction === 5) {
      this.dialog.open(DownloadStatementV4ModalComponent, {
        width: '480px',
        maxWidth: '95vw',
        panelClass: 'paddingless-modal-rounded',
        data: wallet,
        disableClose: true
      });
      return;
    }
    if (walletAction === 7) {
      this.router.navigate(['/v4/manage/wallet/card/create-card'], {
        queryParams: {
          walletId: wallet?.uuId,
          businessId: this.walletDataService.onBoardedBusinessSignal()
        }
      });
      return;
    }
    if (walletAction === 8) {
      this.router.navigate(['/v4/manage/virtual-card'], {
        state: { dynamicReactRoute: 'cards' }
      });
      return;
    }
    if (walletAction === 9 && wallet) {
      this.internationalPayments(wallet);
      return;
    }
    if (this.externalTokenSignal() && [4, 2].includes(walletAction)) {
      this.router.navigate(['/v4/manage/payee-onboarding/set-password']);
      return;
    }
    if (walletAction === 10 && wallet) {
      this.router.navigate(['/v4/manage/virtual-card']);
    }
    this.walletDataService.openModal({ wallet, walletAction });
  }

  internationalPayments(selectedWallet: IWalletData) {
    // eslint-disable-next-line no-underscore-dangle -- HeaderService exposes header data via _headerData
    this.headerService._headerData
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const response = res as IHeaderData;
        if (response.rippleInternationalPaymentEnabled) {
          if (this.isUserUnverified()) {
            this.goToVerify();
            return;
          }
          const kycStatus =
            this.localStorageService.getItem('gettingStartedData')?.kycStatus;
          if (kycStatus === null) {
            this.openKycModal();
            return;
          }
          this.router.navigate(['/v4/manage/international-payment'], {
            queryParams: {
              walletId: selectedWallet?.uuId
            }
          });
          this.walletDataService.internationalPayment.update((value) => ({
            ...value,
            selectedWallet
          }));
        } else {
          this.v4AlertService
            .infoAlert({
              content:
                'Please contact our customer support to enable this feature.',
              isOk: true,
              isCancel: true,
              doneMsg: 'Contact Now',
              cancelMsg: 'Not Now'
            })
            .afterClosed()
            .subscribe((dialogResult) => {
              if (dialogResult) {
                this.dynamicWhiteLabelService.goToLiveChat();
              }
            });
        }
      });
  }

  openKycModal() {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyc', CVSourceType.other, true)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    } else {
      this.router.navigateByUrl('/v4/manage/users/verify-user-id?type=6');
    }
  }

  isUserUnverified(): boolean {
    const gettingStartedData =
      this.localStorageService.getItem('gettingStartedData');
    return gettingStartedData?.verification === 0;
  }

  goToVerify() {
    this.commonOnInitService.openEmailPhoneVerificationModal();
  }

  transferFromWallet(walletData?: IWalletData) {
    if (this.externalTokenSignal()) {
      this.router.navigate(['/v4/manage/payee-onboarding/set-password']);
      return;
    }
    if (!walletData) return;
    this.dialog.open(V4TransferFundsModalComponent, {
      maxWidth: '560px',
      width: '100%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        transferFrom: 2,
        transferFromId: walletData?.uuId
      }
    });
  }

  sendPayments() {
    if (this.externalTokenSignal()) {
      this.router.navigate(['/v4/manage/payee-onboarding/set-password']);
      return;
    }
    const wallet = this.walletDataService.walletDataSignal();
    if (!wallet) return;
    this.dialog.closeAll();
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');

    if (phoneVerified === 0 || emailVerified === 0) {
      this.dialog.open(VerificationRequiredModalComponent, {
        width: '400px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          description:
            'You need to verify your email and phone number to send payments.'
        }
      });
      return;
    }
    this.paymentsService.initiatePaymentForm = { wallet };
    this.router.navigate(['/v4/manage/payments/pay/wallet/ach'], {
      state: { backUrl: this.router.url }
    });
  }

  private openAddBankMethodChoiceModal(): void {
    this.customDoubleSideModalService.open(AddBankMethodChoiceModalComponent, {
      width: '480px',
      disableClose: true
    });
  }

  onNew() {
    if (this.banAccountService.isPermissionPopupEnabled) {
      return;
    }

    if (this.payeeOnboardingService.payeeOnboardingSignal().initiatorId) {
      this.router.navigate(['/v4/manage/payee-onboarding/set-password']);
      return;
    }

    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        if (isUser) {
          this.banAccountService.isPermissionPopupEnabled = true;
          this.banAccountService
            .AddBank({ permission_check_to_create_bank_account: '' })
            .pipe(
              finalize(() => {
                this.banAccountService.isPermissionPopupEnabled = false;
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
}
