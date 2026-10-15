import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

interface IV4SummaryTextCellParams extends ICellRendererParams {
  valueField?: string;
}

@Component({
  selector: 'app-v4-summary-text-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonFilterIconComponent, MatTooltipModule],
  template: `
    <div class="flex items-center gap-1 w-full min-w-0">
      <span
        class="overflow-hidden text-ellipsis whitespace-nowrap"
        [matTooltip]="text"
        [matTooltipDisabled]="!text"
      >
        {{ text }}
      </span>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `
})
export class V4PayeeSummaryTextCellComponent
  implements ICellRendererAngularComp
{
  private dataTableService = inject(DataTableService);

  private params: IV4SummaryTextCellParams;
  text = '';

  agInit(params: IV4SummaryTextCellParams): void {
    this.params = params;
    this.text =
      (params.valueField ? params.data?.[params.valueField] : params.value) ??
      '';
  }

  refresh(): boolean {
    return true;
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.text,
      field: this.params.colDef?.headerName as string,
      payee: undefined
    });
  }
}
