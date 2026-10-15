import { Component, OnInit, inject } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { IReceivedTypes } from '../../model/ReceivePayment';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Params } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-gpbr-select-box',
  template: `<div
    class="flex justify-between pr-2"
    [ngClass]="{
      'border border-common-blue-color rounded':
        currentValue !== ' ' && currentValue
    }"
  >
    <select
      [(ngModel)]="currentValue"
      (ngModelChange)="valueChanged()"
      value=""
      class="form-control !w-[160px]"
    >
      <option selected value=" ">All</option>
      @for (value of options; track value) {
        <option [ngValue]="value?.value">
          {{ value.name }}
        </option>
      }
    </select>
    @if (currentValue !== ' ' && currentValue) {
      <fa-icon
        (click)="resetFilter()"
        class="text-secondary-text-color cursor-pointer font-black text-sm mb-[-2px]"
        [icon]="faXmark"
      ></fa-icon>
    }
  </div>`,
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
  imports: [FormsModule, FontAwesomeModule, NgClass]
})
export class RCSelectBoxComponent implements AgFloatingFilterComponent, OnInit {
  private requestPayment = inject(RequestPaymentsService);
  private dataTableService = inject(DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private v3DataTableService = inject(V3DataTableService);

  faXmark = faXmark;

  currentValue:
    | { type: string | number; status?: string | number }
    | string
    | number = ' ';

  params: IFloatingFilterParams;
  subscriptions: Subscription[] = [];
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);
  cellRendererRePymntsStatus: Params = {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onParentModelChanged(): void {}

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
  }

  ngOnInit(): void {
    this.getStatus();
    this.setCellFilter();
  }

  getStatus() {
    this.subscriptions.push(
      this.requestPaymentsService.getStatusArray().subscribe((res) => {
        this.cellRendererRePymntsStatus = res;
      })
    );
  }

  options = [
    { value: 1, name: 'Email' },
    { value: 14, name: 'Requested' },
    { value: { type: 4, status: 1 }, name: 'GPBL Pending' },
    { value: { type: 4, status: 2 }, name: 'GPBL Viewed' },
    { value: { type: 4, status: 3 }, name: 'GPBL Rejected' },
    { value: { type: 4, status: 4 }, name: 'GPBL Accepted' },
    { value: { type: 4, status: 5 }, name: 'GPBL TTP' },
    { value: { type: 4, status: 6 }, name: 'GPBL Printed' },
    { value: { type: 4, status: 7 }, name: 'HTML-FORM-SENDER-FPRINTED' },
    { value: { type: 4, status: 30 }, name: 'GPBL DD' },
    { value: { type: 4, status: 32 }, name: 'DD Rejected' },
    { value: { type: 4, status: 50 }, name: 'DD Initiated' },
    { value: { type: 4, status: 51 }, name: 'DD Completed' },
    { value: { type: 4, status: 52 }, name: 'DD Failed' },
    { value: 5, name: 'ACH' },
    { value: 6, name: 'M-ACH' },
    { value: 10, name: 'Stripe' },
    { value: 11, name: 'Paypal' }
  ];

  /**
   * @description Set filter when click cell filter icon.
   */
  setCellFilter(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (
          res?.field === this.params.column.getColDef()?.headerName &&
          res?.filter
        ) {
          const filterValue: {
            receivedType: number;
            statusValue: number;
          } = JSON.parse(res.filter);
          this.options.forEach((option) => {
            if (option.value === Number(filterValue.receivedType)) {
              this.currentValue = option.value;
            }
            if (
              (option.value as { type: number; status: number }).type ===
                Number(filterValue.receivedType) &&
              (option.value as { type: number; status: number }).status ===
                Number(filterValue.statusValue)
            ) {
              this.currentValue = option.value;
            }
          });
          this.valueChanged();
        }
      })
    );
  }

  valueChanged() {
    this.params.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged(null, null);
    });
    this.requestPayment.setReceivedTypes(this.currentValue as IReceivedTypes);
  }

  resetFilter(): void {
    this.currentValue = ' ';
    this.valueChanged();
    this.v3DataTableService.gridApi.deselectAll();
  }
}
