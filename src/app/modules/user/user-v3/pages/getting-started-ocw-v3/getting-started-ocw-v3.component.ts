import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { Subscription } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, TitleCasePipe } from '@angular/common';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { WhiteLabelPipe } from '../../../../../pipes/white-label.pipe';
// import { LocationStrategy } from '@angular/common';

@Component({
  selector: 'app-getting-started-ocw-v3',
  templateUrl: './getting-started-ocw-v3.component.html',
  styleUrls: ['./getting-started-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    DemoVideoComponent,
    NgClass,
    FaIconComponent,
    TitleCasePipe,
    WhiteLabelPipe,
    WhiteLabelDirective
  ]
})
export class GettingStartedOcwV3Component implements OnInit, OnDestroy {
  /* Injecting dependencies using inject method */
  public gettingStartedService = inject(GettingStartedService);
  public userProfileService = inject(UserProfileService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private headerService = inject(HeaderService);
  public dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private alertService = inject(AlertService);
  private personaHelperService = inject(PersonaHelperService);

  /* Variables */

  username = this.localStorageService.getItem('username') || '';
  getStarted = 1;
  subscriptions: Subscription[] = [];
  isLoading = false;
  onlyEmailVerified = false;
  emailAndPhoneVerified = false;
  emailAndPhoneNotVerified = false;
  kycCompleted = false;
  kybCompleted = false;
  kycRejected = false;
  kybRejected = false;
  features = [
    'Check Printing',
    'Check Mail',
    'Email Check',
    'Instant Bank Verification',
  ];

  kycFeatures = [
    'Cloud Banking',
    'Instant Payment',
    'Multiple Business Bank Accounts'
  ];

  kybFeatures = [
    'Virtual & Physical Cards',
    'ACH Payment',
    'Payroll By Credit Card'
  ];

  constructor() {
    // Disabling Back Button
    history.pushState('', '', window.location.href);
  }

  ngOnInit() {
    this.getGettingStartedData();
    this.getUsername();
  }

  getUsername() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          this.username = res.personalInfo.name;
        }
      })
    );
  }

  getGettingStartedData() {
    this.isLoading = true;
    this.userProfileService.setUserVerification();
    this.subscriptions.push(
      this.userProfileService.getUserVerification().subscribe((res) => {
        this.emailAndPhoneNotVerified = !!(
          res.email_verified !== 1 && res.phone_verified !== 1
        );
        this.onlyEmailVerified = !!(
          res.email_verified === 1 && res.phone_verified !== 1
        );
        this.emailAndPhoneVerified = !!(
          res.phone_verified === 1 && res.email_verified === 1
        );
        this.subscriptions.push(
          this.gettingStartedService
            .getGettingStarted()
            .subscribe((response) => {
              if (response) {
                this.isLoading = false;
                /**
                 * kycStatus and kybStatus
                 * No Application => null
                 * Pending => 0,
                 * In Review => 1,
                 * Approved => 2,
                 * Rejected => 3,
                 * Partner Approved => 4,
                 */
                this.kycCompleted = response.kycStatus !== null;
                this.kybCompleted = response.kybStatus !== null;
                this.kycRejected = response.kycStatus === 3;
                this.kybRejected = response.kybStatus === 3;
                this.getStarted = 1;
                if (
                  this.kycCompleted &&
                  !this.kycRejected &&
                  this.kybCompleted &&
                  !this.kybRejected
                ) {
                  this.getStarted = 2;
                } else if (this.kycRejected || this.kybRejected) {
                  this.getStarted = 3;
                }
              }
            })
        );
      })
    );
  }

  /**  Redirecting to email and phone verification page */
  verifyEmalAndPhone(): void {
    this.router.navigateByUrl('/manage/users/verify-email-phone');
  }

  onCardClick(level: string) {
    if (level === 'Level1' && !this.emailAndPhoneVerified) {
      this.verifyEmalAndPhone();
      return;
    }

    if (level === 'Level2') {
      if (!this.emailAndPhoneVerified) {
        this.verifyEmalAndPhone();
        return;
      }

      if (this.kycRejected) {
        this.openInfoAlert();
        return;
      }

      // this.handleLevel2Async();

      if (!this.kycCompleted) {
        if (environment.isV4Persona) {
          this.personaHelperService
            .openModal('kyc', CVSourceType.getting_started_v3)
            .subscribe((res) => {
              
              if (res?.data?.inquiry_type === 'kyb') {
                this.router.navigateByUrl('/manage/home');
              }
            });
        } else {
          this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
        }
        return;
      }

      if (!this.kybCompleted || this.kybRejected) {
        if (environment.isV4Persona) {
          this.personaHelperService
            .openModal('kyb', CVSourceType.add_new_business)
            .subscribe((res) => {
              if (res?.data?.inquiry_id) {
                this.router.navigateByUrl('/manage/home');
              }
            });
        } else {
          this.router.navigateByUrl('/manage/users/verify-user-id?type=7');
        }
      }
    }
  }

  openInfoAlert() {
    const data = {
      content:
        'Your KYC application has been rejected. Please contact support for more information.',
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now',
      isOk: true,
      isCancel: true
    };
    const action = this.alertService.infoAlert(data);
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
