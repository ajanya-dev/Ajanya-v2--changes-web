import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  effect,
  input,
  output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { LucideAngularModule, CalendarDays } from 'lucide-angular';
import { CommonButtonV4Component } from '../buttons/common-button-v4/common-button-v4.component';
import { V4DatePickerComponent } from '../v4-date-picker/v4-date-picker.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OverlayModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4DatePickerComponent
  ],
  selector: 'app-v4-date-range-selector',
  templateUrl: './v4-date-range-selector.component.html',
  styleUrls: ['./v4-date-range-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4DateRangeSelectorComponent {
  @HostBinding('class') readonly hostClass = 'w-full';
  readonly dateEmiter = output<{ start: null | string; end: null | string }>();
  readonly selectDate = input<
    { start: Date | null; end: Date | null } | string
  >();

  readonly width = input('w-full');

  readonly CalendarDaysIcon = CalendarDays;

  isOpen = false;

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

  selectedDateRangeName = 'All Time';

  selectedStartEndDate = {
    startDate: '',
    endDate: ''
  };

  startDate: Date = new Date();
  endDate: Date = new Date();

  constructor() {
    effect(() => {
      const val = this.selectDate();
      if (!val) return;
      if (typeof val === 'string') {
        const index = this.dateRanges.findIndex((type) => type.id === val);
        if (index !== -1) {
          this.selectDateRange(this.dateRanges[index].id);
        }
      } else if (val.start && val.end) {
        this.startDate = val.start;
        this.endDate = val.end;
        this.selectedDateRangeName = 'Custom';
        this.selectedStartEndDate.startDate = this.getFormatedDate(val.start);
        this.selectedStartEndDate.endDate = this.getFormatedDate(val.end);
        this.dateEmiter.emit({
          start: this.selectedStartEndDate.startDate,
          end: this.selectedStartEndDate.endDate
        });
      }
    });
  }

  toggleDateRange(): void {
    this.isOpen = !this.isOpen;
  }

  onBackdropClick(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = false;
  }

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
        this.startDate.setDate(this.startDate.getDate() - 6);
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
        this.startDate = new Date(2000, 0, 1);
        this.endDate = new Date();
        break;
      default:
        break;
    }
    this.selectedStartEndDate.startDate = this.getFormatedDate(this.startDate);
    this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
    this.dateEmiter.emit({
      start: this.selectedStartEndDate.startDate,
      end: this.selectedStartEndDate.endDate
    });
  }

  getFormatedDate(unformatedDate: Date): string {
    const year = unformatedDate.getFullYear();
    const month = String(unformatedDate.getMonth() + 1).padStart(2, '0');
    const date = String(unformatedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  onFromDateChange(value: string): void {
    if (value) {
      this.startDate = new Date(value);
      this.selectedDateRangeName = 'Custom';
    }
  }

  onToDateChange(value: string): void {
    if (value) {
      this.endDate = new Date(value);
      this.selectedDateRangeName = 'Custom';
    }
  }

  resetFilter(): void {
    this.startDate = new Date(2000, 0, 1);
    this.endDate = new Date();
    this.selectedStartEndDate.startDate = this.getFormatedDate(this.startDate);
    this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
    this.selectedDateRangeName = 'All Time';
    this.dateEmiter.emit({
      start: this.selectedStartEndDate.startDate,
      end: this.selectedStartEndDate.endDate
    });
  }

  customFilter(): void {
    this.selectedStartEndDate.startDate = this.getFormatedDate(this.startDate);
    this.selectedStartEndDate.endDate = this.getFormatedDate(this.endDate);
    if (this.selectedStartEndDate.startDate) {
      this.isOpen = false;
      this.dateEmiter.emit({
        start: this.selectedStartEndDate.startDate,
        end: this.selectedStartEndDate.endDate
      });
    }
  }
}
