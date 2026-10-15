import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  Output,
  EventEmitter,
  inject,
  OnDestroy,
  HostBinding
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import {
  DateRange,
  DefaultMatCalendarRangeStrategy,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatDatepickerModule,
  MatRangeDateSelectionModel
} from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription } from 'rxjs';
import { SelectedService } from 'src/app/modules/data-table/components/dt-date-range/selected.service';
import { ICustomDateRangeModel } from 'src/app/models/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { faCalendar, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { DataTableService } from '../../service/data-table/data-table.service';

interface IUpdatedFloatingFilter extends IFloatingFilterParams {
  tableName?: string;
  v2Table?: boolean;
  colDef?: {
    headerName: string;
  };
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FontAwesomeModule,
    CommonButtonV35Component
  ],
  providers: [
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: DefaultMatCalendarRangeStrategy
    },
    DefaultMatCalendarRangeStrategy,
    MatRangeDateSelectionModel
  ],
  selector: 'app-data-range-v35',
  templateUrl: './data-range-v35.component.html',
  styleUrls: ['./data-range-v35.component.scss']
})
export class DataRangeV35Component implements OnDestroy {
  @HostBinding('class') className = 'w-full';
  @Output() dateEmiter = new EventEmitter();

  private readonly selectionModel = inject(MatRangeDateSelectionModel<Date>);
  private readonly selectionStrategy = inject(
    DefaultMatCalendarRangeStrategy<Date>
  );

  private v3DataTableService = inject(V3DataTableService);
  private selectedService = inject(SelectedService);
  private dataTableService = inject(DataTableService);

  /**
   * The selected date range in the datepicker.
   */
  subscription: Subscription[] = [];
  dateRange: DateRange<Date>;
  params: IUpdatedFloatingFilter | undefined;
  tableId: number;
  selectedRange: string;
  getCurrentColumn: unknown | { colId: string };
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);
  faXmark = faXmark;
  faCalendar = faCalendar;

  constructor() {
    const today = new Date();
    this.dateRange = new DateRange(today, new Date());
  }

  /**
   * Initializes the ag-Grid floating filter with the provided parameters.
   * @param params The parameters for the ag-Grid floating filter.
   */
  agInit(params: IUpdatedFloatingFilter): void {
    this.params = params;
    this.showDateRange();
    this.clearFilters();
    if (params?.tableName === 'payment_table') {
      this.onDefaultDate();
    }
    if (params?.tableName === 'check_list_table') {
      this.setDefaultDateForChecklistTable();
    }
    const colDef = params.column.getColDef();
    this.tableId = colDef.floatingFilterComponentParams?.tableId;
    this.selectedService.getValue().subscribe((val) => {
      if (val) {
        this.selectedRange = val;
      }
    });
    this.getCurrentColumn = this.params.column;
    this.isOutSideFiltering();
    this.getSelectedDate();
  }

  /**
   * @description Retrieves the selected date from the cell value and updates the start and end dates.
   */
  getSelectedDate() {
    this.subscription.push(
      this.cellValue$.subscribe((res) => {
        if (res?.field && res?.isDate && res.filter) {
          const datePipe = new DatePipe('en-US');
          const dateObj = new Date(res.filter.replace('_', ' '));
          const formattedDate = datePipe.transform(
            dateObj,
            'yyyy-MM-dd HH:mm:ss'
          );
          this.selectedStartEndDate.startDate = formattedDate as string;
          this.selectedStartEndDate.endDate = formattedDate as string;
          const filterName = this.params?.column?.getColDef().headerName;
          if (filterName === res?.field) {
            this.dateFilter();
            this.selectedDateRangeName = 'Custom';
            this.dateRange = new DateRange(
              new Date(formattedDate as string),
              new Date(formattedDate as string)
            );
          }
        }
      })
    );
  }

  /**
   * @description Used to populate the filtered date range in the field when coming back from the view page.
   * This function is specifically created for the payments table.
   */
  onDefaultDate() {
    if (this.v3DataTableService.selectedDateRange) {
      this.dateRange = this.v3DataTableService.selectedDateRange;
    }

    if (this.v3DataTableService.dateRangeName) {
      this.selectedDateRangeName = this.v3DataTableService.dateRangeName;
    }
  }

  /**
   * @description Used to populate the filtered date range in the field when coming back from the view page.
   * This function is specifically created for the checklist table.
   */
  setDefaultDateForChecklistTable() {
    if (this.params) {
      const filterName = this.params.column.getColId();
      if (filterName === 'cheque_issue_date') {
        if (this.dataTableService.selectedDateRangeCheque) {
          this.dateRange = this.dataTableService.selectedDateRangeCheque;
        }
        if (this.dataTableService.dateRangeNameCheque) {
          this.selectedDateRangeName =
            this.dataTableService.dateRangeNameCheque;
        }
      } else if (filterName === 'cheques.created_at') {
        if (this.dataTableService.selectedDateRangeChequeCreated) {
          this.dateRange = this.dataTableService.selectedDateRangeChequeCreated;
        }
        if (this.dataTableService.dateRangeNameChequeCreated) {
          this.selectedDateRangeName =
            this.dataTableService.dateRangeNameChequeCreated;
        }
      }
    }
  }

  /**
   * @description This function is specifically created for the payments table.
   * It is used to clear the selected date when switching tabs.
   * Listens for tab switch changes from `switchPaymentTableTab$`.
   */
  clearFilters() {
    this.subscription.push(
      this.v3DataTableService.switchPaymentTableTab$.subscribe((res) => {
        if (res) {
          this.v3DataTableService.clearStoredData();
          this.selectedDateRangeName = 'All Time';
          this.startDate = new Date(2000, 0, 1);
          this.endDate = new Date();
          this.dateRange = new DateRange(this.startDate, this.endDate);
        }
      })
    );
  }

  /**
   * @description Variable to control the closing of calender without customFilter()
   */
  closeDataRange = false;

  /**
   * An array of date range options with their IDs and names.
   */

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

  /**
   * The name of the currently selected date range.
   */
  selectedDateRangeName = 'All Time';

  /**
   * Object to store the selected start and end date in the format 'yyyy-MM-dd'.
   */
  selectedStartEndDate = {
    startDate: '',
    endDate: ''
  };

  /**
   * The start date of the date range.
   */
  startDate: Date = new Date();

  /**
   * The end date of the date range.
   */
  endDate: Date = new Date();

  /**
   * To reset current selected value
   */
  isReset = true;

  /**
   * Handles the selection of a date range option.
   * @param range The ID of the selected date range.
   */
  selectDateRange(range: string): void {
    const selected = this.dateRanges.filter((el) => el.id === range);
    this.selectedDateRangeName = selected[0].name;
    if (this.params?.tableName === 'payment_table') {
      this.v3DataTableService.dateRangeName = this.selectedDateRangeName;
    } else if (this.params?.tableName === 'check_list_table') {
      const filterName = this.params.column.getColId();
      if (filterName === 'cheque_issue_date') {
        this.dataTableService.dateRangeNameCheque = this.selectedDateRangeName;
      } else if (filterName === 'cheques.created_at') {
        this.dataTableService.dateRangeNameChequeCreated =
          this.selectedDateRangeName;
      }
    } else {
      this.v3DataTableService.dateRangeName = undefined;
      this.dataTableService.dateRangeNameCheque = undefined;
      this.dataTableService.dateRangeNameChequeCreated = undefined;
    }
    this.startDate = new Date();
    this.endDate = new Date();
    switch (range) {
      case 'today':
        this.startDate = new Date();
        this.endDate = new Date();
        break;
      case 'yesterday':
        this.startDate = new Date();
        this.startDate.setDate(this.startDate.getDate() - 1);
        this.endDate = new Date();
        this.endDate.setDate(this.endDate.getDate() - 1);
        break;
      case 'last-7-days':
        this.startDate = new Date();
        this.startDate.setDate(this.startDate.getDate() - 6); // Start from 7 days ago
        this.endDate = new Date();
        break;
      case 'this-month':
        this.startDate = new Date(
          this.startDate.getFullYear(),
          this.startDate.getMonth(),
          1
        );
        this.endDate = new Date();
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
        this.endDate = new Date();
        break;
      case 'last-year':
        this.startDate = new Date(this.startDate.getFullYear() - 1, 0, 1);
        this.endDate = new Date(this.startDate.getFullYear(), 11, 31);
        break;
      case 'all-time':
        // Customize this as per your requirement
        this.startDate = new Date(2000, 0, 1);
        this.endDate = new Date();
        break;
      default:
        // Handle any other range not covered above
        break;
    }
    this.dateRange = new DateRange(this.startDate, this.endDate);
    if (this.params?.tableName === 'payment_table') {
      this.v3DataTableService.selectedDateRange = this.dateRange;
    } else if (this.params?.tableName === 'check_list_table') {
      const filterName = this.params.column.getColId();
      if (filterName === 'cheque_issue_date') {
        this.dataTableService.selectedDateRangeCheque = this.dateRange;
      } else if (filterName === 'cheques.created_at') {
        this.dataTableService.selectedDateRangeChequeCreated = this.dateRange;
      }
    } else {
      this.v3DataTableService.selectedDateRange = undefined;
    }
    this.selectedStartEndDate.startDate = this.getFormatedDate(this.startDate);
    this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
    this.dateFilter();
  }

  /**
   * Converts a date object to a string in 'yyyy-MM-dd' format.
   * @param unformatedDate The date object to be formatted.
   * @returns The date string in 'yyyy-MM-dd' format.
   */
  getFormatedDate(unformatedDate: Date): string {
    const originalDate = unformatedDate;
    const year = originalDate.getFullYear();
    const month = String(originalDate.getMonth() + 1).padStart(2, '0'); // Month starts from 0, so add 1 and pad with 0 if needed
    const date = String(originalDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${date}`;
    return formattedDate;
  }

  /**
   * Handles the change of the custom date range using the datepicker.
   * @param selectedDate The selected date from the datepicker.
   */
  rangeChanged(selectedDate: Date) {
    this.selectedDateRangeName = 'Custom';

    const { selection } = this.selectionModel;

    const newSelection = this.selectionStrategy.selectionFinished(
      selectedDate,
      selection
    );

    this.selectionModel.updateSelection(newSelection, this);
    this.dateRange = new DateRange<Date>(newSelection.start, newSelection.end);

    if (this.selectionModel.isComplete()) {
      if (newSelection.start && newSelection.end) {
        this.selectedStartEndDate.startDate = this.getFormatedDate(
          newSelection.start
        );
        this.selectedStartEndDate.endDate = this.getFormatedDate(
          newSelection.end
        );
      }
      this.dateRange = new DateRange(newSelection.start, newSelection.end);
      this.startDate = newSelection.start;
      this.endDate = newSelection.end;
      this.dateFilter();
    }
  }

  dateFilter(isClear?: boolean): void {
    this.isReset = false;
    const filterName = this.params?.filterParams?.colDef?.field as string;

    if (this.params?.v2Table) {
      this.V2TableFilter(isClear);
      return;
    }
    if (isClear) {
      const filterObject = this.v3DataTableService.defaultPayload.filterModel;
      const propertyNameToRemove = filterName;
      // Check if the property exists using the 'in' operator
      if (propertyNameToRemove in filterObject) {
        delete filterObject[propertyNameToRemove];
      }
      this.v3DataTableService.refreshV3DataTable();

      return;
    }
    if (this.params?.tableName === 'payment_table') {
      this.v3DataTableService.updatePayloadData();
    }
    
    // Special case for multi_check_mail_table where created_at should map to multi_import_check_mailing_batches.created_at
    let actualFilterName = filterName;
    if (this.params?.tableName === 'multi_check_mail_table' && filterName === 'created_at') {
      actualFilterName = 'multi_import_check_mailing_batches.created_at';
    }

    if(this.params?.tableName === 'multi_check_mail_table_details' && filterName === 'created_at') {
      actualFilterName = 'cheques.created_at';
    }

    
    this.v3DataTableService.defaultPayload.filterModel[actualFilterName] = {
      dateFrom: this.selectedStartEndDate.startDate,
      dateTo: this.selectedStartEndDate.endDate,
      filterType: 'date',
      type: 'inRange'
    };

    this.v3DataTableService.defaultPayload.startRow = 0;
    this.v3DataTableService.defaultPayload.endRow = 50;
    this.v3DataTableService.refreshV3DataTable();
    this.closeDataRange = true;
  }

  /**
   * Filter for old data table
   */
  V2TableFilter(isClear?: boolean) {
    if (this.params) {
      if (this.params?.tableName === 'check_list_table') {
        const filterName = this.params.column.getColId();
        if (filterName === 'cheque_issue_date') {
          this.dataTableService.selectedDateRangeCheque = this.dateRange;
          this.dataTableService.dateRangeNameCheque =
            this.selectedDateRangeName;
        } else if (filterName === 'cheques.created_at') {
          this.dataTableService.dateRangeNameChequeCreated =
            this.selectedDateRangeName;
          this.dataTableService.selectedDateRangeChequeCreated = this.dateRange;
        }
      } else {
        this.dataTableService.dateRangeNameChequeCreated = undefined;
        this.dataTableService.selectedDateRangeChequeCreated = undefined;
        this.dataTableService.selectedDateRangeCheque = undefined;
        this.dataTableService.dateRangeNameCheque = undefined;
      }
      if (isClear) {
        this.startDate = new Date(2000, 0, 1);
        this.endDate = new Date();
        this.selectedStartEndDate.startDate = this.getFormatedDate(
          this.startDate
        );
        this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
      }
      if (this.tableId === 62) {
        this.v3DataTableService.defaultPayload.filterModel[
          'zil_payments.updated_at'
        ] = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }
      if (this.tableId === 66) {
        this.v3DataTableService.defaultPayload.filterModel[
          (this.getCurrentColumn as { colId: string }).colId
        ] = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }
      if (this.tableId === 3) {
        this.v3DataTableService.defaultPayload.filterModel[
          'received_check_lists.created_at'
        ] = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }
      if (this.tableId === 108) {
        this.v3DataTableService.defaultPayload.filterModel[
          'cheques.created_at'
        ] = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }
      if (this.tableId === 20) {
        this.v3DataTableService.defaultPayload.filterModel[
          'universal_wallet_record_transactions.created_at'
        ] = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }
      if (this.tableId === 27 || this.tableId === 28) {
        this.v3DataTableService.defaultPayload.filterModel.txnDate = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }
      if (this.tableId === 8) {
        this.v3DataTableService.defaultPayload.filterModel.created_at = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }

      if (this.params?.tableName === 'payroll_transaction') {
        this.v3DataTableService.defaultPayload.filterModel[
          'universal_payroll_transactions.processed_date'
        ] = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }

      if (this.params?.tableName === 'payroll_details_table') {
        this.v3DataTableService.defaultPayload.filterModel.check_date = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }

      if (this.tableId === 77) {
        this.v3DataTableService.defaultPayload.filterModel.check_date = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }

      if (this.tableId === 81) {
        this.v3DataTableService.defaultPayload.filterModel.created_at = {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        };
        this.v3DataTableService.refreshV3DataTable();
      }

      this.params.api.setColumnFilterModel(
        (this.getCurrentColumn as { colId: string }).colId,
        {
          dateFrom: this.selectedStartEndDate.startDate,
          dateTo: this.selectedStartEndDate.endDate,
          filterType: 'date',
          type: 'inRange'
        }
      );
  
      if (this.params) {
        this.params.api.onFilterChanged();
      }

      setTimeout(() => {
        this.selectedService.selectedDateRange = {
          fromDate: this.selectedStartEndDate.startDate,
          toDate: this.selectedStartEndDate.endDate,
          filterType: this.selectedRange
        };
      }, 1000);
    }
  }

  /**
   * Stops the click event propagation to prevent interference with other elements.
   * @param event The click event.
   */
  stopClickEvent(event: MouseEvent) {
    event.stopPropagation();
  }

  /**
   * To reset current selected value
   */
  resetFilter(): void {
    this.isReset = true;
    const range = {
      startDate: null,
      endDate: null
    };
    this.startDate = new Date(2000, 0, 1);
    this.endDate = new Date();
    this.dateRange = new DateRange(this.startDate, this.endDate);
    this.dateFilter(true);
    this.dateEmiter.emit(range);
    this.selectedDateRangeName = 'All Time';
    this.v3DataTableService?.gridApi?.deselectAll();
  }

  /**
   * @description To toggle the date range show
   */
  showDateRange() {
    this.closeDataRange = false;
  }

  /**
   * To filter with custom filter value
   */
  customFilter(): void {
    this.selectedStartEndDate.startDate = this.getFormatedDate(this.startDate);
    this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
    if (this.selectedStartEndDate.startDate) {
      this.dateFilter();
    }
  }

  isOutSideFiltering() {
    this.subscription.push(
      this.selectedService
        .getCustomDateFilterArray()
        .subscribe((val: ICustomDateRangeModel) => {          
          if (val) {
            this.changeCustomDateFilterEvent(val);
          }
        })
    );
  }

  changeCustomDateFilterEvent(val: ICustomDateRangeModel) {
    if ((this.getCurrentColumn as { colId: string }).colId === val.colId) {
      if (val.dateRangeId) {
        const dateRangeCategory = this.dateRanges.find(
          (date) => date.id === val.dateRangeId
        );
        this.selectedDateRangeName = dateRangeCategory?.name ?? 'Custom';
      } else {
        this.selectedDateRangeName = 'Custom';
      }
      this.dateRange = new DateRange(
        new Date(val.fromDate),
        new Date(val.toDate)
      );
      this.selectedService.setStatus(false);
      this.selectedStartEndDate.startDate = this.getFormatedDate(
        new Date(val.fromDate)
      );
      this.selectedStartEndDate.endDate = this.getFormatedDate(
        new Date(val.toDate)
      );
      this.startDate = new Date(this.selectedStartEndDate.startDate);
      this.endDate = new Date(this.selectedStartEndDate.endDate);
      this.V2TableFilter();
    }
  }

  trackByFn(index: number, item: { id: string }): string {
    return item.id;
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
