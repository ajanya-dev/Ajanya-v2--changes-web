import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PayrollService } from 'src/app/modules/payroll-by-card/services/payroll.service';
import { IBusinessDetails } from 'src/app/models/bank';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IUserVerification } from 'src/app/models/user';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { CloudListV35Service } from '../../../cloud-bank-v3/services/cloud-list-v35.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * @description Component for managing existing businesses.
 */
@Component({
  selector: 'app-existing-business',
  templateUrl: './existing-business.component.html',
  styleUrls: ['./existing-business.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FaIconComponent]
})
export class ExistingBusinessComponent implements OnInit, OnDestroy {
  private userProfileService = inject(UserProfileService);
  public dialogRef = inject(MatDialogRef<ExistingBusinessComponent>);
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private verificationService = inject(CommonVerificationService);
  private alertService = inject(AlertService);
  private cloudService = inject(CloudBankService);
  private cloudListV35Service = inject(CloudListV35Service);
  private payrollService = inject(PayrollService);
  private authDataService = inject(AuthDataService);
  private data: { source: CVSourceType; from?: string } =
    inject(MAT_DIALOG_DATA);

  private personaHelperService = inject(PersonaHelperService);
  private gettingStartedService = inject(GettingStartedService);

  subscriptions: Subscription[] = [];
  solidBusinessDetails: { id: string; business_name: string }[] = [];
  businessDetails: IBusinessDetails[] = [];
  kycKybStatus: { kycStatus: number; kybStatus: number };
  from: string | undefined;
  loading = false;
  userStatus: IUserVerification;

  ngOnInit(): void {
    this.getBusinessDetails();
    this.verifyEmailAndPhone();
    this.from = this.data.from;
  }

  /**
   * @description Fetches details of solid and other businesses.
   */
  getBusinessDetails(): void {
    this.subscriptions.push(
      this.verificationService.getUserBusinesses().subscribe((res) => {
        if (res.success) this.businessDetails = res.data as IBusinessDetails[];
      })
    );
  }

  /**
   * @description Handles adding a new business.
   */
  addNewBusiness() {
    if (
      this.userStatus?.email_verified === 0 ||
      this.userStatus?.phone_verified === 0
    ) {
      this.authDataService.verifyEmailAndMobile(
        this.authDataService.getVerificationMessage(this.userStatus)
      );
    } else if (environment.isV4Persona) {
      const isKycVerifed =
        this.gettingStartedService.gettingStartedData.isKycStatusDone;
      if (!isKycVerifed) {
        this.personaHelperService.openModal('kyc').subscribe((res) => {
          if (res?.data.inquiry_type === 'kyb') {
            this.payrollService.openBusinessListModal();
          }
        });
      } else {
        this.personaHelperService
          .openModal('kyb', CVSourceType.add_new_business)
          .subscribe((res) => {
            if (res?.data?.inquiry_id) {
              this.payrollService.openBusinessListModal();
            }
          });
      }
    } else {
      this.router.navigate(['/manage/users/verify-user-id'], {
        queryParams: { type: CVSourceType.add_new_business, from: this.from }
      });
    }
    this.dialogRef.close();
  }

  /**
   * @description Get email and phone verification details.
   */
  verifyEmailAndPhone() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.userStatus = res;
      })
    );
  }

  /**
   * @description Handles selecting an account and processing it.
   * @param item - Business details of the selected account.
   */
  selectAccount(item: IBusinessDetails): void {
    if (this.from !== 'payroll') {
      this.alertService
        .confirmAlert({
          content: `Apply Cloud Bank for ${item.businessName}`
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.applyCloudBank(item.id);
          }
        });
    } else {
      this.alertService
        .confirmAlert({
          content: `Kindly confirm the addition of this business for processing payroll via credit card.`
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const body = { businessId: item.id };
            this.subscriptions.push(
              this.payrollService
                .addManualPayroll(body)
                .subscribe((response) => {
                  if (response) {
                    this.dialogRef.close();
                    this.alertService.successAlert({
                      content: 'Connected Successfully'
                    });
                    this.payrollService.isConnectedSuccess.next(false);
                  }
                })
            );
          }
        });
    }
  }

  /**
   * @description Applies for CloudBank for a selected business.
   * @param businessId - ID of the selected business.
   */
  applyCloudBank(businessId: string) {
    this.loading = true;
    this.subscriptions.push(
      this.cloudService
        .applyCloudBank(businessId)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.dialogRef.close({ success: true });
            this.alertService.successAlert({
              content:
                'Your application has been submitted successfully. Your account will be accessible on approval.',
              timeout: 3000
            });
            this.cloudListV35Service.getBankAccountData('create');
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
