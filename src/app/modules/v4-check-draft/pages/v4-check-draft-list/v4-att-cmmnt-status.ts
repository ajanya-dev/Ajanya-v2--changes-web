import {
  Component,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { AddAttachmentModalV4Component } from 'src/app/shared/modal/attachment-modal/add-attachment-modal-v4/add-attachment-modal-v4.component';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

interface IStatusBadgeProps {
  status: string;
  title: string;
  bgColor: string;
  textColor: string;
}

@Component({
  selector: 'app-dt-attachment',
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
      }
    `
  ],
  template: `
    <div class="flex items-center w-full h-full">
      <div class="flex items-center gap-2">
        <span
          class="status-badge"
          [style.background-color]="statusBadge.bgColor"
          [style.color]="statusBadge.textColor"
          [matTooltip]="statusBadge.title ?? ''"
          >{{ statusBadge.status }}</span
        >
        @if (statusIcon()?.attachment === 1) {
          <div class="dt-cell-edit-btn">
            <lucide-icon
              name="paperclip"
              [size]="16"
              matTooltip="View Attachments"
              (click)="addAttachment()"
            />
          </div>
        }
        @if (statusIcon()?.comment === 1) {
          <div class="dt-cell-edit-btn">
            <lucide-icon
              name="message-square"
              [size]="16"
              matTooltip="View Comments"
              (click)="addComment()"
            />
          </div>
        }
      </div>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    CommonFilterIconComponent,
    LucideAngularModule,
    MatTooltip
  ]
})
export class V4CheckDraftAddAttachmentCommentComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);

  params: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  subscriptions: Subscription[] = [];
  statusBadge: IStatusBadgeProps = {
    status: '',
    title: '',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-badge-info-text-color)'
  };

  statusIcon: Signal<IDtAttachComntArray | undefined> = signal(undefined);

  ngOnInit(): void {
    this.getAttachmentStatus();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getAttachmentStatus();
    this.statusBadge = this.getStatusBadge(params.data?.cheque_status);
    this.statusIcon = computed(() => {
      const statusIcon = this.attachCommentList()?.filter(
        (res) => res.id === params.data.action
      )[0];
      return statusIcon;
    });

    if (
      params.data?.received_type === 10 ||
      params.data?.received_type === 11 ||
      params.data?.received_type === 12
    ) {
      const actionView = {
        actionButton: false,
        eyeButton: false
      };
      this.dataTableService.setDataFromParent(
        undefined,
        undefined,
        undefined,
        actionView
      );
    } else {
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
    }
  }

  getStatusBadge(id: number): IStatusBadgeProps {
    switch (id) {
      case 0:
        return {
          status: 'New',
          title: '',
          bgColor: 'var(--v4-badge-accent-bg-color)',
          textColor: 'var(--v4-badge-accent-text-color)'
        };
      case 1:
        return {
          status: 'Printed',
          title: '',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-badge-success-text-color)'
        };
      case 5:
        return {
          status: 'PA',
          title: 'Pending Email Authorization',
          bgColor: 'var(--v4-badge-warning-bg-color)',
          textColor: 'var(--v4-badge-warning-text-color)'
        };
      case 6:
        return {
          status: 'AV',
          title: 'Authorization Form Was Viewed',
          bgColor: 'var(--v4-badge-info-bg-color)',
          textColor: 'var(--v4-badge-info-text-color)'
        };
      case 7:
        return {
          status: 'Approved',
          title: 'Authorization Completed',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-badge-success-text-color)'
        };
      case 8:
        return {
          status: 'Rejected',
          title: 'Authorization Rejected',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        };
      case 10:
        return {
          status: 'DD Initiated',
          title: 'Direct Deposit Initiated',
          bgColor: 'var(--v4-badge-info-bg-color)',
          textColor: 'var(--v4-badge-info-text-color)'
        };
      case 11:
        return {
          status: 'DD Completed',
          title: 'Direct Deposit Completed',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-badge-success-text-color)'
        };
      case 12:
        return {
          status: 'DD Rejected',
          title:
            'Direct Deposit Failed. Click eye button to see details. You may print and deposit.',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        };
      case 13:
        return {
          status: 'DD Returned',
          title: 'Direct Deposit Returned',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        };
      case 15:
        return {
          status: 'Voided',
          title: 'Voided When Payee Bank Account Deleted',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        };
      case 20:
        return {
          status: 'Permission Needed',
          title: 'Recurring Check Draft Permission Needed',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        };
      default:
        return {
          status: '',
          title: '',
          bgColor: 'var(--v4-badge-info-bg-color)',
          textColor: 'var(--v4-badge-info-text-color)'
        };
    }
  }

  addAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalV4Component, {
      maxWidth: '700px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.params.data.action,
        type: 'cheque-drafts'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  addComment() {
    const dialogRef = this.dialog.open(V4AddCommentCommonModalComponent, {
      maxWidth: '700px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.params.data.action,
        type: 'cheque-drafts',
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
        this.attachCommentList.set(res);
      })
    );
  }

  onFilterClicked(): void {
    const status = Number(this.params?.data?.status);
    let filter = '';
    if (status === 0) {
      filter = 'New';
    } else if (status === 1) {
      filter = 'Printed';
    } else if (status === 5) {
      filter = 'PA';
    } else if (status === 7) {
      filter = 'Approved';
    } else if (status === 8) {
      filter = 'Rejected';
    } else if (status === 10) {
      filter = 'DD Initiated';
    } else if (status === 11) {
      filter = 'DD Completed';
    } else if (status === 12) {
      filter = 'DD Rejected';
    } else if (status === 15) {
      filter = 'Void';
    }
    const cellValue = {
      filter: filter as string,
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
