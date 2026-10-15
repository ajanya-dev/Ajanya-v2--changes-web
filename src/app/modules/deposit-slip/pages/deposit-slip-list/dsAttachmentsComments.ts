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
import { IDtAttachComntArray } from '../../../data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

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
      <div>
        <span>
          <span>
            @if (this.params.data.status === 0) {
              <span>Not Verified</span>
            } @else if (this.params.data.status === 1) {
              Verified
                <span
                  ><fa-icon
                    class="px-05 cursor-pointer !text-common-green-color"
                    [icon]="['fas', 'check']"
                  >
                  </fa-icon
                ></span>
            } @else if (this.params.data.status === 2) {
              <span class="text-common-red-color">Voided</span>
            }

            @if (statusIcon?.attachment === 1) {
              <fa-icon
                class="px-0.5 cursor-pointer !text-common-red-color"
                [icon]="['fas', 'paperclip']"
                matTooltip="View Attachments"
                (click)="addAttachment()"
              >
              </fa-icon>
            }
            @if (statusIcon?.comment === 1) {
              <fa-icon
                class="px-0.5 cursor-pointer !text-common-blue-color"
                [icon]="['fas', 'comment-plus']"
                matTooltip="View Comments"
                (click)="addComment()"
              >
              </fa-icon>
            }</span
        ></span>
      </div>
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class DepositSlipAddAttachmentCommentComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);

  params: ICellRendererParams;
  attachCommentList: IDtAttachComntArray[] | undefined;
  statusIcon: IDtAttachComntArray | undefined;
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
        type: 'deposit-slips'
      }
    });

    dialogRef.afterClosed().subscribe(() => {});
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
        actionView = {
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
    if (status === 0) {
      filter = 'Not Verified';
    } else if (status === 1) {
      filter = 'Verified';
    } else if (status === 2) {
      filter = 'Voided';
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
