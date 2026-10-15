import { ICellRendererParams } from '@ag-grid-community/core';
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilterList } from '@fortawesome/pro-solid-svg-icons';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';

interface IExtendedCellRendererParams extends ICellRendererParams {
  type: string;
}

@Component({
  selector: 'app-dt-cell-filter',
  standalone: true,
  imports: [FontAwesomeModule, NgOptimizedImage, MatTooltip],
  templateUrl: './dt-cell-filter.component.html',
  styleUrl: './dt-cell-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DtCellFilterComponent {
  private dataTableService = inject(DataTableService);
  private headerService = inject(HeaderService);

  param: IExtendedCellRendererParams;
  cellValue: string;
  createdTime: string;
  faFilterList = faFilterList;
  showFilterIcon = false;
  width: number;
  /**
   * When the `enterprise-wiygul` plugin is on, the QuickBooks export badge sits
   * to the left of the payee name instead of the right.
   */
  isQbIconOnLeft = false;

  agInit(params: IExtendedCellRendererParams) {
    this.param = params;
    this.width = (params.colDef?.minWidth ?? 0) + 30 || 100;
    this.setCellValue(params.type);

    // Read the already-loaded header snapshot; no extra request per cell.
    const headerData = this.headerService._headerData.value;
    this.isQbIconOnLeft =
      !!headerData &&
      (headerData.enabledPlugins?.includes('enterprise-wiygul') ?? false);
  }

  /**
   * @description Sets the cell value based on the cell type.
   * @param {string} type - The type of cell data.
   */
  setCellValue(type: string): void {
    switch (type) {
      case 'payee':
        this.cellValue = this.param.value;
        break;
      case 'bank':
        this.cellValue =
          this.param?.value ?? this.param.data.bank_account_nick_name;
        break;
      case 'date':
        {
          const createdDate = this.param?.data?.created_at;
          if (createdDate) {
            const [date, time] = createdDate.toString().split('_');
            this.cellValue = date;
            this.createdTime = time;
          }
        }
        break;
      default:
        break;
    }
  }

  /**
   * @description Handles the filter icon click event.
   */
  onFilterClicked(): void {
    let filteredValue = '';
    let payee;
    const filterColName = this.param.type;
    switch (filterColName) {
      case 'payee':
        filteredValue = this.param.data?.payee_id as string;
        payee = {
          name: this.param.data?.payee_name as string,
          nickName: this.param.data?.payee_nick_name as string
        } as IPayeeDropdown;
        break;
      case 'bank':
        filteredValue = this.param.data?.bank_account_nick_name as string;
        break;
      case 'date':
        filteredValue = this.param.data?.created_at as string;
        break;
      default:
        break;
    }
    const cellValue = {
      filter: filteredValue,
      field:
        this.param.type === 'date'
          ? (this.param.colDef?.headerName as string)
          : filterColName,
      payee: payee ?? undefined,
      isDate: this.param.type === 'date'
    };

    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }
}
