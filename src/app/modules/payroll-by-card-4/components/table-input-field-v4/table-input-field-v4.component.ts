import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { Subscription, finalize } from 'rxjs';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, CurrencyPipe } from '@angular/common';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { PayrollFeeV4Service } from '../payroll-fee-v4/payroll-fee-v4.service';

interface IExtendedCellRendererParams extends ICellRendererParams {
  columnName?: string;
  onUpdate: () => void;
}

@Component({
  selector: 'app-table-input-field-v4',
  templateUrl: './table-input-field-v4.component.html',
  styleUrls: ['./table-input-field-v4.component.scss'],
  standalone: true,
  imports: [
    NgxMaskDirective,
    FormsModule,
    LucideAngularModule,
    MatTooltip,
    NgClass,
    CurrencyPipe
  ]
})
export class TableInputFieldV4Component
  implements AgRendererComponent, OnInit, OnDestroy
{
  private payrollService = inject(PayrollService);
  private payrollFeeService = inject(PayrollFeeV4Service);
  private alertService = inject(V4AlertService);

  amount: number;
  commonTransactionTableRowData: ICommonTransactionTableData;
  rowIndex: number;
  status: number;
  filedName: string | undefined;
  editMode = false;
  subscription: Subscription[] = [];
  agGridCellRendererParams: IExtendedCellRendererParams;
  selectedApp: IPayrollApps;
  isLoading = false;
  subscriptions: Subscription[] = [];
  isManual = false;

  refresh(): boolean {
    return true;
  }

  agInit(params: IExtendedCellRendererParams) {
    this.agGridCellRendererParams = params;
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
      this.status = params.data.status;
      this.filedName = params?.columnName;
      if (this.filedName === 'gross_pay') {
        this.amount = params.data.gross_pay;
        this.payrollService.editedGrossPay[params.data.id] =
          params.data.gross_pay;
        this.payrollService.chargeData[params.data.id] = params.data.gross_pay;
        this.editMode = true;
      } else {
        this.amount = params.data.processed_amount;
        this.payrollService.chargeData[params.data.id] =
          params.data.processed_amount;
        this.editMode = false;
      }
      if (
        params.node &&
        params.node.rowIndex !== null &&
        params.node.rowIndex !== undefined
      ) {
        this.rowIndex = params.node?.rowIndex;
      }
    }
  }

  ngOnInit(): void {
    if (this.filedName === 'gross_pay') {
      this.getSelectedAccount();
      this.selectedApp = this.payrollService.selectedApp;
      this.isManual = !!this.selectedApp?.manual;
    }
  }

  /**
   * @description Update the amount in the payroll service for a specific transaction row.
   */
  updateAmount() {
    if (this.commonTransactionTableRowData.id) {
      if (this.filedName === 'gross_pay') {
        this.payrollService.editedGrossPay[
          this.commonTransactionTableRowData.id
        ] = this.amount;
        this.payrollService.chargeData[this.commonTransactionTableRowData.id] =
          this.amount;
      } else {
        this.payrollService.chargeData[this.commonTransactionTableRowData.id] =
          this.amount;
      }
    }

    this.payrollFeeService.amount.set({
      amount: this.amount,
      rowId: this.agGridCellRendererParams.data?.id
    });
  }

  /**
   * @description Update the fee in the payroll service.
   */
  updateFee() {
    this.payrollService.amountChangeSubject.next({
      amount: this.amount,
      rowIndex: this.rowIndex
    });
  }

  /**
   * @description Used to edit gross pay amount.
   */
  onEdit() {
    if (this.isLoading) return;
    this.editMode = false;
    this.getSelectedAccount();
  }

  /**
   * @description Retrieve details of the selected account from the payroll service.
   */
  getSelectedAccount() {
    this.subscription.push(
      this.payrollService.payrollAppId.subscribe((res) => {
        if (res) {
          this.selectedApp = res;
          this.isManual = !!res?.manual;
        }
      })
    );
  }

  /**
   * @description Used to update gross pay amount.
   */
  onUpdate() {
    this.editMode = true;
    this.updateGrossPayAmount(
      this.commonTransactionTableRowData?.id as string,
      this.amount
    );
  }

  /**
   * @description Update the gross pay amount for a specific payroll entry.
   * @param {string} id - The payroll entry ID.
   * @param {number} amount - The new gross pay amount to be set.
   */
  updateGrossPayAmount(id: string, amount: number) {
    const sendData = {
      grossPayAmount: amount,
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
          })
        )
        .subscribe((res) => {
          if (res) {
            this.agGridCellRendererParams?.onUpdate();
            this.alertService.successAlert({
              content: 'Amount updated successfully'
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
