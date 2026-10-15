import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { Router } from '@angular/router';
import { resolveNotificationLink } from 'src/app/shared/service/route/v4-route-mapper';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserService } from 'src/app/shared/service/user/user.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IApiRes } from 'src/app/models/api';
import { UserDocsUploadModalComponent } from 'src/app/shared/modal/user-docs-upload-modal/user-docs-upload-modal.component';
import {
  IGroupedNotification,
  INotificationDetails,
  INotificationList
} from 'src/app/layout/model/header';
import { days } from 'src/app/data/data/notification';
import { v4LucideIconsMap } from 'src/app/layout/v4-layout/lucide-v4-icons';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';

@Component({
  selector: 'app-notification-view-all-v4',
  templateUrl: './notification-view-all-v4.component.html',
  styleUrls: ['./notification-view-all-v4.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    CommonTabV4Component,
    CommonButtonV4Component,
    V4PageHeaderComponent
  ]
})
export class NotificationViewAllV4Component implements OnInit, OnDestroy {
  readonly icons = v4LucideIconsMap;

  private matDialog = inject(MatDialog);
  private userService = inject(UserService);
  private headerService = inject(HeaderService);
  private router = inject(Router);

  subscriptions: Subscription[] = [];

  notifications: INotificationDetails[] = [];
  groupedNotifications: IGroupedNotification[] = [];
  currentPage = 0;
  totalPage = 0;
  totalNotifications = 0;
  unreadCount = 0;
  initialLoad = true;
  isRefreshing = false;
  paginationPage = 1;
  initialPage = 1;
  filterType = 0;

  // Pagination
  initialCount = 1;
  pageArr: (number | string)[] = [];
  selectedValue!: number;
  pseudoI!: number;
  mode = 1;

  // Tabs
  tabs: ITabItem[] = [
    { label: 'All', value: '0' },
    { label: 'Today', value: '1' },
    { label: 'Unread', value: '2' },
    { label: 'Read List', value: '3' }
  ];
  activeTab = '0';

  ngOnInit(): void {
    this.getNotification();
  }

  getNotification(page = 1): void {
    this.paginationPage = page;
    this.subscriptions.push(
      this.userService
        .getNotification(page, this.filterType)
        .pipe(
          finalize(() => {
            this.initialLoad = false;
            this.isRefreshing = false;
          })
        )
        .subscribe((data: IApiRes<INotificationList>) => {
          if (data?.success) {
            this.notifications = data.data?.notifications;
            this.totalNotifications = data.data?.count || 0;
            this.unreadCount = data.data?.unreadNotificationsCount || 0;
            if (data.data?.count) {
              this.totalPage = Math.ceil(data.data?.count / 10);
            }
            this.paginationArray();
            this.currentPage = page;
            this.organizeNotification();
          }
        })
    );
  }

  goBack(): void {
    this.router.navigateByUrl('/v4/manage/more/index');
  }

  onTabChange(value: string): void {
    this.activeTab = value;
    this.filterType = Number(value);
    this.initialPage = 1;
    this.mode = 1;
    this.getNotification();
  }

  refreshNotifications(): void {
    this.isRefreshing = true;
    this.getNotification(this.currentPage || 1);
  }

  markAsRead(notification: INotificationDetails): void {
    if (!notification.readAt) {
      this.subscriptions.push(
        this.userService
          .markAsRead(notification?.id)
          .subscribe((res: { message: string; success: boolean }) => {
            if (res?.success) {
              notification.readAt = true;
              this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            this.headerService.setNotificationValueChanged(true);
            this.headerService.setHeaderValueChanged(true);
          })
      );
    } else {
      this.subscriptions.push(
        this.userService.markAsUnread(notification?.id).subscribe((data) => {
          if (data.success) {
            notification.readAt = false;
            this.unreadCount += 1;
          }
          this.headerService.setNotificationValueChanged(true);
          this.headerService.setHeaderValueChanged(true);
        })
      );
    }
  }

  markAllRead(): void {
    this.subscriptions.push(
      this.userService.markAllRead().subscribe((data) => {
        if (data?.success) {
          this.getNotification(this.currentPage);
        }
        this.headerService.setNotificationValueChanged(true);
        this.headerService.setHeaderValueChanged(true);
      })
    );
  }

  goToActionLink(item: INotificationDetails): void {
    this.subscriptions.push(
      this.userService.markAsRead(item.id).subscribe((res) => {
        if (res.success) {
          item.readAt = true;
        }
        this.headerService.setHeaderValueChanged(true);
        this.headerService.setNotificationValueChanged(true);
      })
    );

    const { path, queryParams } = resolveNotificationLink(item.notification.action_link);
    this.router.navigate([path], { queryParams, state: { backUrl: this.router.url } });
  }

  openUploadModal(item: INotificationDetails): void {
    const dialog = this.matDialog.open(UserDocsUploadModalComponent, {
      maxWidth: '460px',
      data: item
    });
    dialog.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.getNotification();
      }
    });
  }

  organizeNotification(): void {
    this.groupedNotifications = [];
    this.notifications.forEach((notification) => {
      const dateObj = new Date(notification.createdAt as string);
      const dayName = this.isToday(dateObj)
        ? 'Today'
        : this.getDayName(notification.createdAt as string);
      const existingGroup = this.groupedNotifications.find(
        (group) => group.day === dayName
      );
      const formattedDate = `${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${dateObj
        .getDate()
        .toString()
        .padStart(2, '0')}-${dateObj.getFullYear()}`;
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

  // ── Pagination ──

  paginationArray(): void {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;
      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;
      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];
      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  onPrevious(): void {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.getNotification(this.initialPage);
    }
  }

  onNext(): void {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.getNotification(this.initialPage);
    }
  }

  gotoPage(page: number | string): void {
    const item = Number(page);
    if (item > 0) {
      this.initialPage = item;
      if (item < this.initialCount + 4) {
        this.mode = 1;
        this.paginationArray();
      } else if (item > this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }
    this.getNotification(item);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
