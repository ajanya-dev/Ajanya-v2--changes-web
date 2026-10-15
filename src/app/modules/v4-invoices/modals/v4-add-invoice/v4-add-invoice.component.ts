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
  Pencil,
  Image,
  LoaderCircle,
  Info
} from 'lucide-angular';
import { Observable, finalize, of, take } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { V4SuccessAlertComponent } from 'src/app/shared/alert/v4-components/v4-success-alert/v4-success-alert.component';

import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';

import {
  ICreatedExistingAtachments,
  IInvoiceDropdown,
  IMailData,
  INewInvoice,
  ItaxList,
  IAddInvoiceDialog
} from 'src/app/modules/invoices/model/invoice';
import { IBankDropdown } from 'src/app/models/bank';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
  IPayeeDropdown,
  IShowPayeeDetails
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IV3DropDownOnReady } from 'src/app/models/common';

import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4AddInvoiceItemComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-item/v4-add-invoice-item.component';
import { V4AddInvoiceTaxComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-tax/v4-add-invoice-tax.component';
import { WalletLogoUpdateV4ModalComponent } from 'src/app/modules/wallet/wallet-v4/modals/wallet-logo-update-v4/wallet-logo-update-v4-modal.component';
import { V4EmailSmsComponent } from 'src/app/modules/v4-invoices/modals/v4-email-sms/v4-email-sms.component';
import { V4DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/v4-document-mail-modal/v4-document-mail-modal.component';
import { V4PaymentLinksCreateComponent } from 'src/app/modules/v4-pages/v4-payment-links/components/v4-payment-links-create/v4-payment-links-create.component';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-v4-add-invoice',
  templateUrl: './v4-add-invoice.component.html',
  standalone: true,
  providers: [DatePipe, CurrencyPipe],
  styleUrl: './v4-add-invoice.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    CurrencyPipe,
    LucideAngularModule,
    MatTooltipModule,
    BankAcDropdownV4Component,
    PayeeDropdownV4Component,
    CategoryDropdownV4Component,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4DatePickerComponent,
    CommonAmountInputV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent
  ]
})
export class V4AddInvoiceComponent implements OnInit {
  readonly discountTypeOptions = [
    { id: '1', name: '$' },
    { id: '2', name: '%' }
  ];

  // Icons
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly PaperclipIcon = Paperclip;
  readonly ChevronDownIcon = ChevronDown;
  readonly PencilIcon = Pencil;
  readonly ImageIcon = Image;
  readonly LoaderCircleIcon = LoaderCircle;
  readonly InfoIcon = Info;

  // Injections
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private payeeService = inject(PayeeService);
  private bankService = inject(BankService);
  public dialogRef = inject(MatDialogRef<V4AddInvoiceComponent>);
  public datas: IAddInvoiceDialog = inject(MAT_DIALOG_DATA);
  private elRef = inject(ElementRef);

  // Form
  invoice!: FormGroup;

  // State signals
  isSubmitting = signal(false);
  isSending = signal(false);
  isLogoLoading = signal(false);
  isSendMenuOpen = signal(false);

  // Mode flags
  editMode = false;
  clone = false;

  // Guards a single out-of-stock warning so fast typing in the qty field
  // can't stack multiple identical popups.
  private isStockWarningOpen = false;

  // Dropdown FormControls (ControlValueAccessor-based v4 dropdowns)
  selectedBankAccountCtrl = new FormControl<IBankDropdown | null>(null);
  selectedPayeeCtrl = new FormControl<IPayeeDropdown | null>(null);
  selectedCategoryCtrl = new FormControl<ICategoryDropdown | null>(null);
  categoryReady?: IV3DropDownOnReady;

  // Item data
  invoiceitemList: IInvoiceDropdown[] = [];
  filteredInvoiceItems: IInvoiceDropdown[] = [];
  rowFilteredItems: IInvoiceDropdown[][] = [];
  firstInvoiceItemPage: IInvoiceDropdown[] = [];
  selectedItemValues: string[] = [];
  itemValues: (string | null)[] = [];
  itemName: (string | null)[] = [];
  itemid: string[] = [];
  itemRequestId: string[] = [];
  itemDetailsLoading: boolean[] = [];
  selectedItemCache: (IInvoiceDropdown | undefined)[] = [];
  discountTypeArray: boolean[] = [];

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

  // Attachments / Logo
  createdExistingAttachments: ICreatedExistingAtachments[] = [];
  logoPreviewUrl: string | null = null;
  logoFile: File | null = null;

  // Credit
  creditbalance: string;
  Applycredit = false;
  creditmemoId: string;
  ids: string;
  maildata: IMailData;

  // Totals (computed on the fly)
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

    this.selectedCategoryCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((category: ICategoryDropdown | null) => {
        if (
          category &&
          category.id !== this.invoice.get('invoiceCategory')?.value
        ) {
          this.onSelectCategory(category);
        } else if (!category) {
          this.invoice.patchValue({ invoiceCategory: '' });
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
      logo: [null]
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
      qty: [''],
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
    this.isLogoLoading.set(true);
    this.logoPreviewUrl = null;
    this.logoFile = null;
    this.invoice.patchValue({ bankAccountId: event.id });

    this.invoiceService
      .getInvoiceNo(event.id)
      .pipe(
        finalize(() => this.isLogoLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.invoice.patchValue({ InvoiceNo: res.data.lastInvoiceNo });
        if (res.data.logoUrl) {
          this.handleExistingLogo(res.data.logoUrl);
        }
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
        const details: IShowPayeeDetails = res.data;
        this.invoice.patchValue({
          accountNumber: details.invoice_account_number ?? '',
          poNo: details.invoice_po_no ?? ''
        });

        if (!this.editMode) {
          this.invoice.patchValue({ invoiceCategory: details.invoice_category });
          if (details.invoice_category) {
            this.categoryReady?.setItemWithId?.(details.invoice_category);
          } else {
            this.selectedCategoryCtrl.setValue(null);
          }
        }
      });
    this.getCreditBalance();
  }

  autoPopulatePayee(event: IV3DropDownOnReady): void {
    const id = this.invoice.get('payeeId')?.value;
    if (event?.setItemWithId && id) event.setItemWithId(id);
  }

  autoPopulateCategory(event: IV3DropDownOnReady): void {
    const id = this.invoice.get('invoiceCategory')?.value;
    if (event?.setItemWithId && id) event.setItemWithId(id);
  }

  onClearPayee(): void {
    this.invoice.patchValue({ payeeId: '' });
    this.itemFormArray.controls.forEach(
      (ctrl: AbstractControl, index: number) => {
        (ctrl as FormGroup).get('item')?.setValue('');
        this.itemName[index] = '';
        this.itemValues[index] = '';
        this.itemid[index] = '';
        this.itemRequestId[index] = '';
        this.itemDetailsLoading[index] = false;
        this.selectedItemCache[index] = undefined;
      }
    );
    this.selectedItemValues = [];
    this.refreshFilteredItems();
  }

  getCreditBalance(): void {
    const headers = new HttpHeaders().set('disablePermission', 'true');
    const bankAccountId = this.invoice.get('bankAccountId')?.value;
    const payeeId = this.invoice.get('payeeId')?.value;
    if (bankAccountId && payeeId) {
      this.invoiceService
        .getCreditBalance({ payeeId, bankAccountId },headers)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.creditbalance = res.data.availableCreditMemo;
          this.invoice.patchValue({ creditmemo: res.data.availableCreditMemo });
        });
    }
  }

  // ---------------------- Category ----------------------

  onSelectCategory(event: ICategoryDropdown): void {
    this.invoice.patchValue({ invoiceCategory: event.id });
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
    if (selectedId === 'add-new') return;

    const previousId = this.itemid[i];

    if (!selectedId) {
      this.itemName[i] = '';
      const formGrp = this.itemFormArray.controls[i] as FormGroup;
      formGrp.patchValue({
        cost: '',
        item: '',
        description: '',
        qty: '',
        total: '0.00',
        rowTotal: '0.00',
        itemDiscount: '0.00',
        itemDiscountApplied: null
      });
      if (previousId) {
        const idx = this.selectedItemValues.indexOf(previousId);
        if (idx !== -1) this.selectedItemValues.splice(idx, 1);
      }
      this.itemid[i] = '';
      this.itemRequestId[i] = '';
      this.itemDetailsLoading[i] = false;
      this.selectedItemCache[i] = undefined;
      this.refreshFilteredItems();
      return;
    }

    const payeeId = this.invoice.get('payeeId')?.value;
    if (!payeeId) {
      this.alertService.warningAlert({
        content: 'Please select a payer first before choosing an item.'
      });
      const formGrp = this.itemFormArray.controls[i] as FormGroup;
      formGrp.get('item')?.setValue(null);
      this.itemName[i] = null;
      this.itemValues[i] = null;
      this.itemid[i] = '';
      this.itemRequestId[i] = '';
      this.itemDetailsLoading[i] = false;
      this.selectedItemCache[i] = undefined;
      this.itemDropdowns?.toArray()[i]?.clearSelection();
      return;
    }

    this.itemid[i] = selectedId;
    // Tracked separately from `itemid` so row lifecycle changes cannot make a
    // valid response look stale.
    this.itemRequestId[i] = selectedId;
    // Cache the picked item now, not when the details arrive: closing the panel
    // resets invoiceitemList to page 1 straight away, and without the cache the
    // row's own option disappears until the response lands — which makes the
    // dropdown fall back to rendering the raw id.
    this.selectedItemCache[i] =
      this.invoiceitemList.find((item) => item.id === selectedId) ??
      this.rowFilteredItems[i]?.find((item) => item.id === selectedId) ??
      this.selectedItemCache[i];

    if (previousId && previousId !== selectedId) {
      const idx = this.selectedItemValues.indexOf(previousId);
      if (idx !== -1) this.selectedItemValues.splice(idx, 1);
    }

    this.itemDetailsLoading[i] = true;
    this.invoiceService
      .getSingleInvoiceItem(selectedId, payeeId)
      .pipe(
        finalize(() => {
          // Only the latest request for this row may switch the loader off.
          if (this.itemRequestId[i] === selectedId) {
            this.itemDetailsLoading[i] = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (this.itemRequestId[i] !== selectedId) return; // stale response — row was cleared/changed since this request fired
        const invoiceitem = res.data;
        this.itemName[i] = invoiceitem.name;
        this.itemValues[i] = invoiceitem.id;
        const formGrp = this.itemFormArray.controls[i] as FormGroup;
        formGrp.patchValue({
          cost: invoiceitem.unitPrice,
          item: invoiceitem.id,
          description: invoiceitem.note ?? '',
          stock: invoiceitem.stock,
          ruleId: invoiceitem.ruleId
        });
        this.selectedItemCache[i] = invoiceitem;
        if (!this.selectedItemValues.includes(invoiceitem.id)) {
          this.selectedItemValues.push(invoiceitem.id);
        }
        this.refreshFilteredItems();
      });
  }

  getItemValue(index: number): string {
    return this.itemName[index] ?? this.itemValues[index] ?? '';
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
          const payeeId = this.invoice.get('payeeId')?.value;
          if (!payeeId) {
            this.invoiceService
              .getSingleInvoiceItem(result.Id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res.success) {
                  this.invoiceitemList.unshift(res.data);
                  this.refreshFilteredItems();
                }
              });
            const showWarning = () =>
              this.alertService.warningAlert({
                content: 'Please select a payer first before choosing an item.'
              });
            const successAlert = this.dialog.openDialogs.find(
              (d) => d.componentInstance instanceof V4SuccessAlertComponent
            );
            if (successAlert) {
              successAlert.afterClosed().pipe(take(1)).subscribe(showWarning);
            } else {
              showWarning();
            }
            return;
          }
          this.itemDetailsLoading[i] = true;
          this.invoiceService
            .getSingleInvoiceItem(result.Id, payeeId)
            .pipe(
              finalize(() => {
                this.itemDetailsLoading[i] = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              if (res.success) {
                const item = res.data;
                this.invoiceitemList.unshift(item);
                this.itemName[i] = item.name;
                this.itemValues[i] = item.id;
                this.itemid[i] = item.id;
                this.itemRequestId[i] = item.id;
                this.selectedItemCache[i] = item;
                const formGrp = this.itemFormArray.controls[i] as FormGroup;
                formGrp.patchValue({
                  cost: item.unitPrice,
                  item: item.id,
                  description: item.note ?? '',
                  stock: item.stock,
                  ruleId: item.ruleId
                });
                this.selectedItemValues.push(item.id);
                this.refreshFilteredItems();
              }
            });
        }
      });
  }

  addNewRow(): void {
    const payeeId = this.invoice.get('payeeId')?.value;
    if (!payeeId) {
      this.alertService.warningAlert({
        content: 'Please select a payer first before adding a row.'
      });
      return;
    }
    const newIndex = this.itemFormArray.length;
    this.itemFormArray.push(this.createItemRow());
    this.itemValues[newIndex] = '';
    this.itemName[newIndex] = '';
    this.itemid[newIndex] = '';
    this.itemRequestId[newIndex] = '';
    this.itemDetailsLoading[newIndex] = false;
    this.selectedItemCache[newIndex] = undefined;
    this.Ipage = 1;
    this.invoiceitemList = this.firstInvoiceItemPage;
    this.refreshFilteredItems();
  }

  removeRow(i: number, credit: AbstractControl): void {
    const id = (credit as FormGroup).get('item')?.value as string;
    const rowItemId = this.itemid[i];

    this.itemName.splice(i, 1);
    this.itemValues.splice(i, 1);
    this.itemid.splice(i, 1);
    this.itemRequestId.splice(i, 1);
    this.itemDetailsLoading.splice(i, 1);
    this.selectedItemCache.splice(i, 1);

    const selectedIdToRemove = rowItemId || id;
    if (selectedIdToRemove) {
      const idx = this.selectedItemValues.indexOf(selectedIdToRemove);
      if (idx !== -1) this.selectedItemValues.splice(idx, 1);
    }

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
      const cached = this.selectedItemCache[i];
      const ownItem =
        cached?.id === currentId
          ? cached
          : this.invoiceitemList.find((item) => item.id === currentId);
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
    this.taxAmount = parseFloat(((this.taxAmountPer / 100) * afterDiscount).toFixed(2));

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
      // QTY changed — event is HTMLInputElement from v4 inputEvent
      const qtyValue = String(
        event?.value ?? event?.target?.value ?? ''
      ).replace(/,/g, '');
      const qty = Number(qtyValue);
      const stock = formGrp.get('stock')?.value;

      if (stock != null && stock !== '' && stock < qty) {
        formGrp.patchValue({ total: '0.00', rowTotal: '0.00', qty: '' });
        if (!this.isStockWarningOpen) {
          this.isStockWarningOpen = true;
          this.alertService
            .warningAlert({
              title: 'Out of Stock',
              content: `The Quantity you entered is higher than the stock available, Stock is ${stock <= 0 ? 0 : stock}`
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.isStockWarningOpen = false;
            });
        }
        return;
      }

      const cost = Number(formGrp.get('cost')?.value);
      const total = qty * cost;
      formGrp.patchValue({
        total: total.toFixed(2),
        rowTotal: total.toFixed(2)
      });
      this.itemtypechange(formGrp.get('itemDiscountType')?.value, i, 'qty');
      this.onItemDiscountChange(
        formGrp.get('itemDiscountApplied')?.value,
        i,
        'type'
      );
    } else {
      // cost changed — event is formatted string from v4 blurEvent e.g. "$223.00"
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
      this.itemtypechange(formGrp.get('itemDiscountType')?.value, i, 'qty');
      this.onItemDiscountChange(
        formGrp.get('itemDiscountApplied')?.value,
        i,
        'type'
      );
    }

    this.grandTotal();
  }

  onItemDiscountChange(event: any, i: number, type: string): void {
    let itemDiscount: number;
    if (!type) {
      // event is HTMLInputElement (v4 inputEvent for %) or string (v4 blurEvent for $)
      const val = event?.value ?? event?.target?.value ?? event ?? '0';
      itemDiscount = parseFloat(String(val).replace(/[$,]/g, '')) || 0;
    } else {
      itemDiscount = parseFloat(String(event ?? '0').replace(/,/g, '')) || 0;
    }

    const formGrp = this.itemFormArray.controls[i] as FormGroup;
    const total = Number(formGrp.get('total')?.value);
    const discountType = Number(formGrp.get('itemDiscountType')?.value);

    if (discountType === 1) {
      const rowTotal = total - itemDiscount;
      formGrp.patchValue({
        itemDiscount: itemDiscount.toFixed(2),
        rowTotal: rowTotal.toFixed(2)
      });
    } else if (discountType === 2) {
      const pct = Math.min(itemDiscount, 100);
      const discountAmt = (pct / 100) * total;
      const rowTotal = total - discountAmt;
      formGrp.patchValue({
        itemDiscountApplied: pct,
        itemDiscount: discountAmt.toFixed(2),
        rowTotal: rowTotal.toFixed(2)
      });
    }

    if (!itemDiscount) {
      formGrp.patchValue({
        itemDiscount: (0).toFixed(2),
        rowTotal: total.toFixed(2)
      });
    }
    this.grandTotal();
  }

  itemtypechange(ev: any, i: 'total' | number, type: string): void {
    let data: string | number;
    if (type === 'qty') {
      data = ev;
    } else if (ev?.target) {
      data = (ev.target as HTMLInputElement).value;
    } else {
      data = ev;
    }
    const discountvalue = data;

    if (i === 'total') {
      this.invoice.patchValue({ discountType: data });
      if (discountvalue === '2' && Number(this.invoice.value.discount) > 100) {
        this.invoice.patchValue({ discount: 100 });
      }
    } else {
      this.discountTypeArray[i as number] = data !== '1';
    }

    if (typeof i === 'number') {
      const formGrp = this.itemFormArray.controls[i] as FormGroup;
      formGrp.patchValue({ itemDiscountType: data });
      const total = Number(this.itemFormArray.value[i]?.total ?? 0);
      const applied = Number(
        this.itemFormArray.value[i]?.itemDiscountApplied ?? 0
      );

      if (discountvalue === '2' && applied >= 100) {
        formGrp.patchValue({
          itemDiscountApplied: 100,
          itemDiscount: total.toFixed(2),
          rowTotal: (0).toFixed(2)
        });
      } else if (discountvalue === '2' && applied < 100) {
        const pct = Math.trunc(applied);
        const discAmt = (pct / 100) * total;
        formGrp.patchValue({
          itemDiscountApplied: pct,
          itemDiscount: discAmt.toFixed(2),
          rowTotal: (total - discAmt).toFixed(2)
        });
      } else if (discountvalue === '1') {
        const rowTotal = total - applied;
        formGrp.patchValue({
          itemDiscount: applied.toFixed(2),
          rowTotal: rowTotal.toFixed(2)
        });
      }
    }
    this.grandTotal();
  }

  Totaldiscountval(ev: any): void {
    const amount = parseFloat(
      String(ev?.value ?? ev?.target?.value ?? '').replace(/,/g, '')
    );
    if (amount > 100 && Number(this.invoice.get('discountType')?.value) === 2) {
      this.invoice.patchValue({ discount: 100 });
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

  // ---------------------- Logo ----------------------

  openLogoModal(): void {
    this.dialog
      .open(WalletLogoUpdateV4ModalComponent, {
        panelClass: 'paddingless-modal-rounded',
        width: '400px',
        disableClose: true,
        data: {
          from: 'invoice',
          existingLogo: this.logoFile,
          existingLogoUrl: this.logoPreviewUrl
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.success && result?.from === 'invoice') {
          this.logoFile = result.file as File;
          if (this.logoFile) {
            if (this.logoPreviewUrl) URL.revokeObjectURL(this.logoPreviewUrl);
            this.logoPreviewUrl = URL.createObjectURL(this.logoFile);
            const reader = new FileReader();
            reader.onload = () => {
              this.invoice.patchValue({ logo: reader.result as string });
              this.alertService.successAlert({
                title: 'Success',
                content: 'Logo updated successfully',
                close: true,
                timeout: 2000
              });
            };
            reader.readAsDataURL(this.logoFile);
          }
        }
      });
  }

  editLogo(event: Event): void {
    event.stopPropagation();
    this.openLogoModal();
  }

  deleteLogo(event: Event): void {
    event.stopPropagation();
    if (this.logoPreviewUrl) {
      this.alertService.successAlert({
        title: 'Success',
        content: 'Logo deleted successfully',
        close: true,
        timeout: 2000
      });
      URL.revokeObjectURL(this.logoPreviewUrl);
    }
    this.logoPreviewUrl = null;
    this.logoFile = null;
    this.invoice.patchValue({ logo: null });
  }

  async handleExistingLogo(logoUrl: string): Promise<void> {
    if (!logoUrl) return;
    this.isLogoLoading.set(true);
    this.logoPreviewUrl = logoUrl;
    try {
      const response = await fetch(logoUrl, {
        mode: 'cors',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const blob = await response.blob();
      let mimeType = blob.type;
      if (!mimeType?.startsWith('image/')) mimeType = 'image/jpeg';
      const fileName = new URL(logoUrl).pathname.split('/').pop() || 'logo.jpg';
      this.logoFile = new File([blob], fileName, {
        type: mimeType,
        lastModified: Date.now()
      });
    } catch {
      this.logoFile = null;
    } finally {
      setTimeout(() => this.isLogoLoading.set(false), 500);
    }
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
    this.itemid = [];
    this.itemRequestId = [];
    this.itemDetailsLoading = [];
    this.selectedItemCache = [];
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
        stock:
          items[i].stock < 0
            ? 0
            : items[i].stock
              ? Number(items[i].stock) + Number(items[i].units)
              : null
      });
      this.discountTypeArray[i] = String(items[i].discountType) !== '1';
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
    this.taxAmount = parseFloat(d.totalTax || '0');
    this.onSelectTax(d.taxId);
    if (d.logoUrl || d.logo)
      this.handleExistingLogo(d.logoUrl || (d.logo as string));

    this.invoice.patchValue({
      bankAccountId: d.bankAccount.bankAccountId,
      payeeId: d.payee.payeeId,
      invoiceCategory: d.category.categoryId,
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
      invoiceGrandTotal: d.grandTotal
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
    if (d.logoUrl || d.logo)
      this.handleExistingLogo(d.logoUrl || (d.logo as string));

    this.invoice.patchValue({
      bankAccountId: d.bankAccount.bankAccountId,
      payeeId: d.payee.payeeId,
      invoiceCategory: d.category.categoryId,
      discount: Number(d.discount),
      discountType: d.discountType,
      InvoiceNo: d.invoiceNo,
      Date: newDate,
      DueDate: dueDate,
      poNo: d.poNo,
      accountNumber: d.accountNumber,
      note: d.note,
      memo: d.memo,
      creditMemoApplied: d.creditMemoApplied
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
      logo: datas.logo ?? ''
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

  SaveEmail(type: 'mail' | 'email' | 'paylink'): void {
    this.isSendMenuOpen.set(false);
    if (!this.validateForm()) return;
    this.syncTotals();
    if (this.isSending()) return;
    this.isSending.set(true);

    // "Pay by link" needs a payable link on the selected bank account before the
    // invoice is created — otherwise the emailed link would resolve to nothing.
    if (type === 'paylink') {
      this.ensurePaymentLink(this.invoice.get('bankAccountId')?.value)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((hasLink) => {
          if (!hasLink) {
            this.isSending.set(false);
            return;
          }
          this.createAndSend(type);
        });
      return;
    }

    this.createAndSend(type);
  }

  /**
   * Creates the invoice, then opens the matching send modal for the chosen
   * option. Assumes the form has already been validated and totals synced.
   */
  private createAndSend(type: 'mail' | 'email' | 'paylink'): void {
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
                      data:
                        type === 'paylink'
                          ? { ...this.maildata, isPayByLink: true }
                          : this.maildata
                    });
              modalRef
                .afterClosed()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => this.alertService.successAlert());
            });
        }
      });
  }

  // ---------------------- Payment Link ----------------------

  /**
   * Resolves to true when the bank account already has a payable link, or when
   * the user generates one through the prompt. Resolves to false when the link
   * is missing and the user backs out.
   */
  private ensurePaymentLink(bankAccountId: string): Observable<boolean> {
    if (!bankAccountId) return of(false);

    return this.hasPaymentLink(bankAccountId).pipe(
      switchMap((result) => {
        if (result.hasLink) return of(true);
        if (!result.isMissing) return of(false);
        return this.promptGeneratePaymentLink(bankAccountId);
      })
    );
  }

  /**
   * Calls `/bank-accounts/{id}/payment-links`. Error code 110 means the account
   * simply has no link yet — any other failure is treated as "cannot continue".
   */
  private hasPaymentLink(
    bankAccountId: string
  ): Observable<{ hasLink: boolean; isMissing: boolean }> {
    const headers = new HttpHeaders().set('disablePermission', 'true');
    return this.bankService.qetQrCode(bankAccountId, headers).pipe(
      map((res) => ({
        hasLink: !!res?.success && !!res?.data?.length,
        isMissing: false
      })),
      catchError((err) =>
        of({ hasLink: false, isMissing: err?.error?.errorCode === 110 })
      )
    );
  }

  /** Confirms, opens the create-link modal, then re-checks the account once. */
  private promptGeneratePaymentLink(
    bankAccountId: string
  ): Observable<boolean> {
    return this.alertService
      .confirmAlert({
        title: 'Link not found !',
        content: 'Please add a payment link to the bank account',
        doneMsg: 'Generate a link',
        cancelMsg: 'No, cancel'
      })
      .afterClosed()
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) return of(false);
          return this.dialog
            .open(V4PaymentLinksCreateComponent, {
              data: { selectedBankId: bankAccountId },
              panelClass: 'paddingless-modal-rounded',
              width: '600px'
            })
            .afterClosed()
            .pipe(
              switchMap((created) =>
                created?.success
                  ? this.hasPaymentLink(bankAccountId).pipe(
                      map((result) => result.hasLink)
                    )
                  : of(false)
              )
            );
        })
      );
  }

  close(): void {
    this.dialogRef.close();
  }
}
