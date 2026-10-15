import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { X, LoaderCircle, LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';

import { ICashExpenseActivity } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';

interface IAuditTrailData {
  id: string;
  slug: string;
  heading: string;
  hideColumns?: string[];
  suffix?: string;
  columns?: { name: string; field: string };
}

@Component({
  selector: 'app-v4-view-audit-trail-modal',
  templateUrl: './v4-view-audit-trail-modal.component.html',
  styleUrls: ['./v4-view-audit-trail-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component]
})
export class V4ViewAuditTrailModalComponent implements OnInit {
  public data: IAuditTrailData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<V4ViewAuditTrailModalComponent>);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly LoaderCircleIcon = LoaderCircle;

  isLoading = signal(false);
  auditTrailInfo = signal<ICashExpenseActivity[]>([]);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.sharedService
      .getAuditTrail(this.data.slug, this.data.id, this.data.suffix)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) this.auditTrailInfo.set(res.data);
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
