import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  PAYROLL_DATE_LIMIT,
  PayrollService,
  payrollSamples
} from '../../services/payroll.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { CommonUploadButtonV35Component } from '../../../../shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgxMaskDirective } from 'ngx-mask';
import { payrollBackDatedLimitValidator } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-add-payroll-modal',
  templateUrl: './add-payroll-modal.component.html',
  styleUrls: ['./add-payroll-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    ControlMessageComponent,
    CommonUploadButtonV35Component,
    NgIf,
    NgFor,
    NgClass,
    FaIconComponent,
    MatDialogActions
  ]
})
export class AddPayrollModalComponent implements OnInit, OnDestroy {
  private _dialogRef = inject(MatDialogRef);
  private fb = inject(FormBuilder);
  private _dialogData = inject(MAT_DIALOG_DATA);
  private _payrollService = inject(PayrollService);
  private _v3DataTableService = inject(V3DataTableService);
  private _alertService = inject(AlertService);
  private integrationService = inject(IntegrationService);

  payrollForm: FormGroup;
  payrollStatement: File | undefined;
  isHidden = false;
  appId = this._dialogData.appId;
  showError = false;
  btnDisable = false;
  samplePayrollDetails = payrollSamples;
  loading: boolean;
  subscriptions: Subscription[] = [];
  minDate: string;
  todayDate: string;

  ngOnInit(): void {
    this.setMinDate();
    this.initFormGroup();
    this.loadSampleFiles();
  }

  /**
   * @description Sets today as the default check date and allows the check date
   * to be back dated up to `PAYROLL_DATE_LIMIT` days.
   */
  setMinDate(): void {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - PAYROLL_DATE_LIMIT);
    this.minDate = minDate.toISOString().split('T')[0];
  }

  loadSampleFiles() {
    this.loading = true;
    this.subscriptions.push(
      this.integrationService
        .getPayrollCheckSampleFiles()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          const samplePdf: { [key: string]: string } = res.data.newPayrolls;
          this.samplePayrollDetails.forEach((item) => {
            if (samplePdf[item.name]) {
              item.samplePdf = samplePdf[item.name];
            }
          });
        })
    );
  }

  /**
   * @description Initializes the bank Form.
   */
  initFormGroup() {
    this.payrollForm = this.fb.group({
      grossPay: ['', [Validators.required]],
      checkDate: [
        this.todayDate,
        [
          Validators.required,
          payrollBackDatedLimitValidator(this.minDate, PAYROLL_DATE_LIMIT)
        ]
      ]
    });
  }

  /**
   * @description Funciton to be called when there is file input change event. if event has files in target property, we are just storing that file to currespoding variable.
   * @param file - we should pass this param to know which file are we choosing. so we can store the file in currespoding variable.
   */
  filePicked(event: File) {
    if (!event.name) {
      this.showError = true;
      this.payrollStatement = undefined;
    } else {
      this.payrollStatement = event;
      this.showError = false;
    }
  }

  submit() {
    this.payrollForm.markAllAsTouched();
    if (this.payrollForm.invalid || !this.payrollStatement) {
      if (!this.payrollStatement) {
        this.showError = true;
      }
      return;
    }

    this.showError = false;
    this.btnDisable = true;
    const payrollBody = this.getPayrollBody();
    this._payrollService
      .addManualPayrollData(payrollBody)
      .pipe(finalize(() => (this.btnDisable = false)))
      .subscribe((res) => {
        if (res.success) {
          this._dialogRef.close();
          this._v3DataTableService.refreshV3DataTable();
          this._alertService.successAlert({
            content: res.message,
            timeout: 2000
          });
        }
      });
  }

  getPayrollBody() {
    const data = this.payrollForm.value;
    const formData = new FormData();
    formData.append('appId', this.appId);
    formData.append('grossPay', data.grossPay);
    formData.append('checkDate', data.checkDate);
    if (this.payrollStatement) {
      formData.append(`document[payrollStatement]`, this.payrollStatement);
    }
    return formData;
  }

  /**
   * @description Close the modal
   */
  close() {
    this._dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
