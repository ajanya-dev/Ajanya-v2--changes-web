import { DatePipe, NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  AddCreditmemoInterface,
  IAddCreditMemo,
  IEvent,
  IInvoiceDropdown,
  INumberOnlyEvent,
  ItaxList
} from 'src/app/modules/invoices/model/invoice';
import { Utils } from 'src/app/data/utils';
import { Params } from '@angular/router';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AddInvoiceItemComponent } from 'src/app/shared/modal/invoice-modal/add-invoice-item/add-invoice-item.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { IApiResMesssage } from 'src/app/models/api';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { AddInvoiceTaxComponent } from '../add-invoice-tax/add-invoice-tax.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { DropDownComponent } from '../../../../shared/components/drop-downs/drop-down/drop-down.component';
import { DropDownPayeeComponent } from '../../../../shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

/**
 * Represents the AddCreditMemoComponent class.
 * @class
 */
@Component({
  selector: 'app-add-credit-memo',
  templateUrl: './add-credit-memo.component.html',
  styleUrls: ['./add-credit-memo.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    DropDownBankComponent,
    DropDownPayeeComponent,
    NgFor,
    DropDownComponent,
    AmountInputComponent,
    MatDialogActions,
    NgIf,
    FontAwesomeModule,
    CommonButtonV35Component,
    CurrencyPipe
  ]
})
export class AddCreditMemoComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  public data: IAddCreditMemo = inject(MAT_DIALOG_DATA);
  private fb = inject(UntypedFormBuilder);
  private datePipe = inject(DatePipe);
  private invoiceService = inject(InvoiceService);
  private alert = inject(AlertService);
  public dialogRef = inject(MatDialogRef<AddCreditMemoComponent>);
  private sharedService = inject(SharedService);
  private dataTableService = inject(DataTableService);
  private bankModalService = inject(BankModalService);
  private v3DataTableService = inject(V3DataTableService);
  private payeeModalService = inject(PayeeModalService);

  creditmemo: UntypedFormGroup;

  subscriptions: Subscription[] = [];

  isProcessing = false;
  subtotal = 0;
  tax = 0;
  invoiceTotal = 0;
  subTotal = 0;
  credits = 0;
  grandtotal = 0;
  loading = false;

  bankList: string[] = [];
  payeeList: string[] = [];
  invoiceitemList: IInvoiceDropdown[] = [];
  taxList: ItaxList[] = [];
  bpage = 1;
  ppage = 1;
  Ipage = 1;
  searchTerm: string;
  taxName: string;
  editMode = false;
  itemName: string[] = [];

  err_msg: string;
  currentTax: string;

  taxAmountPer: number;
  createdBankId: string;
  createpayeeId: string;
  taxAmount = 0;

  itemid: string[] = [];

  utils = Utils;

  faXmark = faXmark;
  faPlus = faPlus;

  ngOnInit(): void {
    this.initFormGroup();
    this.loadTaxData();
    this.setCreditData();
    this.loadItemData();

    const newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.creditmemo.get('creditMemoDate')?.setValue(newDate);
  }

  /**
   * Handles the selection of a bank account.
   * @param {IEvent} event - The selected bank account event.
   */
  onSelectBank(event: IEvent) {
    this.creditmemo.patchValue({
      bankAccountId: event.id
    });
  }

  /**
   * Handles the selection of a payee.
   * @param {IEvent} event - The selected payee event.
   */
  onSelectPayee(event: IEvent) {
    this.creditmemo.patchValue({
      payeeId: event.id
    });
  }

  /**
   * Handles the selection of a tax.
   * @param {string} event - The selected tax event.
   */
  onSelectTax(event: string) {
    if (event) {
      this.currentTax = event;
      this.subscriptions.push(
        this.invoiceService.getSingleTaxData(event).subscribe((res) => {
          const Amount = this.invoiceTotal;
          this.taxAmountPer = res.data.taxPercentage;
          this.taxAmount = Math.round(
            (Number(this.taxAmountPer) / 100) * Number(Amount)
          );

          this.taxName = res.data.taxName;
          this.creditmemo.patchValue({
            taxId: res.data.id
          });
        })
      );
    } else {
      this.currentTax = '';
      this.creditmemo.patchValue({
        taxId: '',
        creditTaxTotal: ''
      });
    }
  }

  /**
   * Calculate the grand total.
   * @returns {number} - The calculated grand total.
   */
  grandTotal() {
    let grandTotal = 0;

    if (this.taxAmount === 0) {
      grandTotal = this.invoiceTotal;
    } else {
      grandTotal = Number(this.invoiceTotal) + Number(this.taxAmount);
    }
    this.grandtotal = grandTotal;
    return grandTotal;
  }

  /**
   * Handles the selection of an invoice.
   * @param {IEvent} event - The selected invoice event.
   * @param {number} i - The index of the selected invoice.
   */
  onSelectInvoice(event: IEvent, i: number) {
    const { id } = event;
    this.subscriptions.push(
      this.invoiceService.getSingleInvoiceItem(id).subscribe((res) => {
        const invoiceItem = res.data;

        const invoiceType = this.getFormControls('item') as UntypedFormArray;
        const formGrp = invoiceType.controls[i] as UntypedFormGroup;
        formGrp.get('cost')?.setValue(invoiceItem.unitPrice);
        formGrp.get('item')?.setValue(invoiceItem.id);
        formGrp.get('description')?.setValue(invoiceItem.note);
      })
    );
  }

  setCreditData() {
    if (this.data !== null) {
      this.editMode = true;

      const newDate = this.datePipe.transform(
        this.data.creditMemoDate,
        'yyyy-MM-dd'
      );

      this.sharedService.setNewBankCreatedData(
        this.data.bankAccount
          ? {
              bankAccountNickName:
                this.data.bankAccount.bankAccountNickName ||
                this.data.bankAccount.bankAccountName
            }
          : ''
      );

      this.sharedService.setNewPayeeCreatedData(
        this.data.payee.payeeName
          ? { payeeName: this.data.payee.payeeName }
          : ''
      );

      this.onSelectTax(this.data.taxId);

      this.creditmemo.patchValue({
        bankAccountId: this.data.bankAccount.bankAccountId,
        payeeId: this.data.payee.payeeId,
        creditMemoDate: newDate,
        creditMemoNo: this.data.creditMemoNo,
        poNo: this.data.poNo,
        accountNumber: this.data.accountNo,
        note: this.data.privateNote,
        memo: this.data.memo,
        taxId: this.data.taxId,
        creditMemoId: this.data.creditMemoId
        // total: Number( totalAmount),
      });

      for (let i = 0; i < this.data.items.length; i += 1) {
        const invoiceType = this.getFormControls('item') as UntypedFormArray;
        invoiceType.push(this.createCreditMemoCtrl());
        const formGrp = invoiceType.controls[i] as UntypedFormGroup;
        this.invoiceTotal += parseFloat(this.data.items[i].total as string);
        this.subtotal = this.data.amount as number;

        this.itemName.push(this.data.items[i].itemName);
        formGrp.get('cost')?.setValue(this.data.items[i].unitPrice);
        formGrp.get('item')?.setValue(this.data.items[i].itemId);
        formGrp.get('description')?.setValue(this.data.items[i].note);
        formGrp.get('qty')?.setValue(this.data.items[i].units);
        formGrp.get('total')?.setValue(this.data.items[i].total);
      }
    }
  }

  //* ******************************************** initFormGroup ******************************** */

  initFormGroup() {
    this.creditmemo = this.fb.group({
      bankAccountId: ['', [Validators.required]],
      payeeId: [''],
      creditMemoDate: ['', [Validators.required]],
      creditMemoNo: ['', [Validators.required]],
      poNo: [''],
      accountNumber: [''],
      note: [''],
      memo: [''],
      totalTotal: [''],
      creditTaxTotal: [''],
      creditGrandTotal: [''],
      creditMemoId: [''],
      taxId: [''],
      item: this.fb.array([this.createCreditMemoCtrl()])
    });
  }

  //* ******************************************** Create CreditMemo ctrl ******************************** */

  createCreditMemoCtrl(): UntypedFormGroup {
    return this.fb.group({
      item: new UntypedFormControl(''),
      description: new UntypedFormControl(''),
      qty: new UntypedFormControl(''),
      cost: new UntypedFormControl(''),
      total: new UntypedFormControl(''),
      stock: new UntypedFormControl('')
    });
  }

  createCreditMemobody(): AddCreditmemoInterface {
    const data = this.creditmemo.value;
    const newDate = this.datePipe.transform(data.creditMemoDate, 'MM/dd/yyyy');

    return {
      bankAccountId: data.bankAccountId,
      payeeId: data.payeeId,
      creditMemoDate: newDate,
      creditMemoNo: data.creditMemoNo,
      poNo: data.poNo,
      accountNumber: data.accountNumber,
      creditMemoId: data.creditMemoId,
      note: data.note,
      memo: data.memo,
      taxId: data.taxId,
      totalTotal: data.totalTotal,
      creditTaxTotal: data.creditTaxTotal,
      creditGrandTotal: data.creditGrandTotal,
      item: this.getFormControl().value
    };
  }

  getFormControl() {
    return this.creditmemo.get('item') as UntypedFormArray;
  }

  getFormControls(name: string) {
    return this.creditmemo.get(name);
  }

  getFormValue() {
    return this.creditmemo.get('item')?.value;
  }

  get userFormGroups() {
    return (this.creditmemo.get('item') as UntypedFormArray).controls;
  }

  //* ************************************ Add Row *********************************** */

  addNewRow() {
    const additem = this.creditmemo.get('item') as UntypedFormArray;
    additem.push(this.createCreditMemoCtrl());
  }

  //* ************************************ Remove Row *********************************** */

  removeRow(i: number, event: Params) {
    const id = event.controls.item.value;
    this.itemid.forEach((element, j) => {
      if (element === id) {
        this.itemid.splice(j, 1);
      }
    });

    const removeitem = this.creditmemo.get('item') as UntypedFormArray;
    const total = removeitem.length;
    if (total > 1) {
      removeitem.removeAt(i);
    }
  }

  // ******************** number only function in text  ********************* //

  numberOnly(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  numberOnlycredit(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 96) {
      return false;
    }
    return true;
  }

  //* ************************************ Calculate *********************************** */

  CalculateSummary() {
    this.subtotal = 0;
    this.tax = 0;
    this.invoiceTotal = 0;
    this.grandtotal = 0;
    const payType = this.getFormControl() as UntypedFormArray;
    payType.controls.forEach((formGrp) => {
      this.subtotal += Number(formGrp.get('total')?.value);
    });
    this.invoiceTotal = this.subtotal;
    this.grandtotal = this.invoiceTotal + this.credits;
  }

  //* ************************************ Quantity change *********************************** */

  onQtyChanges(event: IEvent, i: number, type?: string) {
    this.getFormControl().controls[i].get('stock')?.value;
    const payType = this.getFormControl() as UntypedFormArray;
    const formGrp = payType.controls[i] as UntypedFormGroup;

    if (event.detail !== undefined && !type) {
      const qtyValue =
        event.target.value[0] === '$'
          ? event.target.value.substring(1).replaceAll(',', '')
          : event.target.value;
      const costValue =
        formGrp.get('cost')?.value[0] === '$'
          ? formGrp.get('cost')?.value.substring(1).replaceAll(',', '')
          : formGrp.get('cost')?.value;

      if (qtyValue != null && qtyValue !== '0') {
        const qty = Number(qtyValue);

        const cost = Number(costValue);
        const tax = Number(formGrp.get('tax')?.value);
        const taxable = formGrp.get('is_taxable')?.value;
        const total: number = qty * cost;

        formGrp.get('total')?.setValue(total);
        formGrp.get('gtotal')?.setValue(total);

        if (taxable) {
          const taxamount = Math.round((tax / 100) * total);
          formGrp.get('tax_amount')?.setValue(taxamount);
        } else {
          this.onTaxChange(event, i);
        }
        this.CalculateSummary();
      }
      // }
    } else {
      const costValue =
        formGrp.get('cost')?.value[0] === '$'
          ? formGrp.get('cost')?.value.substring(1).replaceAll(',', '')
          : formGrp.get('cost')?.value;

      if (costValue !== null && costValue !== '0') {
        const cost = Number(costValue);

        const qty = Number(formGrp.get('qty')?.value);
        const tax = Number(formGrp.get('tax')?.value);
        const taxable = formGrp.get('is_taxable')?.value;
        const total: number = qty * cost;
        if (formGrp.get('qty')?.value) {
          const quantity = formGrp.get('qty')?.value;
          const totalCost = costValue * quantity;
          formGrp.get('total')?.setValue(totalCost);
          this.CalculateSummary();
        } else {
          formGrp.get('total')?.setValue(total);
          formGrp.get('gtotal')?.setValue(total);
        }

        if (taxable) {
          const taxamount = Math.round((tax / 100) * total);
          formGrp.get('tax_amount')?.setValue(taxamount);
        } else {
          this.onTaxChange(event, i);
        }
        this.CalculateSummary();
      }
    }
    if (this.currentTax) {
      this.onSelectTax(this.currentTax);
    }
  }

  //* ************************************ Tax change *********************************** */

  onTaxChange(event: IEvent, i: number) {
    const payType = this.getFormControl() as UntypedFormArray;
    const formGrp = payType.controls[i] as UntypedFormGroup;
    if (event.target.checked) {
      const tax = Number(formGrp.get('tax')?.value);
      const cost = Number(formGrp.get('unit_cost')?.value);
      const qty = Number(formGrp.get('quantity')?.value);
      const total: number = qty * cost;
      const taxamount = Math.round((tax / 100) * total);
      formGrp.get('tax_amount')?.setValue(taxamount);
      formGrp.get('total')?.setValue(total);

      this.CalculateSummary();
    } else {
      formGrp.get('tax_amount')?.setValue(0);
      formGrp.get('tax')?.setValue(0);
      this.CalculateSummary();
    }
  }

  /** *********************************** Submit ****************************** */

  /**
   * Handles Invoice submit
   */
  submit() {
    if (this.subtotal !== 0) {
      this.creditmemo.get('totalTotal')?.setValue(this.subtotal);
      this.creditmemo.get('creditTaxTotal')?.setValue(this.taxAmount);
      this.creditmemo.get('creditGrandTotal')?.setValue(this.grandTotal());
    }

    for (let i = 0; i < this.getFormValue().length; i += 1) {
      if (!this.creditmemo.value.bankAccountId) {
        this.alert.warningAlert({
          content: 'Credit memo from field is required'
        });
        return;
      }
      if (!this.creditmemo.value.payeeId) {
        this.alert.warningAlert({ content: 'Client field is required' });
        return;
      }
      if (!this.creditmemo.value.creditMemoDate) {
        this.alert.warningAlert({ content: 'Credit memo date is required.' });
        return;
      }
      if (this.creditmemo.value.creditMemoNo === '') {
        this.alert.warningAlert({
          content: 'Credit memo number is required.'
        });
        return;
      }
      if (this.creditmemo.value.item[0].item === '') {
        this.alert.warningAlert({ content: 'Item field is required' });
        return;
      }
      if (
        (this.creditmemo.value.item[i].qty === '' ||
          this.creditmemo.value.item[i].qty === 0) &&
        this.creditmemo.value.item[i].cost
      ) {
        this.alert.warningAlert({
          content: `Quantity field is required in row${i + 1}!`
        });
        return;
      }
      if (this.creditmemo.value.item[0].cost === '') {
        this.alert.warningAlert({ content: 'Unit cost field is required' });
        return;
      }
      if (this.creditmemo.value.creditGrandTotal > 100000000) {
        this.alert.warningAlert({
          content: 'The Item amount must be between 0 and 100000000'
        });
        return;
      }
    }
    // else{

    this.createCreditMemobody();
    const processedData = this.createCreditMemobody();
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    this.subscriptions.push(
      this.invoiceService
        .addCreditmemo(processedData)
        .pipe(
          catchError((err) => {
            this.err_msg = err.error.errorMsg;
            this.isProcessing = false;
            return of(false);
          })
        )
        .subscribe((res) => {
          const data = {
            title: 'Success',
            content: 'Credit memo added ',
            close: true,
            timeout: 2000
          };

          const Udata = {
            title: 'Success',
            content: 'Credit memo Updated',
            close: true,
            timeout: 2000
          };

          if (
            (res as IApiResMesssage).success &&
            (res as IApiResMesssage).message !== 'Updated'
          ) {
            const close = this.alert.successAlert(data);

            close.afterClosed().subscribe((result) => {
              if (result) {
                this.dataTableService.setRefreshStatus(true);
                this.dialogRef.close();
              }
            });
          }

          if (
            (res as IApiResMesssage).success &&
            (res as IApiResMesssage).message === 'Updated'
          ) {
            const close = this.alert.successAlert(Udata);
            close.afterClosed().subscribe((result) => {
              if (result) {
                this.dataTableService.setRefreshStatus(true);
                this.dialogRef.close();
              }
            });
          }
        })
    );
  }

  /**
   * hanles updation of invoice
   */
  update() {
    for (let i = 0; i < this.getFormValue().length; i += 1) {
      if (!this.creditmemo.value.bankAccountId) {
        this.alert.warningAlert({
          content: 'Credit memo from field is required'
        });
        return;
      }
      if (!this.creditmemo.value.payeeId) {
        this.alert.warningAlert({ content: 'Client field is required' });
        return;
      }
      if (this.creditmemo.value.creditMemoNo === '') {
        this.alert.warningAlert({
          content: 'Credit memo number is required.'
        });
        return;
      }
      if (this.creditmemo.value.item[0].item === '') {
        this.alert.warningAlert({ content: 'Item field is required' });
        return;
      }
      if (
        (this.creditmemo.value.item[i].qty === '' ||
          this.creditmemo.value.item[i].qty === 0) &&
        this.creditmemo.value.item[i].cost
      ) {
        this.alert.warningAlert({
          content: `Quantity field is required ${i + 1}`
        });
        return;
      }
      if (this.creditmemo.value.item[0].cost === '') {
        this.alert.warningAlert({ content: 'Unit cost field is required' });
        return;
      }
      if (this.creditmemo.value.totalTotal > 100000000) {
        this.alert.warningAlert({
          content: 'The Item amount must be between 0 and 100000000'
        });
        return;
      }
    }

    if (this.subtotal !== 0) {
      this.creditmemo.get('totalTotal')?.setValue(this.invoiceTotal);
      this.creditmemo.get('creditTaxTotal')?.setValue(this.taxAmount);
      this.creditmemo.get('creditGrandTotal')?.setValue(this.grandTotal());
    }

    this.createCreditMemobody();
    const processedData = this.createCreditMemobody();
    this.loading = true;
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    this.subscriptions.push(
      this.invoiceService
        .updateCreditmemo(this.data.creditMemoId, processedData)
        .pipe(
          finalize(() => {
            this.loading = false;
          }),
          catchError((err) => {
            this.err_msg = err.error.errorMsg;
            this.isProcessing = false;
            return of(false);
          })
        )
        .subscribe((res) => {
          const Udata = {
            title: 'Success',
            content: 'Credit memo Updated ',
            close: true,
            timeout: 2000
          };

          if (
            (res as IApiResMesssage).success &&
            (res as IApiResMesssage).message !== 'Updated'
          ) {
            const close = this.alert.successAlert(Udata);

            close.afterClosed().subscribe((result) => {
              if (result) {
                this.dataTableService.setRefreshStatus(true);
                this.v3DataTableService.refreshV3DataTable();
                this.dialogRef.close();
              }
            });
          }
        })
    );
    // }
  }

  /**
   * Opens the Add Invoice Tax modal dialog.
   */
  opentaxmodal() {
    const dialogRef = this.dialog.open(AddInvoiceTaxComponent, {
      maxWidth: '310px',
      width: '53%'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onSelectTax(result.id);
      }
    });
  }

  /**
   * Opens the Add Invoice Item modal dialog.
   * @param {number} i - The index of the selected invoice.
   */
  openInvoiceItemModal(i: number) {
    const dialogRef = this.dialog.open(AddInvoiceItemComponent, {
      maxWidth: '310px',
      width: '53%',
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.invoiceService
            .getSingleInvoiceItem(result.id)
            .subscribe((res) => {
              this.change(result.id, i);
              this.itemName[i] = res.data.name;
            })
        );
      }

      // let invoiceType = this.getFormControls('item') as FormArray;
      // let formGrp = invoiceType.controls[i] as FormGroup;
      // formGrp.get('item')?.setValue(result.id);
    });
  }

  /**
   * Loads invoice item data.
   */
  loadItemData() {
    this.subscriptions.push(
      this.invoiceService.getinvoiceitem(this.Ipage).subscribe((res) => {
        this.invoiceitemList = res.data;
      })
    );
  }

  /**
   * Loads tax data.
   */
  loadTaxData() {
    this.subscriptions.push(
      this.invoiceService.gettax(this.bpage).subscribe((res) => {
        this.taxList = res.data;
      })
    );
  }

  /**
   * Handles scrolling to load more tax data.
   */
  onScrollTax() {
    this.bpage += 1;
    this.subscriptions.push(
      this.invoiceService.gettax(this.bpage).subscribe((res) => {
        const that = this;
        res.data.forEach((element: ItaxList) => {
          that.taxList.push(element);
        });
      })
    );
  }

  /**
   * Handles scrolling to load more invoice item data.
   */
  onScroll() {
    this.Ipage += 1;
    this.subscriptions.push(
      this.invoiceService.getinvoiceitem(this.Ipage).subscribe((res) => {
        const that = this;
        res.data.forEach((element: IInvoiceDropdown) => {
          that.invoiceitemList.push(element);
        });
      })
    );
  }

  /**
   * Handles searching for invoice items based on the search term.
   * @param {IEvent} event - The search event.
   */
  onSearch(event: IEvent) {
    this.searchTerm = event.target.value;
    this.subscriptions.push(
      this.invoiceService
        .getinvoiceitem(this.Ipage, this.searchTerm)
        .subscribe((res) => {
          this.invoiceitemList = res.data;
        })
    );
  }

  /**
   * Filters invoice items based on selected item IDs.
   * @returns {IInvoiceDropdown[]} - Filtered list of invoice items.
   */
  filteredItems() {
    return this.invoiceitemList.filter(
      (item: IInvoiceDropdown) => !this.itemid.includes(item.id)
    );
  }

  /**
   * Handles the click event to update the selected item IDs.
   */
  click() {
    if (this.itemName) {
      this.itemid = this.itemName;
    }
  }

  /**
   * Handles changes in the selected invoice item.
   * @param {string} event - The selected invoice item ID.
   * @param {number} i - The index of the selected invoice item.
   */
  change(event: string, i: number) {
    let Index = -1;
    this.itemid.forEach((_el, j) => {
      if (j === i) {
        Index = j;
      }
    });

    if (Index !== -1) {
      this.itemid[Index] = event;
    } else {
      this.itemid.push(event);
    }

    if (this.itemid.length > this.filteredItems().length) {
      this.onScroll();
    }

    if (event) {
      const id = event;
      this.subscriptions.push(
        this.invoiceService.getSingleInvoiceItem(id).subscribe((res) => {
          const invoiceitem = res.data;

          const invoiceType = this.getFormControls('item') as UntypedFormArray;
          const formGrp = invoiceType.controls[i] as UntypedFormGroup;
          formGrp.get('cost')?.setValue(invoiceitem.unitPrice);
          formGrp.get('item')?.setValue(invoiceitem.id);
          formGrp.get('total')?.setValue(`${invoiceitem.unitPrice}`);
          formGrp.get('description')?.setValue(invoiceitem.note);
          formGrp.get('stock')?.setValue(invoiceitem.stock);
          if (formGrp.get('qty')?.value) {
            const quantity = formGrp.get('qty')?.value;
            const total = invoiceitem.unitPrice * quantity;
            formGrp.get('total')?.setValue(total);
            this.CalculateSummary();
          }
        })
      );
    } else {
      const invoiceType = this.getFormControls('item') as UntypedFormArray;
      const formGrp = invoiceType.controls[i] as UntypedFormGroup;
      formGrp.get('cost')?.setValue('');
      formGrp.get('item')?.setValue('');
      formGrp.get('description')?.setValue('');
      formGrp.get('qty')?.setValue('');
      formGrp.get('total')?.setValue('');
      formGrp.get('stock')?.setValue('');
    }
  }

  //* ************************************ Open bank modal ****************************** */

  /**
   * Opens the Add Bank Account modal dialog.
   */
  openbankmodal() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewBankCreatedData({
                  bankAccountId: result.id
                });
                this.creditmemo.controls.bankAccountId.setValue(result.id);
              }
            })
          );
        }
      })
    );
  }

  //* ************************************ Open Payee modal ****************************** */
  /**
   * @description Opens the add payee modal.
   */
  openpayeemodal() {
    this.subscriptions.push(
      this.payeeModalService.openAddPayee().subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(
            payeeModal.afterClosed().subscribe((modalRes) => {
              if (modalRes?.success) {
                this.sharedService.setNewPayeeCreatedData({
                  payeeId: modalRes.id
                });
                this.creditmemo.controls.payeeId.setValue(modalRes.id);
              }
            })
          );
        }
      })
    );
  }

  /**
   * Handles the date change in the datepicker.
   * @param {IEvent} event - The date change event.
   */
  datepickerdate(event: IEvent) {
    const newDate = this.datePipe.transform(event.target.value, 'yyyy-MM-dd');
    this.creditmemo.get('creditMemoDate')?.setValue(newDate);
  }

  /**
   * Validates and allows only numeric values for amount input.
   * @param {INumberOnlyEvent} event - The input event.
   * @returns {boolean} - Returns true if the input is numeric, otherwise false.
   */
  amountOnly(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      // for '.'
      return true;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * Lifecycle hook that runs when the component is destroyed.
   * Unsubscribes from subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
