import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';

import { ChangeDetectionStrategy } from '@angular/core';

import { HeaderComponent } from './header/header.component';
import { SelectedDateService } from './selected.service';
import {
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';

/**
 * @description Component for setting a date range.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    ReactiveFormsModule
  ],
  selector: 'app-date-range-main',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangeComponent implements OnInit {
  readonly ExampleHeaderComponent = HeaderComponent;
  @Input() selectedLabel: string;
  @Input() enableCustom = false;
  range!: UntypedFormGroup;
  isTouchUIActivated = false;
  @Output() selectedRange = new EventEmitter();
  selected: string;
  status: boolean;
  isChange: boolean;
  constructor(private _selectedService: SelectedDateService) {}

  ngOnInit(): void {
    this._selectedService.getValue().subscribe((val) => {
      if (val) {
        this.selected = val;
      }
    });

    this._selectedService.getStatus().subscribe((val) => {
      this.status = val;

      if (this.status == false && this.isChange == false) {
        this._selectedService.setValue('Custom');
        this.selected = 'Custom';
      }
    });

    this.range = new UntypedFormGroup({
      start: new UntypedFormControl(),
      end: new UntypedFormControl()
    });
    if (this.selectedLabel) {
      this.selected = this.selectedLabel;
    }
  }

  /**
   * @description Toggles material date picker
   * @param toggle - Mat date picker element.
   */
  datePicker(toggle: MatDatepickerToggle<Date>) {
    toggle._button._elementRef.nativeElement.click();
  }

  /**
   * @description Method to be invoked, when date range is selected. Emits event with selected date range values.
   */
  changeEvent() {
    const selectedRange = this.range.value;
    this.selectedRange.next(selectedRange);
  }

  /**
   * @description Sets the `this.selected` value to the behavior subject `selectedValue` in `this._selectedService`.
   */
  open() {
    this._selectedService.setValue(this.selected);
  }
}
