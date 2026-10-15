import { DatePipe, CurrencyPipe } from '@angular/common';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  signal
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { InvoiceBillStateService } from '../../services/invoice-bill-state.service';
import { ScriptService } from 'src/app/core/services/script.service';
import {
  IAttachmentModalData,
  IBillAttachement,
  IBillComment,
  IBillItems,
  IMode,
  INewBill,
  IUplaodExtractionResult
} from 'src/app/modules/bill/model/Bill';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import {
  IPayeeDropdown,
  IShowPayeeDetails
} from 'src/app/modules/payee/payee-v2/model/payee';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IApiRes } from 'src/app/models/api';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEdit, faTrash, faXmark } from '@fortawesome/pro-solid-svg-icons';
import {
  ICredits,
  IViewBill,
  IUpdateBill,
  ICreateBill
} from '../../../invoices/model/invoice';
import { AddItemsComponent } from '../../components/add-items/add-items.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { PayeeDropdownV3Component } from '../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { BankAcDropdownV3Component } from '../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CategoryDropdownV3Component } from '../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from '../../../../shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';

@Component({
  selector: 'app-add-bill-modal',
  templateUrl: './add-bill-modal.component.html',
  styleUrls: ['./add-bill-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    PayeeDropdownV3Component,
    V35ControlMessageComponent,
    BankAcDropdownV3Component,
    AmountInputComponent,
    CategoryDropdownV3Component,
    AddItemsComponent,
    MatDialogActions,
    CurrencyPipe,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    FaIconComponent
  ],
  providers: [AddItemsComponent]
})
export class AddBillModalComponent implements OnInit, OnDestroy {
  @ViewChild(AddItemsComponent)
  private addItemsComponent: AddItemsComponent;

  // Input/Output for embedded mode
  @Input() isEmbedded = false;
  @Output() billSaved = new EventEmitter<any>();
  @Output() billUpdated = new EventEmitter<any>();

  public dialog = inject(MatDialog);
  public formBuilder = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  private billService = inject(BillService);
  private vendorService = inject(VendorService);
  private datePipe = inject(DatePipe);
  private sharedService = inject(SharedService);
  private payeeService = inject(PayeeService);
  private scriptService = inject(ScriptService);
  private invoiceService = inject(InvoiceService);
  private bankModalService = inject(BankModalService);
  public data: IMode = inject(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<AddBillModalComponent>, {
    optional: true
  });

  private payeeModalService = inject(PayeeModalService);
  private invoiceBillStateService = inject(InvoiceBillStateService);

  // Loading state for items processing
  readonly isItemsLoading = this.invoiceBillStateService.isAddBillFormLoading;

  addBillForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];

  // Separate FormControls for dropdowns to avoid circular dependencies
  selectedBankAccount: FormControl<IBankDropdown | null> = new FormControl();
  selectedPayee: FormControl<IPayeeDropdown | null> = new FormControl();
  selectedCategory: FormControl<ICategoryDropdown | null> = new FormControl();

  creditAmount = 0;
  creditsApplied: ICredits[] = [];

  onvendorchange: string;
  faEdit = faEdit;

  billId: string;
  billTotal = 0;
  billItems: IBillItems[] = [];

  attachments: IBillAttachement[] = [];
  comments: IBillComment[] = [];
  isOpenedFromInvoiceView = false;

  newDate: string | undefined;
  loading = signal(false);

  showExtra = '';
  modalTitle = '';
  extractFile: File | null = null;
  extractLoading = signal(false);

  faXmark = faXmark;
  faTrash = faTrash;

  ngOnInit(): void {
    this.initBillForm();

    if (!this.data) {
      this.data = { mode: 'new', billId: '' };
      this.isOpenedFromInvoiceView = true;
    }

    if (this.data.mode === 'new') {
      this.setDueDate();
    }

    if (this.data?.mode === 'edit' || this.data?.mode === 'clone') {
      this.billId = this.data.billId;
      this.getBillData(this.billId);
    }

    this.initDropdownSubscriptions();
    this.vendorCreditAmountChange();
    this.billAmountChange();

    if (this.isEmbedded) {
      this.populateFormFromService();
      // this.setupRealTimeUpdates();
    } else if (this.data?.extractedData) {
      this.populateFormFromExtractedData();
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    this.modalTitle = {
      edit: 'Edit Bill',
      new: 'Add Bill',
      clone: 'Clone Bill'
    }[this.data.mode as keyof object];
  }

  /**
   * @description Initialize dropdown subscriptions to avoid circular dependencies.
   */
  initDropdownSubscriptions(): void {
    // Bank dropdown subscription
    this.subscriptions.push(
      this.selectedBankAccount.valueChanges.subscribe((bankItem) => {
        if(bankItem === undefined) return;
        const currentValue = this.addBillForm.controls.bankAccount.value;
        const newValue = bankItem ? bankItem.id : null;
        
        if (currentValue !== newValue) {
          this.addBillForm.controls.bankAccount.setValue(newValue);
        }
      }),
      this.selectedPayee.valueChanges.subscribe((payeeItem) => {
        if (payeeItem === undefined) {
          return;
        }
        
        const currentValue = this.addBillForm.controls.payee.value;
        const newValue = payeeItem ? payeeItem.id : null;
        
        if (currentValue !== newValue) {
          this.addBillForm.controls.payee.setValue(newValue);
        }
      }),
      this.selectedCategory.valueChanges.subscribe((categoryItem) => {
        if (categoryItem === undefined) {
          return;
        }
        
        const currentValue = this.addBillForm.controls.category.value;
        const newValue = categoryItem ? categoryItem.id : null;
        
        if (currentValue !== newValue) {
          this.addBillForm.controls.category.setValue(newValue);
        }
      })
    );
  }

  /**
   * @description Populate form with extracted data from modal props
   */
  private populateFormFromExtractedData(): void {
    const extractedData = this.data?.extractedData;
    if (extractedData) {
      this.addBillForm.patchValue({
        payee: extractedData.vendor?.id || '',
        inv_no: extractedData.inv_no || '',
        inv_date: extractedData.inv_date || '',
        due_date: extractedData.due_date || '',
        amount: extractedData.amount || 0,
        memo:
          extractedData.memo ||
          `Invoice from ${extractedData.vendor?.name || ''}`,
        po_no: extractedData.po_no || ''
      });

      // Set items if available
      if (extractedData.items && extractedData.items.length > 0) {
        this.billItems = extractedData.items.map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          item: item.description || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          unitPrice: (item.price || 0).toString(),
          total: (item.quantity || 0) * (item.price || 0)
        }));
        this.calculateBillTotal();

        this.showExtra = 'showAddItems';

        setTimeout(() => {
          if (this.addItemsComponent) {
            const itemsForComponent = this.billItems.map((item) => ({
              description: item.description || '',
              qty: item.quantity?.toString() || '0',
              cost: item.unitPrice || '0',
              total: (
                (item.quantity || 0) * (parseFloat(item.unitPrice) || 0)
              ).toString(),
              itemName: item.item || '',
              itemId: item.id || '',
              discount: '0'
            }));

            this.addItemsComponent.setItemsForm(itemsForComponent, false);
          }
        }, 100);
      }

      if (extractedData.vendor?.name) {
        this.sharedService.setNewPayeeCreatedData({
          payeeName: extractedData.vendor.name
        });
      }
    }
  }

  /**
   * @description Populate form with data from service
   */
  private populateFormFromService(): void {
    const invoiceData = this.invoiceBillStateService.invoiceData();
    if (invoiceData) {
      this.addBillForm.patchValue({
        payee: invoiceData.vendor?.id || '',
        inv_no: invoiceData.invoiceNumber || '',
        inv_date: invoiceData.invoiceDate || '',
        due_date: invoiceData.dueDate || '',
        amount: invoiceData.amountDue || 0,
        memo: `Invoice from ${invoiceData.vendor?.name || ''}`,
        po_no: invoiceData.poNumber || ''
      });

      if (invoiceData.items && invoiceData.items.length > 0) {
        this.billItems = invoiceData.items.map((item) => ({
          id: item.id?.toString() || Math.random().toString(),
          item: item.description || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          unitPrice: (item.price || 0).toString(),
          total: (item.quantity || 0) * (item.price || 0)
        }));

        this.calculateBillTotal();
        this.showExtra = 'showAddItems';
        setTimeout(() => {
          if (this.addItemsComponent) {
            // Convert billItems to IItemsViewBill format
            const itemsForComponent = this.billItems.map((item) => ({
              description: item.description || '',
              qty: item.quantity?.toString() || '0',
              cost: item.unitPrice || '0',
              total: (
                (item.quantity || 0) * (parseFloat(item.unitPrice) || 0)
              ).toString(),
              itemName: item.item || '',
              itemId: item.id || '',
              discount: '0' // Default discount
            }));

            this.addItemsComponent.setItemsForm(itemsForComponent, false);
          }
        }, 100);
      }

      // Populate attachments regardless of items (for failed extraction cases)
      if(invoiceData.attachments && invoiceData.attachments.length > 0) {
        this.attachments = invoiceData.attachments.map((attachment) => ({
          id: attachment.id,
          attachable_id: attachment.id,
          attachable_type: 'bills',
          created_at: attachment.uploadedAt || new Date().toISOString(),
          created_by_id: 0,
          created_for_id: 0,
          encrypted_id: attachment.encrypted_id,
          formated_date: attachment.uploadedAt || new Date().toISOString(),
          file_name: attachment.file_nick_name || attachment.filename,
          file_nick_name: attachment.file_nick_name || attachment.filename,
          fileName: attachment.filename,
          user_name: '',
          updated_at: attachment.uploadedAt || new Date().toISOString(),
          page_count: 0,
          billAttach: true
        }));
      }

    }
  }

  /**
   * @description  To set the data in bill form.
   *
   */
  setBillItems(items: { items: IBillItems[]; total: number }) {
    const credit: number = this.addBillForm.controls.credit.value
      ? this.addBillForm.controls.credit.value * 1
      : 0;
    const creditsApplied: number = this.creditsApplied.reduce(
      (p, c) => p + parseFloat(c.amount) * 1,
      0
    );
    this.billTotal = items.total - (creditsApplied + credit);
    this.addBillForm.controls.amount.setValue(this.billTotal);
    this.billItems = items.items;
  }

  /**
   * @description  calculate vendor credit amount.
   *
   */
  vendorCreditAmountChange() {
    this.addBillForm.controls.credit.valueChanges.subscribe(() => {
      this.calculateBillTotal();
    });
  }

  /**
   * @description  To calculate bill amount.
   *
   */
  billAmountChange() {
    this.addBillForm.controls.amount.valueChanges.subscribe(
      (amount: number) => {
        if (!this.billItems.length) {
          const credit: number = this.addBillForm.controls.credit.value
            ? this.addBillForm.controls.credit.value * 1
            : 0;
          const creditsApplied: number = this.creditsApplied.reduce(
            (p, c) => p + parseFloat(c.amount) * 1,
            0
          );
          this.billTotal = amount - (credit + creditsApplied);
        }
      }
    );
  }

  /**
   * @description  To calculate bill total amount.
   *
   */
  calculateBillTotal() {
    const credit: number = this.addBillForm.controls.credit.value
      ? this.addBillForm.controls.credit.value * 1
      : 0;
    const totalCredit: number =
      this.creditsApplied.reduce((p, c) => p + parseFloat(c.amount) * 1, 0) +
      credit;
    let totalAmount = 0;
    if (this.billItems.length) {
      totalAmount = this.billItems.reduce((p, c) => p + c.total, 0);
    } else {
      totalAmount = this.addBillForm.controls.amount.value;
    }
    this.billTotal = totalAmount - totalCredit;
  }

  /**
   * @description  Initializes the form group for the bill form.
   */
  initBillForm() {
    this.addBillForm = this.formBuilder.group({
      bankAccount: [''],
      payee: ['', Validators.required],
      inv_no: ['', Validators.required],
      inv_date: ['', Validators.required],
      amount: ['', Validators.required],
      category: [''],
      due_date: [''],
      credit: [''],
      acc_no: [''],
      memo: [''],
      po_no: ['']
    });
  }

  /**
   * @description Handle bank dropdown ready event for edit mode.
   */
  onBankDropdownReady(event: IV3DropDownOnReady) {
    if (event?.setItemWithId && (this.data?.mode === 'edit' || this.data?.mode === 'clone') && this.addBillForm.controls.bankAccount.value) {
      event.setItemWithId(this.addBillForm.controls.bankAccount.value);
    }
  }

  /**
   * @description  To select payee.
   *
   */
  onPayeeChange(event: IPayeeDropdown | null | undefined | 'add-new') {    
    if (event === undefined || event === null || event === 'add-new') {
      this.addBillForm.controls.category.setValue('');
      this.sharedService.setNewCategoryCreatedData({ categoryName: '' });
      this.addBillForm.controls.acc_no.setValue('');
      return;
    } 
      this.getCreditAmt(event?.id);
      this.addBillForm.controls.payee.markAsTouched();
      const val = event ? event?.id : '';
      this.addBillForm.controls.payee.setValue(val);
      this.loadPayeeDetails(event?.id);
      if (event?.typeDetails?.payee?.payeeAccountNumber != null) {
        this.addBillForm.controls.acc_no.setValue(
          event?.typeDetails?.payee?.payeeAccountNumber
        );
      } else if (event?.typeDetails?.customerAccountNumber != null) {
        this.addBillForm.controls.acc_no.setValue(
          event?.typeDetails?.customerAccountNumber
        );
      }

      // Update service with payee name if in embedded mode
      if (this.isEmbedded && event) {
        // Update the invoice data directly to reflect the new payee
        const currentInvoice = this.invoiceBillStateService.invoiceData();
        if (currentInvoice) {
          this.invoiceBillStateService.updateInvoiceData({
            vendor: {
              ...currentInvoice.vendor,
              id: event.id,
              name: event.name || event.company || ''
            }
          });
        }

        this.invoiceBillStateService.updateBillFormData({
          payeeVendor: event.name || event.company || '',
          payeeId: event.id
        });
      }
    
  }

  /**
   * @description  To select category.
   *
   */
  onCategoryDropdownReady(event: IV3DropDownOnReady) {
    if (event?.setItemWithId && (this.data?.mode === 'edit' || this.data?.mode === 'clone') && this.addBillForm.controls.category.value) {
      event.setItemWithId(this.addBillForm.controls.category.value);
    }
  }

  /**
   * @description  To set bill data.
   *
   */
  setbillData(billData: IViewBill) {
    this.onvendorchange = billData.payee.payeeId;
    this.getCreditAmt(billData.payee.payeeId);

    this.sharedService.setNewBankCreatedData({
      bankAccountNickName: billData.bankAccount.bankAccountNickName
        ? billData.bankAccount.bankAccountNickName
        : billData.bankAccount.bankAccountName
    });
    this.sharedService.setNewPayeeCreatedData({
      payeeName: billData.payee.payeeName
    });
    if (billData.category?.categoryId) {
      this.sharedService.setNewCategoryCreatedData({
        categoryName: billData.category.categoryName
      });
    }

    const invoiceDate = billData.invDate
      ? this.datePipe.transform(billData.invDate, 'yyyy-MM-dd')
      : undefined;
    const dueDate = billData.dueDate
      ? this.datePipe.transform(billData.dueDate, 'yyyy-MM-dd')
      : null;
    const invoiceNum = this.data.mode === 'clone' ? '' : billData.invNo;

    this.addBillForm.patchValue({
      amount: parseFloat(billData.amount),
      acc_no: billData.accountNo,
      memo: billData.memo,
      inv_no: invoiceNum,
      inv_date: invoiceDate,
      due_date: dueDate,
      payee: billData.payee.payeeId,
      bankAccount: billData.bankAccount.bankaccountId,
      category: billData.category?.categoryId,
      po_no: billData.poNumber
    });
    
    // Set the dropdown FormControls with proper objects
    if (billData.bankAccount?.bankaccountId) {
      this.selectedBankAccount.setValue({
        id: billData.bankAccount.bankaccountId,
        name: billData.bankAccount.bankAccountNickName || billData.bankAccount.bankAccountName
      } as IBankDropdown);
    }
    if (billData.payee?.payeeId) {
      this.selectedPayee.setValue({
        id: billData.payee.payeeId,
        name: billData.payee.payeeName
      } as IPayeeDropdown);
    }
    if (billData.category?.categoryId) {
      this.selectedCategory.setValue({
        id: billData.category.categoryId,
        name: billData.category.categoryName
      } as ICategoryDropdown);
    }
    
    this.billTotal = parseFloat(billData.billTotal);
  }

  /**
   * @description  create the data body for submit the bill form.
   *
   */
  createBillBody(): INewBill {
    const data = this.addBillForm.value;
    this.newDate =
      this.datePipe.transform(data.inv_date, 'MM/dd/yyyy') || undefined;
    const dueDate: Date | undefined = data.due_date
      ? new Date(data.due_date as string)
      : undefined;
    const invoiceDate: Date | undefined = this.newDate
      ? new Date(this.newDate)
      : undefined;

    const payeeId = typeof data.payee === 'object' && data.payee?.id 
      ? data.payee.id 
      : data.payee;

    const body: INewBill = {
      bankAccount: data.bankAccount || '',
      payee: payeeId,
      categoryId: data.category || '',
      invoiceDate,
      dueDate,
      amount: data.amount,
      vendorCredit: data.credit,
      accountNumber: data.acc_no,
      memo: data.memo,
      invoiceNumber: data.inv_no,
      poNumber: data.po_no,
      item: this.billItems.map((e: IBillItems) => ({
        item: e.id,
        description: e.description,
        qty: e.quantity?.toString(),
        cost: e?.unitPrice,
        total: e.total.toString()
      }))
    };

    // Add message_id if this bill is being created from an invoice (embedded mode)
    if (this.isEmbedded) {
      const invoiceData = this.invoiceBillStateService.invoiceData();
      if (invoiceData?.messageId) {
        body.message_id = invoiceData.messageId;
      }
    }

    if (this.data.mode === 'new') {
      body.allComments = this.comments.map((e: IBillComment) =>
        e.encrypted_id?.toString()
      );
      body.allAttachments = this.attachments.map((e: IBillAttachement) =>
        e.encrypted_id?.toString()
      );
    }
    return body;
  }

  /**
   * @description  automatically set the due date when select the invoice date.
   *
   */
  setDueDate() {
    this.addBillForm.controls.inv_date.valueChanges.subscribe(
      (date: string) => {
        if (date) {
          const dueDate: Date = new Date(date);
          dueDate.setDate(dueDate.getDate() + 10);
          const transformedDate: string | undefined =
            this.datePipe.transform(dueDate, 'yyyy-MM-dd') || undefined;
          this.addBillForm.controls.due_date.setValue(transformedDate);
        }
      }
    );
  }

  /**
   * @description  Get the Available Credit.
   *
   */
  getCreditAmt(payeeId: string) {
    this.vendorService.getVendorCreditAmount(payeeId).subscribe((data) => {
      if (data?.success) {
        this.creditAmount = data.data.total;
      }
    });
  }

  /**
   * @description Load payee details.
   *
   */
  loadPayeeDetails(payeeId: string) {
    if (!payeeId) {
      this.selectedCategory.setValue(null);
      return;
    }

    this.subscriptions.push(
      this.payeeService
        .showPayee(payeeId)
        .subscribe((res: IApiRes<IShowPayeeDetails>) => {
          if (res?.success) {
            if (res?.data?.payeeIdNumber) {
              this.addBillForm.controls.acc_no.setValue(res.data.payeeIdNumber);
            } else {
              this.addBillForm.controls.acc_no.setValue('');
            }
            if (res?.data?.bill_category && res?.data?.bill_category_name) {
              // This will trigger the subscription which will update the form
              this.selectedCategory.setValue({
                id: res.data.bill_category,
                name: res.data.bill_category_name
              } as ICategoryDropdown);
              this.sharedService.setNewCategoryCreatedData({
                categoryName: res.data.bill_category_name
              });
            } else {
              this.selectedCategory.setValue(null);
              this.sharedService.setNewCategoryCreatedData({
                categoryName: undefined
              });
            }
          }
        })
    );
  }

  /**
   * @description Edit the bill form.
   *
   */
  updateBill(body: INewBill) {
    this.subscriptions.push(
      this.billService.updateBill(this.data.billId, body).subscribe(
        (data: IApiRes<IUpdateBill>) => {
          this.dialogRef?.close(data);
        },
        () => {
          this.loading.set(false);
        }
      )
    );
  }

  /**
   * @description Add the bill form.
   *
   */
  addBill(body: INewBill) {
    const billAmount = this.addBillForm.controls.amount.value;
    this.subscriptions.push(
      this.billService.createBill(body).subscribe(
        (data: IApiRes<ICreateBill>) => {
          this.scriptService.gtagEventScript('bill-created', {
            amount: billAmount
          });

          this.loading.set(false);

          this.alertService.successAlert({
            title: 'Success',
            content: 'Bill created successfully!'
          });

          if (this.isEmbedded) {
            const invoiceData = this.invoiceBillStateService.invoiceData();
            this.billSaved.emit(invoiceData);
          } else {
            this.dialogRef?.close(data);
          }
        },
        () => {
          this.loading.set(false);
        }
      )
    );
  }

  toggleShowExtras(val: string) {
    if (this.showExtra === val) {
      this.showExtra = '';
      return;
    }

    this.showExtra = val;
  }

  /**
   * @description Submit the bill form.
   *
   */
  onSubmit() {
    if (this.addBillForm.invalid || this.wrongCreditInput()) {
      this.addBillForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const processedData = this.createBillBody();

    if (this.isEmbedded) {
      this.addBill(processedData);
    } else {
      if (this.data.mode === 'edit') {
        this.updateBill(processedData);
      } else {
        this.addBill(processedData);
      }
    }
  }

  /**
   * @description Getting the credit.
   *
   */
  wrongCreditInput(): boolean {
    const credit = parseFloat(this.addBillForm.controls.credit.value);
    if (
      credit > parseFloat(this.creditAmount.toString()) ||
      credit > parseFloat(this.addBillForm.controls.amount.value)
    ) {
      return true;
    }
    return false;
  }

  /**
   * @description Handle file selection for extraction.
   */
  onExtractFileSelected(file: File): void {
    this.extractFile = file;
  }

  /**
   * @description Extract invoice data from uploaded image.
   */
  extractInvoiceImage(): void {
    if (!this.extractFile) {
      return;
    }
    
    this.extractLoading.set(true);
    const body = new FormData();
    body.append('document', this.extractFile);
    this.subscriptions.push(
    this.billService.extractInvoice(body).subscribe({
      next: (data) => {
        if (data?.success) {
          this.getExtractedData(data.data);
          this.extractFile = null; // Clear file after successful extraction
        }
        this.extractLoading.set(false);
      },
      error: () => {
        this.extractLoading.set(false);
      }
    }));
  }

  /**
   * @description Getting extracted data of bill.
   *
   */
  getExtractedData(data: IUplaodExtractionResult) {
    this.alertService.successAlert({
      content: 'Data extracted. Please check your bill before submit'
    });
    this.addBillForm.patchValue({
      amount: data.TOTAL,
      due_date: data.DUE_DATE,
      inv_no: data.INVOICE_RECEIPT_ID,
      inv_date: data.INVOICE_RECEIPT_DATE
    });
  }

  /**
   * @description Getting bill data details.
   *
   */
  getBillData(billId: string) {
    this.billService.viewBill(billId).subscribe((data) => {
      if (data?.success) {
        this.getCredits(billId, data.data.payee.payeeId);
        this.setbillData(data?.data);
        this.addItemsComponent.setItemsForm(data?.data.items, false);
      }
    });
  }

  /**
   * @description Getting credits of bill.
   *
   */
  getCredits(billId: string, payeeId: string) {
    this.subscriptions.push(
      this.billService.getCredits(billId, payeeId).subscribe((data) => {
        if (data?.success) {
          this.creditsApplied = data.data;
        }
      })
    );
  }

  /**
   * @description Delete the credit of bill.
   *
   */
  deleteCredit(id: string, index: number) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this credit?'
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.billService.deleteCredit(this.billId, id).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Credit deleted'
              });
              this.creditsApplied.splice(index, 1);
              this.calculateBillTotal();
              this.getCreditAmt(this.onvendorchange);
            }
          })
        );
      }
    });
  }

  /**
   * @description To open all modal fron bill.
   *
   */
  openBankAccModal() {
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
                  // Set the dropdown FormControl which will update the form via subscription
                  this.selectedBankAccount.setValue({
                    id: result.id
                  } as IBankDropdown);
              }
            })
          );
        }
      })
    );
  }

  openPayeeModal() {
    this.subscriptions.push(
      this.payeeModalService.openAddPayee().subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(
            payeeModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewPayeeCreatedData({
                  payeeId: result.id
                });
                // Set the selectedPayee FormControl which will update the form via subscription
                this.selectedPayee.setValue({
                  id: result.id,
                  name: ''
                } as IPayeeDropdown);
                this.addBillForm.controls.payee.setValue(result.id);
                
                // Update invoice data with new payee name for real-time display
                if (this.isEmbedded) {
                  const currentInvoice = this.invoiceBillStateService.invoiceData();
                  if (currentInvoice) {
                    this.invoiceBillStateService.updateInvoiceData({
                      vendor: {
                        ...currentInvoice.vendor,
                        id: result.id,
                        name: result.name || result.company || ''
                      }
                    });
                  }
                  
                  this.invoiceBillStateService.updateBillFormData({
                    payeeVendor: result.name || result.company || '',
                    payeeId: result.id
                  });
                }
                
                this.onPayeeChange({
                  id: result.id,
                  name: result.name || '',
                  nickName: '',
                  phone: '',
                  addressLine1: undefined,
                  addressLine2: undefined,
                  city: '',
                  company: result.company || '',
                  country: '',
                  createdAt: '',
                  email: '',
                  encryptedId: '',
                  payeeTypeId: result.payeeTypeId,
                  state: '',
                  zip: '',
                  typeDetails: {
                    id: '',
                    createdAt: '',
                    customerAccountNumber: '',
                    customerBankAccountId: '',
                    customerCompanyName: '',
                    customerDefaultPayMethod: '',
                    customerFirstName: '',
                    customerLastName: '',
                    customerMiddleName: '',
                    customerNote: '',
                    customerType: '',
                    deletedAt: '',
                    employeeAccountNumber: '',
                    employeeBankAccountId: '',
                    employeeDefaultPayMethod: '',
                    employeeDob: '',
                    employeeFillingStatus: '',
                    employeeFirstName: '',
                    employeeHourlyRate: '',
                    employeeLastName: '',
                    employeeMiddleName: '',
                    employeeNote: '',
                    employeeOvertimeRate: '',
                    employeePaymentSchedule: '',
                    employeeSsn: '',
                    employeeType: '',
                    employeeYtdEarning: '',
                    employeeYtdTax: '',
                    payee: {
                      payeeId: '',
                      payeeAccountNumber: '',
                      payeeMobilePhone: ''
                    },
                    updatedAt: '',
                    vendor1099: '',
                    vendorAccountNumber: '',
                    vendorBankAccountId: '',
                    vendorCompanyName: '',
                    vendorDefaultPayMethod: '',
                    vendorFirstName: '',
                    vendorLastName: '',
                    vendorMiddleName: '',
                    vendorNote: '',
                    vendorPaymentTerms: '',
                    vendorTaxId: '',
                    vendorType: ''
                  }
                });
              }
            })
          );
        }
      })
    );
  }

  onpayeeEdit(event: string) {
    this.subscriptions.push(
      this.payeeModalService.openEditPayee(event,'addPayeeModal', {
          edit: true,
          id: event
        }).subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(payeeModal.afterClosed().subscribe((result) => {
            if (result?.success) {
              this.sharedService.setNewPayeeCreatedData({
                payeeId: result.id
              });
              this.addBillForm.controls.payee.setValue(result.id);
              if (this.isEmbedded) {
                const currentInvoice = this.invoiceBillStateService.invoiceData();
                if (currentInvoice) {
                  this.invoiceBillStateService.updateInvoiceData({
                    vendor: {
                      ...currentInvoice.vendor,
                      id: result.id,
                      name: result.name || result.company || ''
                    }
                  });
                }
                
                this.invoiceBillStateService.updateBillFormData({
                  payeeVendor: result.name || result.company || '',
                  payeeId: result.id
                });
              }
            }
            })
          );
        }
      })
    );
  }

  openCategoryModal() {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.sharedService.setNewCategoryCreatedData({ categoryId: result.id });
        // Set the dropdown FormControl which will update the form via subscription
        this.selectedCategory.setValue({
          id: result.id,
          name: result.categoryData?.name || ''
        } as ICategoryDropdown);
      }
    });
  }

  openAttachment() {
    const data: IAttachmentModalData = {
      id: this.billId ? this.billId : 0,
      type: 'bills'
    };
    if (this.data.mode === 'new') {
      data.existingData = this.attachments;
    }

    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result.listData) {
        this.attachments = result.listData;
      }
    });
  }

  openComments() {
    const data: IAttachmentModalData = {
      id: this.billId ? this.billId : 0,
      type: 'bills'
    };
    if (this.data.mode === 'new') {
      data.existingData = this.comments;
    }

    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result.listData) {
        this.comments = result.listData;
      }
    });
  }

  istItemScroll() {
    this.invoiceService.listItemScrollEvent.next(true);
  }

  hasInvoiceItems() {
    return !!this.invoiceBillStateService.invoiceData()?.items?.length || !!this.data?.extractedData?.items?.length;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
