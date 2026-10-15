import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IStatus } from 'src/app/models/wallet';
import { WalletDataService } from 'src/app/modules/wallet/wallet-v3/services/wallet-data.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

/**
 * "Type of Transfer" cell — the abbreviated transfer code (W/F, BNK TNSFR, …)
 * with the full name on hover.
 *
 * v4 twin of `V3WalletTransactionTypeComponent`. The abbreviation alone is
 * unreadable, so the tooltip is required, not decorative. The filter icon
 * publishes the *full* name under the `subject_type_short_name` field, because
 * that is the pair `V4WalletTransactionTypeFloatingFilterComponent` matches on
 * to resolve a `subject_type` id.
 */
@Component({
  standalone: true,
  selector: 'app-v4-wallet-transfer-type',
  imports: [MatTooltipModule, CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1 w-full">
      <span
        class="transfer-type"
        [matTooltip]="walletSubject?.name ?? ''"
        [matTooltipDisabled]="!walletSubject?.name"
        matTooltipPosition="after"
      >
        {{ walletSubject?.short_name ?? '' }}
      </span>
      @if (walletSubject?.name) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  styles: [
    `
      .transfer-type {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `
  ]
})
export class V4WalletTransferTypeComponent {
  private walletDataService = inject(WalletDataService);
  private dataTableService = inject(DataTableService);

  walletSubject?: IStatus;

  agInit(params: ICellRendererParams): void {
    this.walletSubject = this.walletDataService?.walletTransactionTypes?.find(
      (data) => data?.subject_type === params.data?.subject_type
    );
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.walletSubject?.name as string,
      field: 'subject_type_short_name',
      payee: undefined
    });
  }
}
