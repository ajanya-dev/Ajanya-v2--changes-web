import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Eye, LucideAngularModule } from 'lucide-angular';
import {
  IPayeeSummaryRow,
  V4PayeeSummaryDetailService
} from './v4-payee-summary-detail.service';

interface IV4SummaryActionCellParams extends ICellRendererParams {
  tableId?: number;
  viewTooltip?: string;
}

@Component({
  selector: 'app-v4-summary-action-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="action-icon-btn"
        [attr.aria-label]="viewTooltip"
        [matTooltip]="viewTooltip"
        (click)="onView()"
      >
        <lucide-angular class="v4-action-icon" [img]="eyeIcon" [size]="16" />
      </button>
    </div>
  `
})
export class V4PayeeSummaryActionCellComponent
  implements ICellRendererAngularComp
{
  private detailService = inject(V4PayeeSummaryDetailService);

  readonly eyeIcon = Eye;

  private params: IV4SummaryActionCellParams;
  viewTooltip = 'View';

  agInit(params: IV4SummaryActionCellParams): void {
    this.params = params;
    this.viewTooltip = params.viewTooltip ?? 'View';
  }

  refresh(): boolean {
    return true;
  }

  onView(): void {
    this.detailService.open(
      this.params.tableId,
      this.params.data as IPayeeSummaryRow | undefined
    );
  }
}
