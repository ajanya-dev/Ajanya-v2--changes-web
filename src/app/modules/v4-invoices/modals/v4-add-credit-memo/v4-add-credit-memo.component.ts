/* eslint-disable @typescript-eslint/no-explicit-any */
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { LucideAngularModule, X, Plus, Trash2, Calendar } from 'lucide-angular';
import { finalize } from 'rxjs/operators';

import { Utils } from 'src/app/data/utils';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  AddCreditmemoInterface,
  IAddCreditMemo,
  IInvoiceDropdown,
  ItaxList
} from 'src/app/modules/invoices/model/invoice';
import { IBankDropdown } from 'src/app/models/bank';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IApiResMesssage } from 'src/app/models/api';
import { V4AddInvoiceItemComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-item/v4-add-invoice-item.component';
import { V4AddInvoiceTaxComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-tax/v4-add-invoice-tax.component';

@Component({
  selector: 'app-v4-add-credit-memo',
  templateUrl: './v4-add-credit-memo.component.html',
  standalone: true,
  providers: [DatePipe, CurrencyPipe],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    LucideAngularModule,
    BankAcDropdownV4Component,
    PayeeDropdownV4Component,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4DatePickerComponent,
    CommonAmountInputV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class V4AddCreditMemoComponent implements OnInit {
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly CalendarIcon = Calendar;

  utils = Utils;

  private destroyRef = inject(DestroyRef);
  private fb = inject(UntypedFormBuilder);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  public dialogRef = inject(MatDialogRef<V4AddCreditMemoComponent>);
  public data: IAddCreditMemo = inject(MAT_DIALOG_DATA);

  creditmemo!: UntypedFormGroup;
  isProcessing = false;
  editMode = false;

  @ViewChildren(V4CommonDropDownSelectorComponent)
  allDropdowns!: QueryList<V4CommonDropDownSelectorComponent>;

  @ViewChildren(PayeeDropdownV4Component)
  payeeDropdowns!: QueryList<PayeeDropdownV4Component>;

  @ViewChildren(BankAcDropdownV4Component)
  bankDropdowns!: QueryList<BankAcDropdownV4Component>;

  selectedBankAccountCtrl = new FormControl<IBankDropdown | null>(null);
  selectedPayeeCtrl = new FormControl<IPayeeDropdown | null>(null);

  invoiceitemList: IInvoiceDropdown[] = [];
  firstInvoiceItemPage: IInvoiceDropdown[] = [];
  filteredInvoiceItems: IInvoiceDropdown[] = [];
  selectedItemValues: string[] = [];
  itemName: string[] = [];
  itemid: string[] = [];

  taxList: ItaxList[] = [];
  selectedTaxId = '';
  taxName = '';
  taxAmountPer = 0;
  taxAmount = 0;
  currentTax = '';

  invoiceTotal = 0;
  subtotal = 0;

  taxListForDropdown: (ItaxList & { taxPercentageLabel: string })[] = [];

  bpage = 1;
  Ipage = 1;
  searchTerm = '';

  ngOnInit(): void {
    this.initFormGroup();
    this.loadTaxData();
    this.loadItemData();
    this.setupDropdownChanges();

    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.creditmemo.get('creditMemoDate')?.setValue(today);

    this.setCreditData();
  }

  private setupDropdownChanges(): void {
    this.selectedBankAccountCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank: IBankDropdown | null) => {
        this.creditmemo.patchValue({ bankAccountId: bank?.id ?? '' });
      });

    this.selectedPayeeCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payee: IPayeeDropdown | null) => {
        this.creditmemo.patchValue({ payeeId: payee?.id ?? '' });
      });
  }

  initFormGroup(): void {
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
    this.itemName[0] = '';
  }

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

  get itemFormArray(): UntypedFormArray {
    return this.creditmemo.get('item') as UntypedFormArray;
  }

  autoPopulateBank(event: IV3DropDownOnReady): void {
    const id = this.creditmemo.get('bankAccountId')?.value;
    if (event?.setItemWithId && id) event.setItemWithId(id);
  }

  autoPopulatePayee(event: IV3DropDownOnReady): void {
    const id = this.creditmemo.get('payeeId')?.value;
    if (event?.setItemWithId && id) event.setItemWithId(id);
  }

  setCreditData(): void {
    if (!this.data) return;
    this.editMode = true;

    const newDate = this.datePipe.transform(
      this.data.creditMemoDate,
      'yyyy-MM-dd'
    );

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
    });

    this.itemFormArray.clear();
    this.itemName = [];
    this.selectedItemValues = [];
    for (let i = 0; i < this.data.items.length; i += 1) {
      this.itemFormArray.push(this.createCreditMemoCtrl());
      const formGrp = this.itemFormArray.controls[i] as UntypedFormGroup;
      this.invoiceTotal += parseFloat(this.data.items[i].total);
      this.subtotal = this.data.amount as number;
      this.itemName.push(this.data.items[i].itemName);
      this.selectedItemValues.push(this.data.items[i].itemId);
      formGrp.patchValue({
        cost: this.data.items[i].unitPrice,
        item: this.data.items[i].itemId,
        description: this.data.items[i].note,
        qty: this.data.items[i].units,
        total: this.data.items[i].total
      });
    }
    this.refreshFilteredItems();
  }

  onSelectTax(event: string): void {
    if (event) {
      this.currentTax = event;
      this.selectedTaxId = event;
      this.invoiceService
        .getSingleTaxData(event)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.taxAmountPer = res.data.taxPercentage;
          this.taxName = res.data.taxName;
          this.taxAmount = Math.round(
            (Number(this.taxAmountPer) / 100) * Number(this.invoiceTotal)
          );
          this.creditmemo.patchValue({ taxId: res.data.id });
        });
    } else {
      this.currentTax = '';
      this.selectedTaxId = '';
      this.taxAmount = 0;
      this.taxName = '';
      this.creditmemo.patchValue({ taxId: '', creditTaxTotal: '' });
    }
  }

  grandTotal(): number {
    return this.taxAmount === 0
      ? this.invoiceTotal
      : Number(this.invoiceTotal) + Number(this.taxAmount);
  }

  calculateSummary(): void {
    this.subtotal = 0;
    this.itemFormArray.controls.forEach((formGrp) => {
      this.subtotal += Number(formGrp.get('total')?.value);
    });
    this.invoiceTotal = this.subtotal;
    if (this.currentTax) {
      this.taxAmount = Math.round(
        (Number(this.taxAmountPer) / 100) * Number(this.invoiceTotal)
      );
    }
  }

  onItemChange(selectedId: string, i: number): void {
    const previousId = this.itemid[i];
    if (previousId) {
      const idx = this.selectedItemValues.indexOf(previousId);
      if (idx !== -1) this.selectedItemValues.splice(idx, 1);
    }

    if (!selectedId) {
      const formGrp = this.itemFormArray.controls[i] as UntypedFormGroup;
      formGrp.patchValue({
        cost: '',
        item: '',
        description: '',
        qty: '',
        total: '0.00',
        stock: ''
      });
      this.itemName[i] = '';
      this.itemid[i] = '';
      this.refreshFilteredItems();
      this.calculateSummary();
      return;
    }

    if (i < this.itemid.length) {
      this.itemid[i] = selectedId;
    } else {
      this.itemid.push(selectedId);
    }

    this.invoiceService
      .getSingleInvoiceItem(selectedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const invoiceitem = res.data;
        this.itemName[i] = invoiceitem.name;
        const formGrp = this.itemFormArray.controls[i] as UntypedFormGroup;
        formGrp.patchValue({
          cost: invoiceitem.unitPrice,
          item: invoiceitem.id,
          description: invoiceitem.note,
          stock: invoiceitem.stock
        });
        const qty = Number(formGrp.get('qty')?.value);
        formGrp.patchValue({
          total: (Number(invoiceitem.unitPrice) * qty).toFixed(2)
        });
        this.selectedItemValues.push(invoiceitem.id);
        this.refreshFilteredItems();
        this.calculateSummary();
      });
  }

  onQtyChange(event: any, i: number): void {
    const formGrp = this.itemFormArray.controls[i] as UntypedFormGroup;
    const qtyValue = String(event?.value ?? event?.target?.value ?? '').replace(
      /,/g,
      ''
    );
    const costValue = String(formGrp.get('cost')?.value ?? '').replace(
      /[$,]/g,
      ''
    );
    if (qtyValue && costValue) {
      formGrp.patchValue({
        total: (Number(qtyValue) * Number(costValue)).toFixed(2)
      });
      this.calculateSummary();
    }
  }

  onCostChange(costFormatted: any, i: number): void {
    const cost = Number(String(costFormatted ?? '').replace(/[$,]/g, ''));
    const formGrp = this.itemFormArray.controls[i] as UntypedFormGroup;
    const qty = Number(formGrp.get('qty')?.value);
    if (cost && qty) {
      formGrp.patchValue({ total: (cost * qty).toFixed(2) });
      this.calculateSummary();
    }
  }

  addNewRow(): void {
    const newIndex = this.itemFormArray.length;
    this.itemFormArray.push(this.createCreditMemoCtrl());
    this.itemName[newIndex] = '';
    this.Ipage = 1;
    this.invoiceitemList = [...this.firstInvoiceItemPage];
    this.refreshFilteredItems();
  }

  removeRow(i: number): void {
    if (this.itemFormArray.length > 1) {
      const removedId = this.itemid[i];
      this.itemFormArray.removeAt(i);
      this.itemName.splice(i, 1);
      this.itemid.splice(i, 1);
      if (removedId) {
        const idx = this.selectedItemValues.indexOf(removedId);
        if (idx !== -1) this.selectedItemValues.splice(idx, 1);
      }
      this.refreshFilteredItems();
      this.calculateSummary();
    }
  }

  loadItemData(): void {
    this.invoiceService
      .getinvoiceitem(this.Ipage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.invoiceitemList = res.data;
        if (this.Ipage === 1) this.firstInvoiceItemPage = res.data;
        this.refreshFilteredItems();
      });
  }

  loadTaxData(): void {
    this.invoiceService
      .gettax(this.bpage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.taxList = res.data;
        this.refreshTaxListForDropdown();
        if (this.editMode && this.data?.taxId) {
          this.onSelectTax(this.data.taxId);
        }
      });
  }

  onScrollTax(): void {
    this.bpage += 1;
    this.invoiceService
      .gettax(this.bpage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        res.data.forEach((t: ItaxList) => this.taxList.push(t));
        this.refreshTaxListForDropdown();
      });
  }

  private refreshTaxListForDropdown(): void {
    this.taxListForDropdown = this.taxList.map((tax) => ({
      ...tax,
      taxPercentageLabel: `${tax.taxPercentage}%`
    }));
  }

  onScroll(): void {
    this.Ipage += 1;
    this.invoiceService
      .getinvoiceitem(this.Ipage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        res.data.forEach((item: IInvoiceDropdown) =>
          this.invoiceitemList.push(item)
        );
        this.refreshFilteredItems();
      });
  }

  onSearch(event: string): void {
    this.searchTerm = event;
    if (!event.trim()) {
      this.invoiceitemList = [...this.firstInvoiceItemPage];
      this.refreshFilteredItems();
      return;
    }
    this.Ipage = 1;
    this.invoiceService
      .getinvoiceitem(1, this.searchTerm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.invoiceitemList = res.data;
        this.refreshFilteredItems();
      });
  }

  refreshFilteredItems(): void {
    this.filteredInvoiceItems = this.invoiceitemList.filter(
      (item) => !this.selectedItemValues.includes(item.id)
    );
  }

  get filteredItemsList(): IInvoiceDropdown[] {
    if (
      this.filteredInvoiceItems.length === 0 &&
      this.invoiceitemList.length > 0
    ) {
      this.refreshFilteredItems();
    }
    return this.filteredInvoiceItems;
  }

  openInvoiceItemModal(i: number): void {
    this.dialog
      .open(V4AddInvoiceItemComponent, {
        maxWidth: '480px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        autoFocus: false,
        disableClose:true
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result && result.success) {
          this.invoiceService
            .getSingleInvoiceItem(result.Id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              this.invoiceitemList.unshift(res.data);
              this.onItemChange(res.data.id, i);
              this.itemName[i] = res.data.name;
            });
        }
      });
  }

  opentaxmodal(): void {
    this.dialog
      .open(V4AddInvoiceTaxComponent, {
        maxWidth: '480px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        data: { mode: 'NOT-TAX' }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.bpage = 1;
          this.invoiceService
            .gettax(1)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              this.taxList = res.data;
              this.refreshTaxListForDropdown();
              this.selectedTaxId = result.id;
              this.onSelectTax(result.id);
            });
        }
      });
  }

  private buildBody(): AddCreditmemoInterface {
    const formData = this.creditmemo.value;
    const newDate = this.datePipe.transform(
      formData.creditMemoDate,
      'MM/dd/yyyy'
    );
    return {
      bankAccountId: formData.bankAccountId,
      payeeId: formData.payeeId,
      creditMemoDate: newDate,
      creditMemoNo: formData.creditMemoNo,
      poNo: formData.poNo,
      accountNumber: formData.accountNumber,
      creditMemoId: formData.creditMemoId,
      note: formData.note,
      memo: formData.memo,
      taxId: formData.taxId,
      totalTotal: this.invoiceTotal,
      creditTaxTotal: this.taxAmount,
      creditGrandTotal: this.grandTotal(),
      item: this.itemFormArray.value
    };
  }

  private validateForm(): boolean {
    const items = this.creditmemo.value.item;
    if (!this.creditmemo.value.bankAccountId) {
      this.alertService.warningAlert({
        content: 'Credit memo from field is required'
      });
      return false;
    }
    if (!this.creditmemo.value.payeeId) {
      this.alertService.warningAlert({ content: 'Client field is required' });
      return false;
    }
    if (!this.creditmemo.value.creditMemoDate) {
      this.alertService.warningAlert({
        content: 'Credit memo date is required.'
      });
      return false;
    }
    if (!this.creditmemo.value.creditMemoNo) {
      this.alertService.warningAlert({
        content: 'Credit memo number is required.'
      });
      return false;
    }
    if (!items[0]?.item) {
      this.alertService.warningAlert({ content: 'Item field is required' });
      return false;
    }
    if (!items[0]?.cost) {
      this.alertService.warningAlert({
        content: 'Unit cost field is required'
      });
      return false;
    }
    for (let i = 0; i < items.length; i += 1) {
      if ((!items[i].qty || items[i].qty === 0) && items[i].cost) {
        this.alertService.warningAlert({
          content: `Quantity field is required in row ${i + 1}!`
        });
        return false;
      }
    }
    if (this.grandTotal() > 100000000) {
      this.alertService.warningAlert({
        content: 'The Item amount must be between 0 and 100000000'
      });
      return false;
    }
    return true;
  }

  submit(): void {
    if (!this.validateForm()) return;
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.invoiceService
      .addCreditmemo(this.buildBody())
      .pipe(
        finalize(() => {
          this.isProcessing = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if ((res as IApiResMesssage).success) {
            this.alertService
              .successAlert()
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((result) => {
                if (result) {
                  this.dataTableService.setRefreshStatus(true);
                  this.dialogRef.close(true);
                }
              });
          } else {
            this.alertService.failedAlert({
              content: (res as IApiResMesssage).message || 'Failed to save credit memo.'
            });
          }
        }
      });
  }

  update(): void {
    if (!this.validateForm()) return;
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.invoiceService
      .updateCreditmemo(this.data.creditMemoId, this.buildBody())
      .pipe(
        finalize(() => {
          this.isProcessing = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if ((res as IApiResMesssage).success) {
            this.alertService
              .successAlert()
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((result) => {
                if (result) {
                  this.dataTableService.setRefreshStatus(true);
                  this.dialogRef.close(true);
                }
              });
          } else {
            this.alertService.failedAlert({
              content: (res as IApiResMesssage).message || 'Failed to save credit memo.'
            });
          }
        }
      });
  }

  closeAllDropdowns(): void {
    this.allDropdowns?.forEach((d) => d.close());
    this.payeeDropdowns?.forEach((d) => d.close());
    this.bankDropdowns?.forEach((d) => d.close());
  }

  close(): void {
    this.dialogRef.close();
  }
}
