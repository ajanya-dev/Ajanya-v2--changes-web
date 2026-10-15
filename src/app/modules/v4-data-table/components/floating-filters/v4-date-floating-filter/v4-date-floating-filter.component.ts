import {
  Component,
  DestroyRef,
  EventEmitter,
  HostBinding,
  inject,
  Output,
  ViewChild
} from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { DateRange } from '@angular/material/datepicker';
import {
  CdkConnectedOverlay,
  ConnectedPosition,
  OverlayModule
} from '@angular/cdk/overlay';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { SelectedService } from 'src/app/modules/data-table/components/dt-date-range/selected.service';
import { ICustomDateRangeModel } from 'src/app/models/common';

interface IDateFilterParams extends IFloatingFilterParams {
  tableName?: string;
  tableId?: number;
}

@Component({
  selector: 'app-v4-date-floating-filter',
  templateUrl: './v4-date-floating-filter.component.html',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    OverlayModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4DatePickerComponent,
    FormsModule,
    V4DatePickerComponent
  ]
})
export class V4DateFloatingFilterComponent {
  @HostBinding('class') hostClass = 'w-full';
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private selectedService = inject(SelectedService);
  private destroyRef = inject(DestroyRef);

  @Output() dateEmiter = new EventEmitter<{
    startDate: Date | null;
    endDate: Date | null;
  }>();

  @ViewChild(CdkConnectedOverlay) private connectedOverlay?: CdkConnectedOverlay;

  params: IDateFilterParams;
  isOpen = false;
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedDateRangeName = 'All Time';
  fromDateStr = '';
  toDateStr = '';

  private fieldName = '';
  private tableId = 0;
  private cellValue$ = toObservable(
    this.dataTableService.selectedCellValueSignal
  );

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

  dateRanges = [
    { id: 'today', name: 'Today' },
    { id: 'yesterday', name: 'Yesterday' },
    { id: 'last-7-days', name: 'Last 7 Days' },
    { id: 'this-month', name: 'This Month' },
    { id: 'last-month', name: 'Last Month' },
    { id: 'last-3-months', name: 'Last 3 Months' },
    { id: 'this-year', name: 'This Year' },
    { id: 'last-year', name: 'Last Year' },
    { id: 'all-time', name: 'All Time' }
  ];

  agInit(params: IDateFilterParams): void {
    this.params = params;
    this.fieldName =
      params.filterParams?.colDef?.field ?? params.column.getColId();
    this.tableId = params.tableId ?? 0;

    // Restore stored date range only if this column has an active filter in the payload
    const filterName = this.getActualFilterName();
    const activeFilter =
      this.v3DataTableService.defaultPayload?.filterModel?.[filterName];
    if (activeFilter && this.v3DataTableService.selectedDateRange) {
      const stored = this.v3DataTableService.selectedDateRange;
      if (stored.start) this.startDate = stored.start;
      if (stored.end) this.endDate = stored.end;
      this.updateDateStrings();
      if (this.v3DataTableService.dateRangeName) {
        this.selectedDateRangeName = this.v3DataTableService.dateRangeName;
      }
    }

    this.listenForTabSwitch();
    this.listenForCellFilter();

    // Restore per-column date range for check_list_table
    this.restoreCheckListTableDateRange();

    // Restore selectedRange from SelectedService only if this column has an active filter
    this.selectedService
      .getValue()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (
          val &&
          this.v3DataTableService.defaultPayload?.filterModel?.[
            this.getActualFilterName()
          ]
        ) {
          this.selectedDateRangeName = val;
        }
      });

    // Listen for external date filter events
    this.selectedService
      .getCustomDateFilterArray()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val: ICustomDateRangeModel) => {
        if (val?.fromDate && val?.toDate) {
          if (val.colId && val.colId !== this.fieldName) return;
          this.startDate = new Date(val.fromDate);
          this.endDate = new Date(val.toDate);
          this.selectedDateRangeName = 'Custom';
          this.updateDateStrings();
          this.applyDateFilter();
        }
      });

    this.registerOverlayRepositionListeners();
  }

  // Keep the open popup anchored to the trigger when ag-grid relayouts
  // (e.g., columns resize as rows render after a data fetch).
  private registerOverlayRepositionListeners(): void {
    const api = this.params?.api;
    if (!api) return;

    const reposition = (): void => {
      if (!this.isOpen) return;
      setTimeout(() => this.connectedOverlay?.overlayRef?.updatePosition(), 0);
    };

    const events = [
      'firstDataRendered',
      'rowDataUpdated',
      'modelUpdated',
      'columnResized',
      'displayedColumnsChanged',
      'gridSizeChanged'
    ];

    for (const evt of events) {
      api.addEventListener(evt, reposition);
    }

    this.destroyRef.onDestroy(() => {
      for (const evt of events) {
        api.removeEventListener(evt, reposition);
      }
    });
  }

  onParentModelChanged(): void {}

  selectDateRange(rangeId: string): void {
    const selected = this.dateRanges.find((el) => el.id === rangeId);
    if (!selected) return;

    this.selectedDateRangeName = selected.name;
    this.v3DataTableService.dateRangeName = this.selectedDateRangeName;

    // Per-column storage for check_list_table
    if (this.params?.tableName === 'check_list_table') {
      const colId = this.fieldName;
      if (colId === 'cheque_issue_date') {
        this.dataTableService.dateRangeNameCheque = this.selectedDateRangeName;
      } else if (colId === 'cheques.created_at') {
        this.dataTableService.dateRangeNameChequeCreated =
          this.selectedDateRangeName;
      }
    }

    this.startDate = new Date();
    this.endDate = new Date();

    switch (rangeId) {
      case 'today':
        break;
      case 'yesterday':
        this.startDate.setDate(this.startDate.getDate() - 1);
        this.endDate.setDate(this.endDate.getDate() - 1);
        break;
      case 'last-7-days':
        this.startDate.setDate(this.startDate.getDate() - 6);
        break;
      case 'this-month':
        this.startDate = new Date(
          this.startDate.getFullYear(),
          this.startDate.getMonth(),
          1
        );
        break;
      case 'last-month':
        this.startDate = new Date(
          this.startDate.getFullYear(),
          this.startDate.getMonth() - 1,
          1
        );
        this.endDate = new Date(
          this.startDate.getFullYear(),
          this.startDate.getMonth() + 1,
          0
        );
        break;
      case 'last-3-months':
        this.startDate = new Date(
          this.startDate.getFullYear(),
          this.startDate.getMonth() - 3,
          1
        );
        this.endDate = new Date(
          this.endDate.getFullYear(),
          this.endDate.getMonth(),
          0
        );
        break;
      case 'this-year':
        this.startDate = new Date(this.startDate.getFullYear(), 0, 1);
        break;
      case 'last-year':
        this.startDate = new Date(this.startDate.getFullYear() - 1, 0, 1);
        this.endDate = new Date(this.startDate.getFullYear(), 11, 31);
        break;
      case 'all-time':
        this.resetFilter();
        return;
      default:
        break;
    }

    this.v3DataTableService.selectedDateRange = new DateRange(
      this.startDate,
      this.endDate
    );

    // Per-column date range storage for check_list_table
    if (this.params?.tableName === 'check_list_table') {
      const colId = this.fieldName;
      if (colId === 'cheque_issue_date') {
        this.dataTableService.selectedDateRangeCheque = new DateRange(
          this.startDate,
          this.endDate
        );
      } else if (colId === 'cheques.created_at') {
        this.dataTableService.selectedDateRangeChequeCreated = new DateRange(
          this.startDate,
          this.endDate
        );
      }
    }

    this.updateDateStrings();
    this.applyDateFilter();
    this.isOpen = false;
  }

  onFromDateChange(event: Event | string): void {
    const value =
      typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    if (value) {
      this.startDate = new Date(`${value}T00:00:00`);
      this.selectedDateRangeName = 'Custom';
      this.fromDateStr = value;
    }
  }

  onToDateChange(event: Event | string): void {
    const value =
      typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    if (value) {
      this.endDate = new Date(`${value}T00:00:00`);
      this.selectedDateRangeName = 'Custom';
      this.toDateStr = value;
    }
  }

  applyCustomFilter(): void {
    this.updateDateStrings();
    this.applyDateFilter();
    this.isOpen = false;
  }

  resetFilter(): void {
    this.selectedDateRangeName = 'All Time';
    this.startDate = new Date(2000, 0, 1);
    this.endDate = new Date();
    this.fromDateStr = '';
    this.toDateStr = '';
    this.v3DataTableService.selectedDateRange = undefined;
    this.v3DataTableService.dateRangeName = undefined;

    this.dateEmiter.emit({ startDate: null, endDate: null });
    this.v3DataTableService.gridApi?.deselectAll();

    // Clear per-column storage for check_list_table
    if (this.params?.tableName === 'check_list_table') {
      const colId = this.fieldName;
      if (colId === 'cheque_issue_date') {
        this.dataTableService.selectedDateRangeCheque = undefined;
        this.dataTableService.dateRangeNameCheque = undefined;
      } else if (colId === 'cheques.created_at') {
        this.dataTableService.selectedDateRangeChequeCreated = undefined;
        this.dataTableService.dateRangeNameChequeCreated = undefined;
      }
    }

    this.isOpen = false;

    // Remove date filter from payload
    const filterName = this.getActualFilterName();
    if (this.v3DataTableService.defaultPayload?.filterModel) {
      delete this.v3DataTableService.defaultPayload.filterModel[filterName];
    }
    this.v3DataTableService.defaultPayload.startRow = 0;
    this.v3DataTableService.defaultPayload.endRow = 50;
    this.v3DataTableService.refreshV3DataTable();
  }

  private applyDateFilter(): void {
    const filterName = this.getActualFilterName();

    if (this.params?.tableName === 'payment_table') {
      this.v3DataTableService.updatePayloadData();
    }

    this.v3DataTableService.defaultPayload.filterModel[filterName] = {
      dateFrom: this.formatDate(this.startDate),
      dateTo: this.formatDate(this.endDate),
      filterType: 'date',
      type: 'inRange'
    };

    this.v3DataTableService.defaultPayload.startRow = 0;
    this.v3DataTableService.defaultPayload.endRow = 50;
    this.v3DataTableService.refreshV3DataTable();

    // Notify SelectedService
    setTimeout(() => {
      this.selectedService.selectedDateRange = {
        fromDate: this.formatDate(this.startDate),
        toDate: this.formatDate(this.endDate),
        filterType: this.selectedDateRangeName
      };
    }, 1000);
  }

  private getActualFilterName(): string {
    let filterName = this.fieldName;

    if (
      this.params?.tableName === 'multi_check_mail_table' &&
      filterName === 'created_at'
    ) {
      filterName = 'multi_import_check_mailing_batches.created_at';
    }
    if (
      this.params?.tableName === 'multi_check_mail_table_details' &&
      filterName === 'created_at'
    ) {
      filterName = 'cheques.created_at';
    }

    // V2 tableId-based field remapping
    if (this.tableId === 62) filterName = 'zil_payments.updated_at';
    if (this.tableId === 66) filterName = this.fieldName;
    if (this.tableId === 3) filterName = 'received_check_lists.created_at';
    if (this.tableId === 108) filterName = 'cheques.created_at';
    if (this.tableId === 20)
      filterName = 'universal_wallet_record_transactions.created_at';
    if (this.tableId === 27 || this.tableId === 28) filterName = 'txnDate';
    if (this.tableId === 8) filterName = 'created_at';
    if (this.tableId === 77) filterName = 'check_date';
    if (this.tableId === 81) filterName = 'created_at';
    if (this.params?.tableName === 'payroll_transaction')
      filterName = 'universal_payroll_transactions.processed_date';
    if (this.params?.tableName === 'payroll_details_table')
      filterName = 'check_date';

    return filterName;
  }

  private restoreCheckListTableDateRange(): void {
    if (this.params?.tableName !== 'check_list_table') return;
    const filterName = this.fieldName;
    if (filterName === 'cheque_issue_date') {
      if (this.dataTableService.selectedDateRangeCheque) {
        const stored = this.dataTableService.selectedDateRangeCheque;
        if (stored.start) this.startDate = stored.start;
        if (stored.end) this.endDate = stored.end;
        this.updateDateStrings();
      }
      if (this.dataTableService.dateRangeNameCheque) {
        this.selectedDateRangeName = this.dataTableService.dateRangeNameCheque;
      }
    } else if (filterName === 'cheques.created_at') {
      if (this.dataTableService.selectedDateRangeChequeCreated) {
        const stored = this.dataTableService.selectedDateRangeChequeCreated;
        if (stored?.start) this.startDate = stored.start;
        if (stored?.end) this.endDate = stored.end;
        this.updateDateStrings();
      }
      if (this.dataTableService.dateRangeNameChequeCreated) {
        this.selectedDateRangeName =
          this.dataTableService.dateRangeNameChequeCreated;
      }
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private updateDateStrings(): void {
    this.fromDateStr = this.formatDate(this.startDate);
    this.toDateStr = this.formatDate(this.endDate);
  }

  private listenForTabSwitch(): void {
    this.v3DataTableService.switchPaymentTableTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.v3DataTableService.clearStoredData();
          this.selectedDateRangeName = 'All Time';
          this.startDate = new Date(2000, 0, 1);
          this.endDate = new Date();
          this.fromDateStr = '';
          this.toDateStr = '';
        }
      });
  }

  private listenForCellFilter(): void {
    this.cellValue$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.field && res?.isDate && res.filter) {
          const datePipe = new DatePipe('en-US');
          const dateObj = new Date(res.filter.replace('_', ' '));
          const formattedDate = datePipe.transform(
            dateObj,
            'yyyy-MM-dd HH:mm:ss'
          );
          const filterName = this.params?.column?.getColDef().headerName;
          if (filterName === res.field && formattedDate) {
            this.startDate = new Date(formattedDate);
            this.endDate = new Date(formattedDate);
            this.selectedDateRangeName = 'Custom';
            this.updateDateStrings();
            this.applyDateFilter();
          }
        }
      });
  }
}
