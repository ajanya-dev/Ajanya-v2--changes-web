import { Component } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import {
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepicker
} from '@angular/material/datepicker';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatSuffix } from '@angular/material/form-field';

@Component({
  selector: 'app-dt-select-date',
  templateUrl: './dt-select-date.component.html',
  styleUrls: ['./dt-select-date.component.scss'],
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker
  ]
})
export class DtSelectDateComponent implements AgFloatingFilterComponent {
  params!: IFloatingFilterParams;
  currentValue!: number;
  pickerf: any;
  agInit(params: IFloatingFilterParams): void {
    this.params = params;
  }

  onParentModelChanged() {
    // When the filter is empty we will receive a null value here
    // if (!parentModel) {
    //   this.currentValue = null;
    // } else {
    //   this.currentValue = parentModel.filter;
    // }
  }

  valueChanged() {
    if (this.currentValue == null) {
      // Remove the filter
      this.params.parentFilterInstance((instance: any) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }

    this.params.parentFilterInstance((instance: any) => {
      instance.onFloatingFilterChanged('equal to', this.currentValue);
    });
  }
}
