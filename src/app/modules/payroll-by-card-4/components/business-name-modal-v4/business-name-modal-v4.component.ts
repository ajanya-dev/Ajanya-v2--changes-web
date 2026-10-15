import { Component, inject, OnInit } from '@angular/core';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup
} from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, X } from 'lucide-angular';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';

@Component({
  selector: 'app-business-name-modal-v4',
  templateUrl: './business-name-modal-v4.component.html',
  styleUrls: ['./business-name-modal-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    LucideAngularModule
  ]
})
export class BusinessNameModalV4Component implements OnInit {
  private payrollService = inject(PayrollService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef);
  public dialogData: {
    bypassedFor: number;
    appIndex: number;
    appTitle: string;
  } = inject(MAT_DIALOG_DATA);

  bypassedFor: number;
  buisnessName = new FormControl<string>('', Validators.required);
  isLoading = false;
  readonly XIcon = X;
  businessForm = new FormGroup({
    buisnessName: new FormControl('', [Validators.required, Validators.maxLength(90)]),
    providerName: new FormControl('')
  });

  ngOnInit(): void {
    this.bypassedFor = this.dialogData.bypassedFor;
    this.setValidation();
  }

  setValidation() {
    if (this.dialogData.appTitle === 'manual') {
      this.businessForm.controls.providerName.addValidators(
        Validators.required
      );
    } else {
      this.businessForm.controls.providerName.clearValidators();
    }
    this.businessForm.updateValueAndValidity();
  }

  /**
   * @description Runs the KYB (Know Your Business) bypass process.
   *
   */
  runKybBypass() {
    this.businessForm.markAllAsTouched();
    if (this.businessForm.invalid) {
      return;
    }
    const body = {
      kybBypassedUser: 1,
      bypassedFor: this.bypassedFor,
      bypassedBusinessName: this.businessForm.controls.buisnessName.value ?? '',
      bypass_universal_payroll_kyb_check: 0,
      payroll_provider_name:
        this.dialogData?.appTitle === 'manual'
          ? (this.businessForm.controls.providerName.value ?? '')
          : this.dialogData?.appTitle,
      manual_payroll_provider_id: this.dialogData?.appIndex
    };

    this.isLoading = true;
    this.payrollService
      .addManualPayroll(body)
      .pipe(
        catchError((error) => {
          this.isLoading = false;
          return throwError(() => error);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.isLoading = false;
          this.alertService.successAlert({ content: 'Connected Successfully' });
          this.payrollService.isConnectedSuccess.next(true);
        }
      });
  }

  /**
   * @description Close the modal
   */
  close() {
    this.dialogRef.close();
  }
}
