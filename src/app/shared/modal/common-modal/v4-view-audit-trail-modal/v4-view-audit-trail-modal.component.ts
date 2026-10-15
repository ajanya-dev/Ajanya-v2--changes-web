import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule, X, LoaderCircle } from 'lucide-angular';
import { finalize } from 'rxjs';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ICashExpenseActivity } from 'src/app/modules/Cash-Expense/model/CashExpense';

interface IAuditTrailData {
  id: string;
  slug: string;
  heading: string;
  hideColumns?: string[];
  suffix?: string;
  columns?: IColumn[];
}

interface IColumn {
  name: string;
  field: string;
}

@Component({
  selector: 'app-v4-view-audit-trail-modal',
  templateUrl: './v4-view-audit-trail-modal.component.html',
  styleUrls: ['./v4-view-audit-trail-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class ViewAuditTrailModalV4Component implements OnInit {
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);
  public data: IAuditTrailData = inject(MAT_DIALOG_DATA);

  XIcon = X;
  LoaderCircleIcon = LoaderCircle;

  auditTrailInfo: ICashExpenseActivity[] = [];
  isLoading = signal(false);
  columns: IColumn[] = [];

  ngOnInit(): void {
    this.columns = this.data.columns ?? [
      { name: 'Date', field: 'formattedCreatedAt' },
      { name: 'Status', field: 'status' },
      { name: 'By', field: 'userName' },
      { name: 'Device', field: 'ipAddress' },
      { name: 'Notes', field: 'note' }
    ];

    if (this.data.hideColumns) {
      this.data.hideColumns.forEach((field) => {
        const i = this.columns.findIndex((col) => col.field === field);
        if (i > -1) {
          this.columns.splice(i, 1);
        }
      });
    }

    if (this.data.id && this.data.slug) {
      this.getData();
    }
  }

  getData(): void {
    this.isLoading.set(true);
    this.sharedService
      .getAuditTrail(this.data.slug, this.data.id, this.data.suffix)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.auditTrailInfo = res.data;
        }
      });
  }
}
