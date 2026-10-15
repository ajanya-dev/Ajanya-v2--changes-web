import { Component, inject, OnDestroy } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, MessageSquare, Paperclip, Receipt } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { Subscription } from 'rxjs';

import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { CashExpenseSendPaymentProofModalV4Component } from '../../modals/cash-expense-send-payment-proof-modal-v4/cash-expense-send-payment-proof-modal-v4.component';

@Component({
  selector: 'app-cash-expense-type-renderer-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, CommonFilterIconComponent],
  template: `
    <div class="flex items-center gap-1.5 h-full w-full min-w-0">
      @if (typeName) {
        <span [class]="typeClass">{{ typeName }}</span>
      }
      @if (statusIcon?.attachment) {
        <button
          class="action-icon-btn"
          matTooltip="Attachments"
          (click)="openAttachment($event)"
        >
          <lucide-icon [img]="PaperclipIcon" [size]="16" class="v4-action-icon" />
        </button>
      }
      @if (statusIcon?.comment) {
        <button
          class="action-icon-btn"
          matTooltip="Comments"
          (click)="openComment($event)"
        >
          <lucide-icon [img]="MessageSquareIcon" [size]="16" class="v4-action-icon" />
        </button>
      }
      @if (params?.data?.signature_url !== null) {
        <button
          class="action-icon-btn"
          matTooltip="Signed Receipt"
          (click)="openSignedReceipt($event)"
        >
          <lucide-icon [img]="ReceiptIcon" [size]="16" class="v4-action-icon" />
        </button>
      }
      @if (typeName) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class CashExpenseTypeRendererV4Component implements ICellRendererAngularComp, OnDestroy {
  params!: ICellRendererParams;
  typeName = '';
  typeClass = '';
  statusIcon: IDtAttachComntArray | undefined;

  readonly PaperclipIcon = Paperclip;
  readonly MessageSquareIcon = MessageSquare;
  readonly ReceiptIcon = Receipt;

  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private subscriptions: Subscription[] = [];

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.setType(params.data?.transaction_type);
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.statusIcon = res?.find((item) => item.id === String(params.data?.id));
      })
    );
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.setType(params.data?.transaction_type);
    return true;
  }

  private setType(value: number): void {
    if (value === 1) {
      this.typeName = 'Expense';
      this.typeClass =
        'status-badge bg-v4-badge-error-bg-color text-v4-badge-error-text-color';
    } else if (value === 2) {
      this.typeName = 'Income';
      this.typeClass =
        'status-badge bg-v4-badge-success-bg-color text-v4-badge-success-text-color';
    } else {
      this.typeName = '';
      this.typeClass = '';
    }
  }

  openAttachment(event: Event): void {
    event.stopPropagation();
    this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id: this.params.data?.id, type: 'cash-expenses' }
    });
  }

  openComment(event: Event): void {
    event.stopPropagation();
    this.dialog.open(V4CheckAddCommentModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { id: this.params.data?.id, type: 'cash-expenses', enableDelete: true }
    });
  }

  openSignedReceipt(event: Event): void {
    event.stopPropagation();
    this.dialog.open(CashExpenseSendPaymentProofModalV4Component, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        id: this.params.data?.action,
        type: 'receipt',
        payee: {
          email: this.params.data?.payee_email ?? '',
          phone: this.params.data?.payee_phone ?? ''
        }
      }
    });
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.typeName,
      field: this.params.colDef?.headerName as string,
      payee: undefined
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
