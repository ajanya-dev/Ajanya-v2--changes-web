import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  MatDatepickerInputEvent,
  MatDatepickerModule
} from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';

/**
 * DatePickerV35Component - A date picker component.
 *
 * This component allows users to select a date and emits events when a date is selected.
 *
 * @usage Notes
 *
 * - Use the `@Input` decorator to specify the width of the date picker component.
 * - Use the `@Output` decorator to subscribe to date selection events.
 *
 * @example
 *
 * <app-date-picker-v35 [width]="'50%'" (dateEmiter)="handleDateSelection($event)"></app-date-picker-v35>
 */
@Component({
  standalone: true,
  imports: [MatDatepickerModule, MatInputModule],
  selector: 'app-date-picker-v35',
  templateUrl: './date-picker-v35.component.html',
  styleUrls: ['./date-picker-v35.component.scss']
})
export class DatePickerV35Component {
  /**
   * List of events associated with the date picker.
   */
  events: string[] = [];

  /**
   * EventEmitter for date selection events.
   */
  @Output() dateEmiter = new EventEmitter();

  /**
   * Input property for setting the width of the date picker component.
   * Default value is '100%'.
   */
  @Input() width = '100%';

  /**
   * Holds the selected date in string format.
   */
  selectedDate = '';

  /**
   * Function to add an event when a date is selected.
   *
   * @param type - The type of event (e.g., 'input', 'change', etc.).
   * @param event - The MatDatepickerInputEvent containing the selected date.
   */
  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.events = [];
    this.events.push(`${type}: ${event.value}`);
    this.dateEmiter.emit(this.events[0]);
  }
}
