import { Component, OnDestroy, inject } from '@angular/core';

import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { Params } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { IDtAttachComntArray } from '../../../data-table/model/datatable';
import { ExpensePaymentProofModalComponent } from '../../modals/expense-payment-proof-modal/expense-payment-proof-modal.component';

interface CashExpenseInterface {
  value: number;
  name: string;
}

@Component({
  selector: 'app-cash-exp-add-attachments-comments',
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <div>
        <span [style.color]="statusColor">{{ statusName }}</span>
        @if (statusIcon?.attachment > 0) {
          <fa-icon
            [icon]="['fas', 'paperclip']"
            class="text-common-blue-color cursor-pointer ml-1"
            (click)="addAttachment()"
          ></fa-icon>
        }
        @if (statusIcon?.comment > 0) {
          <fa-icon
            [icon]="['fas', 'comment']"
            class="text-common-blue-color cursor-pointer ml-1"
            (click)="addComment()"
          ></fa-icon>
        }
        @if (params?.data?.signature_url !== null) {
          <fa-icon
            [icon]="['fas', 'receipt']"
            class="text-common-blue-color cursor-pointer ml-1"
            (click)="addGetSignOnReceipt()"
          ></fa-icon>
        }
      </div>
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  standalone: true,
  imports: [FaIconComponent, CommonFilterIconComponent]
})
export class CashExpenseAddAttachmentsCommentsComponent
  implements ICellRendererAngularComp, OnDestroy
{
  params!: Params;
  attachCommentList: IDtAttachComntArray[] | undefined;
  subscriptions: Subscription[] = [];
  statusName: string;
  statusIcon: { id: string; attachment: number; comment: number };
  statusColor: string;
  showFilterIcon = false;

  cellRendererCashExpenseType = [
    { value: 1, name: 'Expense' },
    { value: 2, name: 'Income' }
  ];

  cashExpenseType: CashExpenseInterface[] = [
    { value: 1, name: 'Expense' },
    { value: 2, name: 'Income' }
  ];

  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;

    this.getAttachmentStatus();

    // HERE THE ACTION COMPONENT HIDE CODE

    //  - - - - - - - - - -

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

  addAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: { id: this.params.data.id, type: 'cash-expenses' }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  addComment() {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.params.data.id,
        type: 'cash-expenses',
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  addGetSignOnReceipt(): void {
    this.dialog.open(ExpensePaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        id: this.params.data.id,
        type:'receipt',
        payee:{email:this.params.data.payee_email,phone:this.params.data.payee_phone}
      }
    });

  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList = res;
        this.statusColor = 'var(--extreme-color)';
        const tparam =
          this.params.data.transaction_type == null
            ? '2'
            : this.params.data.transaction_type;
        this.statusIcon = this.attachCommentList?.filter(
          (response) => response.id === this.params.data.id
        )[0] as IDtAttachComntArray;
        const cashExpenseType = this.cellRendererCashExpenseType.filter(
          (val) => tparam === val.value
        );
        this.statusName = cashExpenseType[0]?.name;
      })
    );
  }

  onFilterClicked(): void {
    const status = Number(this.params?.data?.transaction_type);
    let filter = '';
    if (status === 1) {
      filter = 'Expense';
    } else if (status === 2) {
      filter = 'Income';
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

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
