import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject
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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription } from 'rxjs';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { faCalendar } from '@fortawesome/pro-solid-svg-icons';

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
  selector: 'app-date-range-selector-v35',
  templateUrl: './date-range-selector-v35.component.html',
  styleUrls: ['./date-range-selector-v35.component.css'],
  host: {
    class: 'w-full'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangeSelectorV35Component implements OnInit {
  @Output() dateEmiter: EventEmitter<{
    start: null | string;
    end: null | string;
  }> = new EventEmitter();

  @Input() set selectDate(
    input: { start: Date | null; end: Date | null } | string
  ) {
    if (typeof input === 'string') {
      const ids = this.dateRanges.map((type) => type.id);
      const index = ids.indexOf(input);
      if (index !== -1) {
        this.selectDateRange(this.dateRanges[index].id);
      }
    } else if (input instanceof Date && input.start && input.end) {
      this.rangeChanged(input.start);
      this.rangeChanged(input.end);
    }
  }

  @Input() width = 'w-full';

  private readonly selectionModel = inject(MatRangeDateSelectionModel<Date>);
  private readonly selectionStrategy = inject(
    DefaultMatCalendarRangeStrategy<Date>
  );

  /**
   * The selected date range in the datepicker.
   */
  faCalendar = faCalendar;
  subscription: Subscription[] = [];
  dateRange: DateRange<Date>;
  tableId: number;
  selectedRange: string;
  getCurrentColumn: unknown | { colId: string };

  constructor() {
    const today = new Date();
    this.dateRange = new DateRange(today, new Date());
  }

  ngOnInit(): void {}

  /**
   * @description This function is specifically created for the payments table.
   * It is used to clear the selected date when switching tabs.
   * Listens for tab switch changes from `switchPaymentTableTab$`.
   */
  clearFilters() {}

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
   * Handles the selection of a date range option.
   * @param range The ID of the selected date range.
   */
  selectDateRange(range: string): void {
    const selected = this.dateRanges.filter((el) => el.id === range);
    this.selectedDateRangeName = selected[0].name;
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
    this.selectedStartEndDate.startDate = this.getFormatedDate(this.startDate);
    this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
    this.closeDataRange = true;
    this.dateEmiter.emit({
      start: this.selectedStartEndDate.startDate,
      end: this.selectedStartEndDate.endDate
    });
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
      this.closeDataRange = true;
      this.dateEmiter.emit({
        start: this.selectedStartEndDate.startDate,
        end: this.selectedStartEndDate.endDate
      });
    }else{
      
      this.dateRange = new DateRange(newSelection.start, newSelection.end);
      if(newSelection.start){
        this.selectedStartEndDate.startDate = this.getFormatedDate(
          newSelection.start
        );
      }
      this.selectedStartEndDate.endDate = this.getFormatedDate(
        newSelection.end !== null ? newSelection.end : newSelection.start
      );
      this.startDate = newSelection.start;
      this.endDate = newSelection.end !== null ? newSelection.end : newSelection.start;
      this.dateEmiter.emit({
        start: this.selectedStartEndDate.startDate,
        end: this.selectedStartEndDate.endDate
      });      
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
    this.startDate = new Date(2000, 0, 1);
    this.endDate = new Date();
    this.selectedStartEndDate.startDate = this.getFormatedDate(this.startDate);
    this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
    this.closeDataRange = true;
    this.dateEmiter.emit({
      start: this.selectedStartEndDate.startDate,
      end: this.selectedStartEndDate.endDate
    });
    this.closeDataRange = true;
    this.selectedDateRangeName = 'All Time';
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
      this.closeDataRange = true;
      this.dateEmiter.emit({
        start: this.selectedStartEndDate.startDate,
        end: this.selectedStartEndDate.endDate
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
