import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IBankDropdown } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { NgStyle } from '@angular/common';
import { DropDownBankMultiSelectComponent } from '../../../../shared/components/drop-downs/drop-down-bank-multi-select/drop-down-bank-multi-select.component';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-positivepay-bankaccounts',
  templateUrl: './positivepay-bankaccounts.component.html',
  styleUrls: ['./positivepay-bankaccounts.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    MatDialogClose,
    FormsModule,
    DropDownBankMultiSelectComponent,
    MatDialogActions,
    NgStyle
  ]
})
export class PositivepayBankaccountsComponent implements OnInit, OnDestroy {
  //  Injecting the services
  private _positivePayService = inject(PositivePayService);
  private _alertService = inject(AlertService);
  private _dialog = inject(MatDialog);
  private _datatableService = inject(DataTableService);
  private _bankService = inject(BankAccountsService);

  // Injecting the routing number from MAT_DIALOG_DATA
  routingNumber = inject(MAT_DIALOG_DATA);

  private v3dataTableService = inject(V3DataTableService);

  // Declaring other variables
  bankAccounts: IBankDropdown[] = [];
  allBankAccounts: IBankDropdown[] = [];
  bankAccountIds: string[] = [];
  subcriptions: Subscription[] = [];
  totalBankAccountsCount: number;
  isSelectAll = false;
  loading = false;
  isChecked = true;

  ngOnInit(): void {
    this.loadBankAccounts();
  }

  /**
   * @description Loading the banl account details based on the routing number
   */
  loadBankAccounts(): void {
    this.subcriptions.push(
      this._positivePayService
        .getPositivePayBankAccounts(this.routingNumber)
        .pipe()
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccounts = res?.data?.bankAccounts;
            this.totalBankAccountsCount = res?.data?.totalAccounts;
            if (this.bankAccounts?.length === this.totalBankAccountsCount) {
              this.isSelectAll = true;
            }
            this.getAllBankAccounts();
          }
        })
    );
  }

  /**
   * @description Get the Selected bank accounts
   */
  getAllBankAccounts(): void {
    this.subcriptions.push(
      this._bankService
        .getBankAccountsPerPage(this.totalBankAccountsCount, this.routingNumber)
        .subscribe((res) => {
          this.allBankAccounts = res?.data;
        })
    );
  }
  /**
   * @description Select all bank accounts `toggle` function
   *
   * @param event as converted to `HTMLInputElement` to get the target value.
   */
  selectAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target?.checked) {
      this.allBankAccounts.forEach((res) => {
        if (!this.bankAccountIds?.includes(res?.id)) {
          this.bankAccounts.push(res);
        }
      });
      this.bankAccounts = [...this.bankAccounts];
      this.isChecked = true;
    } else {
      this.bankAccounts = [];
      this.bankAccountIds = [];
      this.isChecked = false;
    }
  }

  /**
   * @description  On select bank accounts will push to the `this.bankAccountIds` array
   *
   * @param bankEvent `Interface: IBankDropdown[]`
   */
  bankSlectionEvent(bankEvent: IBankDropdown[]): void {
    this.bankAccountIds = [];
    bankEvent?.forEach((element) => {
      if (this.bankAccountIds?.indexOf(element?.id) === -1) {
        this.bankAccountIds?.push(element?.id);
      }
    });
    if (this.bankAccountIds?.length === this.totalBankAccountsCount) {
      this.isSelectAll = true;
    } else {
      this.isSelectAll = false;
    }
  }

  /**
   * @description Save the positive bank accounts
   */
  savePostivePayBankAccounts(): void {
    if (!this.loading) {
      this.loading = true;
      const payload = {
        routingNumber: this.routingNumber,
        bankAccountIds: this.bankAccountIds
      };
      if(!this.bankAccountIds.length){
        this._alertService.warningAlert({content:"Please select at least one bank account"});
        this.loading = false;
        return;
      }
      this.subcriptions.push(
        this._positivePayService
          .setPositivePayBankAccounts(payload)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res.success) {
              const data = {
                title: 'Success',
                content: res.message,
                doneMsg: 'OK',
                close: false
              };
              const success = this._alertService.successAlert(data);
              success.afterClosed().subscribe((res) => {
                if (res) {
                  this._dialog.closeAll();
                  this._datatableService.setRefreshStatus(true, 32);
                  this.v3dataTableService.refreshV3DataTable();
                }
              });
            } else {
              this._alertService.warningAlert({ content: res.message });
            }
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subcriptions?.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
