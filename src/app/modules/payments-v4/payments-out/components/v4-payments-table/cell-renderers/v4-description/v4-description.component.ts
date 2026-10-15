import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Pencil } from 'lucide-angular';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4CustomCellEditorComponent } from 'src/app/shared/V4/v4-dt-cellrenders/v4-custom-cell-editor/v4-custom-cell-editor.component';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';

interface IUpdatedCellRendererParams extends ICellRendererParams {
  isItEditAble: number;
  /** Display-only cell — no edit affordance, no row filter icon. */
  readOnly?: boolean;
}

@Component({
  selector: 'app-v4-description',
  template: `
    <div
      class="flex gap-1 items-center w-full"
      [style.height.px]="!description ? height : null"
      [style.width.px]="
        !param?.readOnly && (!description || tableName !== 'payment_table')
          ? width - 20
          : null
      "
    >
      @if (description) {
        <h2
          role="presentation"
          class="font-peridot"
          appEllipsisActive
          #memoText="ellipsisElement"
          [class.editable]="isEditable"
          [matTooltip]="description"
          [matTooltipDisabled]="!memoText.ellipsisActive"
          matTooltipPosition="below"
          (click)="isEditable && onEdit()"
        >
          {{ description }}
        </h2>
      } @else if (isEditable) {
        <div
          role="presentation"
          class="dt-cell-edit-btn"
          (click)="onEdit()"
        >
          <lucide-icon name="plus" [size]="12" matTooltip="Add memo"></lucide-icon>
        </div>
      }
      @if (description) {
        @if (isEditable) {
          <button
            type="button"
            class="dt-cell-edit-btn"
            aria-label="Edit memo"
            matTooltip="Edit memo"
            (click)="onEdit()"
          >
            <lucide-angular [img]="PencilIcon" [size]="12" />
          </button>
        }
        @if (!param?.readOnly) {
          <app-common-filter-icon (filterEvent)="onFilterClicked()" />
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        overflow-x: hidden;
        margin-right: 5px;
        padding: 4px 0;
      }

      /* keeps the empty-state height binding inside the host padding */
      :host > div {
        max-height: 100%;
      }

      /* min-width:0 lets the flex item shrink, so the ellipsis is the h2's own
         (and appEllipsisActive can detect it) instead of the host clipping. */
      h2 {
        text-overflow: ellipsis;
        overflow-x: hidden;
        min-width: 0;
        white-space: nowrap;
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

      /* .dt-cell-edit-btn chrome lives in ag-theme-v4.scss, shared with
         .action-icon-btn — don't re-declare it here. */
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    LucideAngularModule,
    FormsModule,
    CommonFilterIconComponent,
    EllipsisActiveDirective
  ]
})
export class V4DescriptionComponent implements OnInit {
  private localStorageService = inject(LocalStorageService);
  private dataTableService = inject(DataTableService);

  readonly PencilIcon = Pencil;

  description: string;
  showEditIcon = false;
  width: number;
  height: number;
  tableName: string;
  param: IUpdatedCellRendererParams;
  selectedCheckStatus: ICheckStatus;
  showFilterIcon = false;

  /** Read-only cells (payments-in) show the memo alone — no pencil, no filter. */
  get isEditable(): boolean {
    return !this.param?.readOnly && this.param?.isItEditAble !== 0;
  }

  agInit(params: IUpdatedCellRendererParams) {
    this.param = params;
    this.width = params.colDef?.minWidth as number;
    this.description =
      params.data?.description ?? params.data?.cheque_memo ?? params.data?.memo;
    this.height = params.node.rowHeight as number;
    this.tableName = params.colDef?.floatingFilterComponentParams?.tableName;
  }

  ngOnInit(): void {
    if (!this.param?.readOnly) {
      this.getCheckStatus();
    }
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
      colDef.cellEditor = V4CustomCellEditorComponent;
      colDef.editable = true;
      this.param.eGridCell.focus({ preventScroll: true });
      this.param.api.startEditingCell({
        rowIndex: this.param.node.rowIndex as number,
        colKey: colDef.field as string
      });
    }
  }
}
