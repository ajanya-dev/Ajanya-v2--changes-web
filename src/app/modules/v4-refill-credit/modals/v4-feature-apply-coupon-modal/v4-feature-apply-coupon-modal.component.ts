import { Component, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgClass, CurrencyPipe } from '@angular/common';
import { Subject, finalize, takeUntil } from 'rxjs';
import { LucideAngularModule, Sparkles } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IFeatureApplyCoupon } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

@Component({
  selector: 'app-v4-feature-apply-coupon-modal',
  standalone: true,
  imports: [
    NgClass,
    CurrencyPipe,
    LucideAngularModule,
    CommonButtonV4Component
  ],
  templateUrl: './v4-feature-apply-coupon-modal.component.html',
  styleUrl: './v4-feature-apply-coupon-modal.component.scss'
})
export class V4FeatureApplyCouponModalComponent implements OnDestroy {
  dialogData: IFeatureApplyCoupon = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<V4FeatureApplyCouponModalComponent>);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);

  readonly sparklesIcon = Sparkles;
  destroy$ = new Subject<boolean>();
  isLoading = false;
  showFeatures = false;

  constructor() {
    if (this.dialogData.type === 'home') {
      this.showFeatures = true;
    }
  }

  get rewardCount(): number {
    if (this.dialogData?.shared_features?.length && this.dialogData?.credit_type === 3) {
      return this.dialogData.shared_features.length;
    }
    if (this.dialogData?.features?.length) {
      return this.dialogData.features.length;
    }
    return 1;
  }

  onGrab(): void {
    if (this.dialogData.type === 'login') {
      this.onGrabRewards();
    } else {
      this.dialogRef.close();
    }
  }

  onGrabRewards(): void {
    this.isLoading = true;
    this.headerService
      .grabRewards(this.dialogData?.id as string)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
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
