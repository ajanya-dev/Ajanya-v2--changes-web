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
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { LucideAngularModule } from 'lucide-angular';
import { IV4StatusBadge } from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { Router } from '@angular/router';
import { V4VendorCreditApplyModalComponent } from '../../modals/v4-vendor-credit-apply-modal/v4-vendor-credit-apply-modal.component';

const BILL_STATUS_MAP: Record<string, IV4StatusBadge> = {
  Pay: {
    status: 'Pay',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-badge-info-text-color)'
  },
  Paid: {
    status: 'Paid',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-badge-success-text-color)'
  },
  Voided: {
    status: 'Voided',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-badge-error-text-color)'
  },
  Rejected: {
    status: 'Rejected',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-badge-error-text-color)'
  },
  Imported: {
    status: 'Imported',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-badge-info-text-color)'
  },
  'Approval required': {
    status: 'Approval Required',
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-badge-warning-text-color)'
  },
  'Approved For Printing': {
    status: 'Approved For Printing',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-badge-success-text-color)'
  },
  'Denied to print': {
    status: 'Denied To Print',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-badge-error-text-color)'
  },
  Accepted: {
    status: 'Pay Now(Received)',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-badge-info-text-color)'
  },
  'Loan Requested': {
    status: 'Loan Requested',
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-badge-warning-text-color)'
  }
};
@Component({
  selector: 'app-dt-attachment',
  template: `
    <div class="flex items-center w-full gap-1">
      <div class="flex items-center gap-1.5">
        @if (!specialBlockValues.includes(params.value)) {
          @if (statusBadge.status === 'Pay') {
            <button
              type="button"
              class="pay-button !font-medium hover:shadow-common-button"
              (click)="$event.stopPropagation(); pay()"
            >
              Pay
            </button>
            @if (params?.data?.bill_status === '16') {
              <span matTooltip="Saved Payment" class="pl-1.5">
                <lucide-angular
                  name="info"
                  [size]="16"
                  class="text-v4-tertiary-text-color"
                />
              </span>
            }
          } @else {
            <span
              class="status-badge"
              [style.background-color]="statusBadge.bgColor"
              [style.color]="statusBadge.textColor"
            >
              {{ statusBadge.status }}
            </span>
          }
        } @else {
          @if (params?.value === '') {
            <a
              role="presentation"
              matTooltip="Approve This Bill"
              (click)="$event.stopPropagation(); approve()"
              class="text-v4-common-green-color cursor-pointer"
            >
              Approve </a
            >/
            <a
              role="presentation"
              matTooltip="Reject This Bill"
              (click)="$event.stopPropagation(); reject()"
              class="text-v4-common-red-color cursor-pointer"
            >
              Reject
            </a>
          } @else {
            @if (params?.value === 'Imported') {
              <span
                class="status-badge mr-2"
                style="background-color: var(--v4-badge-info-bg-color); color: var(--v4-badge-info-text-color)"
              >
                Imported
              </span>
              <button
                type="button"
                class="pay-button !font-medium hover:shadow-common-button"
                (click)="$event.stopPropagation(); pay()"
              >
                Pay
              </button>
              @if (
                (params?.data?.is_third_party === 1 ||
                  params?.data?.is_third_party === 2) &&
                params?.data?.importedFrom !== ''
              ) {
                <span [matTooltip]="importTooltip" class="pl-1.5">
                  <lucide-angular
                    name="info"
                    [size]="16"
                    class="text-v4-tertiary-text-color"
                  />
                </span>
              }
            } @else {
              <span
                role="presentation"
                (click)="$event.stopPropagation(); pay()"
                class="cursor-pointer"
                matTooltip="Received Bill"
              >
                <span class="text-v4-common-yellow-color">Pay Now</span>
                <span class="text-v4-primary-brand-bold-color">(Received)</span>
              </span>
            }
          }
        }
        @if (statusIcon()?.comment === 1) {
          <div class="dt-cell-edit-btn">
            <lucide-angular
              name="message-square"
              [size]="16"
              matTooltip="View Comments"
              (click)="$event.stopPropagation(); addComment()"
            />
          </div>
        }
        @if (statusIcon()?.attachment === 1) {
          <div class="dt-cell-edit-btn">
            <lucide-angular
              name="paperclip"
              [size]="16"
              matTooltip="View Attachments"
              (click)="$event.stopPropagation(); addAttachment()"
            />
          </div>
        }
      </div>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `,
  styles: [
    `
      .disable {
        opacity: 0.6;
        pointer-events: none !important;
        cursor: no-drop;
      }

      .pay-button {
        display: inline-flex;
        align-items: center;
        font-family: var(--font-peridot);
        font-size: 12px;
        font-weight: 400;
        line-height: 1.4;
        border-radius: 8px;
        padding: 4px 12px;
        white-space: nowrap;
        border: none;
        cursor: pointer;
        color: #ffffff;
        background-color: var(--v4-primary-brand-color);
        transition: opacity 0.15s ease;

        &:hover {
          opacity: 0.95;
        }
      }
    `
  ],
  standalone: true,
  imports: [
    NgClass,
    MatTooltip,
    LucideAngularModule,
    CommonFilterIconComponent
  ]
})
export class BillAttachmentCommentComponent
  implements ICellRendererAngularComp, OnDestroy
{
  private dataTableService = inject(DataTableService);
  dialog = inject(MatDialog);
  private billService = inject(BillService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);

  params: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  subscriptions: Subscription[] = [];
  statusBadge: IV4StatusBadge = { status: '', bgColor: '', textColor: '' };

  statusIcon: Signal<IDtAttachComntArray | undefined>;

  specialBlockValues = ['', 'Accepted', 'Imported'] as const;
  importTooltip: string;

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.statusBadge = this.getStatusBadge(this.params.value);
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.importTooltip = this.params.data.importedFrom;
    this.getAttachmentStatus();
    this.statusBadge = this.getStatusBadge(this.params.value);
    this.statusIcon = computed(() => {
      const statusIcon = this.attachCommentList()?.filter(
        (res) => res.id === params.data.action
      )[0];
      return statusIcon;
    });
  }

  private getStatusBadge(value: string): IV4StatusBadge {
    return (
      BILL_STATUS_MAP[value] ?? {
        status: value,
        bgColor: 'var(--v4-badge-warning-bg-color)',
        textColor: 'var(--v4-badge-warning-text-color)'
      }
    );
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
    const paymentId = this.params.data.zil_payment_uu_id;
    if (this.params.data.bill_status === '16' && paymentId) {
      this.router.navigate([`/v4/manage/payments/edit/${paymentId}`], {
        state: { backUrl: this.router.url },
        queryParams: { billId: this.params.data.action }
      });
      return;
    }
    this.checkVendorCreditAndPay();
  }

  checkVendorCreditAndPay() {
    if (this.params.data.isVendorCreditAvailable === 1) {
      const alert = this.dialog.open(V4VendorCreditApplyModalComponent, {
        width: '560px',
        maxWidth: '93%',
        height: 'auto',
        maxHeight: '90vh',
        data: {
          billId: this.params.data.action,
          payeeId: this.params.data.payeeId,
          billAmount: this.params.data.bill_grand_total || 0,
          availableCredit: this.params.data.availableCreditAmount || 0
        },
        panelClass: 'paddingless-modal-rounded'
      });
      this.subscriptions.push(
        alert.afterClosed().subscribe((result) => {
          if (!result?.success && result?.type === 'cancel') {
            this.refreshDataTable();
            this.dialog.closeAll();
            return;
          }
          this.router.navigate([`/v4/manage/payments/pay/bankaccount/check`], {
            state: { backUrl: this.router.url,payWithVendorCredit: result?.success ? true : undefined },
            queryParams: { billId: this.params.data.action }
          });
        })
      );
    } else {
      this.router.navigate([`/v4/manage/payments/pay/bankaccount/check`], {
        state: { backUrl: this.router.url},
        queryParams: { billId: this.params.data.action }
      });
    }
  }

  addAttachment() {
    const addNotAllowed = ['2', '3', '4', '6'];
    const dRef = this.dialog.open(V4AddAttachmentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id: this.params.data.action,
        type: 'bills',
        disableAdd: !!addNotAllowed.includes(this.params.data?.bill_status)
      },
      panelClass: 'paddingless-modal-rounded'
    });

    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res?.isRefresh) {
          this.refreshDataTable();
        }
      })
    );
  }

  addComment() {
    const dRef = this.dialog.open(V4AddCommentCommonModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id: this.params.data.action,
        type: 'bills',
        enableDelete: true
      },
      panelClass: 'paddingless-modal-rounded'
    });

    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res?.isRefresh) {
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
