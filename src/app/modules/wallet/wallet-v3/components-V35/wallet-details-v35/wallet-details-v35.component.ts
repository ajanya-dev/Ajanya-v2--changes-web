import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { TransferDetailsService } from 'src/app/modules/transfers/services/transfer-details.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Router } from '@angular/router';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, NgIf, NgOptimizedImage, NgStyle } from '@angular/common';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Store } from '@ngrx/store';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';
import { WalletSettingV35Component } from '../../modals-v35/wallet-setting-v35/wallet-setting-v35.component';
import { WalletTransactionsV35Component } from '../wallet-transactions-v35/wallet-transactions-v35.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ScrollListenerDirective } from '../../../../../directive/scroll-listner.directive';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { ManageCardV35Component } from '../manage-card-v35/manage-card-v35.component';
import { RainCardSubmittedComponent } from '../rain-card-submitted/rain-card-submitted.component';
import { RaincardHelperService } from '../../services/raincard-helper.service';
import { WalletLogoUpdateModalComponent } from '../wallet-logo-update-modal/wallet-logo-update-modal.component';

@Component({
  selector: 'app-wallet-details-v35',
  templateUrl: './wallet-details-v35.component.html',
  styleUrls: ['./wallet-details-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    MatTooltip,
    DemoVideoComponent,
    ScrollListenerDirective,
    CommonButtonV35Component,
    NgIf,
    WalletTransactionsV35Component,
    WhiteLabelPipe,
    NgStyle,
    NgOptimizedImage,
    ManageCardV35Component,
    RainCardSubmittedComponent,
    TruncatePipe
  ]
})
export class WalletDetailsV35Component implements OnInit, OnDestroy {
  @ViewChild('mainSection') mainSection: ElementRef<HTMLDivElement>;

  /**
   * Injecting dependencies using inject method
   */
  public walletDataService = inject(WalletDataV35Service);
  private router = inject(Router);
  private transferDetailsService = inject(TransferDetailsService);
  private dialog = inject(MatDialog);
  private paymentsService = inject(PaymentsService);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private raincardHelperService = inject(RaincardHelperService);
  private headerService = inject(HeaderService);
  private commonOnInitService = inject(CommonOnInitService);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private store = inject(Store);
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  /**
   * Variables
   */
  isShadow = false;
  subscription: Subscription[] = [];
  tabs = [
    {
      label: 'Details',
      value: 'details'
    },
    // {
    //   label: 'Cards',
    //   value: 'card'
    // }
  ];

  currentTab: 'details' | 'card' = 'details';

  externalTokenSignal = computed(
    () => this.payeeOnboardingService.payeeOnboardingSignal().externalToken
  );

  ngOnInit(): void {
    this.getSelectedTab();
    if (this.isArcharina) {
      this.tabs = [
        {
          label: 'Details',
          value: 'details'
        }
      ];
    }
  }

  getSelectedTab() {
    this.subscription.push(
      this.walletDataService.selectedWalletTab$.subscribe((val) => {
        this.currentTab = val.tab;
      })
    );
  }

  /**
   * @description Executes an action on a wallet based on the provided parameters.
   * @param {IWalletData} wallet - Selected wallet.
   * @param {number} walletAction - The action code to perform on the wallet.
   */
  menuAction(wallet?: IWalletData, walletAction?: number) {
    if (!walletAction) return;
    if (walletAction === 7) {
      this.router.navigate(['/manage/wallet/card/create-card'], {
        queryParams: {
          walletId: wallet?.uuId,
          businessId: this.walletDataService.onBoardedBusinessSignal()
        }
      });
      return;
    }
    if (walletAction === 8) {
      // this.walletDataService.selectedWalletTab = {
      //   tab: 'card'
      // };
      this.router.navigate(['/manage/virtual-card'],{state: {dynamicReactRoute: 'cards'}});
      return;
    }
    if (walletAction === 9 && wallet) {
      this.internationalPayments(wallet);
      return;
    }
    if (this.externalTokenSignal() && [4, 2].includes(walletAction)) {
      this.router.navigate(['/manage/payee-onboarding/set-password']);
      return;
    }

    if (walletAction === 10 && wallet) {
      this.router.navigate(['/manage/virtual-card']);
    }

    this.walletDataService.openModal({ wallet, walletAction });
  }

  internationalPayments(selectedWallet: IWalletData) {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData.subscribe((res) => {
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
        this.router.navigate(['/manage/international-payment'], {
          queryParams: {
            walletId: selectedWallet?.uuId
          }
        });
        this.walletDataService.internationalPayment.update((value) => ({
          ...value,
          selectedWallet
        }));
      } else {
        this.commonOnInitService.contactAlert();
      }
    });
  }

  openKycModal() {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyc', CVSourceType.other, true)
        .subscribe();
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=6');
    }
  }

  isUserUnverified(): boolean {
    const gettingStartedData =
      this.localStorageService.getItem('gettingStartedData');
    return gettingStartedData?.verification === 0;
  }

  goToVerify() {
    this.router.navigate(['/manage/users/verify-email-phone'], {
      queryParams: {
        returnUrl: '/manage/wallet/transactions'
      }
    });
  }

  /**
   * @description Transfers funds from a selected wallet.
   * @param walletData - The selected wallet data.
   */
  transferFromWallet(walletData?: IWalletData) {
    if (this.externalTokenSignal()) {
      this.router.navigate(['/manage/payee-onboarding/set-password']);
      return;
    }

    if (!walletData) return;

    this.transferDetailsService.setData({
      transferFrom: 2,
      transferFromId: walletData?.uuId,
      displayName: walletData.walletName
        ? `${walletData?.walletName} (${walletData?.availableBalance}) (${walletData?.bankAccountNumber})`
        : ''
    });
    this.router.navigate(['/manage/transfers']);
  }

  /**
   * @description Opens the wallet settings modal dialog.
   */
  openSettings(): void {
    this.dialog.open(WalletSettingV35Component, {
      width: '510px',
      maxWidth: '93%'
    });
  }

  /**
   * @description send payments from selected wallet
   */
  sendPayments() {
    if (this.externalTokenSignal()) {
      this.router.navigate(['/manage/payee-onboarding/set-password']);
      return;
    }
    if (
      this.walletDataService.walletDataSignal()?.id &&
      this.walletDataService.walletDataSignal()?.id !== ''
    ) {
      this.paymentsService.initiatePaymentForm = {
        wallet: this.walletDataService.walletDataSignal()
      };
    }
    this.router.navigate(['/manage/payments/main/pay/wallet/ach'], {
      state: { backUrl: this.router.url }
    });
  }

  /**
   * @description Navigates to the "Add Bank Account" page.
   */
  onNew() {
    this.router.navigate([`/manage/users/add-bank-account`]);
  }

  toggleAccountDetails(tab: 'details' | 'card'): void {
    if (this.currentTab === tab) {
      return;
    }
    if (
      this.raincardHelperService.userService.isUserDataLoading ||
      this.raincardHelperService.rainCardLoading
    ) {
      return;
    }
    this.currentTab = tab;
    if (
      this.walletDataService.onBoardingStatusSignal() === 'welcome' &&
      this.currentTab === 'card'
    ) {
      this.createCardPage();
    }
    this.walletDataService.selectedWalletTab = {
      tab: this.currentTab
    };
  }

  get cardSize() {
    if (window.innerWidth < 1366) {
      return '0.9rem';
    }
    return '1.1rem';
  }

  /**
   * @description Handles the card creation flow including verification checks
   * @param wallet Optional wallet data for card creation
   */
  createCardPage(): void {
    this.router.navigate(['/manage/virtual-card'],{state: {dynamicReactRoute: 'cards/new'}});
  }

  /**
   * @description Handles the scroll event for a main section element, adding or removing the 'scrolled' class
   * to the top section element based on the scroll position.
   */

  onScroll() {
    const mainSectionElement = this.mainSection.nativeElement;
    if (mainSectionElement.scrollTop > 0) {
      this.isShadow = true;
    } else {
      this.isShadow = false;
    }
  }

  /**
   * @description Open Ach requests page.
   */
  openAchRequests() {
    window.open('/manage/wallet/manual-ach/request');
  }

  openZelleTransactions() {
    window.open('/manage/wallet/zelle/transactions');
  }
  
  openPrenoteAch() {
    window.open('/manage/wallet/prenote-ach');
  }

  openLogoUpdateModal() {
    const walletData = this.walletDataService.walletDataSignal();
    this.dialog
      .open(WalletLogoUpdateModalComponent, {
        panelClass: 'paddingless-modal',
        width: '400px',
        disableClose: true,
        data: {
          wallet: walletData,
          businessName:
            walletData?.walletName || walletData?.displayName || 'My Wallet',
          from: 'list'
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && result.success) {
          const updatedWallet = {
            ...walletData,
            logo: result.wallet
          } as IWalletData;

          this.walletDataService.walletDataSignal.set(updatedWallet);

          this.walletDataService.setWallets();

          this.store.dispatch(WalletsActions.walletsReset());
          this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
