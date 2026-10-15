import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  OnDestroy
} from '@angular/core';

import {
  DateAdapter,
  MatDateFormats,
  MAT_DATE_FORMATS
} from '@angular/material/core';

import { MatCalendar } from '@angular/material/datepicker';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { CustomRangeComponent } from './custom-range/custom-range.component';

/**
 * @description Component for header in content layout.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CustomRangeComponent, MatIconButton, MatIcon]
})
export class HeaderComponent<D> implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private calendar: MatCalendar<D>, // calendar instance of picker
    private dateAdapter: DateAdapter<D>, // native or moment date adapter
    @Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats, // for formatting
    cdr: ChangeDetectorRef
  ) {
    calendar.stateChanges
      .pipe(takeUntil(this.destroy$)) // unsubscribe when destroyed
      .subscribe(() => cdr.markForCheck());
  }
  /**
   * @description Getter method for active date label rendered between the arrow buttons.
   */
  get periodLabel(): string {
    // use date adapter to format the label, e.g. "SEP 2020"
    return this.dateAdapter
      .format(this.calendar.activeDate, this.dateFormats.display.monthYearLabel)
      .toLocaleUpperCase();
  }

  /**
   * @description Method invoked when user clicks on one of the left buttons.
   * @param mode - month or year.
   */
  previousClicked(mode: 'month' | 'year'): void {
    this.changeDate(mode, -1);
  }

  /**
   * @description Method invoked when user clicks on one of the left buttons.
   * @param mode - month or year.
   */
  nextClicked(mode: 'month' | 'year'): void {
    this.changeDate(mode, 1);
  }

  /**
   * @description Method to increment or decrement month or year.
   * @param mode - month or year.
   * @param amount - increment or decrement (1 or -1).
   */
  private changeDate(mode: 'month' | 'year', amount: -1 | 1): void {
    this.calendar.activeDate =
      mode === 'month'
        ? this.dateAdapter.addCalendarMonths(this.calendar.activeDate, amount)
        : this.dateAdapter.addCalendarYears(this.calendar.activeDate, amount);
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // will trigger unsubscription in takeUntil
  }
}
