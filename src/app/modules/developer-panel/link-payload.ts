import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-v3-payload-developer-panel',
  template: `
    <h2
      [matTooltip]="requestBody ? requestBody : ''"
      matTooltipPosition="after"
    >
      {{ requestBody ? requestBody : '' }}
    </h2>
  `,
  styles: [
    `
      :host {
        overflow-x: hidden;
        margin-right: 5px;
      }

      h2 {
        text-overflow: ellipsis;
        overflow-x: hidden;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatTooltip]
})
export class V3PayloadComponent {
  requestBody: string;

  agInit(params: ICellRendererParams) {
    const payload = params.data?.request_body;
    if (Array.isArray(JSON.stringify(payload))) {
      this.requestBody = '';
    } else {
      this.requestBody = JSON.stringify(payload);
    }
  }
}
