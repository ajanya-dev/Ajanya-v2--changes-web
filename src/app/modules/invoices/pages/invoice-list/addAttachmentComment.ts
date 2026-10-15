import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { IDtAttachComntArray } from '../../../data-table/model/datatable';

@Component({
  selector: 'app-dt-attachment',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule,
    CommonFilterIconComponent
  ],
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <span>
        <span>
          <a
            [ngClass]="{
              'text-common-blue-color cursor-pointer': label === 'Mailed',
              'text-black': label !== 'Mailed'
            }"
            role="presentation"
            (click)="getTrackingDetails()"
            >{{ label }}</a
          >
          @if (statusIcon?.comment === 1) {
            <fa-icon
              class="px-2 cursor-pointer text-v4-badge-info-text-color"
              [icon]="['fas', 'comment-plus']"
              matTooltip="View Comments"
              (click)="addComment()"
            >
            </fa-icon>
          }
          @if (statusIcon?.attachment === 1) {
            <fa-icon
              class="px-2 cursor-pointer text-v4-badge-info-text-color"
              [icon]="['fas', 'paperclip']"
              matTooltip="View Attachments"
              (click)="addAttachment()"
            >
            </fa-icon>
          }

          @if (
            params?.data?.is_third_party === 1 &&
            params?.data?.importedFrom !== ''
          ) {
            <fa-icon
              [matTooltip]="params.data.importedFrom"
              class="px-2 cursor-pointer text-v4-badge-info-text-color"
              [icon]="['fas', 'circle-info']"
              (click)="addAttachment()"
            >
            </fa-icon>
          }</span
      ></span>
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class InvoiceAddAttachmentCommentComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);
  private invoiceService = inject(InvoiceService);
  private v3DataTableService = inject(V3DataTableService);

  params: ICellRendererParams;
  attachCommentList: IDtAttachComntArray[] | undefined;
  statusIcon: IDtAttachComntArray | undefined;
  label: string;
  subscriptions: Subscription[] = [];
  importTooltip: string;
  showFilterIcon = false;

  ngOnInit(): void {
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getAttachmentStatus();
    this.importTooltip = this.params.data.importedFrom;

    if (this.params.data.status === 1 && this.params.data.balance > 0) {
      this.label = 'New';
    } else if (this.params.data.status === 2) {
      this.label = 'paid';
    } else if (this.params.data.status === 3) {
      this.label = 'Voided';
    } else if (this.params.data.status === 6) {
      this.label = 'Rejected';
    } else if (
      this.params.data.status === 7 ||
      this.params.data.status === 10 ||
      this.params.data.status === 11 ||
      this.params.data.status === 13 ||
      this.params.data.status === 12 ||
      this.params.data.status === 14 ||
      this.params.data.status === 16 ||
      this.params.data.status === 15 ||
      this.params.data.status === 17
    ) {
      if (this.params.data.is_emailed === 1) {
        this.label = 'Emailed';
      } else if (this.params.data.is_mailed === 1) {
        this.label = 'Mailed';
      } else {
        this.label = 'Imported';
      }
    } else if (this.params.data.balance <= 0) {
      this.label = 'Pay';
    } else if (
      this.params.data.status === 1 &&
      this.params.data.is_mailed === 1
    ) {
      this.label = 'Mailed';
    } else if (
      this.params.data.status === 1 &&
      this.params.data.is_emailed === 1
    ) {
      this.label = 'Emailed';
    }

    if (this.params.data.paid > 0 && this.params.data.status === 1) {
      this.label = 'partially paid';
    }

    if (this.params.data.status === 1 && this.params.data.is_emailed === 1) {
      this.label = 'Emailed';
    }

    if (this.params.data.status === 1 && this.params.data.is_mailed === 1) {
      this.label = 'Mailed';
    }
  }

  /**
   * @description Opens the attachment modal.
   */
  addAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.params.data.action,
        type: 'invoices'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   * @description Opens the comment modal
   */
  addComment() {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.params.data.action,
        type: 'invoices',
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   * @description Get Attachment status.
   */
  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList = res;
        this.statusIcon = this.attachCommentList?.filter(
          (item) => item.id === this.params.data.action
        )[0];
        let actionView;
        if (this.params?.data?.enableTriangle === 1) {
          actionView = {
            bankNotVerified: true
          };
        } else {
          actionView = {
            actionButton: true,
            eyeButton: true
          };
        }

        this.dataTableService.setDataFromParent(
          undefined,
          undefined,
          undefined,
          actionView
        );
      })
    );
  }

  /**
   * @description Get mail tracking details.
   */
  getTrackingDetails() {
    this.invoiceService.invoiceMailTrack(this.params.data.action, 'list');
  }

  onFilterClicked(): void {
    const status = Number(this.params?.data?.status);
    let filter = '';
    if (status === 1) {
      filter = 'Pay';
    } else if (status === 2) {
      filter = 'Paid';
    } else if (status === 3) {
      filter = 'Void';
    } else if (status === 22) {
      filter = 'Emailed';
    } else if (status === 23) {
      filter = 'Mailed';
    } else if (status === 7) {
      filter = 'Imported from QuickBooks';
    } else if (status === 10) {
      filter = 'Imported from Zoho';
    } else if (status === 11) {
      filter = 'Imported from Xero';
    } else if (status === 13) {
      filter = 'Imported from Sage Business';
    } else if (status === 12) {
      filter = 'Imported from FreshBooks';
    } else if (status === 14) {
      filter = 'Imported from Wave';
    } else if (status === 16) {
      filter = 'Imported from NetSuite';
    }
    const cellValue = {
      filter: filter as string,
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
