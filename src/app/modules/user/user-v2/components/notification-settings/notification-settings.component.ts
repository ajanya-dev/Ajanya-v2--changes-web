import { Component, OnDestroy, inject, input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { NgFor } from '@angular/common';
import { IUserNotificationSetting } from '../../../model/user';

/**
 * @description Component for notification settings in application settings
 */
@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss'],
  standalone: true,
  imports: [NgFor]
})
export class NotificationSettingsComponent implements OnDestroy {
  public userService = inject(UserService);
  private alertService = inject(AlertService);

  notifList = input<IUserNotificationSetting[]>();

  destroy$ = new Subject<boolean>();

  /**
   * @description Method to set notification setting and to open success alert window on success.
   * @param status - status - checked or unchecked
   * @param id - setting id
   * @param i - index
   */
  onChange(status: number, id: string, i: number) {
    const list = this.notifList();
    if (!list) return;

    list[i].status = !list[i].status;

    this.userService
      .uploadNotifStatus({
        statusId: id,
        status: status ? '0' : '1'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ content: res?.message });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
