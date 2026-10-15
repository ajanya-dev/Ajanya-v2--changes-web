import { Component, inject, OnDestroy, signal } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { finalize, Subscription, take } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

export interface IVendorCreditApplyData {
  billId: string;
  payeeId: string;
  billAmount: number;
  availableCredit: number;
}

@Component({
  selector: 'app-vendor-credit-apply-modal',
  templateUrl: './vendor-credit-apply-modal.component.html',
  styleUrls: ['./vendor-credit-apply-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    MatDialogActions,
    CommonButtonV35Component,
    AmountInputComponent,
    V35ControlMessageComponent,
    FaIconComponent,
    MatDialogClose,
    CurrencyPipe,
    DecimalPipe
  ]
})
export class VendorCreditApplyModalComponent implements OnDestroy {
  public formBuilder = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  private billService = inject(BillService);
  public data: IVendorCreditApplyData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<VendorCreditApplyModalComponent>);

  applyVendorCreditForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  loading = signal(false);

  faXmark = faXmark;

  constructor() {
    this.initForm();
    this.setupFormValidation();
  }

  initForm() {
    this.applyVendorCreditForm = this.formBuilder.group({
      creditAmount: ['', [
        Validators.required,
        this.creditValidator.bind(this)
      ]]
    });
  }

  setupFormValidation() {
    this.applyVendorCreditForm.controls.creditAmount.valueChanges.subscribe(() => {
      this.applyVendorCreditForm.controls.creditAmount.updateValueAndValidity({ 
        onlySelf: true, 
        emitEvent: false 
      });
    });
  }

  creditValidator(control: AbstractControl) {
    const value = parseFloat(control.value);
    if (value > this.data.availableCredit || value > this.data.billAmount) {
      return { creditExceeded: true };
    }
    return null;
  }

  get remainingBillAmount(): number {
    const creditAmount = parseFloat(this.applyVendorCreditForm.controls.creditAmount.value) || 0;
    return this.data.billAmount - creditAmount;
  }

  onSubmit() {
    if (this.applyVendorCreditForm.invalid) {
      this.applyVendorCreditForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const creditAmount = this.applyVendorCreditForm.controls.creditAmount.value;

    this.subscriptions.push(
      this.billService.validateCreditApplied(this.data.billId, Number(creditAmount))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if(response?.success) {
            const confirm = this.alertService.confirmAlert({
              content: `Are you sure you want to continue with the amount $${response.data?.amountAfterCreditApplied} ?`,
              title: 'Confirm Payment',
              doneMsg: 'Continue',
              cancelMsg: 'Not Now'
            });
            confirm.afterClosed().subscribe((result) => {
              if(result) {
                this.dialogRef.close(response);
              }else {
                this.dialogRef.close({success: false, type: 'cancel'});
              }
            });
          }
        },
        error: (err:HttpErrorResponse) => {
          if(err?.error?.errorCode === 1001){
            this.alertService.warningAlert({
              content: err?.error?.errorMsg || 'Unable to apply credit to this bill.'
            }).afterClosed().pipe(take(1)).subscribe((result) => {
              if(result){
                this.dialogRef.close({ success: false, type: 'error' });
              }
            });
          }else{
            this.dialogRef.close({ success: false, type: 'error' });
          }
        }
      })
    );
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}