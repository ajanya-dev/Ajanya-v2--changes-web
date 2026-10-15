import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormRecord,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IConfirmAlert } from 'src/app/models/alert';
import { IRemittanceDetails } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import type { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { LucideAngularModule, X, Plus, Minus, Trash2, ArrowLeftRight } from 'lucide-angular';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface ICheckForm {
  remittance: FormArray<FormRecord<AbstractControl>>;
  insertIntoCheck: FormControl<boolean | null>;
}
interface IRemittance {
  invoiceNumber: string;
  itemName?: string;
  itemDescription: string;
  itemQuantity?: string;
  itemUnitCost?: string;
  totalSingleRow?: string;
  invoiceDate?: string | null;
  grossAmount?: string;
  discountAmount?: string;
  netAmount?: string;
  thisPayment?: string;
}

interface IDialogData {
  remitance: IRemittanceDetails[];
  paymentTotal: number;
  grandTotal: number;
  format: boolean;
  insert: boolean;
  isNotCheck?: boolean;
  remittanceType: number;
  amount: number;
  hideSwitchFormat?: boolean;
  type: 'bill' | 'check';
}

@Component({
  selector: 'app-add-remittance-v4',
  templateUrl: './add-remittance-v4.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    V4CommonDropDownSelectorComponent,
    V4DatePickerComponent,
    CommonInputFieldV4Component,
    CommonAmountInputV4Component,
    CommonButtonV4Component,
    MatTooltipModule
  ]
})
export class AddRemittanceV4Component implements OnInit, OnDestroy {
  data: IDialogData = inject(MAT_DIALOG_DATA);
  private _checkService = inject(CheckService);
  fb = inject(FormBuilder);
  private _alertService = inject(V4AlertService);
  matDialog = inject(MatDialogRef);
  private _datePipe = inject(DatePipe);

  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;
  readonly Trash2Icon = Trash2;
  readonly ArrowLeftRightIcon = ArrowLeftRight;

  readonly itemDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select items',
    style: { size: 1 }
  };

  addTagFn = (term: string) => term;

  checkForm: FormGroup<ICheckForm>;
  isRemittence = false;
  isCategory: boolean;
  isExpense: boolean;
  page = 1;
  grandTotal = 0.0;
  subscriptions: Subscription[] = [];
  utils = Utils;
  remittanceItem: string[];
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  paymentTotal: number;
  newFormat: boolean;
  isRemittanceSaved: boolean;
  disableRemittanceAddBtn = false;
  insertToCheck = false;
  isNotCheck = false;
  remittanceType: number;
  hideSwitchFormat = false;

  ngOnInit() {
    this.initCheckForm();
    this.data.isNotCheck ? (this.isNotCheck = true) : (this.isNotCheck = false);
    this.hideSwitchFormat = this.data.hideSwitchFormat ?? false;
    this.setCheckbox();
    this.changeGrossAmount();
  }

  changeGrossAmount() {
    if (this.data.type === 'bill') {
      this.getRemittanceFormControl().controls.forEach((_control, index) => {
        this.total(index);
      });
    }
  }

  initCheckForm() {
    this.checkForm = this.fb.group({
      remittance: this.fb.array([this.remittanceFormBody()]),
      insertIntoCheck: new FormControl(false)
    });
    this.getRemittanceGrandTotal();
    this.setRemittance();
    this.loadRemittanceRow(this.data.remitance);
    this.loadRemittanceItems();
    if (this.data.format === undefined) {
      if (this.data.remittanceType === 0) {
        this.newFormat = false;
      } else {
        this.newFormat = true;
      }
    } else {
      this.data.format !== undefined
        ? (this.newFormat = this.data.format)
        : (this.newFormat = true);
    }
  }

  getRemittanceFormControl(): FormArray {
    return this.checkForm.get('remittance') as FormArray;
  }

  switchFormat() {
    this.newFormat = !this.newFormat;
    this.setCheckbox();
  }

  setRemittance() {
    if (this.data.insert !== undefined) {
      this.insertToCheck = this.data.insert;
      this.checkForm.controls.insertIntoCheck.setValue(this.data.insert);
    } else {
      this.insertToCheck = false;
    }

    if (this.newFormat) {
      if (this.data.paymentTotal != undefined) {
        this.paymentTotal = this.data.paymentTotal;
      }
    } else {
      if (this.data.grandTotal != undefined) {
        this.grandTotal = this.data.grandTotal;
      }
    }
  }

  setCheckbox() {
    if (this.newFormat) {
      if (this.paymentTotal !== 0) {
        if (this.data.amount === this.paymentTotal) {
          this.insertToCheck = true;
        }
      } else {
        this.insertToCheck = false;
      }
    } else {
      if (this.grandTotal !== 0) {
        if (this.data.amount === this.grandTotal) {
          this.insertToCheck = true;
        }
      } else {
        this.insertToCheck = false;
      }
    }
  }

  total(i: number) {
    const formGroup = this.getRemittanceFormControl().controls[i] as FormGroup;
    const quantity = Number(formGroup.get('itemQuantity')?.value);
    const unitCost = Number(formGroup.get('itemUnitCost')?.value);
    const gross = Number(formGroup.get('grossAmount')?.value);
    const discount = Number(formGroup.get('discountAmount')?.value);
    const totalSingleRow = quantity * unitCost;
    const netAmount = gross - discount;

    if (!isNaN(totalSingleRow)) {
      formGroup.get('totalSingleRow')?.setValue(totalSingleRow);
    } else {
      formGroup.get('totalSingleRow')?.setValue(0.0);
    }
    if (!isNaN(netAmount) && netAmount > 0) {
      formGroup.get('netAmount')?.setValue(netAmount);
      formGroup.get('thisPayment')?.setValue(netAmount);
    } else {
      formGroup.get('netAmount')?.setValue(0.0);
      formGroup.get('thisPayment')?.setValue(0.0);
    }
  }

  get getGrandTotal() {
    return this.checkForm.get('remittance') as FormArray;
  }

  showRemittence(): void {
    this.isRemittence = !this.isRemittence;
    this.isCategory = false;
    this.isExpense = false;
  }

  onScrollItems() {
    this.page++;
    this.subscriptions.push(
      this._checkService
        .getCheckRemiitanceItems(this.page, '')
        .subscribe((res) => {
          const that = this;
          res.data.items.forEach((element: string) => {
            that.remittanceItem.push(element);
          });
        })
    );
  }

  loadRemittanceRow(data?: IRemittanceDetails[]) {
    const filled = (data ?? []).filter((item) =>
      Object.values(item ?? {}).some(
        (value) => value !== null && value !== '' && value !== undefined
      )
    );
    if (filled.length === 0) {
      const addRow = this.getRemittanceFormControl();
      for (let i = 1; i <= 4; i++) {
        addRow.push(this.remittanceFormBody());
      }
    } else {
      filled.forEach((item: IRemittanceDetails) => {
        this.getRemittanceFormControl().push(this.remittanceFormBody(item));
      });
      this.getRemittanceFormControl().removeAt(0);
    }
  }

  addRow() {
    const row = this.getRemittanceFormControl();
    row.push(this.remittanceFormBody());
    if (this.getRemittanceFormControl().controls.length >= 10) {
      this.disableRemittanceAddBtn = true;
    }
  }

  remittanceFormBody(item?: IRemittanceDetails) {
    if (item) {
      return this.fb.group({
        invoiceNumber: [item.invoiceNumber],
        itemName: [item.itemName],
        itemDescription: [item.itemDescription],
        itemQuantity: [item.itemQuantity],
        itemUnitCost: [item.itemUnitCost],
        totalSingleRow: [item.totalSingleRow],
        invoiceDate: [item.invoiceDate],
        grossAmount: [item.grossAmount],
        discountAmount: [item.discountAmount],
        netAmount: [item.netAmount],
        thisPayment: [item.thisPayment]
      });
    }
    return this.fb.group({
      invoiceNumber: [''],
      itemName: [],
      itemDescription: [''],
      itemQuantity: [''],
      itemUnitCost: [''],
      totalSingleRow: [''],
      invoiceDate: [''],
      grossAmount: [''],
      discountAmount: [''],
      netAmount: [''],
      thisPayment: ['']
    });
  }

  loadRemittanceItems() {
    this.subscriptions.push(
      this._checkService
        .getCheckRemiitanceItems(this.page, '')
        .subscribe((res: { data: { items: string[] }; success: boolean }) => {
          if (res.success) {
            this.remittanceItem = res.data.items;
          }
        })
    );
  }

  getRemittanceGrandTotal() {
    this.subscriptions.push(
      this.getGrandTotal.valueChanges.subscribe((data) => {
        this.grandTotal = data.reduce(
          (acc: number, cur: { totalSingleRow: number }) =>
            acc + +cur.totalSingleRow,
          0
        );
        this.grossTotal = data.reduce(
          (a: number, b: { grossAmount: string | number }) =>
            a + +b.grossAmount,
          0
        );
        this.discountTotal = data.reduce(
          (a: number, b: { discountAmount: string | number }) =>
            a + +b.discountAmount,
          0
        );
        this.netTotal = data.reduce(
          (a: number, b: { netAmount: string | number }) => a + +b.netAmount,
          0
        );
        this.paymentTotal = data.reduce(
          (a: number, b: { thisPayment: string | number }) =>
            a + +b.thisPayment,
          0
        );
      })
    );
  }

  clearAllRow() {
    const alert = this.openConfirmAlert(
      'Are you sure you want to clear all data?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        const removeitem = this.getRemittanceFormControl();
        removeitem.reset();
        this.grandTotal = 0;
        this.isRemittanceSaved = false;
      }
    });
  }

  openConfirmAlert(content: string, title?: string) {
    const data: IConfirmAlert = {
      title: title ? title : 'Confirm',
      content: content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this._alertService.confirmAlert(data);
  }

  onSearchItems(event: Event) {
    const searchTerm = event.target as HTMLInputElement;
    this.subscriptions.push(
      this._checkService
        .getCheckRemiitanceItems(this.page, searchTerm.value)
        .subscribe((res) => {
          this.remittanceItem = res.data.items;
        })
    );
  }

  onSearchV4(term: string) {
    this.subscriptions.push(
      this._checkService
        .getCheckRemiitanceItems(this.page, term)
        .subscribe((res) => {
          this.remittanceItem = res.data.items;
        })
    );
  }

  insertIntoCheck(item: Event) {
    const target = item.target as HTMLInputElement;
    this.insertToCheck = target.checked;
    this.checkForm.controls.insertIntoCheck.setValue(this.insertToCheck);
  }

  removeSelectedRow(i: number) {
    const removeitem = this.getRemittanceFormControl();
    if (removeitem.length > 1) {
      removeitem.removeAt(i);
      this.isRemittanceSaved = false;
      removeitem.length < 10 ? (this.disableRemittanceAddBtn = false) : true;
    }
  }

  private getFilledRemittances(): IRemittance[] {
    return (this.getRemittanceFormControl().value as IRemittance[]).filter((row) =>
      Object.values(row ?? {}).some(
        (value) => value !== null && value !== '' && value !== undefined
      )
    );
  }

  close() {
    this.matDialog.close({
      data: this.getFilledRemittances(),
      grandTotal: this.grandTotal,
      paymentTotal: this.paymentTotal,
      insert: this.insertToCheck,
      format: this.newFormat
    });
  }

  submit() {
    this.getRemittanceFormControl().value.forEach((el: IRemittance) => {
      el.invoiceDate = this._datePipe.transform(el.invoiceDate, 'yyyy-MM-dd');
    });
    const filled = this.getFilledRemittances();
    this.matDialog.close({
      data: filled,
      grandTotal: this.grandTotal,
      paymentTotal: this.paymentTotal,
      insert: this.insertToCheck,
      format: this.newFormat,
      remittanceType: this.newFormat ? 1 : 0
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
