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
import { NgClass } from '@angular/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { Subject, finalize, map, take, takeUntil } from 'rxjs';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { IUserVerification } from 'src/app/models/user';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { Router } from '@angular/router';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { environment } from 'src/environments/environment';
import { RaincardSelectBusinessV4Component } from 'src/app/modules/payments/shared/modal/v4/raincard-select-business-v4/raincard-select-business-v4.component';
import { MatDialog } from '@angular/material/dialog';
import { V4RainTermsConditionComponent } from 'src/app/shared/modal/v4-rain-terms-condition/v4-rain-terms-condition.component';
import { LucideAngularModule, Zap, Globe, Shield, ShieldCheck, Layers, Check, TriangleAlert, RefreshCw, Settings } from 'lucide-angular';
import { VirtualCardService } from '../../../virtual-card/services/virtual-card.service';
import { V4ESignModalComponent } from 'src/app/shared/modal/v4-e-sign-modal/v4-e-sign-modal.component';


@Component({
  selector: 'app-welcome-page-v4',
  standalone: true,
  imports: [NgClass, FormsModule, CommonButtonV4Component, LucideAngularModule],
  templateUrl: './welcome-page-v4.component.html',
  styleUrl: './welcome-page-v4.component.scss'
})
export class WelcomePageV4Component implements OnInit, OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private themeService = inject(ThemeService);
  private userProfileService = inject(UserProfileService);
  private verificationService = inject(CommonVerificationService);
  private personaHelperService = inject(PersonaHelperService);
  private alertService = inject(V4AlertService);
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

  readonly zapIcon = Zap;
  readonly globeIcon = Globe;
  readonly shieldIcon = Shield;
  readonly shieldCheckIcon = ShieldCheck;
  readonly layersIcon = Layers;
  readonly checkIcon = Check;
  readonly triangleAlertIcon = TriangleAlert;
  readonly refreshCwIcon = RefreshCw;
  readonly settingsIcon = Settings;

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
          const ref = this.dialog.open(RaincardSelectBusinessV4Component, {
            width: '600px',
            panelClass: 'paddingless-modal-rounded',
            disableClose: true,
            data: {
              sourceType: CVSourceType.rain_card,
              applicationStatus: { kycStatus, kybStatus },
              walletNeeded: true
            }
          });

          ref
            .afterClosed()
            .pipe(map((val: { success: boolean } | undefined) => val ?? { success: false }))
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
          this.router.navigate(['/v4/manage/user-profile/verify-business'], {
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

        this.router.navigate(['/v4/manage/user-profile/verify-business'], {
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

    ref.afterClosed().subscribe((response: boolean | undefined) => {
      if (response) {
        this.router.navigate(['/v4/manage/verification/index'], {
          queryParams: {
            openVerificationModal: true,
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
        .open(V4RainTermsConditionComponent, {
          width: '600px',
          panelClass: 'paddingless-modal-rounded',
          disableClose: true
        })
        .beforeClosed()
        .subscribe((res) => {
          this.virtualCardService.termsAccepted.set(!!res);
        });
    }
  }

  openEsignModal(): void {
    this.dialog
      .open(V4ESignModalComponent, {
        width: '800px',
        maxWidth: '95vw',
        panelClass: 'paddingless-modal-rounded',
        disableClose: false
      })
      .afterClosed()
      .subscribe((agreed) => {
        if (agreed) {
          this.virtualCardService.esignAccepted.set(true);
        }
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
