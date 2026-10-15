import { Component, OnDestroy, inject, input, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { LucideAngularModule, Save, Loader } from 'lucide-angular';
import { IUserNotificationSetting } from '../../../user/model/user';

@Component({
  selector: 'app-v4-notification-settings',
  templateUrl: './v4-notification-settings.component.html',
  styleUrls: ['./v4-notification-settings.component.scss'],
  standalone: true,
  imports: [LucideAngularModule]
})
export class V4NotificationSettingsComponent implements OnDestroy {
  public userService = inject(UserService);
  private alertService = inject(V4AlertService);

  readonly SaveIcon = Save;
  readonly LoaderIcon = Loader;

  notifList = input<IUserNotificationSetting[]>();
  loading = signal(false);
  pendingIndices = signal(new Set<number>());

  destroy$ = new Subject<boolean>();

  onToggleClick(event: Event, status: number, id: string, i: number) {
    event.preventDefault();
    if (this.pendingIndices().has(i)) return;

    const list = this.notifList();
    if (!list) return;

    this.pendingIndices.update((s) => {
      const next = new Set(s);
      next.add(i);
      return next;
    });

    this.userService
      .uploadNotifStatus({
        statusId: id,
        status: status ? '0' : '1'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({ content: res?.message });
            list[i].status = !list[i].status;
          }
          this.pendingIndices.update((s) => {
            const next = new Set(s);
            next.delete(i);
            return next;
          });
        },
        error: () => {
          this.pendingIndices.update((s) => {
            const next = new Set(s);
            next.delete(i);
            return next;
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
