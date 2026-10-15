import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe, CurrencyPipe } from '@angular/common';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { IDirectDepositData } from 'src/app/modules/check/model/check';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';

/**
 * @description Component for check dd in bulk payment.
 */
@Component({
  selector: 'app-check-dd-bulk-ocw-v3',
  templateUrl: './check-dd-bulk-ocw-v3.component.html',
  styleUrls: ['./check-dd-bulk-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgFor,
    MatTooltip,
    NgSelectModule,
    AsyncPipe,
    NewPhoneInputComponent,
    CurrencyPipe,
    TruncatePipe
  ]
})
export class CheckDdBulkOcwV3Component implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);
  private payeeService = inject(PayeeService);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private bankModalService = inject(BankModalService);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];

  totalCost = 0;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
    this.v3BulkPaymentService.isBulkPayProcessing = true;
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkDDFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl() {
    return this.dynamicForm.get('checkDDFormArray') as FormArray<FormGroup>;
  }

  /**
   * @description Method to create check DD form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  checkFormBody(
    checkDDPayments: IZilPyamentLists,
    costData: IDirectDepositData
  ) {
    const form = this.formBuilder.group({
      from: [checkDDPayments?.sourceType],
      payee: [checkDDPayments?.payee],
      source: [checkDDPayments?.source],
      amount: [checkDDPayments?.amount],
      memo: [checkDDPayments?.description],
      email: [checkDDPayments?.payee?.email,[Validators.required, ValidationService.emailValidator]],
      phone: [costData.phone, [ValidationService.phoneMinLength]],
      sms: [false],
      checkId: [checkDDPayments?.transfer.id],
      invoiceNo: [checkDDPayments?.transfer.chequeInvoiceNumber],
      cost: [costData.cost],
      walletBypassing: '1',
      payeeAcc: [
        checkDDPayments?.payeeDefaultBankAccount
          ? checkDDPayments?.payeeDefaultBankAccount
          : null,
        Validators.required
      ],
      payeeBanks: []
    });
    this.totalCost += costData.cost;
    this.subscription.push(
      form.controls.sms.valueChanges.subscribe((val) => {
        form.controls.phone.setValidators(ValidationService.phoneMinLength);
        form.controls.phone.updateValueAndValidity();

        if (!val) {
          form.controls.cost.setValue((form.value.cost || 0) - 0.5);
          this.totalCost -= 0.5;
          return;
        }

        form.controls.phone.setValidators([
          Validators.required,
          ValidationService.phoneMinLength
        ]);
        form.controls.phone.updateValueAndValidity();

        if (form.controls.phone.invalid) {
          this.alertService.warningAlert({
            content: 'Please provide a valid phone number'
          });
          form.controls.sms.setValue(false, { emitEvent: false });
          form.controls.phone.setValidators(ValidationService.phoneMinLength);
          form.controls.phone.updateValueAndValidity();
          return;
        }

        form.controls.cost.setValue((form.value.cost || 0) + 0.5);
        this.totalCost += 0.5;
      })
    );
    return form;
  }

  /**
   * @description Method to set the data to the form.
   */
  setFormData() {
    this.subscription.push(
      this.v3BulkPaymentService.checkDDPayments.subscribe(async (data) => {
        const newCheckIds = new Set(data.map((rowData) => rowData.transfer.id));

        const ddData = await firstValueFrom(
          this.checkService.getDirectDepostModalData({
            cheques: Array.from(newCheckIds)
          })
        );

        if (!ddData.success) return;

        this.getFormControl().controls = this.getFormControl().controls.filter(
          (f) => newCheckIds.has(f.value?.checkId)
        );

        data.forEach((rowData) => {
          const costData = ddData.data.find(
            (el) => el.chequeId === rowData.transfer.id
          );

          if (!costData) return;

          const existingFormIndex = this.getFormControl().controls.findIndex(
            (f) => f.value?.checkId === rowData.transfer.id
          );
          if (existingFormIndex === -1) {
            this.getFormControl().push(this.checkFormBody(rowData, costData));
          }
        });

        this.getFormControl().controls?.forEach((el) => {
          this.getPayeeBankAccounts(el?.value?.payee?.id, el as FormGroup);
        });
      })
    );
  }

  /**
   * @description Method to set the payee banks data.
   * @param id - payee id.
   * @param data - formGroup.
   */
  getPayeeBankAccounts(id: string, data: FormGroup): void {
    this.subscription.push(
      this.payeeService.getPayeeBankData(id).subscribe((res) => {
        data.controls.payeeBanks.setValue(res?.data);
      })
    );
  }

  /**
   * @description Opens modal for adding payee bank account.
   * @param payeeId - id of payee.
   * @param index - index
   */
  addPayeeBankAc(payeeId: string, index: number) {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscription.push(
      this.bankModalService
        .openAddBankNormalModal({ editMode: false, id: payeeId })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscription.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success) {
                  const achForm = this.dynamicForm.get(
                    'checkDDFormArray'
                  ) as FormArray;
                  const achFormArray = achForm.controls[index] as FormGroup;
                  achFormArray.controls.payeeBanks.setValue(response);
                  this.getFormControl().controls?.forEach((el) => {
                    if (payeeId === el?.value?.payee?.id) {
                      this.getPayeeBankAccounts(
                        el?.value?.payee?.id,
                        el as FormGroup
                      );
                    }
                  });
                  achFormArray.controls.payeeAcc.setValue(response?.data?.id);
                }
              })
            );
          }
        })
    );
  }

  checkAllSms(ev: Event & { target: HTMLInputElement }) {
    const event = ev;

    if (!event.target.checked) {
      for (let i = 0; i < this.getFormControl().controls.length; i += 1) {
        const form = this.getFormControl().controls[i];

        if (form.controls.sms.value === true) {
          form.controls.sms.setValue(false);
        }
      }
      return;
    }

    let broken = false;

    for (let i = 0; i < this.getFormControl().controls.length; i += 1) {
      const form = this.getFormControl().controls[i];

      if (form.controls.sms.value === false) {
        form.controls.phone.setValidators([
          Validators.required,
          ValidationService.phoneMinLength
        ]);
        form.controls.phone.updateValueAndValidity();

        if (form.controls.phone.invalid) {
          broken = true;
          form.controls.phone.setValidators(ValidationService.phoneMinLength);
          form.controls.phone.updateValueAndValidity();
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

      if (form.controls.sms.value === false) {
        form.controls.sms.setValue(true, { emitEvent: false });
        form.controls.cost.setValue((form.value.cost || 0) + 0.5);
        this.totalCost += 0.5;
        form.controls.phone.updateValueAndValidity();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
