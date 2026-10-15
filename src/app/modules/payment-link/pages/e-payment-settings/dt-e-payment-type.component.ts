import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v3dt-e-payment-type',
  standalone: true,
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <h2 class="text-ellipsis overflow-x-hidden">{{ paymentType }}</h2>
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class V3DTEpaymentTypeComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  showFilterIcon = false;
  paymentType: string;
  tableName: 'check_list_table' | 'payment_table';

  agInit(params: ICellRendererParams) {
    this.param = params;
    this.paymentType = this.getPaymentType(params.data?.payment_type);
  }

  getPaymentType(type: number): string {
    const paymentTypes: { [key: number]: string } = {
      1: 'Stripe',
      2: 'PayPal',
      3: 'bitpay',
      4: 'Stripe Checkout'
    };

    return paymentTypes[type as number];
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.paymentType,
      field: this.param.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }
}
