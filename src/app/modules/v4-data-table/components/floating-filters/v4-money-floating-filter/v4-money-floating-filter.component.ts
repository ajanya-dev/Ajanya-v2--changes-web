import { Component, DestroyRef, HostBinding, inject } from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ISelectBoxFilterArray } from 'src/app/models/v3-datatable';

interface IMoneyFilterParams extends IFloatingFilterParams {
  placeholder?: string;
  filterType?: 'contains' | 'equals' | 'greaterThan' | 'lessThan' | 'inRange';
  allowNegative?: boolean;
  decimalPlaces?: number;
  debounceMs?: number;
  tableName?: string;
  tableId?: number;
}

@Component({
  selector: 'app-v4-money-floating-filter',
  templateUrl: './v4-money-floating-filter.component.html',
  standalone: true,
  imports: [LucideAngularModule]
})
export class V4MoneyFloatingFilterComponent {
  @HostBinding('class') hostClass = 'w-full';
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  params: IMoneyFilterParams;
  currentValue: string | null = null;
  fieldName = '';
  placeholder = 'Enter amount...';
  filterType = 'contains';

  allowNegative = true;
  decimalPlaces = 2;

  private inputSubject = new Subject<string>();

  agInit(params: IMoneyFilterParams): void {
    this.params = params;
    this.fieldName = params.column.getColId();
    this.placeholder = params.placeholder ?? 'Enter amount...';
    this.filterType = params.filterType ?? 'contains';
    this.allowNegative = params.allowNegative ?? true;
    this.decimalPlaces = params.decimalPlaces ?? 2;

    const debounceMs = params.debounceMs ?? 500;

    this.inputSubject
      .pipe(debounceTime(debounceMs), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.applyFilter(value);
      });

    this.v3DataTableService.switchPaymentTableTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.currentValue = null;
      });
  }

  onParentModelChanged(): void {}

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value } = input;

    const negativePattern = this.allowNegative ? '-?' : '';
    const decimalPattern =
      this.decimalPlaces > 0 ? `\\.?\\d{0,${this.decimalPlaces}}` : '';
    const pattern = new RegExp(`^${negativePattern}\\d*${decimalPattern}$`);

    if (value === '' || value === '-' || pattern.test(value)) {
      this.currentValue = value || null;

      if (value === '' || (!Number.isNaN(parseFloat(value)) && value !== '-')) {
        this.inputSubject.next(value);
      }
    } else {
      // Revert invalid input
      input.value = this.currentValue ?? '';
    }
  }

  onEnter(): void {
    // Cancel debounce and apply immediately
    this.inputSubject.next('__cancel__');
    this.applyFilter(this.currentValue ?? '');
  }

  private applyFilter(value: string): void {
    if (value === '__cancel__') return;

    if (!value || value.trim() === '' || value === '-') {
      this.v3DataTableService.updateV3DataTableByRemovingFilter = [
        this.fieldName
      ];
      return;
    }

    const filter: ISelectBoxFilterArray = {
      [this.fieldName]: {
        filter: value.trim(),
        filterType: 'text',
        type: this.filterType
      }
    };
    this.v3DataTableService.updateV3DataTable = filter;
  }

  clearFilter(): void {
    this.currentValue = null;
    this.v3DataTableService.updateV3DataTableByRemovingFilter = [
      this.fieldName
    ];
  }
}
