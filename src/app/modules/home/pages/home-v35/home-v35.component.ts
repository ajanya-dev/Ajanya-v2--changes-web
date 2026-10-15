import { Component, inject, OnInit, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { of, Subject, firstValueFrom, Subscription } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { UserService } from 'src/app/shared/service/user/user.service';
import {
  INotificationDetails,
  INotificationContent,
  IAllCompanies,
  IInvitedCompany
} from 'src/app/layout/model/header';
import { AddBillModalComponent } from 'src/app/modules/bill/modals/add-bill-modal/add-bill-modal.component';
import { AddInvoiceComponent } from 'src/app/modules/invoices/modals/add-invoice/add-invoice.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { UserDocsUploadModalComponent } from 'src/app/shared/modal/user-docs-upload-modal/user-docs-upload-modal.component';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { FeatureApplyCouponModalComponent } from 'src/app/modules/refill-credit/modals/feature-apply-coupon-modal/feature-apply-coupon-modal.component';
import { IRewardData } from 'src/app/modules/auth/model/login';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  NgClass,
  NgOptimizedImage,
  NgStyle,
  DecimalPipe
} from '@angular/common';
import { SuggestFeedbackComponent } from 'src/app/shared/modal/suggest-feedback/suggest-feedback.component';
import { environment } from 'src/environments/environment';
import { faCheck, faCrown, faLock } from '@fortawesome/pro-regular-svg-icons';
import {
  faBuilding,
  faCamera,
  faTriangleExclamation
} from '@fortawesome/pro-solid-svg-icons';
import { UploadImageModalComponent } from 'src/app/shared/modal/upload-image-modal/upload-image-modal.component';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Utils } from 'src/app/data/utils';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { WhiteLabelDirective } from '../../../../directive/white-label.directive';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { PaymentsMainV35Component } from '../../../payments/shared/components/payments-main-v35/payments-main-v35.component';

/**
 * @description Home component.
 */
@Component({
  selector: 'app-home-v35',
  templateUrl: './home-v35.component.html',
  styleUrls: ['./home-v35.component.scss'],
  standalone: true,
  imports: [
    PaymentsMainV35Component,
    NgClass,
    CommonButtonV35Component,
    NgOptimizedImage,
    WhiteLabelDirective,
    FaIconComponent,
    RouterLink,
    NgStyle,
    WhiteLabelDirective,
    DecimalPipe,
    NgClass
  ]
})
export class HomeV35Component implements OnInit, AfterViewInit, OnDestroy {
  private matDialog = inject(MatDialog);
  private userService = inject(UserService);
  private router = inject(Router);
  public headerService = inject(HeaderService);
  private themeService = inject(ThemeService);
  private gettingStartedService = inject(GettingStartedService);
  private activatedRoute = inject(ActivatedRoute);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private localStorageService = inject(LocalStorageService);
  private payeeModalService = inject(PayeeModalService);
  private userProfileService = inject(UserProfileService);
  private alertService = inject(AlertService);

  private destroy$ = new Subject<void>();

  showMyRequests = true;
  isHide = false;
  notifications: INotificationDetails[] = [];
  notificationsLoading = false;
  newNotifications = false;
  isPlexeNotification = false;
  plexeCreditLimit: number;
  isShowPlexeNotification = false;
  isDarkMode: boolean;
  selectedNotificationBarTab: 'new' | 'details' = 'new';
  isPayeeDetailsOpen = false;
  trueCount = 2;
  kycRejected = false;
  kybRejected = false;
  verificationStatus = {
    1: false,
    2: false
  };

  checkDesignNotification: boolean;
  statusClass = {
    1: 'not_verified',
    2: 'not_verified'
  };

  subscriptions: Subscription[] = [];

  gettingStartedLoading: boolean;
  rewards: IRewardData | undefined;
  isLoading = false;
  showRewardCard = true;
  env = environment;
  faLoack = faLock;
  faCrown = faCrown;
  faCheck = faCheck;
  faBuilding = faBuilding;
  faCamera = faCamera;
  faWarning = faTriangleExclamation;
  verificationDetails: IGettingStartedAPI;
  userVerfied = false;
  kycDone = false;
  kybDone = false;
  isAllVerificationDone = false;
  gettingStartedLoader = false;
  loaded = false;
  showCheckMailNotification = signal(false);
  isSubscribed = signal(false);
  isLoginAsClient = signal(false);
  activeCompanyName = signal(this.localStorageService.getItem('activeCompanyName'));
  activeCompanyLogo = signal('');
  logoUploading = signal(false);
  
  ngAfterViewInit(): void {
    this.verificationDetails = this.localStorageService.getItem('gettingStartedData');
  }

  ngOnInit(): void {
    this.gettingStartedLoadingData();
    this.checkIsPayeeOnBoarding();
    this.checkDarkMode();
    this.getVerificationStatus();
    this.getNotification();
    this.checkPlexeNotificationShow();
    this.showPremiumCheckNotification();
    this.gettingStartedService.gettingStartedLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.gettingStartedLoading = res;
      });
    this.rewards = JSON.parse(
      this.localStorageService.getItem('reward') as string
    );
    this.verificationDetails = this.localStorageService.getItem('gettingStartedData');
    this.getUserOverallData();
  }

  getUserOverallData() {
    this.subscriptions.push(
      this.userService.userOverallData.subscribe((res) => {
        if (res !== undefined) {
          this.showCheckMailNotification.set(res?.checkMailExist === 0);
        }
      })
    );
  }

  showPremiumCheckNotification() {
    const show = this.localStorageService.getItem(
      'showPremiumCheckNotification'
    );
    if (show) {
      this.checkDesignNotification = true;
    }
  }

  /**
   * @description Method to check if payee is directly logging into the application with token directly from email link from payment notification email.
   */
  checkIsPayeeOnBoarding(): void {
    const initiatedFrom =
      this.activatedRoute.snapshot.queryParams?.initiated_from;
    if (
      initiatedFrom === 'directDepositReceiving' ||
      initiatedFrom === 'microDepositProcessed'
    ) {
      const params = this.activatedRoute.snapshot.queryParams;

      this.localStorageService.setItem('payeeObInitId', params.initiator_id);
      this.localStorageService.setItem('payeeObExtToken', params.externalToken);
      this.localStorageService.setItem(
        'payeeObInitFrom',
        params.initiated_from
      );

      this.payeeOnboardingService.payeeOnboardingSignal.set({
        initiatedFrom: params.initiated_from,
        initiatorId: params.initiator_id,
        externalToken: params.externalToken
      });

      if (initiatedFrom === 'directDepositReceiving') {
        this.router.navigateByUrl('/manage/wallet/transactions');
      } else if (initiatedFrom === 'microDepositProcessed') {
        this.router.navigateByUrl(
          '/manage/payee-onboarding/micro-deposit-verification'
        );
      }
    }
  }

  /**
   * @description Method invoked when `payeeDetailsOpen` event is emitted from payments main component.
   * @param isPayeeDetailsOpen - { `open` - Boolean indicating open status.
   * `tabSwitch` - Boolean indicating whether event is emitted due to tab switch or not.
   *  If due to tab switch, makes sure payee details open status is not set to false,
   * to enable tab switching between notifications and payment details.
   * If this is false payee details open status ti set to false, and the section will be hidden }.
   */
  handlePayeeDetailsAndMyRequests(isPayeeDetailsOpen: {
    open: boolean;
    tabSwitch: boolean;
  }) {
    this.showMyRequests = !isPayeeDetailsOpen.open;
    if (isPayeeDetailsOpen.tabSwitch === false) {
      this.isPayeeDetailsOpen = isPayeeDetailsOpen.open;
    }
  }

  /**
   * @description Method to navigate to the corresponding url based on id given.
   * @param id - Id to decide where to navigate to.
   */
  navigateToUrl(id: string) {
    switch (id) {
      case 'cloud':
        this.router.navigate(['/manage/cloud-bank/index']);
        break;
      case 'credit_card':
        this.router.navigate(['/manage/cards']);
        break;
      case 'wallet':
        this.router.navigate(['/manage/wallet']);
        break;
      case 'add_account':
        this.router.navigate([`/manage/users/add-bank-account`], {
          queryParams: { returnUrl: '/manage/bank-accounts/index' }
        });
        break;
      case 'account':
        this.router.navigate(['/manage/bank-accounts']);
        break;
      default:
        break;
    }
  }

  /**
   * @description Retrieve the homepage notification
   * Subscribes to the getHomePageNotifications method of the userService.
   */
  private async getNotification() {
    this.notificationsLoading = true;
    const apiRes = await firstValueFrom(
      this.userService.getHomePageNotifications().pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
    );

    this.notificationsLoading = false;
    if (typeof apiRes === 'boolean') return;
    if (apiRes?.success) {
      this.notifications = apiRes.data.filter(
        (item) =>
          item?.notification?.application_type !== 'Line of credit' &&
          !item?.readAt
      );
    }
    this.setNotificationsStatus();
  }

  /**
   * @description  Clear Notification as changing to mark as read
   * @param notification
   */
  async clearNotification(notification: INotificationDetails) {
    const index = this.notifications.indexOf(notification);
    this.notifications.splice(index, 1);
    const apiRes = await firstValueFrom(
      this.userService.markAsRead(notification?.id).pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
    );
    if (typeof apiRes === 'boolean') return;
    this.headerService.setNotificationValueChanged(true);
    this.setNotificationsStatus();
  }

  /**
   * @description Clear All Notification in Home Sidebar
   */
  async clearAll() {
    this.notificationsLoading = true;
    const apiRes = await firstValueFrom(
      this.userService.markAllHomeNofificationsAsRead().pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
    );
    this.notificationsLoading = false;
    if (this.checkDesignNotification) {
      this.togglePremiumCheckNotification();
    }
    if (typeof apiRes === 'boolean') return;
    if (apiRes?.success) {
      this.getNotification();
      this.headerService.setNotificationValueChanged(true);
    }
  }

  /**
   * @description Redirects to the specified page based on the provided notification item.
   * @param item -the notification item  containing the  link and id properties.
   */
  async redirectToPage(notificationDetails: INotificationDetails) {
    const item = notificationDetails;
    const apiRes = await firstValueFrom(
      this.userService.markAsRead(item.id).pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
    );

    if (typeof apiRes === 'boolean') return;
    if (apiRes.success) {
      item.readAt = true;
    }
    const redirectNotificationPage =
      item.notification.action_link.split('.com/')[1];
    const link = '/?id=/';
    const redirect = redirectNotificationPage.replace(link, '/');
    this.router.navigateByUrl(redirect);
  }

  /**
   * @description Retrieves the font color for a notification based on its color property.
   * This function takes a color parameter and returns the corresponding CSS variable for the font color.
   * @param color -The color of the notification.
   * @returns  -The CSS variable for the font color, or undefined if the color is not recognized.
   */
  private getNotificationFontColor(color: INotificationContent['color']) {
    switch (color) {
      case 'blue':
        return 'var(--common-blue-color)';
      case 'green':
        return 'var(--common-green-color)';
      case 'orange':
        return 'var(--common-yellow-color)';
      case 'red':
        return 'var(--common-red-color)';
      default:
        return 'var(--common-blue-color)';
    }
  }

  /**
   * @description Retrieves the background color for a notification based on its color property.
   * This function takes a color parameter and returns the corresponding CSS variable for the background color.
   * @param color -The color of the notification.
   * @returns  -The CSS variable for the background color, or undefined if the color is not recognized.
   */
  private getNotificationBgColor(color: INotificationContent['color']) {
    switch (color) {
      case 'blue':
        return 'var(--common-secondary-blue-color)';
      case 'green':
        return 'var(--common-secondary-green-color)';
      case 'orange':
        return 'var(--common-secondary-yellow-color)';
      case 'red':
        return 'var(--common-secondary-red-color)';
      default:
        return 'var(--common-secondary-blue-color)';
    }
  }

  /**
   * @description Method to set notification color.
   * @param color - Required notification color.
   * @returns
   */
  getNotificationStyle(color: INotificationContent['color']) {
    return {
      color: this.getNotificationFontColor(color),
      'background-color': this.getNotificationBgColor(color)
    };
  }

  /**
   * @description Opens new bill modal and navigate to bills section afterwards.
   */
  async openNewBillModal() {
    const dataFromDialog = await firstValueFrom(
      this.matDialog
        .open(AddBillModalComponent, {
          maxWidth: '725px',
          maxHeight: '95%',
          width: '93%',
          disableClose: true,
          data: { mode: 'new' }
        })
        .afterClosed()
    );
    if (dataFromDialog) {
      this.router.navigateByUrl('manage/bill/index');
    }
  }

  /**
   * @description Opens the add payee modal.
   */
  async openNewPayeeModal() {
    this.subscriptions.push(
      this.payeeModalService.openAddPayee().subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(
            payeeModal.afterClosed().subscribe((modalRes) => {
              if (modalRes?.success) {
                this.router.navigateByUrl('/manage/payees');
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description Opens new invoice modal and navigate to invoice section afterwards.
   */
  async openNewInvoiceModal() {
    const dataFromDialog = await firstValueFrom(
      this.matDialog
        .open(AddInvoiceComponent, {
          disableClose: true,
          maxWidth: '1010px',
          width: '99%',
          maxHeight: '83%',
          autoFocus: false,
          data: {
            isV3: true
          }
        })
        .afterClosed()
    );

    if (dataFromDialog) {
      this.router.navigateByUrl('manage/invoice');
    }
  }

  /**
   * @description Determines whether to show the Plexe notification.
   * Show the plexe notification for new user based on the `isShowPlexeNotification`.
   * Show the plexe offer ready notification based on the `isPlexeNotification`
   */
  private checkPlexeNotificationShow() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (headerData) => {
          if (typeof headerData === 'boolean') return;
          this.isLoginAsClient.set(headerData.isLoggedInAsClient);
          this.isSubscribed.set(headerData.isSubscribed === 1);
          if (headerData.applyForPlexe === 1) {
            this.isShowPlexeNotification = true;
          } else {
            this.isShowPlexeNotification = false;
          }

          if (
            headerData?.plexeOfferReadyUser === 1 &&
            headerData?.plexeCreditLimit > 0
          ) {
            this.isPlexeNotification = true;
            this.plexeCreditLimit = headerData?.plexeCreditLimit;
            this.isShowPlexeNotification = false;
          } else {
            this.isPlexeNotification = false;
          }
          this.getActiveCompanyLogo(headerData?.allCompanies);
        }
      });
  }

  getActiveCompanyLogo(allCompanies: IAllCompanies): void {
    /**
     * Searches for the active company within a list of all companies and sets the active company's logo URL.
     * @param item - The company object from the list of all companies.
     * @returns Whether the company's ID matches the active company ID.
     */
    const activeCompanyId =
      this.localStorageService.getItem('activeCompanyId') || '';
    const findCompany = allCompanies?.invitedCompanies?.find(
      (item: IInvitedCompany) => activeCompanyId === item?.companyId
    );
    // Sets the active company's logo URL or an empty string if not found.
    this.activeCompanyLogo.set(findCompany?.companyLogoUrl || '');
  }

  /**
   * @description Opens modal for upload user documents requested by super admin
   * @param item notification details
   */
  async openDocumentUpload(item: INotificationDetails) {
    const dataFromDialog = await firstValueFrom(
      this.matDialog
        .open(UserDocsUploadModalComponent, {
          maxWidth: '460px',
          data: item
        })
        .afterClosed()
    );

    if (dataFromDialog.success) {
      this.getNotification();
    }
  }

  /**
   * @description Method to check for dark mode.
   */
  private checkDarkMode() {
    this.isDarkMode =
      this.themeService.isDarkMode ?? this.themeService.getInitialColourTheme();
    this.themeService
      .getThemeSwitch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res === true) {
          this.isDarkMode = true;
        } else {
          this.isDarkMode = false;
        }
      });
  }

  /**
   * @description Method invoked when tabs are toggled in notification bar. The same tabs are also created in `payments-main component`,
   * since notification section is part of `home component` and payment details section is part of `payments-main component`.
   * Please make sure the logic and styles are in sync in both places.
   * @param tab - `new` - Notification section from home component. `details` - Payment details from payments-main component.
   */
  toggleNotificationTab(tab: 'new' | 'details') {
    if (tab === 'new') {
      this.showMyRequests = true;
    } else if (tab === 'details') {
      this.showMyRequests = false;
    }
  }

  /**
   * @description Retrieves the verification status of various steps in the getting started process.
   *
   * The this._gettingStartedService.getGettingStarted  method is used to fetch the current verification status from the service.
   *
   * `verificationStatus ` Update the value based on the retrieved data.
   *
   */
  private getVerificationStatus(): void {
    this.notificationsLoading = true;
    this.gettingStartedService
      .getGettingStarted()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        
        if (res) {
          if (res.verification) {
            this.verificationStatus['1'] = true;
          } else {
            this.verificationStatus['1'] = false;
          }

          if (
            res.kycStatus !== null &&
            res.kycStatus !== 3 &&
            res.kybStatus !== null
          ) {
            this.verificationStatus['2'] = true;
          } else {
            this.verificationStatus['2'] = false;
          }

          if (res.kycStatus === 3) {
            this.kycRejected = true;
          }

          if (res.kybStatus === 3) {
            this.kybRejected = true;
          }

          this.getStatusClass();
        }
      });
  }

  /**
   * @description Changes the styles of the getting started steps based on the verificationStatus.
   *
   * Updates the `statusClass` object to apply the appropriate CSS class to each step.
   *
   * Calculates the number of true values in the `verificationStatus` object and stores it in `this.trueCount`.
   *
   * Based on the value of `this.trueCount`, the CSS classes in `statusClass` are modified accordingly.
   */
  private getStatusClass() {
    this.trueCount = Object?.values(this.verificationStatus)?.filter(
      (value) => value === true
    ).length;
    if (this.trueCount === 0) {
      this.statusClass[1] = 'bars';
      this.statusClass[2] = 'not_verified';
    } else if (this.trueCount === 1) {
      this.statusClass[1] = 'verified';
      this.statusClass[2] = 'bars';
    } else if (this.trueCount === 2) {
      this.statusClass[1] = 'verified';
      this.statusClass[2] = 'verified';
    }
    if (this.kycRejected || this.kybRejected) {
      this.statusClass[2] = 'rejected';
    }
    this.setNotificationsStatus();
    this.notificationsLoading = false;
  }

  /**
   * @description Navigate to getting-started page if user not complete each step of verification.
   */
  gotoVerification(): void {
    this.router.navigateByUrl('/manage/verification/index');
  }

  /**
   * @description Method to check weather notification bar items are present or not.
   */
  private setNotificationsStatus() {
    if (
      this.isShowPlexeNotification === true ||
      this.isPlexeNotification === true ||
      this.notifications.length > 0 ||
      this.trueCount !== 2
    ) {
      this.newNotifications = true;
    } else {
      this.newNotifications = false;
    }

    if (this.isPayeeDetailsOpen === true && this.newNotifications === false) {
      this.toggleNotificationTab('details');
    }
  }

  /**
   * @description Method for ngFor trackBy.
   * @param index - Index.
   * @returns Index.
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * @description Handles the action of grabbing rewards.
   * @param id rewards id.
   */
  onGrabRewards(id: string) {
    this.isLoading = true;
    this.headerService
      .grabRewards(id)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          takeUntil(this.destroy$);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.localStorageService.removeItem('reward');
          this.headerService.onRefreshDynamicHeader = true;
          this.headerService.setHeaderValueChanged(true);
          this.showRewardCard = false;
          this.openRewardModal();
        }
      });
  }

  /**
   * @description Opens the Feature Coupon Modal.
   */
  openRewardModal() {
    this.matDialog.open(FeatureApplyCouponModalComponent, {
      disableClose: true,
      width: '420px',
      data: { ...this.rewards, type: 'home' }
    });
  }

  /**
   * @description This method will be executed when we click on teh premium check design button.
   */
  tryPremiumCheckDesign() {
    this.router.navigate(['/manage/bank-accounts/index'], {
      queryParams: { firstAccSelected: true }
    });
  }

  togglePremiumCheckNotification() {
    this.checkDesignNotification = false;
    this.localStorageService.setItem('showPremiumCheckNotification', false);
  }

  suggestFeedback() {
    this.matDialog.open(SuggestFeedbackComponent, {
      maxWidth: '100%',
      disableClose: true
    });
  }

  buttonClickEvent(): void {
    this.router.navigateByUrl('manage/verification/index');
  }

  gettingStartedLoadingData(): void {
    this.loaded = false;
    this.gettingStartedLoader = false;
    this.gettingStartedService.getGettingStartedDataApi()
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {

    this.localStorageService.setItem('gettingStartedData', res.data);
    this.userVerfied = res.data?.verification === 1;
    this.kycDone = res.data?.kycStatus !== null;
    this.kybDone = res.data?.kybStatus !== 0 && res.data?.kybStatus !== null;
    this.isAllVerificationDone = this.userVerfied && this.kycDone && this.kybDone;
    this.loaded = true;
    });
  }

  isKycDoneFromCard(event: {success: boolean}): void {
    this.kycDone = event.success;
  }

  imgUpload(event: Event & { target: HTMLInputElement }) {
    if (event.target.files && event.target.files.length) {
      const file = ((event.target as HTMLInputElement).files as FileList)[0];
      if (Utils.maxSizeValidator(file.size)) {
        this.alertService.warningAlert({ content: 'Maximum size is 5MB.' });
        return;
      }
      if (!Utils.fileTypeValidator(event.target.files[0], ['svg'])) {
        this.alertService.warningAlert({
          content: 'SVG files are not supported!!'
        });
        return;
      }
    }

    const dialogRef = this.matDialog.open(UploadImageModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: { event }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.image) {
        this.uploadBusinessLogo(result.image);
      }
    });
  }

  uploadBusinessLogo(imageUrl: { url: string; blob: Blob | undefined }) {
    const blob = new Blob([imageUrl?.blob || ''], { type: 'image/jpg' });
    const imageFile = new File([blob], 'profile_pic_img.jpg', {
      type: 'image/jpg'
    });
    const formData = new FormData();
    formData.append('businessLogo', imageFile, 'image.jpg');

    this.logoUploading.set(true);
    this.subscriptions.push(
      this.userProfileService.addBusinessLogo(formData)
        .pipe(finalize(() => this.logoUploading.set(false)))
        .subscribe(() => {
          this.activeCompanyLogo.set(imageUrl.url);
          this.headerService.setHeaderValueChanged(true);
        })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
