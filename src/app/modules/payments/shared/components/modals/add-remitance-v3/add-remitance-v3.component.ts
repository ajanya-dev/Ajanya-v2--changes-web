import { DatePipe, NgIf, NgClass, NgFor } from '@angular/common';
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
  MatDialogRef,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IConfirmAlert } from 'src/app/models/alert';
import { IRemittanceDetails } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  MatDatepickerInput,
  MatDatepicker
} from '@angular/material/datepicker';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';

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
  /** True when the modal is opened from a payment in edit mode. */
  isPaymentEdit?: boolean;
}

@Component({
  selector: 'app-add-remitance-v3',
  templateUrl: './add-remitance-v3.component.html',
  styleUrls: ['./add-remitance-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    FaIconComponent,
    NgClass,
    NgFor,
    MatDatepickerInput,
    MatDatepicker,
    NgSelectModule,
    AmountInputComponent,
    MatDialogActions
  ]
})

/**
 * @description To add a remitance list with checks
 */
export class AddRemitanceV3Component implements OnInit, OnDestroy {
  /**dependancy injection using inject method */
  data: IDialogData = inject(MAT_DIALOG_DATA);
  private _checkService = inject(CheckService);
  fb = inject(FormBuilder);
  private _alertService = inject(AlertService);
  matDialog = inject(MatDialogRef);
  private _datePipe = inject(DatePipe);

  /**variable declaration */
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
  /** True while the "insert" tick was auto-applied and not yet user-overridden. */
  private autoInsertActive = false;

  ngOnInit() {
    this.initCheckForm();
    this.data.isNotCheck ? (this.isNotCheck = true) : (this.isNotCheck = false);
    this.hideSwitchFormat = this.data.hideSwitchFormat ?? false;
    this.changeGrossAmount();
    this.applyEditCaseAutoInsert();
  }

  /**
   * @description Payment edit case: when the modal already carries remittance
   * data, pre-tick the "insert into check/payment" box so the existing
   * remittance is kept. 
   */
  private applyEditCaseAutoInsert() {
    if ((!this.data.isPaymentEdit || !this.data.remitance?.length) || !this.data.insert) {
      return;
    }
    this.insertToCheck = true;
    this.checkForm.controls.insertIntoCheck.setValue(true);
    this.autoInsertActive = true;

    this.subscriptions.push(
      this.getRemittanceFormControl().valueChanges.subscribe(() => {
        if (!this.autoInsertActive) {
          return;
        }
        this.autoInsertActive = false;
        this.insertToCheck = false;
        this.checkForm.controls.insertIntoCheck.setValue(false);
      })
    );
  }

  changeGrossAmount() {
    if (this.data.type === 'bill' || !!this.data.remitance?.length) {
      this.getRemittanceFormControl().controls.forEach((_control, index) => {
        this.total(index, true);
      });
    }
  }

  /**
   * @description Initializes the check form.
   * - Creates a form group using the FormBuilder.
   * - Checks if the data format is defined and assigns it to the newFormat variable, otherwise sets it to true.
   * - Checks if the insert property is defined in the data object.
   *   - Sets the insertToCheck variable and updates the value of the insertIntoCheck form control accordingly.
   * - Otherwise, sets the insertToCheck variable to false.
   * - Loads the remittance row using the data remittance property.
   * - Loads the remittance items.
   * - Calculates the remittance grand total.
   * - Assigns the data total to the grandTotal variable.
   */
  initCheckForm() {
    this.checkForm = this.fb.group({
      remittance: this.fb.array([this.remittanceFormBody()]),
      insertIntoCheck: new FormControl(false)
    });
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
    this.getRemittanceGrandTotal();
    this.setRemittance();
    this.loadRemittanceRow(this.data.remitance);
    this.loadRemittanceItems();
  }

  getRemittanceFormControl(): FormArray {
    return this.checkForm.get('remittance') as FormArray;
  }

  /**
   * @description Switches the format of the remittance.
   */
  switchFormat() {
    this.newFormat = !this.newFormat;
    this.setCheckbox();
  }

  /**
   * @description Set the remittance form.
   */
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
    this.setCheckbox();
  }

  /**
   * @description Set the insert check box.
   */
  setCheckbox() {
    if (this.newFormat) {
      if (this.paymentTotal !== 0) {
        if (this.data.amount === this.paymentTotal && this.data.insert) {
          this.insertToCheck = true;
        }
      } else {
        this.insertToCheck = false;
      }
    } else {
      if (this.grandTotal !== 0) {
        if (this.data.amount === this.grandTotal && this.data.insert) {
          this.insertToCheck = true;
        }
      } else {
        this.insertToCheck = false;
      }
    }
  }

  /**
   * Calculates the total and net amount for a specific remittance row.
   *
   * @param i - The index of the remittance row.
   */
  total(i: number, preserveThisPayment = false) {
    const formGroup = this.getRemittanceFormControl().controls[i] as FormGroup;
    const quantity = Number(formGroup.get('itemQuantity')?.value);
    const unitCost = Number(formGroup.get('itemUnitCost')?.value);
    const gross = Number(formGroup.get('grossAmount')?.value);
    const discount = Number(formGroup.get('discountAmount')?.value);
    const totalSingleRow = quantity * unitCost;
    const netAmount = gross - discount;

    if (!isNaN(totalSingleRow)) {
      //Avoid NaN of field
      formGroup.get('totalSingleRow')?.setValue(totalSingleRow);
    } else {
      formGroup.get('totalSingleRow')?.setValue(0.0);
    }

    const keepThisPayment =
      preserveThisPayment && Number(formGroup.get('thisPayment')?.value) > 0;
    if (!isNaN(netAmount) && netAmount > 0) {
      formGroup.get('netAmount')?.setValue(netAmount);
      if (!keepThisPayment) {
        formGroup.get('thisPayment')?.setValue(netAmount);
      }
    } else {
      formGroup.get('netAmount')?.setValue(0.0);
      if (!keepThisPayment) {
        formGroup.get('thisPayment')?.setValue(0.0);
      }
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

  /**
   * @description Loads more check remittance items when scrolling.
   * Increases the page number and retrieves additional items from the server.
   */
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

  /**
   * @description Loads the remittance rows into the form.
   * @param data Optional. Array of remittance details to populate the form with.
   */
  loadRemittanceRow(data?: IRemittanceDetails[]) {
    if (!data) {
      const addRow = this.getRemittanceFormControl();
      for (let i = 1; i <= 5; i++) {
        addRow.push(this.remittanceFormBody());
      }
    } else {
      data.forEach((item: IRemittanceDetails) => {
        this.getRemittanceFormControl().push(this.remittanceFormBody(item));
      });
    }
    this.getRemittanceFormControl().removeAt(0);
  }

  addRow() {
    const row = this.getRemittanceFormControl();
    row.push(this.remittanceFormBody());
    if (this.getRemittanceFormControl().controls.length >= 10) {
      this.disableRemittanceAddBtn = true;
    }
  }

  /**
   * Creates a form group for a remittance row with optional initial values.
   *
   * @param item - Optional. Initial values for the form group.
   * @returns A form group representing a remittance row.
   */
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

  /**
   * @description Subscribes to changes in the value of the remittance form and calculates the grand total.
   */
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

  /**
   * @description to clear remitance row and its total
   */
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

  /**
   * @description  Handles the search event and retrieves check remittance items based on the search term.
   * @param event -constains the search term
   */
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

  /**
   * Handles the insert into check event and updates the insertToCheck flag and check form control value.
   * @param item -The insert into check event containing the target element.
   */
  insertIntoCheck(item: Event) {
    const target = item.target as HTMLInputElement;
    this.insertToCheck = target.checked;
    this.checkForm.controls.insertIntoCheck.setValue(this.insertToCheck);
    // The user took manual control, so stop auto-clearing the tick on edits.
    this.autoInsertActive = false;
  }

  /**
   * Removes the selected row at the specified index from the remittance form.
   * @param i -The index of the row to be removed.
   */
  removeSelectedRow(i: number) {
    const removeitem = this.getRemittanceFormControl();
    if (removeitem.length > 1) {
      removeitem.removeAt(i);
      this.isRemittanceSaved = false;
      removeitem.length < 10 ? (this.disableRemittanceAddBtn = false) : true;
    }
  }

  close() {
    this.matDialog.close();
  }

  /**
   * Handles the submit event and prepares the remittance data for closing the dialog.
   * If the grand total is greater than 0, it closes the dialog with the remittance data, total, insert flag, and format flag.
   * Otherwise, it closes the dialog without passing any data.
   */
  submit() {
    this.getRemittanceFormControl().value.forEach((el: IRemittance) => {
      el.invoiceDate = this._datePipe.transform(el.invoiceDate, 'yyyy-MM-dd');
    });
    if (!this.newFormat) {
      this.matDialog.close({
        data: this.getRemittanceFormControl().value,
        grandTotal: this.grandTotal,
        paymentTotal: this.paymentTotal,
        insert: this.insertToCheck,
        format: this.newFormat,
        remittanceType: 0
      });
    } else {
      this.matDialog.close({
        data: this.getRemittanceFormControl().value,
        grandTotal: this.grandTotal,
        paymentTotal: this.paymentTotal,
        insert: this.insertToCheck,
        format: this.newFormat,
        remittanceType: 1
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
