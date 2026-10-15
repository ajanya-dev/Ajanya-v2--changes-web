import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { UserService } from 'src/app/shared/service/user/user.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Router } from '@angular/router';
import { IApiRes } from 'src/app/models/api';
import { MatDialog } from '@angular/material/dialog';
import { UserDocsUploadModalComponent } from 'src/app/shared/modal/user-docs-upload-modal/user-docs-upload-modal.component';
import {
  IGroupedNotification,
  INotificationDetails,
  INotificationList
} from '../../../../layout/model/header';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { days } from 'src/app/data/data/notification';
import { resolveV3RecurringNotificationLink } from 'src/app/shared/service/route/v4-route-mapper';

/**
 * Angular component representing the Notification View All page.
 * @class
 */
@Component({
  selector: 'app-notification-view-all',
  templateUrl: './notification-view-all.component.html',
  styleUrls: ['./notification-view-all.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    FaIconComponent,
    NgOptimizedImage
  ]
})
export class NotificationViewAllComponent implements OnInit, OnDestroy {
  private matDialog = inject(MatDialog);
  private userService = inject(UserService);
  private headerService = inject(HeaderService);
  private router = inject(Router);

  subscriptions: Subscription[] = [];

  notifications: INotificationDetails[] = [];
  currentPage = 0;

  initialCount = 1;
  pageArr: (number | string)[] = [];
  initialPage = 1;
  selectedValue!: number;
  pseudoI!: number;
  totalPage = 0;
  mode = 1;
  filterType = 0;
  initialLoad = true;
  paginationPage = 1;
  selectedTab: { id: number; label: string } = { id: 0, label: 'All' };
  groupedNotifications: IGroupedNotification[] = [];
  notificationCategories = [
    { id: 0, label: 'All' },
    { id: 1, label: 'Today' },
    { id: 2, label: 'Unread' },
    { id: 3, label: 'Read List' }
  ];

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Initializes the component by fetching notifications.
   * @method
   */
  ngOnInit(): void {
    this.getNotification();
  }

  /**
   * Fetches notifications for the specified page.
   * @method
   * @param {number} page - The page number to fetch notifications for.
   */
  getNotification(page = 1) {
    this.paginationPage = page;
    this.subscriptions.push(
      this.userService
        .getNotification(page, this.filterType)
        .pipe(
          finalize(() => {
            this.initialLoad = false;
          })
        )
        .subscribe((data: IApiRes<INotificationList>) => {
          if (data?.success) {
            this.notifications = data.data?.notifications;
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

  /**
   * Marks a notification as read or unread.
   * @method
   * @param {INotificationDetails} notification - The notification to mark as read/unread.
   */
  markAsRead(notification: INotificationDetails) {
    if (!notification.readAt) {
      this.subscriptions.push(
        this.userService
          .markAsRead(notification?.id)
          .subscribe((res: { message: string; success: boolean }) => {
            if (res?.success) {
              notification.readAt = true;
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
          }
          this.headerService.setNotificationValueChanged(true);
          this.headerService.setHeaderValueChanged(true);
        })
      );
    }
  }

  /**
   * Marks all notifications as read.
   * @method
   */
  markAllRead() {
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

  /**
   * Redirects to a specific page when a notification is clicked.
   * @method
   * @param {INotificationDetails} item - The notification item clicked.
   */
  goToActionLink(item: INotificationDetails) {
    this.userService.markAsRead(item.id).subscribe((res) => {
      if (res.success) {
        item.readAt = true;
      }
      this.headerService.setHeaderValueChanged(true);
      this.headerService.setNotificationValueChanged(true);
    });

    const recurringLink = resolveV3RecurringNotificationLink(
      item.notification.action_link
    );
    if (recurringLink) {
      this.router.navigate([recurringLink.path], {
        queryParams: recurringLink.queryParams,
        state: { backUrl: this.router.url }
      });
      return;
    }

    /**
     * Extracts the page URL from the notification's action link.
     * @type {string}
     */
    const [, fullPath] = item.notification.action_link.split('.com/');

    /**
     * Splits the path and query parameters.
     */
    const [path, queryString] = fullPath.split('?');

    /**
     * Replaces a specific part of the URL path.
     */
    const link = '/?id=/';
    const redirectPath = path.replace(link, '/');

    /**
     * Combines the path and query parameters.
     */
    const queryParams = queryString
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};

    /**
     * Navigates to the new URL.
     */
    this.router.navigate([redirectPath], {
      queryParams,
      state: { backUrl: this.router.url }
    });
  }

  /**
   * Generates an array for pagination control based on the current mode.
   * @method
   */
  paginationArray() {
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

  /**
   * Moves to the previous page of notifications.
   * @method
   */
  onPrevious() {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.getNotification(this.initialPage);
    }
  }

  /**
   * Moves to the next page of notifications.
   * @method
   */
  onNext() {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.getNotification(this.initialPage);
    }
  }

  /**
   * Navigates to a specific page of notifications.
   * @method
   * @param {number | string} item - The page number to navigate to.
   */
  gotoPage(page: number | string) {
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

  /**
   * @description Opens modal for upload user documents requested by super admin
   * @param item notification details
   */
  openUploadModal(item: INotificationDetails) {
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

  changeCategoryTab(item: { id: number; label: string }) {
    this.selectedTab = item;
    this.filterType = item.id;
    this.getNotification();
  }

  /**
   * Method for organizing notifications based on the date
   */
  organizeNotification() {
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

  /**
   * Method to get dayName
   */
  getDayName(dateString: string) {
    const date = new Date(dateString);
    return days[date.getDay()];
  }

  /**
   * Method to check the day is today or not
   */
  isToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }


  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
export class MenuIconsExample {}
