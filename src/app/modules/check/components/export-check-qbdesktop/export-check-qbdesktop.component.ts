import { Component, OnInit, inject } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IConfirmAlert, ISuccessAlert } from 'src/app/models/alert';
import {
  IQBExpenseListItem,
  IQBExpenseListItem2
} from 'src/app/modules/check/model/check';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { NgxMaskDirective } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-export-check-qbdesktop',
  templateUrl: './export-check-qbdesktop.component.html',
  styleUrls: ['./export-check-qbdesktop.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    MatTooltip,
    NgFor,
    ReactiveFormsModule,
    NgSelectModule,
    NgxMaskDirective,
    NgIf,
    CurrencyPipe
  ]
})
export class ExportCheckQbdesktopComponent implements OnInit {

  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private commonService = inject(CommonOnInitService);
  private dialogRef = inject(MatDialogRef<ExportCheckQbdesktopComponent>);
  public dialogData: {bankAcId:string, expenseListFormArr: IQBExpenseListItem[]} = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  QBDBankId: string;
  QBDCompanyId: string;
  QBDCompanyName: string;
  QBDBankAccountName: string;
  QBDExpenseItem: { name: string; id: string }[] = [];
  QBDClassItem: { name: string; id: string }[] = [];
  QBDcustomersItem: { name: string; id: string }[] = [];
  QBDExpenseItemName: (string | null)[] = [];
  QBDClassItemName: (string | null)[] = [];
  QBDCustomerItemName: (string | null)[] = [];
  qbdexpensePage = 2;
  qbdcustomerPage = 2;
  qbdclassPage = 2;
  page = 1;
  utils = Utils;
  isLoading = false;

  expenseTotal = 0;

  expenseListFormArr = new UntypedFormArray([
    new UntypedFormGroup({
      expenseObj: new UntypedFormControl(undefined),
      description: new UntypedFormControl(''),
      customerObj: new UntypedFormControl(undefined),
      classObj: new UntypedFormControl(undefined),
      amount: new UntypedFormControl('')
    })
  ]);

  ngOnInit(): void {
    this.getQBDCompanyDetailsByBankId(this.dialogData.bankAcId);    
  }

  getQBDCompanyDetailsByBankId(bankId: string) {
    this.isLoading = true;
    this.subscriptions.push(
      this.checkService
        .getQBDCompanies(bankId)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          this.QBDCompanyId = res.data.companyId;
          this.QBDBankId = res.data.qbBankId;
          this.QBDCompanyName = res.data.companyName;
          this.QBDBankAccountName = res.data.qbBankName;
          this.QBDExpenseItem = res.data.expenses;
          this.QBDcustomersItem = res.data.customers;
          this.QBDClassItem = res.data.classes;
          this.initializeExpenseListFormArr();
        })
    );
  }

  initializeExpenseListFormArr() {
    if (this.dialogData?.expenseListFormArr) {
      this.expenseListFormArr = new UntypedFormArray([]);
      this.dialogData.expenseListFormArr.forEach(() => {
        this.expenseListFormArr.push(
          new UntypedFormGroup({
            expenseObj: new UntypedFormControl(undefined),
            description: new UntypedFormControl(''),
            customerObj: new UntypedFormControl(undefined),
            classObj: new UntypedFormControl(undefined),
            amount: new UntypedFormControl('')
          })
        );
      });
      this.expenseListFormArr.setValue(this.dialogData.expenseListFormArr);
      this.calculateExpenseTotal();
    }
  }

  calculateExpenseTotal() {
    this.expenseTotal = 0;
    this.expenseListFormArr.value.forEach((ele: IQBExpenseListItem2) => {
      this.expenseTotal += Number(ele.amount);
    });
  }

  OnQBDItemChangeExpenseDetails(event: string, i: number) {
    const invoiceType = this.expenseListFormArr;
    const formGrp = invoiceType.controls[i] as UntypedFormGroup;
    formGrp.get('expenseObj')?.setValue(event || null);
  }

  OnQBDItemChangeCustomerDetails(event: string, i: number) {
    const invoiceType = this.expenseListFormArr;
    const formGrp = invoiceType.controls[i] as UntypedFormGroup;
    formGrp.get('customerObj')?.setValue(event || null);
  }

  OnQBDItemChangeClassDetails(event: string, i: number) {
    const invoiceType = this.expenseListFormArr;
    const formGrp = invoiceType.controls[i] as UntypedFormGroup;
    formGrp.get('classObj')?.setValue(event || null);

  }

  onQBDScrollCompanyDetails(type: string) {
    let page = 0;
    const searchTerm = '';
    const companyId = this.QBDCompanyId;

    if (type === 'customers') {
      page = this.qbdcustomerPage;
    } else if (type === 'expense-items') {
      page = this.qbdexpensePage;
    } else {
      page = this.qbdclassPage;
    }

    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, page, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              if (type === 'customers') {
                this.QBDcustomersItem.push(element);
              } else if (type === 'expense-items') {
                this.QBDExpenseItem.push(element);
              } else {
                this.QBDClassItem.push(element);
              }
            });

            if (type === 'customers') {
              this.qbdcustomerPage += 1;
            } else if (type === 'expense-items') {
              this.qbdexpensePage += 1;
            } else {
              this.qbdclassPage += 1;
            }
          }
        })
    );
  }

  onQBDSearchItemsCompanyDetails(event: Event, type: string) {
    const searchTerm = (event.target as HTMLInputElement).value;
    const companyId = this.QBDCompanyId;
    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, this.page, searchTerm)
        .subscribe((res) => {
          if (type === 'customers') {
            this.QBDcustomersItem = res.data;
          } else if (type === 'expense-items') {
            this.QBDExpenseItem = res.data;
          } else {
            this.QBDClassItem = res.data;
          }
        })
    );
  }

  removeSelectedRow(i: number, type: string) {
    if (type === 'expense') {
      const removeitem = this.expenseListFormArr;
      if (removeitem.length > 1) {
        removeitem.removeAt(i);
        this.QBDExpenseItemName.splice(i, 1);
        this.QBDClassItemName.splice(i, 1);
        this.QBDCustomerItemName.splice(i, 1);
      }
    }
    this.calculateExpenseTotal();
  }

  addNewRow(type: string): void {
    if (type === 'expense') {
      const addRow = this.expenseListFormArr;
      if(addRow.length >= 1 && this.commonService.isBrayanCohenCustomer()) return;
      addRow.push(new UntypedFormGroup({
        expenseObj: new UntypedFormControl(null),
        description: new UntypedFormControl(''),
        customerObj: new UntypedFormControl(null),
        classObj: new UntypedFormControl(null),
        amount: new UntypedFormControl('')
      }));
    }
  }

  clearAllRow(type: string) {
    const alert = this.openConfirmAlert(
      'Are you sure you want to clear all data?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        if (type === 'expense') {
          const removeitem = this.expenseListFormArr;
          removeitem.reset();
          this.expenseTotal = 0;
          this.QBDExpenseItemName = [];
          this.QBDClassItemName = [];
          this.QBDCustomerItemName = [];
        }
      }
    });
  }

  openConfirmAlert(content: string, title?: string) {
    const data: IConfirmAlert = {
      title: title || "Confirm",
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  openSuccessAlert(content?: string, _disable?: boolean, timeout?: number) {
    const data: ISuccessAlert = {
      title: "Success!",
      content: content || "Check created.",
      close: true,
      timeout: timeout || 2000,

    };
    return this.alertService.successAlert(data);
  }

  openWarningAlert(content: string, doneMsg = 'OK') {
    return this.alertService.warningAlert({ content, doneMsg });
  }

  openInfoAlert(content: string) {
    return this.alertService.infoAlert({ content });
  }

  onSaveExpense(): void {
    if (this.QBDCompanyId) {
      if (this.QBDBankId === '') {
        this.openWarningAlert('The QuickBooks Bank field is required');
        return;
      }
    }

    for (let i = 0; i <= this.expenseListFormArr.value.length; i += 1) {
      if (
        this.expenseListFormArr.value[i]?.expenseObj &&
        (this.expenseListFormArr.value[i]?.amount == null || this.expenseListFormArr.value[i]?.amount === '')
      ) {
        this.openWarningAlert(`The amount field is required in row ${i + 1}`);
        return;
      } if (
        this.expenseListFormArr.value[i]?.expenseObj == null &&
        this.expenseListFormArr.value[i]?.amount
      ) {
        this.openWarningAlert(`The Expense field is required in row ${i + 1}`);
        return;
      }
    }

    if (this.expenseTotal > 100000000) {
      this.openWarningAlert(
        'The check amount must be between 0 and 100000000.'
      );
      return;
    }
    this.saveAndClose(true);
  }

  removeRow(type: string): void {
    if (type === 'expense') {
      const removeitem = this.expenseListFormArr;
      if (removeitem.length > 1) {
        removeitem.removeAt(removeitem.length - 1);
        this.QBDExpenseItemName[removeitem.length] = null;
        this.QBDClassItemName[removeitem.length] = null;
        this.QBDCustomerItemName[removeitem.length] = null;
        this.calculateExpenseTotal();
      }
    }
  }

  saveAndClose(isSave: boolean) {
    const expenseListFormArr: IQBExpenseListItem2[] =
      this.expenseListFormArr.value;
    expenseListFormArr.forEach((element) => {
      element.amount = element.amount;
    });
    const res = {
      isSave,
      expenseListFormArr,
      expenseTotal: this.expenseTotal,
      companyId: this.QBDCompanyId,
      qbBankId: this.QBDBankId
    };
    this.dialogRef.close(res);
  }
}
