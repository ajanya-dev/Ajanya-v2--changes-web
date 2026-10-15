import { Component } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-gpbr-select-box',
  template: ` <select
    [(ngModel)]="currentValue"
    (ngModelChange)="statusValue()"
    value=""
    class="form-control"
  >
    <option selected="selected" value="">All</option>
    <option [value]="value?.value" *ngFor="let value of options">
      {{ value.name }}
    </option>
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
  imports: [FormsModule, NgFor]
})
export class GpbrStatusBoxComponent implements AgFloatingFilterComponent {
  currentValue = '';
  params: IFloatingFilterParams;
  colId: string;

  constructor(
    private _requestPayment: RequestPaymentsService,
    private _dataTableService: DataTableService
  ) {}

  onParentModelChanged() // eslint-disable-next-line @typescript-eslint/no-empty-function
  : void {}

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
    this.colId = this.params.column?.getColId();
  }

  options = [
    { value: 1, name: 'Started' },
    { value: 2, name: 'Completed' },
    { value: 3, name: 'Paused' },
    { value: 4, name: 'Cancelled' },
    { value: 5, name: 'starting Soon' }
  ];

  statusValue() {
    this._requestPayment.setStatus(this.currentValue);
    this._dataTableService.setRefreshStatus(true);
  }
}
