import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

interface IPaymentSettingsTextParams extends ICellRendererParams {
  valueMap?: Record<string | number, string>;
}

@Component({
  selector: 'app-payment-settings-text-cell',
  standalone: true,
  imports: [CommonFilterIconComponent, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full min-w-0 items-center gap-1">
      <span
        class="overflow-x-hidden text-ellipsis"
        [matTooltip]="text"
        [matTooltipDisabled]="!text"
        >{{ text }}</span
      >
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `
})
export class PaymentSettingsTextCellComponent
  implements ICellRendererAngularComp
{
  private dataTableService = inject(DataTableService);

  params: IPaymentSettingsTextParams;
  text = '';

  agInit(params: IPaymentSettingsTextParams): void {
    this.params = params;
    this.text = this.resolveText(params);
  }

  refresh(params: IPaymentSettingsTextParams): boolean {
    this.params = params;
    this.text = this.resolveText(params);
    return true;
  }

  private resolveText(params: IPaymentSettingsTextParams): string {
    const raw = params?.value;
    if (raw === null || raw === undefined || raw === '') return '';
    if (params?.valueMap) {
      return params.valueMap[raw as string | number] ?? String(raw);
    }
    return String(raw);
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.text,
      field: this.params?.colDef?.headerName as string,
      payee: undefined
    });
  }
}
