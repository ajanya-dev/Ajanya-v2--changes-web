import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, model, signal } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  LucideAngularModule,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  Eye,
  EyeOff
} from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { V4ControlMessageComponent } from '../control-message-v4/control-message-v4.component';

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-v4-date-picker',
  templateUrl: './v4-date-picker.component.html',
  styleUrls: ['./v4-date-picker.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    LucideAngularModule,
    V4ControlMessageComponent,
    MatTooltip
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V4DatePickerComponent),
      multi: true
    }
  ]
})
export class V4DatePickerComponent implements ControlValueAccessor {
  private static idCounter = 0;

  private static nextTriggerId(): string {
    const id = V4DatePickerComponent.idCounter;
    V4DatePickerComponent.idCounter += 1;
    return `v4-date-picker-${id}`;
  }

  /** Stable id for label[for] association with the trigger button. */
  readonly triggerId = V4DatePickerComponent.nextTriggerId();

  placeholder = input.required<string>();
  control = input<AbstractControl>();
  isFieldRequired = input(true);
  fieldLabel = input('');
  fieldHeight = input<'44px' | '32px'>('44px');
  minDate = input<string>();
  maxDate = input<string>();
  disabled = model(false);
  errorLabel = input('');
  tooltip = input('');
  hideTodayShortcut = input(false);
  showInfoIcon = input(false);
  maskDisplay = input(false);

  readonly CalendarDaysIcon = CalendarDays;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly InfoIcon = Info;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

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

  isOpen = false;
  viewMode: 'days' | 'months' | 'years' = 'days';
  yearRangeStart = 0;
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null = null;
  calendarDays: CalendarDay[] = [];
  displayValue = '';
  revealed = signal(false);

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
    if (this.disabled()) return;
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
      if (this.isYearDisabled(this.currentYear - 1)) return;
      this.currentYear -= 1;
      return;
    }
    let newMonth = this.currentMonth - 1;
    let newYear = this.currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    if (this.isMonthYearDisabled(newMonth, newYear)) return;
    this.currentMonth = newMonth;
    this.currentYear = newYear;
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.viewMode === 'years') {
      this.yearRangeStart += 12;
      return;
    }
    if (this.viewMode === 'months') {
      if (this.isYearDisabled(this.currentYear + 1)) return;
      this.currentYear += 1;
      return;
    }
    let newMonth = this.currentMonth + 1;
    let newYear = this.currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    if (this.isMonthYearDisabled(newMonth, newYear)) return;
    this.currentMonth = newMonth;
    this.currentYear = newYear;
    this.buildCalendar();
  }

  showMonthPicker(): void {
    if (this.disabled()) return;
    this.viewMode = 'months';
  }

  showYearPicker(): void {
    if (this.disabled()) return;
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
    return this.isMonthYearDisabled(month, this.currentYear);
  }

  private isMonthYearDisabled(month: number, year: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
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

  // ControlValueAccessor
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

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
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

    // Previous month days
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

    // Current month days
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

    // Next month days to fill remaining cells (up to 42 = 6 rows)
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
