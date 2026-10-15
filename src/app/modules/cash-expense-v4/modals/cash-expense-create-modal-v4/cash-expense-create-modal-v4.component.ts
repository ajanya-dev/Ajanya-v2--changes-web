import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog
} from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';

import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { CashExpenseV4StateService } from '../../services/cash-expense-v4-state.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';

import {
  ICashExpenseDetails,
  ICashexpensePayeeSummary,
  INewCashExpense
} from 'src/app/modules/Cash-Expense/model/CashExpense';
import { IBankDropdown } from 'src/app/models/bank';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IGetAttachment, IGetComment } from 'src/app/models/common';

import { NewCashAccountModalV4Component } from '../new-cash-account-modal-v4/new-cash-account-modal-v4.component';
import {
  CashExpenseRemittanceModalV4Component,
  ICashExpenseRemittanceModalResult,
  IRemittanceRow
} from '../cash-expense-remittance-modal-v4/cash-expense-remittance-modal-v4.component';
import { PaymentsPayeeListComponent } from 'src/app/modules/payments-v4/shared/components/payments-payee-list/payments-payee-list.component';
import { PaymentsBankListComponent } from 'src/app/modules/payments-v4/shared/components/payments-bank-list/payments-bank-list.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { CashExpenseGetReceiptModalV4Component } from '../cash-expense-get-receipt-modal-v4/cash-expense-get-receipt-modal-v4.component';
import { AddEmailPayeeModalV4Component } from 'src/app/shared/modal/process-modal/add-email-payee-modal-v4/add-email-payee-modal-v4.component';

export interface ICashExpenseCreateModalData {
  mode: 'create' | 'edit' | 'clone';
  id?: string;
}

@Component({
  selector: 'app-cash-expense-create-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    DatePipe,
    DecimalPipe,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonAmountInputV4Component,
    V4ControlMessageComponent,
    CategoryDropdownV4Component,
    PaymentsPayeeListComponent,
    PaymentsBankListComponent,
    CommonInputFieldV4Component,
    V4DatePickerComponent
  ],
  templateUrl: './cash-expense-create-modal-v4.component.html',
  styleUrls: ['./cash-expense-create-modal-v4.component.scss']
})
export class CashExpenseCreateModalV4Component implements OnInit, AfterViewInit {
  private el = inject(ElementRef);
  private cashExpenseService = inject(CashExpenseService);
  private alertService = inject(V4AlertService);
  private sharedService = inject(SharedService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<CashExpenseCreateModalV4Component>);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);
  private cashExpenseStateService = inject(CashExpenseV4StateService);
  data: ICashExpenseCreateModalData = inject(MAT_DIALOG_DATA);

  @ViewChild(PaymentsPayeeListComponent) private payeeListRef?: PaymentsPayeeListComponent;
  @ViewChild(PaymentsBankListComponent) private bankListRef?: PaymentsBankListComponent;

  isLoading = signal(false);
  savingAction = signal<'save' | 'saveAndNew' | 'print' | 'email' | 'signOnReceipt' | null>(null);
  isSaving = signal(false);
  isEmailSending = signal(false);
  selectedCategory = signal<ICategoryDropdown | null>(null);
  remittanceRows = signal<IRemittanceRow[]>([]);
  grandTotal = computed(() =>
    this.remittanceRows().reduce((sum, r) => sum + (parseFloat(r.totalSingleRow) || 0), 0)
  );
  existingAttachments = signal<IGetAttachment[]>([]);
  existingComments = signal<IGetComment[]>([]);
  payeeSummary = signal<ICashexpensePayeeSummary | null>(null);
  isPayeeSummaryLoading = signal(false);
  cardTop = signal('0px');
  cardLeft = signal('0px');
  mode = signal<ICashExpenseCreateModalData['mode']>(this.data.mode || 'create');

  get showGetSignedReceipt(): boolean {
    return this.cashExpenseForm.controls.cashExpenseType.value === '1';
  }

  get hasAmount(): boolean {
    const val = this.cashExpenseForm.controls.cashExpenseAmount.value;
    return val !== null && val !== '' && Number(val?.toString().replace(/,/g, '')) > 0;
  }

  get hasPayee(): boolean {
    return !!this.cashExpenseForm.controls.payee.value;
  }

  get hasBankAccount(): boolean {
    return !!this.cashExpenseForm.controls.bankAccount.value;
  }

  get showPayeeSection(): boolean {
    return this.data.mode !== 'create' || this.hasAmount;
  }

  get showBankSection(): boolean {
    return this.data.mode !== 'create' || (this.hasAmount && this.hasPayee);
  }

  get showDetailsSection(): boolean {
    return this.data.mode !== 'create' || (this.hasAmount && this.hasPayee && this.hasBankAccount);
  }

  cashExpenseForm = new FormGroup({
    bankAccount: new FormControl<IBankDropdown | null>(null, [Validators.required]),
    payee: new FormControl<IPayeeDropdown | null>(null, [Validators.required]),
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
    attachRemittance: new FormControl('0')
  });

  cashTypeList = [
    { value: '1', name: 'Expense' },
    { value: '2', name: 'Income' }
  ];

  get title(): string {
    switch (this.data.mode) {
      case 'edit':
        return 'Edit Cash Expense';
      case 'clone':
        return 'Clone Cash Expense';
      default:
        return 'New Cash Expense';
    }
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  ngOnInit(): void {
    this.setCashExpenseDate();

    if (this.data.id && (this.data.mode === 'edit' || this.data.mode === 'clone')) {
      this.loadCashExpenseData(this.data.id);
    }

    this.cashExpenseForm.controls.category.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val && typeof val !== 'string') {
          this.selectedCategory.set(val as ICategoryDropdown);
        }
      });

    this.cashExpenseForm.controls.payee.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payee) => {
        if (payee?.id) {
          this.loadPayeeSummary(payee.id);
        } else {
          this.payeeSummary.set(null);
        }
      });
  }

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    // Wait for the dialog open animation to finish before calculating card position
    setTimeout(() => {
      this.updateCardPosition();
      this.observePaneResize();
    }, 200);

    this.destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateCardPosition();
  }

  private observePaneResize(): void {
    const pane = this.el.nativeElement.closest?.('.cdk-overlay-pane') as HTMLElement | null;
    if (!pane) return;
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => this.updateCardPosition());
    });
    this.resizeObserver.observe(pane);
  }

  private updateCardPosition(): void {
    const pane = this.el.nativeElement.closest?.('.cdk-overlay-pane') as HTMLElement | null;
    if (!pane) return;
    const rect = pane.getBoundingClientRect();
    this.cardTop.set(`${rect.top}px`);
    this.cardLeft.set(`${rect.right + 16}px`);
  }

  loadPayeeSummary(payeeId: string): void {
    this.isPayeeSummaryLoading.set(true);
    this.cashExpenseService
      .getPayeeSummary(payeeId)
      .pipe(
        finalize(() => this.isPayeeSummaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) this.payeeSummary.set(res.data);
      });
  }

  setCashExpenseDate(): void {
    const newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.cashExpenseForm.patchValue({ cashExpenseDate: newDate });
  }

  loadCashExpenseData(id: string): void {
    this.isLoading.set(true);
    this.cashExpenseService
      .getCashExpensesById(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const data = (Array.isArray(res.data) ? res.data[0] : res.data) as ICashExpenseDetails;
          this.patchFormFromData(data);
        }
      });
  }

  patchFormFromData(data: ICashExpenseDetails): void {
    const tranDate = this.datePipe.transform(data.transactionDate, 'yyyy-MM-dd');
    this.cashExpenseForm.patchValue({
      cashExpenseAmount: data.grandTotal,
      cashExpenseDate: tranDate,
      category: data.category?.catogryId,
      acc_no: data.cashExpAccountNo,
      inv_no: data.cashExpInvoiceNo,
      cashExpenseType: String(data.transactionType),
      cashExpense_no: this.data.mode === 'clone' ? '' : data.serialNo?.toString(),
      memo: data.memo
    });

    if (data.remittance?.length) {
      this.remittanceRows.set(data.remittance.map((r: any) => ({
        id: Math.random().toString(36).slice(2),
        invoiceNumber: r.invoiceNumber || '',
        itemName: r.itemName || null,
        itemDescription: r.itemDescription || '',
        itemQuantity: r.itemQuantity?.toString() || '',
        itemUnitCost: r.itemUnitCost?.toString() || '',
        totalSingleRow: r.totalSingleRow?.toString() || '0.00'
      })));
    }

    if (data.payee?.payeeId) {
      this.payeeListRef?.setPayeeById(data.payee.payeeId);
    }

    if (data.bankAccount?.bankAccountId) {
      this.bankListRef?.setBankById(data.bankAccount.bankAccountId);
      if (this.data.mode === 'clone') {
        this.loadSerialNo(data.bankAccount.bankAccountId);
      }
    }
  }

  onPayeeSelected(payee: IPayeeDropdown | null): void {
    this.cashExpenseForm.controls.payee.setValue(payee);
    this.cashExpenseForm.controls.payee.markAsTouched();
  }

  onBankSelected(bank: IBankDropdown | null): void {
    this.cashExpenseForm.controls.bankAccount.setValue(bank);
    this.cashExpenseForm.controls.bankAccount.markAsTouched();
    if (bank?.id) {
      this.loadSerialNo(bank.id);
    } else {
      this.cashExpenseForm.controls.cashExpense_no.setValue('');
    }
  }

  loadSerialNo(bankId: string): void {
    if (!bankId) return;
    this.cashExpenseService
      .getCashExpenseSerialNo(bankId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.cashExpenseForm.patchValue({
            cashExpense_no: res.data[0]?.serialNo
          });
        }
      });
  }

  categoryDropDownChange(event: ICategoryDropdown): void {
    if (!event?.id) return;
    this.selectedCategory.set(event);
    this.cashExpenseForm.controls.category.markAsTouched();
    this.cashExpenseForm.controls.category.setValue(event.id);
  }

  openTransactionHistoryModal(): void {
    const payee = this.cashExpenseForm.controls.payee.value;
    if (!payee?.id) return;
    // Close the create modal and route to the full v4 transaction history
    // page. The trailing `2` is the fixed tab param (Cash Expenses) and
    // must not be derived from anything else.
    this.dialogRef.close();
    this.router.navigateByUrl(`/v4/manage/transaction-history/${payee.id}/2`);
  }

  openRemittanceModal(): void {
    const ref = this.dialog.open(CashExpenseRemittanceModalV4Component, {
      width: '100%',
      maxWidth: '1050px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { rows: this.remittanceRows() }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: ICashExpenseRemittanceModalResult | null) => {
      if (result) {
        this.remittanceRows.set(result.rows);
        if (result.insertIntoCashExpense) {
          this.cashExpenseForm.patchValue({ cashExpenseAmount: result.total.toString() });
        }
      }
    });
  }

  // Submit
  onSubmit(action: 'save' | 'saveAndNew' | 'print' | 'email' | 'signOnReceipt'): void {
    this.cashExpenseForm.markAllAsTouched();
    if (this.cashExpenseForm.invalid) return;
    if (this.isSaving()) return;

    if (action === 'signOnReceipt' && this.cashExpenseForm.controls.cashExpenseType.value !== '1') {
      this.alertService.warningAlert({ content: 'Facility not available for Income entries.' });
      return;
    }

    this.isSaving.set(true);
    this.savingAction.set(action);
    const body = this.buildPayload();

    if (this.isEditMode && this.data.id) {
      this.cashExpenseService
        .updateCashExpense(this.data.id, body)
        .pipe(
          finalize(() => { this.isSaving.set(false); this.savingAction.set(null); }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.handleSuccess('Cash expense updated.', action, this.data.id!);
          }
        });
    } else {
      this.cashExpenseService
        .createCashExpense(body)
        .pipe(
          finalize(() => { this.isSaving.set(false); this.savingAction.set(null); }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            const msg = this.data.mode === 'clone' ? 'Cash expense cloned.' : 'Cash expense created.';
            this.handleSuccess(msg, action, res.data.id);
          }
        });
    }
  }

  private handleSuccess(message: string, action: string, id: string): void {
    this.alertService.successAlert({
      title: 'Success!',
      content: message,
      close: true
    });

    if (action === 'signOnReceipt') {
      this.openGetSignedReceiptForId(id);
      return;
    }

    if (action === 'print') {
      this.cashExpenseService
        .printCashExpense(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res.success) {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((el) => el.parentNode?.removeChild(el));
            const iframe = document.createElement('iframe');
            iframe.srcdoc = res.data.printData;
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
          }
          this.dialogRef.close({ success: true });
        });
      return;
    }

    if (action === 'email') {
      this.sendEmailForId(id);
      return;
    }

    if (action === 'saveAndNew') {
      this.cashExpenseStateService.activeTab.set('transactions');
      this.cashExpenseStateService.refreshList();
      this.cashExpenseForm.reset();
      this.setCashExpenseDate();
      this.cashExpenseForm.patchValue({ cashExpenseType: '1' });
      this.selectedCategory.set(null);
      this.existingAttachments.set([]);
      this.existingComments.set([]);
      this.remittanceRows.set([]);
      this.cashExpenseService.setNewCashAccountCreatedData(null);
      this.sharedService.setNewPayeeCreatedData(null);
      this.sharedService.setNewCategoryCreatedData(null);
    } else {
      this.dialogRef.close({ success: true });
    }
  }

  private sendEmailForId(id: string): void {
    const payee = this.cashExpenseForm.controls.payee.value;
    if (!payee?.email) {
      const ref = this.dialog.open(AddEmailPayeeModalV4Component, {
        width: '500px',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: payee
      });
      ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((email: string) => {
        if (email) {
          this.doSendEmail(id, email);
        } else {
          this.dialogRef.close({ success: true });
        }
      });
      return;
    }
    this.doSendEmail(id, payee.email);
  }

  private doSendEmail(id: string, email: string): void {
    const payeeName = this.cashExpenseForm.controls.payee.value?.name || email;
    this.alertService
      .confirmAlert({
        content: `Are you sure you want to send the email to "${email}"?`,
        cancelMsg: 'Cancel',
        doneMsg: 'Send'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          this.dialogRef.close({ success: true });
          return;
        }
        this.isEmailSending.set(true);
        this.cashExpenseService
          .sendEmail(id, { email })
          .pipe(
            finalize(() => this.isEmailSending.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({ title: 'Success!', content: `Email sent to ${payeeName}.`, close: true });
            }
            this.dialogRef.close({ success: true });
          });
      });
  }

  openAddAttachment(): void {
    const id = this.isEditMode && this.data.id ? this.data.id : 0;
    const ref = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id,
        type: 'cash-expenses',
        existingData: this.existingAttachments()
      }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      if (res?.existingData) {
        this.existingAttachments.set(res.existingData);
      }
    });
  }

  openAddComment(): void {
    const id = this.isEditMode && this.data.id ? this.data.id : 0;
    const ref = this.dialog.open(V4CheckAddCommentModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id,
        type: 'cash-expenses',
        enableDelete: true,
        existingData: this.existingComments()
      }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      if (res?.existingData) {
        this.existingComments.set(res.existingData);
      }
    });
  }

  openGetSignedReceipt(): void {
    if (!this.data.id) return;
    this.openGetSignedReceiptForId(this.data.id);
  }

  private openGetSignedReceiptForId(id: string): void {
    const ref = this.dialog.open(CashExpenseGetReceiptModalV4Component, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { cashExpenseId: id }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result?.success) {
        this.dialogRef.close({ success: true });
      }
    });
  }

  private buildPayload(): INewCashExpense {
    const data = this.cashExpenseForm.value;
    const newDate = this.datePipe.transform(data.cashExpenseDate, 'MM/dd/yyyy') as string;
    const regex = /[,]/g;
    const cashExpAmt = Number(data?.cashExpenseAmount?.toString().replace(regex, ''));
    const remittanceTotal = this.grandTotal();
    const filledRows = this.remittanceRows().filter(r => parseFloat(r.totalSingleRow) > 0 || r.invoiceNumber);

    return {
      ceBankAccount: this.cashExpenseForm.controls.bankAccount.value?.id || '',
      payeeId: this.cashExpenseForm.controls.payee.value?.id || '',
      ceAmount: cashExpAmt,
      transactionDate: newDate,
      categoryId: this.selectedCategory()?.id || (data.category as string),
      cashexpAccountNumber: data?.acc_no || '',
      ceSerialNumber: Number(data?.cashExpense_no) || 0,
      cashexpInvoiceNo: data?.inv_no || '',
      transactionType: data?.cashExpenseType || '1',
      ceMemo: data?.memo || '',
      fullTotalAmount: remittanceTotal,
      attachRemittance: filledRows.length > 0 ? '1' : '0',
      remittance: filledRows.map(r => ({
        invoiceNumber: r.invoiceNumber,
        itemName: r.itemName,
        itemDescription: r.itemDescription,
        itemQuantity: r.itemQuantity,
        itemUnitCost: r.itemUnitCost,
        totalSingleRow: r.totalSingleRow
      })),
      all_attachments: this.existingAttachments().map((e) => e.encrypted_id),
      all_comments: this.existingComments().map((e) => (e as IGetComment).encrypted_id)
    };
  }

  openNewCashAccountModal(): void {
    const ref = this.dialog.open(NewCashAccountModalV4Component, {
      width: '500px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded'
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result?.success && result?.id) {
        this.cashExpenseService.setNewCashAccountCreatedData({
          cashAccountId: result.id,
          bankAccountName: result.name || ''
        });
        const newCashAccount = {
          id: result.id,
          bankName: result.name || '',
          nickName: result.name || '',
          accountNumber: '',
          cashAccount: 1
        } as any;
        this.bankListRef?.selectCashAccount(newCashAccount);
        this.onBankSelected(newCashAccount);
        this.loadSerialNo(result.id);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
