import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IPaymentLinksCustomTableRes } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-sub-links-action-cell',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    LucideAngularModule
  ],
  templateUrl: './sub-links-action-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubLinksActionCellComponent implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);

  params: ICellRendererParams;

  get rowData(): IPaymentLinksCustomTableRes {
    return this.params.data as IPaymentLinksCustomTableRes;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(): boolean {
    return true;
  }

  onAction(actionId: string): void {
    this.dataTableService.setDataFromActionComp(this.rowData as unknown as { [key: string]: unknown }, actionId);
  }
}
