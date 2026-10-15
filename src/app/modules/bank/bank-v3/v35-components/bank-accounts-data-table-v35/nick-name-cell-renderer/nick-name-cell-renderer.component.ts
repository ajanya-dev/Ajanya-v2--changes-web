import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IBankData } from 'src/app/models/bank';
import { NgOptimizedImage } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-nick-name-cell-renderer',
  template: `
    <div class="flex items-center gap-2">
      <span>{{ nickName }}</span>
      @if (isPositivePayEnabled) {
        <img
          ngSrc="assets/images/header/header-main-menu/positive_pay.svg"
          alt="Positive pay enabled"
          width="16"
          height="16"
          class="!w-4 !h-4"
          [matTooltip]="tooltipText"
          matTooltipPosition="below"
        />
      }
    </div>
  `,
  standalone: true,
  imports: [NgOptimizedImage, MatTooltip]
})
export class NickNameCellRendererComponent implements ICellRendererAngularComp {
  nickName: string = '';
  isPositivePayEnabled: boolean = false;
  tooltipText: string = 'This bank account is configured for Positive Pay.';

  agInit(params: ICellRendererParams): void {
    const bankData = params.data as IBankData;
    this.nickName = bankData.bank_account_nick_name || bankData.bank_account_account_name || '';
    this.isPositivePayEnabled = bankData.is_positive_pay_enabled === 1;
  }

  refresh(): boolean {
    return true;
  }
}