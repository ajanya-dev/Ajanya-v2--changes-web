import {
  Component,
  OnDestroy,
  inject,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { IBusinessDetails } from 'src/app/models/bank';
import {
  CVSourceType,
  IActionLoaderData,
  ISelectBizData
} from 'src/app/modules/common-verification/model/common-verification';
import { IUserVerification } from 'src/app/models/user';
import { SelectBusinessComponent } from 'src/app/modules/bank/bank-v2/modals/select-business/select-business.component';
import { LoaderModalComponent } from 'src/app/shared/modal/loader-modal/loader-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { environment } from 'src/environments/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { WhiteLabelPipe } from '../../../../../pipes/white-label.pipe';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FormsModule } from '@angular/forms';
import { NgClass, NgOptimizedImage, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-cloud-welcome-page-v3',
  templateUrl: './cloud-welcome-page-v3.component.html',
  styleUrls: ['./cloud-welcome-page-v3.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    CommonButtonV35Component,
    UpperCasePipe,
    WhiteLabelPipe,
    NgOptimizedImage
  ]
})
export class CloudWelcomePageV3Component implements OnDestroy, OnInit {
  /**
   * @description Injecting dependencies using inject method
   */
  private router = inject(Router);
  public userService = inject(UserProfileService);
  private dialog = inject(MatDialog);
  private verificationService = inject(CommonVerificationService);
  private alertService = inject(AlertService);
  private themeService = inject(ThemeService);
  private localStorageService = inject(LocalStorageService);
  private appSettingService = inject(AppSettingsService);
  private personaHelperService = inject(PersonaHelperService);

  @Output() cloudApplication: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  /**
   * @description Variables
   */
  environment = environment;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  cloudBankLabel = this.staticWhiteLabelConditions.cloudBank.label;
  subscriptions: Subscription[] = [];
  onlyZilBank = false;
  kycKybStatus: { kycStatus: number; kybStatus: number };
  loading = false;
  IsDarkMode: boolean;
  isPolicyApproved = false;
  appConfig?: IAppConfig;
  buttonText: string;

  ngOnInit(): void {
    this.getThemeStatus();
    this.loadAppSettings();
  }

  /**
   * @description Load the app settings.
   * This method used for white label case. Change the side bar icons based on the white label.
   */
  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }

  getThemeStatus() {
    const currentTheme = this.localStorageService.getItem('user-theme');
    this.IsDarkMode = currentTheme !== 'light-mode';
    this.subscriptions.push(
      this.themeService.getThemeSwitch().subscribe((res) => {
        this.IsDarkMode = !!res;
      })
    );
  }

  /**
   * @description checks if current user's email and phone number are verified.
   */
  isEmailAndPhoneVerfied() {
    if (!this.isPolicyApproved) {
      this.alertService.infoAlert({
        content: 'Please agree to the terms and conditions.'
      });
      return;
    }
    this.userService.setUserVerification();
    this.subscriptions.push(
      this.userService
        .getUserVerification()
        .pipe(take(1))
        .subscribe((res) => {
          if (res.email_verified === 0 || res.phone_verified === 0) {
            this.verifyPhoneEmail(res);
          } else {
            this.getUserKysKybStatus();
          }
        })
    );
  }

  /**
   * @description shows alert message to verify email and phone number.
   * redirects to respective pages on clicking verify now.
   * @param res - email and phone details.
   */
  verifyPhoneEmail(res: IUserVerification) {
    const msg = () => {
      if (!res.email_verified && !res.phone_verified) {
        return 'Phone and Email';
      }
      if (!res.phone_verified) {
        return 'Phone';
      }
      return 'Email';
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
            returnUrl: '/manage/verification/index',
            type: CVSourceType.cloud_bank
          }
        });
      }
    });
  }

  /**
   * @description gets current users kyc and kyb status.
   */
  getUserKysKybStatus() {
    this.loading = true;
    this.subscriptions.push(
      this.verificationService.applicationStatus().subscribe((res) => {
        if (res?.success) {
          this.kycKybStatus = res.data;
          this.getBusinesses();
        }
      })
    );
  }

  /**
   * @description gets business details of the current user.
   * opens modals or routes to pages based on api response.
   */
  getBusinesses(): void {
    this.loading = true;
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const businessDetails = res.data;
            if (businessDetails?.length) {
              this.selectBusiness({ businessDetails });
            } else if (this.kycKybStatus?.kycStatus !== null) {
              if (environment.isV4Persona) {              
                this.personaHelperService
                  .openModal('kyb', CVSourceType.cloud_bank)
                  .subscribe((resp) => {
                    if (resp?.data?.inquiry_id) {
                      this.getBusinesses();
                    }
                  });
              } else {
                this.router.navigate(['/manage/users/verify-user-id'], {
                  queryParams: { type: CVSourceType.cloud_bank, from: 'cloud' }
                });
              }
            } else if (environment.isV4Persona) {
              this.personaHelperService.openModal(
                'kyc_kyb',
                CVSourceType.cloud_bank
              );
            } else {
              this.router.navigate(['/manage/users/verify-user-id'], {
                queryParams: { type: CVSourceType.cloud_bank, from: 'cloud' }
              });
            }
          }
        })
    );
  }

  /**
   * @description opens modal to create new account for existing business of the user.
   */
  selectBusiness(data: { businessDetails: IBusinessDetails[] }): void {
    const ref = this.dialog.open<SelectBusinessComponent, ISelectBizData>(
      SelectBusinessComponent,
      {
        width: '450px',
        maxWidth: '95%',
        data: {
          bankData: data,
          applicationStatus: this.kycKybStatus,
          applyCloudBank: true,
          sourceType: CVSourceType.cloud_bank
        }
      }
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.businessId) {
        this.openLoaderModal(res.businessId);
      }
    });
  }

  /**
   * @description display loader modal while account is getting created.
   * @param businessId - business id.
   */
  openLoaderModal(businessId: string): void {
    const LoaderModal = this.dialog.open<
      LoaderModalComponent,
      IActionLoaderData
    >(LoaderModalComponent, {
      maxWidth: '400px',
      width: '80%',
      minHeight: '200px',
      height: 'unset',
      disableClose: true,
      data: { type: { cloudBank: { businessId } } }
    });
    LoaderModal.afterClosed().subscribe((res) => {
      if (res.success) {
        this.cloudApplication.emit(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
