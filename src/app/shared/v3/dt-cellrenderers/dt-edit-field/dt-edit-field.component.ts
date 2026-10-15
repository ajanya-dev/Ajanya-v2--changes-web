import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faPenToSquare } from '@fortawesome/pro-solid-svg-icons';
import { NgxMaskDirective } from 'ngx-mask';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CustomCellEditorComponent } from '../custom-cell-editor/custom-cell-editor.component';

interface IUpdatedCellRendererParams extends ICellRendererParams {
  isItEditAble: number;
}

@Component({
  selector: 'app-dt-edit-field',
  standalone: true,
  imports: [
    NgxMaskDirective,
    FormsModule,
    FaIconComponent,
    NgClass,
    CommonFilterIconComponent,
    CurrencyPipe
  ],
  template: `
    <div
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
      class="flex justify-between !w-full items-center gap-1"
      [style.width.px]="tableName !== 'payment_table' ? width : null"
    >
      <span>{{ amount | currency:'USD':'':'1.2-2':'en-US' }}</span>
      @if (showEditIcon && param?.isItEditAble !== 0) {
        <div
          role="presentation"
          class="flex justify-center items-center text-common-blue-color p-1 cursor-pointer"
          (click)="onEdit()"
        >
          <fa-icon class="-my-3" [icon]="faPenToSqure"></fa-icon>
        </div>
      }
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DtEditFieldComponent implements OnInit {
  private localStorageService = inject(LocalStorageService);
  private dataTableService = inject(DataTableService);

  amount: string;
  showEditIcon = false;
  faPenToSqure = faPenToSquare;
  faCheck = faCheck;
  param: IUpdatedCellRendererParams;
  width: number;
  tableName: string;
  selectedCheckStatus: ICheckStatus;
  showFilterIcon = false;

  agInit(params: IUpdatedCellRendererParams): void {
    this.param = params;
    this.amount = params.value;
    this.width = params.colDef?.minWidth as number;
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

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
      this.showEditIcon = true;
    } else {
      this.showFilterIcon = false;
      this.showEditIcon = false;
    }
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.amount,
      field: this.param.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }
}
