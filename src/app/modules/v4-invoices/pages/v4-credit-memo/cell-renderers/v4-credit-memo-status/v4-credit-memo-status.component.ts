import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

export type CreditMemoDetailTab =
  | 'summary'
  | 'payment-details'
  | 'audit-trail'
  | 'comments'
  | 'attachments';

interface IV4CreditMemoStatusParams extends ICellRendererParams {
  onCommentClick: (
    row: ICellRendererParams['data'],
    tab: CreditMemoDetailTab
  ) => void;
  onAttachmentClick: (
    row: ICellRendererParams['data'],
    tab: CreditMemoDetailTab
  ) => void;
}

@Component({
  selector: 'app-v4-credit-memo-status',
  template: `
    <div class="flex gap-1 items-center w-full h-full">
      <span class="flex gap-1 items-center">
        @if (label) {
          <span
            class="status-badge {{ badgeBgClass }} {{ badgeTextClass }}"
            [matTooltip]="title"
            >{{ label }}</span
          >
        }
        @if (statusIcon?.comment === 1) {
          <div class="dt-cell-edit-btn">
            <lucide-angular
              name="message-square"
              [size]="16"
              matTooltip="View Comments"
              (click)="onCommentClick()"
            />
          </div>
        }
        @if (statusIcon?.attachment === 1) {
          <div class="dt-cell-edit-btn">
            <lucide-angular
              name="paperclip"
              [size]="16"
              matTooltip="View Attachments"
              (click)="onAttachmentClick()"
            />
          </div>
        }
      </span>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `,
  standalone: true,
  imports: [LucideAngularModule, MatTooltip, CommonFilterIconComponent]
})
export class V4CreditMemoStatusComponent
  implements ICellRendererAngularComp, OnInit
{
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  private params!: IV4CreditMemoStatusParams;
  statusIcon: IDtAttachComntArray | undefined;
  label = '';
  title = '';
  badgeBgClass = 'bg-v4-badge-neutral-bg-color';
  badgeTextClass = 'text-v4-badge-neutral-text-color';

  ngOnInit(): void {
    this.getAttachmentStatus();
  }

  agInit(params: IV4CreditMemoStatusParams): void {
    this.params = params;
    this.setLabel(params.data);
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
  }

  private setLabel(data: ICellRendererParams['data']): void {
    if (data.status === 1 && data.balance === data.amount) {
      this.label = 'New';
    } else if (data.status === 2) {
      this.label = 'Marked As Reconciled';
    } else if (data.status === 3) {
      this.label = 'Voided';
    } else if (data.balance !== data.amount && data.status !== 5) {
      this.label = 'Partially Paid';
    } else if (data.status === 5) {
      this.label = 'Completed';
    }
    this.title = this.label;
    this.setBadgeClasses();
  }

  private setBadgeClasses(): void {
    const badgeMap: Record<string, { bg: string; text: string }> = {
      New: {
        bg: 'bg-v4-badge-info-bg-color',
        text: 'text-v4-badge-info-text-color'
      },
      'Marked As Reconciled': {
        bg: 'bg-v4-badge-success-bg-color',
        text: 'text-v4-badge-success-text-color'
      },
      Completed: {
        bg: 'bg-v4-badge-success-bg-color',
        text: 'text-v4-badge-success-text-color'
      },
      'Partially Paid': {
        bg: 'bg-v4-badge-warning-bg-color',
        text: 'text-v4-badge-warning-text-color'
      },
      Voided: {
        bg: 'bg-v4-badge-error-bg-color',
        text: 'text-v4-badge-error-text-color'
      }
    };
    const config = badgeMap[this.label];
    this.badgeBgClass = config?.bg ?? 'bg-v4-badge-neutral-bg-color';
    this.badgeTextClass = config?.text ?? 'text-v4-badge-neutral-text-color';
  }

  onCommentClick(): void {
    this.params.onCommentClick?.(this.params.data, 'comments');
  }

  onAttachmentClick(): void {
    this.params.onAttachmentClick?.(this.params.data, 'attachments');
  }

  private getAttachmentStatus(): void {
    this.dataTableService
      .getAttachmentCommentStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.statusIcon = res?.find(
          (el) => el.id === this.params?.data?.action
        );
      });
  }

  onFilterClicked(): void {
    let filterValue = this.label;
    if (this.label === 'Voided') filterValue = 'Void';
    else if (this.label === 'Marked As Reconciled')
      filterValue = 'Mark As Completed';
    if (this.params) {
      this.dataTableService.selectedCellValueSignal.set({
        filter: filterValue,
        field: this.params.colDef?.headerName as string,
        payee: undefined
      });
    }
  }

}
