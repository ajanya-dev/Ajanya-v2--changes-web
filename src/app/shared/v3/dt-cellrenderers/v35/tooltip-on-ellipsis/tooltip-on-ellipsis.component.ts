import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';

/**
 * @description Use this in the cellRenderer to show tooltip only when ellipsis is shown.
 */

@Component({
  standalone: true,
  imports: [MatTooltipModule, EllipsisActiveDirective],
  selector: 'app-tooltip-on-ellipsis',
  template: `
    <div
      class="truncate"
      #htmlElement="ellipsisElement"
      appEllipsisActive
      [matTooltipDisabled]="!htmlElement.ellipsisActive"
      [matTooltip]="description ? description : ''"
      matTooltipPosition="after"
    >
      {{ description ? description : '' }}
    </div>
  `,
  styles: [
    `
      :host {
        overflow-x: hidden;
        margin-right: 5px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipOnEllipsisComponent {
  description: string;
  headerName: string;

  agInit(params: ICellRendererParams) {
    this.description = params.data[params.colDef?.field ?? ''] || '';
    this.headerName = params.colDef?.headerName as string;
  }
}
