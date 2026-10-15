import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';
import { Integration } from 'src/app/data/data/integration';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

interface IExtendedCellRenderer extends ICellRendererParams {
  payeeField?: 'string';
  hideFilter?: boolean;
}

export interface IThirdPartyAppsData {
  name: string;
  image: string;
  width: string;
  height: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    CommonFilterIconComponent,
    EllipsisActiveDirective,
    NgOptimizedImage
  ],
  selector: 'app-v4-payee-name',
  templateUrl: './v4-payee-name.component.html',
  styleUrls: ['./v4-payee-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4PayeeNameComponent {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  payeeName: string;
  isImportedFromThirdParty: boolean;
  thirdPartyApp: IThirdPartyAppsData | undefined;
  thirdPartyData: IThirdPartyAppsData[] = Integration.thirdPartyImportData();
  isHideFilter = false;
  param: IExtendedCellRenderer;
  payeeNickName: string;

  /**
   * This function is called on initialisation of the floating component.
   * @param agGridCellRendererParams This contains the row data
   * we are getting from the backend.
   */
  agInit(agGridCellRendererParams: IExtendedCellRenderer) {
    this.param = agGridCellRendererParams;
    this.payeeName = agGridCellRendererParams.value;
    this.isHideFilter = agGridCellRendererParams?.hideFilter as boolean;
    this.payeeNickName = agGridCellRendererParams.data?.payee_nick_name;

    const thirdPartyName = agGridCellRendererParams.data.third_party_name;
    const isNotEmptyThirdParty =
      !!thirdPartyName && thirdPartyName !== 'Hamaspik';

    this.isImportedFromThirdParty = isNotEmptyThirdParty;

    if (this.isImportedFromThirdParty) {
      this.thirdPartyApp = this.thirdPartyData.find(
        (app) => app.name === thirdPartyName
      );
      if (!this.thirdPartyApp) {
        this.isImportedFromThirdParty = false;
      }
    }
  }

  onFilterClicked(): void {
    let payeeId;
    if (this.param?.payeeField) {
      payeeId = this.param.data?.[this.param?.payeeField];
    } else {
      payeeId = this.param.data?.payee_id as string;
    }

    const payee: IPayeeDropdown = {
      id: payeeId as string,
      name: this.param.data?.payee_name as string,
      nickName: this.param.data?.payee_nick_name as string
    };

    const cellValue = {
      filter: payeeId as string,
      field: 'payee',
      payee: payee ?? undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }
}
