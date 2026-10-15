import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { Utils } from 'src/app/data/utils';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayrollService } from '../../services/payroll.service';

@Component({
  standalone: true,
  imports: [
    MatDialogModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    ReactiveFormsModule,
    ControlMessageComponent
  ],
  selector: 'app-wire-routing-update-modal',
  templateUrl: './wire-routing-update-modal.component.html',
  styleUrls: ['./wire-routing-update-modal.component.scss']
})
export class WireRoutingUpdateModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<WireRoutingUpdateModalComponent>);
  private payrollService = inject(PayrollService);
  public data: { bankAc: IBankDropdown } = inject(MAT_DIALOG_DATA);
  private alertService = inject(AlertService);

  faXmark = faXmark;
  faInfoCircle = faInfoCircle;

  bankAc: IBankDropdown;
  subscriptions: Subscription[] = [];
  isWireUpdating = signal(false);

  utils = Utils;

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
        });
    } else {
      this.wireRoutingNumber.markAllAsTouched();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
