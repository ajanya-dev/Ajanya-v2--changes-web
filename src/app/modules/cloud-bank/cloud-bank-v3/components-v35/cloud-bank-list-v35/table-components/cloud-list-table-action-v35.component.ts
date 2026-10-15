import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, inject } from '@angular/core';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { IClouListTableRow } from '../../../../model/cloudbank';
import { CloudListV35Service } from '../../../services/cloud-list-v35.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-cloud-list-table-action-v35',
  template: `
    <fa-icon
      class="cursor-pointer text-main-text-color"
      (click)="onClick()"
      [icon]="faEye"
    ></fa-icon>
  `,
  standalone: true,
  imports: [FaIconComponent]
})
export class CloudListTableActionV35Component
  implements ICellRendererAngularComp
{
  cloudListV35Service = inject(CloudListV35Service);

  faEye = faEye;
  params?: IClouListTableRow;

  agInit(params: ICellRendererParams<IClouListTableRow>): void {
    this.params = params.data;
  }

  onClick() {
    if (this.params) {
      this.cloudListV35Service.viewClickSubject = {
        accountId: this.params.account_id,
        businessName: this.params.business_name
      };
    }
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
