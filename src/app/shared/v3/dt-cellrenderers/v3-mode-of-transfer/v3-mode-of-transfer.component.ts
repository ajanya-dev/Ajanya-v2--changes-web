import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  standalone: true,
  imports: [CommonModule,CommonFilterIconComponent],
  selector: 'app-v3-mode-of-transfer',
  templateUrl: './v3-mode-of-transfer.component.html',
  styleUrls: ['./v3-mode-of-transfer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3ModeOfTransferComponent {
  private dataTableService = inject(DataTableService);

  /* Variables */
  commonTransactionTableRowData: ICommonTransactionTableData;
  dynamicColorScheme = '';
  showFilterIcon = false;
  param: ICellRendererParams;
  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param params This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(params: ICellRendererParams<ICommonTransactionTableData>) {
    this.param = params;
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
      this.dynamicColorScheme =
        this.commonTransactionTableRowData.transfer_type_code;
    }
  }

  capitalizeFirstLetters(word: string) {
    if (!word) {
      return undefined;
    }
    return word
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  onFilterClicked(): void {
    const cellValue = {
      filter:
        (this.capitalizeFirstLetters(
          this.commonTransactionTableRowData?.transfer_mode
        ) as string) ||
        (this.capitalizeFirstLetters(
          this.commonTransactionTableRowData?.transfer_type
        ) as string),
      field: this.param.colDef?.headerName as string,
      payee: undefined
    };
    if (
      this.commonTransactionTableRowData?.transfer_type === 'ACH' ||
      this.commonTransactionTableRowData?.transfer_mode === 'ACH'
    ) {
      cellValue.filter = 'ACH';
    }

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
