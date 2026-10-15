import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  HostBinding,
  HostListener,
  viewChild,
  ElementRef,
  ViewChild,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Params, Router } from '@angular/router';
import { take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ICardOnBoardingStatus } from 'src/app/models/wallet';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { SideBarService } from 'src/app/layout/side-bar/side-bar.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { RaincardSelectBusinessV4Component } from 'src/app/modules/payments/shared/modal/v4/raincard-select-business-v4/raincard-select-business-v4.component';
import { FundYourWalletV4ModalComponent } from 'src/app/modules/wallet/wallet-v4/modals/fund-your-wallet-v4/fund-your-wallet-v4-modal.component';
import { RaincardHelperService } from 'src/app/modules/wallet/wallet-v3/services/raincard-helper.service';
import { VirtualCardService } from '../virtual-card/services/virtual-card.service';
import { WelcomePageV4Component } from './v4-components/welcome-page-v4/welcome-page-v4.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { ComplianceFreezeComponent } from '../compliance-freeze/compliance-freeze.component';
import { ApplicationStatusV4Component } from './v4-components/application-status-v4/application-status-v4.component';

type RequestStatus =
  | 'No Application'
  | 'Pending'
  | 'In Review'
  | 'Approved'
  | 'Rejected'
  | 'Loading'
  | 'Suspended';

@Component({
  selector: 'app-virtual-card-v4',
  standalone: true,
  imports: [
    ApplicationStatusV4Component,
    WelcomePageV4Component,
    DemoVideoComponent,
    ComplianceFreezeComponent
  ],
  templateUrl: './virtual-card-v4.component.html'
})
export class VirtualCardV4Component implements OnInit {
  // The v4 content outlet is a flex column; fill it so the iframe's h-full resolves.
  @HostBinding('class') readonly hostClass = 'flex flex-col flex-1 min-h-0';

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
  private destroyRef = inject(DestroyRef);

  clickedFromOutside = false;
  isZilMoney = environment.env_id === 'zilMoney';
  dynamicReactRoute = 'dashboard';
  routeParams: Params & { email?: string } = {} as Params & { email?: string };

  complianceFreeze = signal(false);
  requestStatus = signal<RequestStatus>('Loading');
  receivedCardCount = signal<number>(0);
  onboardingStatus = signal('');
  cardOnboardingStatus = signal<undefined | ICardOnBoardingStatus>(undefined);
  showWelcomePage = signal(false);

  private addingNewWallet = false;

  private iframe = viewChild<ElementRef<HTMLIFrameElement>>('virtualCardIframe');
  @ViewChild('demoVideo', { static: false }) demoVideo!: ElementRef;

  src!: SafeResourceUrl;

  showStatus = computed<'pending' | 'rejected' | undefined>(() => {
    const status = this.requestStatus();
    if (status === 'In Review' || status === 'Pending') return 'pending';
    if (status === 'Rejected' || status === 'Suspended') return 'rejected';
    return undefined;
  });

  noApplication = computed(
    () => this.requestStatus() === 'No Application' || !this.requestStatus()
  );

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
      this.dynamicReactRoute =
        this.router.getCurrentNavigation()?.extras.state?.dynamicReactRoute;
    }

    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://app.virtualcardmaker.com?token=${this.localStorageService.appToken}&baseUrl=${rootUrl}&companyId=${this.companyManagementService.getActiveCompanyId()}&isZilMoney=${isZilMoney}&theme=${currentTheme}&status=${this.onboardingStatus()}&dynamicReactRoute=${this.dynamicReactRoute}&encryptedUserId=${encryptedUserId}&isStandalone=true&is_iframe=true`
    );
    // this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
    //   `https://app.virtualcardmaker.com?token=${this.localStorageService.appToken}&seonSessionId=${XDevicePrint}&baseUrl=${rootUrl}&companyId=${this.companyManagementService.getActiveCompanyId()}&isZilMoney=${isZilMoney}&theme=${currentTheme}&status=${this.onboardingStatus()}&dynamicReactRoute=${this.dynamicReactRoute}&encryptedUserId=${encryptedUserId}`
    // );
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
      this.router.navigate(['/v4/manage/manage-users/index']);
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
    this.complianceFreeze.set(
      this.localStorageService.getItem('hasComplianceFreeze')
    );
    this.getCardOnboardingStatus();

    this.sidebarService.clickOnVirtualCard
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val) this.postMessage({ name: 'refresh' });
      });

    this.themeService
      .getThemeSwitch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isDarkMode: boolean) => {
        this.postMessage({ name: 'theme-switch', isDarkMode });
      });
  }

  getCardOnboardingStatus() {
    this.requestStatus.set('Loading');
    this.virtualCardService
      .getCardOnboardingStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ success, data }) => {
          if (success) {
            this.requestStatus.set(data.status);
            this.onboardingStatus.set(data.status);
            this.cardOnboardingStatus.set(data);
            this.receivedCardCount.set(data.received_card_count);
            if (data.received_card_count > 0 && this.noApplication()) {
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

  openAddPayee() {
    this.payeeModalService
      .openAddPayee()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((modal) => {
        if (modal) {
          modal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
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
            const ref = this.dialog.open(RaincardSelectBusinessV4Component, {
              width: '600px',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
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

  openAddFund() {
    const modal = this.dialog.open(FundYourWalletV4ModalComponent, {
      width: '700px',
      maxWidth: '93%',
      disableClose: true
    });
    modal.afterClosed().subscribe((res) => {
      if (res !== false) this.postMessage({ name: 'fund-added' });
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
}
