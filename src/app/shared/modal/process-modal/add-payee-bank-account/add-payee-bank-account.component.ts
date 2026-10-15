import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { NgIf, NgClass, LowerCasePipe } from '@angular/common';

/**
 * @description Modal component for adding payee bank account.
 */
@Component({
  selector: 'app-add-payee-bank-account',
  templateUrl: './add-payee-bank-account.component.html',
  styleUrls: ['./add-payee-bank-account.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgClass,
    LowerCasePipe
  ]
})
export class AddPayeeBankAccountComponent implements OnInit, OnDestroy {
  addBankAccount: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  isConfirm = false;
  notMatch = false;
  isloading = false;

  entityLabel:string = 'Payee';

  utils = Utils;

  bankAccountType = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings', name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings', name: 'Personal Savings' },
  ];

  constructor(
    public dialog: MatDialog,
    public formBuilder: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: IViewPayee,
    private __payeeService: PayeeService,
    public dialogRef: MatDialogRef<AddPayeeBankAccountComponent>,
    private __alertService: AlertService
  ) {}

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

  /**
   * @description Initializes add bank account form.
   */
  initForm() {
    this.addBankAccount = this.formBuilder.group({
      bankName: ['', [Validators.required, ValidationService.personNameValidator]],
      routingNumber: [
        '',
        [Validators.required, ValidationService.routingNumberValidator]
      ],
      accountNumber: ['', Validators.required],
      accountType: ['', Validators.required],
      confirmAccountNumber: ['']
    });
  }

  /**
   * @description Submits the data from `addBankAccount` form to `addPayeeToBankAccount` method of payee service.
   * @returns
   */
  submit() {
    this.addBankAccount.markAllAsTouched();

    if (this.addBankAccount.controls.accountType.value === 'main') {
      this.addBankAccount.controls.accountType.setValue('');
    }

    if (
      this.addBankAccount.value.accountNumber !==
      this.addBankAccount.value.confirmAccountNumber
    ) {
      this.notMatch = true;
      return;
    }

    this.addBankAccount.value.payeeId = this.data.id;
    if (this.addBankAccount.invalid == false) {
      this.isloading = true;
      this.subscriptions.push(
        this.__payeeService
          .addPayeeToBankAccount(this.addBankAccount.value)
          .pipe(
            catchError(() => {
              // this.__AlertService.confirmAlert(alert)
              return of(false);
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.isloading = true;
              this.dialogRef.close(true);
            }
          })
      );
    }
  }

  /**
   * @description Method to ensure only numbers are being given as input.
   * @param event - keypress event.
   * @returns boolean
   */
  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Method invoked when 'Back' or 'Next' is clicked in template.
   * Toggles `this.isConfirm` boolean value.
   * Sets `accountType` to `this.data.accountType`.
   */
  change() {
    if (this.isConfirm == false) {
      this.addBankAccount.markAllAsTouched();
      if (this.addBankAccount.invalid) {
        return;
      }
    }
    this.isConfirm = !this.isConfirm;
    this.data.accountType = this.addBankAccount.controls.accountType.value;    
  }

  /**
   * @description Opens warning alert dialog.
   * @param content - content for warning alert.
   * @returns warning alert.
   */
  warningAlert(content: string) {
    const data = {
      title: 'Oops',
      content: content,
      doneMsg: 'OK',
      isCancel: false
    };
    return this.__alertService.warningAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
