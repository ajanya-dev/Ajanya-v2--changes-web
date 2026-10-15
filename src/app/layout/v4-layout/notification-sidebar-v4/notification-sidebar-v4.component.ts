import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { resolveNotificationLink } from 'src/app/shared/service/route/v4-route-mapper';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import { NotificationSidebarService } from '../services/notification-sidebar.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import {
  INotificationDetails,
  IGroupedNotification
} from 'src/app/layout/model/header';
import { days } from 'src/app/data/data/notification';
import { v4LucideIconsMap } from '../lucide-v4-icons';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';

@Component({
  selector: 'app-notification-sidebar-v4',
  templateUrl: './notification-sidebar-v4.component.html',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component]
})
export class NotificationSidebarV4Component implements OnInit, OnDestroy {
  readonly icons = v4LucideIconsMap;

  private router = inject(Router);
  private headerService = inject(HeaderService);
  private userService = inject(UserService);
  private companyService = inject(CompanyManagementService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private themeService = inject(ThemeService);
  notificationSidebarService = inject(NotificationSidebarService);

  isOpen = computed(() => this.notificationSidebarService.isOpen());

  subscriptions: Subscription[] = [];
  notifications: INotificationDetails[] = [];
  groupedNotifications: IGroupedNotification[] = [];
  notificationCount = 0;
  isLoading = false;

  /** True when the user has never mailed a check (`checkMailExist === 0`). */
  showCheckMailNotification = signal(false);
  /** True when the user is a paid subscriber (`isSubscribed === 1`). */
  isSubscribed = signal(false);
  isDarkMode = signal(false);

  ngOnInit(): void {
    this.getUserOverallData();
    this.checkSubscriptionStatus();
    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.subscriptions.push(
      this.themeService.getThemeSwitch().subscribe((dark) => {
        this.isDarkMode.set(dark);
      }),
      this.headerService.getNotificationValueChanged().subscribe(() => {
          this.getNotification();
      }),
      this.companyService.getCompanyChanges().subscribe(() => {
        this.getNotification();
        this.getUserOverallData();
      })
    );
  }

  /**
   * @description Fetches the user's overall dashboard stats and enables the
   * "First Check Mail is Free" promo only when no check has ever been mailed.
   */
  getUserOverallData(): void {
    this.subscriptions.push(
      this.userService.getUserOverallData().subscribe((res) => {
        if (res?.success) {
          this.showCheckMailNotification.set(res.data?.checkMailExist === 0);
        }
      })
    );
  }

  /**
   * @description Tracks whether the user is a paid subscriber so the free
   * check-mail promo is hidden for subscribed users.
   */
  private checkSubscriptionStatus(): void {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((headerData) => {
        if (typeof headerData === 'boolean') return;
        this.isSubscribed.set(headerData.isSubscribed === 1);
      })
    );
  }

  getNotification(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.userService.getHomePageNotifications().subscribe((data) => {
        this.isLoading = false;
        if (data?.success) {
          this.notifications = data.data;
          this.notificationCount = data.data.filter((n) => !n.readAt).length;
          this.organizeNotification();
        }
      })
    );
  }

  organizeNotification(): void {
    this.groupedNotifications = [];
    this.notifications.slice(0, 10).forEach((notification) => {
      const dateObj = new Date(notification.createdAt as string);
      const dayName = this.isToday(dateObj)
        ? 'Today'
        : this.getDayName(notification.createdAt as string);
      const existingGroup = this.groupedNotifications.find(
        (g) => g.day === dayName
      );
      const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
      if (existingGroup) {
        existingGroup.notifications.push(notification);
      } else {
        this.groupedNotifications.push({
          day: dayName,
          date: formattedDate,
          notifications: [notification]
        });
      }
    });
  }

  getDayName(dateString: string): string {
    const date = new Date(dateString);
    return days[date.getDay()];
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  redirectToPage(value: INotificationDetails): void {
    this.subscriptions.push(
      this.userService.markAsRead(value.id).subscribe((res) => {
        if (res.success) {
          value.readAt = true;
        }
        this.headerService.setHeaderValueChanged(true);
        this.headerService.setNotificationValueChanged(true);
      })
    );

    const { path, queryParams } = resolveNotificationLink(value.notification.action_link);
    this.router.navigate([path], { queryParams, state: { backUrl: this.router.url } });
    this.notificationSidebarService.close();
  }

  markAllRead(): void {
    this.subscriptions.push(
      this.userService.markAllHomeNofificationsAsRead().subscribe((data) => {
        if (data?.success) {
          this.getNotification();
        }
        this.headerService.setNotificationValueChanged(true);
        this.headerService.setHeaderValueChanged(true);
      })
    );
  }

  closeSidebar(): void {
    this.notificationSidebarService.close();
  }

  viewAllNotifications(): void {
    this.router.navigate(['/v4/manage/more/notification/show']);
    this.notificationSidebarService.close();
  }

  navigateToSendPayment(): void {
    this.paymentsV4Service.openSendModal();
  }

  getNotificationIconInfo(icon: string): { name: string; color: string } {
    const iconMap: Record<string, { name: string; color: string }> = {
      'fa-check-circle': { name: 'circle-check', color: 'text-v4-common-green-color' },
      'fa-times-circle': { name: 'circle-x', color: 'text-v4-common-red-color' },
      'fa-exclamation-circle': { name: 'circle-alert', color: 'text-v4-common-yellow-color' },
      'fa-info-circle': { name: 'info', color: 'text-v4-common-blue-color' },
      'fa-envelope': { name: 'mail', color: 'text-v4-primary-brand-bold-color' },
      'fa-money-bill': { name: 'banknote', color: 'text-v4-common-green-color' },
      'fa-credit-card': { name: 'credit-card', color: 'text-v4-primary-brand-bold-color' },
      'fa-university': { name: 'landmark', color: 'text-v4-primary-brand-bold-color' },
      'fa-file-alt': { name: 'file-text', color: 'text-v4-tertiary-text-color' },
      'fa-user': { name: 'user', color: 'text-v4-primary-brand-bold-color' },
      'fa-building': { name: 'building-2', color: 'text-v4-primary-brand-bold-color' },
      'fa-cog': { name: 'settings', color: 'text-v4-tertiary-text-color' }
    };
    const match = Object.entries(iconMap).find(([key]) => icon?.includes(key));
    return match ? match[1] : { name: 'bell', color: 'text-v4-common-blue-color' };
  }

  getIconBgColor(icon: string): string {
    const info = this.getNotificationIconInfo(icon);
    const colorMap: Record<string, string> = {
      'text-v4-common-green-color': 'color-mix(in srgb, var(--v4-common-green-color) 15%, transparent)',
      'text-v4-common-red-color': 'color-mix(in srgb, var(--v4-common-red-color) 15%, transparent)',
      'text-v4-common-yellow-color': 'color-mix(in srgb, var(--v4-common-yellow-color) 15%, transparent)',
      'text-v4-common-blue-color': 'color-mix(in srgb, var(--v4-common-blue-color) 15%, transparent)',
      'text-v4-primary-brand-bold-color': 'color-mix(in srgb, var(--v4-primary-brand-bold-color) 15%, transparent)',
      'text-v4-tertiary-text-color': 'color-mix(in srgb, var(--v4-tertiary-text-color) 15%, transparent)'
    };
    return colorMap[info.color] || 'color-mix(in srgb, var(--v4-common-blue-color) 15%, transparent)';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
