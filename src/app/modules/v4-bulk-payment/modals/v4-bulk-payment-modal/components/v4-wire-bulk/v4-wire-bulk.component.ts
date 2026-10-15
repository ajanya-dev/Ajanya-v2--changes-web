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
  Cable,
  ChevronDown,
  Landmark,
  Wallet,
  CreditCard,
  Plus,
  CircleAlert,
  Pencil
} from 'lucide-angular';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

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
import { IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';

/**
 * @description V4 component for Wire transfers in bulk payment modal.
 */
@Component({
  selector: 'app-v4-wire-bulk',
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
  templateUrl: './v4-wire-bulk.component.html',
  styleUrl: './v4-wire-bulk.component.scss'
})
export class V4WireBulkComponent implements OnInit, OnDestroy {
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
  readonly paymentMode = '6'; // Wire

  readonly SectionIcon = Cable;
  readonly ChevronDownIcon = ChevronDown;
  readonly LandmarkIcon = Landmark;
  readonly WalletIcon = Wallet;
  readonly CreditCardIcon = CreditCard;
  readonly PlusIcon = Plus;
  readonly CircleAlertIcon = CircleAlert;
  readonly PencilIcon = Pencil;

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
      'wireFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for Wire entries.
   * @returns FormArray of Wire controls.
   */
  getFormControl(): FormArray {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of (this.dynamicForm.get('wireFormArray') as FormArray)
      .controls) {
      if (item?.value?.from === 'CARD') {
        this.isSourceCard = true;
        break;
      }
    }
    return this.dynamicForm.get('wireFormArray') as FormArray;
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
   * @description Creates a form group for a standard Wire payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  wireFormBody(payment: IZilPyamentLists): FormGroup {
    return this.formBuilder.group({
      from: [payment.sourceType],
      amount: [payment.amount],
      payee: [payment.payee],
      source: [payment.source],
      email: [
        payment.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [payment.id],
      payeeAcc: [this.getPrefillBankId(payment), Validators.required],
      payeeBanks: [],
      isWireEnabled: []
    });
  }

  /**
   * @description Creates a form group for a Wire payment from CARD source (with invoice).
   * @param payment - Zil payment data.
   * @param reqDocs - Required documents for card verification.
   * @returns FormGroup for the payment row.
   */
  wireFormBodyWithInvoice(
    payment: IZilPyamentLists,
    reqDocs?: IRequiredDocument
  ): FormGroup {
    const docs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: reqDocs
    };
    return this.formBuilder.group({
      from: [payment.sourceType],
      amount: [payment.amount],
      payee: [payment.payee],
      source: [payment.source],
      email: [
        payment.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [payment.id],
      payeeAcc: [this.getPrefillBankId(payment), Validators.required],
      payeeBanks: [],
      isWireEnabled: [],
      referenceNo: [payment.referenceNo, Validators.required],
      documents: [docs, requiredDocumentsValidator]
    });
  }

  /**
   * @description Fetches payee bank accounts and sets them on the form group.
   * Wire uses viewPayee which returns bank_accounts (different from ACH).
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
          this.wireFormBodyWithInvoice(rowData, reqDocsDetails)
        );
        this.isShowMoreColumn = true;
      } else {
        this.getFormControl().push(this.wireFormBody(rowData));
      }
    });

    this.getFormControl().controls?.forEach((el) => {
      const formGroup = el as FormGroup;
      this.getPayeeBankAccounts(formGroup.controls.payee?.value?.id, formGroup);

      // Subscribe to payeeAcc changes to update isWireEnabled
      this.subscription.push(
        formGroup.controls.payeeAcc.valueChanges.subscribe((selectedId) => {
          const banks = formGroup.controls.payeeBanks.value;
          const selectedBank = banks?.find(
            (b: IPayeeViewBank) => b.encrypted_id === selectedId
          );
          formGroup.controls.isWireEnabled.setValue(
            selectedBank?.is_allow_wire ?? null
          );
        })
      );
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
   * @description Opens modal for adding or editing payee bank account.
   * @param payeeId - ID of the payee.
   * @param index - Index of the form row.
   * @param editMode - Whether to open in edit mode.
   */
  addEditPayeeBankAc(
    payeeId: string,
    index: number,
    editMode: boolean
  ): void {
    let selectedAcc: IPayeeViewBank | null = null;
    this.getFormControl().controls[index].value?.payeeBanks?.forEach(
      (el: IPayeeViewBank) => {
        if (
          el?.encrypted_id ===
          this.getFormControl().controls[index].value?.payeeAcc
        ) {
          selectedAcc = { ...el, id: el?.encrypted_id };
        }
      }
    );    

    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscription.push(
      this.bankModalService
        .openAddBankNormalModalV4({
          payeeId,
          payeeName:undefined,
          edit: editMode,
          bankId: (selectedAcc as unknown as IPayeeViewBank)?.id as string ?? '',
          from: 'wire'
        })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscription.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success && editMode) {
                  const formItem = this.getFormControl().controls[
                    index
                  ] as FormGroup;
                  formItem.controls.isWireEnabled.setValue(1);
                }
                if (response?.success && !editMode) {
                  this.alertService.successAlert({
                    content: 'Bank added successfully'
                  });
                  const wireForm = this.dynamicForm.controls
                    .wireFormArray as FormArray;
                  const wireFormArray = wireForm.controls[index] as FormGroup;
                  const newBankId = response?.data?.id;

                  this.getFormControl().controls?.forEach((el) => {
                    if (payeeId !== el?.value?.payee?.id) return;
                    const formGroup = el as FormGroup;
                    this.subscription.push(
                      this.payeeService
                        .viewPayee(payeeId)
                        .subscribe((res) => {
                          formGroup.controls.payeeBanks.setValue(
                            res?.data?.bank_accounts
                          );
                          if (formGroup === wireFormArray && newBankId) {
                            formGroup.controls.payeeAcc.setValue(newBankId);
                          }
                        })
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
