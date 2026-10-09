import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { Utils } from 'src/app/data/utils';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v4-created-at',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CommonFilterIconComponent],
  template: `<div class="flex gap-1 items-center w-full">
    <div
      class="flex whitespace-nowrap"
      [class.flex-col]="!inline"
      [class.gap-1]="inline"
      [class.items-baseline]="inline"
    >
      <h2>{{ createdDate }}</h2>
      <h3 class="!text-[12px]">{{ createdAtTime }}</h3>
    </div>
    <app-common-filter-icon (filterEvent)="onFilterClicked()" />
  </div> `,
  // Sized here, not in ag-theme-v4.scss: these are bare <h2>/<h3> that would
  // otherwise inherit the document heading sizes, and overriding that globally
  // by col-id leaked into every other v4 table with a created_at column.
  styles: [
    `
      .flex-col {
        gap: 1px;
      }

      h2 {
        font-family: var(--font-peridot);
        font-size: 12px;
        font-weight: 400;
        line-height: 1.25;
        margin: 0;
        color: var(--v4-main-text-color);
      }

      h3 {
        font-family: var(--font-peridot);
        font-size: 12px;
        font-weight: 400;
        line-height: 1.25;
        margin: 0;
        color: var(--v4-secondary-text-color);
      }
    `
  ]
})
export class V4CreatedAtComponent {
  private dataTableService = inject(DataTableService);

  createdDate: string;
  createdAtTime: string;
  inline = false;
  param: ICellRendererParams;

  agInit(params: ICellRendererParams) {
    this.param = params;
    this.inline = !!params?.colDef?.cellRendererParams?.inline;
    const createdAt = params?.data?.created_at;
    if (createdAt) {
      this.createdDate = Utils.splitDate(createdAt.toString()) ?? '';
      this.createdAtTime = Utils.splitTime(createdAt.toString())?.toUpperCase() ?? '';
    }
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.param.data?.created_at as string,
      field: this.param?.colDef?.headerName as string,
      payee: undefined,
      isDate: true
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }
}
