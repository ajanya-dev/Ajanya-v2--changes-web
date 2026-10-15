import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, inject } from '@angular/core';
import { faBuildingColumns } from '@fortawesome/pro-solid-svg-icons';
import { IClouListTableRow } from '../../../../model/cloudbank';
import { CloudListV35Service } from '../../../services/cloud-list-v35.service';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
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
      <div
        class="rounded-full w-8 h-8 text-center bg-common-secondary-green-color text-common-green-color flex justify-center items-center"
      >
        <fa-icon [icon]="faBuildingColumns"></fa-icon>
      </div>
      {{ params?.value ?? '' | truncate: 20 }}
    </div>
  `,
  standalone: true,
  imports: [MatTooltip, FaIconComponent, TruncatePipe]
})
export class CloudListTableAccountNameV35Component
  implements ICellRendererAngularComp
{
  cloudListV35Service = inject(CloudListV35Service);

  faBuildingColumns = faBuildingColumns;
  params?: ICellRendererParams<IClouListTableRow, string>;

  agInit(params: ICellRendererParams<IClouListTableRow>): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
