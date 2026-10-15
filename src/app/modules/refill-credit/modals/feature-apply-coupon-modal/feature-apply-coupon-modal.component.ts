import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subject, finalize, takeUntil } from 'rxjs';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IFeatureApplyCoupon } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { NgClass, CurrencyPipe } from '@angular/common';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltip } from '@angular/material/tooltip';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

@Component({
  selector: 'app-feature-apply-coupon-modal',
  templateUrl: './feature-apply-coupon-modal.component.html',
  styleUrls: ['./feature-apply-coupon-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatTooltip,
    CommonButtonV35Component,
    NgClass,
    CurrencyPipe
  ]
})
export class FeatureApplyCouponModalComponent implements OnInit, OnDestroy {
  dialogData: IFeatureApplyCoupon = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);

  destroy$ = new Subject<boolean>();
  isLoading = false;
  showFeatures = false;

  ngOnInit(): void {
    if (this.dialogData.type === 'home') {
      this.showFeatures = true;
    }
  }

  /**
   * @description  Handles the action of grabbing rewards based on the type of the dialog data.
   */
  onGrab() {
    if (this.dialogData.type === 'login') {
      this.onGrabRewards();
    } else {
      this.dialogRef.close();
    }
  }

  /**
   * @description Handles the action of grabbing rewards.
   */
  onGrabRewards() {
    this.isLoading = true;
    this.headerService
      .grabRewards(this.dialogData?.id as string)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          takeUntil(this.destroy$);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.localStorageService.removeItem('reward');
          this.showFeatures = true;
          this.headerService.onRefreshDynamicHeader = true;
          this.headerService.setHeaderValueChanged(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
