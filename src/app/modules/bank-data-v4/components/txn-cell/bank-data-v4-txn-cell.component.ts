import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IBankDataV4TxnRow } from '../../models/bank-data-v4-api.types';

interface ITxnCellParams extends ICellRendererParams {
  onAddRule?: (row: IBankDataV4TxnRow) => void;
  onEditCategory?: (row: IBankDataV4TxnRow) => void;
  getCategoryName?: (row: IBankDataV4TxnRow) => string;
}

const DESCRIPTION_COL = 'description_custom';
const CATEGORY_COL = 'category_id_custom';

/**
 * Cell renderer for the Description and Category columns. Branches on the column
 * id and shows the value plus an inline edit (pen) action, mirroring the v3
 * `bankDataDescriptionComponent`. The actual modal opening is delegated to the
 * tab via the `onAddRule` / `onEditCategory` callbacks passed in cellRendererParams.
 *
 * Both columns render the same shape — truncating text then an optional pen — so
 * the template is shared and the column id only decides the tooltip and which
 * callback fires.
 */
@Component({
  selector: 'app-bank-data-v4-txn-cell',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="flex items-center gap-1 w-full">
      <span
        class="min-w-0 truncate"
        [matTooltip]="tooltip"
        [matTooltipDisabled]="!tooltip"
        matTooltipPosition="after"
      >
        {{ display }}
      </span>
      @if (showAction) {
        <button
          type="button"
          class="dt-cell-edit-btn"
          [attr.aria-label]="actionTooltip"
          [matTooltip]="actionTooltip"
          (click)="onAction($event)"
        >
          <lucide-icon name="square-pen" [size]="16" />
        </button>
      }
    </div>
  `,
  styles: [
    `
      /* Fill the flex cell so the text truncates instead of overflowing and the
         pen keeps its place beside it. Chrome for .dt-cell-edit-btn lives in
         ag-theme-v4.scss, shared with .action-icon-btn — don't re-declare it. */
      :host {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
      }
    `
  ]
})
export class BankDataV4TxnCellComponent implements ICellRendererAngularComp {
  params!: ITxnCellParams;
  colId = '';
  display = '';
  tooltip = '';
  showAction = false;
  actionTooltip = '';

  agInit(params: ITxnCellParams): void {
    this.setup(params);
  }

  refresh(params: ITxnCellParams): boolean {
    this.setup(params);
    return true;
  }

  private setup(params: ITxnCellParams): void {
    this.params = params;
    this.colId = params.column?.getColId() ?? '';
    const row = (params.data ?? {}) as IBankDataV4TxnRow;

    if (this.colId === DESCRIPTION_COL) {
      this.display = (row.description_custom ||
        row.original_description ||
        '—') as string;
      this.tooltip = (row.original_description as string) || '';
      this.showAction = typeof params.onAddRule === 'function';
      this.actionTooltip = 'Create a processing rule from this description';
    } else if (this.colId === CATEGORY_COL) {
      this.display = params.getCategoryName?.(row) ?? '';
      this.tooltip = this.display;
      // Only a categorised row has something to rename.
      this.showAction =
        Boolean(this.display) && typeof params.onEditCategory === 'function';
      this.actionTooltip = 'Rename this category';
    }
  }

  onAction(event: MouseEvent): void {
    event.stopPropagation();
    const row = this.params.data as IBankDataV4TxnRow;
    if (this.colId === DESCRIPTION_COL) {
      this.params.onAddRule?.(row);
    } else if (this.colId === CATEGORY_COL) {
      this.params.onEditCategory?.(row);
    }
  }
}
