import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { VendorCreditApplyModalComponent } from '../modals/vendor-credit-apply-modal/vendor-credit-apply-modal.component';

/**
 * Minimal shape required to start a payment for a single bill row. Both the
 * bill list header and the in-row Pay button feed their row data here.
 */
export interface IBillPayInput {
  action: string;
  bill_status: string | number;
  zil_payment_uu_id?: string;
  isVendorCreditAvailable?: number;
  payeeId?: string;
  bill_grand_total?: string | number;
  availableCreditAmount?: string | number;
}

/** Bill status for a saved (draft) payment. */
const SAVED_PAYMENT_STATUS = '16';

/**
 * Shared payment routing for bills so the in-row Pay button and the header Pay
 * button stay in sync. Saved payments (status 16) reopen an existing draft,
 * everything else starts a fresh payment.
 */
@Injectable({ providedIn: 'root' })
export class BillPaymentService {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private billService = inject(BillService);
  private v3DataTableService = inject(V3DataTableService);
  private v3BulkPaymentService = inject(V3BulkPaymentService);

  /** Whether the given bill status represents a saved (draft) payment. */
  isSavedPayment(billStatus: string | number | undefined): boolean {
    return billStatus?.toString() === SAVED_PAYMENT_STATUS;
  }

  /**
   * Pays a single bill. Saved payments open their existing draft in the payment
   * edit screen; any other payable bill starts a fresh payment. A vendor credit
   * prompt is shown first whenever credit is available.
   */
  paySingleBill(data: IBillPayInput): void {
    const url = this.isSavedPayment(data.bill_status)
      ? `/manage/payments/main/edit/${data.zil_payment_uu_id}`
      : `/manage/payments/main/pay/bankaccount/check`;
    const state: { backUrl: string; payWithVendorCredit?: boolean } = {
      backUrl: this.router.url
    };
    this.checkVendorCreditAndPay(data, url, state);
  }

  /**
   * Sends multiple saved payments (status 16) to the bulk payment screen,
   * mirroring the payments table bulk flow.
   */
  payBulkSavedPayments(uuidList: string[]): void {
    this.v3BulkPaymentService.setIsCheckModeSelected(true);
    this.v3BulkPaymentService.checkOption = '';
    this.v3BulkPaymentService.isAllDetailsAPICalled = false;
    this.v3BulkPaymentService.initBulkPayment(uuidList);
    this.router.navigateByUrl('/manage/bulk-payments');
  }

  private checkVendorCreditAndPay(
    data: IBillPayInput,
    url: string,
    state: { backUrl: string; payWithVendorCredit?: boolean }
  ): void {
    if (data.isVendorCreditAvailable !== 1) {
      this.navigateToPay(data, url, state);
      return;
    }

    const alert = this.dialog.open(VendorCreditApplyModalComponent, {
      width: '560px',
      maxWidth: '93%',
      height: 'auto',
      maxHeight: '90vh',
      data: {
        billId: data.action,
        payeeId: data.payeeId,
        billAmount: data.bill_grand_total || 0,
        availableCredit: data.availableCreditAmount || 0
      }
    });

    alert.afterClosed().subscribe((result) => {
      if (result?.success) {
        state.payWithVendorCredit = true;
      }
      if (!result?.success && result?.type === 'cancel') {
        this.refreshDataTable();
        this.dialog.closeAll();
        return;
      }
      this.navigateToPay(data, url, state);
    });
  }

  private navigateToPay(
    data: IBillPayInput,
    url: string,
    state: { backUrl: string; payWithVendorCredit?: boolean }
  ): void {
    this.router.navigate([url], {
      state,
      queryParams: { billId: data.action }
    });
    if (!this.isSavedPayment(data.bill_status)) {
      this.billService.billId.set([data.action]);
    }
  }

  private refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }
}
