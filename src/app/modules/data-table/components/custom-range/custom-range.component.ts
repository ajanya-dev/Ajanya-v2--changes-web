import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  OnDestroy,
  OnInit
} from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDateRangePicker } from '@angular/material/datepicker';
import { SelectedService } from '../dt-date-range/selected.service';
import { MatButton } from '@angular/material/button';
import { NgFor, NgClass } from '@angular/common';
import { MatCard } from '@angular/material/card';

const customPresets = [
  'Today',
  'Yesterday',
  'Last 7 Days',
  'This Month',
  'Last Month',
  'Last 3 Months',
  'This Year',
  'Last Year',
  'All Time'
] as const; // convert to readonly tuple of string literals

type CustomPreset = (typeof customPresets)[number];

@Component({
  selector: 'app-custom-range',
  templateUrl: './custom-range.component.html',
  styleUrls: ['./custom-range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCard, NgFor, MatButton, NgClass]
})
export class CustomRangeComponent<D> implements OnInit, OnDestroy {
  // list of range presets we want to provide:
  readonly customPresets = customPresets;
  @HostBinding('class.touch-ui')
  readonly isTouchUi = this.picker.touchUi;
  selected: string;
  constructor(
    private dateAdapter: DateAdapter<D>,
    private picker: MatDateRangePicker<D>,
    private _selectedService: SelectedService
  ) {}

  // called when user selects a range preset:#
  /**
   * @description  Selects a date range based on the provided custom preset.
   * @param {CustomPreset} rangeName - The name of the custom date range preset to select.
   */
  selectRange(rangeName: CustomPreset): void {
    this.selected = rangeName;
    this._selectedService.setValue(this.selected);

    const [start, end] = this.calculateDateRange(rangeName);
    this.picker.select(start);
    this.picker.select(end);
    this.picker.close();
  }

  selectedRange = 'All Time';
  ngOnInit(): void {
    this._selectedService.getValue().subscribe((val) => {
      if (val) {
        this.selectedRange = val;
      }
    });
  }

  /**
   * @description Calculates the date range based on the provided custom preset.
   * @param {CustomPreset} rangeName - The name of the custom date range preset.
   * @returns {[start: D, end: D]} An array containing the start and end dates of the calculated range.
   */
  private calculateDateRange(rangeName: CustomPreset): [start: D, end: D] {
    const today = this.today;
    const year = this.dateAdapter.getYear(today);
    const month = this.dateAdapter.getMonth(today);

    switch (rangeName) {
      case 'Today':
        return [today, today];
      case 'Yesterday': {
        const start = this.dateAdapter.addCalendarDays(today, -1);
        return [start, start];
      }
      case 'Last 7 Days': {
        const start = this.dateAdapter.addCalendarDays(today, -6);
        return [start, today];
      }
      case 'This Month': {
        return [this.calculateMonth(today)[0], today];
      }
      case 'This Year': {
        const start = this.dateAdapter.createDate(year, 0, 1);
        const end = this.dateAdapter.createDate(year, 11, 31);
        return [start, end];
      }
      // case 'last week': {
      //   const thisDayLastWeek = this.dateAdapter.addCalendarDays(today, -7);
      //   return this.calculateWeek(thisDayLastWeek);
      // }
      case 'Last Month': {
        const thisDayLastMonth = this.dateAdapter.addCalendarMonths(today, -1);
        return this.calculateMonth(thisDayLastMonth);
      }
      case 'Last 3 Months': {
        const start = this.calculateMonth(
          this.dateAdapter.addCalendarMonths(today, -3)
        )[0];
        const end = this.calculateMonth(
          this.dateAdapter.addCalendarMonths(today, -1)
        )[1];
        return [start, end];
      }
      case 'Last Year': {
        const start = this.dateAdapter.createDate(year - 1, 0, 1);
        const end = this.dateAdapter.createDate(year - 1, 11, 31);
        return [start, end];
      }

      case 'All Time': {
        const start = this.dateAdapter.createDate(year - 10, month, 1);
        const end = this.dateAdapter.createDate(year + 10, 1, 1);
        return [start, end];
      }
      default:
        // exhaustiveness check;
        // rangeName has type never, if every possible value is handled in the switch cases.
        // Otherwise, the following line will result in compiler error:
        // "Type 'string' is not assignable to type '[start: D, end: D]'"
        return rangeName;
    }
  }

  /**
   * @description Calculates the start and end dates of the month for a given date.
   * @param {D} forDay - The reference date to calculate the month for.
   * @returns {[start: D, end: D]} An array containing the start and end dates of the month.
   */
  private calculateMonth(forDay: D): [start: D, end: D] {
    const year = this.dateAdapter.getYear(forDay);
    const month = this.dateAdapter.getMonth(forDay);
    const start = this.dateAdapter.createDate(year, month, 1);
    const end = this.dateAdapter.addCalendarDays(
      start,
      this.dateAdapter.getNumDaysInMonth(forDay) - 1
    );
    return [start, end];
  }

  /**
   * @description  Calculates the start and end dates of the week for a given date.
   * @param {D} forDay - The reference date to calculate the week for.
   * @returns {[start: D, end: D]} An array containing the start and end dates of the week.
   */
  calculateWeek(forDay: D): [start: D, end: D] {
    const deltaStart =
      this.dateAdapter.getFirstDayOfWeek() -
      this.dateAdapter.getDayOfWeek(forDay);
    const start = this.dateAdapter.addCalendarDays(forDay, deltaStart);
    const end = this.dateAdapter.addCalendarDays(start, 6);
    return [start, end];
  }

  private get today(): D {
    const today = this.dateAdapter.getValidDateOrNull(new Date());
    if (today === null) {
      throw new Error('date creation failed');
    }
    return today;
  }

  /**
   * @description  It is used to perform clean-up tasks before the component is removed from the view.
   */
  ngOnDestroy(): void {
    if (this.selected) {
      this._selectedService.setStatus(true);
    } else {
      this._selectedService.setStatus(false);
    }
  }
}
