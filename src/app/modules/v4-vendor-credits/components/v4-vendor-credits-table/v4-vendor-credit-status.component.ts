import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { AddAttachmentModalV4Component } from 'src/app/shared/modal/attachment-modal/add-attachment-modal-v4/add-attachment-modal-v4.component';

interface IStatusConfig {
  name: string;
  bgClass: string;
  textColor: string;
}

const STATUS_MAP: Record<number, IStatusConfig> = {
  1: {
    name: 'New',
    bgClass: 'bg-v4-badge-info-bg-color',
    textColor: 'var(--v4-badge-info-text-color)'
  },
  2: {
    name: 'Completed',
    bgClass: 'bg-v4-badge-success-bg-color',
    textColor: 'var(--v4-badge-success-text-color)'
  },
  3: {
    name: 'Void',
    bgClass: 'bg-v4-badge-error-bg-color',
    textColor: 'var(--v4-badge-error-text-color)'
  },
  4: {
    name: 'Partially Paid',
    bgClass: 'bg-v4-badge-warning-bg-color',
    textColor: 'var(--v4-badge-warning-text-color)'
  },
  5: {
    name: 'Reconciled',
    bgClass: 'bg-v4-badge-accent-bg-color',
    textColor: 'var(--v4-badge-accent-text-color)'
  }
};

@Component({
  selector: 'app-v4-vendor-credit-status',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltip],
  template: `
    <div class="flex items-center gap-1.5">
      <span
        class="status-badge"
        [class]="statusConfig().bgClass"
        [style.color]="statusConfig().textColor"
      >
        {{ statusConfig().name }}
      </span>

      @if (statusIcon()?.comment === 1) {
        <div class="dt-cell-edit-btn">
          <lucide-icon
            name="message-square"
            [size]="16"
            matTooltip="View Comments"
            (click)="openCommentModal($event)"
          ></lucide-icon>
        </div>
      }

      @if (statusIcon()?.attachment === 1) {
        <div class="dt-cell-edit-btn">
          <lucide-icon
            name="paperclip"
            [size]="16"
            matTooltip="View Attachments"
            (click)="openAttachmentModal($event)"
          ></lucide-icon>
        </div>
      }
    </div>
  `
})
export class V4VendorCreditStatusComponent implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  private params: ICellRendererParams;
  private attachCommentList = signal<IDtAttachComntArray[] | undefined>(
    undefined
  );

  statusConfig = computed<IStatusConfig>(() => {
    const status = this.params?.data?.status as number;
    return (
      STATUS_MAP[status] ?? {
        name: 'Unknown',
        bgClass: 'bg-v4-badge-neutral-bg-color',
        textColor: 'var(--v4-badge-neutral-text-color)'
      }
    );
  });

  statusIcon = computed(() =>
    this.attachCommentList()?.find(
      (res) => res.id === this.params?.data?.action
    )
  );

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.dataTableService
      .getAttachmentCommentStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.attachCommentList.set(res);
      });
  }

  refresh(): boolean {
    return true;
  }

  openCommentModal(event: Event): void {
    event.stopPropagation();
    const id = this.params?.data?.action;
    if (!id) return;

    this.dialog.open(V4AddCommentCommonModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'vendor-credits' }
    });
  }

  openAttachmentModal(event: Event): void {
    event.stopPropagation();
    const id = this.params?.data?.action;
    if (!id) return;

    this.dialog.open(AddAttachmentModalV4Component, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'vendor-credits' }
    });
  }
}
