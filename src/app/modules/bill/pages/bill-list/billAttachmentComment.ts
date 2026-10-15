import {
  Component,
  OnDestroy,
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
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { NgStyle, NgClass } from '@angular/common';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { BillPaymentService } from '../../services/bill-payment.service';

interface IStatusName {
  value: string | number;
  style: { color?: string; cursor?: string };
}
@Component({
  selector: 'app-dt-attachment',
  template: `
    <div
      class="wrapper"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      @if (!specialBlockValues.includes(params.value)) {
        <ng-container>
          @if (statusName.value === 'Pay') {
            <app-common-button-v35
              type="list"
              text="Pay"
              textColorInput="white"
              (clickEvent)="pay()"
            >
            </app-common-button-v35>
            @if (params?.data?.bill_status === '16') {
              <span matTooltip="Saved payments" class="pl-1.5">
                <fa-icon [icon]="['fas', 'circle-info']"></fa-icon>
              </span>
            }
          } @else {
            <span
              title="{{ statusName.value }}"
              [ngStyle]="statusName.style"
              class="ellipsis"
            >
              {{ statusName.value }}
            </span>
          }
        </ng-container>
      } @else {
        @if (params?.value === '') {
          <a
            role="presentation"
            title="Approve this bill"
            (click)="approve()"
            style="color: var(--brand-color-lite); cursor:pointer"
          >
            Approve </a
          >/
          <a
            role="presentation"
            title="Reject this bill"
            (click)="reject()"
            style="color:var(--text_danger_lite); cursor:pointer"
          >
            Reject
          </a>
        } @else {
          @if (params?.value === 'Imported') {
            <span style="color: var(--primary-color-lite);" class="mr-2"> Imported </span>
            <app-common-button-v35
              type="list"
              text="Pay"
              textColorInput="white"
              (clickEvent)="pay()"
            >
            </app-common-button-v35>
            @if (
              (params?.data?.is_third_party === 1 ||
                params?.data?.is_third_party === 2) &&
              params?.data?.importedFrom !== ''
            ) {
              <span [matTooltip]="importTooltip" class="pl-1.5">
                <fa-icon [icon]="['fas', 'circle-info']"></fa-icon>
              </span>
            }
          } @else {
            <span
              role="presentation"
              (click)="pay()"
              style="cursor:pointer;"
              title="Received bill"
            >
              <span style="color: var(--alert_warning_text);">Pay Now</span>
              <span style="color: var(--brand-color-lite);">(Received)</span>
            </span>
          }
        }
      }
      @if (statusIcon()?.comment === 1) {
        <fa-icon
          class="comment"
          title="Comments"
          (click)="addComment()"
          [icon]="['far', 'message-dots']"
        >
        </fa-icon>
      }
      @if (statusIcon()?.attachment === 1) {
        <fa-icon
          class="attachment"
          title="Attachments"
          (click)="addAttachment()"
          [icon]="['far', 'paperclip']"
        >
        </fa-icon>
      }

      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  styles: [
    `
      .wrapper {
        display: flex;
        align-items: center;
      }

      .ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .comment {
        color: #1754ff;
        font-size: 14px;
        margin-left: 5px;
        cursor: pointer;
      }

      .attachment {
        color: #fb084b;
        font-size: 14px;
        margin-left: 5px;
        cursor: pointer;
      }
      i {
        font-weight: 600;
        font-size: 13px;
        color: #79797b;
        margin-left: 4px;
      }
      .disable {
        opacity: 0.6;
        pointer-events: none !important;
        cursor: no-drop;
        color: #79797b;
      }
    `
  ],
  standalone: true,
  imports: [
    NgStyle,
    NgClass,
    MatTooltip,
    FaIconComponent,
    FontAwesomeModule,
    CommonFilterIconComponent,
    CommonButtonV35Component
  ]
})
export class BillAttachmentCommentComponent
  implements ICellRendererAngularComp, OnDestroy
{
  private dataTableService = inject(DataTableService);
  dialog = inject(MatDialog);
  private billService = inject(BillService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private billPaymentService = inject(BillPaymentService);

  params: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  subscriptions: Subscription[] = [];
  statusName: IStatusName;
  showFilterIcon = false;

  statusIcon: Signal<IDtAttachComntArray | undefined>;
  attachmentStyle = {
    color: '#fb084b',
    'font-size': '17px',
    'margin-left': '2px',
    'text-decoration': 'none',
    cursor: 'pointer'
  };

  commentStyle = {
    color: '#1754ff',
    'font-size': '15px',
    'margin-left': '4px',
    'text-decoration': 'none',
    cursor: 'pointer'
  };

  specialBlockValues = ['', 'Accepted', 'Imported'] as const;
  importTooltip: string;

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.statusName = this.getValue(this.params.value);
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.importTooltip = this.params.data.importedFrom;
    this.getAttachmentStatus();
    this.statusName = this.getValue(this.params.value);
    this.statusIcon = computed(() => {
      const statusIcon = this.attachCommentList()?.filter(
        (res) => res.id === params.data.action
      )[0];
      return statusIcon;
    });
  }

  getValue(value: string | number): IStatusName {
    if (value === 'Pay')
      return {
        value,
        style: { color: 'var(--ocw-btn-dark-blue)', cursor: 'pointer' }
      };
    if (value === 'Paid')
      return { value, style: { color: 'var(--brand-color-lite)' } };
    if (value === 'Voided')
      return { value, style: { color: 'var(--text_danger_lite)' } };
    if (value === '') return { value, style: {} };
    if (value === 'Accepted') return { value: 'Pay Now(Received)', style: {} };
    if (value === 'Rejected')
      return { value, style: { color: 'var(--text_danger)' } };
    if (value === 'Imported')
      return {
        value,
        style: { color: 'var(--primary-color-lite)' }
      };
    if (value === 'Loan Requested') return { value, style: {} };
    if (value === 'Approval required')
      return {
        value,
        style: { color: 'var(--alert_warning_text)' }
      };
    if (value === 'Approved For Printing')
      return {
        value,
        style: { color: 'var(--brand-color-lite)' }
      };
    if (value === 'Denied to print')
      return {
        value,
        style: { color: 'var(--text_danger_lite)' }
      };
    return { value: '', style: {} };
  }

  reject() {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to reject this bill?'
    });
    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.billService
              .reject(this.params?.data?.action)
              .subscribe((data) => {
                if (data?.success) {
                  this.alertService.successAlert({
                    title: 'Bill Rejected !',
                    close: true,
                    timeout: 2500
                  });
                  this.refreshDataTable();
                }
              })
          );
        }
      })
    );
  }

  approve() {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to approve this bill?'
    });
    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.billService
              .approve(this.params?.data?.action)
              .subscribe((data) => {
                if (data?.success) {
                  this.alertService.successAlert({
                    title: 'Bill Approved !',
                    close: true,
                    timeout: 2500
                  });
                  this.refreshDataTable();
                }
              })
          );
        }
      })
    );
  }

  pay() {
    this.billPaymentService.paySingleBill(this.params.data);
  }

  addAttachment() {
    const addNotAllowed = ['2', '3', '4', '6'];
    const dRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '93%',
      data: {
        id: this.params.data.action,
        type: 'bills',
        disableAdd: !!addNotAllowed.includes(this.params.data?.bill_status)
      }
    });

    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res.refresh) {
          this.refreshDataTable();
        }
      })
    );
  }

  addComment() {
    const dRef = this.dialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '93%',
      data: {
        id: this.params.data.action,
        type: 'bills',
        enableDelete: true
      }
    });

    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res.refresh) {
          this.refreshDataTable();
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

  onFilterClicked(): void {
    const status = Number(this.params?.data?.bill_status);
    let filter = 'To pay';
    if (status === 1) {
      filter = 'To pay';
    } else if (status === 2) {
      filter = 'Paid';
    } else if (status === 3) {
      filter = 'Void';
    } else if (status === 4) {
      filter = 'Received';
    } else if (status === 6) {
      filter = 'Rejected';
    } else if (status === 7) {
      filter = 'Imported';
    } else if (status === 13) {
      filter = 'Approval required';
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

  refreshDataTable() {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
