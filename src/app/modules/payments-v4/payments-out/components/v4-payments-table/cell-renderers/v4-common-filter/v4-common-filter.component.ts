import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';

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
  splitDateTime?: boolean;
  fieldValue: string;
}

@Component({
  selector: 'app-v4-dt-common-filter',
  standalone: true,
  imports: [
    CommonFilterIconComponent,
    CurrencyPipe,
    MatTooltipModule,
    EllipsisActiveDirective
  ],
  providers: [TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center w-full gap-1"
      [class.gap-1]="!param?.isAmountField"
      [class.v4-amount-cell]="!!param?.isAmountField"
    >
      @if (param?.splitDateTime && dateTimePart) {
        <span class="dt-stacked">
          <span class="dt-stacked__date">{{ datePart }}</span>
          <span class="dt-stacked__time">{{ dateTimePart }}</span>
        </span>
      } @else if (!param?.isAmountField) {
        <span
          class="text-ellipsis overflow-x-hidden"
          appEllipsisActive
          #textCell="ellipsisElement"
          [matTooltip]="formattedText ? formattedText : rowText"
          [matTooltipDisabled]="!textCell.ellipsisActive"
          matTooltipPosition="above"
        >
          {{ formattedText ? formattedText : rowText }}
        </span>
      } @else {
        <span class="text-ellipsis overflow-x-hidden text-end">
          {{ rowText | currency }}
        </span>
      }
      @if (formattedText || rowText) {
        <app-common-filter-icon
          class="amount-filter"
          (filterEvent)="onFilterClicked()"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        min-width: 0;
      }

      :host > div {
        min-width: 0;
      }

      .v4-amount-cell {
        justify-content: flex-end;
        gap: 4px;
      }

      .v4-amount-cell .amount-filter {
        /* Left of the right-aligned value — a value span at natural width
           leaves its free space on the left, so the icon expands into it and
           the number never shifts or gets covered. */
        order: -1;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transform: translateX(-8px);
        transition:
          max-width 0.15s ease,
          opacity 0.15s ease,
          transform 0.15s ease;
      }

      .v4-amount-cell:hover .amount-filter {
        max-width: 26px;
        opacity: 1;
        transform: none;
        transition-delay: 0.4s;
      }

      .dt-stacked {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
        white-space: nowrap;
        line-height: 1.25;
      }

      .dt-stacked__date {
        color: var(--v4-main-text-color);
      }

      .dt-stacked .dt-stacked__time {
        color: var(--v4-secondary-text-color);
        font-size: 10px;
      }
    `
  ]
})
export class V4DTCommonFilterComponent {
  private dataTableService = inject(DataTableService);
  private titleCasePipe = inject(TitleCasePipe);
  private datePipe = inject(DatePipe);

  param: IExtendedCellRendererParams;
  textField = '';
  rowText: string;
  formattedText: string = '';
  datePart = '';
  dateTimePart = '';
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
      if (params?.splitDateTime) {
        this.setStackedDateTime();
      }
      if (this.rowText) {
        return;
      }
    }

    if (params.valueFormatted) {
      this.formattedText = params.valueFormatted;
      return;
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
    if (params?.splitDateTime) {
      this.setStackedDateTime();
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

  private setStackedDateTime(): void {
    const raw = String(this.rowText ?? this.param?.value ?? '');
    const [date, time] = raw.includes('_')
      ? raw.split('_')
      : raw.split(/\s+(?=\d{1,2}:)/);
    this.datePart = (date ?? '').trim();
    this.dateTimePart = (time ?? '')
      .trim()
      .replace(/am/gi, 'AM')
      .replace(/pm/gi, 'PM');
    if (this.dateTimePart) {
      this.formattedText = '';
    }
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
}
