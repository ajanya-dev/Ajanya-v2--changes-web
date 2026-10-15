import { catchError } from 'rxjs/operators';
import { Subscription, EMPTY } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { IActionLoaderData } from 'src/app/modules/common-verification/model/common-verification';
import { Router } from '@angular/router';
import { CommonVerificationService } from '../../service/common/common-verification.service';
import { CheckDraftService } from '../../service/check-draft/check-draft.service';
import { AlertService } from '../../service/alert/alert.service';
import { CloudBankService } from '../../service/cloud-bank/cloud-bank.service';

/**
 * @description Modal component for loader of application processing.
 */
@Component({
  selector: 'app-loader-modal',
  templateUrl: './loader-modal.component.html',
  styleUrls: ['./loader-modal.component.scss'],
  standalone: true
})
export class LoaderModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  content = "Your application is processing. Please don't close the window.";
  title = 'Processing...';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IActionLoaderData,
    private dilogueRef: MatDialogRef<LoaderModalComponent>,
    private verificationService: CommonVerificationService,
    private alertService: AlertService,
    private checkDraftService: CheckDraftService,
    private cloudService: CloudBankService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActionType(this.data.type);
  }

  /**
   * @description Method to check processing type and set the display content accordingly.
   * @param type - application type.
   */
  loadActionType(type: IActionLoaderData['type']): void {
    if (type?.ach) {
      this.applyAch(
        this.data.type?.ach!.businessId,
        this.data.type?.ach!.bankAccountId
      );
      this.content =
        "Your ACH application is processing. Please don't close the window.";
    } else if (type?.checkDraft) {
      this.applyCheckDraft(
        this.data.type?.checkDraft!.businessId,
        this.data.type?.checkDraft!.bankAccountId
      );
      this.content =
        "Your Check Draft application is processing. Please don't close the window.";
    } else if (type?.cloudBank) {
      this.applyCloudBank(this.data.type?.cloudBank!.businessId);
      this.content =
        "Your Cloud Bank application is processing. Please don't close the window.";
    } else if (type?.cloudBankPersonalAccount) {
      this.applyCloudBankPersonalAccount(
        this.data.type?.cloudBankPersonalAccount!
      );
      this.content =
        "Your Cloud Bank Personal Account application is processing. Please don't close the window.";
    }
  }

  /**
   * @description Method to apply for ach.
   * @param businessId - business id.
   * @param bankAccountId - business account id.
   */
  applyAch(businessId: string, bankAccountId: string) {
    this.verificationService
      .bankAchApplication({ businessId, bankAccountId })
      .pipe(
        catchError((err) => {
          if(err.error.errorCode === 10021){
            const alert = this.alertService.failedAlert({
              content: 'The bank account holder name doesn’t match the selected business name. Please update the account holder name to match the business name and try again.',
              doneMsg: 'Update',
              isCancel: true
            });
            alert.afterClosed().subscribe((res) => {
              if(res){
                this.dilogueRef.close({ success: false , errorCode: 10021, businessId, bankAccountId});
              }else{
                this.dilogueRef.close({ success: false });
              }
            });
          }else{
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

  /**
   * @description Method to apply for check draft.
   * @param businessId - business id.
   * @param bankAccountId - business account id.
   */
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

  /**
   * @description Method to apply for cloud bank.
   * @param businessId - business id.
   * @param bankAccountId - business account id.
   */
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
            this.router.navigate(['/manage/cloud-bank/index']);
            this.dilogueRef.close({ success: true });
          }
        })
    );
  }

  /**
   * @description Method to apply for cloud bank personal account.
   * @param businessId - business id.
   * @param bankAccountId - business account id.
   */
  applyCloudBankPersonalAccount(personalDetails: FormData) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
