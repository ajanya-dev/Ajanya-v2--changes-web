import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltip } from '@angular/material/tooltip';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';

/**
 * @description Single-line cell that clips with "..." and only shows a tooltip
 * with the full value when the text actually overflows the column.
 */
@Component({
  selector: 'app-api-log-truncated-cell-v4',
  standalone: true,
  imports: [MatTooltip, EllipsisActiveDirective],
  styles: [
    `
      /* The v4 grid cell is a flex-col with align-items:center, which sizes
         this host to its content width; pin it to the cell so truncate works. */
      :host {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
      }

      ::ng-deep .v4-truncated-cell-tooltip {
        max-width: 420px;
        white-space: normal;
        word-break: break-all;
        font-size: 12px;
      }
    `
  ],
  template: `
    <span
      class="block w-full truncate"
      appEllipsisActive
      #cell="ellipsisElement"
      [matTooltip]="value"
      [matTooltipDisabled]="!cell.ellipsisActive"
      matTooltipClass="v4-truncated-cell-tooltip"
      >{{ value }}</span
    >
  `
})
export class ApiLogTruncatedCellV4Component implements ICellRendererAngularComp {
  value = '';

  agInit(params: ICellRendererParams): void {
    this.value = params.value == null ? '' : String(params.value);
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}
