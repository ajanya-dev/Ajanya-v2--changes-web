import {
  Component,
  DestroyRef,
  HostBinding,
  inject,
  OnInit
} from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ISelectBoxFilterArray } from 'src/app/models/v3-datatable';

interface ITextFilterParams extends IFloatingFilterParams {
  placeholder?: string;
  filterType?: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  tableName?: string;
  tableId?: number;
}

@Component({
  selector: 'app-v4-text-floating-filter',
  templateUrl: './v4-text-floating-filter.component.html',
  standalone: true,
  imports: [FormsModule, LucideAngularModule]
})
export class V4TextFloatingFilterComponent implements OnInit {
  @HostBinding('class') hostClass = 'w-full';
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  params: ITextFilterParams;
  currentValue: string | null = null;
  fieldName = '';
  placeholder = 'Search';
  filterType: string = 'contains';

  private cellValue$ = toObservable(
    this.dataTableService.selectedCellValueSignal
  );

  agInit(params: ITextFilterParams): void {
    this.params = params;
    this.fieldName = params.column.getColId();
    this.placeholder = params.placeholder ?? 'Search';
    this.filterType = params.filterType ?? 'contains';

    // Auto-detect filter type from column filter config
    const colFilter = params.filterParams?.colDef?.filter;
    if (colFilter === 'agNumberColumnFilter' && !params.filterType) {
      this.filterType = 'equals';
    }

    this.listenForTabSwitch();
    this.autoPopulate();
  }

  ngOnInit(): void {
    this.listenForCellFilter();
  }

  onParentModelChanged(): void {
    // Required by AG Grid duck-typing
  }

  applyFilter(): void {
    const filterName = this.getActualFilterName();

    if (!this.currentValue || this.currentValue.trim() === '') {
      this.currentValue = null;
      this.v3DataTableService.updateV3DataTableByRemovingFilter = [filterName];
      this.v3DataTableService.removeSearchBoxFilters(filterName);
      this.v3DataTableService.gridApi?.deselectAll();
      return;
    }

    let filterValue = this.currentValue.trim();

    // Strip non-digits for SSN field
    if (this.fieldName === 'type_details.employee_ssn') {
      filterValue = (filterValue.match(/\d+/g) ?? []).join('');
    }

    const filterModelItem: ISelectBoxFilterArray = {
      [filterName]: {
        filter: filterValue,
        filterType: 'text',
        type: this.filterType
      }
    };

    // Store filter values for payment_table
    if (this.params?.tableName === 'payment_table') {
      this.storeFilterValues(filterName, filterModelItem);
    }

    this.v3DataTableService.updateV3DataTable = filterModelItem;
  }

  clearFilter(): void {
    this.currentValue = null;
    const filterName = this.getActualFilterName();
    this.v3DataTableService.updateV3DataTableByRemovingFilter = [filterName];
    this.v3DataTableService.removeSearchBoxFilters(filterName);
    this.v3DataTableService.gridApi?.deselectAll();
  }

  private getActualFilterName(): string {
    let filterName = this.fieldName;
    if (filterName === 'created_by') filterName = 'created_by.name';
    if (filterName === 'payee_name' && this.params?.tableId === 113)
      filterName = 'payees.payee_name';
    if (filterName === 'name' && this.params?.tableId === 112)
      filterName = 'multi_import_check_mailing_batches.name';
    return filterName;
  }

  private storeFilterValues(
    filterName: string,
    filterPayload: ISelectBoxFilterArray
  ): void {
    if (filterName === 'amount') {
      this.v3DataTableService.filteredAmount = filterPayload;
    } else if (filterName === 'description') {
      this.v3DataTableService.filteredDescription = filterPayload;
    } else if (filterName === 'created_by.name') {
      this.v3DataTableService.filteredCreatedAt = filterPayload;
    } else if (filterName === 'reference_no') {
      this.v3DataTableService.filteredReference = filterPayload;
    }
    this.v3DataTableService.updatePayloadData();
  }

  private autoPopulate(): void {
    if (this.params?.tableName === 'payment_table') {
      const payload = this.v3DataTableService.dataTablePayload;
      const filterName = this.getActualFilterName();
      const fm = payload?.filterModel as Record<string, { filter: string }>;
      if (fm?.[filterName]) {
        this.currentValue = fm[filterName].filter;
      }
    } else if (this.params?.tableName === 'check_list_table') {
      const payload = this.dataTableService.dataTablePayload;
      const filterName = this.fieldName;
      const fm = payload?.filterModel as Record<string, { filter: string }>;
      if (fm?.[filterName]) {
        this.currentValue = fm[filterName].filter;
        this.applyFilter();
      }
    }
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
          this.currentValue = res.filter;
          this.applyFilter();
        }
      });
  }
}
