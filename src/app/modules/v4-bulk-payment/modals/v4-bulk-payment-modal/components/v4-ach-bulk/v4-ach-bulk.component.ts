import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Subscription, finalize } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  ArrowRightLeft,
  ChevronDown,
  Landmark,
  Wallet,
  CreditCard,
  Plus,
  CircleAlert
} from 'lucide-angular';
import {
  IZilPyamentLists,
  IRequiredDocsValue,
  IRequiredDocument
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import {
  ValidationService,
  requiredDocumentsValidator
} from 'src/app/shared/service/validation/validation.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

/**
 * @description V4 component for ACH transfers in bulk payment modal.
 */
@Component({
  selector: 'app-v4-ach-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    NgClass,
    MatTooltip,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './v4-ach-bulk.component.html',
  styleUrl: './v4-ach-bulk.component.scss'
})
export class V4AchBulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private payeeService = inject(PayeeService);
  private formBuilder = inject(FormBuilder);
  private rootFormGroup = inject(FormGroupDirective);
  private bankModalService = inject(BankModalService);
  private alertService = inject(V4AlertService);

  /** Payments data from parent. */
  payments = input<IZilPyamentLists[]>([]);
  skipBankPrefill = input(false);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;
  isSourceCard = false;
  isShowMoreColumn = false;
  readonly paymentMode = '1'; // ACH

  readonly SectionIcon = ArrowRightLeft;
  readonly ChevronDownIcon = ChevronDown;
  readonly LandmarkIcon = Landmark;
  readonly WalletIcon = Wallet;
  readonly CreditCardIcon = CreditCard;
  readonly PlusIcon = Plus;
  readonly CircleAlertIcon = CircleAlert;

  /** Rows whose payee bank accounts are loading; their dropdown shows a shimmer. */
  loadingBankRows = new Set<AbstractControl>();

  readonly payeeBankDropdownConfig = {
    placeholder: 'Select Bank Account',
    displayField: 'bank_name',
    outputField: 'encrypted_id',
    enableAddNew: true,
    addNewLabel: 'Add Bank Account',
    addNewSubLabel: 'Add a new bank account',
    style: {
      size: '1'
    }
  };

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'achFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for ACH entries.
   * @returns FormArray of ACH controls.
   */
  getFormControl(): FormArray {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of (this.dynamicForm.get('achFormArray') as FormArray)
      .controls) {
      if (item?.value?.from === 'CARD') {
        this.isSourceCard = true;
        break;
      }
    }
    return this.dynamicForm.get('achFormArray') as FormArray;
  }

  /**
   * @description Bank account to preselect. The bank saved on the payment (e.g. from an
   * Excel import) always wins; skipBankPrefill only blocks the payee's default bank.
   * @param payment - Zil payment data.
   */
  private getPrefillBankId(payment: IZilPyamentLists): string | null {
    if (payment.payeeBankAccount) return payment.payeeBankAccount;
    if (this.skipBankPrefill()) return null;
    return payment.payeeDefaultBankAccount || null;
  }

  /**
   * @description Creates a form group for a standard ACH payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  achFormBody(payment: IZilPyamentLists): FormGroup {
    return this.formBuilder.group({
      from: [payment.sourceType],
      payee: [payment.payee],
      source: [payment.source],
      amount: [payment.amount],
      uuid: [payment.id],
      email: [
        payment.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      payeeAcc: [null, Validators.required],
      payeeBanks: [],
      _prefillBankId: [this.getPrefillBankId(payment)]
    });
  }

  /**
   * @description Creates a form group for an ACH payment from CARD source (with invoice).
   * @param payment - Zil payment data.
   * @param reqDocs - Required documents for card verification.
   * @returns FormGroup for the payment row.
   */
  achFormBodyWithInvoice(
    payment: IZilPyamentLists,
    reqDocs?: IRequiredDocument
  ): FormGroup {
    const docs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: reqDocs
    };
    return this.formBuilder.group({
      from: [payment.sourceType],
      payee: [payment.payee],
      source: [payment.source],
      amount: [payment.amount],
      email: [
        payment.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [payment.id],
      payeeAcc: [null, Validators.required],
      payeeBanks: [],
      _prefillBankId: [this.getPrefillBankId(payment)],
      referenceNo: [payment.referenceNo, Validators.required],
      documents: [docs, requiredDocumentsValidator]
    });
  }

  /**
   * @description Fetches payee bank accounts and sets them on the form group.
   * @param id - Payee ID.
   * @param formGroup - The form group to update.
   */
  getPayeeBankAccounts(id: string, formGroup: FormGroup): void {
    this.loadingBankRows.add(formGroup);
    this.subscription.push(
      this.payeeService
        .viewPayee(id)
        .pipe(finalize(() => this.loadingBankRows.delete(formGroup)))
        .subscribe((res) => {
          formGroup.controls.payeeBanks.setValue(res?.data?.bank_accounts);
          const prefillId = formGroup.controls._prefillBankId?.value;
          if (prefillId) {
            formGroup.controls.payeeAcc.setValue(prefillId);
          }
        })
    );
  }

  /**
   * @description Populates the FormArray with entries from the payments input.
   */
  setFormData(): void {
    const paymentsList = this.payments();
    paymentsList?.forEach((rowData) => {
      if (rowData?.sourceType === 'CARD') {
        const reqDocsDetails = this.v3BulkPaymentService.requiredDocs.find(
          (el) => el.uuid === rowData.id
        );
        this.getFormControl().push(
          this.achFormBodyWithInvoice(rowData, reqDocsDetails)
        );
        this.isShowMoreColumn = true;
      } else {
        this.getFormControl().push(this.achFormBody(rowData));
      }
    });

    this.getFormControl().controls?.forEach((el) => {
      this.getPayeeBankAccounts(el?.value?.payee?.id, el as FormGroup);
    });
  }

  /**
   * Opens the verification card invoice modal for a payment.
   * @param paymentFormGroup - The payment form group.
   */
  openVerifyCardInvoiceModal(paymentFormGroup: FormGroup): void {
    this.v3BulkPaymentService.openVerifyCardInvoiceModalFromBulkPayment(
      paymentFormGroup,
      this.paymentMode,
      false
    );
  }

  /**
   * @description Opens modal for adding payee bank account.
   * @param payeeId - ID of the payee.
   * @param index - Index of the form row.
   */
  addPayeeBankAc(payeeId: string, index: number): void {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscription.push(
      this.bankModalService
        .openAddBankNormalModalV4({ payeeId })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscription.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success) {
                  this.alertService.successAlert({
                    content: 'Bank added successfully'
                  });
                  const achForm = this.dynamicForm.controls
                    ?.achFormArray as FormArray;
                  const achFormArray = achForm.controls[index] as FormGroup;
                  const newBankId = response?.data?.id;

                  this.getFormControl().controls?.forEach((el) => {
                    if (payeeId !== el?.value?.payee?.id) return;
                    if (el === achFormArray && newBankId) {
                      (el as FormGroup).controls._prefillBankId?.setValue(
                        newBankId
                      );
                    }
                    this.getPayeeBankAccounts(
                      el?.value?.payee?.id,
                      el as FormGroup
                    );
                  });
                }
              })
            );
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
