import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilterList } from '@fortawesome/pro-solid-svg-icons';
import { Utils } from 'src/app/data/utils';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v3-created-at',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FontAwesomeModule],
  template: `<div class="flex gap-1 items-center w-full" (mouseenter)="showFilterIcon = true" (mouseleave)="showFilterIcon = false">
    <div
      class="flex flex-col gap-1"
    >
      <h2 class="pt-1" [class.pt-2]="!createdAtTime">
        {{ createdDate }}
      </h2>
      <h3 class="pt-px">{{ createdAtTime }}</h3>
    </div>
    @if (showFilterIcon) {
      <div
        role="presentation"
        class="h-6 flex justify-center items-center bg-common-secondary-blue-color text-common-blue-color p-1 cursor-pointer"
        (click)="onFilterClicked()"
      >
        <fa-icon class="-my-3" [icon]="faFilterList"></fa-icon>
      </div>
    }
  </div> `,
  styles: [
    `
      h2 {
        font-family: var(--roboto);
        font-size: 13px;
        font-weight: 400;
        height: 14px;
        line-height: 14px;
      }

      h3 {
        font-family: var(--roboto);
        font-size: 14px;
        font-weight: 400;
        color: var(--secondary-text-color);
        height: 14px;
        line-height: 14px;
      }
    `
  ]
})
export class V3CreatedAtComponent {
  private dataTableService = inject(DataTableService);

  createdDate: string;
  createdAtTime: string;
  showFilterIcon = false;
  faFilterList = faFilterList;
  param: ICellRendererParams;

  agInit(params: ICellRendererParams) {
    this.param = params;
    if (params.data?.updated_at) {
      this.createdDate = Utils.splitDate(params?.data?.created_at) ?? '';
      this.createdAtTime = Utils.splitTime(params?.data?.created_at) ?? '';
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
