import { catchError } from 'rxjs/operators';
import { Subscription, EMPTY } from 'rxjs';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { IActionLoaderData } from 'src/app/modules/common-verification/model/common-verification';
import { Router } from '@angular/router';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonVerificationService } from '../../service/common/common-verification.service';
import { CheckDraftService } from '../../service/check-draft/check-draft.service';
import { V4AlertService } from '../../service/alert/v4-alert.service';
import { CloudBankService } from '../../service/cloud-bank/cloud-bank.service';

@Component({
  selector: 'app-v4-loader-modal',
  templateUrl: './v4-loader-modal.component.html',
  styleUrls: ['./v4-loader-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, LucideAngularModule]
})
export class V4LoaderModalComponent implements OnInit, OnDestroy {
  readonly XIcon = X;

  subscriptions: Subscription[] = [];

  headerTitle = 'Processing';
  content = "Your application is processing. Please don't close the window.";
  title = 'Processing...';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IActionLoaderData,
    private dilogueRef: MatDialogRef<V4LoaderModalComponent>,
    private verificationService: CommonVerificationService,
    private alertService: V4AlertService,
    private checkDraftService: CheckDraftService,
    private cloudService: CloudBankService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActionType(this.data.type);
  }

  loadActionType(type: IActionLoaderData['type']): void {
    if (type?.ach) {
      this.applyAch(type.ach.businessId, type.ach.bankAccountId);
      this.headerTitle = 'Apply for ACH';
      this.content =
        "Your ACH application is processing. Please don't close the window.";
    } else if (type?.checkDraft) {
      this.applyCheckDraft(
        type.checkDraft.businessId,
        type.checkDraft.bankAccountId
      );
      this.headerTitle = 'Apply for Checkdraft';
      this.content =
        "Your Check Draft application is processing. Please don't close the window.";
    } else if (type?.cloudBank) {
      this.applyCloudBank(type.cloudBank.businessId);
      this.headerTitle = 'Apply for Cloud Bank';
      this.content =
        "Your Cloud Bank application is processing. Please don't close the window.";
    } else if (type?.cloudBankPersonalAccount) {
      this.applyCloudBankPersonalAccount(type.cloudBankPersonalAccount);
      this.headerTitle = 'Apply for Cloud Bank';
      this.content =
        "Your Cloud Bank Personal Account application is processing. Please don't close the window.";
    }
  }

  applyAch(businessId: string, bankAccountId: string) {
    this.verificationService
      .bankAchApplication({ businessId, bankAccountId })
      .pipe(
        catchError((err) => {
          if (err.error.errorCode === 10021) {
            const alert = this.alertService.failedAlert({
              content:
                'The bank account holder name doesn\u2019t match the selected business name. Please update the account holder name to match the business name and try again.',
              doneMsg: 'Update',
              isCancel: true
            });
            alert.afterClosed().subscribe((res) => {
              if (res) {
                this.dilogueRef.close({
                  success: false,
                  errorCode: 10021,
                  businessId,
                  bankAccountId
                });
              } else {
                this.dilogueRef.close({ success: false });
              }
            });
          } else {
            this.dilogueRef.close({ success: false });
            this.alertService.failedAlert({
              content:
                err.error?.errorMsg ??
                err.error?.message ??
                err.message ??
                'Something went wrong!'
            });
          }
          return EMPTY;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'ACH Applied',
            timeout: 2000
          });
          this.dilogueRef.close({ success: true });
        }
      });
  }

  applyCheckDraft(businessId: string, bankAccountId: string) {
    this.subscriptions.push(
      this.checkDraftService
        .applayCheckDraft({ businessId, bankAccountId })
        .pipe(
          catchError((err) => {
            if (err) {
              this.dilogueRef.close({ success: false });
            }
            return EMPTY;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Check Draft Applied',
              timeout: 2000
            });
            this.dilogueRef.close({ success: true });
          }
        })
    );
  }

  applyCloudBank(businessId: string) {
    this.subscriptions.push(
      this.cloudService
        .applyCloudBank(businessId)
        .pipe(
          catchError((err) => {
            if (err) {
              this.dilogueRef.close({ success: false });
            }
            return EMPTY;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Application submitted'
            });
            this.router.navigate(['/v4/manage/cloud-bank/index']);
            this.dilogueRef.close({ success: true });
          }
        })
    );
  }

  applyCloudBankPersonalAccount(_personalDetails: FormData) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
