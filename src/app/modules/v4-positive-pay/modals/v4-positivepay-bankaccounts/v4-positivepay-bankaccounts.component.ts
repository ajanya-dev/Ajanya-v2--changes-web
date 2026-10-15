import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, X, Info } from 'lucide-angular';

import { IBankDropdown } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-multi-select-dropdown-v4/bank-multi-select-dropdown-v4.component';

@Component({
  selector: 'app-v4-positivepay-bankaccounts',
  templateUrl: './v4-positivepay-bankaccounts.component.html',
  styleUrls: ['./v4-positivepay-bankaccounts.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogClose,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component,
    BankMultiSelectDropdownV4Component
  ]
})
export class V4PositivepayBankaccountsComponent implements OnInit {
  private positivePayService = inject(PositivePayService);
  private alertService = inject(V4AlertService);
  private bankAccountsService = inject(BankAccountsService);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  routingNumber: string = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly InfoIcon = Info;

  bankAccounts: IBankDropdown[] = [];
  allBankAccounts: IBankDropdown[] = [];
  bankAccountIds: string[] = [];
  totalBankAccountsCount = 0;
  isSelectAll = false;
  isChecked = true;
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadBankAccounts();
  }

  loadBankAccounts(): void {
    this.positivePayService
      .getPositivePayBankAccounts(this.routingNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.bankAccounts = res?.data?.bankAccounts;
          this.totalBankAccountsCount = res?.data?.totalAccounts;
          if (this.bankAccounts?.length === this.totalBankAccountsCount) {
            this.isSelectAll = true;
          }
          this.getAllBankAccounts();
        }
      });
  }

  getAllBankAccounts(): void {
    this.bankAccountsService
      .getBankAccountsPerPage(this.totalBankAccountsCount, this.routingNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.allBankAccounts = res?.data;
      });
  }

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

  bankSlectionEvent(bankEvent: IBankDropdown[]): void {
    this.bankAccountIds = [];
    bankEvent?.forEach((element) => {
      if (this.bankAccountIds?.indexOf(element?.id) === -1) {
        this.bankAccountIds?.push(element?.id);
      }
    });
    this.isSelectAll =
      this.bankAccountIds?.length === this.totalBankAccountsCount;
  }

  save(): void {
    if (!this.bankAccountIds.length) {
      this.alertService.warningAlert({
        content: 'Please select at least one bank account'
      });
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      routingNumber: this.routingNumber,
      bankAccountIds: this.bankAccountIds
    };

    this.positivePayService
      .setPositivePayBankAccounts(payload)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const success = this.alertService.successAlert({
            content: res.message
          });
          success.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
              this.dialog.closeAll();
              this.dataTableService.setRefreshStatus(true, 32);
              this.v3DataTableService.refreshV3DataTable();
            }
          });
        } else {
          this.alertService.warningAlert({ content: res.message });
        }
      });
  }
}
