import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PaidStatementModalV4Component } from 'src/app/shared/v3/paid-statement-modal/v4/paid-statement-modal-v4.component';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { CashExpenseV4StateService } from 'src/app/modules/cash-expense-v4/services/cash-expense-v4-state.service';
import { ICheckListTableRowData } from 'src/app/modules/check/model/check';

export interface IPayeeSummaryRow {
  encrypted_expid?: string;
  bill_id?: string | number;
  invoice_id?: string | number;
  uu_id?: string;
  [key: string]: unknown;
}

export const PAYEE_SUMMARY_TABLE_ID = {
  check: 37,
  cashExpense: 38,
  bill: 39,
  invoice: 40,
  wallet: 68
} as const;

@Injectable({ providedIn: 'root' })
export class V4PayeeSummaryDetailService {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private detailPanelService = inject(V4DetailPanelService);
  private cashExpenseState = inject(CashExpenseV4StateService);

  open(tableId: number | undefined, data: IPayeeSummaryRow | undefined): void {
    if (!data) {
      return;
    }

    switch (tableId) {
      case PAYEE_SUMMARY_TABLE_ID.check:
        this.detailPanelService.openCheck(
          data as unknown as ICheckListTableRowData
        );
        break;
      case PAYEE_SUMMARY_TABLE_ID.cashExpense: {
        const expenseId = data.encrypted_expid;
        if (expenseId) {
          this.cashExpenseState.openDetail(expenseId);
        }
        break;
      }
      case PAYEE_SUMMARY_TABLE_ID.bill:
        this.router.navigate([`v4/manage/bill/view/${data.bill_id}`]);
        break;
      case PAYEE_SUMMARY_TABLE_ID.invoice:
        this.router.navigate([
          `v4/manage/invoice/statement/${data.invoice_id}`
        ]);
        break;
      case PAYEE_SUMMARY_TABLE_ID.wallet:
        this.dialog.open(PaidStatementModalV4Component, {
          maxWidth: '900px',
          width: '93%',
          panelClass: 'paddingless-modal-rounded',
          data: { uuid: data.uu_id }
        });
        break;
      default:
        break;
    }
  }
}
