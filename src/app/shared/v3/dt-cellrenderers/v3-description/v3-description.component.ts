import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPenToSquare, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CustomCellEditorComponent } from '../custom-cell-editor/custom-cell-editor.component';

interface IUpdatedCellRendererParams extends ICellRendererParams {
  isItEditAble: number;
}

@Component({
  selector: 'app-v3-description',
  template: `
    <div
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
      class="flex gap-1 items-center w-full"
      [style.height.px]="!description ? height : null"
      [style.width.px]="
        !description || tableName !== 'payment_table' ? width - 20 : null
      "
    >
      <h2
        [matTooltip]="description ? description : ''"
        matTooltipPosition="below"
      >
        {{ description ? description : '' }}
      </h2>
      @if (showEditIcon && param?.isItEditAble !== 0) {
        <div
          role="presentation"
          class="flex justify-center items-center text-common-blue-color p-1 cursor-pointer"
          (click)="onEdit()"
        >
          <fa-icon
            class="-my-3"
            [icon]="description ? faPenToSqure : faPlus"
          ></fa-icon>
        </div>
      }
      @if (showFilterIcon && description) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  styles: [
    `
      :host {
        overflow-x: hidden;
        margin-right: 5px;
      }

      h2 {
        text-overflow: ellipsis;
        overflow-x: hidden;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    FaIconComponent,
    FormsModule,
    NgClass,
    CommonFilterIconComponent
  ]
})
export class V3DescriptionComponent implements OnInit {
  private localStorageService = inject(LocalStorageService);
  private dataTableService = inject(DataTableService);

  description: string;
  showEditIcon = false;
  faPenToSqure = faPenToSquare;
  faPlus = faPlus;
  width: number;
  height: number;
  tableName: string;
  param: IUpdatedCellRendererParams;
  selectedCheckStatus: ICheckStatus;
  showFilterIcon = false;

  agInit(params: IUpdatedCellRendererParams) {
    this.param = params;
    this.width = params.colDef?.minWidth as number;
    this.description = params.data?.description ?? params.data?.cheque_memo;
    this.height = params.node.rowHeight as number;
    this.tableName = params.colDef?.floatingFilterComponentParams?.tableName;
  }

  ngOnInit(): void {
    this.getCheckStatus();
  }

  /**
   * @description Retrieves the check status from the local storage and sets the selectedCheckStatus property.
   */
  getCheckStatus(): void {
    if (this.localStorageService.getItem('check_status')) {
      const status = this.localStorageService.getItem('check_status');
      this.selectedCheckStatus = status[this.param.data?.cheque_status];
      if (this.selectedCheckStatus) {
        this.param.isItEditAble = this.selectedCheckStatus.isItEditAble;
      } else if (
        this.param.data?.status === 'PENDING' ||
        this.param.data?.transfer_type_code === 'check'
      ) {
        this.param.isItEditAble = 1;
      } else {
        this.param.isItEditAble = 0;
      }
    }
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.description,
      field: this.param.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
      this.showEditIcon = true;
    } else {
      this.showFilterIcon = false;
      this.showEditIcon = false;
    }
  }

  /**
   * @description It sets the custom cell editor component and marks the column as editable.
   */
  onEdit(): void {
    const { colDef } = this.param;
    if (colDef) {
      colDef.cellEditor = CustomCellEditorComponent;
      colDef.editable = true;
      this.param.api.startEditingCell({
        rowIndex: this.param.node.rowIndex as number,
        colKey: colDef.field as string
      });
    }
  }
}
