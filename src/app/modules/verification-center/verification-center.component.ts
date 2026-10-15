import {
  faCreditCard,
  faCheck,
  faCloud,
  faFileArrowUp
} from '@fortawesome/pro-regular-svg-icons';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonModule, NgClass, TitleCasePipe } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import {
  IGettingStartedAPI,
  IGettingStartedData
} from 'src/app/models/getting-started';
import {
  faBank,
  faCloudArrowUp,
  faComputer,
  faEnvelope,
  faHeadset,
  faMessage,
  faPlay,
  faWallet
} from '@fortawesome/pro-solid-svg-icons';
import { environment } from 'src/environments/environment';
import {
  faCalendar,
  faCalendarCheck,
  faCrown
} from '@fortawesome/pro-thin-svg-icons';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { VerificationCardComponent } from './components/verification-card/verification-card.component';
import { VERIFICATION_CARDS } from './constants/verification-center.constants';
import { VerificationCenterBusinessesComponent } from './components/verification-center-businesses/verification-center-businesses.component';
import { VerificationCenterBankAccountsComponent } from './components/verification-center-bank-accounts/verification-center-bank-accounts.component';
import { VerificationCenterCardsComponent } from './components/verification-center-cards/verification-center-cards.component';
import { VerificationCenterWalletsComponent } from './components/verification-center-wallets/verification-center-wallets.component';
import { VerificationCenterSubscriptionComponent } from './components/verification-center-subscription/verification-center-subscription.component';
import { DynamicWhiteLabelService } from '../dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from '../dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { WhiteLabel } from '../dynamic-white-label/dynamic-white-label-data/dynamic-white-label-data';

@Component({
  selector: 'app-verification-center',
  standalone: true,
  imports: [
    VerificationCardComponent,
    CommonButtonV35Component,
    FontAwesomeModule,
    VerificationCenterBusinessesComponent,
    VerificationCenterBankAccountsComponent,
    VerificationCenterCardsComponent,
    VerificationCenterWalletsComponent,
    VerificationCenterSubscriptionComponent,
    TitleCasePipe,
    NgClass,
    CommonModule,
    WhiteLabelDirective
  ],
  templateUrl: './verification-center.component.html',
  styleUrl: './verification-center.component.scss'
})
export class VerificationCenterComponent implements OnInit, OnDestroy {
  verifications = Object.values(VERIFICATION_CARDS);
  public gettingStartedService = inject(GettingStartedService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  gettingStartedDetails: IGettingStartedAPI;
  gettingStartedInfo: IGettingStartedData;
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;

  dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();
  currentEnvironmentId = environment.env_id;
  verificationsList: string[] = [];
  userName: string;
  subscriptions: Subscription[] = [];
  private localStorageService = inject(LocalStorageService);
  productName = environment.isItWhiteLabel
    ? environment.productName
    : 'Zil Money';

  loading = false;
  isHideBookDemo = false;
  faMessage = faMessage;
  faHeadset = faHeadset;
  faCreditCard = faCreditCard;
  faBank = faBank;
  faCheck = faCheck;
  faMoniter = faComputer;
  faCloudBank = faCloud;
  faUpload = faFileArrowUp;
  faCloudUp = faCloudArrowUp;
  faWallet = faWallet;
  faCrown = faCrown;
  faPlay = faPlay;
  faEnvelope = faEnvelope;
  faHeadSet = faHeadset;
  faCalendar = faCalendar;
  faCalendarCheck = faCalendarCheck;
  isOlliePay = false;
  completionLabels = [
    { label: 'Email Verification', key: 'isEmailVerificationDone' },
    { label: 'Phone Number Verification', key: 'isPhoneVerificationDone' },
    { label: 'KYC Verification', key: 'isKycStatusDone' },
    { label: 'KYB Verification', key: 'isKybStatusDone' }
  ];

  ngOnInit(): void {
    this.getWhiteLabel();
    this.getGettingStartedData();
    this.userName = this.localStorageService.getItem('username');
    if (environment.env_id === 'olliepay') {
      this.isOlliePay = true;
    }
  }

  getGettingStartedData(): void {
    this.loading = true;
    this.subscriptions.push(
      this.gettingStartedService
        .getGettingStartedDataApi()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.gettingStartedDetails = res.data;
              this.localStorageService.setItem('gettingStartedData', res.data);
            }
          }
        })
    );
    this.gettingStartedService.initialGettingStartedData$.subscribe((res) => {
      this.gettingStartedInfo = res;
    });
  }

  getWhiteLabel(): void {
    const currentWhiteLabel = this.dynamicWhiteLabelData.find(
      (whiteLabel) => whiteLabel.environmentId === this.currentEnvironmentId
    );

    if (currentWhiteLabel) {
      this.isHideBookDemo = currentWhiteLabel.flags?.hideDemoButton || false;
    }

    // if (this.isHideBookDemo) {
    //   this.verificationsList = ['check',  'digitalPayment'];
    // } else {
    //   this.verificationsList = this.verifications;
    // }

    this.verificationsList = ['check',  'digitalPayment'];

  }

  /**
   * @description Method to open live chat
   */
  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  get completionPercent(): number {
    const total = this.completionLabels.length;
    const completed = this.completionLabels.filter(
      (item) => this.gettingStartedInfo?.[item.key as keyof IGettingStartedData]
    ).length;
    return Math.round((completed / total) * 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}
