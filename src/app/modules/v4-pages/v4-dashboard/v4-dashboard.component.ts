import { Component, computed, DestroyRef, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { VerificationBannerComponent } from './components/verification-banner/verification-banner.component';
import { OverviewMetricsComponent } from './components/overview-metrics/overview-metrics.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { BulkPaymentCenterComponent } from './components/bulk-payment-center/bulk-payment-center.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { NotificationSidebarService } from 'src/app/layout/v4-layout/services/notification-sidebar.service';
import { NotificationSidebarV4Component } from 'src/app/layout/v4-layout/notification-sidebar-v4/notification-sidebar-v4.component';
import { v4LucideIconsMap } from 'src/app/layout/v4-layout/lucide-v4-icons';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-v4-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    LucideAngularModule,
    CommonButtonV4Component,
    VerificationBannerComponent,
    OverviewMetricsComponent,
    RecentTransactionsComponent,
    BulkPaymentCenterComponent,
    NotificationSidebarV4Component,
    MatTooltip,
    NgClass
  ],
  templateUrl: './v4-dashboard.component.html',
  styleUrl: './v4-dashboard.component.scss'
})
export class V4DashboardComponent implements OnInit, OnDestroy {
  readonly icons = v4LucideIconsMap;

  private userProfileService = inject(UserProfileService);
  private companyService = inject(CompanyManagementService);
  notificationSidebarService = inject(NotificationSidebarService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  private readonly SIDEBAR_BREAKPOINT = 1280;

  isUnverified = signal<boolean | null>(null);
  isSidebarOpen = computed(() => this.notificationSidebarService.isOpen());
  companyName = signal<string>('');
  currentDate = new Date();

  @HostListener('window:resize')
  onResize(): void {
    this.updateSidebarVisibility();
  }

  ngOnInit(): void {
    this.updateSidebarVisibility();
    this.checkVerificationStatus();
    this.companyName.set(this.companyService.getActiveCompanyName() || '');

    this.companyService
      .getCompanyChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkVerificationStatus();
        this.companyName.set(this.companyService.getActiveCompanyName() || '');
      });
  }

  navigateToVerification(): void {
    this.router.navigate(['/v4/manage/verification/index']);
  }

  navigateToSendPayment(): void {
    this.router.navigate(['/v4/manage/payments/pay'], {
      state: { backUrl: this.router.url }
    });
  }

  navigateToReceivePayment(): void {
    this.router.navigate(['/v4/manage/payments/receive'], {
      state: { backUrl: this.router.url }
    });
  }

  private checkVerificationStatus(): void {
    this.userProfileService
      .checkEmailAndPhoneVerified()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if ('data' in res && res.data) {
            const {data} = res;
            this.isUnverified.set(
              data.email_verified !== 1 || data.phone_verified !== 1
            );
          }
        },
        error: () => {
          this.isUnverified.set(false);
        }
      });
  }

  private updateSidebarVisibility(): void {
    if (window.innerWidth >= this.SIDEBAR_BREAKPOINT) {
      this.notificationSidebarService.open();
    } else {
      this.notificationSidebarService.close();
    }
  }

  ngOnDestroy(): void {
    this.notificationSidebarService.close();
  }
}
