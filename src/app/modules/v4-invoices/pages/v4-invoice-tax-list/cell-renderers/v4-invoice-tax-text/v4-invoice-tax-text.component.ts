import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

interface IV4InvoiceTaxTextParams extends ICellRendererParams {
  alignEnd?: boolean;
}

@Component({
  selector: 'app-v4-invoice-tax-text',
  standalone: true,
  imports: [CommonFilterIconComponent, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex h-full w-full min-w-0 items-center gap-1"
      [class.justify-end]="alignEnd"
    >
      <span
        class="overflow-hidden text-ellipsis whitespace-nowrap"
        [matTooltip]="value"
        [matTooltipDisabled]="!value"
      >
        {{ value }}
      </span>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `
})
export class V4InvoiceTaxTextComponent implements AgRendererComponent {
  private dataTableService = inject(DataTableService);
  private params!: IV4InvoiceTaxTextParams;

  value = '';
  alignEnd = false;

  agInit(params: IV4InvoiceTaxTextParams): void {
    this.setCellValue(params);
  }

  refresh(params: IV4InvoiceTaxTextParams): boolean {
    this.setCellValue(params);
    return true;
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.params.value == null ? '' : String(this.params.value),
      field: this.params.colDef?.headerName as string
    });
  }

  private setCellValue(params: IV4InvoiceTaxTextParams): void {
    this.params = params;
    this.alignEnd = !!params.alignEnd;
    this.value = params.valueFormatted ?? (params.value ?? '');
  }
}
