import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { finalize } from 'rxjs/operators';
import { IVendorData } from 'src/app/modules/vendor-credit/model/vendor';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IBankDropdown } from 'src/app/models/bank';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IBill, IPagination } from 'src/app/modules/bill/model/Bill';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';

import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';

@Component({
  selector: 'app-v4-new-vendor-credit-modal',
  templateUrl: './v4-new-vendor-credit-modal.component.html',
  styleUrls: ['./v4-new-vendor-credit-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    V4CommonDropDownSelectorComponent,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    CommonAmountInputV4Component,
    V4ControlMessageComponent,
    PayeeDropdownV4Component,
    BankAcDropdownV4Component,
    CategoryDropdownV4Component,
    CommonTabV4Component,
    V4DatePickerComponent
  ]
})
export class V4NewVendorCreditModalComponent implements OnInit {
  vendorForm!: UntypedFormGroup;
  page = 1;
  submitting = false;

  creditType = signal('bill');
  creditTabs: ITabItem[] = [
    { label: 'Bill', value: 'bill' },
    { label: 'Payee', value: 'payee' }
  ];

  isBill = signal(true);
  bills: IBill[] = [];
  pagination: IPagination = {
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0
  };

  loadingBills = signal(false);
  searchTerm = '';
  private bankDropdownReady: IV3DropDownOnReady = {};
  private pendingBillId: string | null = null;
  private pendingPayeeId: string | null = null;
  editCategoryId = signal<string | undefined>(undefined);

  data = inject<{ mode: string; vendorId: string }>(MAT_DIALOG_DATA);
  formBuilder = inject(UntypedFormBuilder);
  datePipe = inject(DatePipe);
  private vendorService = inject(VendorService);
  private alertService = inject(V4AlertService);
  dailogRef = inject(MatDialogRef<V4NewVendorCreditModalComponent>);
  private sharedService = inject(SharedService);
  bankDataService = inject(BankDataService);
  billService = inject(BillService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.getBills();
    this.initVendorCreditForm();

    if (this.data?.mode === 'edit') {
      this.getVendor(this.data.vendorId);
    }

    this.vendorForm.controls.bill.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) {
          const bankAssociated = this.bills.find(
            (bill) => bill.billId === value
          )?.bankAccount;
          if (bankAssociated && bankAssociated?.bankAccountId) {
            this.sharedService.setNewBankCreatedData({
              bankAccountNickName: bankAssociated.bankAccountNickName
                ? bankAssociated.bankAccountNickName
                : bankAssociated.bankAccountName
            });
            const { bankAccount } = this.vendorForm.controls;
            bankAccount.setValue(bankAssociated.bankAccountId);
          } else {
            this.sharedService.setNewBankCreatedData(null);
            const { bankAccount } = this.vendorForm.controls;
            bankAccount.setValue('');
          }
        }
      });
  }

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
    const { bill, payee } = this.vendorForm.controls;
    const isBill = this.isBill();
    bill.setValidators(isBill ? [Validators.required] : null);
    payee.setValidators(!isBill ? [Validators.required] : null);
    bill.updateValueAndValidity();
    payee.updateValueAndValidity();
  }

  getVendor(vendorId: string) {
    this.vendorService
      .getVendor(vendorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.success) {
          this.setEditData(data?.data[0]);
        }
      });
  }

  setEditData(data: IVendorData) {
    this.sharedService.setNewCategoryCreatedData({
      categoryId: data.category.categoryId
    });

    // Set credit type (bill vs payee) based on edit data
    const hasBill = !!data.bill?.billId;
    this.isBill.set(hasBill);
    this.creditType.set(hasBill ? 'bill' : 'payee');
    this.updateFormValidators();

    const creditDate = data.credit_date
      ? this.datePipe.transform(data.credit_date, 'yyyy-MM-dd')
      : null;

    this.vendorForm.controls.payee.setValue(data.payee?.payeeId || '');
    this.pendingBillId = data.bill?.billId || null;
    this.vendorForm.controls.bill.setValue(this.pendingBillId);
    this.vendorForm.controls.bankAccount.setValue(
      data.bankAccount.bankAccountId
    );
    this.vendorForm.controls.category.setValue(data.category.categoryId);
    this.editCategoryId.set(data.category.categoryId);
    this.vendorForm.controls.accNo.setValue(data.accountNo);
    this.vendorForm.controls.amount.setValue(data.amount);
    this.vendorForm.controls.creditDate.setValue(creditDate);
    this.vendorForm.controls.creditNo.setValue(data.creditNo);
    this.vendorForm.controls.memo.setValue(data.memo);

    // Auto-select bank dropdown
    if (data.bankAccount?.bankAccountId) {
      this.bankDropdownReady?.setItemWithId?.(data.bankAccount.bankAccountId);
    }

    // Payee dropdown is conditionally rendered (@if !isBill),
    // so store the ID and select it when the dropdown emits (ready)
    if (data.payee?.payeeId && !hasBill) {
      this.pendingPayeeId = data.payee.payeeId;
    }
  }

  onBankReady(event: IV3DropDownOnReady) {
    this.bankDropdownReady = event;
  }

  onPayeeReady(event: IV3DropDownOnReady) {
    // If we have a pending payee from edit data, select it now that the dropdown is rendered
    if (this.pendingPayeeId) {
      event.setItemWithId?.(this.pendingPayeeId);
      this.pendingPayeeId = null;
    }
  }

  onBankAccountChange(event: IBankDropdown) {
    this.vendorForm.controls.bankAccount.setValue(event?.id);
  }

  onPayeeChange(event: IPayeeDropdown | null | undefined) {
    this.vendorForm.controls.payee.markAsTouched();
    this.vendorForm.controls.payee.markAsDirty();
    const val = event?.id ?? '';
    this.vendorForm.controls.payee.setValue(val);
  }

  changeCat(event: ICategoryDropdown) {
    this.vendorForm.controls.category.setValue(event?.id);
  }

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

  save() {
    if (this.vendorForm.invalid) {
      this.vendorForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const processedData = this.getSubmitData();

    if (this.data.mode === 'edit') {
      this.vendorService
        .updateVendor(this.data.vendorId, processedData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Vendor credit updated',
              close: true,
              timeout: 2500
            });
            this.dailogRef.close({ success: true });
          }
        });
      return;
    }

    this.vendorService
      .addVendorCredit(processedData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Vendor credit added',
            close: true,
            timeout: 2500
          });
          this.dailogRef.close({ success: true });
        }
      });
  }

  getBills() {
    this.loadingBills.set(true);
    this.sharedService
      .getBills(this.page, this.searchTerm)
      .pipe(
        finalize(() => this.loadingBills.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.bills = data?.data?.bills || [];
          this.pagination = data?.data?.pagination || this.pagination;
          // Only auto-set isBill in new mode; in edit mode, setEditData controls it
          if (this.data?.mode !== 'edit') {
            const hasBills = this.bills.length > 0;
            this.isBill.set(hasBills);
            this.creditType.set(hasBills ? 'bill' : 'payee');
            this.updateFormValidators();
          }

          // Re-apply pending bill selection now that items are loaded
          if (this.pendingBillId) {
            this.vendorForm.controls.bill.setValue(this.pendingBillId);
            this.pendingBillId = null;
          }
        }
      });
  }

  onScrollToEnd() {
    if (this.page >= this.pagination.lastPage || this.loadingBills()) {
      return;
    }

    this.page += 1;
    this.loadingBills.set(true);
    this.sharedService
      .getBills(this.page, this.searchTerm)
      .pipe(
        finalize(() => this.loadingBills.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.bills = [...this.bills, ...(data?.data?.bills || [])];
          this.pagination = data?.data?.pagination || this.pagination;
        }
      });
  }

  onSearchTerm(term: string) {
    this.searchTerm = term;
    this.page = 1;
    this.loadingBills.set(true);
    this.sharedService
      .getBills(this.page, this.searchTerm)
      .pipe(
        finalize(() => this.loadingBills.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.bills = data?.data?.bills || [];
          this.pagination = data?.data?.pagination || this.pagination;
        }
      });
  }

  onCreditTypeChange(event: string) {
    this.isBill.set(event === 'bill');
    this.updateFormValidators();
  }
}
