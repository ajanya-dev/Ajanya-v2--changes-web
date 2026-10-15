import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams, IRowNode } from '@ag-grid-community/core';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-api-log-view-button-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        type="button"
        class="action-icon-btn"
        matTooltip="View"
        (click)="onEyeClick($event)"
      >
        <lucide-icon name="eye" [size]="16" class="v4-action-icon" />
      </button>
    </div>
  `
})
export class ApiLogViewButtonV4Component implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);
  private rowData: { [key: string]: unknown };
  private node: IRowNode;

  agInit(params: ICellRendererParams): void {
    this.rowData = params.data;
    this.node = params.node;
  }

  refresh(): boolean { return false; }

  onEyeClick(event: MouseEvent): void {
    event.stopPropagation();
    this.node.setSelected(false);
    this.dataTableService.setDataFromActionViewComp(this.rowData, 'eye', DTTableId.apiRequestLog);
  }
}
