import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, signal } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCalendarDay,
  faChevronLeft,
  faChevronRight,
  faEye,
  faEyeSlash
} from '@fortawesome/pro-solid-svg-icons';
import { V35ControlMessageComponent } from '../control-message-v35/control-message-v35.component';

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-v3-date-picker',
  templateUrl: './v3-date-picker.component.html',
  styleUrls: ['./v3-date-picker.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    FaIconComponent,
    V35ControlMessageComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V3DatePickerComponent),
      multi: true
    }
  ]
})
export class V3DatePickerComponent implements ControlValueAccessor {
  private static idCounter = 0;

  private static nextTriggerId(): string {
    const id = V3DatePickerComponent.idCounter;
    V3DatePickerComponent.idCounter += 1;
    return `v3-date-picker-${id}`;
  }

  readonly triggerId = V3DatePickerComponent.nextTriggerId();

  placeholder = input.required<string>();
  control = input<AbstractControl>();
  isFieldRequired = input(true);
  minDate = input<string>();
  maxDate = input<string>();
  maskDisplay = input(false);
  hideTodayShortcut = input(false);

  readonly faCalendarDay = faCalendarDay;
  readonly faChevronLeft = faChevronLeft;
  readonly faChevronRight = faChevronRight;
  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  readonly monthShortNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  isOpen = false;
  viewMode: 'days' | 'months' | 'years' = 'days';
  yearRangeStart = 0;
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null = null;
  calendarDays: CalendarDay[] = [];
  displayValue = '';
  revealed = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.buildCalendar();
  }

  get shownValue(): string {
    if (!this.displayValue) return '';
    if (this.maskDisplay() && !this.revealed() && !this.isOpen) {
      return '**/**/****';
    }
    return this.displayValue;
  }

  toggleReveal(): void {
    this.revealed.set(!this.revealed());
  }

  toggleCalendar(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.viewMode = 'days';
      const landing =
        this.selectedDate && !this.isDateDisabled(this.selectedDate)
          ? this.selectedDate
          : this.defaultLandingDate();
      if (landing) {
        this.currentMonth = landing.getMonth();
        this.currentYear = landing.getFullYear();
        this.buildCalendar();
      }
    }
  }

  /**
   * Today's month may lie entirely outside min/max (e.g. a date-of-birth
   * field capped at 18 years ago), which would open the calendar on a
   * fully-disabled month with nothing selectable. Land on the nearest bound.
   */
  private defaultLandingDate(): Date | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const max = this.maxDate();
    if (max) {
      const maxD = new Date(`${max}T00:00:00`);
      if (today > maxD) return maxD;
    }
    const min = this.minDate();
    if (min) {
      const minD = new Date(`${min}T00:00:00`);
      if (today < minD) return minD;
    }
    return null;
  }


  closeCalendar(): void {
    if (this.isOpen) {
      this.onTouched();
      this.isOpen = false;
      this.viewMode = 'days';
    }
  }

  prevMonth(): void {
    if (this.viewMode === 'years') {
      this.yearRangeStart -= 12;
      return;
    }
    if (this.viewMode === 'months') {
      this.currentYear -= 1;
      return;
    }
    this.currentMonth -= 1;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear -= 1;
    }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.viewMode === 'years') {
      this.yearRangeStart += 12;
      return;
    }
    if (this.viewMode === 'months') {
      this.currentYear += 1;
      return;
    }
    this.currentMonth += 1;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear += 1;
    }
    this.buildCalendar();
  }

  showMonthPicker(): void {
    this.viewMode = 'months';
  }

  showYearPicker(): void {
    this.yearRangeStart = this.currentYear - 5;
    this.viewMode = 'years';
  }

  selectMonthFromPicker(month: number): void {
    if (this.isMonthDisabled(month)) return;
    this.currentMonth = month;
    this.viewMode = 'days';
    this.buildCalendar();
  }

  selectYearFromPicker(year: number): void {
    if (this.isYearDisabled(year)) return;
    this.currentYear = year;
    this.viewMode = 'months';
  }

  get yearRange(): number[] {
    return Array.from({ length: 12 }, (_, i) => this.yearRangeStart + i);
  }

  isMonthDisabled(month: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const firstOfMonth = new Date(this.currentYear, month, 1);
    const lastOfMonth = new Date(this.currentYear, month + 1, 0);
    if (min) {
      const minD = new Date(`${min}T00:00:00`);
      if (lastOfMonth < minD) return true;
    }
    if (max) {
      const maxD = new Date(`${max}T00:00:00`);
      if (firstOfMonth > maxD) return true;
    }
    return false;
  }

  isYearDisabled(year: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const firstOfYear = new Date(year, 0, 1);
    const lastOfYear = new Date(year, 11, 31);
    if (min) {
      const minD = new Date(`${min}T00:00:00`);
      if (lastOfYear < minD) return true;
    }
    if (max) {
      const maxD = new Date(`${max}T00:00:00`);
      if (firstOfYear > maxD) return true;
    }
    return false;
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;
    this.selectedDate = day.date;
    this.displayValue = this.formatDisplayDate(day.date);
    this.onChange(this.formatValueDate(day.date));
    this.onTouched();
    this.isOpen = false;
    this.buildCalendar();
  }

  selectToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (this.isDateDisabled(today)) return;
    this.selectedDate = today;
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.displayValue = this.formatDisplayDate(today);
    this.onChange(this.formatValueDate(today));
    this.onTouched();
    this.isOpen = false;
    this.buildCalendar();
  }

  writeValue(value: string): void {
    if (value) {
      const date = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        this.selectedDate = date;
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();
        this.displayValue = this.formatDisplayDate(date);
        this.buildCalendar();
      }
    } else {
      this.selectedDate = null;
      this.displayValue = '';
      this.buildCalendar();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0
    ).getDate();
    const daysInPrevMonth = new Date(
      this.currentYear,
      this.currentMonth,
      0
    ).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.calendarDays = [];

    for (let i = startDayOfWeek - 1; i >= 0; i -= 1) {
      const day = daysInPrevMonth - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, day);
      this.calendarDays.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: this.isSameDate(date, this.selectedDate),
        isDisabled: this.isDateDisabled(date)
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push({
        day,
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: this.isSameDate(date, this.selectedDate),
        isDisabled: this.isDateDisabled(date)
      });
    }

    const remaining = 42 - this.calendarDays.length;
    for (let day = 1; day <= remaining; day += 1) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      this.calendarDays.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: this.isSameDate(date, this.selectedDate),
        isDisabled: this.isDateDisabled(date)
      });
    }
  }

  private isSameDate(a: Date, b: Date | null): boolean {
    if (!b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private isDateDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min) {
      const minD = new Date(`${min}T00:00:00`);
      if (date < minD) return true;
    }
    if (max) {
      const maxD = new Date(`${max}T00:00:00`);
      if (date > maxD) return true;
    }
    return false;
  }

  private formatDisplayDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private formatValueDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
