import { Component, inject, OnDestroy } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IBankData } from 'src/app/models/bank';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { ConfirmMicroDepositModalV4Component } from 'src/app/modules/user/user-v4/modals/confirm-micro-deposit-modal-v4/confirm-micro-deposit-modal-v4.component';
import { VerifyInstantlyModalV4Component } from '../../../../bank-v4/v4-modals/verify-instantly-modal-v4/verify-instantly-modal-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-verified-status-cell-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, CommonFilterIconComponent],
  template: `
    <div class="flex gap-1 items-center w-full">
      <div>
        @if (isVerified) {
          <span class="status-badge status-completed">Verified</span>
        } @else if (type === 13) {
          <span class="status-badge status-pending">Pending</span>
        } @else if (type === 12) {
          <button
            class="verify-v4-action-link"
            matTooltip="Enter the micro deposit amounts sent to this account"
            (click)="microDeposit(); $event.stopPropagation()"
          >
            <lucide-icon name="circle-alert" [size]="10"></lucide-icon>
            Confirm Micro Deposit
          </button>
        } @else if (type === 14) {
          <span class="status-badge status-completed">Approved</span>
        } @else if (type === 15) {
          <span class="status-badge status-failed">Rejected</span>
          <button
            class="verify-v4-action-link"
            matTooltip="Verify this bank account instantly with your online banking login"
            (click)="verifyInstantly(); $event.stopPropagation()"
          >
            Verify Instantly
          </button>
        } @else if (type === 16) {
          <span class="status-badge status-failed">Rejected</span>
          <button
            class="verify-v4-action-link"
            matTooltip="Restart verification for this bank account"
            (click)="openBankVerifyModal(); $event.stopPropagation()"
          >
            Reapply
          </button>
        } @else if (type === 17) {
          <span class="status-badge status-failed">Verification failed</span>
          <button
            class="verify-v4-action-link"
            matTooltip="Verify this bank account instantly with your online banking login"
            (click)="verifyInstantly(); $event.stopPropagation()"
          >
            Verify Instantly
          </button>
        } @else {
          <button
            class="verify-v4-action-link"
            matTooltip="Verify this bank account to start sending payments from it"
            (click)="openBankVerifyModal(); $event.stopPropagation()"
          >
            <lucide-icon name="circle-alert" [size]="10"></lucide-icon>
            Verify Now
          </button>
        }
      </div>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `,
  styles: [
    `
      .verify-v4-action-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0 4px;
        text-decoration: underline;
        text-underline-offset: 2px;
        color: var(--v4-common-blue-color);

        &:hover {
          opacity: 0.8;
        }
      }
    `
  ]
})
export class VerifiedStatusCellV4Component
  implements ICellRendererAngularComp, OnDestroy
{
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  params!: ICellRendererParams<IBankData>;
  type: number;
  isVerified = false;
  subscriptions: Subscription[] = [];

  agInit(params: ICellRendererParams<IBankData>): void {
    this.params = params;
    this.determineType(params);
  }

  refresh(): boolean {
    return true;
  }

  private determineType(params: ICellRendererParams<IBankData>): void {
    if (
      (String(params.data?.bank_account_account_number) === '1111111111') &&
      (String(params.data?.bank_routing_number) === '322271627')
    ) {
      this.type = 1;
    } else if (params.data?.mark_as_verified == 1) {
      this.isVerified = true;
      this.type = 2;
    } else if (params.data?.verified_by == 3) {
      this.type = 12;
    } else if (params.data?.verified_by == 4) {
      this.type = 13;
    } else if (params.data?.verified_by == 5) {
      this.type = 14;
    } else if (params.data?.verified_by == 6) {
      this.type = 15;
    } else if (params.data?.verified_by == 10) {
      this.type = 16;
    } else if (params.data?.verified_by == 12) {
      this.type = 17;
    } else {
      this.type = 19;
    }
  }

  openBankVerifyModal() {
    if (this.params.data?.bank_account_country === 'Canada') {
      this.alertService.warningAlert({
        content: 'Verification for Canadian bank accounts is not permitted.'
      });
      return;
    }
    this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        bankId: this.params.data?.encrypted_bankacc_id,
        bankDetails: {
          verifiedBy: this.params.data?.verified_by ?? undefined,
          country: this.params.data?.bank_account_country
        }
      }
    });
  }

  microDeposit() {
    this.dialog.open(ConfirmMicroDepositModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { bankAccountId: this.params.data?.encrypted_bankacc_id }
    });
  }

  verifyInstantly() {
    this.dialog.open(VerifyInstantlyModalV4Component, {
      width: '100%',
      maxWidth: '600px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        bankData: this.params.data
      }
    });
  }

  onFilterClicked(): void {
    const verifiedBy = Number(this.params?.data?.verified_by);
    let filter = '';

    if (this.params.data?.mark_as_verified == 1) {
      filter = 'Verified';
    } else if (verifiedBy === 4) {
      filter = 'Pending';
    } else if (verifiedBy === 3) {
      filter = 'Confirm MD';
    } else if (verifiedBy === 6) {
      filter = 'Rejected- Verify instantly';
    } else if (verifiedBy === 10) {
      filter = 'Rejected- Reapply';
    } else if (verifiedBy === 12) {
      filter = 'failed';
    } else {
      filter = 'Verify Now';
    }

    const cellValue = {
      filter,
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
