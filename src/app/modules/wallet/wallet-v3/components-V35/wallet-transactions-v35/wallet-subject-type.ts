import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { IStatus } from 'src/app/models/wallet';
import { WalletDataService } from '../../services/wallet-data.service';

@Component({
  selector: 'app-v3-wallet-subject-type',
  template: `
    <span
      [matTooltip]="walletSubject?.name ? walletSubject?.name : ''"
      matTooltipPosition="after"
    >
      {{ walletSubject?.short_name ? walletSubject?.short_name : '' }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatTooltip]
})
export class V3WalletTransactionTypeComponent {
  private walletDataService = inject(WalletDataService);
  walletSubject: IStatus;
  param: ICellRendererParams;
  agInit(params: ICellRendererParams) {
    if (params) {
      this.walletSubject = this.walletDataService?.walletTransactionTypes.find(
        (data) => data?.subject_type === params.data?.subject_type
      ) as IStatus;
    }
  }
}
