import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

interface IActionCellParams extends ICellRendererParams {
  onViewClick?: (row: Record<string, unknown>) => void;
}

@Component({
  selector: 'app-international-payment-action-cell-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--v4-hover-color)] transition-colors duration-150"
        (click)="onViewClick(); $event.stopPropagation()"
        matTooltip="View Details"
        #viewTooltip="matTooltip"
      >
        <lucide-icon name="eye" [size]="15" class="text-[var(--v4-primary-brand-bold-color)]"></lucide-icon>
      </button>
    </div>
  `
})
export class InternationalPaymentActionCellV4Component implements AgRendererComponent {
  @ViewChild('viewTooltip') viewTooltip!: MatTooltip;

  private params!: IActionCellParams;
  private rowData!: Record<string, unknown>;

  agInit(params: IActionCellParams): void {
    this.params = params;
    this.rowData = params.data;
  }

  refresh(params: IActionCellParams): boolean {
    this.params = params;
    this.rowData = params.data;
    return true;
  }

  onViewClick(): void {
    this.viewTooltip?.hide();
    this.params.onViewClick?.(this.rowData);
  }
}
