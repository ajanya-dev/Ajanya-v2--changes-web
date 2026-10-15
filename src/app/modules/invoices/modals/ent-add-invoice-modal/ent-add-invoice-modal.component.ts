/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  QueryList,
  signal,
  ViewChildren
} from '@angular/core';
import {
  FormArray,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl,
  FormBuilder
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
import {
  Subject,
  Subscription,
  distinctUntilChanged,
  finalize,
  takeUntil
} from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddInvoiceItemComponent } from 'src/app/shared/modal/invoice-modal/add-invoice-item/add-invoice-item.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/document-mail-modal/document-mail-modal.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { NgxMaskDirective } from 'ngx-mask';
import { faPaperclip, faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { IUsersList } from 'src/app/models/user';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { MatTooltip } from '@angular/material/tooltip';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { AddInvoiceTaxComponent } from '../add-invoice-tax/add-invoice-tax.component';
import { EmailSmsComponent } from '../email-sms/email-sms.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';

/**
 * Represents the Add Invoice Component.
 */
@Component({
  selector: 'app-ent-add-invoice-modal',
  templateUrl: './ent-add-invoice-modal.component.html',
  styleUrl: './ent-add-invoice-modal.component.scss',
  providers: [DatePipe],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    NgxMaskDirective,
    AmountInputComponent,
    MatMenuTrigger,
    FaIconComponent,
    MatMenu,
    MatMenuItem,
    CurrencyPipe,
    CommonButtonV35Component,
    V35CommonDropDownSelectorComponent,
    V35ControlMessageComponent,
    PayeeDropdownV3Component,
    CommonInputFieldComponent,
    MatTooltip,
    BankAcDropdownV3Component,
    NgClass
  ]
})
export class EntAddInvoiceModalComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  public datas: IAddInvoiceDialog = inject(MAT_DIALOG_DATA);
  private payeeService = inject(PayeeService);
  private datePipe = inject(DatePipe);
  private sharedService = inject(SharedService);
  private invoiceService = inject(InvoiceService);
  public dialogRef = inject(MatDialogRef<EntAddInvoiceModalComponent>);
  private alert = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private scriptService = inject(ScriptService);
  private fb = inject(FormBuilder);
  private userManagementService = inject(UserManagementService);

  invoice: FormGroup;

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
  editMode = false;
  Applycredit = false;
  taxList: ItaxList[] = [];
  maildata: IMailData;
  ids: string;
  discountvalue: string | number;
  itemid: string[] = [];
  selectitem: string[] = [];
  createdExistingAttachments: ICreatedExistingAtachments[] = [];
  clone = false;
  creditmemoId: string;
  isSending = signal(false);
  discountTypeArray: boolean[] = [];
  faPlus = faPlus;
  faXmark = faXmark;
  faPaperclip = faPaperclip;
  firstInvoiceItemPage: IInvoiceDropdown[] = [];
  isShowDropDown = false;
  isChangeItem = false;
  autoPopulateEvent:IV3DropDownOnReady;
  isUserLoading = signal(false);
  isItemsLoading = signal(false);
  isTaxLoading = signal(false);
  selectedUser = '';
  selectedItem = '';
  selectedTax = '';
  usersList = signal<IUsersList[]>([]);
  destroy$ = new Subject();

  @ViewChildren('itemDropdown')
  dropDownComponents: QueryList<V35CommonDropDownSelectorComponent>;

  /**
   * Initializes the Add Invoice Component.
   */
  ngOnInit() {
    this.initFormGroup();
    this.loadTaxData();
    this.loadItemData();
    this.setCreditData();
    this.setCloneData();
    this.loadUserList();

    if (this.datas) {
      this.ids = this.datas.data?.invoiceId;
      this.creditmemoId =
      this.datas.data?.creditMemoDetails?.applied_amount ? this.datas.data?.creditMemoDetails?.applied_amount[0]?.payment : '';
    }

    this.changePayee();
    this.changeBank();
  }

  loadUserList(usersSearchTerm = '') {
    this.isUserLoading.set(true);
    this.userManagementService
      .getUsersList(0, usersSearchTerm)
      .pipe(
        finalize(() => this.isUserLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.usersList.set(res.data);
          if(this.datas && this.datas.data.createdById){
            this.selectedUser = this.usersList().filter((user) => user.client_id === this.datas.data.createdById)[0].client_name;
          }
        }
      });
  }

  onChangeUser(val: string) {
    const user = JSON.parse(val) as IUsersList;
    this.selectedUser = user.client_name;
    if(user){
      this.invoice.controls.userId.setValue( user.client_id);
    }else{
      this.invoice.controls.userId.setValue('');
    }
  }

  onSearchUser(searchTerm: string) {
    this.loadUserList(searchTerm);
  }


  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      this.autoPopulateEvent = ev;
      ev.setItemWithId(id);
    }
  }

  changeBank(){
    this.invoice.controls.bank.valueChanges
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe((res) => {      
      if (res?.id) {
        this.onSelectBank(res);
      }
    });
  }

  /**
   * Handles the bank selection event.
   *
   * @param {Object} event - The bank selection event.
   */
  onSelectBank(event: { id: string }) {
    if (event.id !== undefined) {
      this.invoice.patchValue({
        bankAccountId: event.id
      });

        this.invoiceService.getInvoiceNo(event.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.invoice.patchValue({
            InvoiceNo: res.data.lastInvoiceNo
          });
        });

      /** ********* get credit */

      const cdata = {
        payeeId: '',
        bankAccountId: ''
      };

      cdata.payeeId = this.invoice.get('payeeId')?.value;
      cdata.bankAccountId = event.id;

      if (cdata.payeeId !== '') {
          this.invoiceService.getCreditBalance(cdata)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            this.creditbalance = res.data.availableCreditMemo;
            this.invoice.patchValue({
              creditmemo: res.data.availableCreditMemo
            });
          });
      }
    }
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
      const afterThirtyDays = new Date(newDate);
      afterThirtyDays.setDate(afterThirtyDays.getDate() + 30);
      const duedate = this.datePipe.transform(afterThirtyDays, 'yyyy-MM-dd');
      this.invoice.patchValue({
        DueDate: duedate
      });
    }
  }

  changePayee() {
    this.invoice.controls.payee.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.id) {
          this.onSelectPayee(res, '');
        }
      });
  }

  /**
   * Handles the payee selection event.
   *
   * @param {Object} event - The payee selection event.
   * @param {string} type - The type of payee selection.
   */
  onSelectPayee(event: { id: string }, type: string) {
    const previousSelectedPayeeId = this.invoice.get('payeeId')?.value;
    let newPayeeId: string;

    if (type === '') {
      newPayeeId = event.id;
    } else {
      newPayeeId = typeof event === 'string' ? event : event.id;
    }

    const invoiceItemsArray = this.getFormControls('item') as FormArray;

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
        ) as FormArray;

        invoiceItemsArray.controls.forEach(
          (formGroup: AbstractControl, index: number) => {
            const ruleId = formGroup.get('ruleId')?.value;
            if (ruleId !== '' && ruleId !== null) {
              (formGroup as FormGroup).reset();
              this.itemName[index] = '';
              this.itemid[index] = '';
              const dropdownArray = this.dropDownComponents.toArray();
              if (dropdownArray[index]) {
                dropdownArray[index].clearSelection();
              }
            }
          }
        );
        this.filteredItems();
        // Update payee and fetch details
        this.updatePayeeAndFetchDetails(newPayeeId);
      } else {        
        // Restore previous payee ID if user cancels
        this.invoice.patchValue({
          payeeId: previousSelectedPayeeId
        });
        if(this.autoPopulateEvent && this.autoPopulateEvent.setItemWithId){
          this.autoPopulateEvent.setItemWithId(previousSelectedPayeeId);
        }
      }
    });
  }

  private updatePayeeAndFetchDetails(payeeId: string): void {
    // Update payee ID
    this.invoice.patchValue({
      payeeId
    });

    // Fetch payee details
      this.payeeService.showPayee(payeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const payeeDetails: IViewPayee = res.data;
        this.invoice.patchValue({
          accountNumber: payeeDetails.accountNumber
        });
      });

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
        this.invoiceService.getCreditBalance(cdata)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.creditbalance = res.data.availableCreditMemo;
          this.invoice.patchValue({
            creditmemo: res.data.availableCreditMemo
          });
        });
    }
  }
  /** ********** End Get Credit  */

  /**
   * Handles the category selection event.
   *
   * @param {Object} event - The category selection event.
   */
  onSelectCategory(event: { id: string }) {
    this.invoice.patchValue({
      invoiceCategory: event.id
    });
  }

  /**
   * Handles the invoice selection event.
   *
   * @param {Object} event - The invoice selection event.
   * @param {number} i - The index of the selected invoice item.
   */
  onSelectInvoice(event: { id: string }, i: number) {
    const { id } = event;
      this.invoiceService.getSingleInvoiceItem(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const invoiceitem = res.data;

        const invoiceType = this.getFormControls('item') as FormArray;
        const formGrp = invoiceType.controls[i] as FormGroup;
        formGrp.get('cost')?.setValue(invoiceitem.unitPrice);
        formGrp.get('item')?.setValue(invoiceitem.id);
        formGrp.get('stock')?.setValue(invoiceitem.stock);
      });
  }

  /**
   * Handles the tax selection event.
   *
   * @param {string} event - The selected tax event.
   */
  onSelectTax(event: string) {
    const selectedTax = JSON.parse(event) as ItaxList;
    if (selectedTax) {
        this.getTaxData(selectedTax.id);
    } else if (event === undefined) {
      this.invoice.patchValue({
        invoiceTaxId: '',
        invoiceTaxTotal: ''
      });
      this.taxAmountPer = 0.0;
    } else {
      this.invoice.patchValue({
        invoiceTaxId: '',
        invoiceTaxTotal: ''
      });
    }
  }

  getTaxData(taxId:string){
    this.invoiceService.getSingleTaxData(taxId)
    .pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.subTotal - this.onDiscountChange();
      this.taxAmountPer = res.data.taxPercentage;

      this.selectedTax = res.data.taxName;
      this.invoice.patchValue({
        invoiceTaxId: res.data.id
        // invoiceTaxTotal: this.taxAmountPer,
      });
    });
  }

  /**
   * Set the form data when cloning an invoice.
   */
  setCloneData() {
    if (this.datas?.isClone) {
      if (this.datas.data !== null) {
          this.invoiceService
            .getInvoiceNo(this.datas.data.bankAccount.bankAccountId)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              const a = res.data.lastInvoiceNo;
              this.invoice.patchValue({
                InvoiceNo: a
              });
            });

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

        this.getTaxData(this.datas.data.taxId);

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
          creditMemoNo: this.datas.data.creditMemoNo,
          userId:this.datas.data.createdById
        });

        for (let i = 0; i < this.datas.data.items.length; i += 1) {
          const invoiceType = this.getFormControls('item') as FormArray;

          invoiceType.push(this.createCreditMemoCtrl());
          const formGrp = invoiceType.controls[i] as FormGroup;
          this.totalInvoice = this.datas.data.amount;
          this.grandtotal = this.datas.data.grandTotal;
          this.itemName.push(this.datas.data.items[i].itemName);

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
        this.onSelectPayee({ id: this.datas.data.payee.payeeId }, 'editmode');
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

        this.getTaxData(this.datas.data.taxId);

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
          creditMemoNo: this.datas.data.creditMemoNo,
          userId:this.datas.data.createdById
        });

        for (let i = 0; i < this.datas.data.items.length; i += 1) {
          
          const invoiceType = this.getFormControls('item') as FormArray;
          invoiceType.push(this.createCreditMemoCtrl());
          const formGrp = invoiceType.controls[i] as FormGroup;
          this.totalInvoice = this.datas.data.amount;
          this.grandtotal = this.datas.data.grandTotal;
          this.itemName.push(this.datas.data.items[i].itemName);
          this.itemName1.push(this.datas.data.items[i].itemId);

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
        this.onSelectPayee({ id: this.datas.data.payee.payeeId }, 'editmode');
      }
    }
  }
  //* ******************************************** initFormGroup ******************************** */

  /**
   * Initialize the form group for the invoice.
   */
  initFormGroup() {
    this.invoice = this.fb.group({
      bank:[''],
      bankAccountId: ['', [Validators.required]],
      payee: [''],
      payeeId: ['',[Validators.required]],
      invoiceCategory: [''],
      discount: [''],
      discountType: [2],
      InvoiceNo: ['', [Validators.required]],
      Date: ['', [Validators.required]],
      DueDate: ['',[Validators.required]],
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
      userId:['']
    });

    const newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    if (newDate !== null) {
      this.invoice.get('Date')?.setValue(newDate);

      const afterThirtyDays = new Date(newDate);
      afterThirtyDays.setDate(afterThirtyDays.getDate() + 30);
      const duedate = this.datePipe.transform(afterThirtyDays, 'yyyy-MM-dd');
      this.invoice.patchValue({
        DueDate: duedate
      });
    }
  }

  //* ******************************************** Create CreditMemo ctrl ******************************** */

  /**
   * Create a form group for a credit memo.
   * @returns {FormGroup} The created credit memo form group.
   */
  createCreditMemoCtrl(): FormGroup {
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
      userId:datas.userId
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
      this.invoiceService.deleteAppliedCredit(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.invoice.get('creditMemoApplied')?.setValue('');
          this.getCreditBalance();
        }
      });
  }

  /**
   * Get the form control for the 'item' array in the invoice form.
   * @returns {FormArray} The form control for the 'item' array.
   */
  getFormControl() {
    return this.invoice.get('item') as FormArray;
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
   * @returns {FormArray} The user form groups within the 'item' array.
   */
  get userFormGroups() {
    return this.invoice.get('item') as FormArray;
  }

  //* ************************************ Add Row *********************************** */

  /**
   * Add a new row (credit memo) to the invoice form.
   */
  addNewRow() {
    const payeeId = this.invoice.get('payeeId')?.value;
    if (!payeeId) {
      this.alert.warningAlert({
        content: 'Please select a payee first before choosing an item.'
      });
      return;
    }
    const additem = this.invoice.get('item') as FormArray;

    additem.push(this.createCreditMemoCtrl());
    this.Ipage = 1;
    this.invoiceitemList = this.firstInvoiceItemPage;
  }

  //* ************************************ Remove Row *********************************** */

  /**
   * Remove a row from the invoice form.
   * @param {number} i - The index of the row to be removed.
   * @param {IEvent} event - The event containing row data.
   */
  removeRow(i: number, event: IEvent) {
    this.itemName.splice(i, 1);
    const id = event.controls.item.value as string;

    this.itemid.forEach((element, j) => {
      if (element === id) {
        this.itemid.splice(j, 1);
      }
    });

    const removeitem = this.invoice.get('item') as FormArray;
    const total = removeitem.length;

    if (total > 1) {
      removeitem.removeAt(i);
    }

    if (this.itemName1) {
      this.itemid = this.itemName1;
    }
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

    const payType = this.getFormControl() as FormArray;
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
  const subtotal = Number(this.subtotal()) || 0;
  const discount = Number(this.discount) || 0;
  const taxAmount = Number(this.taxAmount) || 0;

  const invtotal = subtotal - discount;
  this.totalInvoice = invtotal + taxAmount;
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
    const payType = this.getFormControl() as FormArray;
    const formGrp = payType.controls[i] as FormGroup;
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

    const payType = this.getFormControl() as FormArray;
    const formGrp = payType.controls[i] as FormGroup;

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


  /**
   * Handle changes in the tax for an item.
   * @param {IEvent} event - The event containing tax changes.
   * @param {number} i - The index of the item.
   */
  onTaxChange(event: IEvent, i: number) {
    const payType = this.getFormControl() as FormArray;
    const formGrp = payType.controls[i] as FormGroup;
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

  onSubmit(mode:'new'|'update'|'mail'|'email'){
    this.invoice.markAllAsTouched();
    if(this.invoice.invalid) return;

    for (let i = 0; i < this.getFormValue().length; i += 1) {
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
      return;
    } 
      if (this.subTotal !== 0) {
        this.invoice.get('totalTotal')?.setValue(this.subtotal());
        this.invoice.get('invoiceTaxTotal')?.setValue(this.taxAmount);
        this.invoice.get('creditGrandTotal')?.setValue(this.grandTotal());
        this.invoice.get('invoiceTotal')?.setValue(this.invoiceTotal());
        this.invoice.get('invoiceGrandTotal')?.setValue(this.grandtotal);
      }
      this.createCreditMemobody();
      const processedData = this.createCreditMemobody();

      if(mode === 'update'){
        this.updateInvoice(processedData);
      }else{
        this.createInvoice(processedData,mode);
      }
  }

  createInvoice(payload:INewInvoice,mode:Exclude<'new'|'mail'|'email'|'update', 'update'>){
    if(mode ==='new'){
      this.addInvoiceProcessing = true;
    }else{
      this.isSending.set(true);
    }
    this.invoiceService.addinvoice(payload)
    .pipe(finalize(() => 
      {
        if(mode === 'new'){
          this.addInvoiceProcessing = false;
        }else{
          this.isSending.set(false);
        }
      }),
      takeUntil(this.destroy$))
     .subscribe((res) => {
      if (res.success && res.message !== 'Updated'){
        const alertData = {
          title: 'Success',
          content: 'Invoice added',
          close: true,
          timeout: 2000
        };
        const alert = this.alert.successAlert(alertData);
        if(mode !== 'new'){
          this.dialogRef.close('created');
        }

        alert.afterClosed().subscribe((result) => {
          if (result) {
            this.dataTableService.setRefreshStatus(true);
            if(mode === 'new'){
              const totalAmount = this.invoice.value.totalTotal;
              this.dialogRef.close('added');
              this.scriptService.gtagEventScript('invoice-created', {
                amount: totalAmount
              });
            }else{
              const ids: string[] = [];
              ids.push(res.data.id);
              const itemIds = { ids };
              this.sendInvoice(mode,itemIds);
            }
          }
        });
      }
     });
  }

  updateInvoice(payload:INewInvoice){
    this.addInvoiceProcessing = true;
    this.invoiceService.updateInvoice(this.datas.data.invoiceId,payload)
    .pipe(finalize(() => {this.addInvoiceProcessing = false;}),takeUntil(this.destroy$))
     .subscribe((res) => {
      if (res.success && res.message !== 'Updated'){
        const alertData = {
          title: 'Success',
          content: 'Invoice updated',
          close: true,
          timeout: 2000
        };
        const alert = this.alert.successAlert(alertData);
        alert.afterClosed().subscribe((result) => {
          if (result) {
            this.dataTableService.setRefreshStatus(true);
            this.dialogRef.close('updated');
          }
        });
      }
     });
  }

  sendInvoice(mode:Exclude<'new'|'mail'|'email'|'update', 'update'|'new'>,idList:{ids: string[]}){
    this.invoiceService.getMaildetails(idList)
    .pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      this.maildata = res.data;
      if (mode === 'mail') {
        this.dataTableService.setRefreshStatus(true);
        this.dialog.open(DocumentMailModalComponent, {
          disableClose: true,
          width: '1200px',
          data: {
            type: 'added-invoice',
            documents: res.data.invoice_data
          }
        });
        return;
      }
      this.dialog.open(EmailSmsComponent, {
        maxWidth: '1010px',
        width: '90%',
        data: this.maildata
      });
    });
  }

  /**
   * Handle scrolling for loading more invoice items.
   */
  onScroll() {
    this.Ipage += 1;
    this.isItemsLoading.set(true);
      this.invoiceService
        .getinvoiceitem(this.Ipage)
        .pipe(finalize(() => this.isItemsLoading.set(false)),takeUntil(this.destroy$))
        .subscribe((res) => {
          res.data.forEach((element) => {
            this.invoiceitemList.push(element);
          });
          this.filteredItems();
        });
  }

  /**
   * Handle searching for invoice items.
   * @param {IEvent} event - The event containing the search term.
   */
  onSearch(searchValue: string) {
    this.searchTerm = searchValue;
    this.Ipage = 1;
    this.isItemsLoading.set(true);
      this.invoiceService
        .getinvoiceitem(this.Ipage, this.searchTerm)
        .pipe(finalize(() => this.isItemsLoading.set(false)),takeUntil(this.destroy$))
        .subscribe((res) => {
          this.invoiceitemList = res.data;
          this.filteredItems();
        });
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

  onChangeItem(value: string, index: number) {
    const selectedItem = JSON.parse(value);
    this.change(selectedItem?.id, index);
  }

  /**
   * Change the selected item for an item in the invoice.
   * @param {string} event - The selected item ID.
   * @param {number} i - The index of the item in the invoice.
   */
  change(event: string, i: number) {
    if (this.isChangeItem) {
      return;
    }

    const payeeId = this.invoice.get('payeeId')?.value;
    if (!payeeId) {
      this.isChangeItem = true;
      try {
        this.alert.warningAlert({
          content: 'Please select a customer first before choosing an item.'
        });
        const dropdownArray = this.dropDownComponents.toArray();
        if (dropdownArray[0]) {
          dropdownArray[0].clearSelection();
        }
      } finally {
        setTimeout(() => {
          this.isChangeItem = false;
        }, 0);
      }
      return;
    }

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
        this.invoiceService
          .getSingleInvoiceItem(id, payeeId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            const invoiceitem = res.data;

            const invoiceType = this.getFormControls(
              'item'
            ) as FormArray;
            const formGrp = invoiceType.controls[i] as FormGroup;
            formGrp.get('cost')?.setValue(invoiceitem.unitPrice);
            formGrp.get('item')?.setValue(invoiceitem.id);
            formGrp.get('description')?.setValue(invoiceitem.note);
            formGrp.get('stock')?.setValue(invoiceitem.stock);
            formGrp.get('ruleId')?.setValue(invoiceitem.ruleId);
          });
    } else {
      const invoiceType = this.getFormControls('item') as FormArray;
      const formGrp = invoiceType.controls[i] as FormGroup;
      formGrp.get('cost')?.setValue('');
      formGrp.get('item')?.setValue('');
      formGrp.get('description')?.setValue('');
      formGrp.get('qty')?.setValue('');
      formGrp.get('total')?.setValue('');
      formGrp.get('rowTotal')?.setValue('');
      formGrp.get('itemDiscountApplied')?.setValue('');
    }
  }


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
        this.loadTaxData();
        this.getTaxData(result.id);
      }
    });
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
          this.invoiceService
            .getSingleInvoiceItem(result.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              this.change(result.id, i);
              this.itemName[i] = res.data.name;
            });
      }
    });
  }

  /**
   * Load data for invoice items.
   */
  loadItemData() {
    this.isItemsLoading.set(true);
      this.invoiceService
        .getinvoiceitem(this.Ipage)
        .pipe(finalize(() => this.isItemsLoading.set(false)),takeUntil(this.destroy$))
        .subscribe((res) => {
          this.invoiceitemList = res.data;
          this.filteredItems();
          if (this.Ipage === 1) {
            this.firstInvoiceItemPage = res.data;
          }
        });
  }

  /**
   * Load data for taxes.
   */
  loadTaxData() {
    this.isTaxLoading.set(true);
      this.invoiceService
        .gettax(this.bpage)
        .pipe(finalize(() => this.isTaxLoading.set(false)),takeUntil(this.destroy$))
        .subscribe((res) => {
          this.taxList = res.data;
        });
  }

  /**
   * Handle scrolling to load more tax data.
   */
  onScrollTax() {
    this.isTaxLoading.set(true);
    this.bpage += 1;
      this.invoiceService
        .gettax(this.bpage)
        .pipe(finalize(() => this.isTaxLoading.set(false)),takeUntil(this.destroy$))
        .subscribe((res) => {
          res.data.forEach((element: ItaxList) => {
            this.taxList.push(element);
          });
        });
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

    const invoiceType = this.getFormControls('item') as FormArray;

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
      const formGrp = invoiceType.controls[i as number] as FormGroup;
      const total = Number(this.getFormValue()[i].total);

      formGrp.get('itemDiscountApplied')?.patchValue(100);
      formGrp.get('itemDiscount')?.patchValue(total);
      formGrp.get('rowTotal')?.patchValue(0);
    } else if (
      discountvalue === '2' &&
      this.invoice.value.item[i]?.itemDiscountApplied < 100 &&
      i !== 'total'
    ) {
      const formGrp = invoiceType.controls[i as number] as FormGroup;
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

      const formGrp = invoiceType.controls[i as number] as FormGroup;
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


  // Add this method to your component class
isFirstItemEmpty(): boolean {
  return this.invoice.value.item.length > 0 && 
         (!this.invoice.value.item[0].item || this.invoice.value.item[0].item === '');
}

isFirstCostEmpty(): boolean {
  return this.invoice.value.item.length > 0 && 
         (!this.invoice.value.item[0].cost || this.invoice.value.item[0].cost === '');
}



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

  onMatMenuClosed() {
    this.isShowDropDown = false;
  }

  /**
   * Unsubscribe from all subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
