import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChevronDown, ChevronUp, LucideAngularModule } from 'lucide-angular';
import { DeviceModalV4Component } from 'src/app/modules/deposit-slip/deposit-slip-v4/v4-modals/device-modal-v4/device-modal-v4.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { PdEmptyStateComponent } from 'src/app/shared/V4/pd-empty-state/pd-empty-state.component';

/**
 * Accepts the raw API response from both:
 *  - /checks/{id}/activities  (CHECK flow: id, date, status, activityBy, ipAddress, notes)
 *  - ICashExpenseActivity     (fallback: formattedCreatedAt, userName, status, note, ipAddress)
 */
export interface IActivityEntry {
  id?: string;
  // CHECK flow fields
  date?: string;
  activityBy?: string;
  location?: string;
  notes?: string;
  // Shared fields
  status?: string;
  ipAddress?: string;
  // ICashExpenseActivity fallback fields
  formattedCreatedAt?: string;
  userName?: string;
  note?: string;
}

@Component({
  standalone: true,
  imports: [
    PdEmptyStateComponent,
    PdShowMoreComponent,
    LucideAngularModule,
    PdDateTimeComponent
  ],
  selector: 'app-po-audit-log-list',
  templateUrl: './audit-log-list.component.html',
  styleUrls: ['./audit-log-list.component.scss']
})
export class PoAuditLogListComponent {
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  collapsed = signal(false);
  private dialog = inject(MatDialog);

  logs = input<IActivityEntry[] | null>(null);
  /** Opt-in: renders the icon + title + hint empty state instead of the plain sentence. */
  emptyHint = input('');
  /** Pencil to rename a device next to its IP; off for records whose audit trail never offered it. */
  allowDeviceEdit = input(true);
  maxHeight = input<string | null>('400px');
  /** Embedded flush in a host card: drop our own frame and title header. */
  bare = input(false);
  /** Rows shown before the "Show N more" link. 0 = uncapped (the default). */
  collapsedCount = input<number>(0);
  /** Show every row and drop the link — the expanded panel scrolls instead. */
  forceExpand = input<boolean>(false);

  showAll = signal(false);

  visibleLogs = computed(() => {
    const list = this.logs() ?? [];
    const cap = this.collapsedCount();
    return this.showAll() || this.forceExpand() || !cap
      ? list
      : list.slice(0, cap);
  });

  canShowMore = computed(
    () =>
      !this.forceExpand() &&
      !!this.collapsedCount() &&
      (this.logs()?.length ?? 0) > this.collapsedCount()
  );

  hiddenCount = computed(
    () => (this.logs()?.length ?? 0) - this.collapsedCount()
  );

  closed = output<void>();
  deviceUpdated = output<void>();

  private readonly months: { [key: string]: string } = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12'
  };

  getFormattedDate(dateStr?: string): string {
    if (!dateStr) return '';
    const [datePart, timePart] = dateStr.split(' - ');
    if (!datePart || !timePart) return dateStr;
    const [day, month, year] = datePart.split(' ');
    return `${this.months[month]}-${day.padStart(2, '0')}-${year}`;
  }

  /** Date and time joined for `app-pd-date-time`, which splits them again. */
  getDateTime(dateStr?: string): string {
    const time = this.getFormattedTime(dateStr);
    return time
      ? `${this.getFormattedDate(dateStr)} ${time}`
      : this.getFormattedDate(dateStr);
  }

  getFormattedTime(dateStr?: string): string {
    if (!dateStr) return '';
    const [, timePart] = dateStr.split(' - ');
    if (!timePart) return '';
    return timePart.toUpperCase();
  }

  toggleFold(): void {
    this.collapsed.update((v) => !v);
  }

  editDeviceName(deviceAddress: string): void {
    const dialogRef = this.dialog.open(DeviceModalV4Component, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { deviceAddress }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.deviceUpdated.emit();
      }
    });
  }
}
