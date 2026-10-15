import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonFilterIconComponent } from '../../components/common-filter-icon/common-row-filter.component';

interface IExtendedCellRendererParams extends ICellRendererParams {
  type: string;
  filterField: string;
  isFormatDate?: boolean;
  suffixOptionalField?: string;
  prefixOptionalField?: string;
  isAmountField?: string;
  isApplyTitleCase?: boolean;
  isPipeDate?: boolean;
  isFormatDateWithHyphen?: boolean;
  fieldValue: string;
}

@Component({
  selector: 'app-v3-dt-common-filter',
  standalone: true,
  imports: [FaIconComponent, CommonFilterIconComponent, CurrencyPipe],
  providers: [TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
    @if(!param?.isAmountField){
      <span class="text-ellipsis overflow-x-hidden">
        {{ formattedText ? formattedText : rowText }}
      </span>
    } @else {
      <span class="text-ellipsis overflow-x-hidden">
        {{ rowText | currency}}
      </span> 
    }
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class V3DTCommonFilterComponent {
  private dataTableService = inject(DataTableService);
  private titleCasePipe = inject(TitleCasePipe);
  private datePipe = inject(DatePipe);

  param: IExtendedCellRendererParams;
  showFilterIcon = false;
  textField = '';
  rowText: string;
  formattedText: string = '';
  dataType: string = '';
  searchValue: string = '';

  agInit(params: IExtendedCellRendererParams) {
    this.dataType = params?.type;
    this.param = params;
    let colId = '';
    if (params?.fieldValue) {
      this.rowText = params.fieldValue;
      return;
    }
    if (params?.filterField) {
      colId = params?.filterField;
    } else {
      colId = params.column?.getColId() as string;
    }

    this.textField = colId.split('.')[
      (colId.split('.').length ?? 0) - 1
    ] as string;

    if (params?.prefixOptionalField) {
      this.rowText = params.data
        ? params.data[params.prefixOptionalField]
        : undefined;

      if (this.param?.isApplyTitleCase) {
        this.applyTitleCase();
      }
      if (params?.isFormatDateWithHyphen) {
        this.formattedText = this.formatDateWithHyphen();
      }
      if (this.rowText) {
        return;
      }
    }

    this.rowText = params.data ? params.data[this.textField] : undefined;
    if (!this.rowText && params?.suffixOptionalField) {
      this.rowText = params.data
        ? params.data[params.suffixOptionalField]
        : undefined;
    }
    if (params?.isFormatDate) {
      const splittedDate = params.data[this.textField].split('_');
      this.formattedText = `${splittedDate[0]} (${splittedDate[1]})`;
    }
    if (params?.isPipeDate) {
      this.formattedText = this.datePipe.transform(
        this.rowText,
        'MM/dd/yyyy'
      ) as string;
    }

    if (params?.isFormatDateWithHyphen) {
      this.formattedText = this.formatDateWithHyphen();
    }
    this.applyTitleCase();
  }

  applyTitleCase() {
    if (this.param?.isApplyTitleCase) {
      this.rowText = this.titleCasePipe.transform(this.rowText ?? '');
    }
  }

  formatDateWithHyphen(): string {
    const [date, time] = this.rowText.toString().split('_');
    return `${date}- ${time?.replace(/am/gi, 'AM').replace(/pm/gi, 'PM')}`;
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.searchValue ? this.searchValue : this.rowText,
      field: this.param.colDef?.headerName as string,
      payee: undefined,
      isDate: this.dataType === 'date',
      isBank: this.dataType === 'bank'
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }
}
