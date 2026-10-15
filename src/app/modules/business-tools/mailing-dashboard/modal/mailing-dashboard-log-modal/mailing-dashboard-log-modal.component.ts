import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { GroupMailingService } from '../../services/group-mailing.service';
import { IGroupMailingLogsActivity } from '../../models/group-mailing.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

interface IMailingLogModalData {
  batchId: string;
  batchName?: string;
}

/**
 * @description Modal component for viewing mailing dashboard activity logs
 */
@Component({
  selector: 'app-mailing-dashboard-log-modal',
  templateUrl: './mailing-dashboard-log-modal.component.html',
  styleUrls: ['./mailing-dashboard-log-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, CommonModule, FaIconComponent,]
})
export class MailingDashboardLogModalComponent implements OnInit {
  private groupMailingService = inject(GroupMailingService);
  private destroyRef = inject(DestroyRef);
  private data = inject(MAT_DIALOG_DATA) as IMailingLogModalData;

  activityLogs: IGroupMailingLogsActivity[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadActivityLogs();
  }

  loadActivityLogs(): void {
    this.loading = true;
    this.groupMailingService
      .getBatchLogs(this.data.batchId)
      .pipe(
        finalize(() => this.loading = false),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.activityLogs = res.data?.activities || [];
          }
        },
      }); 
  }

}
