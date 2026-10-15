import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { Component, OnInit, Inject, OnDestroy, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { Subscription, finalize } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { NewPhoneInputComponent } from '../../../../shared/components/new-phone-input/new-phone-input.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf, NgClass } from '@angular/common';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';

@Component({
  selector: 'app-cash-expense-get-receipt-modal',
  templateUrl: './cash-expense-get-receipt-modal.component.html',
  styleUrls: ['./cash-expense-get-receipt-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatRadioGroup,
    MatRadioButton,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    ControlMessageComponent,
    FaIconComponent,
    NgClass,
    NewPhoneInputComponent
  ]
})
export class CashExpenseGetReceiptModalComponent implements OnInit, OnDestroy {
  frmGetReceiptEmail: UntypedFormGroup;
  frmGetReceiptSMS: UntypedFormGroup;
  receiptType = '2';
  selectedPayee: IViewPayee;
  subscriptions: Subscription[] = [];
  selectedCashExpenseData: any;

  utils = Utils;

  loader = {
    smsReceipt: false,
    emailReceipt: false
  };

  faXmark = faXmark;

  phoneCountryDropdownOpen = false;

  private fb = inject(UntypedFormBuilder);
  private cashExpenseService = inject(CashExpenseService);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  public dialogRef = inject(MatDialogRef<CashExpenseGetReceiptModalComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public cashExpensedata1: {
      slug: string;
      cashExpenseData: {
        id: string;
      };
    }
  ) {}

  ngOnInit(): void {
    this.initFormGroup();
    this.getCashExpenseData();
  }

  getCashExpenseData() {
    this.loadSelectedCashExpenseData(this.cashExpensedata1.cashExpenseData.id);
  }

  initFormGroup() {
    this.frmGetReceiptEmail = this.fb.group({
      receiptType: ['', Validators.required],
      payeeEmail: ['', [Validators.required, ValidationService.emailValidator]]
    });

    this.frmGetReceiptSMS = this.fb.group({
      receiptType: ['', Validators.required],
      payee_phone: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  setReceiptData() {
    //convert the phone number format to (000) 000-0000
    this.frmGetReceiptEmail.patchValue({
      receiptType: '1',
      payeeEmail: this.selectedPayee?.email
    });

    this.frmGetReceiptSMS.patchValue({
      receiptType: '1',
      payee_phone: this.selectedPayee?.phone
    });
  }
  submit1() {
    if (!this.frmGetReceiptEmail.valid) {
      return;
    }
    this.getReceiptOnEmail();
  }

  submit2() {
    const res: boolean = this.showPhoneNumWarning();

    if (!res || !this.frmGetReceiptSMS.valid) {
      return;
    }
    this.getReceiptOnMobile();
  }

  //Load Check Data
  loadSelectedCashExpenseData(selectedId: string) {
    this.subscriptions.push(
      this.cashExpenseService
        .getCashExpensesById(selectedId)
        .subscribe((res) => {
          if (res.success) {
            this.selectedCashExpenseData = res.data;
          }
          this.loadPayeeDetails(this.selectedCashExpenseData?.payee?.payeeId);
        })
    );
  }

  //Load Payee Details
  loadPayeeDetails(payeeId: string) {
    if (payeeId == '') return;
    this.subscriptions.push(
      this.payeeService.showPayee(payeeId).subscribe((res) => {
        if (res.success) {
          this.selectedPayee = res.data;
          this.setReceiptData();
        }
      })
    );
  }

  getReceiptOnEmail() {
    this.loader.emailReceipt = true;
    this.subscriptions.push(
      this.cashExpenseService
        .sendSignOnReceiptEmail(this.cashExpensedata1.cashExpenseData.id, {
          email: this.frmGetReceiptEmail.controls.payeeEmail.value
        })
        .pipe(
          finalize(() => {
            this.loader.emailReceipt = false;
          })
        )
        .subscribe((emailData) => {
          let close: any;
          if (emailData?.success) {
            close = this.alertService.successAlert({
              content: emailData?.data,
              close: true
            });
          } else {
            close = this.alertService.failedAlert({
              content: emailData.errorMsg
            });
          }
          close.afterClosed().subscribe((result: any) => {
            if (result) {
              this.dialogRef.close({
                result,
                data: emailData
              });
            }
          });
        })
    );
  }

  getReceiptOnMobile() {
    this.loader.smsReceipt = true;
    this.subscriptions.push(
      this.cashExpenseService
        .sendSignOnReceiptSMS(this.cashExpensedata1.cashExpenseData.id, {
          sms: this.frmGetReceiptSMS.controls.payee_phone.value
        })
        .pipe(
          finalize(() => {
            this.loader.smsReceipt = false;
          })
        )
        .subscribe((smsData) => {
          if (smsData?.success) {
            const close = this.alertService.successAlert({
              content: smsData?.data,
              close: true
            });
            close.afterClosed().subscribe((result) => {
              if (result) {
                this.dialogRef.close({
                  result,
                  data: smsData
                });
              }
            });
          }
        })
    );
  }

  setReceiptType(event: { isTrusted: boolean; value: string }) {
    if (event.isTrusted) {
      return;
    }
    this.receiptType = event.value;
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  showPhoneNumWarning(): boolean {
    if (!this.phoneNumIsValid()) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      return false;
    }
    return true;
  }

  phoneNumIsValid() {
    if (
      this.frmGetReceiptSMS.controls.payee_phone.errors ||
      this.frmGetReceiptSMS.controls.payee_phone.value.length < 10
    ) {
      return false;
    }
    return true;
  }

  countryChanges(event: { isOpen: boolean }) {
    if (event.isOpen) {
      this.phoneCountryDropdownOpen = true;
    } else {
      this.phoneCountryDropdownOpen = false;
    }
    this.receiptType = '2';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
