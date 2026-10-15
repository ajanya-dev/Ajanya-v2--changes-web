import { Component, inject } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gpbr-select-box',
  template: ` <select
    [(ngModel)]="currentValue"
    (ngModelChange)="valueChanged()"
    class="form-control"
  >
    <option selected value="">All</option>
    @for (value of options; track value.name) {
      <option [value]="value?.value">
        {{ value.name }}
      </option>
    }
  </select>`,
  styles: [
    `
      select {
        width: 100%;
      }
      ::ng-deep app-gpbr-select-box {
        width: 100%;
      }
      .ng-star-inserted {
        width: 100% !important;
      }
    `
  ],
  standalone: true,
  imports: [FormsModule]
})
export class GpbrSelectBoxComponent implements AgFloatingFilterComponent {
  private requestPayment = inject(RequestPaymentsService);

  currentValue = '';
  params: IFloatingFilterParams;
  colId: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onParentModelChanged(): void {}

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
    this.colId = this.params.column?.getColId();
  }

  options = [
    { value: 1, name: 'WEEKLY' },
    { value: 2, name: 'BI-WEEKLY' },
    { value: 3, name: 'MONTHLY' }
  ];

  valueChanged() {
    this.requestPayment.setFrequency(this.currentValue);
  }
}
