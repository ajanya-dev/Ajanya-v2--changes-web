import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  output,
  signal,
  SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass, SlicePipe, TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import {
  IActivityExportPayload,
  IActivityTypeDetails,
  IActivityTypeResponse,
  IUserActivity,
  IUserRoute,
  IUsersList,
  UserActivityTypes
} from 'src/app/models/user';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { UserActivityModalV4Component } from '../../v4-modals/user-activity-modal-v4/user-activity-modal-v4.component';

export interface ICategoryConfig {
  type: UserActivityTypes;
  name: string;
  icon: string;
  bgClass: string;
  iconClass: string;
}

@Component({
  selector: 'app-user-activity-v4',
  templateUrl: './user-activity-v4.component.html',
  styleUrls: ['./user-activity-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    TitleCasePipe,
    SlicePipe,
    LucideAngularModule,
    MatTooltip,
    MatMenuModule,
    CommonButtonV4Component,
    DateRangeComponent
  ]
})
export class UserActivityV4Component implements OnChanges {
  private datePipe = inject(DatePipe);
  private userService = inject(UserManagementService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  @Input() selectedUser: IUsersList;

  resendEvent = output<void>();
  approveEvent = output<void>();
  deleteEvent = output<void>();

  /** Category configurations mapping activity types to icons and colors */
  categoryConfigs: ICategoryConfig[] = [
    {
      type: 'Check',
      name: 'Check Payments',
      icon: 'file-text',
      bgClass: 'bg-v4-badge-success-bg-color',
      iconClass: 'text-v4-badge-success-text-color'
    },
    {
      type: 'ACH',
      name: 'ACH Transactions',
      icon: 'building-2',
      bgClass: 'bg-v4-badge-info-bg-color',
      iconClass: 'text-v4-badge-sky-text-color'
    },
    {
      type: 'Wire',
      name: 'Wire Transfers',
      icon: 'repeat',
      bgClass: 'bg-v4-badge-warning-bg-color',
      iconClass: 'text-v4-badge-warning-text-color'
    },
    {
      type: 'Virtual Card',
      name: 'Card Transactions',
      icon: 'credit-card',
      bgClass: 'bg-v4-badge-sky-bg-color',
      iconClass: 'text-v4-badge-sky-text-color'
    },
    {
      type: 'Check Mail',
      name: 'Check Mail',
      icon: 'mail',
      bgClass: 'bg-v4-badge-info-bg-color',
      iconClass: 'text-v4-badge-info-text-color'
    },
    {
      type: 'Direct deposit',
      name: 'Direct Deposits',
      icon: 'arrow-down-to-line',
      bgClass: 'bg-v4-badge-info-bg-color',
      iconClass: 'text-v4-badge-info-text-color'
    },
    {
      type: 'Bill',
      name: 'Bill Management',
      icon: 'receipt',
      bgClass: 'bg-v4-badge-warning-bg-color',
      iconClass: 'text-v4-badge-warning-text-color'
    },
    {
      type: 'Cash Expense',
      name: 'Cash Expenses',
      icon: 'banknote',
      bgClass: 'bg-v4-badge-success-bg-color',
      iconClass: 'text-v4-badge-success-text-color'
    },
    {
      type: 'Deposit Slip',
      name: 'Deposit Slips',
      icon: 'file-check',
      bgClass: 'bg-v4-badge-success-bg-color',
      iconClass: 'text-v4-badge-success-text-color'
    },
    {
      type: 'Received Checklist',
      name: 'Received Checklist',
      icon: 'shield',
      bgClass: 'bg-v4-badge-error-bg-color',
      iconClass: 'text-v4-badge-error-text-color'
    },
    {
      type: 'Invoice',
      name: 'Invoices',
      icon: 'file-text',
      bgClass: 'bg-v4-badge-accent-bg-color',
      iconClass: 'text-v4-badge-accent-text-color'
    },
    {
      type: 'Wallet',
      name: 'Wallet Activities',
      icon: 'wallet',
      bgClass: 'bg-v4-badge-accent-bg-color',
      iconClass: 'text-v4-badge-accent-text-color'
    },
    {
      type: 'Bank Account',
      name: 'Bank Accounts',
      icon: 'landmark',
      bgClass: 'bg-v4-badge-info-bg-color',
      iconClass: 'text-v4-badge-info-text-color'
    }
  ];

  activityDetails: IUserActivity;
  datewiseActivities: IUserActivity;
  dateWiseActivityDetails: IUserRoute[] = [];
  availableTypes: UserActivityTypes[] = [];
  displayStatus: 'waiting' | 'no_data' | 'empty' | null;
  isActivityLoaded = false;
  filterAndExportLoading = signal(false);
  fromDate: string;
  toDate: string;

  // Summary stats
  totalActivities = 0;
  financialCount = 0;
  securityCount = 0;

  private financialTypes: UserActivityTypes[] = [
    'Check',
    'ACH',
    'Wire',
    'Bill',
    'Cash Expense',
    'Deposit Slip',
    'Invoice',
    'Wallet',
    'Check Mail',
    'Virtual Card',
    'Direct deposit'
  ];

  private securityTypes: UserActivityTypes[] = ['Received Checklist'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedUser && this.selectedUser?.client_id) {
      this.loadUserActivity();
      this.loadUserDateWiseActivity();
    }
  }

  loadUserActivity(): void {
    this.isActivityLoaded = false;
    this.userService
      .getAuditTrail(this.selectedUser.client_id)
      .pipe(
        finalize(() => {
          this.isActivityLoaded = true;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.activityDetails = { ...res.data };

          if (this.activityDetails.activities) {
            const reversedTypes = [
              'ACH',
              'Wire',
              'Check Mail',
              'Virtual Card'
            ] as const satisfies UserActivityTypes[];
            reversedTypes.forEach((type) => {
              const items = this.getActivityData(type);
              if (items.length) {
                const reversed = [...items].reverse();
                const entry = this.activityDetails.activities[type];
                if (this.isActivityTypeResponse(entry)) {
                  entry.data = reversed;
                } else {
                  this.activityDetails.activities[type] = reversed;
                }
              }
            });
            this.availableTypes = Object.keys(
              this.activityDetails.activities
            ) as UserActivityTypes[];
          }
          this.computeSummaryStats();
          this.getDisplayStatus();
        }
      });
  }

  private computeSummaryStats(): void {
    const counts = this.activityDetails?.created_counts;
    if (!counts) {
      this.totalActivities = 0;
      this.financialCount = 0;
      this.securityCount = 0;
      return;
    }
    this.totalActivities = this.activityDetails.total_created || 0;
    this.financialCount = this.financialTypes.reduce(
      (sum, type) => sum + (counts[type] || 0),
      0
    );
    this.securityCount = this.securityTypes.reduce(
      (sum, type) => sum + (counts[type] || 0),
      0
    );
  }

  loadUserDateWiseActivity(): void {
    this.userService
      .userDatewiseActivities(this.selectedUser.client_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.datewiseActivities = res.data.activities;
          this.dateWiseActivityDetails = Object.values(
            this.datewiseActivities ?? ''
          );
          this.dateWiseActivityDetails.forEach((item, index) => {
            this.dateWiseActivityDetails[index].styleClass =
              item.status || 'printed';
          });
        }
      });
  }

  getDisplayStatus(): void {
    if (this.selectedUser.status === 0 || this.selectedUser.status === 3) {
      this.displayStatus = 'waiting';
      return;
    }
    if (
      !this.activityDetails?.activities ||
      this.availableTypes.length === 0 ||
      this.totalActivities === 0
    ) {
      this.displayStatus = 'no_data';
    } else {
      this.displayStatus = null;
    }
  }

  /** Type guard for IActivityTypeResponse */
  private isActivityTypeResponse(
    entry: IActivityTypeResponse | IActivityTypeDetails[]
  ): entry is IActivityTypeResponse {
    return entry && !Array.isArray(entry) && 'data' in entry;
  }

  /** Extract the data array from either response shape */
  getActivityData(type: UserActivityTypes): IActivityTypeDetails[] {
    const entry = this.activityDetails?.activities?.[type];
    if (!entry) return [];
    if (this.isActivityTypeResponse(entry)) return entry.data || [];
    return entry;
  }

  /** Get categories that have activities */
  getActiveCategories(): ICategoryConfig[] {
    if (!this.activityDetails?.activities) return [];
    return this.categoryConfigs.filter(
      (cat) => this.getActivityData(cat.type).length > 0
    );
  }

  /** Get activity count for a category — uses pagination.total when available
   *  so the displayed count reflects all activities on the server, not just the
   *  current page of data. Falls back to the loaded array length if the entry
   *  is a bare array (no pagination wrapper).
   */
  getCategoryCount(type: UserActivityTypes): number {
    const entry = this.activityDetails?.activities?.[type];
    if (!entry) return 0;
    if (this.isActivityTypeResponse(entry)) {
      return entry.pagination?.total ?? entry.data?.length ?? 0;
    }
    return entry.length;
  }

  /** Get status dot color class */
  getStatusDotClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'created':
      case 'completed':
      case 'printed':
      case 'imported':
        return 'bg-v4-badge-success-text-color';
      case 'pending':
        return 'bg-v4-badge-warning-text-color';
      case 'deleted':
      case 'failed':
        return 'bg-v4-badge-error-text-color';
      default:
        return 'bg-v4-badge-success-text-color';
    }
  }

  openActivityModal(category?: UserActivityTypes): void {
    this.dialog.open(UserActivityModalV4Component, {
      maxWidth: '1250px',
      width: '95%',
      maxHeight: '95vh',
      autoFocus: false,
      data: {
        activityDetails: this.activityDetails,
        userName: this.activityDetails?.name || '',
        clientId: this.selectedUser.client_id,
        selectedCategory: category
      },
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  filterAndExportDateChange(event: { start: string; end: string }) {
    this.fromDate = event.start;
    this.toDate = event.end;
  }

  exportFile(fileType: string) {
    this.filterAndExportLoading.set(true);
    const formattedFromDate = this.datePipe.transform(
      this.fromDate,
      'yyyy-MM-dd'
    );
    const formattedToDate = this.datePipe.transform(this.toDate, 'yyyy-MM-dd');
    const payload: IActivityExportPayload = {
      type: fileType,
      export_type: 'All',
      fromDate: formattedFromDate as string,
      toDate: formattedToDate as string
    };

    this.userService
      .exportUserActivity(this.selectedUser.client_id, payload)
      .pipe(
        finalize(() => this.filterAndExportLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data.url, '_blank');
        }
      });
  }
}
