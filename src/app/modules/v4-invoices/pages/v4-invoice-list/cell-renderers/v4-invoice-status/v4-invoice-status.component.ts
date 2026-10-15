import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { IInvoiceRowData } from 'src/app/modules/invoices/model/invoice';
import { InvoiceDetailTab } from '../../v4-invoice-detail-panel/v4-invoice-detail-panel.component';

interface IV4InvoiceStatusParams extends ICellRendererParams {
  onCommentClick: (row: IInvoiceRowData, tab: InvoiceDetailTab) => void;
  onAttachmentClick: (row: IInvoiceRowData, tab: InvoiceDetailTab) => void;
}

@Component({
  selector: 'app-v4-invoice-status',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonFilterIconComponent
  ],
  template: `
    <div class="flex gap-1 items-center w-full h-full">
      <span class="flex gap-1 items-center">
        <span
          role="button"
          tabindex="0"
          class="status-badge status-badge--clickable {{ badgeBgClass }} {{
            badgeTextClass
          }}"
          (click)="getTrackingDetails()"
          (keydown.enter)="getTrackingDetails()"
          >{{ label }}</span
        >
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
        @if (
          params?.data?.is_third_party === 1 &&
          params?.data?.importedFrom !== ''
        ) {
          <div class="dt-cell-edit-btn no-hover">
            <lucide-angular
              name="info"
              [size]="16"
              [matTooltip]="params.data.importedFrom"
            />
          </div>
        }
      </span>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `
})
export class V4InvoiceStatusComponent
  implements ICellRendererAngularComp, OnInit
{
  private dataTableService = inject(DataTableService);
  private invoiceService = inject(InvoiceService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  params!: IV4InvoiceStatusParams;
  attachCommentList: IDtAttachComntArray[] | undefined;
  statusIcon: IDtAttachComntArray | undefined;
  label = '';
  badgeBgClass = 'bg-v4-badge-neutral-bg-color';
  badgeTextClass = 'text-v4-badge-neutral-text-color';

  ngOnInit(): void {
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
  }

  agInit(params: IV4InvoiceStatusParams): void {
    this.params = params;
    this.setLabel(params.data);
    this.getAttachmentStatus();
  }

  private setLabel(data: ICellRendererParams['data']): void {
    if (data.status === 1 && data.balance > 0) {
      this.label = 'New';
    } else if (data.status === 2) {
      this.label = 'Paid';
    } else if (data.status === 3) {
      this.label = 'Voided';
    } else if (data.status === 6) {
      this.label = 'Rejected';
    } else if ([7, 10, 11, 12, 13, 14, 15, 16, 17].includes(data.status)) {
      if (data.is_emailed === 1) this.label = 'Emailed';
      else if (data.is_mailed === 1) this.label = 'Mailed';
      else this.label = 'Imported';
    } else if (data.balance <= 0) {
      this.label = 'Pay';
    }

    if (data.paid > 0 && data.status === 1) this.label = 'Partially Paid';
    if (data.status === 1 && data.is_emailed === 1) this.label = 'Emailed';
    if (data.status === 1 && data.is_mailed === 1) this.label = 'Mailed';

    this.setBadgeClasses();
  }

  private setBadgeClasses(): void {
    const badgeMap: Record<string, { bg: string; text: string }> = {
      New: {
        bg: 'bg-v4-badge-info-bg-color',
        text: 'text-v4-badge-info-text-color'
      },
      Paid: {
        bg: 'bg-v4-badge-success-bg-color',
        text: 'text-v4-badge-success-text-color'
      },
      Pay: {
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
      },
      Rejected: {
        bg: 'bg-v4-badge-error-bg-color',
        text: 'text-v4-badge-error-text-color'
      },
      Emailed: {
        bg: 'bg-v4-badge-sky-bg-color',
        text: 'text-v4-badge-sky-text-color'
      },
      Mailed: {
        bg: 'bg-v4-badge-sky-bg-color',
        text: 'text-v4-badge-sky-text-color'
      },
      Imported: {
        bg: 'bg-v4-badge-neutral-bg-color',
        text: 'text-v4-badge-neutral-text-color'
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

  getTrackingDetails(): void {
    this.invoiceService.invoiceMailTrack(this.params.data.action, 'list');
  }

  private getAttachmentStatus(): void {
    this.dataTableService
      .getAttachmentCommentStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.attachCommentList = res;
        this.statusIcon = res?.find(
          (item) => item.id === this.params?.data?.action
        );

        const actionView =
          this.params?.data?.enableTriangle === 1
            ? { bankNotVerified: true }
            : { actionButton: true, eyeButton: true };
        this.dataTableService.setDataFromParent(
          undefined,
          undefined,
          undefined,
          actionView
        );
      });
  }

  onFilterClicked(): void {
    const status = Number(this.params?.data?.status);
    const filterMap: Record<number, string> = {
      1: 'Pay',
      2: 'Paid',
      3: 'Void',
      22: 'Emailed',
      23: 'Mailed',
      7: 'Imported From QuickBooks',
      10: 'Imported From Zoho',
      11: 'Imported From Xero',
      13: 'Imported From Sage Business',
      12: 'Imported From FreshBooks',
      14: 'Imported From Wave',
      16: 'Imported From NetSuite'
    };
    this.dataTableService.selectedCellValueSignal.set({
      filter: filterMap[status] ?? '',
      field: this.params?.colDef?.headerName as string
    });
    this.v3DataTableService.gridApi.deselectAll();
  }

}
