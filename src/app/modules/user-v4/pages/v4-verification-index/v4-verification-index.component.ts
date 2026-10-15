import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { LoaderModalComponent } from 'src/app/shared/modal/loader-modal/loader-modal.component';
import {
  CVSourceType,
  IActionLoaderData
} from 'src/app/modules/common-verification/model/common-verification';
import { MatDialog } from '@angular/material/dialog';
import {
  TBusinessVerificationSteps,
  V4BusinessVerificationComponent
} from '../../components/v4-business-verification/v4-business-verification.component';
import {
  TPersonalVerificationSteps,
  VerifyUserIdOcwV3Component
} from '../../../user/user-v3/components/verify-user-id-ocw-v3/verify-user-id-ocw-v3.component';
import { CommonVerificationService } from '../../../../shared/service/common/common-verification.service';

@Component({
  selector: 'app-v4-verification-index',
  templateUrl: './v4-verification-index.component.html',
  styleUrls: ['./v4-verification-index.component.scss'],
  standalone: true,
  imports: [VerifyUserIdOcwV3Component, V4BusinessVerificationComponent]
})
export class V4VerificationIndexComponent implements OnInit, OnDestroy {
  prevStepSubject = new Subject<void>();
  subscriptions: Subscription[] = [];

  private userService = inject(UserProfileService);
  private location = inject(Location);
  private verificationService = inject(CommonVerificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

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
    this.route.queryParams.subscribe((params) => {
      this.routedFromType = params.type;
      this.fromSource = params.from;
    });
    this.getStatus();
    this.checkUserVerification();
  }

  getStatus() {
    this.loading = true;
    this.subscriptions.push(
      this.verificationService
        .applicationStatus()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.status = res.data;
            if (this.status?.kycStatus !== null) {
              this.kcyVerified = true;
              this.currentIndex = 2;
              this.currentPersonalStep = 'have-a-business';
              if (this.routedFromType === CVSourceType.cloud_bank) {
                this.hasBusiness = true;
                this.currentIndex += 1;
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
            ? `/v4/manage/verification/index`
            : '/v4/manage/verification/index';
          this.router.navigate(['/v4/manage/verification/index'], {
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
      this.currentIndex += 1;
    }
  }

  personalVerificationStepChange(personalStep: {
    status: TPersonalVerificationSteps;
    id: string;
  }) {
    this.currentPersonalStep = personalStep.status;
    if (personalStep.status === 'completed' && this.routedFromType === '3') {
      this.router.navigate(['/v4/manage/home'], {
        queryParams: { id: personalStep.id }
      });
    }
  }

  businessVerficationStepChange(businessStep: {
    status: TBusinessVerificationSteps;
    id: string;
  }) {
    this.currentBusinessStep = businessStep.status;
    if (businessStep.status === 'done' && this.routedFromType === '3') {
      this.openLoaderModal(businessStep.id);
    }
  }

  openLoaderModal(businessId: string): void {
    const dialogRef = this.dialog.open<LoaderModalComponent, IActionLoaderData>(
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
    dialogRef.afterClosed().subscribe(() => {
      this.router.navigateByUrl('/manage/cloud-bank/index');
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
        this.location.back();
      } else {
        this.prevStepSubject.next();
        this.currentIndex -= 1;
      }
    } else {
      this.location.back();
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
      this.currentIndex === 5 || this.currentIndex === 2 || this.isChildLoading
    );
  }

  goBack() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
