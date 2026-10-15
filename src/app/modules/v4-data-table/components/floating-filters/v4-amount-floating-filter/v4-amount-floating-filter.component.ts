import {
  Component,
  DestroyRef,
  HostBinding,
  inject,
  OnInit
} from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ISelectBoxFilterArray } from 'src/app/models/v3-datatable';

interface IAmountFilterParams extends IFloatingFilterParams {
  placeholder?: string;
  filterType?: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  tableName?: string;
  tableId?: number;
}

@Component({
  selector: 'app-v4-amount-floating-filter',
  templateUrl: './v4-amount-floating-filter.component.html',
  standalone: true,
  imports: [LucideAngularModule, FaIconComponent]
})
export class V4AmountFloatingFilterComponent implements OnInit {
  @HostBinding('class') hostClass = 'w-full';
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  params: IAmountFilterParams;
  currentValue: string | null = null;
  fieldName = '';
  placeholder = '0.00';
  filterType = 'equals';
  faCircleXmark = faCircleXmark;
  private cellValue$ = toObservable(
    this.dataTableService.selectedCellValueSignal
  );

  agInit(params: IAmountFilterParams): void {
    this.params = params;
    this.fieldName = params.column.getColId();
    this.placeholder = params.placeholder ?? '0.00';
    this.filterType = params.filterType ?? 'equals';
    this.listenForTabSwitch();
  }

  ngOnInit(): void {
    this.listenForCellFilter();
  }

  onParentModelChanged(): void {}

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let { value } = input;

    // Strip the $ prefix if user typed it
    if (value.startsWith('$')) {
      value = value.substring(1);
    }

    this.currentValue = this.cleanAmountValue(value);

    // Restore display with $ prefix
    input.value = this.currentValue ? `$${this.currentValue}` : '';
  }

  onKeyDown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Enter',
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End'
    ];

    if (allowedKeys.includes(event.key)) {
      if (event.key === 'Enter') {
        this.applyFilter();
        (event.target as HTMLInputElement).blur();
      }
      return;
    }

    // Allow decimal point (only one)
    if (event.key === '.') {
      if (this.currentValue?.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    // Allow numbers 0-9
    if (event.key >= '0' && event.key <= '9') {
      if (this.currentValue?.includes('.')) {
        const decimalPart = this.currentValue.split('.')[1] || '';
        const input = event.target as HTMLInputElement;
        const selectionStart = input.selectionStart ?? 0;
        // Account for $ prefix in display
        const actualPosition = selectionStart - 1;
        const decimalIndex = this.currentValue.indexOf('.');
        if (actualPosition > decimalIndex && decimalPart.length >= 2) {
          event.preventDefault();
        }
      }
      return;
    }

    // Block all other keys
    event.preventDefault();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') ?? '';
    this.currentValue = this.cleanAmountValue(pastedText);
    const input = event.target as HTMLInputElement;
    input.value = this.currentValue ? `$${this.currentValue}` : '';
  }

  onBlur(): void {
    if (this.currentValue) {
      const numValue = parseFloat(this.currentValue);
      if (!Number.isNaN(numValue)) {
        this.currentValue = numValue.toFixed(2);
      }
    }
  }

  applyFilter(): void {
    if (!this.currentValue || this.currentValue.trim() === '') {
      this.currentValue = null;
      this.v3DataTableService.updateV3DataTableByRemovingFilter = [
        this.fieldName
      ];
      return;
    }

    const filter: ISelectBoxFilterArray = {
      [this.fieldName]: {
        filter: this.currentValue.trim(),
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
    this.v3DataTableService.removeSearchBoxFilters(this.fieldName);
    this.v3DataTableService.gridApi?.deselectAll();
  }

  private cleanAmountValue(value: string): string {
    // Remove non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');

    // Handle multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    // Limit decimal places to 2
    if (cleaned.includes('.')) {
      const [whole, decimal] = cleaned.split('.');
      cleaned = `${whole}.${(decimal || '').slice(0, 2)}`;
    }

    return cleaned;
  }

  private listenForTabSwitch(): void {
    this.v3DataTableService.switchPaymentTableTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.currentValue = null;
        }
      });
  }

  private listenForCellFilter(): void {
    this.cellValue$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (
          res?.field === this.params.column.getColDef()?.headerName &&
          res?.filter
        ) {
          this.currentValue = this.cleanAmountValue(res.filter);
          this.applyFilter();
        }
      });
  }
}
