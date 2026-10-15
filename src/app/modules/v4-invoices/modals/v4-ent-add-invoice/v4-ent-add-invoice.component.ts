/* eslint-disable @typescript-eslint/no-explicit-any */
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl,
  FormControl
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { NgxMaskDirective } from 'ngx-mask';
import {
  LucideAngularModule,
  X,
  Plus,
  Trash2,
  Paperclip,
  ChevronDown,
  LoaderCircle
} from 'lucide-angular';
import { finalize } from 'rxjs';

import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';

import {
  ICreatedExistingAtachments,
  IInvoiceDropdown,
  IMailData,
  INewInvoice,
  ItaxList,
  IAddInvoiceDialog
} from 'src/app/modules/invoices/model/invoice';
import { IBankDropdown } from 'src/app/models/bank';
import {
  IPayeeDropdown,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IUsersList } from 'src/app/models/user';

import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4AddInvoiceItemComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-item/v4-add-invoice-item.component';
import { V4AddInvoiceTaxComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-tax/v4-add-invoice-tax.component';
import { V4EmailSmsComponent } from 'src/app/modules/v4-invoices/modals/v4-email-sms/v4-email-sms.component';
import { V4DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/v4-document-mail-modal/v4-document-mail-modal.component';

@Component({
  selector: 'app-v4-ent-add-invoice',
  templateUrl: './v4-ent-add-invoice.component.html',
  standalone: true,
  providers: [DatePipe, CurrencyPipe],
  styleUrl: './v4-ent-add-invoice.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    CurrencyPipe,
    LucideAngularModule,
    BankAcDropdownV4Component,
    PayeeDropdownV4Component,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4DatePickerComponent,
    CommonAmountInputV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent,
    MatTooltipModule
  ]
})
export class V4EntAddInvoiceComponent implements OnInit {
  // Icons
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly PaperclipIcon = Paperclip;
  readonly ChevronDownIcon = ChevronDown;
  readonly LoaderCircleIcon = LoaderCircle;

  // Injections
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private payeeService = inject(PayeeService);
  private userManagementService = inject(UserManagementService);
  public dialogRef = inject(MatDialogRef<V4EntAddInvoiceComponent>);
  public datas: IAddInvoiceDialog = inject(MAT_DIALOG_DATA);
  private elRef = inject(ElementRef);

  // Form
  invoice!: FormGroup;

  // State signals
  isSubmitting = signal(false);
  isSending = signal(false);
  isSendMenuOpen = signal(false);
  isUserLoading = signal(false);

  // Mode flags
  editMode = false;
  clone = false;

  // Dropdown FormControls (ControlValueAccessor-based v4 dropdowns)
  selectedBankAccountCtrl = new FormControl<IBankDropdown | null>(null);
  selectedPayeeCtrl = new FormControl<IPayeeDropdown | null>(null);

  // User
  usersList = signal<IUsersList[]>([]);
  selectedUserId = '';

  // Item data
  invoiceitemList: IInvoiceDropdown[] = [];
  filteredInvoiceItems: IInvoiceDropdown[] = [];
  rowFilteredItems: IInvoiceDropdown[][] = [];
  firstInvoiceItemPage: IInvoiceDropdown[] = [];
  selectedItemValues: string[] = [];
  itemValues: (string | null)[] = [];
  itemName: (string | null)[] = [];
  itemid: string[] = [];

  @ViewChildren('itemDropdown')
  itemDropdowns!: QueryList<V4CommonDropDownSelectorComponent>;

  @ViewChildren(V4CommonDropDownSelectorComponent)
  allDropdowns!: QueryList<V4CommonDropDownSelectorComponent>;

  @ViewChildren(PayeeDropdownV4Component)
  payeeDropdowns!: QueryList<PayeeDropdownV4Component>;

  @ViewChildren(BankAcDropdownV4Component)
  bankDropdowns!: QueryList<BankAcDropdownV4Component>;

  closeAllDropdowns(): void {
    this.allDropdowns?.forEach((d) => d.close());
    this.payeeDropdowns?.forEach((d) => d.close());
    this.bankDropdowns?.forEach((d) => d.close());
  }

  // Tax data
  taxList: ItaxList[] = [];
  selectedTaxId = '';
  taxAmountPer = 0;
  taxName = '';

  // Attachments
  createdExistingAttachments: ICreatedExistingAtachments[] = [];

  // Credit
  creditbalance: string;
  Applycredit = false;
  creditmemoId: string;
  ids: string;
  maildata: IMailData;

  // Totals
  subTotal = 0;
  discount: number | string = 0;
  taxAmount = 0;
  totalInvoice = 0;
  grandtotal = 0;

  // Pagination
  bpage = 1;
  Ipage = 1;
  searchTerm: string;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isSendMenuOpen.set(false);
    }
  }

  toggleSendMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isSendMenuOpen.update((v) => !v);
  }

  ngOnInit(): void {
    this.initFormGroup();
    this.loadTaxData();
    this.loadItemData();
    this.loadUserList();
    this.setupDropdownChanges();

    if (this.datas?.isClone) {
      this.setCloneData();
    } else if (this.datas?.isClone === false && this.datas?.data) {
      this.setCreditData();
    }

    if (this.datas?.data) {
      this.ids = this.datas.data.invoiceId;
      this.creditmemoId =
        this.datas.data?.creditMemoDetails?.applied_amount?.[0]?.payment;
    }
  }

  private setupDropdownChanges(): void {
    this.selectedBankAccountCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank: IBankDropdown | null) => {
        if (bank && bank.id !== this.invoice.get('bankAccountId')?.value) {
          this.onSelectBank(bank);
        }
      });

    this.selectedPayeeCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payee: IPayeeDropdown | null) => {
        if (payee && payee.id !== this.invoice.get('payeeId')?.value) {
          this.onSelectPayee(payee);
        }
      });
  }

  initFormGroup(): void {
    this.invoice = this.fb.group({
      bankAccountId: ['', [Validators.required]],
      payeeId: [''],
      invoiceCategory: [''],
      discount: [''],
      discountType: [2],
      InvoiceNo: ['', [Validators.required]],
      Date: ['', [Validators.required]],
      DueDate: [''],
      poNo: [''],
      accountNumber: [''],
      note: [''],
      memo: [''],
      invoiceTaxId: [''],
      creditmemo: [''],
      creditMemoApplied: [''],
      creditMemo: [''],
      totalTotal: [],
      discountTotal: [],
      invoiceTaxTotal: [],
      invoiceTotal: [0],
      invoiceGrandTotal: [0],
      allAttachments: this.fb.array([]),
      item: this.fb.array([this.createItemRow()]),
      userId: ['']
    });

    this.itemValues[0] = '';
    this.itemName[0] = '';

    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    if (today) {
      this.invoice.patchValue({ Date: today });
      const due = new Date(today);
      due.setDate(due.getDate() + 10);
      this.invoice.patchValue({
        DueDate: this.datePipe.transform(due, 'yyyy-MM-dd')
      });
    }

    const dateControl = this.invoice.get('Date');
    if (dateControl) {
      dateControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((invoiceDate: string) => {
          if (!invoiceDate) return;
          const afterTenDays = new Date(invoiceDate);
          afterTenDays.setDate(afterTenDays.getDate() + 10);
          this.invoice.patchValue({
            DueDate: this.datePipe.transform(afterTenDays, 'yyyy-MM-dd')
          });
        });
    }
  }

  createItemRow(): FormGroup {
    return this.fb.group({
      item: [''],
      description: [''],
      qty: [0],
      cost: [''],
      itemDiscount: ['0.00'],
      itemDiscountType: [1],
      itemDiscountApplied: [],
      total: ['0.00'],
      rowTotal: ['0.00'],
      stock: [''],
      ruleId: ['']
    });
  }

  get itemFormArray(): FormArray {
    return this.invoice.get('item') as FormArray;
  }

  // ---------------------- Bank ----------------------

  onSelectBank(event: IBankDropdown): void {
    if (!event?.id) return;
    this.invoice.patchValue({ bankAccountId: event.id });

    this.invoiceService
      .getInvoiceNo(event.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.invoice.patchValue({ InvoiceNo: res.data.lastInvoiceNo });
      });

    const payeeId = this.invoice.get('payeeId')?.value;
    if (payeeId) {
      this.invoiceService
        .getCreditBalance({ payeeId, bankAccountId: event.id })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.creditbalance = res.data.availableCreditMemo;
          this.invoice.patchValue({ creditmemo: res.data.availableCreditMemo });
        });
    }
  }

  autoPopulateBank(event: IV3DropDownOnReady): void {
    const id = this.invoice.get('bankAccountId')?.value;
    if (event?.setItemWithId && id) event.setItemWithId(id);
  }

  onClearBankAccount(): void {
    this.invoice.patchValue({ bankAccountId: '' });
  }

  // ---------------------- Payee ----------------------

  onSelectPayee(event: IPayeeDropdown | null): void {
    if (!event) {
      this.invoice.patchValue({ payeeId: '' });
      return;
    }
    this.invoice.patchValue({ payeeId: event.id });
    this.payeeService
      .showPayee(event.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const details: IViewPayee = res.data;
        this.invoice.patchValue({ accountNumber: details.accountNumber });
      });
    this.getCreditBalance();
  }

  autoPopulatePayee(event: IV3DropDownOnReady): void {
    const id = this.invoice.get('payeeId')?.value;
    if (event?.setItemWithId && id) event.setItemWithId(id);
  }

  onClearPayee(): void {
    this.invoice.patchValue({ payeeId: '' });
    this.itemFormArray.controls.forEach(
      (ctrl: AbstractControl, index: number) => {
        (ctrl as FormGroup).get('item')?.setValue('');
        this.itemName[index] = '';
        this.itemValues[index] = '';
      }
    );
    this.selectedItemValues = [];
    this.refreshFilteredItems();
  }

  getCreditBalance(): void {
    const bankAccountId = this.invoice.get('bankAccountId')?.value;
    const payeeId = this.invoice.get('payeeId')?.value;
    if (bankAccountId && payeeId) {
      this.invoiceService
        .getCreditBalance({ payeeId, bankAccountId })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.creditbalance = res.data.availableCreditMemo;
          this.invoice.patchValue({ creditmemo: res.data.availableCreditMemo });
        });
    }
  }

  // ---------------------- User ----------------------

  loadUserList(searchTerm = ''): void {
    this.isUserLoading.set(true);
    this.userManagementService
      .getUsersList(0, searchTerm)
      .pipe(
        finalize(() => this.isUserLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.usersList.set(res.data);
        }
      });
  }

  onChangeUser(clientId: string): void {
    this.invoice.patchValue({ userId: clientId || '' });
  }

  onSearchUser(searchTerm: string): void {
    this.loadUserList(searchTerm);
  }

  // ---------------------- Tax ----------------------

  onSelectTax(event: string): void {
    if (!event) {
      this.invoice.patchValue({ invoiceTaxId: '', invoiceTaxTotal: '' });
      this.taxAmountPer = 0;
      this.taxName = '';
      return;
    }
    this.selectedTaxId = event;
    this.invoiceService
      .getSingleTaxData(event)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.taxAmountPer = res.data.taxPercentage;
        this.taxName = res.data.taxName;
        this.invoice.patchValue({ invoiceTaxId: res.data.id });
      });
  }

  opentaxmodal(): void {
    this.dialog
      .open(V4AddInvoiceTaxComponent, {
        maxWidth: '360px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        data: { mode: 'NOT-TAX' }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.bpage = 1;
          this.loadTaxData(result.id);
        }
      });
  }

  // ---------------------- Invoice Items ----------------------

  onItemChange(selectedId: string, i: number): void {
    if (!selectedId || selectedId === 'add-new') return;

    const payeeId = this.invoice.get('payeeId')?.value;
    if (!payeeId) {
      this.alertService.warningAlert({
        content: 'Please select a payee first before choosing an item.'
      });
      const formGrp = this.itemFormArray.controls[i] as FormGroup;
      formGrp.get('item')?.setValue(null);
      this.itemName[i] = null;
      this.itemValues[i] = null;
      this.itemDropdowns?.toArray()[i]?.clearSelection();
      return;
    }

    if (i < this.itemid.length) {
      this.itemid[i] = selectedId;
    } else {
      this.itemid.push(selectedId);
    }

    if (selectedId) {
      this.invoiceService
        .getSingleInvoiceItem(selectedId, payeeId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          const invoiceitem = res.data;
          this.itemName[i] = invoiceitem.name;
          this.itemValues[i] = invoiceitem.id;
          const formGrp = this.itemFormArray.controls[i] as FormGroup;
          formGrp.patchValue({
            cost: invoiceitem.unitPrice,
            item: invoiceitem.id,
            description: invoiceitem.note,
            stock: invoiceitem.stock,
            ruleId: invoiceitem.ruleId
          });
          this.selectedItemValues.push(invoiceitem.id);
          this.refreshFilteredItems();
        });
    } else {
      this.itemName[i] = '';
      const formGrp = this.itemFormArray.controls[i] as FormGroup;
      formGrp.patchValue({
        cost: '',
        item: '',
        description: '',
        qty: 0,
        total: '0.00',
        rowTotal: '0.00',
        itemDiscountApplied: ''
      });
      this.selectedItemValues.splice(i, 1);
      this.refreshFilteredItems();
    }
  }

  getItemValue(index: number): string {
    return this.itemValues[index] ?? this.itemName[index] ?? '';
  }

  openInvoiceItemModal(i: number): void {
    this.dialog
      .open(V4AddInvoiceItemComponent, {
        maxWidth: '360px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        autoFocus: false,
        disableClose:true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.itemValues[i] = result.Id;
          this.invoiceService
            .getSingleInvoiceItem(result.Id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res.success) {
                this.invoiceitemList.unshift(res.data);
                this.refreshFilteredItems();
                this.onItemChange(res.data.id, i);
                this.itemName[i] = res.data.name;
                this.itemValues[i] = res.data.id;
              }
            });
        }
      });
  }

  addNewRow(): void {
    const payeeId = this.invoice.get('payeeId')?.value;
    if (!payeeId) {
      this.alertService.warningAlert({
        content: 'Please select a payee first before adding a row.'
      });
      return;
    }
    const newIndex = this.itemFormArray.length;
    this.itemFormArray.push(this.createItemRow());
    this.itemValues[newIndex] = '';
    this.itemName[newIndex] = '';
    this.Ipage = 1;
    this.invoiceitemList = this.firstInvoiceItemPage;
    this.refreshFilteredItems();
  }

  removeRow(i: number, credit: AbstractControl): void {
    this.itemName.splice(i, 1);
    this.itemValues.splice(i, 1);
    const id = (credit as FormGroup).get('item')?.value as string;
    const idxInItemId = this.itemid.findIndex((el, j) => j === i && el === id);
    if (idxInItemId !== -1) this.itemid.splice(idxInItemId, 1);

    if (this.itemFormArray.length > 1) {
      this.itemFormArray.removeAt(i);
    }
    this.refreshFilteredItems();
    this.grandTotal();
  }

  // ---------------------- Item Data Loading ----------------------

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
      .getinvoiceitem(this.Ipage, this.searchTerm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.invoiceitemList = res.data;
        this.refreshFilteredItems();
      });
  }

  onSelectClose(): void {
    if (this.searchTerm) {
      this.invoiceitemList = [...this.firstInvoiceItemPage];
      this.searchTerm = '';
      this.Ipage = 1;
      this.refreshFilteredItems();
    }
  }

  refreshFilteredItems(): void {
    this.filteredInvoiceItems = this.invoiceitemList.filter(
      (item) => !this.selectedItemValues.includes(item.id)
    );
    this.rowFilteredItems = this.itemFormArray.controls.map((_, i) => {
      const currentId = this.itemid[i];
      if (!currentId) return this.filteredInvoiceItems;
      const ownItem = this.invoiceitemList.find((item) => item.id === currentId);
      return ownItem
        ? [ownItem, ...this.filteredInvoiceItems]
        : this.filteredInvoiceItems;
    });
  }

  getRowFilteredItems(i: number): IInvoiceDropdown[] {
    return this.rowFilteredItems[i] ?? this.filteredInvoiceItems;
  }

  get filteredItemsList(): IInvoiceDropdown[] {
    return this.filteredInvoiceItems;
  }

  // ---------------------- Tax Data Loading ----------------------

  loadTaxData(targetTaxId?: string): void {
    this.invoiceService
      .gettax(this.bpage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.taxList = res.data;
        if (targetTaxId && this.taxList.some((t) => t.id === targetTaxId)) {
          this.onSelectTax(targetTaxId);
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
      });
  }

  // ---------------------- Calculations ----------------------

  subtotal(): number {
    this.subTotal = 0;
    this.itemFormArray.controls.forEach((ctrl) => {
      this.subTotal += Number(ctrl.get('rowTotal')?.value);
    });
    this.invoice.get('totalTotal')?.setValue(this.subTotal);
    return this.subTotal;
  }

  onDiscountChange(): number {
    const itemDiscount = this.invoice.get('discount')?.value;
    const itemDiscountType = this.invoice.get('discountType')?.value;
    const afterDiscount = this.subTotal - itemDiscount;
    this.taxAmount = Math.round((this.taxAmountPer / 100) * afterDiscount);

    if (Number(itemDiscountType) === 2) {
      this.discount = ((itemDiscount / 100) * this.subTotal).toFixed(2);
    } else {
      this.discount = itemDiscount;
    }
    return Number(this.discount);
  }

  invoiceTotal(): number {
    this.totalInvoice =
      this.subtotal() - Number(this.discount) + Number(this.taxAmount);
    this.invoice.get('invoiceTotal')?.setValue(this.totalInvoice);
    return this.totalInvoice;
  }

  grandTotal(): number {
    this.grandtotal =
      this.invoiceTotal() -
      Number(this.invoice.get('creditMemoApplied')?.value || 0);
    this.invoice.get('invoiceGrandTotal')?.setValue(this.grandtotal);
    return this.grandtotal;
  }

  onQtyChanges(event: any, i: number, type: string): void {
    const formGrp = this.itemFormArray.controls[i] as FormGroup;

    if (!type) {
      const qtyValue = String(
        event?.value ?? event?.target?.value ?? ''
      ).replace(/,/g, '');
      const qty = Number(qtyValue);
      const stock = formGrp.get('stock')?.value;

      if (stock != null && stock !== '' && stock < qty) {
        this.alertService.warningAlert({
          title: 'Out of Stock',
          content: stock <= 0 ? 'Stock is 0' : `Stock is ${stock}`
        });
        formGrp.patchValue({ total: '0.00', rowTotal: '0.00', qty: 0 });
        return;
      }

      const cost = Number(formGrp.get('cost')?.value);
      const total = qty * cost;
      formGrp.patchValue({
        total: total.toFixed(2),
        rowTotal: total.toFixed(2)
      });
    } else {
      const costValue = String(event ?? '').replace(/[$,]/g, '');
      if (costValue && costValue !== '0') {
        const cost = Number(costValue);
        const qtyRaw = formGrp.get('qty')?.value;
        const quantity = qtyRaw ? Number(qtyRaw) : 1;
        if (!qtyRaw) {
          formGrp.patchValue({ qty: '1' }, { emitEvent: false });
        }
        const total = quantity * cost;
        formGrp.patchValue({
          total: total.toFixed(2),
          rowTotal: total.toFixed(2)
        });
      }
    }

    this.grandTotal();
  }

  ApplyCredit(event: any): void {
    const raw = event?.target?.value ?? event ?? '';
    const val = String(raw).replace(/[$,]/g, '').trim();
    this.Applycredit =
      Number(val) > this.subtotal() || Number(val) > Number(this.creditbalance);
    if (!this.Applycredit) {
      this.invoice.get('creditMemoApplied')?.setValue(val || '');
    }
    this.grandTotal();
  }

  deleteApplied(): void {
    const data = { paymentId: this.creditmemoId, invoiceId: this.ids };
    this.invoiceService
      .deleteAppliedCredit(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.invoice.get('creditMemoApplied')?.setValue('');
          this.getCreditBalance();
          this.grandTotal();
        }
      });
  }

  discountvalidation(): boolean {
    if (Number(this.onDiscountChange()) >= Number(this.subtotal())) {
      this.alertService.warningAlert({
        content: 'Discount amount should be less than total amount'
      });
    }
    return false;
  }

  // ---------------------- Attachments ----------------------

  openAttachmentModal(): void {
    const data = {
      id: this.ids ? this.ids : 0,
      type: 'invoices',
      existingData: this.datas ? undefined : this.createdExistingAttachments
    };
    this.dialog
      .open(V4AddAttachmentModalComponent, {
        width: '750px',
        maxWidth: '1350px',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.invoice.value.allAttachments = [];
        this.createdExistingAttachments = [];
        result.existingData.forEach((e: ICreatedExistingAtachments) => {
          if (
            !this.createdExistingAttachments
              .map((el) => el.encrypted_id)
              .includes(e.encrypted_id)
          ) {
            this.invoice.value.allAttachments.push(e.encrypted_id);
            this.createdExistingAttachments.push(e);
          }
        });
      });
  }

  // ---------------------- Edit / Clone Data ----------------------

  private populateItemsFromData(items: any[]): void {
    this.itemFormArray.clear();
    this.itemValues = [];
    this.itemName = [];
    for (let i = 0; i < items.length; i += 1) {
      this.itemFormArray.push(this.createItemRow());
      const formGrp = this.itemFormArray.controls[i] as FormGroup;
      this.itemName.push(items[i].itemName);
      this.itemValues.push(items[i].itemId);
      formGrp.patchValue({
        cost: items[i].unitPrice,
        item: items[i].itemId,
        description: items[i].note,
        qty: items[i].units,
        total: items[i].total,
        rowTotal: items[i].itemTotal,
        ruleId: items[i].ruleId,
        itemDiscountApplied: items[i].discountApplied,
        itemDiscount: items[i].discountAmount,
        itemDiscountType: items[i].discountType,
        stock: items[i].stock ?? 0
      });
    }
  }

  setCreditData(): void {
    const d = this.datas.data;
    if (!d) return;
    this.editMode = true;

    const newDate = this.datePipe.transform(d.invoiceDate, 'yyyy-MM-dd');
    const dueDate = this.datePipe.transform(d.dueDate, 'yyyy-MM-dd');
    const discount =
      d.discount != null ? parseFloat(String(d.discount).replace(/,/g, '')) : 0;

    this.selectedTaxId = d.taxId;
    this.onSelectTax(d.taxId);
    this.selectedUserId = d.createdById || '';

    this.invoice.patchValue({
      bankAccountId: d.bankAccount.bankAccountId,
      payeeId: d.payee.payeeId,
      invoiceCategory: d.category?.categoryId || '',
      discount: Number(discount),
      discountType: d.discountType,
      InvoiceNo: d.invoiceNo,
      Date: newDate,
      DueDate: dueDate,
      poNo: d.poNo,
      accountNumber: d.accountNumber,
      note: d.note,
      memo: d.memo,
      invoiceTaxId: d.taxId || '',
      creditMemoApplied: d.creditMemoApplied,
      invoiceTotal: d.invoicetotal,
      invoiceGrandTotal: d.grandTotal,
      userId: d.createdById || ''
    });
    this.populateItemsFromData(d.items);
    this.onSelectPayee({
      id: d.payee.payeeId,
      name: d.payee.payeeName
    } as IPayeeDropdown);
  }

  setCloneData(): void {
    const d = this.datas.data;
    if (!d) return;
    this.clone = true;
    this.editMode = false;

    this.invoiceService
      .getInvoiceNo(d.bankAccount.bankAccountId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) =>
        this.invoice.patchValue({ InvoiceNo: res.data.lastInvoiceNo })
      );

    const newDate = this.datePipe.transform(d.invoiceDate, 'yyyy-MM-dd');
    const dueDate = this.datePipe.transform(d.dueDate, 'yyyy-MM-dd');

    this.selectedTaxId = d.taxId;
    this.onSelectTax(d.taxId);
    this.selectedUserId = d.createdById || '';

    this.invoice.patchValue({
      bankAccountId: d.bankAccount.bankAccountId,
      payeeId: d.payee.payeeId,
      invoiceCategory: d.category?.categoryId || '',
      discount: Number(d.discount),
      discountType: d.discountType,
      InvoiceNo: d.invoiceNo,
      Date: newDate,
      DueDate: dueDate,
      poNo: d.poNo,
      accountNumber: d.accountNumber,
      note: d.note,
      memo: d.memo,
      creditMemoApplied: d.creditMemoApplied,
      userId: d.createdById || ''
    });
    this.populateItemsFromData(d.items);
    this.onSelectPayee({
      id: d.payee.payeeId,
      name: d.payee.payeeName
    } as IPayeeDropdown);
  }

  // ---------------------- API Payload ----------------------

  buildPayload(): INewInvoice {
    const datas = this.invoice.value;
    return {
      bankAccountId: datas.bankAccountId,
      hiddenPayee: datas.payeeId,
      invoiceCategory: datas.invoiceCategory,
      discount: datas.discount,
      discountType: datas.discountType,
      invoiceNo: datas.InvoiceNo,
      date: this.datePipe.transform(datas.Date, 'MM/dd/yyyy'),
      dueDate: this.datePipe.transform(datas.DueDate, 'MM/dd/yyyy'),
      poNo: datas.poNo,
      accountNumber: datas.accountNumber,
      privateNote: datas.note,
      memo: datas.memo,
      invoiceTaxId: datas.invoiceTaxId,
      creditmemo: datas.creditmemo,
      creditMemoApplied: datas.creditMemoApplied,
      creditMemo: datas.creditMemoApplied,
      creditMemoNo: Number(this.datas?.data?.creditMemoNo),
      totalTotal: datas.totalTotal,
      discountTotal: String(this.onDiscountChange()),
      taxTotal: this.taxAmount,
      invoiceTotal: this.invoiceTotal(),
      grandTotal: this.grandTotal(),
      allAttachments: this.createdExistingAttachments.map(
        (e) => e.encrypted_id
      ),
      item: this.itemFormArray.value,
      userId: datas.userId
    };
  }

  private validateForm(): boolean {
    const items = this.invoice.value.item;
    if (!this.invoice.value.bankAccountId) {
      this.alertService.warningAlert({
        content: 'Invoice From field is required'
      });
      return false;
    }
    if (!this.invoice.value.payeeId) {
      this.alertService.warningAlert({ content: 'Client field is required' });
      return false;
    }
    if (!this.invoice.value.InvoiceNo) {
      this.alertService.warningAlert({
        content: 'Invoice No field is required'
      });
      return false;
    }
    if (!this.invoice.value.Date) {
      this.alertService.warningAlert({ content: 'Date field is required' });
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
          content: `Quantity of item missing in row ${i + 1}!`
        });
        return false;
      }
    }
    if (this.invoice.value.invoiceGrandTotal > 100000000) {
      this.alertService.warningAlert({
        content: 'The Item amount must be between 0 and 100,000,000'
      });
      return false;
    }
    if (Number(this.onDiscountChange()) > Number(this.subtotal())) {
      return this.discountvalidation();
    }
    return true;
  }

  private syncTotals(): void {
    if (this.subTotal !== 0) {
      this.invoice.patchValue({
        totalTotal: this.subtotal(),
        invoiceTaxTotal: this.taxAmount,
        invoiceTotal: this.invoiceTotal(),
        invoiceGrandTotal: this.grandtotal
      });
    }
  }

  // ---------------------- Submit / Update / Send ----------------------

  submit(): void {
    if (!this.validateForm()) return;
    this.syncTotals();
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    this.invoiceService
      .addinvoice(this.buildPayload())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.message !== 'Updated') {
          this.alertService
            .successAlert()
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
              if (result) {
                this.dataTableService.setRefreshStatus(true);
                this.dialogRef.close('added');
              }
            });
        }
      });
  }

  update(): void {
    if (!this.validateForm()) return;
    this.syncTotals();
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    this.invoiceService
      .updateInvoice(this.datas.data.invoiceId, this.buildPayload())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.message !== 'Updated') {
          this.alertService
            .successAlert()
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
              if (result) {
                this.dataTableService.setRefreshStatus(true);
                this.dialogRef.close('updated');
              }
            });
        }
      });
  }

  SaveEmail(type: 'mail' | 'email'): void {
    if (!this.validateForm()) return;
    this.syncTotals();
    if (this.isSending()) return;
    this.isSending.set(true);

    this.invoiceService
      .addinvoice(this.buildPayload())
      .pipe(
        finalize(() => this.isSending.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.message !== 'Updated') {
          const ids: string[] = [res.data.id];
          this.invoiceService
            .getMaildetails({ ids })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
              this.maildata = response.data;
              this.dataTableService.setRefreshStatus(true);
              this.dialogRef.close('created');
              const modalRef =
                type === 'mail'
                  ? this.dialog.open(V4DocumentMailModalComponent, {
                      disableClose: true,
                      width: '1200px',
                      panelClass: 'paddingless-modal-rounded',
                      data: {
                        type: 'added-invoice',
                        documents: response.data.invoice_data
                      }
                    })
                  : this.dialog.open(V4EmailSmsComponent, {
                      maxWidth: '1010px',
                      width: '90%',
                      panelClass: 'paddingless-modal-rounded',
                      data: this.maildata
                    });
              modalRef
                .afterClosed()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => this.alertService.successAlert());
            });
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
