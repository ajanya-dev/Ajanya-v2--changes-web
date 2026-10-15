/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl,
  FormControl
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import {
  ICreatedExistingAtachments,
  IInvoiceDropdown,
  IMailData,
  INewInvoice,
  IEvent,
  ItaxList,
  INumberOnlyEvent,
  IOpenAttachmentModalData,
  IAddInvoiceDialog
} from 'src/app/modules/invoices/model/invoice';
import { Observable, Subscription, finalize, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddInvoiceItemComponent } from 'src/app/shared/modal/invoice-modal/add-invoice-item/add-invoice-item.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { IPayeeDropdown, IShowPayeeDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/document-mail-modal/document-mail-modal.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskDirective } from 'ngx-mask';
import { faImage, faPaperclip, faPlus, faTrash, faXmark, faPencil, faCaretDown, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { WalletLogoUpdateModalComponent } from 'src/app/modules/wallet/wallet-v3/components-V35/wallet-logo-update-modal/wallet-logo-update-modal.component';
import { GetPaidByLinkComponent } from 'src/app/modules/payment-link/pages/get-paid-by-link/get-paid-by-link.component';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { HttpHeaders } from '@angular/common/http';
import { EmailSmsComponent } from '../email-sms/email-sms.component';
import { AddInvoiceTaxComponent } from '../add-invoice-tax/add-invoice-tax.component';
import { V35CommonDropDownSelectorComponent } from '../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { CategoryDropdownV3Component } from '../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { BankAcDropdownV3Component } from '../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonInputFieldComponent } from '../../../../shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from '../../../../shared/v3/control-message-v35/control-message-v35.component';

/**
 * Represents the Add Invoice Component.
 */
@Component({
  selector: 'app-add-invoice',
  templateUrl: './add-invoice.component.html',
  styleUrls: ['./add-invoice.component.scss'],
  providers: [DatePipe],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    BankAcDropdownV3Component,
    PayeeDropdownV3Component,
    CategoryDropdownV3Component,
    NgxMaskDirective,
    AmountInputComponent,
    V35CommonDropDownSelectorComponent,
    MatMenuTrigger,
    FaIconComponent,
    MatMenu,
    MatMenuItem,
    MatTooltipModule,
    CurrencyPipe,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent
  ]
})
export class AddInvoiceComponent implements OnInit, OnDestroy {
  invoice!: UntypedFormGroup;

  subscriptions: Subscription[] = [];

  subTotal = 0;
  discount: number | string;
  tax = 0;
  totalInvoice = 0;
  credits: number | string;
  grandtotal = 0;
  taxAmount = 0;
  taxAmountPer = 0;
  itemDiscount: string | number = 0;
  discount_type = 0;
  addInvoiceProcessing = false;
  utils = Utils;

  payee = ['asdfa', 'cvb', 'sdafasdf'];
  invoiceitemList: IInvoiceDropdown[] = [];
  filteredInvoiceItems: IInvoiceDropdown[] = [];
  bpage = 1;
  ppage = 1;
  Ipage = 1;
  searchTerm: string;
  createdBankId: string;
  createpayeeId: string;
  createcategoryId: string;
  creditbalance: string;
  typingAllowed: boolean = true;
  itemName: string[] = [];
  itemName1: string[] = [];
  itemValues: string[] = [];
  selectedItemValues: string[] = [];
  selectedTax: ItaxList | null = null;
  selectedTaxId: string = '';
  editMode = false;
  Applycredit = false;
  taxList: ItaxList[] = [];
  taxName: string;
  maildata: IMailData;
  ids: string;
  discountvalue: string | number;
  itemid: string[] = [];
  itemRequestId: string[] = [];
  itemDetailsLoading: boolean[] = [];
  selectitem: string[] = [];
  createdExistingAttachments: ICreatedExistingAtachments[] = [];
  clone = false;
  creditmemoId: string;
  isSending = signal(false);
  isV3 = false;
  discountTypeArray: boolean[] = [];
  faPlus = faPlus;
  faXmark = faXmark;
  faTrash = faTrash;
  faPaperclip = faPaperclip;
  faImage = faImage;
  faPencil = faPencil;
  faCaretDown = faCaretDown;
  faCircleInfo = faCircleInfo;
  firstInvoiceItemPage: IInvoiceDropdown[] = [];
  prevoiusSelectedPayeeId: string;
  isShowDropDown = false;
  isChangeItem = false;
  logoPreviewUrl: string | null = null;
  logoFile: File | null = null;
  isLogoLoading = signal<boolean>(false);

  @ViewChildren('itemDropdown') dropDownComponents: QueryList<V35CommonDropDownSelectorComponent>;

  public dialog = inject(MatDialog);
  public datas: IAddInvoiceDialog = inject(MAT_DIALOG_DATA);
  private payeeService = inject(PayeeService);
  private datePipe = inject(DatePipe);
  private sharedService = inject(SharedService);
  private invoiceService = inject(InvoiceService);
  public dialogRef = inject(MatDialogRef<AddInvoiceComponent>);
  private alert = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private scriptService = inject(ScriptService);
  private bankModalService = inject(BankModalService);
  private fb = inject(UntypedFormBuilder);
  private payeeModalService = inject(PayeeModalService);
  private bankService = inject(BankService);

  selectedBankAccount: FormControl<IBankDropdown | null> = new FormControl();
  selectedPayee: FormControl<IPayeeDropdown | null> = new FormControl();
  selectedCategory: FormControl<ICategoryDropdown | null> = new FormControl();
  categoryReady?: IV3DropDownOnReady;

  /**
   * Initializes the Add Invoice Component.
   */
  ngOnInit() {
    this.initFormGroup();
    this.loadTaxData();
    this.loadItemData();
    this.setCreditData();
    this.setCloneData();
    if (this.datas?.isV3) {
      this.isV3 = true;
      return;
    }

    if (this.datas) {
      this.ids = this.datas.data?.invoiceId;
      this.creditmemoId =
        this.datas.data?.creditMemoDetails?.applied_amount?.[0]?.payment;
    }
    this.dropdownChanges();
  }

  dropdownChanges() {
    this.subscriptions.push(
    this.selectedBankAccount.valueChanges.subscribe((bankAccount: IBankDropdown | null) => {
      if(bankAccount && bankAccount.id !==this.invoice.get('bankAccountId')?.value) {
        this.onSelectBank(bankAccount);
      }
    }),
    this.selectedCategory.valueChanges.subscribe((category: ICategoryDropdown | null) => {
      if(category && category.id !== this.invoice.get('invoiceCategory')?.value) {
        this.onSelectCategory(category);
      } else if (!category) {
        this.invoice.patchValue({ invoiceCategory: '' });
      }
    }),
    this.selectedPayee.valueChanges.subscribe((payee: IPayeeDropdown | null) => {
      if(payee && payee.id !== this.invoice.get('payeeId')?.value) {
        this.onSelectPayee(payee);
      }
    })
  );
  }

  autoPopulateDropdown(event: IV3DropDownOnReady, id: string) {
    if(event?.setItemWithId && id) {
      event.setItemWithId(id);
    }
  }


  /**
   * Handles the bank selection event.
   *
   * @param {Object} event - The bank selection event.
   */
  onSelectBank(event: IBankDropdown) {
    this.isLogoLoading.set(true);
    this.logoPreviewUrl = null;
    this.logoFile = null;
    if (event?.id !== undefined) {
      this.invoice.patchValue({
        bankAccountId: event.id
      });

      if (this.selectedBankAccount.value?.id !== event.id) {
        this.selectedBankAccount.setValue(event);
      }

      this.subscriptions.push(
        this.invoiceService.getInvoiceNo(event?.id)
        .pipe(finalize(() => this.isLogoLoading.set(false)))
        .subscribe((res) => {
          //  res.data.invoiceNo;
          this.invoice.patchValue({
            InvoiceNo: res.data.lastInvoiceNo
          });
          if (res.data.logoUrl) {
            this.handleExistingLogo(res.data.logoUrl);
          }
        })
      );

      /** ********* get credit */

      const cdata = {
        payeeId: '',
        bankAccountId: ''
      };

      cdata.payeeId = this.invoice?.get('payeeId')?.value;
      cdata.bankAccountId = event?.id;

      if (cdata?.payeeId !== '') {
        this.subscriptions.push(
          this.invoiceService.getCreditBalance(cdata).subscribe((res) => {
            this.creditbalance = res.data.availableCreditMemo;
            this.invoice.patchValue({
              creditmemo: res.data.availableCreditMemo
            });
          })
        );
      }
    }
  }

  onClearBankAccount() {
    this.selectedBankAccount.setValue(null);
    this.invoice.patchValue({
      bankAccountId: ''
    });
  }

  onClearPayee(){
    this.selectedPayee.setValue(null);
    this.invoice.patchValue({
      payeeId: ''
    });

    // Clear all selected items when payee is cleared
    const invoiceItemsArray = this.getFormControls('item') as UntypedFormArray;
    invoiceItemsArray.controls.forEach((formGroup: AbstractControl, index: number) => {
      (formGroup as UntypedFormGroup).get('item')?.setValue('');
      this.itemName[index] = '';
      this.itemValues[index] = '';
      this.itemRequestId[index] = '';
      this.itemDetailsLoading[index] = false;
    });

    // Clear selected item values and refresh filtered items
    this.selectedItemValues = [];
    this.refreshFilteredItems();
  }

  /**
   * Handles the date picker date change event.
   *
   * @param {Object} event - The date picker date change event.
   */
  datepickerdate(event: IEvent) {
    const newDate = this.datePipe.transform(event.target.value, 'yyyy-MM-dd');
    if (newDate !== null) {
      this.invoice.get('Date')?.setValue(newDate);
      const afterTenDays = new Date(newDate);
      afterTenDays.setDate(afterTenDays.getDate() + 10);
      const duedate = this.datePipe.transform(afterTenDays, 'yyyy-MM-dd');
      this.invoice.patchValue({
        DueDate: duedate
      });
    }
  }

  /**
   * Handles the payee selection event.
   *
   * @param {Object} event - The payee selection event.
   * @param {string} type - The type of payee selection.
   */
  onSelectPayee(event: IPayeeDropdown | null | undefined | 'add-new') {
    if (event === undefined || event === null || event === 'add-new') {
      this.invoice.patchValue({
        payeeId: ''
      });
      this.selectedPayee.setValue(null);
      return;
    }

    this.invoice.patchValue({
      payeeId: event?.id
    });

    if (this.selectedPayee.value?.id !== event?.id) {
      this.selectedPayee.setValue(event);
    }

    const previousSelectedPayeeId = this.invoice.get('payeeId')?.value;
    const newPayeeId = event?.id;

    const invoiceItemsArray = this.getFormControls('item') as UntypedFormArray;

    // Check if form array exists and has items with rule
    const hasItemsWithRule = invoiceItemsArray?.controls?.some(
      (formGroup: AbstractControl) => {
        const ruleId = formGroup.get('ruleId')?.value;
        return ruleId !== '' && ruleId !== null;
      }
    );

    if (!hasItemsWithRule || event.id === previousSelectedPayeeId) {
      this.updatePayeeAndFetchDetails(newPayeeId);
      return;
    }

    // Show confirmation dialog if items with rule
    if (event.id !== previousSelectedPayeeId) {
      this.resetItemForm(newPayeeId, previousSelectedPayeeId);
    }
  }

  resetItemForm(newPayeeId: string, previousSelectedPayeeId: string) {
    const alert = this.alert.infoAlert({
      content:
        'If you update an existing payee, any previously applied rules associated with specific items will be reset. Do you wish to proceed with this reset?',
      doneMsg: 'Reset',
      isCancel: true
    });

    alert.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        // Reset items with rule
        const invoiceItemsArray = this.getFormControls(
          'item'
        ) as UntypedFormArray;

        invoiceItemsArray.controls.forEach(
          (formGroup: AbstractControl, index: number) => {
            const ruleId = formGroup.get('ruleId')?.value;
            if (ruleId !== '' && ruleId !== null) {
              (formGroup as UntypedFormGroup).reset();
              this.itemName[index] = '';
              this.itemid[index] = '';
              this.itemValues[index] = '';
              this.itemRequestId[index] = '';
              this.itemDetailsLoading[index] = false;
              const dropdownArray = this.dropDownComponents.toArray();
              if (dropdownArray[index]) {
                dropdownArray[index].clearSelection();
              }
            }
          }
        );
        this.refreshFilteredItems();
        // Update payee and fetch details
        this.updatePayeeAndFetchDetails(newPayeeId);
      } else {
        // Restore previous payee ID if user cancels
        this.invoice.patchValue({
          payeeId: previousSelectedPayeeId
        });
        this.prevoiusSelectedPayeeId = this.invoice.get('payeeId')?.value;
      }
    });
  }

  private updatePayeeAndFetchDetails(payeeId: string): void {
    // Update payee ID
    this.invoice.patchValue({
      payeeId
    });

    // Fetch payee details
    this.subscriptions.push(
      this.payeeService.showPayee(payeeId).subscribe((res) => {
        const payeeDetails: IShowPayeeDetails = res.data;
        this.invoice.patchValue({
          accountNumber: payeeDetails.invoice_account_number ?? '',
          poNo: payeeDetails.invoice_po_no ?? ''
        });

        if (!this.editMode) {
          this.invoice.patchValue({
            invoiceCategory: payeeDetails.invoice_category
          });
          if (payeeDetails.invoice_category) {
            this.categoryReady?.setItemWithId?.(payeeDetails.invoice_category);
          } else {
            this.selectedCategory.setValue(null);
          }
        }
      })
    );

    // Get credit balance
    this.getCreditBalance();
  }

  /**
   * Retrieves the credit balance for the selected bank and payee.
   */
  getCreditBalance() {
    const cdata = {
      payeeId: '',
      bankAccountId: ''
    };

    cdata.payeeId = this.invoice.get('payeeId')?.value;
    cdata.bankAccountId = this.invoice.get('bankAccountId')?.value;

    if (cdata.bankAccountId !== '') {
      this.subscriptions.push(
        this.invoiceService.getCreditBalance(cdata).subscribe((res) => {
          this.creditbalance = res.data.availableCreditMemo;
          this.invoice.patchValue({
            creditmemo: res.data.availableCreditMemo
          });
        })
      );
    }
  }
  /** ********** End Get Credit  */

  /**
   * Handles the category selection event.
   *
   * @param {Object} event - The category selection event.
   */
  onSelectCategory(event: ICategoryDropdown) {
    this.invoice.patchValue({
      invoiceCategory: event.id
    });

    if (this.selectedCategory.value?.id !== event.id) {
      this.selectedCategory.setValue(event);
    }
  }

  /**
   * Handles the invoice selection event.
   *
   * @param {Object} event - The invoice selection event.
   * @param {number} i - The index of the selected invoice item.
   */
  onSelectInvoice(event: { id: string }, i: number) {
    const { id } = event;
    this.subscriptions.push(
      this.invoiceService.getSingleInvoiceItem(id).subscribe((res) => {
        const invoiceitem = res.data;

        const invoiceType = this.getFormControls('item') as UntypedFormArray;
        const formGrp = invoiceType.controls[i] as UntypedFormGroup;
        formGrp.get('cost')?.setValue(invoiceitem.unitPrice);
        formGrp.get('item')?.setValue(invoiceitem.id);
        formGrp.get('stock')?.setValue(invoiceitem.stock);
      })
    );
  }

  /**
   * Handles the tax selection event.
   *
   * @param {string} event - The selected tax event.
   */
  onSelectTax(event: string) {
    if (event === 'add-new') {
      return; // let app-v35 emit buttonClick and openModal
    }
    // Update selectedTaxId to reflect the selection
    this.selectedTaxId = event;
    
    if (event) {
      this.subscriptions.push(
        this.invoiceService.getSingleTaxData(event).subscribe((res) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          this.subTotal - this.onDiscountChange();
          this.taxAmountPer = res.data.taxPercentage;

          this.taxName = res.data.taxName;
          this.invoice.patchValue({
            invoiceTaxId: res.data.id
            // invoiceTaxTotal: this.taxAmountPer,
          });
        })
      );
    } else if (event === undefined) {
      this.invoice.patchValue({
        invoiceTaxId: '',
        invoiceTaxTotal: ''
      });
      this.taxAmountPer = 0.0;
      this.taxName = '';
    } else {
      this.invoice.patchValue({
        invoiceTaxId: '',
        invoiceTaxTotal: ''
      });
      this.taxName = '';
    }
  }

  /**
   * Set the form data when cloning an invoice.
   */
  setCloneData() {
    if (this.datas?.isClone) {
      if (this.datas.data !== null) {
        this.subscriptions.push(
          this.invoiceService
            .getInvoiceNo(this.datas.data.bankAccount.bankAccountId)
            .subscribe((res) => {
              const a = res.data.lastInvoiceNo;
              this.invoice.patchValue({
                InvoiceNo: a
              });
            })
        );

        this.clone = true;
        this.editMode = false;

        const newDate = this.datePipe.transform(
          this.datas.data.invoiceDate,
          'yyyy-MM-dd'
        );
        const dueDate = this.datePipe.transform(
          this.datas.data.dueDate,
          'yyyy-MM-dd'
        );

        this.selectedTaxId = this.datas.data.taxId;
        this.onSelectTax(this.datas.data.taxId);

        // Handle logo for clone mode
        if (this.datas?.data?.logo || this.datas?.data?.logoUrl) {
          const logoUrl = this.datas?.data?.logoUrl || this.datas?.data?.logo as string;
          this.handleExistingLogo(logoUrl);
        }

        if (this.datas.data.bankAccount) {
          if (this.datas.data.bankAccount.bankAccountNickName) {
            this.sharedService.setNewBankCreatedData({
              bankAccountNickName:
                this.datas.data.bankAccount.bankAccountNickName
            });
          } else {
            this.sharedService.setNewBankCreatedData({
              bankAccountNickName: this.datas.data.bankAccount.bankAccountName
            });
          }
        } else {
          this.sharedService.setNewBankCreatedData('');
        }

        this.sharedService.setNewPayeeCreatedData(
          this.datas.data.payee.payeeName
            ? { payeeName: this.datas.data.payee.payeeName }
            : ''
        );
        this.sharedService.setNewCategoryCreatedData(
          this.datas.data.category.categoryId
            ? { categoryId: this.datas.data.category.categoryId }
            : ''
        );

        this.invoice.patchValue({
          bankAccountId: this.datas.data.bankAccount.bankAccountId,
          payeeId: this.datas.data.payee.payeeId,
          invoiceCategory: this.datas.data.category.categoryId,
          discount: Number(this.datas.data.discount),
          discountType: this.datas.data.discountType,
          InvoiceNo: this.datas.data.invoiceNo,
          Date: newDate,
          DueDate: dueDate,
          poNo: this.datas.data.poNo,
          accountNumber: this.datas.data.accountNumber,
          note: this.datas.data.note,
          memo: this.datas.data.memo,
          invoiceTaxId: this.datas.data.taxId,
          creditmemo: this.datas.data.creditmemo,
          creditMemoApplied: this.datas.data.creditMemoApplied,
          creditMemo: this.datas.data.creditMemoApplied,
          totalTotal: this.datas.data.total,
          discountTotal: this.datas.data.discount,
          invoiceTaxTotal: this.datas.data.totalTax,
          invoiceTotal: this.datas.data.invoicetotal,
          invoiceGrandTotal: this.datas.data.grandTotal,
          creditMemoNo: this.datas.data.creditMemoNo
        });

        const invoiceType = this.getFormControls('item') as UntypedFormArray;
        invoiceType.clear();
        this.itemValues = [];
        this.itemName = [];
        this.itemName1 = [];

        for (let i = 0; i < this.datas.data.items.length; i += 1) {
          invoiceType.push(this.createCreditMemoCtrl());
          const formGrp = invoiceType.controls[i] as UntypedFormGroup;
          this.totalInvoice = this.datas.data.amount;
          this.grandtotal = this.datas.data.grandTotal;
          this.itemName.push(this.datas.data.items[i].itemName);
          this.itemValues.push(this.datas.data.items[i].itemId);

          formGrp.get('cost')?.setValue(this.datas.data.items[i].unitPrice);
          formGrp.get('item')?.setValue(this.datas.data.items[i].itemId);
          formGrp.get('description')?.setValue(this.datas.data.items[i].note);
          formGrp.get('qty')?.setValue(this.datas.data.items[i].units);
          formGrp.get('total')?.setValue(this.datas.data.items[i].total);
          formGrp.get('rowTotal')?.setValue(this.datas.data.items[i].itemTotal);
          formGrp
            .get('stock')
            ?.setValue(
              this.datas.data.items[i].stock +
                Number(this.datas.data.items[i].units)
            );
          formGrp
            .get('itemDiscountApplied')
            ?.setValue(this.datas.data.items[i].discountApplied);
          formGrp
            .get('itemDiscount')
            ?.setValue(this.datas.data.items[i].discountAmount);
          formGrp
            .get('itemDiscountType')
            ?.setValue(this.datas.data.items[i].discountType);
        }
        this.onSelectPayee({ id: this.datas.data.payee.payeeId, name: this.datas.data.payee.payeeName });
      }
    }
  }

  /**
   * Set the form data when editing a credit memo.
   */
  setCreditData() {
    if (this.datas?.isClone === false) {
      if (this.datas.data !== null) {
        this.editMode = true;

        const newDate = this.datePipe.transform(
          this.datas.data.invoiceDate,
          'yyyy-MM-dd'
        );
        const dueDate = this.datePipe.transform(
          this.datas.data.dueDate,
          'yyyy-MM-dd'
        );

        this.selectedTaxId = this.datas.data.taxId;
        this.onSelectTax(this.datas.data.taxId);

        // Handle logo for edit mode
        if (this.datas?.data?.logo || this.datas?.data?.logoUrl) {
          const logoUrl = this.datas?.data?.logoUrl || this.datas?.data?.logo as string;
          this.handleExistingLogo(logoUrl);
        }

        if (this.datas.data.bankAccount) {
          if (this.datas.data.bankAccount.bankAccountNickName) {
            this.sharedService.setNewBankCreatedData({
              bankAccountNickName:
                this.datas.data.bankAccount.bankAccountNickName
            });
          } else {
            this.sharedService.setNewBankCreatedData({
              bankAccountNickName: this.datas.data.bankAccount.bankAccountName
            });
          }
        } else {
          this.sharedService.setNewBankCreatedData('');
        }

        this.sharedService.setNewPayeeCreatedData(
          this.datas.data.payee.payeeName
            ? { payeeName: this.datas.data.payee.payeeName }
            : ''
        );

        this.sharedService.setNewCategoryCreatedData(
          this.datas.data.category.categoryName
            ? { categoryName: this.datas.data.category.categoryName }
            : ''
        );

        const discount =
          this.datas.data.discount != null
            ? parseFloat(this.datas.data.discount.replace(/,/g, ''))
            : 0;

        this.invoice.patchValue({
          bankAccountId: this.datas.data.bankAccount.bankAccountId,
          payeeId: this.datas.data.payee.payeeId,
          invoiceCategory: this.datas.data.category.categoryId,
          discount: Number(discount),
          discountType: this.datas.data.discountType,
          InvoiceNo: this.datas.data.invoiceNo,
          Date: newDate,
          DueDate: dueDate,
          poNo: this.datas.data.poNo,
          accountNumber: this.datas.data.accountNumber,
          note: this.datas.data.note,
          memo: this.datas.data.memo,
          invoiceTaxId: this.datas.data.taxId ? this.datas.data.taxId : '',
          creditmemo: this.datas.data.creditmemo,
          creditMemoApplied: this.datas.data.creditMemoApplied,
          creditMemo: this.datas.data.creditMemoApplied,
          totalTotal: this.datas.data.total,
          discountTotal: discount,
          invoiceTaxTotal: this.datas.data.totalTax,
          invoiceTotal: this.datas.data.invoicetotal,
          invoiceGrandTotal: this.datas.data.grandTotal,
          creditMemoNo: this.datas.data.creditMemoNo
        });
        // Clear arrays ONCE before the loop
        const invoiceType = this.getFormControls('item') as UntypedFormArray;
        invoiceType.clear();
        this.itemValues = [];
        this.itemName = [];
        this.itemName1 = [];

        for (let i = 0; i < this.datas.data.items.length; i += 1) {
          invoiceType.push(this.createCreditMemoCtrl());
          const formGrp = invoiceType.controls[i] as UntypedFormGroup;
          this.totalInvoice = this.datas.data.amount;
          this.grandtotal = this.datas.data.grandTotal;
          this.itemName.push(this.datas.data.items[i].itemName);
          this.itemName1.push(this.datas.data.items[i].itemId);
          this.itemValues.push(this.datas.data.items[i].itemId);

          formGrp.get('cost')?.setValue(this.datas.data.items[i].unitPrice);
          formGrp.get('item')?.setValue(this.datas.data.items[i].itemId);
          formGrp.get('description')?.setValue(this.datas.data.items[i].note);
          formGrp.get('qty')?.setValue(this.datas.data.items[i].units);
          formGrp.get('total')?.setValue(this.datas.data.items[i].total);
          formGrp.get('rowTotal')?.setValue(this.datas.data.items[i].itemTotal);
          formGrp.get('ruleId')?.setValue(this.datas.data.items[i].ruleId);
          if (this.datas.data.items[i].stock) {
            formGrp
              .get('stock')
              ?.setValue(
                this.datas.data.items[i].stock +
                  Number(this.datas.data.items[i].units)
              );
          }
          if (this.datas.data.items[i].stock < 0) {
            formGrp
              .get('stock')
              ?.setValue((this.datas.data.items[i].stock = 0));
          }
          formGrp
            .get('itemDiscountApplied')
            ?.setValue(this.datas.data.items[i].discountApplied);
          formGrp
            .get('itemDiscount')
            ?.setValue(this.datas.data.items[i].discountAmount);
          formGrp
            .get('itemDiscountType')
            ?.setValue(this.datas.data.items[i].discountType);
        }
        this.onSelectPayee({ id: this.datas.data.payee.payeeId, name: this.datas.data.payee.payeeName });
      }
    }
  }
  //* ******************************************** initFormGroup ******************************** */

  /**
   * Initialize the form group for the invoice.
   */
  initFormGroup() {
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
      item: this.fb.array([this.createCreditMemoCtrl()]),
      logo: [null]
    });

    // Initialize the first item value
    this.itemValues[0] = '';
    this.itemName[0] = '';

    const newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    if (newDate !== null) {
      this.invoice.get('Date')?.setValue(newDate);

      const afterTenDays = new Date(newDate);
      afterTenDays.setDate(afterTenDays.getDate() + 10);
      const duedate = this.datePipe.transform(afterTenDays, 'yyyy-MM-dd');
      this.invoice.patchValue({
        DueDate: duedate
      });
    }
  }

  //* ******************************************** Create CreditMemo ctrl ******************************** */

  /**
   * Create a form group for a credit memo.
   * @returns {UntypedFormGroup} The created credit memo form group.
   */
  createCreditMemoCtrl(): UntypedFormGroup {
    return this.fb.group({
      item: [''],
      description: [''],
      qty: [''],
      cost: [''],
      itemDiscount: [''],
      itemDiscountType: [1],
      itemDiscountApplied: [],
      total: [''],
      rowTotal: [''],
      stock: [''],
      ruleId: ['']
    });
  }

  /**
   * Create the request body for a new invoice.
   * @returns {INewInvoice} The request body for the new invoice.
   */
  createCreditMemobody(): INewInvoice {
    const datas = this.invoice.value;
    const newDate = this.datePipe.transform(datas.Date, 'MM/dd/yyyy');
    const dueDate = this.datePipe.transform(datas.DueDate, 'MM/dd/yyyy');

    return {
      bankAccountId: datas.bankAccountId,
      hiddenPayee: datas.payeeId,
      invoiceCategory: datas.invoiceCategory,
      discount: datas.discount,
      discountType: datas.discountType,
      invoiceNo: datas.InvoiceNo,
      date: newDate,
      dueDate,
      poNo: datas.poNo,
      accountNumber: datas.accountNumber,
      privateNote: datas.note,
      memo: datas.memo,
      invoiceTaxId: datas.invoiceTaxId,
      creditmemo: datas.creditmemo,
      creditMemoApplied: datas.creditMemoApplied,
      creditMemo: datas.creditMemoApplied,
      totalTotal: datas.totalTotal,
      discountTotal: datas.discountApplied,
      taxTotal: datas.invoiceTaxTotal,
      invoiceTotal: datas.invoiceTotal,
      grandTotal: datas.invoiceGrandTotal,
      creditMemoNo: datas.creditMemoNo,
      allAttachments: this.createdExistingAttachments.map(
        (e) => e.encrypted_id
      ),
      item: this.getFormControl().value,
      logo: datas.logo ?? ''
    };
  }

  //* ***************************delete applied credits */

  /**
   * Delete an applied credit memo from the invoice.
   * @param {string} creditmemoId - The ID of the credit memo to be deleted.
   * @param {string} id - The ID of the invoice.
   */
  deleteApplied(creditmemoId: string, id: string) {
    const data = {
      paymentId: creditmemoId,
      invoiceId: id
    };
    this.subscriptions.push(
      this.invoiceService.deleteAppliedCredit(data).subscribe((res) => {
        if (res) {
          this.invoice.get('creditMemoApplied')?.setValue('');
          this.getCreditBalance();
        }
      })
    );
  }

  /**
   * Get the form control for the 'item' array in the invoice form.
   * @returns {UntypedFormArray} The form control for the 'item' array.
   */
  getFormControl() {
    return this.invoice.get('item') as UntypedFormArray;
  }

  /**
   * Get the form controls by name in the invoice form.
   * @param {string} name - The name of the form control to retrieve.
   */
  getFormControls(name: string) {
    return this.invoice.get(name);
  }

  /**
   * Get the value of the 'item' array in the invoice form.
   */
  getFormValue() {
    return this.invoice.get('item')?.value;
  }

  /**
   * Get the user form groups from the invoice form.
   * @returns {UntypedFormArray} The user form groups within the 'item' array.
   */
  get userFormGroups() {
    return this.invoice.get('item') as UntypedFormArray;
  }

  //* ************************************ Add Row *********************************** */

  /**
   * Add a new row (credit memo) to the invoice form.
   */
  addNewRow() {
    const payeeId = this.invoice.get('payeeId')?.value;
    if(!payeeId){
      this.alert.warningAlert({ 
        content: 'Please select a payee first before choosing an item.' 
      });
      return;
    }
    const additem = this.invoice.get('item') as UntypedFormArray;
    const newIndex = additem.length;

    additem.push(this.createCreditMemoCtrl());
    
    // Initialize the new item value
    this.itemValues[newIndex] = '';
    this.itemName[newIndex] = '';
    this.itemRequestId[newIndex] = '';
    this.itemDetailsLoading[newIndex] = false;
    
    this.Ipage = 1;
    this.invoiceitemList = this.firstInvoiceItemPage;
    this.refreshFilteredItems();
  }

  //* ************************************ Remove Row *********************************** */

  /**
   * Remove a row from the invoice form.
   * @param {number} i - The index of the row to be removed.
   * @param {IEvent} event - The event containing row data.
   */
  removeRow(i: number, event: IEvent) {
    this.itemName.splice(i, 1);
    this.itemValues.splice(i, 1);
    this.itemRequestId.splice(i, 1);
    this.itemDetailsLoading.splice(i, 1);
    const id = event.controls.item.value as string;

    this.itemid.forEach((element, j) => {
      if (element === id) {
        this.itemid.splice(j, 1);
      }
    });

    const removeitem = this.invoice.get('item') as UntypedFormArray;
    const total = removeitem.length;

    if (total > 1) {
      removeitem.removeAt(i);
    }

    if (this.itemName1) {
      this.itemid = this.itemName1;
    }
    this.refreshFilteredItems();
    this.grandTotal();
  }

  // ******************** number only function in text  ********************* //

  /**
   * Allow only numbers in the quantity input field.
   * @param {INumberOnlyEvent} event - The number input event.
   * @returns {boolean} - True if the input is a number, false otherwise.
   */
  numberOnlyQty(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * Allow only numbers in the invoice input field.
   * @param {INumberOnlyEvent} event - The number input event.
   * @returns {boolean} - True if the input is a number, false otherwise.
   */
  numberOnlyinvoice(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 96) {
      return false;
    }
    return true;
  }

  //* ************************************ Calculate *********************************** */

  /**
   * Calculate the subtotal of the invoice.
   * @returns {number} - The subtotal amount.
   */
  subtotal(): number {
    this.subTotal = 0;

    const payType = this.getFormControl() as UntypedFormArray;
    payType.controls.forEach((formGrp) => {
      this.subTotal += Number(formGrp.get('rowTotal')?.value);
      this.invoice.get('totalTotal')?.setValue(this.subTotal);
    });

    return this.subTotal;
  }

  /**
   * Calculate the total amount of the invoice.
   * @returns {number} - The total amount.
   */
  invoiceTotal(): number {
    const invtotal = this.subtotal() - Number(this.discount);
    this.totalInvoice = Number(invtotal) + Number(this.taxAmount);
    this.invoice.get('invoiceTotal')?.setValue(this.totalInvoice);

    return this.totalInvoice;
  }

  /**
   * Handle changes in the credit memo applied amount.
   */
  creditapplied(): void {
    const cdata = this.invoice.get('creditMemoApplied')?.value;

    if (cdata) {
      this.credits = cdata;
      this.invoice.get('creditMemoApplied')?.setValue(this.credits);
      this.grandTotal();
    } else {
      this.credits = '';
      this.invoice.get('creditMemoApplied')?.setValue('');
      this.grandTotal();
    }
  }

  /**
   * Calculate the grand total of the invoice.
   * @returns {number} - The grand total amount.
   */
  grandTotal(): number {
    this.grandtotal =
      Number(this.invoiceTotal()) -
      Number(this.invoice.get('creditMemoApplied')?.value);
    this.invoice.get('invoiceGrandTotal')?.setValue(this.grandtotal);
    return this.grandtotal;
  }

  //* ************************************ Save Invoice *********************************** */

  /**
   * Handle changes in the discount amount and type.
   * @returns {number} - The discount amount.
   */
  onDiscountChange(): number {
    const itemDiscount = this.getFormControls('discount')?.value;
    const itemDiscountType = this.getFormControls('discountType')?.value;
    const DiscountAmount = this.subTotal - itemDiscount;
    this.taxAmount = Math.round((this.taxAmountPer / 100) * DiscountAmount);

    if (Number(itemDiscountType) === 2) {
      const data = (itemDiscount / 100) * this.subTotal;
      this.discount = data.toFixed(2);
    } else {
      this.discount = itemDiscount;
    }
    return Number(this.discount);
  }

  //* ************************************ Quantity change *********************************** */

  /**
   * Handle changes in the quantity of items.
   * @param {IEvent} event - The event containing quantity changes.
   * @param {number} i - The index of the item.
   * @param {string} type - The type of change (e.g., 'qty' or 'type').
   */
  onQtyChanges(event: IEvent, i: number, type: string) {
    const payType = this.getFormControl() as UntypedFormArray;
    const formGrp = payType.controls[i] as UntypedFormGroup;
    if (this.typingAllowed === false) {
      formGrp.get('qty')?.setValue('');
      return;
    }
    let stock = this.getFormControl().controls[i].get('stock')?.value;

    if (event.detail !== undefined) {
      const qtyValue = event.target.value.includes(',')
        ? event.target.value.replaceAll(',', '')
        : event.target.value;

      const qty = Number(qtyValue);
      if (stock === '') {
        stock = null;
      }

      if (stock != null && stock < qty && !type) {
        this.typingAllowed = false;
        if (stock <= 0) {
          this.alert.warningAlert({
            title: 'Out of Stock ',
            content:
              'The Quantity you entered is higher than the stock availble  , Stock is 0'
          });
        } else if (qty > stock) {
          this.alert.warningAlert({
            title: 'Out of Stock ',
            content: `The Quantity you entered is higher than the stock availble  , Stock is ${stock}`
          });
        }

        formGrp.get('total')?.setValue('0.00');
        formGrp.get('rowTotal')?.setValue('0.00');
        formGrp.get('qty')?.setValue('');
        setTimeout(() => {
          this.typingAllowed = true;
        }, 300);
      } else if (!type) {
        const quantity = Number(qtyValue.replaceAll(',', ''));
        const cost = Number(formGrp.get('cost')?.value);

        const total: number = quantity * cost;

        formGrp.get('total')?.setValue(total);
        formGrp.get('rowTotal')?.setValue(total);
        this.itemtypechange(this.discountvalue, i, 'qty');
        this.grandTotal();
        this.onItemDiscountChange(this.itemDiscount, i, 'type');
      }
      if (event.detail !== undefined && type) {
        const costValue =
          event.target.value[0] === '$'
            ? event.target.value.substring(1).replaceAll(',', '')
            : event.target.value;

        if (costValue != null && costValue !== '0') {
          const cost = costValue.replaceAll(',', '');
          const quantity = Number(formGrp.get('qty')?.value);

          const total: number = quantity * Number(cost);

          formGrp.get('total')?.setValue(total);
          formGrp.get('rowTotal')?.setValue(total);
        }
        this.grandTotal();
        this.itemtypechange(this.discountvalue, i, 'qty');
        this.onItemDiscountChange(this.itemDiscount, i, 'type');
      }
    }
  }

  //* ************************************ Discount change *********************************** */

  onItemDiscountChange(event: any, i: number, type: string) {
    if (!type) {
      const val =
        event.target.value[0] === '$'
          ? event.target.value.substring(1)
          : event.target.value;
      this.itemDiscount = parseFloat(val.replace(/,/g, ''));
    } else if (event) {
      this.itemDiscount = parseFloat(event?.replace(/,/g, '') ?? '0');
    }

    const totals = Number(this.getFormValue()[i].total);

    const payType = this.getFormControl() as UntypedFormArray;
    const formGrp = payType.controls[i] as UntypedFormGroup;

    const discountType = Number(this.getFormValue()[i].itemDiscountType);
    let total = Number(this.getFormValue()[i].total);

    if (discountType === 1) {
      const rowTotal = total - Number(this.itemDiscount);

      formGrp.get('itemDiscount')?.setValue(this.itemDiscount);
      formGrp.get('rowTotal')?.setValue(Number(rowTotal));
    } else if (discountType === 2 && (this.itemDiscount as number) >= 100) {
      this.itemDiscount = 100;

      const DiscountAmount = (this.itemDiscount / 100) * totals;
      const rowTotal = totals - DiscountAmount;

      formGrp.get('itemDiscountApplied')?.setValue(100);
      formGrp.get('itemDiscount')?.setValue(DiscountAmount.toFixed(2));
      formGrp.get('rowTotal')?.setValue(rowTotal.toFixed(2));
    } else if (discountType === 2 && (this.itemDiscount as number) < 100) {
      let DiscountAmount = ((this.itemDiscount as number) / 100) * totals;
      let rowTotal = totals - DiscountAmount;

      formGrp.get('itemDiscount')?.setValue(DiscountAmount.toFixed(2));
      formGrp.get('rowTotal')?.setValue(rowTotal.toFixed(2));

      total = 0;
      DiscountAmount = 0;
      rowTotal = 0;
    }

    if (!this.itemDiscount) {
      formGrp.get('itemDiscountApplied')?.setValue('');
      formGrp.get('itemDiscount')?.setValue(0);
      formGrp.get('rowTotal')?.setValue(totals);
    }
    this.grandTotal();
  }

  //* ************************************ Tax change *********************************** */

  /**
   * Handle changes in the tax for an item.
   * @param {IEvent} event - The event containing tax changes.
   * @param {number} i - The index of the item.
   */
  onTaxChange(event: IEvent, i: number) {
    const payType = this.getFormControl() as UntypedFormArray;
    const formGrp = payType.controls[i] as UntypedFormGroup;
    if (event.target.checked) {
      const tax = Number(formGrp.get('tax')?.value);
      const cost = Number(formGrp.get('unit_cost')?.value);
      const qty = Number(formGrp.get('quantity')?.value);
      const total: number = qty * cost;
      const taxamount = (tax / 100) * total;
      formGrp.get('tax_amount')?.setValue(taxamount.toFixed(2));
      formGrp.get('total')?.setValue(total);
    } else {
      formGrp.get('tax_amount')?.setValue(0);
      formGrp.get('tax')?.setValue(0);
    }
  }

  /** *********************************** Submit ****************************** */

  /**
   * Submit the invoice data for creation.
   */
  submit() {
    for (let i = 0; i < this.getFormValue().length; i += 1) {
      if (!this.invoice.value.bankAccountId) {
        this.alert.warningAlert({ content: 'Invoice From field is required' });
        return;
      }
      if (!this.invoice.value.payeeId) {
        this.alert.warningAlert({ content: 'Client field is required' });
        return;
      }
      if (!this.invoice.value.InvoiceNo) {
        this.alert.warningAlert({ content: 'Invoice No field is required' });
        return;
      }
      if (!this.invoice.value.Date) {
        this.alert.warningAlert({ content: 'Date field is required' });
        return;
      }
      if (this.invoice.value.item[0].item === '') {
        this.alert.warningAlert({ content: 'Item field is required' });
        return;
      }
      if (
        (this.invoice.value.item[i].qty === '' ||
          this.invoice.value.item[i].qty === 0) &&
        this.invoice.value.item[i].cost
      ) {
        this.alert.warningAlert({
          content: `Quantity of item missing in row ${i + 1}!`
        });
        return;
      }
      if (this.invoice.value.item[0].cost === '') {
        this.alert.warningAlert({ content: 'Unit cost field is required' });
        return;
      }
      if (this.credits !== '' && this.credits === 0) {
        this.alert.warningAlert({ content: 'Enter valid credits' });
        return;
      }
      if (this.invoice.value.invoiceGrandTotal > 100000000) {
        this.alert.warningAlert({
          content: 'The Item amount must be between 0 and 100000000'
        });
        return;
      }
    }

    if (Number(this.onDiscountChange()) > Number(this.subtotal())) {
      this.discountvalidation();
    } else if (this.invoice.valid) {
      if (this.subTotal !== 0) {
        this.invoice.get('totalTotal')?.setValue(this.subtotal());
        this.invoice.get('invoiceTaxTotal')?.setValue(this.taxAmount);
        this.invoice.get('creditGrandTotal')?.setValue(this.grandTotal());
        this.invoice.get('invoiceTotal')?.setValue(this.invoiceTotal());
        this.invoice.get('invoiceGrandTotal')?.setValue(this.grandtotal);
      }

      this.createCreditMemobody();
      const processedData = this.createCreditMemobody();
      const totalAmount = this.invoice.value.totalTotal;

      if (this.addInvoiceProcessing === true) {
        return;
      }
      this.addInvoiceProcessing = true;

      this.subscriptions.push(
        this.invoiceService
          .addinvoice(processedData)
          .pipe(
            finalize(() => {
              this.addInvoiceProcessing = false;
            })
          )
          .subscribe((res) => {
            const sdata = {
              title: 'Success',
              content: 'Invoice added',
              close: true,
              timeout: 2000
            };

            if (res.success && res.message !== 'Updated') {
              const close = this.alert.successAlert(sdata);
              this.scriptService.gtagEventScript('invoice-created', {
                amount: totalAmount
              });
              close.afterClosed().subscribe((result) => {
                if (result) {
                  this.dataTableService.setRefreshStatus(true);
                  this.dialogRef.close('added');
                }
              });
            }
          })
      );
    }
  }

  /** ********************************************* Update Invoice *************************************** */

  /**
   * Update the invoice data.
   */
  update() {
    for (let i = 0; i < this.getFormValue().length; i += 1) {
      if (!this.invoice.value.bankAccountId) {
        this.alert.warningAlert({ content: 'Invoice From field is required' });
        return;
      }
      if (!this.invoice.value.payeeId) {
        this.alert.warningAlert({ content: 'Client field is required' });
        return;
      }
      if (!this.invoice.value.InvoiceNo) {
        this.alert.warningAlert({ content: 'Invoice No field is required' });
        return;
      }
      if (!this.invoice.value.Date) {
        this.alert.warningAlert({ content: 'Date field is required' });
        return;
      }
      if (this.invoice.value.item[0].item === '') {
        this.alert.warningAlert({ content: 'Item field is required' });
        return;
      }
      if (
        (this.invoice.value.item[i].qty === '' ||
          this.invoice.value.item[i].qty === 0) &&
        this.invoice.value.item[i].cost
      ) {
        this.alert.warningAlert({
          content: `Quantity of item missing in row ${i + 1}!`
        });
        return;
      }
      if (this.invoice.value.item[0].cost === '') {
        this.alert.warningAlert({ content: 'Unit cost field is required' });
        return;
      }
      if (this.credits !== '' && this.credits === 0) {
        this.alert.warningAlert({ content: 'Enter valid credits' });
        return;
      }
      if (this.invoice.value.invoiceGrandTotal > 100000000) {
        this.alert.warningAlert({
          content: 'The Item amount must be between 0 and 100000000'
        });
        return;
      }
    }
    if (Number(this.onDiscountChange()) > Number(this.subtotal())) {
      this.discountvalidation();
    } else {
      if (this.subTotal !== 0) {
        this.invoice.get('totalTotal')?.setValue(this.subtotal());
        this.invoice.get('invoiceTaxTotal')?.setValue(this.taxAmount);
        this.invoice.get('creditGrandTotal')?.setValue(this.grandTotal());
        this.invoice.get('invoiceTotal')?.setValue(this.invoiceTotal());
        this.invoice.get('invoiceGrandTotal')?.setValue(this.grandtotal);
      }
      this.createCreditMemobody();
      const processedData = this.createCreditMemobody();
      if (this.addInvoiceProcessing === true) {
        return;
      }
      this.addInvoiceProcessing = true;
      this.subscriptions.push(
        this.invoiceService
          .updateInvoice(this.datas.data.invoiceId, processedData)
          .pipe(
            finalize(() => {
              this.addInvoiceProcessing = false;
            })
          )
          .subscribe((res) => {
            const Udata = {
              title: 'Success',
              content: 'Invoice updated ',
              close: true,
              timeout: 2000
            };

            if (res.success && res.message !== 'Updated') {
              const close = this.alert.successAlert(Udata);

              close.afterClosed().subscribe((result) => {
                if (result) {
                  this.dataTableService.setRefreshStatus(true);
                  this.dialogRef.close('updated');
                }
              });
            }
          })
      );
    }
  }

  /**
   * Handle scrolling for loading more invoice items.
   */
  onScroll() {
    this.Ipage += 1;
    this.subscriptions.push(
      this.invoiceService.getinvoiceitem(this.Ipage).subscribe((res) => {
        res.data.forEach((element) => {
          this.invoiceitemList.push(element);
        });
        this.refreshFilteredItems();
      })
    );
  }

  /**
   * Handle searching for invoice items.
   * @param {string} event - The search term.
   */
  onSearch(event: string) {
    this.searchTerm = event;

    if (!event.trim()) {
      // If search cleared, restore original data
      this.invoiceitemList = [...this.firstInvoiceItemPage];
      this.refreshFilteredItems();
      return;
    }

    this.Ipage = 1;
    this.subscriptions.push(
      this.invoiceService
        .getinvoiceitem(this.Ipage, this.searchTerm)
        .subscribe((res) => {
          this.invoiceitemList = res.data;
          this.refreshFilteredItems();
        })
    );
  }

  onSelectClose() {
    if (this.searchTerm) {
      // Reset to original data when dropdown closes after search
      this.invoiceitemList = [...this.firstInvoiceItemPage];
      this.searchTerm = '';
      this.Ipage = 1;
      this.itemid = [];
      this.refreshFilteredItems();
    }
  }

  /**
   * @description Method to filter only non-selected invoice items
   * @returns Filtered invoice items array.
   */
  filteredItems() {
    this.filteredInvoiceItems = this.invoiceitemList.filter(
      (item) => !this.itemid.includes(item.id)
    );
    return this.filteredInvoiceItems;
  }

  /**
   * @description Refreshes the filtered items cache
   */
  refreshFilteredItems() {
    this.filteredInvoiceItems = this.invoiceitemList.filter(
      (item) => !this.selectedItemValues.includes(item.id)
    );
  }

  /**
   * @description Getter for cached filtered items to prevent function calls during change detection
   * @returns Filtered invoice items array.
   */
  get filteredItemsList() {
    if (this.filteredInvoiceItems.length === 0 && this.invoiceitemList.length > 0) {
      this.refreshFilteredItems();
    }
    return this.filteredInvoiceItems;
  }

  /**
   * Click handler for loading more invoice items.
   */
  click() {
    if (this.itemName1) {
      this.itemid = this.itemName1;
    }
    if (this.filteredInvoiceItems.length < 10) {
      this.onScroll();
    }
  }

  /**
   * Handle item selection change from V35 dropdown.
   * @param {string} selectedId - The selected item ID.
   * @param {number} i - The index of the item in the invoice.
   */
  onItemChange(selectedId: string, i: number) {
    if (selectedId === 'add-new') {
      return; // let app-v35 emit buttonClick and openModal
    }

    if (this.isChangeItem) {
      return;
    }

    const payeeId = this.invoice.get('payeeId')?.value;
    if(!payeeId){
      this.isChangeItem = true;
      try {
          this.alert.warningAlert({ 
            content: 'Please select a payee first before choosing an item.' 
          });
          // Clear the selected value
          const formGrp = (this.getFormControls('item') as UntypedFormArray).controls[i] as UntypedFormGroup;
          
          formGrp.get('item')?.setValue('');
          this.itemValues[i] = '';
          this.itemName[i] = '';
          this.itemRequestId[i] = '';
          this.itemDetailsLoading[i] = false;

          // Refresh the dropdown to update the display
          const dropdownArray = this.dropDownComponents.toArray();
          if (dropdownArray[i]) {
            dropdownArray[i].clearSelection();
          }
      } finally {
        setTimeout(() => {
          this.isChangeItem = false;
        }, 0);
      }
      return;
    }

    this.itemid[i] = selectedId;
    this.itemRequestId[i] = selectedId ?? '';

    if (this.itemid.length > this.filteredItemsList.length) {
      this.onScroll();
    }

    if (selectedId) {
      this.itemDetailsLoading[i] = true;
      this.subscriptions.push(
        this.invoiceService
          .getSingleInvoiceItem(selectedId, payeeId)
          .pipe(
            finalize(() => {
              // Only the latest request for this row may switch the loader off.
              if (this.itemRequestId[i] === selectedId) {
                this.itemDetailsLoading[i] = false;
              }
            })
          )
          .subscribe((res) => {
            if (this.itemRequestId[i] !== selectedId) return; // stale response — row was cleared/changed since this request fired
            const invoiceitem = res.data;
            this.itemName[i] = invoiceitem.name;
            this.itemValues[i] = invoiceitem.id;

            const invoiceType = this.getFormControls(
              'item'
            ) as UntypedFormArray;
            const formGrp = invoiceType.controls[i] as UntypedFormGroup;
            formGrp.get('cost')?.setValue(invoiceitem.unitPrice);
            formGrp.get('item')?.setValue(invoiceitem.id);
            formGrp.get('description')?.setValue(invoiceitem.note ?? '');
            formGrp.get('stock')?.setValue(invoiceitem.stock);
            formGrp.get('ruleId')?.setValue(invoiceitem.ruleId);
            this.selectedItemValues.push(invoiceitem.id);
            this.refreshFilteredItems();
          })
      );
    } else {
      this.itemName[i] = '';
      this.itemDetailsLoading[i] = false;
      const invoiceType = this.getFormControls('item') as UntypedFormArray;
      const formGrp = invoiceType.controls[i] as UntypedFormGroup;
      formGrp.get('cost')?.setValue('');
      formGrp.get('item')?.setValue('');
      formGrp.get('description')?.setValue('');
      formGrp.get('qty')?.setValue('');
      formGrp.get('total')?.setValue('');
      formGrp.get('rowTotal')?.setValue('');
      formGrp.get('itemDiscountApplied')?.setValue('');
      this.selectedItemValues.splice(i, 1);
      this.refreshFilteredItems();
    }
  }

  /**
   * Legacy method for compatibility - delegates to onItemChange
   */
  change(event: string, i: number) {
    this.onItemChange(event, i);
  }

  //* ************************************ Open Tax modal ****************************** */

  /**
   * Open the tax modal to add or select a tax.
   */
  opentaxmodal() {
    const dialogRef = this.dialog.open(AddInvoiceTaxComponent, {
      maxWidth: '310px',
      width: '53%',
      data: {
        mode: 'NOT-TAX'
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.bpage = 1;
        this.loadTaxData(result.id);
      }
    });
  }

  //* ************************************ Open bank modal ****************************** */

  /**
   * Open the bank modal to add or select a bank account.
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
                this.invoice.controls.bankAccountId.setValue(result.id);
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
                this.invoice.controls.payeeId.setValue(modalRes.id);
                this.onSelectPayee(modalRes);
                this.selectedPayee.setValue(modalRes);
              }
            })
          );
        }
      })
    );
  }

  /**
   * Open the invoice item modal to add or select an item for the invoice.
   * @param {number} i - The index of the item in the invoice.
   */
  openInvoiceItemModal(i: number) {
    const dialogRef = this.dialog.open(AddInvoiceItemComponent, {
      maxWidth: '310px',
      width: '53%',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.itemValues[i] = result.id;
        this.itemDetailsLoading[i] = true;
        this.subscriptions.push(
          this.invoiceService
            .getSingleInvoiceItem(result.id)
            .pipe(
              finalize(() => {
                // onItemChange takes the loader over; clear it only if it never ran.
                if (this.itemRequestId[i] !== result.id) {
                  this.itemDetailsLoading[i] = false;
                }
              })
            )
            .subscribe((res) => {
              if(res.success){
              this.invoiceitemList.unshift(res.data);
              this.refreshFilteredItems();
              // this.loadItemData();
              this.onItemChange(res.data.id, i);
              }
            })
        );
      }
    });
  }

  /**
   * Load data for invoice items.
   */
  loadItemData() {
    this.subscriptions.push(
      this.invoiceService.getinvoiceitem(this.Ipage).subscribe((res) => {
        this.invoiceitemList = res.data;
        if (this.Ipage === 1) {
          this.firstInvoiceItemPage = res.data;
        }
        this.refreshFilteredItems();
      })
    );
  }

  /**
   * Load data for taxes.
   */
  loadTaxData(targetTaxId?: string) {
    this.subscriptions.push(
      this.invoiceService.gettax(this.bpage).subscribe((res) => {
        this.taxList = res.data;
        if (targetTaxId && this.taxList.some((tax) => tax.id === targetTaxId)) {
          this.onSelectTax(targetTaxId);
        }
      })
    );
  }

  /**
   * Handle scrolling to load more tax data.
   */
  onScrollTax() {
    this.bpage += 1;
    this.subscriptions.push(
      this.invoiceService.gettax(this.bpage).subscribe((res) => {
        res.data.forEach((element: ItaxList) => {
          this.taxList.push(element);
        });
      })
    );
  }

  /**
   * Open the attachment modal to add or manage attachments.
   */
  openAttachmentModal() {
    const data: IOpenAttachmentModalData = {
      id: this.ids ? this.ids : 0,
      type: 'invoices',
      existingData: ''
    };

    if (!this.datas) {
      data.existingData = this.createdExistingAttachments;
    }

    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1350px',
      disableClose: true,
      data
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.invoice.value.allAttachments = [];
      this.createdExistingAttachments = [];
      result.listData.forEach((e: ICreatedExistingAtachments) => {
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

  itemtypechange(ev: any, i: 'total' | number, type: string) {
    let data;

    if (type === 'qty') {
      data = ev as string;
    } else {
      data = ((ev as Event).target as HTMLInputElement).value as
        | number
        | string;
    }

    const invoiceType = this.getFormControls('item') as UntypedFormArray;

    const discountvalue = data;
    if (i === 'total') {
      const amount = this.invoice.value.discount;
      this.discountvalue = data;
      if (discountvalue === '2' && amount > 100) {
        this.invoice.patchValue({
          discount: 100
        });
      }
    } else {
      this.discountTypeArray[i] = data !== '1';
    }

    if (
      discountvalue === '2' &&
      i !== 'total' &&
      this.invoice.value.item[i].itemDiscountApplied >= 100
    ) {
      const formGrp = invoiceType.controls[i as number] as UntypedFormGroup;
      const total = Number(this.getFormValue()[i].total);

      formGrp.get('itemDiscountApplied')?.patchValue(100);
      formGrp.get('itemDiscount')?.patchValue(total);
      formGrp.get('rowTotal')?.patchValue(0);
    } else if (
      discountvalue === '2' &&
      this.invoice.value.item[i]?.itemDiscountApplied < 100 &&
      i !== 'total'
    ) {
      const formGrp = invoiceType.controls[i as number] as UntypedFormGroup;
      const total = Number(this.getFormValue()[i].total);

      const DiscountAmount =
        (this.invoice.value.item[i].itemDiscountApplied / 100) * total;
      const rowTotal = total - DiscountAmount;

      formGrp.get('itemDiscount')?.setValue(DiscountAmount.toFixed(2));
      formGrp.get('rowTotal')?.patchValue(rowTotal.toFixed(2));
    }

    if (discountvalue === '1' && i !== 'total') {
      const total = Number(this.getFormValue()[i].total);
      const rowTotal =
        total - Number(this.getFormValue()[i].itemDiscountApplied);

      const formGrp = invoiceType.controls[i as number] as UntypedFormGroup;
      formGrp
        .get('itemDiscountApplied')
        ?.setValue(this.getFormValue()[i].itemDiscountApplied);
      formGrp
        .get('itemDiscount')
        ?.setValue(this.getFormValue()[i].itemDiscountApplied);
      formGrp.get('rowTotal')?.setValue(rowTotal);
    }

    this.grandTotal();
  }

  /**
   * Handle changes in the total discount value.
   * @param {IEvent} ev - The event containing the total discount value change.
   */
  Totaldiscountval(ev: IEvent) {
    const amount = parseFloat(ev.target.value.replace(/,/g, ''));

    if (amount > 100 && this.discountvalue === 2) {
      this.invoice.patchValue({
        discount: 100
      });
    }
    this.grandTotal();
  }

  /** ********************************** Save & Eamil *********************************** */

  /**
   * Save and email the invoice.
   */
  SaveEmail(type: 'mail' | 'email' | 'paylink') {
    for (let i = 0; i < this.getFormValue().length; i += 1) {
      if (!this.invoice.value.bankAccountId) {
        this.alert.warningAlert({ content: 'Invoice From field is required' });
        return;
      }
      if (!this.invoice.value.payeeId) {
        this.alert.warningAlert({ content: 'Client field is required' });
        return;
      }
      if (!this.invoice.value.InvoiceNo) {
        this.alert.warningAlert({ content: 'Invoice No field is required' });
        return;
      }
      if (!this.invoice.value.Date) {
        this.alert.warningAlert({ content: 'Date field is required' });
        return;
      }
      if (this.invoice.value.item[0].item === '') {
        this.alert.warningAlert({ content: 'Item field is required' });
        return;
      }
      if (
        (this.invoice.value.item[i].qty === '' ||
          this.invoice.value.item[i].qty === 0) &&
        this.invoice.value.item[i].cost
      ) {
        this.alert.warningAlert({
          content: `Quantity of item missing in row ${i + 1}!`
        });
        return;
      }
      if (this.invoice.value.item[0].cost === '') {
        this.alert.warningAlert({ content: 'Unit cost field is required' });
        return;
      }
      if (this.credits !== '' && this.credits === 0) {
        this.alert.warningAlert({ content: 'Enter valid credits' });
        return;
      }
      if (this.invoice.value.invoiceGrandTotal > 100000000) {
        this.alert.warningAlert({
          content: 'The Item amount must be between 0 and 100,000,000'
        });
        return;
      }
    }
    if (this.onDiscountChange() > this.subtotal()) {
      this.discountvalidation();
      return;
    }
    if (!this.invoice.valid) {
      return;
    }

    // "Pay by link" needs a payable link on the selected bank account before the
    // invoice is created — otherwise the emailed link would resolve to nothing.
    if (type === 'paylink') {
      this.isSending.set(true);
      this.subscriptions.push(
        this.ensurePaymentLink(this.invoice.value.bankAccountId).subscribe(
          (hasLink) => {
            if (!hasLink) {
              this.isSending.set(false);
              return;
            }
            this.createAndSend(type);
          }
        )
      );
      return;
    }

    this.createAndSend(type);
  }

  /**
   * Creates the invoice, then opens the matching send modal for the chosen
   * option. Assumes the form has already been validated.
   * @param type - The send option chosen from the Send menu.
   */
  private createAndSend(type: 'mail' | 'email' | 'paylink') {
    if (this.subTotal !== 0) {
      this.invoice.get('totalTotal')?.setValue(this.subtotal());
      this.invoice.get('invoiceTaxTotal')?.setValue(this.taxAmount);
      this.invoice.get('creditGrandTotal')?.setValue(this.grandTotal());
      this.invoice.get('invoiceTotal')?.setValue(this.invoiceTotal());
      this.invoice.get('invoiceGrandTotal')?.setValue(this.grandtotal);
    }

    const processedData = this.createCreditMemobody();
    this.isSending.set(true);
    this.subscriptions.push(
      this.invoiceService
        .addinvoice(processedData)
        .pipe(
          finalize(() => {
            this.isSending.set(false);
          })
        )
        .subscribe((res) => {
          const ids: string[] = [];
          ids.push(res.data.id);
          const itemIds = { ids };
          const dat = {
            title: 'Success',
            content: 'Invoice added',
            close: true,
            timeout: 2000
          };

          if (res.success && res.message !== 'Updated') {
            const close = this.alert.successAlert(dat);
            this.dialogRef.close('created');

            close.afterClosed().subscribe((result) => {
              if (result) {
                this.subscriptions.push(
                  this.invoiceService
                    .getMaildetails(itemIds)
                    .subscribe((response) => {
                      this.maildata = response.data;
                      if (type === 'mail') {
                        this.dataTableService.setRefreshStatus(true);
                        this.dialog.open(DocumentMailModalComponent, {
                          disableClose: true,
                          width: '1200px',
                          data: {
                            type: 'added-invoice',
                            documents: response.data.invoice_data
                          }
                        });
                        return;
                      }
                      this.dialog.open(EmailSmsComponent, {
                        maxWidth: '1010px',
                        width: '90%',
                        data:
                          type === 'paylink'
                            ? { ...this.maildata, isPayByLink: true }
                            : this.maildata
                      });
                    })
                );
              }
            });
          }
        })
    );
  }

  /** ********************************** Payment Link *********************************** */

  /**
   * Resolves to true when the bank account already has a payable link, or when
   * the user generates one through the prompt. Resolves to false when the link
   * is missing and the user backs out.
   * @param bankAccountId - The selected bank account id.
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
   * @param bankAccountId - The selected bank account id.
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

  /**
   * Confirms, opens the create-link modal, then re-checks the account once.
   * @param bankAccountId - The selected bank account id.
   */
  private promptGeneratePaymentLink(bankAccountId: string): Observable<boolean> {
    return this.alert
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
            .open(GetPaidByLinkComponent, {
              data: { selectedBankId: bankAccountId }
            })
            .afterClosed()
            .pipe(
              switchMap((created) =>
                created
                  ? this.hasPaymentLink(bankAccountId).pipe(
                      map((result) => result.hasLink)
                    )
                  : of(false)
              )
            );
        })
      );
  }

  /** ********************************* Apply Credit Validation */

  /**
   * Apply credit validation based on entered credit amount.
   * @param {IEvent} event - The event containing the entered credit amount.
   */
  ApplyCredit(event: IEvent) {
    // eslint-disable-next-line no-param-reassign
    event.target.value = event.target.value.replace(/,(?=\d{3})/g, '');

    if (
      Number(event.target.value) > Number(this.subtotal()) ||
      Number(event.target.value) > Number(this.creditbalance)
    ) {
      this.Applycredit = true;
    } else if (
      event.target.value === '' ||
      Number(event.target.value) < Number(this.subtotal()) ||
      Number(event.target.value) < Number(this.creditbalance)
    ) {
      this.Applycredit = false;
    }
    this.creditapplied();
  }

  /**
   * Perform discount validation and display a warning if the discount amount is invalid.
   */
  discountvalidation() {
    if (Number(this.onDiscountChange()) >= Number(this.subtotal())) {
      this.alert.warningAlert({
        content: 'Discount amount should be less than total amount'
      });
    }
    return false;
  }

  /**
   * Allow only numeric input and handle decimal point for input events.
   * @param {INumberOnlyEvent} event - The input event containing the key code.
   * @returns {boolean} - Whether to allow the input.
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

  onMatMenuClosed() {
    this.isShowDropDown = false;
  }

  openLogoModal() {
    const dialogRef = this.dialog.open(WalletLogoUpdateModalComponent, {
      panelClass: 'paddingless-modal',
      width: '400px',
      disableClose: true,
      data: {
        from: 'invoice',
        existingLogo: this.logoFile,
        existingLogoUrl: this.logoPreviewUrl
      }
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success && result?.from === 'invoice') {
        this.logoFile = result.file as File;
        
        // Create preview URL for display
        if (this.logoFile) {
          // Clean up previous URL if exists
          if (this.logoPreviewUrl) {
            URL.revokeObjectURL(this.logoPreviewUrl);
          }
          
          this.logoPreviewUrl = URL.createObjectURL(this.logoFile);

          const reader = new FileReader();
          reader.onload = () => {
            const base64String = reader.result as string;
            
            // Update form value with base64 instead of File
            this.invoice.patchValue({ logo: base64String });
            this.alert.successAlert({
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

  editLogo(event: Event) {
    event.stopPropagation();
    this.openLogoModal();
  }

  deleteLogo(event: Event) {
    event.stopPropagation();
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
      this.alert.successAlert({
        title: 'Success',
        content: 'Logo deleted successfully',
        close: true,
        timeout: 2000
      });
    }
    this.logoPreviewUrl = null;
    this.logoFile = null;
    this.invoice.patchValue({ logo: null });
  }

  /**
   * Handle existing logo for clone/edit mode
   */
  async handleExistingLogo(logoUrl: string) {
    if (logoUrl) {
      this.isLogoLoading.set(true);
      this.logoPreviewUrl = logoUrl;
      
      // Convert URL to File for modal compatibility with proper image handling
      try {
        const response = await fetch(logoUrl, {
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Ensure proper MIME type detection
        let mimeType = blob.type;
        if (!mimeType || !mimeType.startsWith('image/')) {
          mimeType = 'image/jpeg'; // fallback
        }
        
        const fileName = this.extractFileNameFromUrl(logoUrl) || 'logo.jpg';
        
        // Create File with explicit type to preserve image properties
        this.logoFile = new File([blob], fileName, { 
          type: mimeType,
          lastModified: Date.now()
        });
        
      } catch (error) {
        // Fallback: keep URL only, disable file-based operations
        this.logoFile = null;
      } finally {
        setTimeout(() => {
          this.isLogoLoading.set(false);
        },500);
      }
    }
  }
  
  /**
   * Extract filename from URL
   */
  private extractFileNameFromUrl(url: string): string | null {
    try {
      const {pathname} = new URL(url);
      return pathname.split('/').pop() || null;
    } catch {
      return null;
    }
  }

  getItemValue(index: number): string {
    return this.itemName[index] ?? this.itemValues[index] ?? '';
  }
  
  /**
   * Unsubscribe from all subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    // Clean up logo preview URL to prevent memory leaks
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }
    
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
