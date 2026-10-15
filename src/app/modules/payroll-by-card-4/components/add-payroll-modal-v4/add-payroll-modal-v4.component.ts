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
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, X, CloudUpload, FileText } from 'lucide-angular';
import { Subscription, finalize } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { payrollBackDatedLimitValidator } from 'src/app/shared/service/validation/validation.service';
import { CommonInputFieldV4Component } from '../../../../shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from '../../../../shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonUploadButtonV4Component } from '../../../../shared/V4/buttons/common-upload-button-v4/common-upload-button-v4.component';
import { V4DatePickerComponent } from '../../../../shared/V4/v4-date-picker/v4-date-picker.component';
import {
  PAYROLL_DATE_LIMIT,
  PayrollService,
  payrollSamples
} from '../../../payroll-by-card/services/payroll.service';

@Component({
  selector: 'app-add-payroll-modal-v4',
  templateUrl: './add-payroll-modal-v4.component.html',
  styleUrls: ['./add-payroll-modal-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    CommonUploadButtonV4Component,
    V4DatePickerComponent,
    LucideAngularModule
  ]
})
export class AddPayrollModalV4Component implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef);
  private fb = inject(FormBuilder);
  private dialogData = inject(MAT_DIALOG_DATA);
  private payrollService = inject(PayrollService);
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(V4AlertService);
  private integrationService = inject(IntegrationService);

  readonly XIcon = X;
  readonly UploadCloudIcon = CloudUpload;
  readonly FileIcon = FileText;

  payrollForm: FormGroup;
  payrollStatement: File | undefined;
  isHidden = false;
  appId = this.dialogData.appId;
  showError = false;
  btnDisable = false;
  samplePayrollDetails = payrollSamples;
  loading: boolean;
  /**
   * File types accepted for the payroll statement. Drives both the file picker
   * filter and the unsupported format warning, same as the `acceptedFileTypes`
   * input of the shared upload button used in V3.
   */
  acceptedFileTypes = ['.pdf', '.rtf', '.doc', '.docx', '.txt', '.jpg', '.png'];
  subscriptions: Subscription[] = [];
  minDate: string;
  todayDate: string;
  providerNames: Record<string, string> = {
    paychexWireTransfer: 'Paychex',
    gustoPaymentStatement: 'Gusto',
    adpPayrollSummary: 'ADP'
  };

  providerIcons: Record<string, string> = {
    paychexWireTransfer: 'assets/images/integration/paychex.png',
    gustoPaymentStatement: 'assets/images/integration/gusto-latest-logo.png',
    adpPayrollSummary: 'assets/images/integration/adp-logo1.png'
  };

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
          this.samplePayrollDetails = this.samplePayrollDetails.map((entry) => {
            if (samplePdf[entry.name]) {
              return { ...entry, samplePdf: samplePdf[entry.name] };
            }
            return entry;
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
    this.payrollService
      .addManualPayrollData(payrollBody)
      .pipe(
        finalize(() => {
          this.btnDisable = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close();
          this.v3DataTableService.refreshV3DataTable();
          this.alertService.successAlert({
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
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
