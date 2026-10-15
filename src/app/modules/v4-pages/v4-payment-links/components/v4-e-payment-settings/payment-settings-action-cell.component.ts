import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-payment-settings-action-cell',
  standalone: true,
  imports: [MatMenuModule, MatTooltipModule, LucideAngularModule],
  template: `
    <div class="flex items-center h-full gap-1">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        (click)="$event.stopPropagation()"
        matTooltip="Options"
      >
        <lucide-icon
          name="ellipsis-vertical"
          [size]="16"
          class="v4-action-icon"
        ></lucide-icon>
      </button>

      <mat-menu #menu="matMenu" class="v4-action-menu">
        <div class="v4-menu-group-label">ACTIONS</div>
        <button mat-menu-item (click)="onAction('id_edit_button')">
          <div class="v4-menu-item">
            <lucide-icon name="pencil" [size]="16"></lucide-icon>
            <span>Edit</span>
          </div>
        </button>
        <button
          mat-menu-item
          class="v4-menu-item-danger"
          (click)="onAction('id_delete_button')"
        >
          <div class="v4-menu-item">
            <lucide-icon name="trash-2" [size]="16"></lucide-icon>
            <span>Delete</span>
          </div>
        </button>
      </mat-menu>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSettingsActionCellComponent
  implements ICellRendererAngularComp
{
  private dataTableService = inject(DataTableService);

  params: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(): boolean {
    return true;
  }

  onAction(actionId: string): void {
    this.dataTableService.setDataFromActionDangerComp(
      this.params?.data as { [key: string]: unknown },
      actionId,
      DTTableId.paymentSettings
    );
  }
}
