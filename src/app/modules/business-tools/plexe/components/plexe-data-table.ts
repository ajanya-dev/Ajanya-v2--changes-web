import { ICellRendererParams } from '@ag-grid-community/core';
import { Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  template: `
    <span
      [matTooltip]="params.value"
      class="custom-tooltip"
      [matTooltipDisabled]="params.value.length <= 15"
    >
      {{ params.value }}
    </span>
  `,
  styles: [
    `
      .custom-tooltip.mat-mdc-tooltip {
        white-space: pre-wrap;
      }
    `
  ],
  standalone: true,
  imports: [MatTooltip]
})
export class CustomToolTipCellRendererComponent {
  params: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
