import { Component, DestroyRef, HostBinding, inject } from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ISelectBoxFilterArray } from 'src/app/models/v3-datatable';

interface IAmountRangeFilterParams extends IFloatingFilterParams {
  placeholder?: string;
  allowNegative?: boolean;
  decimalPlaces?: number;
  minLabel?: string;
  maxLabel?: string;
  clearLabel?: string;
  applyLabel?: string;
  tableName?: string;
  tableId?: number;
}

@Component({
  selector: 'app-v4-amount-range-floating-filter',
  templateUrl: './v4-amount-range-floating-filter.component.html',
  standalone: true,
  imports: [FormsModule, NgClass, OverlayModule]
})
export class V4AmountRangeFloatingFilterComponent {
  @HostBinding('class') hostClass = 'w-full';
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  params: IAmountRangeFilterParams;
  fieldName = '';
  isOpen = false;
  hasActiveFilter = false;
  minValue = '';
  maxValue = '';
  displayText = 'Amount range...';
  placeholder = 'Amount range...';
  minLabel = 'Min Amount';
  maxLabel = 'Max Amount';
  clearLabel = 'Clear';
  applyLabel = 'Apply';

  private allowNegative = false;
  private decimalPlaces = 2;

  overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4
    }
  ];

  agInit(params: IAmountRangeFilterParams): void {
    this.params = params;
    this.fieldName = params.column.getColId();
    this.placeholder = params.placeholder ?? 'Amount range...';
    this.displayText = this.placeholder;
    this.allowNegative = params.allowNegative ?? false;
    this.decimalPlaces = params.decimalPlaces ?? 2;
    this.minLabel = params.minLabel ?? 'Min Amount';
    this.maxLabel = params.maxLabel ?? 'Max Amount';
    this.clearLabel = params.clearLabel ?? 'Clear';
    this.applyLabel = params.applyLabel ?? 'Apply';

    this.v3DataTableService.switchPaymentTableTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.clearRange();
      });
  }

  onParentModelChanged(): void {}

  validateInput(event: Event, field: 'min' | 'max'): void {
    const input = event.target as HTMLInputElement;
    const { value } = input;

    const negativePattern = this.allowNegative ? '-?' : '';
    const decimalPattern =
      this.decimalPlaces > 0 ? `\\.?\\d{0,${this.decimalPlaces}}` : '';
    const pattern = new RegExp(`^${negativePattern}\\d*${decimalPattern}$`);

    if (value !== '' && value !== '-' && !pattern.test(value)) {
      if (field === 'min') {
        input.value = this.minValue;
      } else {
        input.value = this.maxValue;
      }
    }
  }

  applyRange(): void {
    const minNum = parseFloat(this.minValue);
    const maxNum = parseFloat(this.maxValue);
    const hasMin = this.minValue.trim() !== '' && !Number.isNaN(minNum);
    const hasMax = this.maxValue.trim() !== '' && !Number.isNaN(maxNum);

    if (hasMin || hasMax) {
      const filterValue = `amountRange:${hasMin ? minNum : ''}|${hasMax ? maxNum : ''}`;
      const filter: ISelectBoxFilterArray = {
        [this.fieldName]: {
          filter: filterValue,
          filterType: 'text',
          type: 'contains'
        }
      };
      this.v3DataTableService.updateV3DataTable = filter;
      this.hasActiveFilter = true;
      this.updateDisplayText(hasMin, hasMax, minNum, maxNum);
    } else {
      this.clearRange();
    }
    this.isOpen = false;
  }

  clearRange(): void {
    this.minValue = '';
    this.maxValue = '';
    this.hasActiveFilter = false;
    this.displayText = this.placeholder;
    this.v3DataTableService.updateV3DataTableByRemovingFilter = [
      this.fieldName
    ];
    this.isOpen = false;
  }

  private updateDisplayText(
    hasMin: boolean,
    hasMax: boolean,
    minNum: number,
    maxNum: number
  ): void {
    if (hasMin && hasMax) {
      this.displayText = `$${minNum} - $${maxNum}`;
    } else if (hasMin) {
      this.displayText = `>= $${minNum}`;
    } else if (hasMax) {
      this.displayText = `<= $${maxNum}`;
    }
  }
}
