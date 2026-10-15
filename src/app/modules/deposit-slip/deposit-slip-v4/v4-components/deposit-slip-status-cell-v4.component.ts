import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

@Component({
  selector: 'app-deposit-slip-status-cell-v4',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonFilterIconComponent
  ],
  template: `
    <div class="flex gap-1 items-center w-full">
      <div class="flex gap-2 items-center">
        @if (this.params.data.status === 0) {
          <span class="status-badge ds-not-verified">Not Verified</span>
        } @else if (this.params.data.status === 1) {
          <span class="status-badge ds-verified">Verified</span>
        } @else if (this.params.data.status === 2) {
          <span class="status-badge ds-voided">Voided</span>
        }

        @if (statusIcon?.attachment === 1) {
          <button class="action-icon-btn" matTooltip="View Attachments" (click)="addAttachment()">
            <lucide-icon name="paperclip" [size]="14" style="color: var(--v4-common-blue-color)"></lucide-icon>
          </button>
        }
        @if (statusIcon?.comment === 1) {
          <button class="action-icon-btn" matTooltip="View Comments" (click)="addComment()">
            <lucide-icon name="message-square" [size]="14" style="color: var(--v4-common-blue-color)"></lucide-icon>
          </button>
        }
      </div>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `,
  styles: [`
    .ds-verified {
      background-color: var(--v4-badge-success-bg-color);
      color: var(--v4-badge-success-text-color);
    }
    .ds-not-verified {
      background-color: var(--v4-badge-warning-bg-color);
      color: var(--v4-badge-warning-text-color);
    }
    .ds-voided {
      background-color: var(--v4-badge-error-bg-color);
      color: var(--v4-badge-error-text-color);
    }
  `]
})
export class DepositSlipStatusCellV4Component
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);

  params!: ICellRendererParams;
  attachCommentList: IDtAttachComntArray[] | undefined;
  statusIcon: IDtAttachComntArray | undefined;
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getAttachmentStatus();
  }

  addAttachment() {
    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.params.data.action,
        type: 'deposit-slips'
      }
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  addComment() {
    const dialogRef = this.dialog.open(V4AddCommentCommonModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.params.data.action,
        type: 'deposit-slips',
        enableDelete: true
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList = res;
        this.statusIcon = this.attachCommentList?.filter(
          (item) => item.id === this.params.data.action
        )[0];
        const actionView = {
          actionButton: true,
          eyeButton: true
        };
        this.dataTableService.setDataFromParent(
          undefined,
          undefined,
          undefined,
          actionView
        );
      })
    );
  }

  onFilterClicked(): void {
    const status = Number(this.params?.data?.status);
    let filter = '';
    if (status === 0) filter = 'Not Verified';
    else if (status === 1) filter = 'Verified';
    else if (status === 2) filter = 'Voided';

    const cellValue = {
      filter: filter as string,
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
