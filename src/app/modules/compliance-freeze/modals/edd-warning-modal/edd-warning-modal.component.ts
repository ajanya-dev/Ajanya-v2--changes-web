import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faTriangleExclamation,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, take } from 'rxjs';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { RerunVerificationComponent } from 'src/app/modules/payments/shared/modal/rerun-verification/rerun-verification.component';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-edd-warning-modal',
  standalone: true,
  imports: [
    FaIconComponent,
    MatDialogClose,
    CommonButtonV35Component,
    NgOptimizedImage
  ],
  templateUrl: './edd-warning-modal.component.html',
  styleUrl: './edd-warning-modal.component.scss'
})
export class EddWarningModalComponent implements OnInit {
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private commonVerificationService = inject(CommonVerificationService);
  private dialogRef = inject(MatDialogRef<EddWarningModalComponent>);
  public data: { businessId: string } = inject(MAT_DIALOG_DATA);

  faXmark = faXmark;
  faTriangleExclamation = faTriangleExclamation;
  isLoading = signal(false);
  businessName = signal<string>('');
  daysRemaining = signal<number>(
    this.localStorageService.getItem('eddRequestData')?.days_remaining
  );

  isUrgent = computed(() => this.daysRemaining() <= 10);

  ngOnInit(): void {
    this.getBusinessName();
  }

  /**
   * Retrieves the business name from the API.
   */
  private getBusinessName(): void {
    this.isLoading.set(true);
    this.commonVerificationService
      .getUserBusinessName(this.data?.businessId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.businessName.set(res.data.businessName);
        }
      });
  }

  openRerunKybModal(): void {
    this.dialogRef.close(true);
    this.dialog.open(RerunVerificationComponent, {
      panelClass: 'persona-modal',
      width: '400px',
      height: '720px',
      disableClose: true,
      data: {
        mode: 'edd',
        sourceType: CVSourceType.other,
        reVerificationId:
          this.localStorageService.getItem('rerunVerification')?.id,
        businessId: this.localStorageService.getItem('eddRequestData')?.kyb_id,
        eddInquiryId:
          this.localStorageService.getItem('eddRequestData')?.edd_inquiry_id
      }
    });
  }
}
