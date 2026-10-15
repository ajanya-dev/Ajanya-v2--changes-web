import { Component, inject, OnInit } from '@angular/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
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
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { PayrollService } from '../../services/payroll.service';

@Component({
  selector: 'app-business-name-modal',
  templateUrl: './business-name-modal.component.html',
  styleUrls: ['./business-name-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    FaIconComponent
  ]
})
export class BusinessNameModalComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef);
  public dialogData: {
    bypassedFor: number;
    appIndex: number;
    appTitle: string;
  } = inject(MAT_DIALOG_DATA);

  bypassedFor: number;
  buisnessName = new FormControl<string>('', Validators.required);
  isLoading = false;
  faXmark = faXmark;
  businessForm = new FormGroup({
    buisnessName: new FormControl('', [Validators.required]),
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
