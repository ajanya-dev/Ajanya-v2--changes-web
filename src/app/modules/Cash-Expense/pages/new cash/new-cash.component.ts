import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  Renderer2,
  ViewChild
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormArray
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  ICashExpenseDetails,
  ICashexpensePayeeSummary,
  INewCashExpense,
  IRemittance
} from 'src/app/modules/Cash-Expense/model/CashExpense';
import { DatePipe, NgClass, SlicePipe } from '@angular/common';
import {
  faCalculator,
  faCheck,
  faEnvelope,
  faLevelUp,
  faMinus,
  faPlus,
  faPlusSquare,
  faPrint,
  faReceipt,
  faSave
} from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { AddEmailPayeeModalComponent } from 'src/app/shared/modal/process-modal/add-email-payee-modal/add-email-payee-modal.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { NgSelectModule } from '@ng-select/ng-select';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CategoryDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { faTrash } from '@fortawesome/pro-regular-svg-icons';
import {
  IGetAttachment,
  IGetComment,
  IV3DropDownOnReady
} from 'src/app/models/common';
import { IBankDropdown } from 'src/app/models/bank';
import { DropDownBankCashComponent } from '../../components/drop-down-bank-cash/drop-down-bank-cash.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { CashExpenseGetReceiptModalComponent } from '../../modals/cash-expense-get-receipt-modal/cash-expense-get-receipt-modal.component';

interface ILoadingStates {
  save: boolean;
  saveAndNew: boolean;
  printCashExpense: boolean;
  email: boolean;
  signOnReceipt: boolean;
  print: boolean;
  [key: string]: boolean;
}

@Component({
  selector: 'app-new-cash',
  templateUrl: './new-cash.component.html',
  styleUrls: ['./new-cash.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DropDownBankCashComponent,
    AmountInputComponent,
    FontAwesomeModule,
    NgSelectModule,
    NgClass,
    SlicePipe,
    WhiteLabelPipe,
    PayeeDropdownV3Component,
    CommonInputFieldComponent,
    CategoryDropdownV3Component,
    CommonButtonV35Component,
    V35ControlMessageComponent
  ]
})
export class NewCashComponent implements OnInit, OnDestroy {
  private cashExpenseService = inject(CashExpenseService);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private validationService = inject(ValidationService);
  private payeeService = inject(PayeeService);
  private dialog = inject(MatDialog);
  private fb = inject(UntypedFormBuilder);
  private payeeModalService = inject(PayeeModalService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);
  private renderer = inject(Renderer2);

  @ViewChild('bankDropDown') bankDropDown: DropDownBankCashComponent;

  subscriptions: Subscription[] = [];
  dateToday: string;
  remittanceItem: string[] = [];
  isRemittanceSaved = false;
  isRemittence = false;
  editMode = false;
  isClone = false;
  cashExpenseId: string;
  selectedCashExpenseData = signal<ICashExpenseDetails | undefined>(undefined);
  grandTotal = 0;
  page = 1;
  payeeUpdated = false;
  isLoading = signal(false);
  payeeSummaryLoading = signal(false);
  loadingStates: ILoadingStates = {
    save: false,
    saveAndNew: false,
    printCashExpense: false,
    email: false,
    signOnReceipt: false,
    print: false
  };

  faPlus = faPlus;
  faCalculator = faCalculator;
  faSave = faSave;
  faPlusSquare = faPlusSquare;
  faEnvelope = faEnvelope;
  faPrint = faPrint;
  faReceipt = faReceipt;
  faCheck = faCheck;
  faTrash = faTrash;
  faMinus = faMinus;
  faLevelUp = faLevelUp;

  selectedBank: string;
  selectedPayee: IPayeeDropdown | null;
  selectedPayeeSummary: ICashexpensePayeeSummary | null;
  selectedCatagory: ICategoryDropdown;
  disableRemitAddBtn = true;

  createdExistingComments: IGetComment[] = [];
  createdExistingAttachments: IGetAttachment[] = [];
  cashTypeList = [
    {
      value: '1',
      name: 'Expense'
    },
    {
      value: '2',
      name: 'Income'
    }
  ];

  cashExpenseForm = new FormGroup({
    bankAccount: new FormControl<string | null>(null, [Validators.required]),
    payee: new FormControl<IPayeeDropdown | null | string>(null, [
      Validators.required
    ]),
    cashExpenseAmount: new FormControl<number | string>('', [
      Validators.required,
      Validators.max(99999999999.99)
    ]),
    cashExpenseDate: new FormControl('', [Validators.required]),
    category: new FormControl<ICategoryDropdown | null | string>(null),
    acc_no: new FormControl('', [Validators.maxLength(25)]),
    inv_no: new FormControl('', [Validators.maxLength(30)]),
    cashExpenseType: new FormControl('1', [Validators.required]),
    cashExpense_no: new FormControl<number | string>('', [
      Validators.required,
      Validators.maxLength(15)
    ]),
    memo: new FormControl('', [Validators.maxLength(150)]),
    fullTotalAmount: new FormControl('0'),
    attachRemittance: new FormControl('0'),
    remittance: new FormArray([this.remittanceFormBody()])
  });

  ngOnInit(): void {
    this.setCashExpenseDate();
    this.loadRemittanceItems();
    this.getRouteData();
    this.getSelectedPayee();
    this.getSelectedCategory();
  }

  loadRemittanceItems() {
    this.subscriptions.push(
      this.cashExpenseService
        .getCashExpenseRemittanceItems(this.page, '')
        .subscribe((res) => {
          if (res.success) {
            this.remittanceItem = res.data;
          }
        })
    );
    this.addRemittanceRow();
    this.getTotalAmount();
  }

  addRemittanceRow() {
    const addRow = this.getRemittanceFormControl();
    for (let i = 1; i <= 5; i += 1) {
      addRow.push(this.remittanceFormBody());
    }
  }

  getTotalAmount() {
    this.subscriptions.push(
      this.getGrandTotal.valueChanges.subscribe((data) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const total = data.reduce((a: any, b: any) => a + +b.totalSingleRow, 0);
        this.grandTotal = this.validationService.formateCurrency(total);
      })
    );
  }

  getRouteData() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((data) => {
        this.cashExpenseId = data.id;
        if (this.cashExpenseId !== undefined) {
          this.loadSelectedCashExpenseData(this.cashExpenseId);
          if (data?.isClone) {
            this.isClone = true;
            this.cashExpenseId = '';
          } else {
            this.editMode = true;
          }
        } else {
          this.removeLoadedSkelton();
        }
      })
    );
  }

  getSelectedPayee() {
    this.subscriptions.push(
      this.cashExpenseForm.controls.payee.valueChanges.subscribe((data) => {
        this.payeeDropDownChange(
          typeof data === 'string'
            ? ({ id: data } as IPayeeDropdown)
            : (data as IPayeeDropdown)
        );
      })
    );
  }

  getSelectedCategory() {
    this.subscriptions.push(
      this.cashExpenseForm.controls.category.valueChanges.subscribe((data) => {
        this.catagoryDropDownChange(data as ICategoryDropdown);
      })
    );
  }

  setCashExpenseDate(): void {
    const newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.cashExpenseForm.patchValue({ cashExpenseDate: newDate });
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  setDropDownAPIAndBindId(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  removeLoadedSkelton() {
    const elements = this.renderer
      .selectRootElement('.main_common_module', true)
      .querySelectorAll('.skelton');
    elements.forEach((item: HTMLElement) => {
      this.renderer.removeClass(item, 'skelton');
    });
  }

  // Load Check Data
  loadSelectedCashExpenseData(selectedId: string) {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.cashExpenseService
        .getCashExpensesById(selectedId)
        .pipe(
          finalize(() => {
            this.isLoading.set(false);
            this.removeLoadedSkelton();
        })
        )
        .subscribe((res) => {
          if (res.success) {
            this.selectedCashExpenseData.set(res.data as ICashExpenseDetails);
            this.loadPayeeDetails(
              this.selectedCashExpenseData()?.payee.payeeId as string
            );
            this.setCashExpenseData();
          }
        })
    );
  }

  // Load Check Serial Number
  loadCashExpenseSerialNo(bankId: string): void {
    if (!bankId) return;

    this.subscriptions.push(
      this.cashExpenseService
        .getCashExpenseSerialNo(bankId)
        .subscribe((res) => {
          if (res.success) {
            this.cashExpenseForm.patchValue({
              cashExpense_no: res.data[0]?.serialNo
            });
          }
        })
    );
  }

  /**
   *Load Payee Summary
   */
  //
  loadPayeeSummary(payeeId: string, setPayeeDetails?: boolean) {
    if (!payeeId) return;
    this.payeeSummaryLoading.set(true);
    this.subscriptions.push(
      this.cashExpenseService.getPayeeSummary(payeeId)
      .pipe(
        finalize(() => {
          this.payeeSummaryLoading.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.selectedPayeeSummary = res.data;
          if (setPayeeDetails) {
            if (this.selectedPayeeSummary?.summary?.payee_account_number) {
              this.cashExpenseForm.controls.acc_no.setValue(
                this.selectedPayeeSummary?.summary?.payee_account_number
              );
            }
            if (this.selectedPayeeSummary?.summary?.payee_category) {
              const expenceCategoryId =
                this.selectedPayeeSummary?.summary?.payee_category;
              this.cashExpenseForm.controls.category.setValue(
                expenceCategoryId
              );
              this.sharedService.setNewCategoryCreatedData({
                categoryId: expenceCategoryId
              });
            }
          }
        }
      })
    );
  }

  openPayeeShowAll(): void {
    if (this.selectedPayee == null || this.selectedPayee?.id == null) {
      const payeeContent = 'Please select a valid payee.';
      this.openWarningAlert(payeeContent);
      return;
    }
    const type = 2;
    this.router.navigate([
      `manage/payee/transaction-history/${this.selectedPayee.id}/${type}`
    ]);
  }

  // Load Payee Details
  loadPayeeDetails(payeeId: string) {
    if (!payeeId) return;
    this.subscriptions.push(
      this.payeeService.showPayee(payeeId).subscribe((res) => {
        if (res.success) {
          this.selectedPayee = res.data;
        }
      })
    );
  }

  // set check Data
  setCashExpenseData() {
    if (this.selectedCashExpenseData() == null) return;

    const tranDate = this.datePipe.transform(
      this.selectedCashExpenseData()?.transactionDate,
      'yyyy-MM-dd'
    );
    this.isRemittence =
      !!this.selectedCashExpenseData() &&
      (this.selectedCashExpenseData()?.remittance as IRemittance[]).length > 0;
    this.selectedCashExpenseData()?.remittance.forEach(
      (data: IRemittance, indx: number) => {
        if (!data.itemName) {
          (this.selectedCashExpenseData()?.remittance as IRemittance[])[
            indx
          ].itemName = null;
        }
      }
    );
    this.cashExpenseForm.patchValue({
      bankAccount: this.selectedCashExpenseData()?.bankAccount.bankAccountId,
      payee: this.selectedCashExpenseData()?.payee.payeeId,
      cashExpenseAmount: this.selectedCashExpenseData()?.grandTotal,
      cashExpenseDate: tranDate,
      category: this.selectedCashExpenseData()?.category.catogryId,
      acc_no: this.selectedCashExpenseData()?.cashExpAccountNo,
      inv_no: this.selectedCashExpenseData()?.cashExpInvoiceNo,
      cashExpenseType: this.selectedCashExpenseData()
        ?.transactionType as string,
      cashExpense_no: this.isClone
        ? ''
        : this.selectedCashExpenseData()?.serialNo.toString(),
      memo: this.selectedCashExpenseData()?.memo,
      remittance: this.selectedCashExpenseData()?.remittance
    });
    if (
      this.selectedCashExpenseData()?.bankAccount.bankAccountId &&
      this.isClone
    ) {
      this.loadCashExpenseSerialNo(
        this.selectedCashExpenseData()?.bankAccount.bankAccountId as string
      );
    }
  }

  createCashExpenseBody(): INewCashExpense {
    const data = this.cashExpenseForm.value;
    this.dateToday = this.datePipe.transform(
      data.cashExpenseDate,
      'yyyy-MM-dd'
    ) as string;
    const newDate: string = this.datePipe.transform(
      data.cashExpenseDate,
      'MM/dd/yyyy'
    ) as string;
    const regex = /[,]/g;
    const cashExpAmt2 = Number(
      data?.cashExpenseAmount?.toString().replace(regex, '')
    );
    const remittanceTotal2 = Number(
      this.grandTotal.toString().replace(regex, '')
    );
    return {
      ceBankAccount:
        this.selectedBank !== undefined
          ? this.selectedBank
          : (data.bankAccount as string),
      payeeId:
        this.selectedPayee !== undefined
          ? (this.selectedPayee?.id as string)
          : (data.payee as string),
      ceAmount: cashExpAmt2,
      transactionDate: newDate,
      categoryId:
        this.selectedCatagory !== undefined
          ? this.selectedCatagory?.id
          : (data.category as string),
      cashexpAccountNumber: data?.acc_no || '',
      ceSerialNumber: Number(data?.cashExpense_no) || 0,
      cashexpInvoiceNo: data?.inv_no || '',
      transactionType: data?.cashExpenseType || '1',
      ceMemo: data?.memo || '',
      fullTotalAmount: remittanceTotal2,
      attachRemittance: this.isRemittanceSaved ? '1' : '0',
      remittance:
        (data?.remittance?.filter(
          (x) => x.totalSingleRow !== 0
        ) as IRemittance[]) || [],
      all_attachments: this.createdExistingAttachments.map(
        (e) => e.encrypted_id
      ),
      all_comments: this.createdExistingComments.map((e) => e.encrypted_id)
    };
  }

  remittanceFormBody() {
    return this.fb.group({
      invoiceNumber: [''],
      itemName: [null],
      itemDescription: [''],
      itemQuantity: [''],
      itemUnitCost: [''],
      totalSingleRow: ['']
    });
  }

  onSubmit(buttonType: string): void {
    this.payeeUpdated = false;

    this.cashExpenseForm.markAllAsTouched();
    if (this.cashExpenseForm.invalid) {
      return;
    }

    const loadingKey = buttonType === 'Email' ? 'email' : buttonType;
    
    if (this.loadingStates[loadingKey]) {
      return;
    }
    this.loadingStates[loadingKey] = true;

    if (buttonType === 'Email') {
      
      if (!this.selectedPayee?.email) {
        const payeeContent = this.alertService.warningAlert({
          content: 'Payee email address is not found',
          doneMsg: 'Add Now',
          isCancel: true,
          cancelMsg: 'Cancel'
        });
        payeeContent.afterClosed().subscribe((res) => {
          if (res) {
            const dialogRef = this.dialog.open(AddEmailPayeeModalComponent, {
              disableClose: true,
              data: this.selectedPayee,
              width: '550px'
            });

            dialogRef.afterClosed().subscribe((resp) => {
              if (resp) {
                this.sharedService.setNewPayeeCreatedData({
                  payeeId: this.selectedPayee?.id as string
                });
                this.payeeService
                  .showPayee(this.selectedPayee?.id as string)
                  .subscribe((result) => {
                    this.selectedPayee = result.data;
                    if (result.success) {
                      this.onSubmit('Email');
                    } else {
                      this.loadingStates.email = false;
                    }
                  });
              } else {
                this.loadingStates.email = false;
              }
            });
          } else {
            this.loadingStates.email = false;
          }
        });
        return;
      }
    }

    if (buttonType === 'printCashExpense') {
      if (this.editMode) {
        // allow printing with already saved details.
        const payeeContent =
          'Receipt will show only already saved details for deleted payee. Are you sure you want to continue?';
        const alert = this.openConfirmAlert(payeeContent);
        this.subscriptions.push(
          alert.afterClosed().subscribe((result) => {
            if (result) {
              this.onRedirect(buttonType, true);
            } else {
              this.loadingStates[loadingKey] = false;
            }
          })
        );
        return;
      }
    }

    if(buttonType === 'SignOnReceipt') {
      const isCashExpenseType = this.cashExpenseForm.get('cashExpenseType')?.value;
      if( isCashExpenseType !== '1' && buttonType === 'SignOnReceipt') {
        this.loadingStates[loadingKey] = false;
        this.openWarningAlert('Facility not available for Income entries');
        return;
      }
    }

    if (!this.editMode) this.onNewCashExpense(buttonType);
    else this.onUpdateCashExpense(buttonType);
  }

  // New Check
  onNewCashExpense(buttonType: string) {
    const loadingKey = buttonType === 'Email' ? 'email' : buttonType;
    this.subscriptions.push(
      this.cashExpenseService
        .createCashExpense(this.createCashExpenseBody())
        .pipe(
          finalize(() => {
            this.loadingStates[loadingKey] = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.cashExpenseId = res.data.id;
            this.onRedirect(buttonType, false);
          }
        })
    );
  }

  // Update Check
  onUpdateCashExpense(buttonType: string) {
    const loadingKey = buttonType === 'Email' ? 'email' : buttonType;
    this.subscriptions.push(
      this.cashExpenseService
        .updateCashExpense(this.cashExpenseId, this.createCashExpenseBody())
        .pipe(
          finalize(() => {
            this.loadingStates[loadingKey] = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.onRedirect(buttonType, true);
          }
        })
    );
  }

  // Check Which action button clicked
  onRedirect(buttonType: string, edit: boolean): void {
    const createContent = 'Cash expense created.';
    const updateContent = 'Cash expense updated.';
    const cloneContent = 'Cash expense cloned.';

    let alertContent: string;

    if (this.isClone) {
      alertContent = cloneContent;
    } else if (edit) {
      alertContent = updateContent;
    } else {
      alertContent = createContent;
    }

    // Now alertContent will hold the appropriate value based on the conditions

    switch (buttonType) {
      case 'save':
        this.onSaveCashExpense(alertContent);
        break;
      case 'saveAndNew':
        this.onSaveAndNew(alertContent);
        break;
      case 'printCashExpense':
        this.onPrintCashExpense();
        break;
      case 'Email':
        this.onEmailCashExpense(alertContent);
        break;
      case 'SignOnReceipt':
        this.onGetReceipt();
        break;
      default:
        break;
    }
  }

  onSaveCashExpense(Alertcontent: string) {
    this.openSuccessAlert(Alertcontent);
    this.navigateByUrl('/manage/cashexp');
  }

  onSaveAndNew(Alertcontent: string) {
    this.openSuccessAlert(Alertcontent);

    this.cashExpenseForm.reset();
    this.cashExpenseForm.patchValue({ cashExpenseDate: this.dateToday });
    this.cashExpenseService.setNewCashAccountCreatedData(null);
    this.sharedService.setNewPayeeCreatedData(null);
    this.sharedService.setNewCategoryCreatedData(null);
    this.cashExpenseForm.patchValue({ cashExpenseType: '1' });
  }

  onEmailCashExpense(Alertcontent: string) {
    if (!this.selectedPayee?.email) {
      this.loadingStates.email = false;
      this.alertService.failedAlert({
        content: `${Alertcontent} Email id for payee not found.`
      });
      this.navigateByUrl('/manage/cashexp');
      return;
    }
    const content = `${
      Alertcontent
    } Are you sure you want to send the email to "${
      this.selectedPayee.email
    }"?`;
    const alert = this.openConfirmAlert(content);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.loadingStates.email = true;
          this.subscriptions.push(
            this.cashExpenseService
              .sendEmail(this.cashExpenseId, {
                email: this.selectedPayee?.email as string
              })
              .pipe(
                finalize(() => {
                  this.loadingStates.email = false;
                })
              )
              .subscribe((data) => {
                if (data?.success) {
                  this.openSuccessAlert(data?.data);
                } else {
                  this.alertService.failedAlert({ content: data.errorMsg });
                }
                this.navigateByUrl('/manage/cashexp');
              })
          );
        } else {
          this.loadingStates.email = false;
          this.openSuccessAlert(`${Alertcontent} Not Emailed.`);
          this.navigateByUrl('/manage/cashexp');
        }
      })
    );
  }

  /**
   * Payee Dropdown change
   */
  payeeDropDownChange(event: IPayeeDropdown): void {
    if (!event || event == null) {
      this.selectedPayeeSummary = null;
      this.selectedPayee = null;
      return;
    }

    if (this.selectedPayee?.id === event?.id || !event?.id || event?.id === 'add-new') return;
    this.selectedPayee = event;
    this.loadPayeeSummary(event?.id, true);
    this.cashExpenseForm.controls.payee.markAsTouched();
    this.cashExpenseForm.controls.payee.setValue(event?.id);
  }

  catagoryDropDownChange(event: ICategoryDropdown): void {
    if (this.selectedCatagory?.id === event?.id || !event?.id) return;
    this.selectedCatagory = event;
    this.cashExpenseForm.controls.category.markAsTouched();
    this.cashExpenseForm.controls.category.setValue(event?.id);
  }

  bankDropDownChange(event: IBankDropdown): void {
    this.selectedBank = event?.id;
    this.loadCashExpenseSerialNo(this.selectedBank);
    this.cashExpenseForm.controls.bankAccount.markAsTouched();
    this.cashExpenseForm.controls.bankAccount.setValue(this.selectedBank);
  }

  // ------------------------------->REMITTANCE-----------------------------
  onSaveRemittance(): void {
    const content = 'Remittance Saved to this cash expense.';
    this.openSuccessAlert(content);
    this.isRemittanceSaved = true;
    this.isRemittence = !this.isRemittence;
  }

  addNewRow(): void {
    const addRow = this.getRemittanceFormControl();
    addRow.push(this.remittanceFormBody());

    if (this.getRemittanceFormControl().controls.length >= 10) {
      this.disableRemitAddBtn = false;
    }
  }

  removeRow(): void {
    const removeitem = this.getRemittanceFormControl();
    if (removeitem.length > 1) removeitem.removeAt(removeitem.length - 1);

    if (this.getRemittanceFormControl().controls.length < 10) {
      this.disableRemitAddBtn = true;
    }
  }

  removeSelectedRow(i: number) {
    const removeitem = this.getRemittanceFormControl();
    if (removeitem.length > 1) {
      removeitem.removeAt(i);
      this.isRemittanceSaved = false;
    }
  }

  clearAllRow() {
    const content = 'Clear all data.';
    const alert = this.openConfirmAlert(content);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          const removeitem = this.getRemittanceFormControl();
          removeitem.reset();
          this.grandTotal = 0;
          this.isRemittanceSaved = false;
        }
      })
    );
  }

  insertRemiValueToCashExpense(): void {
    this.cashExpenseForm.patchValue({
      cashExpenseAmount: this.grandTotal.toString()
    });
    this.isRemittence = !this.isRemittence;
  }

  total(i: number) {
    const control = this.getRemittanceFormControl();
    const formGroup = control.controls[i] as UntypedFormGroup;

    const quantity = Number(formGroup.get('itemQuantity')?.value);
    const unitCost = Number(formGroup.get('itemUnitCost')?.value);
    const total = quantity * unitCost;
    if (!Number.isNaN(total)) {
      formGroup.get('totalSingleRow')?.setValue(total);
    } else {
      formGroup.get('totalSingleRow')?.setValue(0.0);
    }
  }

  get getGrandTotal() {
    return this.cashExpenseForm.get('remittance') as FormArray;
  }

  getRemittanceFormControl() {
    return this.cashExpenseForm.get('remittance') as FormArray;
  }

  showRemittence(): void {
    this.isRemittence = !this.isRemittence;
  }

  // ------------->Remittance Item Drop Down-------------------------

  onScrollItems() {
    this.page += 1;
    this.subscriptions.push(
      this.cashExpenseService
        .getCashExpenseRemittanceItems(this.page, '')
        .pipe()
        .subscribe((res) => {
          res.data.forEach((element) => {
            this.remittanceItem.push(element);
          });
        })
    );
  }

  onSearchItems(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.subscriptions.push(
      this.cashExpenseService
        .getCashExpenseRemittanceItems(this.page, searchTerm)
        .pipe()
        .subscribe((res) => {
          this.remittanceItem = res.data;
        })
    );
  }

  setCashExpenseFormValue(name: string, value: string) {
    return this.cashExpenseForm.get(name)?.setValue(value);
  }

  navigateByUrl(url: string) {
    this.router.navigateByUrl(url);
  }

  openPayeeModal(fromComponent?: number | undefined): void {
    let showEdit = true;
    if (fromComponent !== undefined) {
      showEdit = false;
    } else {
      showEdit = !!(
        this.selectedPayee?.id !== undefined && this.selectedPayee?.id !== null
      );
    }
    if (!showEdit) {
      this.subscriptions.push(
        this.payeeModalService
          .openAddPayee(undefined, {
            slug: 'cashexp'
          })
          .subscribe((payeeModal) => {
            if (payeeModal) {
              this.subscriptions.push(
                payeeModal.afterClosed().subscribe((res) => {
                  if (res?.success) {
                    this.sharedService.setNewPayeeCreatedData({
                      payeeId: res.id
                    });
                    this.payeeUpdated = true;
                    this.setCashExpenseFormValue('payee', res.id);
                    this.loadPayeeDetails(res.id);
                  }
                })
              );
            }
          })
      );
    } else {
      this.subscriptions.push(
        this.payeeModalService
          .openEditPayee(this.selectedPayee?.id as string, '', {
            slug: 'cashexp',
            edit: showEdit,
            id: this.selectedPayee?.id as string
          })
          .subscribe((payeeModal) => {
            if (payeeModal) {
              this.subscriptions.push(
                payeeModal.afterClosed().subscribe((res) => {
                  if (res?.success) {
                    this.sharedService.setNewPayeeCreatedData({
                      payeeId: res.id
                    });
                    this.payeeUpdated = true;
                    this.setCashExpenseFormValue('payee', res.id);
                    this.loadPayeeDetails(res.id);
                  }
                })
              );
            }
          })
      );
    }
  }

  openAttachment(): void {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        slug: 'cashexp',
        id:
          this.cashExpenseId === '' || this.cashExpenseId === undefined
            ? 0
            : this.cashExpenseId,
        type: 'cash-expenses',
        existingData: this.createdExistingAttachments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.listData !== undefined) {
        this.createdExistingAttachments = res?.listData;
      }
    });
  }

  openComments(): void {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data: {
        slug: 'cashexp',
        id:
          this.cashExpenseId === '' || this.cashExpenseId === undefined
            ? 0
            : this.cashExpenseId,
        type: 'cash-expenses',
        existingData: this.createdExistingComments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.listData !== undefined) {
        this.createdExistingComments = res?.listData;
      }
    });
  }

  //= ===> Alerts
  openConfirmAlert(content: string) {
    const data = {
      title: 'Are you Sure?',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  openSuccessAlert(content?: string, disable?: boolean) {
    const data = {
      title: 'Success!',
      content: content !== undefined ? content : 'Cash Expense Created.',
      close: disable !== undefined ? disable : true,
      timeout: 3000
    };
    return this.alertService.successAlert(data);
  }

  openWarningAlert(content: string) {
    const data = {
      title: 'Warning!',
      content,
      doneMsg: 'OK',
      cancelMsg: 'cancel'
    };
    return this.alertService.warningAlert(data);
  }

  onPrintCashExpense() {
    this.loadingStates.printCashExpense = true;
    this.subscriptions.push(
      this.cashExpenseService
        .printCashExpense(this.cashExpenseId)
        .pipe(
          finalize(() => {
            this.loadingStates.printCashExpense = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const iframes = document.querySelectorAll('iframe');
            for (let i = 0; i < iframes.length; i += 1) {
              iframes[i]?.parentNode?.removeChild(iframes[i]);
            }
            const iframe = document.createElement('iframe');
            iframe.srcdoc = res.data.printData;
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
            if(!this.isClone && !this.editMode) {
              this.resetForm();
            }
          }
        })
    );
  }

  resetForm() {
    this.cashExpenseForm.reset();
    this.cashExpenseForm.patchValue({ cashExpenseDate: this.dateToday });
    this.cashExpenseForm.patchValue({ cashExpenseType: '1' });
    this.selectedPayeeSummary = null;
    this.selectedPayee = null;
    this.bankDropDown.selectedItem = null;
  }

  onGetReceipt(): void {
      const dialogRef = this.dialog.open(CashExpenseGetReceiptModalComponent, {
        maxWidth: '500px',
        width: '93%',
        data: {
          slug: 'cashexp',
          cashExpenseData: { id: this.cashExpenseId }
        }
      });

      dialogRef.afterClosed().subscribe((res) => {
        // Reset loading state when modal closes
        this.loadingStates.signOnReceipt = false;
        if (res) {
          this.navigateByUrl('/manage/cashexp');
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
