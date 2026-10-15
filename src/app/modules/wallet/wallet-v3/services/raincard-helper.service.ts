import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { IUserVerification } from 'src/app/models/user';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { environment } from 'src/environments/environment';
import { WalletDataV35Service } from './wallet-data-v35.service';
import { RainCardSelectBusinessComponent } from '../modals-v35/existing-business/raincard-select-businesss.component';
import { CreateCardInfoComponent } from '../modals-v35/create-card-info-v35/create-card-info/create-card-info.component';

@Injectable({
  providedIn: 'root'
})
export class RaincardHelperService {
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  public userService = inject(UserProfileService);
  private verificationService = inject(CommonVerificationService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private walletDataService = inject(WalletDataV35Service);

  rainCardLoading: boolean = false;
  kycKybStatus: { kycStatus: number; kybStatus: number };
  onBoardingLoading: boolean = false;

  /**
   * @description Handles the case when virtual card creation is disabled
   * @private
   */
  handleVirtualCardDisabled(): void {
    const action = this.dialog.open(CreateCardInfoComponent, {
      maxWidth: '420px',
      minWidth: '343px',
      width: '95%',
      data: {
        subTitle: 'Start creating your Visa Credit Card now!',
        features: [
          {
            icon: 'faTriangleExclamation',
            text: 'Set spending limits and usage restrictions'
          },
          {
            icon: 'faArrowUpRightDots',
            text: 'Increase spending limits as needed'
          },
          {
            icon: 'faShieldCheck',
            text: 'Cancel cards anytime for secure transactions'
          }
        ],
        message:
          'Please contact customer support to enable Visa Credit Card creation from your wallet.'
      }
    });

    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  /**
   * @description Initiates the card creation flow with verification checks
   * @private
   */
  initiateCardCreationFlow(): void {
    this.onBoardingLoading = true;
    this.userService.setUserVerification();
    this.userService
      .getUserVerification()
      .pipe(take(1))
      .subscribe((res) => {
        if (res.email_verified === 0 || res.phone_verified === 0) {
          this.handleUnverifiedUser(res);
        } else {
          this.proceedWithKycKybCheck();
        }
      });
  }

  /**
   * @description Handles unverified user case
   * @private
   * @param res User verification details
   */
  private handleUnverifiedUser(res: IUserVerification): void {
    const verificationMessage = this.getVerificationMessage(res);
    const ref = this.alertService.warningAlert({
      content: `Please verify your ${verificationMessage}`,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((response) => {
      this.onBoardingLoading = false;
      if (response) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: '/manage/wallet/transactions',
            type: CVSourceType.rain_card
          }
        });
      }
    });
  }

  /**
   * @description Gets the verification message based on verification status
   * @private
   * @param res User verification details
   */
  private getVerificationMessage(res: IUserVerification): string {
    if (!res.email_verified && !res.phone_verified) {
      return 'Phone and Email';
    }
    if (!res.phone_verified) {
      return 'Phone';
    }
    return 'Email';
  }

  /**
   * @description Proceeds with KYC/KYB status check
   * @private
   */
  private proceedWithKycKybCheck(): void {
    this.rainCardLoading = true;
    this.verificationService
      .applicationStatus()
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.success) {
          this.kycKybStatus = res.data;
          this.fetchBusinessDetails();
        }
      });
  }

  /**
   * @description Fetches business details and handles the flow
   * @private
   */
  private fetchBusinessDetails(): void {
    this.rainCardLoading = true;
    this.verificationService
      .getUserBusinesses()
      .pipe(
        take(1),
        finalize(() => {
          this.rainCardLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          const businessDetails = res.data;
          if (businessDetails?.length) {
            this.openExistingBusinessModal();
          } else {
            this.handleNoBusinessCase();
          }
        }
      });
  }

  /**
   * @description Opens the existing business modal
   * @private
   */
  private openExistingBusinessModal(): void {
    const dialogRef = this.dialog.open(RainCardSelectBusinessComponent, {
      maxWidth: '515px',
      width: '100%',
      maxHeight: '85%',
      disableClose: true,
      autoFocus: false,
      data: {
        sourceType: CVSourceType.rain_card,
        applicationStatus: this.kycKybStatus
      }
    });

    dialogRef.afterClosed().subscribe((val) => {
      this.onBoardingLoading = false;
      if (val?.success) {
        this.walletDataService.cardOnBoardingStatus('submit');
        this.router.navigate(['/manage/wallet/transactions']);
      }
    });
  }

  /**
   * @description Handles the case when no business exists
   * @private
   */
  private handleNoBusinessCase(): void {
    this.onBoardingLoading = false;
    if (this.kycKybStatus?.kycStatus !== null) {
      if (environment.isV4Persona) {
        this.personaHelperService
          .openModal('kyb', CVSourceType.rain_card)
          .pipe(take(1))
          .subscribe((resp) => {
            if (resp?.data?.inquiry_id) {
              this.fetchBusinessDetails();
            }
          });
      } else {
        this.router.navigate(['/manage/users/verify-user-id'], {
          queryParams: { type: CVSourceType.rain_card, from: 'rainCard' }
        });
      }
    } else if (environment.isV4Persona) {
      this.personaHelperService.openModal('kyc', CVSourceType.rain_card);
    } else {
      this.router.navigate(['/manage/users/verify-user-id'], {
        queryParams: { type: CVSourceType.rain_card, from: 'rainCard' }
      });
    }
  }

  handlePhysicalCardDisabled(): void {
    const action = this.dialog.open(CreateCardInfoComponent, {
      maxWidth: '420px',
      minWidth: '343px',
      width: '95%',
      data: {
        subTitle: 'Start creating your Physical Card now!',
        features: [
          {
            icon: 'faTriangleExclamation',
            text: 'Set spending limits and usage restrictions'
          },
          {
            icon: 'faArrowUpRightDots',
            text: 'Increase spending limits as needed'
          },
          {
            icon: 'faShieldCheck',
            text: 'Cancel cards anytime for secure transactions'
          }
        ],
        message:
          'Please contact customer support to enable Physical Card creation from your wallet.'
      }
    });

    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
    
  }
}
