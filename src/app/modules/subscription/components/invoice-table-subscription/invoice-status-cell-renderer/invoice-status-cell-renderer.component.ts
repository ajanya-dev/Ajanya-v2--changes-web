import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IInvoiceRowData } from '../../../model/subscription';

export interface IInvoiceStatusCellRendererParams extends ICellRendererParams {
  onPayNow: (rowData: IInvoiceRowData) => void;
}

@Component({
  selector: 'app-invoice-status-cell-renderer',
  standalone: true,
  imports: [CommonButtonV35Component],
  template: `
    @if (status === 'paid') {
      <span
        style="font-weight: 500; color: #FFFFFF; background: var(--brand-color); padding: 2px 8px; font-size: 10px; border-radius: 6px;"
        title="Verified using bank data">{{ status }}</span>
    } @else if (status === 'overdue') {
      <div class="flex gap-2 items-center">
        <span class="text-common-red-color text-xs font-medium">{{ status }}</span>
        <app-common-button-v35
          type="list"
          text="Pay Now"
          textColorInput="white"
          (clickEvent)="onPayNow()"
        ></app-common-button-v35>
      </div>
    } @else {
      <span>{{ status }}</span>
    }
  `
})
export class InvoiceStatusCellRendererComponent implements ICellRendererAngularComp {
  status: string = '';
  private params!: IInvoiceStatusCellRendererParams;

  agInit(params: IInvoiceStatusCellRendererParams): void {
    this.params = params;
    this.status = params.value;
  }

  refresh(): boolean {
    return true;
  }

  onPayNow(): void {
    this.params.onPayNow(this.params.data);
  }
}
