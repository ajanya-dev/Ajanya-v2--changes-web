import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LowerCasePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';

@Component({
  selector: 'app-add-payee-bank-account-v4',
  templateUrl: './add-payee-bank-account-v4.component.html',
  styleUrl: './add-payee-bank-account-v4.component.scss',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    MatDialogClose,
    LucideAngularModule,
    LowerCasePipe
  ]
})
export class AddPayeeBankAccountV4Component implements OnInit {
  private fb = inject(FormBuilder);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<AddPayeeBankAccountV4Component>);
  private destroyRef = inject(DestroyRef);
  public data: IViewPayee = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

  addBankAccount!: FormGroup;
  isConfirm = signal(false);
  notMatch = signal(false);
  isSubmitting = signal(false);
  entityLabel = 'Payee';

  accountTypeDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Account Type *',
    displayField: 'name',
    outputField: 'value'
  };

  bankAccountType = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings', name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings', name: 'Personal Savings' }
  ];

  ngOnInit(): void {
    this.initForm();
    if (this.data) {
      this.entityLabel = this.data?.isPayer ? 'Payer' : 'Payee';
      this.addBankAccount.patchValue({
        bankName: this.data?.name,
        routingNumber: this.data?.routingNumber,
        accountNumber: this.data?.accountNumber,
        accountType: this.data?.accountType || ''
      });
    }
  }

  private initForm(): void {
    this.addBankAccount = this.fb.group({
      bankName: ['', [Validators.required, ValidationService.personNameValidator]],
      routingNumber: [
        '',
        [Validators.required, ValidationService.routingNumberValidator]
      ],
      accountNumber: ['', Validators.required],
      accountType: ['', Validators.required],
      confirmAccountNumber: ['']
    });

    this.addBankAccount.controls.confirmAccountNumber.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val === this.addBankAccount.value.accountNumber) {
          this.notMatch.set(false);
        }
      });
  }

  submit(): void {
    this.addBankAccount.markAllAsTouched();

    if (this.addBankAccount.controls.accountType.value === 'main') {
      this.addBankAccount.controls.accountType.setValue('');
    }

    if (
      this.addBankAccount.value.accountNumber !==
      this.addBankAccount.value.confirmAccountNumber
    ) {
      this.notMatch.set(true);
      return;
    }

    this.addBankAccount.value.payeeId = this.data.id;
    if (!this.addBankAccount.invalid) {
      this.isSubmitting.set(true);
      this.payeeService
        .addPayeeToBankAccount(this.addBankAccount.value)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(() => {
            this.alertService.failedAlert({
              title: 'Error',
              content: 'Failed to add bank account. Please try again.',
              doneMsg: 'OK'
            });
            return of(false);
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe((res: { success: boolean }) => {
          if (res.success) {
            this.dialogRef.close(true);
          }
        });
    }
  }

  change(): void {
    if (!this.isConfirm()) {
      this.addBankAccount.markAllAsTouched();
      if (this.addBankAccount.invalid) {
        return;
      }
    }
    this.isConfirm.set(!this.isConfirm());
    this.data.accountType = this.addBankAccount.controls.accountType.value;
  }
}
