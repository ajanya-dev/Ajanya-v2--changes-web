import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TReportIds } from 'src/app/modules/more/model/all-reports';
import { SelectedDateService } from 'src/app/shared/components/date-range/selected.service';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { DateRangeComponent } from '../../../../shared/components/date-range/date-range.component';
import { NgIf, NgClass } from '@angular/common';

/**
 * Represents the metadata for form control configurations.
 */
interface IFormControlMetaData {
  show?: boolean;
}

/**
 * Component for displaying a common report modal.
 */
@Component({
  selector: 'app-common-report-modal',
  templateUrl: './common-report-modal.component.html',
  styleUrls: ['./common-report-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    DateRangeComponent,
    NgClass
  ]
})
export class CommonReportModalComponent implements OnInit, OnDestroy {
  /** Indicates whether a request is currently loading. */
  loading: boolean;
  /** List of subscriptions to be unsubscribed when the component is destroyed. */
  subscriptions: Subscription[] = [];
  /** Selected report format (pdf, excel, csv). */
  selectedFormate: 'pdf' | 'excel' | 'csv' = 'pdf';
  /** The report form group. */
  reportForm: UntypedFormGroup;
  /** The ID of the report. */
  reportId: string;
  /** Metadata for controlling the visibility of form controls. */
  reportFormMetaData: {
    type?: IFormControlMetaData;
    fromDate?: IFormControlMetaData;
    formate?: IFormControlMetaData;
  } = {};

  constructor(
    private formBuilder: UntypedFormBuilder,
    private _reportService: ReportsService,
    private _selectedService: SelectedDateService,
    @Inject(MAT_DIALOG_DATA) private dialogData: { reportId: TReportIds },
    private _dialogRef: MatDialogRef<CommonReportModalComponent>
  ) {}

  ngOnInit(): void {
    this.initReportDetails();
    this.iniForm();
    this._selectedService.setValue('This Year');
    this.calculateThisYear();
  }

  /**
   * Initializes report details based on the report ID.
   */
  initReportDetails() {
    this.reportId = this.dialogData.reportId;
    switch (this.reportId) {
      case 'check-register-report':
        this.reportFormMetaData = {
          type: { show: true },
          fromDate: { show: true },
          formate: { show: true }
        };
        break;
      case 'job-processing-summary':
        this.reportFormMetaData = {
          type: { show: true },
          fromDate: { show: true },
          formate: { show: true }
        };
        break;
      case 'user-summary-report':
        this.reportFormMetaData = {
          type: { show: false },
          fromDate: { show: true },
          formate: { show: true }
        };
        break;
    }
  }

  /**
   * Initializes the report form.
   */
  iniForm(): void {
    this.reportForm = this.formBuilder.group({
      type: ['1'],
      fromDate: ['', Validators.required],
      toDate: [''],
      formate: ['pdf']
    });
  }

  /**
   * Handles the selection of a date range.
   * @param dateEvent The selected date range.
   */
  selectedRange(dateEvent: { end: Date; start: Date }): void {
    this.reportForm?.controls?.fromDate?.setValue(
      this.getFormatedDate(dateEvent?.start)
    );
    this.reportForm?.controls?.toDate?.setValue(
      this.getFormatedDate(dateEvent?.end)
    );
  }

  /**
   * Selects the file format (pdf, excel, csv).
   * @param fileFormate The selected file format.
   */
  selectFileFormate(fileFormate: 'pdf' | 'excel' | 'csv'): void {
    this.selectedFormate = fileFormate;
    this.reportForm?.controls?.formate?.setValue(fileFormate);
  }

  /**
   * Calculates the date range for "This Year."
   */
  calculateThisYear(): void {
    const today = new Date(); // get current date
    const year = today.getFullYear(); // get current year
    const startDate = new Date(year, 0, 1); // January 1st of current year
    const endDate = new Date(year, 11, 31); // December 31st of current year
    this.reportForm?.patchValue({
      fromDate: this.getFormatedDate(startDate),
      toDate: this.getFormatedDate(endDate)
    });
  }

  /**
   * Formats a date to a string.
   * @param unformattedDate The unformatted date.
   * @returns The formatted date string.
   */
  getFormatedDate(unformatedDate: Date): string {
    const fullDate = new Date(unformatedDate);
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth() + 1;
    const date = fullDate?.getDate();
    const formatedDate = `${month}/${date}/${year}`;
    return formatedDate;
  }

  /**
   * Generates a report based on the selected report ID.
   */
  generateReport() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }
    switch (this.reportId) {
      case 'check-register-report':
        this.generateCheckRegisterReport();
        break;

      case 'job-processing-summary':
        this.generateJobProcesingSummary();
        break;
      case 'user-summary-report':
        this.generateUserSummaryReport();
        break;
    }
  }

  /**
   * Generates a check register report.
   */
  generateCheckRegisterReport() {
    const reportFormValue = this.reportForm.value;
    const postData = {
      type: reportFormValue.type,
      start_date: reportFormValue.fromDate,
      end_date: reportFormValue.toDate
    };
    this.subscriptions.push(
      this._reportService
        .getCheckRegisterReport(postData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res?.data) {
              window.open(res?.data);
              this._dialogRef.close();
              return;
            }
          }
        })
    );
  }

  /**
   * Generates a job processing summary report.
   */
  generateJobProcesingSummary() {
    const reportFormValue = this.reportForm.value;
    const postData = {
      type: reportFormValue.type,
      start_date: reportFormValue.fromDate,
      end_date: reportFormValue.toDate
    };
    this.subscriptions.push(
      this._reportService
        .getJobProcesingSummaryReport(postData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res?.data) {
              window.open(res?.data);
              this._dialogRef.close();
              return;
            }
          }
        })
    );
  }

  /**
   * Generates a user summary report.
   */
  generateUserSummaryReport() {
    const reportFormValue = this.reportForm.value;
    const postData = {
      start_date: reportFormValue.fromDate,
      end_date: reportFormValue.toDate
    };
    this.subscriptions.push(
      this._reportService
        .getUserJobSummaryReport(postData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res?.data) {
              window.open(res?.data);
              this._dialogRef.close();
              return;
            }
          }
        })
    );
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
