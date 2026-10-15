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
import { CurrencyPipe } from '@angular/common';
import { Subscription, finalize } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Landmark,
  ChevronDown,
  Phone
} from 'lucide-angular';

import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { V4BulkPaymentService } from 'src/app/modules/v4-bulk-payment/services/v4-bulk-payment.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { IDirectDepositData } from 'src/app/modules/check/model/check';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

/**
 * @description V4 component for Check Direct Deposit in bulk payment modal.
 */
@Component({
  selector: 'app-v4-check-dd-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    MatTooltip,
    LucideAngularModule,
    PhoneInputV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './v4-check-dd-bulk.component.html',
  styleUrl: './v4-check-dd-bulk.component.scss'
})
export class V4CheckDdBulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private v4BulkPaymentService = inject(V4BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);
  private payeeService = inject(PayeeService);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private bankModalService = inject(BankModalService);

  /** Payments data from parent (check-mode-select: Check DD group). */
  payments = input<IZilPyamentLists[]>([]);
  skipBankPrefill = input(false);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;
  totalCost = 0;
  private readonly LOADER_KEY = 'check-dd-bulk';

  readonly LandmarkIcon = Landmark;
  readonly ChevronDownIcon = ChevronDown;
  readonly PhoneIcon = Phone;

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
    this.v4BulkPaymentService.registerChildLoading(this.LOADER_KEY);
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkDDFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for check DD entries.
   * @returns FormArray of check DD controls.
   */
  getFormControl(): FormArray<FormGroup> {
    return this.dynamicForm.get('checkDDFormArray') as FormArray<FormGroup>;
  }

  /**
   * @description Creates a form group for a single check DD payment.
   * @param payment - Zil payment data.
   * @param costData - Direct deposit cost data from API.
   * @returns FormGroup for the payment row.
   */
  checkDDFormBody(
    payment: IZilPyamentLists,
    costData: IDirectDepositData
  ): FormGroup {
    const form = this.formBuilder.group({
      payee: [payment?.payee],
      source: [payment?.source],
      amount: [payment?.amount],
      checkId: [payment?.transfer?.id],
      payee_email: [
        payment?.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      send_sms: [false],
      payee_phone: [costData.phone, [ValidationService.phoneMinLength]],
      payee_account: [null, Validators.required],
      payeeBanks: [],
      _prefillBankId: [
        this.skipBankPrefill()
          ? null
          : (payment?.payeeDefaultBankAccount ?? null)
      ],
      wallet_bypassing: [true],
      cost: [costData.cost]
    });

    this.totalCost += costData.cost;

    this.subscription.push(
      form.controls.send_sms.valueChanges.subscribe((val) => {
        form.controls.payee_phone.setValidators(
          ValidationService.phoneMinLength
        );
        form.controls.payee_phone.updateValueAndValidity();

        if (!val) {
          form.controls.cost.setValue((form.value.cost || 0) - 0.5);
          this.totalCost -= 0.5;
          return;
        }

        form.controls.payee_phone.setValidators([
          Validators.required,
          ValidationService.phoneMinLength
        ]);
        form.controls.payee_phone.updateValueAndValidity();

        if (form.controls.payee_phone.invalid) {
          this.alertService.warningAlert({
            content: 'Please provide a valid phone number'
          });
          form.controls.send_sms.setValue(false, { emitEvent: false });
          form.controls.payee_phone.setValidators(
            ValidationService.phoneMinLength
          );
          form.controls.payee_phone.updateValueAndValidity();
          return;
        }

        form.controls.cost.setValue((form.value.cost || 0) + 0.5);
        this.totalCost += 0.5;
      })
    );

    return form;
  }

  /**
   * @description Uses the payments input to fetch DD cost data and populate form array.
   */
  setFormData(): void {
    const data = this.payments();
    if (!data?.length) {
      this.v4BulkPaymentService.markChildReady(this.LOADER_KEY);
      return;
    }

    const checkIds = data
      .map((rowData) => rowData.transfer?.id)
      .filter(Boolean);

    this.subscription.push(
      this.checkService
        .getDirectDepostModalData({ cheques: checkIds })
        .pipe(
          finalize(() => {
            this.v4BulkPaymentService.markChildReady(this.LOADER_KEY);
          })
        )
        .subscribe((ddData) => {
          if (!ddData.success) return;

          data.forEach((rowData) => {
            const costData = ddData.data.find(
              (el) => el.chequeId === rowData.transfer?.id
            );

            if (!costData) return;

            this.getFormControl().push(this.checkDDFormBody(rowData, costData));
          });

          this.getFormControl().controls?.forEach((el) => {
            this.getPayeeBankAccounts(el?.value?.payee?.id, el as FormGroup);
          });
        })
    );
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
            formGroup.controls.payee_account.setValue(prefillId);
          }
        })
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
                  const ddForm = this.dynamicForm.get(
                    'checkDDFormArray'
                  ) as FormArray;
                  const ddFormArray = ddForm.controls[index] as FormGroup;
                  const newBankId = response?.data?.id;

                  this.getFormControl().controls?.forEach((el) => {
                    if (payeeId !== el?.value?.payee?.id) return;
                    if (el === ddFormArray && newBankId) {
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

  /**
   * @description Toggles all SMS checkboxes at once.
   * @param ev - The checkbox change event.
   */
  checkAllSms(ev: Event & { target: HTMLInputElement }): void {
    const event = ev;

    if (!event.target.checked) {
      for (let i = 0; i < this.getFormControl().controls.length; i += 1) {
        const form = this.getFormControl().controls[i];
        if (form.controls.send_sms.value === true) {
          form.controls.send_sms.setValue(false);
        }
      }
      return;
    }

    let broken = false;

    for (let i = 0; i < this.getFormControl().controls.length; i += 1) {
      const form = this.getFormControl().controls[i];

      if (form.controls.send_sms.value === false) {
        form.controls.payee_phone.setValidators([
          Validators.required,
          ValidationService.phoneMinLength
        ]);
        form.controls.payee_phone.updateValueAndValidity();

        if (form.controls.payee_phone.invalid) {
          broken = true;
          form.controls.payee_phone.setValidators(
            ValidationService.phoneMinLength
          );
          form.controls.payee_phone.updateValueAndValidity();
          this.alertService.warningAlert({
            content: `Please provide a valid phone number in row ${i + 1}`
          });
          break;
        }
      }
    }

    if (broken) {
      event.target.checked = false;
      return;
    }

    for (let i = 0; i < this.getFormControl().controls.length; i += 1) {
      const form = this.getFormControl().controls[i];

      if (form.controls.send_sms.value === false) {
        form.controls.send_sms.setValue(true, { emitEvent: false });
        form.controls.cost.setValue((form.value.cost || 0) + 0.5);
        this.totalCost += 0.5;
        form.controls.payee_phone.updateValueAndValidity();
      }
    }
  }

  ngOnDestroy(): void {
    this.v4BulkPaymentService.markChildReady(this.LOADER_KEY);
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
