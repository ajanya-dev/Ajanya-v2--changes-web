import { ICellRendererParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
  signal,
  OnDestroy
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, finalize } from 'rxjs';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtAttachComntArray } from '../../data-table/model/datatable';
import { PayrollService } from '../../payroll-by-card/services/payroll.service';

@Component({
  standalone: true,
  selector: 'app-payroll-run-code-v4',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltip],
  template: `<div class="flex items-center gap-1 min-w-0">
    <span>{{ runCode }}</span>
    @if (isAttachmentsPresents()) {
      <button
        type="button"
        class="action-icon-btn"
        matTooltip="Payroll Summary"
        (click)="openAttachment()"
      >
        <lucide-icon name="file-text" [size]="16"></lucide-icon>
      </button>
    }
  </div>`
})
export class PayrollRunCodeV4Component implements OnDestroy {
  private dataTableService = inject(DataTableService);
  private payrollService = inject(PayrollService);

  runCode: string = '';
  id: string;
  isAttachmentLoading = false;
  isAttachmentsPresents: Signal<IDtAttachComntArray | undefined>;
  subscriptions: Subscription[] = [];
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);

  agInit(params: ICellRendererParams) {
    if (params.data) {
      this.runCode = params.data.payroll_run_code;
      this.id = params.data.id;
    }
    this.getAttachmentStatus();
    this.isAttachmentsPresents = computed(() => {
      const isAttachmentsPresents = this.attachCommentList()?.filter(
        (res) => res.id === params.data.id
      )[0];
      return isAttachmentsPresents;
    });
  }

  openAttachment() {
    if (this.isAttachmentLoading) {
      return;
    }
    this.isAttachmentLoading = true;
    this.subscriptions.push(
      this.payrollService
        .getAttachment(this.id)
        .pipe(
          finalize(() => {
            this.isAttachmentLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            window.open(res.data, '_blank');
          }
        })
    );
  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList.set(res);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
