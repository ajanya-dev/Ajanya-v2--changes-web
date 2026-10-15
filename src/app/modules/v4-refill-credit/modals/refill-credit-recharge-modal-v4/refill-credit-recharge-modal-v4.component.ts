import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';

import { finalize } from 'rxjs';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgClass, CurrencyPipe } from '@angular/common';
import { INumberOnlyEvent } from 'src/app/modules/invoices/model/invoice';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-refill-credit-recharge-modal',
  templateUrl: './refill-credit-recharge-modal-v4.component.html',
  styleUrls: ['./refill-credit-recharge-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    CommonButtonV4Component,
    CommonAmountInputV4Component,
    V4ControlMessageComponent,
    LucideAngularModule,
    NgClass,
    CurrencyPipe
  ]
})
export class RefillCreditRechargeModalV4Component {
  private refillService = inject(RefillCreditService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(
    MatDialogRef<RefillCreditRechargeModalV4Component>
  );

  faXmark = faXmark;
  readonly XIcon = X;
  isFunding = signal(false);
  selectedPreset: number | null = null;
  isCustomAmount = false;

  presetAmounts = [50, 100, 300, 500, 800, 1000];

  amount = new UntypedFormControl(null, [
    Validators.required,
    Validators.max(1000),
    Validators.min(30)
  ]);

  selectPreset(value: number): void {
    this.selectedPreset = value;
    this.isCustomAmount = false;
    this.amount.setValue(value);
  }

  selectCustom(): void {
    this.selectedPreset = null;
    this.isCustomAmount = true;
    this.amount.setValue(null);
  }

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
      return;
    }
    this.alertService.warningAlert({
      content: 'Please select or enter an amount to recharge.'
    });
  }

  recharge() {
    this.isFunding.set(true);
    this.refillService
      .addFund(this.amount.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.dialogRef.close({ add: true });
          this.isFunding.set(false);
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
      );
  }

  updateCardWarning(msg: string) {
    const dref = this.alertService.warningAlert(
      {
        content: msg,
        doneMsg: 'Update Payment',
        cancelMsg: 'Cancel',
        isCancel: true
      },
      '415px'
    );

    dref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['v4/manage/refill-credit/update-card']);
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

}
