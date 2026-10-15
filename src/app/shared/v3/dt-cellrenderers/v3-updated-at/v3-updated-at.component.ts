import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Utils } from 'src/app/data/utils';
import { CommonModule } from '@angular/common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
@Component({
  standalone: true,
  imports: [CommonModule,CommonFilterIconComponent],
  selector: 'app-v3-updated-at',
  templateUrl: './v3-updated-at.component.html',
  styleUrls: ['./v3-updated-at.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3UpdatedAtComponent {

  private dataTableService = inject(DataTableService);


  /* Variables */
  dateUpdatedAt = '';
  timeUpdatedAt = '';
  param: ICellRendererParams<ICommonTransactionTableData>;
  showFilterIcon = false;
  disableFilter = false;
  isV4 = signal(false);

  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param params This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(params: ICellRendererParams<ICommonTransactionTableData> & { isV4?: () => string; }) {
    this.param = params;
    this.isV4.set(params.isV4?.() === 'v4');
    this.disableFilter = params.colDef?.cellRendererParams?.isPayroll;
    if (params.data?.updated_at) {
      this.dateUpdatedAt = Utils.splitDate(params?.data?.updated_at) ?? '';
      this.timeUpdatedAt = Utils.splitTime(params?.data?.updated_at) ?? '';
    } else if (
      params.colDef?.cellRendererParams?.isPayroll &&
      params?.data?.processed_date
    ) {
      this.dateUpdatedAt = Utils.splitDate(params?.data?.processed_date) ?? '';
      this.timeUpdatedAt = Utils.splitTime(params?.data?.processed_date) ?? '';
    } else if (params.data?.created_at) {
      this.dateUpdatedAt = Utils.splitDate(params?.data?.created_at) ?? '';
      this.timeUpdatedAt = Utils.splitTime(params?.data?.created_at) ?? '';
    } else if (params.data?.txnDate) {
      this.dateUpdatedAt =
        Utils.splitDate(params?.data?.txnDate as string) ?? '';
      this.timeUpdatedAt =
        Utils.splitTime(params?.data?.txnDate as string) ?? '';
    }
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.dateUpdatedAt as string,
      field: this.param?.colDef?.headerName as string,
      payee: undefined,
      isDate: true
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?:boolean){
    if(show){
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }
}
