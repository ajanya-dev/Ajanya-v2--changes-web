import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  HostListener,
  viewChild,
  ElementRef,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, take, takeUntil } from 'rxjs';
import { ICardOnBoardingStatus } from 'src/app/models/wallet';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { environment } from 'src/environments/environment';
import { RainCardSelectBusinessComponent } from 'src/app/modules/wallet/wallet-v3/modals-v35/existing-business/raincard-select-businesss.component';
import { MatDialog } from '@angular/material/dialog';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { SideBarService } from 'src/app/layout/side-bar/side-bar.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { Params, Router } from '@angular/router';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { HeaderService } from 'src/app/shared/service/header/header.service'; 
import { RaincardHelperService } from '../wallet/wallet-v3/services/raincard-helper.service';
import { WelcomePageComponent } from './components/welcome-page/welcome-page.component';
import { ApplicationStatusComponent } from './components/application-status/application-status.component';
import { VirtualCardService } from './services/virtual-card.service';
import { FundYourWalletV35Component } from '../wallet/wallet-v3/modals-v35/fund-your-wallet-v35/fund-your-wallet-v35.component';
import { ComplianceFreezeComponent } from '../compliance-freeze/compliance-freeze.component';

type RequestStatus =
  | 'No Application'
  | 'Pending'
  | 'In Review'
  | 'Approved'
  | 'Rejected'
  | 'Loading'
  | 'Suspended';

@Component({
  selector: 'app-virtual-card',
  standalone: true,
  imports: [
    ApplicationStatusComponent,
    WelcomePageComponent,
    CommonButtonV35Component,
    DemoVideoComponent,
    ComplianceFreezeComponent
  ],
  templateUrl: './virtual-card.component.html',
  styleUrl: './virtual-card.component.scss'
})
export class VirtualCardComponent implements OnInit, OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private sanitizer = inject(DomSanitizer);
  private virtualCardService = inject(VirtualCardService);
  private payeeModalService = inject(PayeeModalService);
  private dialog = inject(MatDialog);
  private verificationService = inject(CommonVerificationService);
  private sidebarService = inject(SideBarService);
  private companyManagementService = inject(CompanyManagementService);
  private router = inject(Router);
  private raincardHelperService = inject(RaincardHelperService);
  private themeService = inject(ThemeService);
  private headerService = inject(HeaderService);

  clickedFromOutside = false;
  isZilMoney = environment.env_id === 'zilMoney';
  dynamicReactRoute = 'dashboard';
  routeParams: Params & { email?: string } = {} as Params & { email?: string };
  complianceFreeze = signal(false);

  private iframe =
    viewChild<ElementRef<HTMLIFrameElement>>('virtualCardIframe');

  @ViewChild('demoVideo', { static: false }) demoVideo!: ElementRef;

  destroy$ = new Subject<boolean>();

  requestStatus = signal<RequestStatus>('Loading');
  receivedCardCount = signal<number>(0);
  onboardingStatus = signal('');

  private addingNewWallet = false;
  showWelcomePage = signal(false);

  cardOnboardingStatus = signal<undefined | ICardOnBoardingStatus>(undefined);

  showStatus = computed(() => {
    const status = this.requestStatus();

    if (
      status === 'Loading' ||
      status === 'In Review' ||
      status === 'Pending'
    ) {
      return 'pending' as const;
    }

    if (status === 'Rejected' || status === 'Suspended') {
      return 'rejected' as const;
    }

    return undefined;
  });

  noApplication = computed(
    () => this.requestStatus() === 'No Application' || !this.requestStatus()
  );

  destory$ = new Subject();

  src: SafeResourceUrl;

  constructor() {
    this.updateIframeSrc();
  }

  updateIframeSrc() {
    const tempRoot = this.localStorageService.getItem('tempRoot');
    const currentTheme = this.localStorageService.getItem('user-theme');
    const encryptedUserId = this.localStorageService.getItem('encryptedUserId');

    let { rootUrl } = environment;
    const isZilMoney = environment.env_id === 'zilMoney';

    if (tempRoot && environment.isItDev) {
      rootUrl = `${tempRoot}/api/v4`;
    }

    if (this.router.getCurrentNavigation()?.extras.state) {
      this.dynamicReactRoute = this.router.getCurrentNavigation()?.extras.state?.dynamicReactRoute;
    }

    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://app.virtualcardmaker.com?token=${this.localStorageService.appToken}&baseUrl=${rootUrl}&companyId=${this.companyManagementService.getActiveCompanyId()}&isZilMoney=${isZilMoney}&theme=${currentTheme}&status=${this.onboardingStatus()}&dynamicReactRoute=${this.dynamicReactRoute}&encryptedUserId=${encryptedUserId}&is_iframe=true&isStandalone=true`
    );
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (event.data === 'add-new-payee') {
      this.openAddPayee();
      return;
    }

    if (event.data === 'add-new-wallet') {
      this.openRainCardOnboarding();
    }

    if (event.data === 'navigate-to-user-permissions') {
      this.router.navigate(['/manage/manage-users/index']);
      return;
    }

    if (event.data === 'physical-card-disabled') {
      this.raincardHelperService.handlePhysicalCardDisabled();
    }

    if (event.data === 'navigate-to-category-management') {
      this.router.navigate(['/manage/checkcatagory/index']);
    }

    if (event.data === 'add-fund') {
      this.openAddFund();
    }

    if (event.data === 'show-demo-video') {
      this.showDemoVideo();
    }

    if (event.data === 'start-application') {
      this.requestStatus.set(this.onboardingStatus() as RequestStatus);
      this.showWelcomePage.set(true);
    }
  }

  ngOnInit() {
    this.complianceFreeze.set(this.localStorageService.getItem('hasComplianceFreeze'));
    this.headerService.isSubHeaderVisible.next({
      hidden: true,
      animation: false
    });
    this.getCardOnboardingStatus();
    this.sidebarService.clickOnVirtualCard
      .pipe(takeUntil(this.destory$))
      .subscribe((val) => {
        if (val) {
          this.postMessage({ name: 'refresh' });
        }
      });

    this.themeService
      .getThemeSwitch()
      .pipe(takeUntil(this.destory$))
      .subscribe((isDarkMode: boolean) => {
        this.postMessage({ name: 'theme-switch', isDarkMode });
      });
  }

  openAddPayee() {
    this.payeeModalService
      .openAddPayee()
      .pipe(takeUntil(this.destory$))
      .subscribe((modal) => {
        if (modal) {
          modal
            .afterClosed()
            .pipe(takeUntil(this.destory$))
            .subscribe((res) => {
              if (!res?.success) return;

              this.postMessage({
                name: 'new-payee-added',
                payeeName: res.name || res.nickName
              });
            });
        }
      });
  }

  openRainCardOnboarding() {
    if (this.addingNewWallet) return;

    this.postMessage('adding-new-wallet');
    this.addingNewWallet = true;

    this.verificationService
      .applicationStatus()
      .pipe(take(1))
      .subscribe({
        next: ({ success, data: kycKybStatus }) => {
          if (success) {
            const ref = this.dialog.open(RainCardSelectBusinessComponent, {
              maxWidth: '515px',
              width: '100%',
              maxHeight: '85%',
              disableClose: true,
              autoFocus: false,
              data: {
                sourceType: CVSourceType.rain_card,
                applicationStatus: kycKybStatus,
                walletNeeded: true,
                mode: 'map',
                from: 'iframe',
                kybRecords: this.cardOnboardingStatus()?.active_user_kyb_records
              }
            });

            ref.afterClosed().subscribe((res) => {
              if (!res || !res.success) {
                this.postMessage('adding-new-wallet-failed');
                this.addingNewWallet = false;
                return;
              }

              this.postMessage({ name: 'new-wallet-added' });
              this.addingNewWallet = false;
            });
            return;
          }

          this.postMessage('adding-new-wallet-failed');
          this.addingNewWallet = false;
        },
        error: () => {
          this.postMessage('adding-new-wallet-failed');
          this.addingNewWallet = false;
        }
      });
  }

  getCardOnboardingStatus() {
    this.requestStatus.set('Loading');
    this.virtualCardService
      .getCardOnboardingStatus()
      .pipe(takeUntil(this.destory$))
      .subscribe({
        next: ({ success, data }) => {
          if (success) {
            this.requestStatus.set(data.status);
            this.onboardingStatus.set(data.status);
            this.cardOnboardingStatus.set(data);
            this.receivedCardCount.set(data.received_card_count);            
            if(data.received_card_count > 0 && this.noApplication()) {
              this.showReceivedGiftCards(true);
            }
            this.showWelcomePage.set(data.received_card_count === 0);
          } else {
            this.requestStatus.set('No Application');
          }
          this.updateIframeSrc();
        },
        error: () => {
          this.requestStatus.set('No Application');
        }
      });
  }

  openAddFund() {
    const modal = this.dialog.open(FundYourWalletV35Component, {
      width: '700px',
      maxWidth: '93%',
      disableClose: true,
      data: {
        fundType: 'crypto'
      }
    });
    modal.afterClosed().subscribe((res) => {
      if (res?.closedFrom === 'close-button') {
        return;
      }
      if (res !== false) {
        this.postMessage({ name: 'fund-added' });
      }
    });
  }

  postMessage(data: unknown) {
    const iframe = this.iframe()?.nativeElement;

    if (!iframe) return;
    iframe.contentWindow?.postMessage(data, '*');
  }

  showDemoVideo() {
    this.clickedFromOutside = true;
  }

  onChangeStatus(status: RequestStatus) {    
    this.requestStatus.set(status);
  }

  showReceivedGiftCards(value: boolean) {    
    if (value) {
      this.requestStatus.set('Approved');
      this.dynamicReactRoute = 'cards';
      this.updateIframeSrc();
    }
  }

  ngOnDestroy(): void {
    this.destory$.next(true);
    this.destory$.complete();
  }
}
