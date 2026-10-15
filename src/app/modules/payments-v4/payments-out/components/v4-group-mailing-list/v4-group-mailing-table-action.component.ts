import { Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { IGroupMailingRecord } from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';
import { V4GroupMailingPanelService } from './v4-group-mailing-panel.service';

@Component({
  selector: 'app-v4-group-mailing-table-action',
  template: `
    <div class="flex items-center justify-center h-full">
      <button
        type="button"
        class="dt-cell-edit-btn"
        (click)="viewDetails(); $event.stopPropagation()"
        matTooltip="View details"
      >
        <lucide-icon name="eye" [size]="16" />
      </button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltip]
})
export class V4GroupMailingTableActionComponent
  implements ICellRendererAngularComp
{
  private panelService = inject(V4GroupMailingPanelService);

  params: ICellRendererParams<IGroupMailingRecord>;

  agInit(params: ICellRendererParams<IGroupMailingRecord>): void {
    this.params = params;
  }

  viewDetails(): void {
    if (this.params.data?.id) {
      this.panelService.open(this.params.data.id, this.params.data.name || '');
    }
  }

  refresh(_: ICellRendererParams<IGroupMailingRecord>): boolean {
    return false;
  }
}
