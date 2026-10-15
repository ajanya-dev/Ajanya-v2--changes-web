import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, inject } from '@angular/core';
import { IClouListTableRow } from '../../../../model/cloudbank';
import { CloudListV35Service } from '../../../services/cloud-list-v35.service';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-cloud-list-table-action-v35',
  template: `
    <div
      [matTooltip]="
        (params?.value ?? '').length > 20 ? params?.value ?? '' : ''
      "
      style="display: flex; gap: 8px;"
    >
      {{ params?.value ?? '' | truncate: 20 }}
    </div>
  `,
  standalone: true,
  imports: [MatTooltip, TruncatePipe]
})
export class CloudListTableBusinessNameV35Component
  implements ICellRendererAngularComp
{
  cloudListV35Service = inject(CloudListV35Service);

  params?: ICellRendererParams<IClouListTableRow, string>;

  agInit(params: ICellRendererParams<IClouListTableRow>): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
