import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { Component, inject, OnDestroy } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgClass, CurrencyPipe } from '@angular/common';
import { Subscription, finalize } from 'rxjs';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { INumberOnlyEvent } from 'src/app/modules/invoices/model/invoice';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';

@Component({
  selector: 'app-refill-credit-recharge-modal',
  templateUrl: './refill-credit-recharge-modal.component.html',
  styleUrls: ['./refill-credit-recharge-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    AmountInputComponent,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    MatDialogActions,
    CurrencyPipe,
    FontAwesomeModule,
    CommonButtonV35Component,
    V35ControlMessageComponent
  ]
})
export class RefillCreditRechargeModalComponent implements OnDestroy {
  private refillService = inject(RefillCreditService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<RefillCreditRechargeModalComponent>);

  faXmark = faXmark;

  subscriptions: Subscription[] = [];
  isFunding: boolean;

  amount = new UntypedFormControl(null, [
    Validators.required,
    Validators.max(1000),
    Validators.min(30)
  ]);

  addFund() {
    this.amount.markAllAsTouched();
    if (this.amount.valid) {
      const confirmRef = this.alertService.confirmAlert({
        content: 'You want to refill amount'
      });
      confirmRef.afterClosed().subscribe((res) => {
        if (res) {
          this.recharge();
        }
      });
    }
  }

  recharge() {
    this.isFunding = true;
    this.subscriptions.push(
      this.refillService
        .addFund(this.amount.value)
        .pipe(
          finalize(() => {
            this.dialogRef.close({ add: true });
            this.isFunding = false;
          })
        )
        .subscribe(
          (data) => {
            if (data?.success) {
              this.alertService.successAlert({
                content: 'Fund added!',
                close: true,
                timeout: 2500
              });
              this.headerService.setHeaderValueChanged(true);
            }
          },
          (error) => {
            if (error.error.errorCode === 201) {
              this.updateCardWarning(error.error.errorMsg);
            }
          }
        )
    );
  }

  updateCardWarning(msg: string) {
    const dref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Update Payment Method',
      cancelMsg: 'Cancel',
      isCancel: true
    },'415px');

    dref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['manage/refill-credit/update-card']);
      }
    });
  }

  amountInputValidator(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      return true;
    }

    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  get controlMessage() {
    const { invalid, value } = this.amount;
    if (invalid && !value) {
      return 'Amount is required';
    }
    if (value < 30) {
      return 'Minimum amount should be $30.00';
    }
    if (value > 1000) {
      return 'Maximum amount should be $1000.00';
    }
    return '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
