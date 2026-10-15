import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MatDialogClose, MatDialogActions } from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { ICashAccount } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { catchError, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';

interface IAddCashAccount {
  success: boolean;
  data: {
    id: string;
  };
}

@Component({
  selector: 'app-new-cash-account-modal',
  templateUrl: './new-cash-account-modal.component.html',
  styleUrls: ['./new-cash-account-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatDialogActions,
    ControlMessageComponent
  ]
})
export class NewCashAccountModalComponent implements OnInit, OnDestroy {
  cashForm!: UntypedFormGroup;
  loading = false;
  subscriptions: Subscription[] = [];

  utils = Utils;

  constructor(
    private fb: UntypedFormBuilder,
    private _cashExpenseService: CashExpenseService,
    private _alertService: AlertService,
    public dialogRef: MatDialogRef<NewCashAccountModalComponent>
  ) {}

  ngOnInit(): void {
    this.initFormGroup();
  }

  initFormGroup() {
    this.cashForm = this.fb.group({
      cashAccountName: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(5)
      ]),
      cashAccountNickName: new UntypedFormControl('', [Validators.required]),
      cashAccountStartingBalance: new UntypedFormControl('', [
        Validators.required
      ])
    });
  }

  get getControl() {
    return this.cashForm.controls;
  }

  createCashAccountBody(): ICashAccount {
    return {
      cash_account_name: this.getFormValue('cashAccountName'),
      balance: this.getFormValue('cashAccountStartingBalance'),
      nickname: this.getFormValue('cashAccountNickName')
    };
  }

  getFormValue(name: string) {
    return this.cashForm.get(name)?.value;
  }

  submit(): void {
    this.cashForm.markAllAsTouched();
    if (this.cashForm.valid) {
      this.loading = true;
      this.subscriptions.push(
        this._cashExpenseService
          .AddCashAccount(this.createCashAccountBody())
          .pipe(
            finalize(() => {
              this.loading = false;
            }),
            catchError(() => {
              return of(false);
            })
          )
          .subscribe((res) => {
            const response = res as IAddCashAccount;
            const id = response.data.id;
            this.loading = false;
            if (response.success == true) {
              this.dialogRef.close({ success: true, id: id });
              this.onSuccessAlert();
            }
          })
      );
    }
  }

  onSuccessAlert() {
    const data = {
      close: true,
      timeout: 3000,
      title: 'Success!',
      content: 'Cash Account Added.'
    };
    this._alertService.successAlert(data);
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  openWarningAlert(content: string) {
    const data = {
      title: 'Warning!',
      content: content,
      doneMsg: 'OK',
      cancelMsg: 'cancel'
    };
    return this._alertService.confirmAlert(data);
  }
}
