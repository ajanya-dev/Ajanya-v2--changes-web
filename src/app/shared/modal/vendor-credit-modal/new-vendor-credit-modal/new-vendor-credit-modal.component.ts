import { Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { finalize } from 'rxjs/operators';
import { IVendorData } from 'src/app/modules/vendor-credit/model/vendor';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IBankDropdown } from 'src/app/models/bank';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { DropDownCategoryComponent } from '../../../components/drop-downs/drop-down-category/drop-down-category.component';
import { AmountInputComponent } from '../../../components/amount-input/amount-input.component';
import { DropDownBankComponent } from '../../../components/drop-downs/drop-down-bank/drop-down-bank.component';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { DropDownPayeeComponent } from '../../../components/drop-downs/drop-down-payee/drop-down-payee.component';
import { IBill, IPagination } from 'src/app/modules/bill/model/Bill';
import { NgSelectModule } from '@ng-select/ng-select';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';

/**
 * @description Modal component for credit for vendor.
 */
@Component({
  selector: 'app-new-vendor-credit-modal',
  templateUrl: './new-vendor-credit-modal.component.html',
  styleUrls: ['./new-vendor-credit-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    DropDownPayeeComponent,
    ControlMessageComponent,
    DropDownBankComponent,
    AmountInputComponent,
    DropDownCategoryComponent,
    MatDialogActions,
    NgClass,
    NgIf,
    NgSelectModule
  ]
})
export class NewVendorCreditModalComponent implements OnInit, OnDestroy {
  vendorForm!: UntypedFormGroup;
  page = 1;
  payeeId!: string;
  submitting = false;
  subscriptions: Subscription[] = [];

  isBillActive = signal(false);
  diasbleBillToggle = signal(false);
  bills:IBill[] = [];
  selectedCreditType = signal<'bill' | 'payee'>('bill');
  isBill = signal(true);
  pagination: IPagination = {
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0
  };

  loadingBills = signal(false);
  searchTerm = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: string; vendorId: string },
    public formBuilder: UntypedFormBuilder,
    public datePipe: DatePipe,
    private _vendorService: VendorService,
    public _alertService: AlertService,
    public dailogRef: MatDialogRef<NewVendorCreditModalComponent>,
    public _sharedService: SharedService,
    public bankDataService: BankDataService,
    public billService: BillService
  ) {}

  ngOnInit(): void {
    this.getBills();
    this.initVendorCreditForm();

    if (this.data?.mode === 'edit') {
      this.getVendor(this.data.vendorId);
    }

    this.vendorForm.controls.bill.valueChanges.subscribe((value) => {
      if(value) {
        const bankAssociated = this.bills.find(bill => bill.billId === value)?.bankAccount;
        if(bankAssociated && bankAssociated?.bankAccountId) {
          this._sharedService.setNewBankCreatedData({
            bankAccountNickName: bankAssociated.bankAccountNickName
              ? bankAssociated.bankAccountNickName
              : bankAssociated.bankAccountName
          });
          const {bankAccount} = this.vendorForm.controls;
          bankAccount.setValue(bankAssociated.bankAccountId);
        }else{
          this._sharedService.setNewBankCreatedData(null);
          const {bankAccount} = this.vendorForm.controls;
          bankAccount.setValue('');
        }
      }
    });
  }

  /**
   * @description Initializes vendor form.
   */
  initVendorCreditForm() {
    this.vendorForm = this.formBuilder.group({
      bankAccount: [''],
      payee: [''],
      bill: [null],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      creditDate: ['', [Validators.required]],
      creditNo: ['', [Validators.required]],
      category: [''],
      accNo: [''],
      memo: ['']
    });
    this.updateFormValidators();
  }

  updateFormValidators() {
    const {bill, payee} = this.vendorForm.controls;
    const isBill =  this.isBill();
    bill.setValidators(isBill ? [Validators.required] : null);
    payee.setValidators(!isBill ? [Validators.required] : null);

    bill.updateValueAndValidity();
    payee.updateValueAndValidity();
  }

  /**
   * @description Loads the details of vendor and invokes `this.setEditData` method with the data,
   * to update the `vendorForm` with the data.
   * @param vendorId - ID of vendor.
   */
  getVendor(vendorId: string) {
    this.subscriptions.push(
      this._vendorService.getVendor(vendorId).subscribe((data) => {
        if (data?.success) {
          this.setEditData(data?.data[0]);
        }
      })
    );
  }

  /**
   * @description Sets the vendor data to the `vendorForm`.
   * Also sets bank, payee and category created data to shared service.
   * @param data
   */
  setEditData(data: IVendorData) {
    this._sharedService.setNewBankCreatedData({
      bankAccountNickName: data.bankAccount.bankAccountNickName
        ? data.bankAccount.bankAccountNickName
        : data.bankAccount.bankAccountName
    });
    this._sharedService.setNewPayeeCreatedData({
      payeeName: data.payee.payeeName
    });
    this._sharedService.setNewCategoryCreatedData({
      categoryName: data.category.categoryName
    });

    const creditDate = data.credit_date
      ? this.datePipe.transform(data.credit_date, 'yyyy-MM-dd')
      : null;

    this.vendorForm.controls.payee.setValue(data.payee?.payeeId || '');
    this.vendorForm.controls.bill.setValue(data.bill?.billId || null);
    this.vendorForm.controls.bankAccount.setValue(
      data.bankAccount.bankAccountId
    );
    this.vendorForm.controls.category.setValue(data.category.categoryId);
    this.vendorForm.controls.accNo.setValue(data.accountNo);
    this.vendorForm.controls.amount.setValue(data.amount);
    this.vendorForm.controls.creditDate.setValue(creditDate);
    this.vendorForm.controls.creditNo.setValue(data.creditNo);
    this.vendorForm.controls.memo.setValue(data.memo);
  }

  /**
   * @description Method invoked when `selectionEvent` is emitted by child component `app-drop-down-bank`.
   * Updates the `bankAccount` field of `vendroForm` with the data.
   * @param event - selectionEvent.
   */
  onBankAccountChange(event: IBankDropdown) {
    this.vendorForm.controls.bankAccount.setValue(event?.id);
  }

  /**
   * @description Method invoked when `selectionEvent` is emitted by child component `app-drop-down-payee`.
   * Updates the `payee` field of `vendorForm` with the data.
   * @param event - selectionEvent.
   */
  onPayeeChange(event: IPayeeDropdown) {
    this.vendorForm.controls.payee.markAsTouched();
    const val = event ? event.id : '';
    this.vendorForm.controls.payee.setValue(val);
  }

  /**
   * @description Method invoked when `selectionEvent` is emitted by child component `app-drop-down-category`.
   * Updates the `category` field of `vendorForm` with the data.
   * @param event - selectionEvent.
   */
  changeCat(event: ICategoryDropdown) {
    this.vendorForm.controls.category.setValue(event?.id);
  }

  /**p
   * @description Creates payload object for submitting, from `vendorForm`.
   * @returns - payload object.
   */
  getSubmitData() {
    const data = this.vendorForm.value;
    const newDate = this.datePipe.transform(
      data.creditDate,
      'MM/dd/yyyy'
    ) as string;

    return {
      bank_accountId: data.bankAccount,
      payeeId: data.payee,
      categoryId: data.category,
      creditNo: data.creditNo,
      creditDate: newDate,
      amount: data.amount,
      accountNo: data.accNo,
      memo: data.memo,
      isBill: this.isBill() ? 1 : 0,
      billId: data.bill
    };
  }

  /**
   * @description Method invoked when submitting the `vendorForm`.
   * Submits the payload data to the `addVendorCredit` method of vendor service.
   * If in edit mode, also submits the payload data along with vendor ID
   * to the `updateVendor` method of vendor service.
   */
  save() {
    if (this.vendorForm.invalid) {
      this.vendorForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const processedData = this.getSubmitData();

    // Edit
    if (this.data.mode === 'edit') {
      this.subscriptions.push(
        this._vendorService
          .updateVendor(this.data.vendorId, processedData)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe((data) => {
            if (data?.success) {
              this._alertService.successAlert({
                title: 'Success',
                content: 'Vendor credit updated',
                close: true,
                timeout: 2500
              });
              this.dailogRef.close({ success: true });
            }
          })
      );
      return;
    }

    // New
    this.subscriptions.push(
      this._vendorService
        .addVendorCredit(processedData)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((data) => {
          if (data?.success) {
            this._alertService.successAlert({
              title: 'Success',
              content: 'Vendor credit added',
              close: true,
              timeout: 2500
            });
            this.dailogRef.close({ success: true });
          }
        })
    );
  }

  getBills() {
    this.loadingBills.set(true);
    this.subscriptions.push(
      this._sharedService.getBills(this.page, this.searchTerm)
      .pipe(finalize(() => this.loadingBills.set(false)))
      .subscribe((data) => {
        if (data?.success) {
          this.bills = data?.data?.bills || [];
          this.pagination = data?.data?.pagination || this.pagination;
          this.isBill.set(this.bills.length > 0);
        }
      })
    );
  }

  onScrollToEnd() {
    // Check if more pages are available and not currently loading
    if (this.page >= this.pagination.lastPage || this.loadingBills()) {
      return;
    }

    this.page += 1;
    this.loadingBills.set(true);
    this.subscriptions.push(
      this._sharedService.getBills(this.page, this.searchTerm)
      .pipe(finalize(() => this.loadingBills.set(false)))
      .subscribe((data) => {
        if (data?.success) {
          this.bills=[...this.bills, ...data?.data?.bills || []];
          this.pagination = data?.data?.pagination || this.pagination;
        }
      })
    );
  }

  onSearch(event: KeyboardEvent) {
    this.searchTerm = (event?.target as HTMLInputElement).value;
    this.page = 1;
    this.loadingBills.set(true);
    this.subscriptions.push(
      this._sharedService.getBills(this.page, this.searchTerm)
      .pipe(finalize(() => this.loadingBills.set(false)))
      .subscribe((data) => {
        if (data?.success) {
          this.bills = data?.data?.bills || [];
          this.pagination = data?.data?.pagination || this.pagination;
        }
      })
    );
  }

  onCreditTypeChange(event: 'bill' | 'payee') {
    this.selectedCreditType.set(event);
    this.isBill.set(event === 'bill');
    this.updateFormValidators();
    }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
