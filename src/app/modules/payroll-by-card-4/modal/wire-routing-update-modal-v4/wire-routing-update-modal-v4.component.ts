import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X, Info } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';

@Component({
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    ReactiveFormsModule,
    V4ControlMessageComponent
  ],
  selector: 'app-wire-routing-update-modal-v4',
  templateUrl: './wire-routing-update-modal-v4.component.html',
  styleUrls: ['./wire-routing-update-modal-v4.component.scss']
})
export class WireRoutingUpdateModalV4Component implements OnInit, OnDestroy {
  public dialogRef = inject(MatDialogRef<WireRoutingUpdateModalV4Component>);
  private payrollService = inject(PayrollService);
  public data: { bankAc: IBankDropdown } = inject(MAT_DIALOG_DATA);
  private alertService = inject(V4AlertService);

  readonly XIcon = X;
  readonly InfoIcon = Info;

  bankAc: IBankDropdown;
  subscriptions: Subscription[] = [];
  isWireUpdating = signal(false);

  wireRoutingNumber = new FormControl('', [
    Validators.required,
    Validators.maxLength(9),
    Validators.minLength(9)
  ]);

  ngOnInit(): void {
    this.bankAc = this.data?.bankAc;
  }

  /**
   * @description Method to submit the wire routing number data.
   */
  addWireRouting() {
    if (this.wireRoutingNumber.valid) {
      this.isWireUpdating.set(true);
      this.subscriptions.push(
        this.payrollService
          .addWireRouting({
            bankAccountId: this.bankAc?.id,
            wireRoutingNumber: this.wireRoutingNumber.value as string
          })
          .pipe(
            finalize(() => {
              this.isWireUpdating.set(false);
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.successAlert({ content: res.message });
                this.dialogRef.close({
                  wireRoutingNumber: this.wireRoutingNumber.value
                });
              }
            },
            error: (err) => {
              if (err.errorMsg) {
                this.alertService.warningAlert({ content: err.errorMsg });
              }
            }
          })
      );
    } else {
      this.wireRoutingNumber.markAllAsTouched();
    }
  }

  /** Unsubscribe all active subscriptions to prevent memory leaks */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
