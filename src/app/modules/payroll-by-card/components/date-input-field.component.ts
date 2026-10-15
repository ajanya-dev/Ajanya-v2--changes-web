import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription, finalize } from 'rxjs';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IPayrollApps } from '../../payroll/model/payroll';
import {
  PAYROLL_DATE_LIMIT,
  PayrollService
} from '../services/payroll.service';
import { faFilterList } from '@fortawesome/pro-solid-svg-icons';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

interface IExtendedCellRendererParams extends ICellRendererParams {
  onUpdate: () => void;
}

@Component({
  selector: 'app-date-input-field',
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <div>
        @if ((status === 0 || status === 3) && editMode) {
          <div class="flex gap-2">
            <input
              class="input_style !min-w-[90px]"
              type="date"
              [(ngModel)]="formattedDate"
              [min]="minDate"
            />
            <div class="flex items-center">
              @if (status === 0 || status === 3) {
                <fa-icon
                  class="text-common-green-color cursor-pointer"
                  [icon]="['fas', 'check']"
                  (click)="onUpdate()"
                ></fa-icon>
              }
            </div>
          </div>
        } @else {
          <div class="flex gap-1">
            <span>{{ date }}</span>
            @if ((status === 0 || status === 3) && isManual && !editMode) {
              <fa-icon
                class="text-common-blue-color cursor-pointer"
                [ngClass]="{ 'cursor-default': isLoading }"
                [icon]="['fas', 'pen-to-square']"
                (click)="onEdit()"
              ></fa-icon>
            }
          </div>
        }
      </div>
      @if (showFilterIcon && !editMode) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    CommonFilterIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateInputFieldComponent
  implements AgRendererComponent, OnInit, OnDestroy
{
  payrollService = inject(PayrollService);
  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);

  showFilterIcon = false;
  faFilterList = faFilterList;
  status: number;
  date: string;
  isManual = false;
  selectedApp: IPayrollApps;
  editMode = false;
  formattedDate: string;
  commonTransactionTableRowData: ICommonTransactionTableData;
  isLoading = false;
  agGridCellRendererParams: IExtendedCellRendererParams;
  subscriptions: Subscription[] = [];
  minDate: string;
  agInit(params: IExtendedCellRendererParams): void {
    this.agGridCellRendererParams = params;
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
      this.status = params?.data?.status;
      this.date = params?.data?.check_date;
      this.formattedDate = this.convertDateFormat(params?.data?.check_date);
    }
  }

  refresh(): boolean {
    return true;
  }

  ngOnInit(): void {
    this.selectedApp = this.payrollService.selectedApp;
    this.isManual = !!this.selectedApp?.manual;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - PAYROLL_DATE_LIMIT);
    this.minDate = minDate.toISOString().split('T')[0];
  }

  /**
   * @description Used to open edit field.
   */
  onEdit() {
    if (this.isLoading) return;
    this.editMode = true;
  }

  /**
   * @description Used to update payroll Date.
   */
  onUpdate() {
    this.updatePayrollDate(
      this.commonTransactionTableRowData?.id as string,
      this.formattedDate
    );
  }


  /**
   * @description Update the payroll date for a specific payroll entry.
   * @param {string} id - The payroll entry ID.
   * @param {number} date - The new payroll date to be set.
   */
  updatePayrollDate(id: string, date: string) {

    if(date < this.minDate){
      this.alertService.warningAlert({
        content: `Payroll check date cannot be older than ${PAYROLL_DATE_LIMIT} days.`
      });
      return;
    }

    const sendData = {
      payrollDate: date,
      payrollId: id,
      manual: this.selectedApp?.manual
    };
    this.isLoading = true;
    this.subscriptions.push(
      this.payrollService
        .updateGrossPayAmount(this.selectedApp.id, sendData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.editMode = true;
          })
        )
        .subscribe((res) => {
          if (res) {
            this.agGridCellRendererParams?.onUpdate();
            this.alertService.successAlert({
              content: 'Date updated successfully'
            });
          }
        })
    );
  }

  /**
   * @description Converts a date from the format 'MM/DD/YYYY' to 'YYYY-MM-DD'.
   * It is used to auto populate date in input filed.
   *
   * @param {string} inputDate - The input date string in 'MM/DD/YYYY' format.
   * @returns {string} The formatted date string in 'YYYY-MM-DD' format.
   */
  convertDateFormat(inputDate: string): string {
    if (!inputDate) {
      return '';
    }
    const parts = inputDate.split('/');
    const formattedDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
    return formattedDate;
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.date,
      field: this.agGridCellRendererParams.colDef?.headerName as string,
      payee: undefined,
      isDate: true
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
