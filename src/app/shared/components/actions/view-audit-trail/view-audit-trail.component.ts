import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ICashExpenseActivity } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

interface IColumn {
  name: string;
  field: string;
}

/**
 * @description Component to view audit trail. Audit trail is a documentary evidence of the sequence of activities used in checks and bills etc.
 */
@Component({
  standalone: true,
  imports: [CommonModule,FaIconComponent,NgOptimizedImage],
  selector: 'app-view-audit-trail',
  templateUrl: './view-audit-trail.component.html',
  styleUrls: ['./view-audit-trail.component.scss']
})
export class ViewAuditTrailComponent implements OnInit, OnDestroy {
  private sharedService = inject(SharedService);

  @Input() slug: string;
  @Input() id: string;
  @Input() hideColumns: string[] | undefined;
  @Input() suffix: string;
  @Input() columns: IColumn[];

  auditTrailInfo: ICashExpenseActivity[] = [];
  isLoading = signal(false);
  destroy$ = new Subject();
  faSpinner = faSpinner;
  
  ngOnInit(): void {
    if (!this.columns) {
      this.columns = [
        { name: 'Date', field: 'formattedCreatedAt' },
        { name: 'Status', field: 'status' },
        { name: 'By', field: 'userName' },
        { name: 'Device', field: 'ipAddress' },
        { name: 'Notes', field: 'note' }
      ];
    }
    if (this.id && this.slug) {
      this.getData();
    }
    if (this.hideColumns) {
      this.hideColumns.forEach((field) => {
        const i = this.columns.findIndex((col) => col.field === field);
        if (i > -1) {
          this.columns.splice(i, 1);
        }
      });
    }
  }

  /**
   * @description Gets the audit trail data.
   */
  getData() {
    this.isLoading.set(true);
    this.sharedService.getAuditTrail(this.slug, this.id, this.suffix)
    .pipe(finalize(() => this.isLoading.set(false)),takeUntil(this.destroy$))
    .subscribe((res) => {
      if(res?.success){
        this.auditTrailInfo = res.data;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

