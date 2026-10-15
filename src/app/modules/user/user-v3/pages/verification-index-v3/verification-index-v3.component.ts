import { ActivatedRoute, Router } from '@angular/router';
import { CommonVerificationService } from '../../../../../shared/service/common/common-verification.service';
import {
  TPersonalVerificationSteps,
  VerifyUserIdOcwV3Component
} from '../../components/verify-user-id-ocw-v3/verify-user-id-ocw-v3.component';
import { Location, NgIf, NgClass } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import {
  TBusinessVerificationSteps,
  BusinessVerificationV3Component
} from '../../components/business-verification-v3/business-verification-v3.component';
import { finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { LoaderModalComponent } from 'src/app/shared/modal/loader-modal/loader-modal.component';
import {
  CVSourceType,
  IActionLoaderData
} from 'src/app/modules/common-verification/model/common-verification';
import { MatDialog } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { StepperV35Component } from '../../../../../shared/v3/common-components/stepper-v35/stepper-v35.component';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-verification-index-v3',
  templateUrl: './verification-index-v3.component.html',
  styleUrls: ['./verification-index-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    CommonBackButtonV35Component,
    NgClass,
    StepperV35Component,
    VerifyUserIdOcwV3Component,
    BusinessVerificationV3Component,
    FaIconComponent
  ]
})
export class VerificationIndexV3Component implements OnInit, OnDestroy {
  prevStepSubject = new Subject<void>();
  subscriptions: Subscription[] = [];

  private userService = inject(UserProfileService);
  private _location = inject(Location);
  private _verificationService = inject(CommonVerificationService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _dialog = inject(MatDialog);

  loading = false;
  isChildLoading = false;
  status = {
    kybStatus: 0,
    kycStatus: 0
  };
  currentIndex = 0;
  currentPersonalStep: TPersonalVerificationSteps = 'details';
  currentBusinessStep: TBusinessVerificationSteps = 'details';
  kcyVerified = false;
  hasBusiness = false;

  kycSteps = [
    { name: 'Personal Details' },
    { name: 'Verify ID' },
    { name: 'Done' }
  ];

  kybSteps = [
    { name: 'Business Details' },
    { name: 'Business Documents' },
    { name: 'Done' }
  ];

  routedFromType: string;
  fromSource: string;

  ngOnInit(): void {
    this._route.queryParams.subscribe((params) => {
      this.routedFromType = params.type;
      this.fromSource = params.from;
    });
    this.getStatus();
    this.checkUserVerification();
  }

  getStatus() {
    this.loading = true;
    this.subscriptions.push(
      this._verificationService
        .applicationStatus()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.status = res.data;
            if (this.status?.kycStatus !== null) {
              this.kcyVerified = true;
              this.currentIndex = 2;
              this.currentPersonalStep = 'have-a-business';
              if (this.routedFromType === CVSourceType.cloud_bank) {
                this.hasBusiness = true;
                this.currentIndex++;
              }
              if (
                this.routedFromType === CVSourceType.add_new_business ||
                this.routedFromType === CVSourceType['form-1099']
              ) {
                this.hasBusiness = true;
                this.currentIndex = 3;
                return;
              }
            }
            if (this.status?.kybStatus !== 0) {
              this.currentIndex = 5;
              this.currentBusinessStep = 'done';
              this.hasBusiness = true;
            }
          }
        })
    );
  }

  checkUserVerification() {
    this.subscriptions.push(
      this.userService.UserVerification$.subscribe((res) => {
        if (res.email_verified === 0 || res.phone_verified === 0) {
          const redirectTo = ['profileBusinessCreate'].includes(this.fromSource)
            ? `/manage/users/verify-user-id`
            : '/manage/verification/index';
          this._router.navigate(['/manage/users/verify-email-phone'], {
            queryParams: {
              returnUrl: redirectTo,
              type: this.routedFromType
            }
          });
        }
      })
    );
  }

  nextStep(data: { hasBusiness: boolean; kycVerified: boolean }) {
    if (data?.hasBusiness) {
      this.hasBusiness = true;
    }

    if (data?.kycVerified) {
      this.kcyVerified = true;
      this.currentIndex = 2;
      return;
    }

    if (this.currentIndex < 5) {
      this.currentIndex++;
    }
  }

  /**
   * @description - updates the current step and routes to cloud bank page if verification is complete and the application came from cloud bank.
   * @param personalStep - gives current step the verificatoin is at and id of the user
   */
  personalVerificationStepChange(personalStep: {
    status: TPersonalVerificationSteps;
    id: string;
  }) {
    this.currentPersonalStep = personalStep.status;
    if (personalStep.status === 'completed' && this.routedFromType === '3') {
      this._router.navigate(['/manage/home'], {
        queryParams: { id: personalStep.id }
      });
    }
  }

  /**
   * @description - updates the current step and opens loader modal for application submission if verification is complete.
   * @param businessStep - gives current step the verificatoin is at and id of the business.
   */
  businessVerficationStepChange(businessStep: {
    status: TBusinessVerificationSteps;
    id: string;
  }) {
    this.currentBusinessStep = businessStep.status;
    if (businessStep.status === 'done' && this.routedFromType === '3') {
      this.openLoaderModal(businessStep.id);
    }
  }

  /**
   * @description display loader modal while account is getting created.
   * @param businessId - business id.
   */
  openLoaderModal(businessId: string): void {
    const dialog = this._dialog.open<LoaderModalComponent, IActionLoaderData>(
      LoaderModalComponent,
      {
        maxWidth: '400px',
        width: '80%',
        minHeight: '200px',
        height: 'unset',
        disableClose: true,
        data: { type: { cloudBank: { businessId } } }
      }
    );
    dialog.afterClosed().subscribe(() => {
      this._router.navigateByUrl('/manage/cloud-bank/index');
    });
  }

  prevStep() {
    if (this.currentIndex > 0) {
      if (
        this.currentBusinessStep === 'businessOwnerConfirm' ||
        this.currentBusinessStep === 'businessOwnerList'
      ) {
        this.prevStepSubject.next();
      } else if (
        this.currentIndex === 3 ||
        (this.currentIndex === 2 &&
          this.routedFromType === CVSourceType.getting_started_v3)
      ) {
        this._location.back();
      } else {
        this.prevStepSubject.next();
        this.currentIndex--;
      }
    } else {
      this._location.back();
    }
  }

  verificationSteps() {
    return (this.currentIndex <= 2 ? this.kycSteps : this.kybSteps).map(
      (v) => v.name
    ) as Array<string>;
  }

  onChildLoading(data: { loading: boolean }) {
    if (data.loading) {
      this.isChildLoading = true;
    } else {
      this.isChildLoading = false;
    }
  }

  disableBackButton(): boolean {
    return (
      this.currentIndex === 3 ||
      this.currentIndex === 5 ||
      this.currentIndex === 2 ||
      this.isChildLoading
    );
  }

  goBack() {
    this._location.back();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
