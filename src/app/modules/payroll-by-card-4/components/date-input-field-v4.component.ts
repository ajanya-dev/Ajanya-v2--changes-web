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
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, finalize } from 'rxjs';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import {
  PAYROLL_DATE_LIMIT,
  PayrollService
} from '../../payroll-by-card/services/payroll.service';
import { IPayrollApps } from '../../payroll/model/payroll';

interface IExtendedCellRendererParams extends ICellRendererParams {
  onUpdate: () => void;
}

@Component({
  selector: 'app-date-input-field-v4',
  template: `
    <div class="flex gap-1 items-center w-full">
      <div>
        @if ((status === 0 || status === 3) && editMode) {
          <div class="v4-cell-editor">
            <input
              class="v4-input-style v4-cell-editor__input !min-w-[90px]"
              type="date"
              [(ngModel)]="formattedDate"
              [min]="minDate"
            />
            @if (status === 0 || status === 3) {
              <button
                type="button"
                class="action-icon-btn v4-cell-editor__action"
                matTooltip="Save payroll date"
                (click)="onUpdate()"
              >
                <lucide-icon name="check" [size]="12"></lucide-icon>
              </button>
            }
          </div>
        } @else {
          <div class="flex items-center gap-1 whitespace-nowrap">
            <span>{{ date }}</span>
            @if ((status === 0 || status === 3) && isManual && !editMode) {
              <button
                type="button"
                class="action-icon-btn"
                matTooltip="Edit payroll date"
                [ngClass]="{ 'cursor-default': isLoading }"
                (click)="onEdit()"
              >
                <lucide-icon name="pencil" [size]="12"></lucide-icon>
              </button>
            }
          </div>
        }
      </div>
      @if (!editMode) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  // Same in-cell editor chrome as the payments-out table
  // (`v4-custom-cell-editor`): `.v4-input-style` (global) supplies the border,
  // radius, font and colors — only the compact cell sizing lives here.
  styles: [
    `
      .v4-cell-editor {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .v4-cell-editor__input {
        flex: 1 1 auto;
        min-width: 0;
        height: 28px;
        padding: 2px 8px;
        font-size: 13px;
        background-color: var(--v4-secondary-background-color);
      }

      .v4-cell-editor__input:focus {
        border-color: var(--v4-brand-border-color);
        box-shadow: 0 0 0 2px
          color-mix(in srgb, var(--v4-primary-brand-color) 15%, transparent);
      }

      .v4-cell-editor__action {
        flex: 0 0 auto;
      }

      /* The shared .action-icon-btn colours its icon brand-blue on the element
         itself, so the confirm tick needs a higher-specificity rule to stay green. */
      .v4-cell-editor .v4-cell-editor__action lucide-icon {
        color: var(--v4-common-green-color);
      }
    `
  ],
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FormsModule,
    MatTooltip,
    CommonFilterIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateInputFieldV4Component
  implements AgRendererComponent, OnInit, OnDestroy
{
  payrollService = inject(PayrollService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);

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
    if (date < this.minDate) {
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
