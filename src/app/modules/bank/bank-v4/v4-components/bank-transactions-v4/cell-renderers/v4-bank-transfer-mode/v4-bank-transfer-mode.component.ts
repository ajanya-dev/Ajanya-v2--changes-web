import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

/**
 * Read-only "Mode of Transfer" cell for the bank-account transactions grid.
 *
 * Payments-out's `V4PaymentTypeComponent` is the editable twin of this cell — it
 * opens a payment-type dropdown and PATCHes the payment. Bank transactions are
 * historical, so this keeps the same v4 typography with none of that: plain
 * 12px peridot text (v2.1 dropped the coloured chip the v3 renderer still
 * draws), no dashed underline — that affordance means "editable" — plus the
 * shared hover filter icon.
 */
@Component({
  standalone: true,
  selector: 'app-v4-bank-transfer-mode',
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1 w-full">
      <span class="transfer-mode">{{ transferMode }}</span>
      @if (transferMode) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  styles: [
    `
      .transfer-mode {
        font-family: var(--font-peridot);
        font-size: 12px;
        font-weight: 400;
        color: var(--v4-main-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `
  ]
})
export class V4BankTransferModeComponent {
  private dataTableService = inject(DataTableService);

  transferMode = '';

  private param: ICellRendererParams<ICommonTransactionTableData>;
  private rawMode = '';

  agInit(params: ICellRendererParams<ICommonTransactionTableData>) {
    this.param = params;
    this.rawMode = params.data?.transfer_mode || params.data?.transfer_type || '';
    this.transferMode = this.isAcronym(this.rawMode)
      ? this.rawMode.toUpperCase()
      : this.capitalizeFirstLetters(this.rawMode);
  }

  /** Acronyms must stay fully capitalised — title case mangles them. */
  private isAcronym(value: string) {
    return /^(ach|rtp)$/i.test(value.trim());
  }

  private capitalizeFirstLetters(value: string) {
    return value
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * The server filters on the display casing the floating-filter dropdown
   * offers ("Check", "Mail Check", …), with ACH as the one uppercase value —
   * same contract the v3 renderer honoured.
   */
  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.isAcronym(this.rawMode)
        ? this.rawMode.toUpperCase()
        : this.capitalizeFirstLetters(this.rawMode),
      field: this.param.colDef?.headerName as string,
      payee: undefined
    });
  }
}
