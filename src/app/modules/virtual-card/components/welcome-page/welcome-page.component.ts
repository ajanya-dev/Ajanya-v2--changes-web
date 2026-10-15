import {
  Component,
  signal,
  inject,
  OnDestroy,
  OnInit,
  output,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { Subject, finalize, map, take, takeUntil } from 'rxjs';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { IUserVerification } from 'src/app/models/user';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Router } from '@angular/router';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { environment } from 'src/environments/environment';
import { RainCardSelectBusinessComponent } from 'src/app/modules/wallet/wallet-v3/modals-v35/existing-business/raincard-select-businesss.component';
import { MatDialog } from '@angular/material/dialog';
import { RainTermsConditionComponent } from 'src/app/modules/wallet/wallet-v3/modals-v35/rain-terms-condition/rain-terms-condition.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCog, faShieldCheck, faRotate, faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { ESignModalComponent } from 'src/app/modules/wallet/wallet-v3/modals-v35/e-sign-modal/e-sign-modal.component';
import { VirtualCardService } from '../../services/virtual-card.service';


@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, FormsModule, CommonButtonV35Component, DemoVideoComponent, FaIconComponent],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss'
})
export class WelcomePageComponent implements OnInit, OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private themeService = inject(ThemeService);
  private userProfileService = inject(UserProfileService);
  private verificationService = inject(CommonVerificationService);
  private personaHelperService = inject(PersonaHelperService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  public virtualCardService = inject(VirtualCardService);

  changeStatus = output<string>();

  loading = signal(false);
  isDarkMode = signal<boolean>(false);

  env = environment;

  isPolicyApproved = computed(
    () =>
      this.virtualCardService.esignAccepted() &&
      this.virtualCardService.termsAccepted() &&
      this.virtualCardService.termsAccepted5() &&
      this.virtualCardService.termsAccepted6()
  );

  destroy$ = new Subject();

  faCog = faCog;
  faShieldCheck = faShieldCheck;
  faRotate = faRotate;
  faExclamationTriangle = faExclamationTriangle;

  ngOnInit(): void {
    this.getThemeStatus();
  }

  getThemeStatus() {
    const currentTheme = this.localStorageService.getItem('user-theme');
    this.isDarkMode.set(currentTheme !== 'light-mode');
    this.themeService
      .getThemeSwitch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isDarkMode.set(!!res);
      });
  }

  apply(): void {
    if (!this.isPolicyApproved()) {
      this.alertService.infoAlert({
        content: 'Please agree to the terms and conditions.'
      });
      return;
    }

    this.loading.set(true);
    this.userProfileService.setUserVerification();
    this.userProfileService
      .getUserVerification()
      .pipe(take(1))
      .subscribe((res) => {
        this.loading.set(false);
        if (res.email_verified === 0 || res.phone_verified === 0) {
          this.verifyPhoneEmail(res);
        } else {
          this.getUserKycKybStatus();
        }
      });
  }

  /**
   * @description gets current users kyc and kyb status.
   */
  getUserKycKybStatus() {
    this.loading.set(true);
    this.verificationService
      .applicationStatus()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        take(1)
      )
      .subscribe(({ success, data: kycKybStatus }) => {
        if (success) {
          this.getBusinesses(kycKybStatus);
        }
      });
  }

  /**
   * @description gets business details of the current user.
   * opens modals or routes to pages based on api response.
   */
  getBusinesses({
    kybStatus,
    kycStatus
  }: {
    kybStatus: number;
    kycStatus: number;
  }): void {
    this.loading.set(true);
    this.verificationService
      .getUserBusinesses()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        take(1)
      )
      .subscribe(({ success, data }) => {
        if (!success) return;

        if (data.length) {
          const ref = this.dialog.open(RainCardSelectBusinessComponent, {
            maxWidth: '515px',
            width: '100%',
            maxHeight: '85%',
            disableClose: true,
            autoFocus: false,
            data: {
              sourceType: CVSourceType.rain_card,
              applicationStatus: { kycStatus, kybStatus },
              walletNeeded: true
            }
          });

          ref
            .afterClosed()
            .pipe(map((val) => (!val ? { success: false } : val)))
            .subscribe(({ success }) => {
              if (success) this.changeStatus.emit('Pending');
            });

          return;
        }

        if (kycStatus !== null && environment.isV4Persona) {
          const ref = this.personaHelperService.openModal(
            'kyb',
            CVSourceType.rain_card
          );

          ref
            .pipe(map((val) => (!val ? { data: undefined } : val)))
            .subscribe(({ data }) => {
              if (data?.inquiry_id) {
                this.getBusinesses({ kybStatus, kycStatus });
              }
            });
          return;
        }

        if (kycStatus !== null && !environment.isV4Persona) {
          this.router.navigate(['/manage/users/verify-user-id'], {
            queryParams: { type: CVSourceType.rain_card, from: 'cloud' }
          });
          return;
        }

        if (environment.isV4Persona) {
          const ref = this.personaHelperService.openModal(
            'kyc',
            CVSourceType.rain_card
          );
          ref
            .pipe(map((val) => (!val ? { data: undefined } : val)))
            .subscribe(({ data }) => {
              if (data?.inquiry_id) {
                this.getBusinesses({ kybStatus, kycStatus });
              }
            });
          return;
        }

        this.router.navigate(['/manage/users/verify-user-id'], {
          queryParams: { type: CVSourceType.rain_card, from: 'cloud' }
        });
      });
  }

  verifyPhoneEmail(res: IUserVerification) {
    const msg = () => {
      let message = '';

      if (!res.phone_verified && !res.email_verified) return 'Phone and Email';
      if (!res.phone_verified) message = 'Phone';
      if (!res.email_verified) message = 'Email';

      return message;
    };

    const ref = this.alertService.warningAlert({
      content: `Please verify your ${msg()}`,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((response) => {
      if (response) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: this.router.url,
            type: CVSourceType.rain_card
          }
        });
      }
    });
  }

  openTermsDialog(checked: boolean) {
    if (checked) {
      this.dialog
        .open(RainTermsConditionComponent, {
          width: '600px',
          panelClass: 'plaid-modal',
          disableClose: true
        })
        .beforeClosed()
        .subscribe((res) => {
          this.virtualCardService.termsAccepted.set(!!res);
        });
    }
  }

  openEsignModal(): void {
    this.dialog.open(ESignModalComponent, {
      width: '70%',
      height: '80%',
      disableClose: false
    });
  }

  openPrivacyPolicy(event: MouseEvent) {
    event.stopPropagation();
    window.open('https://zilmoney.com/privacy-policy', '_blank');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
