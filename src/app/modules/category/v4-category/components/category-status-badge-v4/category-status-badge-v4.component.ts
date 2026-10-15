import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-category-status-badge-v4',
  standalone: true,
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1 h-full w-full">
      @if (label) {
        <span
          class="status-badge"
          [style.background-color]="bgColor"
          [style.color]="textColor"
        >
          {{ label }}
        </span>
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class CategoryStatusBadgeV4Component implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);

  private params: ICellRendererParams;
  label = '';
  bgColor = '';
  textColor = '';

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.setBadge(params.value as number);
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.setBadge(params.value as number);
    return true;
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.label,
      field: this.params.colDef?.headerName as string,
      payee: undefined
    });
  }

  private setBadge(status: number): void {
    if (status === 1) {
      this.label = 'Active';
      this.bgColor = 'var(--v4-badge-success-bg-color)';
      this.textColor = 'var(--v4-badge-success-text-color)';
      return;
    }
    if (status === 0) {
      this.label = 'Inactive';
      this.bgColor = 'var(--v4-badge-error-bg-color)';
      this.textColor = 'var(--v4-badge-error-text-color)';
      return;
    }
    this.label = '';
    this.bgColor = '';
    this.textColor = '';
  }
}
