import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams, IRowNode } from '@ag-grid-community/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-webhook-log-view-button-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="flex items-center h-full gap-1">
      <button
        type="button"
        class="action-icon-btn"
        matTooltip="View webhook event details"
        aria-label="View webhook event details"
        (click)="onEyeClick($event)"
      >
        <lucide-icon name="eye" [size]="16" class="v4-action-icon" />
      </button>
    </div>
  `
})
export class WebhookLogViewButtonV4Component implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);
  private rowData: Record<string, unknown>;
  private node: IRowNode;

  agInit(params: ICellRendererParams): void {
    this.rowData = params.data as Record<string, unknown>;
    this.node = params.node;
  }

  refresh(): boolean { return false; }

  onEyeClick(event: MouseEvent): void {
    event.stopPropagation();
    this.node.setSelected(false);
    this.dataTableService.setDataFromActionViewComp(this.rowData, 'eye', DTTableId.webhookLog);
  }
}
