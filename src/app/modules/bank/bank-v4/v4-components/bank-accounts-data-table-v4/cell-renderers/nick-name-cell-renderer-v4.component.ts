import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IBankData } from 'src/app/models/bank';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-nick-name-cell-renderer-v4',
  template: `
    <div class="flex items-center gap-2">
      <span>{{ nickName }}</span>
      @if (isPositivePayEnabled) {
        <lucide-icon
          name="banknote"
          [size]="16"
          class="text-v4-common-green-color"
          [matTooltip]="tooltipText"
          matTooltipPosition="below"
        />
      }
    </div>
  `,
  standalone: true,
  imports: [MatTooltip, LucideAngularModule]
})
export class NickNameCellRendererV4Component
  implements ICellRendererAngularComp
{
  nickName: string = '';
  isPositivePayEnabled: boolean = false;
  tooltipText: string = 'This bank account is configured for Positive Pay.';

  agInit(params: ICellRendererParams): void {
    const bankData = params.data as IBankData;
    this.nickName =
      bankData.bank_account_nick_name || bankData.bank_account_account_name || '';
    this.isPositivePayEnabled = bankData.is_positive_pay_enabled === 1;
  }

  refresh(): boolean {
    return true;
  }
}
