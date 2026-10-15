import {
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  inject,
  OnInit,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { ISelectBoxFilterArray } from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';

interface IStatusData {
  value: string;
  name: string;
  type: 'normal' | 'check';
}

interface IDropdownFilterParams extends IFloatingFilterParams {
  table?: 'payment_table' | 'bankAccount_data_table' | 'getPaidFormRecurring';
  tableName?: string;
  tableId?: number;
  multiSelect?: boolean;
  searchable?: boolean;
  placeholder?: string;
}

@Component({
  selector: 'app-v4-dropdown-floating-filter',
  templateUrl: './v4-dropdown-floating-filter.component.html',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    OverlayModule,
    LucideAngularModule,
    MatTooltipModule,
    EllipsisActiveDirective
  ]
})
export class V4DropdownFloatingFilterComponent implements OnInit, OnDestroy {
  @HostBinding('class') hostClass = 'w-full';
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private paymentService = inject(PaymentsService);
  private destroyRef = inject(DestroyRef);
  private requestPayment = inject(RequestPaymentsService);

  params: IDropdownFilterParams;
  fieldName = '';
  isOpen = false;
  hasSelection = false;
  displayLabel = '';
  placeholder = 'Select';
  allLabel = 'All';
  searchable = false;
  multiSelect = false;
  searchTerm = '';
  subFilterNames: string[] = [];

  optionResult: IStatusData[] = [];
  checkStatus: IStatusData[] = [];
  selectedValue: IStatusData | null = null;
  selectedValues: IStatusData[] = [];
  isCheckStatusSelected = false;
  overlayWidth = 0;

  @ViewChild('triggerEl', { static: true }) triggerEl!: ElementRef<HTMLElement>;

  private cellValue$ = toObservable(
    this.dataTableService.selectedCellValueSignal
  );

  overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 2
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 2
    }
  ];

  agInit(params: IDropdownFilterParams): void {
    this.params = params;
    this.fieldName = params.column.getColId();
    this.searchable = params.searchable ?? false;
    this.multiSelect = params.multiSelect ?? false;
    if (params.placeholder) this.placeholder = params.placeholder;

    // Load option data from DataTableService (same as v3)
    const getData = this.dataTableService.getSelectBoxData();
    const getValues = getData.values;

    if (getValues) {
      const filterData = getValues.filter((el) => el.id === this.fieldName);
      if (filterData?.[0]) {
        this.optionResult = filterData[0].values.map((item) => ({
          ...item,
          type: 'normal' as const
        })) as IStatusData[];
      }
    }

    // Setup check status group for payment/payee_transaction tables
    if (
      (params.table === 'payment_table' ||
        params.tableName === 'payee_transaction') &&
      this.fieldName === 'status'
    ) {
      this.setupCheckStatusMenu(getValues);
    }

    this.listenForTabSwitch();
    this.listenForMainFilter();
    this.autoPopulate();
  }

  ngOnInit(): void {
    this.listenForCellFilter();
  }

  onParentModelChanged(): void {}

  get filteredOptions(): IStatusData[] {
    if (!this.searchTerm) return this.optionResult;
    const term = this.searchTerm.toLowerCase();
    return this.optionResult.filter((o) => o.name.toLowerCase().includes(term));
  }

  get filteredCheckStatus(): IStatusData[] {
    if (!this.searchTerm) return this.checkStatus;
    const term = this.searchTerm.toLowerCase();
    return this.checkStatus.filter((o) => o.name.toLowerCase().includes(term));
  }

  isSelected(option: IStatusData): boolean {
    if (this.multiSelect) {
      return this.selectedValues.some((v) => v.value === option.value);
    }
    return (
      this.selectedValue?.value === option.value && !this.isCheckStatusSelected
    );
  }

  isCheckSelected(option: IStatusData): boolean {
    return (
      this.isCheckStatusSelected && this.selectedValue?.value === option.name
    );
  }

  toggleDropdown(): void {
    // Measure on open — the column can be resized between opens, and the
    // backdrop blocks resizing while the panel is up, so this stays accurate.
    if (!this.isOpen) {
      this.overlayWidth = this.triggerEl?.nativeElement?.offsetWidth || 0;
    }
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchTerm = '';
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
  }

  selectOption(option: IStatusData | null): void {
    if (option === null) {
      this.clearSelection();
      return;
    }

    if (this.multiSelect) {
      const index = this.selectedValues.findIndex(
        (v) => v.value === option.value
      );
      if (index >= 0) {
        this.selectedValues.splice(index, 1);
      } else {
        this.selectedValues.push(option);
      }
      this.applyMultiSelectFilter();
      return;
    }

    // Single select — normal option
    this.selectedValue = option;
    this.isCheckStatusSelected = false;
    this.hasSelection = true;
    this.displayLabel = option.name;
    this.isOpen = false;
    this.searchTerm = '';

    if (this.params.tableName === 'getPaidFormRecurring') {
      this.requestPayment.setFrequency(option?.value);
      return;
    }

    // Remove check filter if previously set
    if (
      (this.params.table === 'payment_table' ||
        this.params.tableName === 'payee_transaction') &&
      this.fieldName === 'status'
    ) {
      this.v3DataTableService.updateV3DataTableByRemovingFilter = [
        'transfer_type'
      ];
      if (this.v3DataTableService.defaultPayload) {
        this.v3DataTableService.defaultPayload.transfer_status = undefined;
      }
    }

    const filterName = this.getFilterName(option.name);
    this.storeFilterType(filterName, {
      [filterName]: { filter: option.value, filterType: 'text', type: 'equals' }
    });

    const filter: ISelectBoxFilterArray = {
      [filterName]: { filter: option.value, filterType: 'text', type: 'equals' }
    };
    this.v3DataTableService.updateV3DataTable = filter;
  }

  selectCheckOption(option: IStatusData): void {
    this.selectedValue = { ...option, value: option.name };
    this.isCheckStatusSelected = true;
    this.hasSelection = true;
    this.displayLabel = option.name;
    this.isOpen = false;
    this.searchTerm = '';

    this.v3DataTableService.selectedCheckStatus = option.name;

    const checkFilter: ISelectBoxFilterArray = {
      transfer_type: { filter: 'CHECK', filterType: 'text', type: 'contains' }
    };
    this.v3DataTableService.filteredCheckType = checkFilter;

    // Remove normal status filter
    this.v3DataTableService.updateV3DataTableByRemovingFilter = ['status'];

    if (this.v3DataTableService.defaultPayload) {
      this.v3DataTableService.defaultPayload.transfer_status = option.value;
    }
    this.v3DataTableService.updateV3DataTable = checkFilter;
  }

  clearSelection(event?: Event): void {
    event?.stopPropagation();
    this.selectedValue = null;
    this.selectedValues = [];
    this.hasSelection = false;
    this.displayLabel = '';
    this.isCheckStatusSelected = false;
    this.isOpen = false;
    this.searchTerm = '';

    const filters: string[] = [];

    if (
      (this.params.table === 'payment_table' ||
        this.params.tableName === 'payee_transaction') &&
      this.fieldName === 'status'
    ) {
      if (this.v3DataTableService.defaultPayload) {
        this.v3DataTableService.defaultPayload.transfer_status = undefined;
      }
      filters.push('transfer_type');
      this.v3DataTableService.removeFilters('transfer_type');
    }

    const filterName = this.getFilterName();
    filters.push(filterName);
    this.v3DataTableService.removeFilters(filterName);

    // Handle bankAccount dual-field cleanup
    if (
      this.params.table === 'bankAccount_data_table' &&
      this.fieldName === 'verified_by'
    ) {
      filters.push('mark_as_verified');
      if (
        this.v3DataTableService.defaultPayload?.filterModel?.mark_as_verified
      ) {
        this.v3DataTableService.defaultPayload.filterModel.mark_as_verified =
          undefined;
      }
    }

    // Clean up sub-filters
    if (this.subFilterNames.length) {
      this.subFilterNames.forEach((name) => {
        filters.push(name);
      });
      this.subFilterNames = [];
    }

    if (this.params.tableName === 'getPaidFormRecurring') {
      this.requestPayment.setFrequency('');
    }

    this.v3DataTableService.gridApi?.deselectAll();
    this.v3DataTableService.updateV3DataTableByRemovingFilter = filters;
  }

  private applyMultiSelectFilter(): void {
    this.hasSelection = this.selectedValues.length > 0;
    if (this.selectedValues.length === 0) {
      this.displayLabel = '';
      this.v3DataTableService.updateV3DataTableByRemovingFilter = [
        this.fieldName
      ];
    } else if (this.selectedValues.length === 1) {
      this.displayLabel = this.selectedValues[0].name;
      const filter: ISelectBoxFilterArray = {
        [this.fieldName]: {
          filter: this.selectedValues.map((v) => v.value).join(','),
          filterType: 'text',
          type: 'contains'
        }
      };
      this.v3DataTableService.updateV3DataTable = filter;
    } else {
      this.displayLabel = `${this.selectedValues.length} selected`;
      const filter: ISelectBoxFilterArray = {
        [this.fieldName]: {
          filter: this.selectedValues.map((v) => v.value).join(','),
          filterType: 'text',
          type: 'contains'
        }
      };
      this.v3DataTableService.updateV3DataTable = filter;
    }
  }

  private getFilterName(optionName?: string): string {
    let filterName = this.params.filterParams?.colDef?.field ?? this.fieldName;

    if (
      this.params.tableName === 'multi_check_mail_table' &&
      filterName === 'status'
    ) {
      filterName = 'multi_import_check_mailing_batches.status';
    }

    // bankAccount_data_table dual-field logic
    if (
      this.params.table === 'bankAccount_data_table' &&
      this.fieldName === 'verified_by'
    ) {
      if (optionName === 'Verified') {
        filterName = 'mark_as_verified';
        if (this.v3DataTableService.defaultPayload?.filterModel?.verified_by) {
          this.v3DataTableService.defaultPayload.filterModel.verified_by =
            undefined;
        }
      } else if (this.v3DataTableService.defaultPayload?.filterModel) {
        this.v3DataTableService.defaultPayload.filterModel.mark_as_verified =
          undefined;
      }
    }

    return filterName;
  }

  private storeFilterType(
    filterName: string,
    filterPayload: ISelectBoxFilterArray
  ): void {
    if (filterName === 'source_type') {
      this.v3DataTableService.filteredSourceType = filterPayload;
    } else if (filterName === 'transfer_mode') {
      this.v3DataTableService.filteredTransferType = filterPayload;
    } else if (filterName === 'status') {
      this.v3DataTableService.filteredStatusType = filterPayload;
    }
  }

  private autoPopulate(): void {
    const payload = this.v3DataTableService.dataTablePayload;
    if (
      payload &&
      (this.v3DataTableService.isClickEyeButton ||
        this.paymentService.isFromViewPage)
    ) {
      const filterName = this.fieldName;
      const fm = payload?.filterModel as ISelectBoxFilterArray | undefined;
      if (fm?.source_type && filterName === 'source_type') {
        this.displayLabel = fm.source_type.filter as string;
        this.hasSelection = true;
      } else if (fm?.transfer_mode && filterName === 'transfer_mode') {
        const value = this.optionResult.find(
          (item) => item.value === fm.transfer_mode.filter
        );
        if (value) {
          this.displayLabel = value.name;
          this.hasSelection = true;
        }
      } else if (fm?.status && filterName === 'status') {
        const value = this.optionResult.find(
          (item) => item.value === fm.status.filter
        );
        if (value) {
          this.displayLabel = value.name;
          this.hasSelection = true;
        }
      } else if (fm?.transfer_type && filterName === 'status') {
        this.displayLabel = this.v3DataTableService
          .selectedCheckStatus as string;
        this.hasSelection = true;
        this.isCheckStatusSelected = true;
      }
    }
  }

  private setupCheckStatusMenu(
    values: IDtFloatingFilterProp['selectBox'] | undefined
  ): void {
    const filterCheckStatus =
      values?.filter((val) => val.id === 'cheques.cheque_status') ?? [];
    if (filterCheckStatus[0]) {
      this.checkStatus = filterCheckStatus[0].values.map((item) => ({
        ...item,
        type: 'check' as const
      })) as IStatusData[];
    }
  }

  private listenForTabSwitch(): void {
    this.v3DataTableService.switchPaymentTableTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.v3DataTableService.clearStoredData();
          if (
            this.isCheckStatusSelected &&
            this.v3DataTableService.defaultPayload
          ) {
            this.v3DataTableService.defaultPayload.transfer_status = undefined;
          }
          this.selectedValue = null;
          this.selectedValues = [];
          this.hasSelection = false;
          this.displayLabel = '';
          this.isCheckStatusSelected = false;
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
          // Handle sub-filter from cell click
          if (res.subFilter) {
            this.subFilterNames.push(res.subFilter.name);
            const subFilterPayload: ISelectBoxFilterArray = {
              [res.subFilter.name]: {
                filter: res.subFilter.value,
                filterType: 'text',
                type: 'equals'
              }
            };
            this.v3DataTableService.updateV3DataTable = subFilterPayload;
          }

          const cellFilter = String(res.filter).toLowerCase();
          const matchesName = (item: IStatusData) =>
            item.name.toLowerCase() === cellFilter;

          const checkValueMatch = this.checkStatus.find(
            (item) => item.value === res.filter
          );
          const normalMatch = this.optionResult.find(
            (item) => item.value === res.filter || matchesName(item)
          );
          const checkNameMatch = this.checkStatus.find(matchesName);

          if (checkValueMatch) {
            this.selectCheckOption(checkValueMatch);
          } else if (normalMatch) {
            this.selectOption(normalMatch);
          } else if (checkNameMatch) {
            this.selectCheckOption(checkNameMatch);
          }
        }
      });
  }

  private listenForMainFilter(): void {
    this.dataTableService
      .getMainFilter()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res || res.fieldId !== this.fieldName) return;

        const value = res.data;

        if (value === '' || value === null) {
          this.clearSelection();
          return;
        }

        const checkMatch = this.checkStatus.find(
          (item) => item.value === value
        );
        if (checkMatch) {
          this.selectCheckOption(checkMatch);
          return;
        }

        const normalMatch = this.optionResult.find(
          (item) => item.value === value
        );
        if (normalMatch) {
          this.selectOption(normalMatch);
        }
      });
  }

  ngOnDestroy(): void {
    this.dataTableService.clearMainFilter();
  }
}
