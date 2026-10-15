import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize, take } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { LucideAngularModule } from 'lucide-angular';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

export interface IVendorCreditApplyData {
  billId: string;
  payeeId: string;
  billAmount: number;
  availableCredit: number;
}

@Component({
  selector: 'app-v4-vendor-credit-apply-modal',
  templateUrl: './v4-vendor-credit-apply-modal.component.html',
  styleUrls: ['./v4-vendor-credit-apply-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonAmountInputV4Component,
    V4ControlMessageComponent,
    LucideAngularModule,
    DecimalPipe
  ]
})
export class V4VendorCreditApplyModalComponent {
  private formBuilder = inject(UntypedFormBuilder);
  private alertService = inject(V4AlertService);
  private billService = inject(BillService);
  public data: IVendorCreditApplyData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<V4VendorCreditApplyModalComponent>);
  private destroyRef = inject(DestroyRef);

  applyVendorCreditForm: UntypedFormGroup;
  loading = signal(false);

  constructor() {
    this.initForm();
    this.setupFormValidation();
  }

  initForm() {
    this.applyVendorCreditForm = this.formBuilder.group({
      creditAmount: ['', [Validators.required, this.creditValidator.bind(this)]]
    });
  }

  setupFormValidation() {
    this.applyVendorCreditForm.controls.creditAmount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyVendorCreditForm.controls.creditAmount.updateValueAndValidity(
          {
            onlySelf: true,
            emitEvent: false
          }
        );
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
    const creditAmount =
      parseFloat(this.applyVendorCreditForm.controls.creditAmount.value) || 0;
    return this.data.billAmount - creditAmount;
  }

  onSubmit() {
    if (this.applyVendorCreditForm.invalid) {
      this.applyVendorCreditForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const creditAmount = this.applyVendorCreditForm.controls.creditAmount.value;

    this.billService
      .validateCreditApplied(this.data.billId, Number(creditAmount))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response?.success) {
            const confirm = this.alertService.confirmAlert({
              content: `Are you sure you want to continue with the amount $${response.data?.amountAfterCreditApplied} ?`,
              title: 'Confirm Payment',
              doneMsg: 'Continue',
              cancelMsg: 'Not Now'
            });
            confirm.afterClosed().subscribe((result) => {
              if (result) {
                this.dialogRef.close(response);
              } else {
                this.dialogRef.close({
                  success: false,
                  type: 'cancel'
                });
              }
            });
          }
        },
        error: (err?:HttpErrorResponse) => {
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
      });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
