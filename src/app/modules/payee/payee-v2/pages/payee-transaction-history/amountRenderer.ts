import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { PaidStatementModalComponent } from 'src/app/shared/v3/paid-statement-modal/paid-statement-modal.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-amount-renderer',
  template: `
    <div role="presentation" [ngStyle]="style" (click)="onClick()">
      {{ amount }}
    </div>
  `,
  standalone: true,
  imports: [NgStyle]
})
export class AmountRendererComponent implements ICellRendererAngularComp {
  private router = inject(Router);
  public dialog = inject(MatDialog);

  params: ICellRendererParams;
  amount: string;
  style = {
    color: 'var(--primary-color-lite)',
    cursor: 'pointer'
  };

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.amount = params.value;
    switch (params.colDef?.floatingFilterComponentParams?.tableId) {
      case 37: // Check
        this.amount = params.data.cheque_amount_formated;
        break;
      case 38: // Cash
        this.amount = params.data.cash_amount_formatted;
        break;
      case 39: // Bill
        this.amount = params.data.bill_grand_total;
        break;
      default:
        break;
    }
  }

  refresh(): boolean {
    return true;
  }

  /**
   * @description Handles the onClick event.
   * Depending on the tableId, navigates to different routes.
   */
  onClick() {
    switch (this.params.colDef?.floatingFilterComponentParams?.tableId) {
      case 37: // Check
        this.router.navigate([
          `manage/cheque/view/${this.params.data.encrypted_check_id}`
        ]);
        break;
      case 38: // Cash
        this.router.navigate([
          `manage/cashexp/view/${this.params.data.encrypted_expid}`
        ]);
        break;
      case 39: // Bill
        this.router.navigate([`manage/bill/view/${this.params.data.bill_id}`]);
        break;
      case 40: // Invoice
        this.router.navigate([
          `manage/invoice/statement/${this.params.data.invoice_id}`
        ]);
        break;
      case 67: {
        // Wallet
        const uuid = this.params?.data?.uu_id;
        this.dialog.open(PaidStatementModalComponent, {
          maxWidth: '900px',
          width: '93%',
          data: { uuid }
        });
        break;
      }
      default:
        break;
    }
  }
}
