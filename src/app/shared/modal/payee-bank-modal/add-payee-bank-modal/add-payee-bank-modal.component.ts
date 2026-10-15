import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IPayeeBankCreateBody } from 'src/app/modules/payee/payee-v2/model/payee';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgIf } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

interface IEditPayeeBank {
  payeeId: string;
  editMode: boolean;
}

/**
 * @description Modal component for adding payee bank account.
 */
@Component({
  selector: 'app-add-payee-bank-modal',
  templateUrl: './add-payee-bank-modal.component.html',
  styleUrls: ['./add-payee-bank-modal.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class AddPayeeBankModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<AddPayeeBankModalComponent>);
  private bankAccService = inject(BankAccountsService);
  private payeeService = inject(PayeeService);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  public data: IPayeeBankCreateBody | IEditPayeeBank = inject(MAT_DIALOG_DATA);

  addBankForm: FormGroup;
  subscriptions: Subscription[] = [];
  isItConfirmed = false;
  utils = Utils;

  loading = signal(false);
  payeeLegalName = '';

  bankAccountType: {value: string, name: string}[] = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings', name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings', name: 'Personal Savings' },
  ];


  ngOnInit(): void {
    this.initForm();
    if (this.data) {
      this.setFormValue();
      this.loadPayeeLegalName();
    }

    if (
      (this.data as IEditPayeeBank).editMode &&
      this.addBankForm.controls.routingNumber.value != null
    )
      this.lookupRoutingNumber(this.addBankForm.controls.routingNumber.value);

    if (
      (this.data as IEditPayeeBank).editMode &&
      this.addBankForm.controls.accountNumber.value != null
    )
      this.addBankForm.controls.confirmAccountNumber.setValue(
        this.addBankForm.controls.accountNumber.value
      );
  }

  /**
   * @description Updates the form values with `this.data`.
   */
  setFormValue(): void {
    this.addBankForm.patchValue({
      payeeId: this.data.payeeId,
      bankName: (this.data as IPayeeBankCreateBody)?.bankName,
      routingNumber: (this.data as IPayeeBankCreateBody)?.routingNumber,
      accountNumber: (this.data as IPayeeBankCreateBody)?.accountNumber,
      accountType: (this.data as IPayeeBankCreateBody)?.accountType
    });
  }

  loadPayeeLegalName(): void {
    if (!this.data.payeeId) {
      return;
    }
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(this.data.payeeId)
        .subscribe((res) => {
          this.payeeLegalName = res?.payee_information?.payee_name ?? '';
          const nameControl = this.addBankForm.controls.bankName;
          nameControl.updateValueAndValidity();
          if ((this.data as IEditPayeeBank).editMode) {
            nameControl.markAsTouched();
          }
        })
    );
  }

  /**
   * @description Initializes add bank form.
   */
  initForm() {
    this.addBankForm = this.fb.group({
      payeeId: [''],
      bankName: [
        '',
        [
          Validators.required,
          ValidationService.personNameValidator,
          ValidationService.legalNameMatchValidator(() => this.payeeLegalName)
        ]
      ],
      routingNumber: [
        '',
        [Validators.required, ValidationService.routingNumberValidator]
      ],
      routingbankName: [''],
      accountNumber: ['', [Validators.required, Validators.minLength(5)]],
      confirmAccountNumber: [''],
      accountType: ['', Validators.required]
    });
  }

  /**
   * @description Looks up routing number and gets bank details.
   * Updates the `routingbankName` field of `addbankForm` using the data fetched.
   * @param event
   */
  lookupRoutingNumber(event: string) {
    const routNo = event;
    if (routNo.length >= 9) {
      this.subscriptions.push(
        this.bankAccService.getroutingNumber(routNo).subscribe((res) => {
          const bankDetails = res.data;
          this.addBankForm.patchValue({
            routingbankName: bankDetails.name?.trim()
          });
        })
      );
    } else {
      this.addBankForm.patchValue({ routingbankName: '' });
    }
  }

  /**
   * @description Method invoked when 'Add'/'Update' is clicked. Marks all `addBankForm` fields as touched and checks if valid. Sets validators to `confirmAccountNumber` field.
   * If in editMode, invokes `this.onUpdate` method.
   */
  submit() {
    this.addBankForm.controls.routingNumber.markAsTouched();
    this.addBankForm.controls.routingNumber.markAsDirty();
    this.addBankForm.markAllAsTouched();
    if (this.addBankForm.invalid) {
      return;
    } 
      this.isItConfirmed = true;
      this.addBankForm.controls.confirmAccountNumber.setValidators([
        Validators.required,
        ValidationService.isMatchingValidator(
          'accountNumber',
          'Account number does not match'
        )
      ]);
    

    if (
      (this.data as IEditPayeeBank).editMode &&
      !(
        this.addBankForm.controls.accountNumber.valid &&
        this.addBankForm.controls.accountNumber.dirty
      )
    ) {
      this.isItConfirmed = false;
      this.onUpdate();
    } else {
      this.isItConfirmed = true;
    }
  }

  /**
   * @description Method invoked when Confirm is clicked.
   * If not in `editMode`, invokes `this.onCreate` to create, otherwise invokes `this.onUpdate` to update.
   */
  confirmBtn() {
    if (this.addBankForm.valid) {
      this.addBankForm.value.payeeId = this.data.payeeId;
      this.addBankForm.value.type = 'CHECKDRAFT';
      if (!(this.data as IEditPayeeBank).editMode) {
        this.onCreate();
      } else {
        this.onUpdate();
      }
    }
  }

  /**
   * @description Posts addBankForm data to `addPayeeToBankAccount` method of payee service.
   */
  onCreate() {
    this.loading.set(true);
    this.subscriptions.push(
      this.payeeService
        .addPayeeToBankAccount(this.addBankForm.value)
        .pipe(
          finalize(() => this.loading.set(false)),
          catchError(() => of(false))
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
          }
        })
    );
  }

  /**
   * @description Posts addBankForm data to `updatePayeeBank` method of payee service.
   */
  onUpdate(allowUpdate = false) {
    this.loading.set(true);
    this.subscriptions.push(
      this.payeeService
        .updatePayeeBank(
          (this.data as IPayeeBankCreateBody).id,
          {...this.addBankForm.value,allowReccuring: allowUpdate ? 1 : 0}
        )
        .pipe(
          finalize(() => this.loading.set(false)),
          catchError(() => of(false))
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialogRef.close(true);
            }
          },
          error: (err) => {
            if (err?.error?.errorCode === 987) {
              const data = {
                content: `Updating the payee's bank account won't affect existing recurring payments. To update bank details for recurring payments, cancel and recreate them with the updated information.`,
                doneMsg: 'Update',
                cancelMsg: 'Cancel'
              };
              const response = this.alertService.confirmAlert(data);
              response.afterClosed().subscribe((result) => {
                if (result) {
                  this.onUpdate(true);
                } else {
                  this.dialogRef.close();
                }
              });
            }
          }
        })
    );
  }

  /**
   * @description Sets given account type value to `accountType` field of `addBankForm`.
   * @param value - account type.
   */
  changeAccountType(value: string) {
    this.addBankForm.controls.accountType.setValue(value);
  }

  /**
   * @description Method invoked when back button is clicked in template.
   */
  backBtn() {
    this.isItConfirmed = false;
    this.addBankForm.controls.confirmAccountNumber.setValidators([]);
    this.addBankForm.controls.confirmAccountNumber.setValue('');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
