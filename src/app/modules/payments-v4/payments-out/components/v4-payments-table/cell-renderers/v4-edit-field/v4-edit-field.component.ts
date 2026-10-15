import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Pencil } from 'lucide-angular';
import { V4CustomCellEditorComponent } from 'src/app/shared/V4/v4-dt-cellrenders/v4-custom-cell-editor/v4-custom-cell-editor.component';

interface IUpdatedCellRendererParams extends ICellRendererParams {
  isItEditAble: number;
}

@Component({
  selector: 'app-v4-edit-field',
  standalone: true,
  imports: [
    FormsModule,
    CommonFilterIconComponent,
    CurrencyPipe,
    MatTooltip,
    LucideAngularModule
  ],
  template: `
    <div
      class="v4-amount-cell"
      [style.width.px]="tableName !== 'payment_table' ? width : null"
    >
      <span
        role="presentation"
        class="font-semibold text-v4-main-text-color"
        [class.editable]="param?.isItEditAble !== 0"
        [matTooltip]="param?.isItEditAble !== 0 ? 'Edit amount' : ''"
        (click)="param?.isItEditAble !== 0 && onEdit()"
        >{{ amount | currency: 'USD' : 'symbol' : '1.2-2' : 'en-US' }}</span
      >
      @if (param?.isItEditAble !== 0) {
        <span class="hover-action">
          <button
            class="dt-cell-edit-btn"
            type="button"
            aria-label="Edit amount"
            matTooltip="Edit amount"
            (click)="onEdit()"
          >
            <lucide-angular [img]="PencilIcon" [size]="12" />
          </button>
        </span>
      }
      <app-common-filter-icon
        class="hover-action"
        (filterEvent)="onFilterClicked()"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
      }

      /* Amount sits flush right; nothing else reserves width next to it. */
      .v4-amount-cell {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: 100%;
        gap: 0;
        transition: gap 0.15s ease;
      }

      .v4-amount-cell:hover {
        gap: 4px;
        transition-delay: 0.4s;
      }

      /* Dashed underline at rest; hover only highlights it. */
      .editable {
        cursor: pointer;
        text-decoration: underline dashed;
        text-decoration-color: var(--v4-border-color);
        text-underline-offset: 4px;
      }

      .editable:hover {
        text-decoration-color: var(--v4-primary-brand-color);
      }

      .hover-action {
        display: inline-flex;
        align-items: center;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transform: translateX(8px);
        transition:
          max-width 0.15s ease,
          opacity 0.15s ease,
          transform 0.15s ease;
      }

      .v4-amount-cell:hover .hover-action {
        max-width: 26px;
        opacity: 1;
        transform: none;
        transition-delay: 0.4s;
      }

      /* Same ghost icon-button chrome as app-common-filter-icon's .dt-filter-btn. */
      .amount-edit-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        padding: 0;
        border: none;
        border-radius: var(--radius-sm);
        background-color: transparent;
        color: var(--v4-tertiary-text-color);
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          color 0.15s ease;
      }

      .amount-edit-btn:hover {
        background-color: color-mix(
          in srgb,
          var(--v4-primary-brand-color) 10%,
          transparent
        );
        color: var(--v4-primary-brand-color);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4EditFieldComponent implements OnInit {
  private localStorageService = inject(LocalStorageService);
  private dataTableService = inject(DataTableService);

  readonly PencilIcon = Pencil;

  amount: string;
  showEditIcon = false;
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
      colDef.cellEditor = V4CustomCellEditorComponent;
      colDef.editable = true;
      this.param.eGridCell.focus({ preventScroll: true });
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
