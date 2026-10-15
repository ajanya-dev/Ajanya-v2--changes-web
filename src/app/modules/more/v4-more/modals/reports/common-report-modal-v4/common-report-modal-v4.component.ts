import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DateRangeSelectorComponent } from 'src/app/shared/V4/v4-date-range-selector/v4-date-range-selector.component';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { SelectedDateService } from 'src/app/shared/components/date-range/selected.service';
import { TReportIds } from 'src/app/modules/more/model/all-reports';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';

/**
 * Represents the metadata for form control configurations.
 */
interface IFormControlMetaData {
  show?: boolean;
}

/**
 * V4 modal component for downloading common reports
 * (check-register, job-processing-summary, user-summary).
 */
@Component({
  selector: 'app-common-report-modal-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    V4RadioGroupComponent,
    V4DateRangeSelectorComponent,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component
  ],
  template: `
    <!-- Header -->
    <div
      class="flex justify-between items-start px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
    >
      <div class="flex flex-col">
        <h1 class="text-lg font-semibold text-v4-main-text-color font-peridot">
          Download Report
        </h1>
        <span class="text-xs text-v4-secondary-text-color font-peridot">
          Configure and export your report
        </span>
      </div>
      <div
        role="button"
        tabindex="0"
        (click)="dialogRef.close(false)"
        (keydown.enter)="dialogRef.close(false)"
        (keydown.space)="dialogRef.close(false); $event.preventDefault()"
        class="w-8 h-8 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
      >
        <lucide-icon name="x" [size]="18" class="text-v4-subtle-text-color" />
      </div>
    </div>

    <!-- Body -->
    <div
      class="px-6 py-5 bg-v4-tertiary-background-color flex flex-col gap-5"
      [formGroup]="reportForm"
    >
      <!-- Date Range -->
      @if (reportFormMetaData.fromDate?.show) {
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            Date Range
          </span>
          <app-v4-date-range-selector
            (dateEmiter)="selectedRange($event)"
            selectDate="this-year"
          />
        </div>
      }

      <!-- Select Type -->
      @if (reportFormMetaData.type?.show) {
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            Select Type
          </span>
          <app-v4-common-dropdown
            formControlName="type"
            [config]="{
              placeholder: 'Select',
              displayField: 'name',
              outputField: 'id'
            }"
            [listData]="typeOptions"
          />
        </div>
      }

      <!-- File Format -->
      @if (reportFormMetaData.formate?.show) {
        <div class="flex flex-col gap-2">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            File Format
          </span>
          <app-v4-radio-group
            [options]="fileFormatOptions"
            [(ngModel)]="selectedFormate"
            [ngModelOptions]="{ standalone: true }"
            (selectionChange)="selectFileFormate($event)"
          />
        </div>
      }
    </div>

    <!-- Footer -->
    <div class="flex justify-end px-6 pb-5 pt-2 bg-v4-tertiary-background-color">
      <app-common-button-v4
        [type]="{ style: 'primary', name: 'main' }"
        text="Download"
        lucideIcon="download"
        [lucideIconSize]="16"
        [customClasses]="'!py-2.5 !px-5'"
        [textClasses]="'!text-sm'"
        [loading]="loading"
        [disabled]="loading"
        (clickEvent)="generateReport()"
      />
    </div>
  `
})
export class CommonReportModalV4Component implements OnInit {
  private formBuilder = inject(FormBuilder);
  private reportService = inject(ReportsService);
  private selectedService = inject(SelectedDateService);
  private dialogData: { reportId: TReportIds } = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<CommonReportModalV4Component>);
  private destroyRef = inject(DestroyRef);

  /** Indicates whether a request is currently loading. */
  loading = false;

  /** Selected report format (pdf, excel, csv). */
  selectedFormate: 'pdf' | 'excel' | 'csv' = 'pdf';

  fileFormatOptions = [{ id: 'pdf', name: 'PDF' }];

  /** Options for the Select Type dropdown. */
  typeOptions = [
    { id: '1', name: 'NIVD' },
    { id: '2', name: 'IVD' }
  ];

  /** The report form group. */
  reportForm: FormGroup;

  /** The ID of the report. */
  reportId: string;

  /** Metadata for controlling the visibility of form controls. */
  reportFormMetaData: {
    type?: IFormControlMetaData;
    fromDate?: IFormControlMetaData;
    formate?: IFormControlMetaData;
  } = {};

  ngOnInit(): void {
    this.initReportDetails();
    this.iniForm();
    this.selectedService.setValue('This Year');
    this.calculateThisYear();
  }

  /**
   * Initializes report details based on the report ID.
   */
  initReportDetails(): void {
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
      default:
        // Unknown report ID; reportFormMetaData remains initial {}
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
  selectedRange(dateEvent: { end: string | null; start: string | null }): void {
    if (dateEvent?.start != null && dateEvent?.end != null) {
      this.reportForm?.controls?.fromDate?.setValue(
        this.getFormatedDate(new Date(dateEvent.start))
      );
      this.reportForm?.controls?.toDate?.setValue(
        this.getFormatedDate(new Date(dateEvent.end))
      );
    }
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
    const today = new Date();
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    this.reportForm?.patchValue({
      fromDate: this.getFormatedDate(startDate),
      toDate: this.getFormatedDate(endDate)
    });
  }

  /**
   * Formats a date to a string in M/D/YYYY format.
   * @param unformatedDate The unformatted date.
   * @returns The formatted date string.
   */
  getFormatedDate(unformatedDate: Date): string {
    const fullDate = new Date(unformatedDate);
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth() + 1;
    const date = fullDate.getDate();
    return `${month}/${date}/${year}`;
  }

  /**
   * Generates a report based on the selected report ID.
   */
  generateReport(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    switch (this.reportId) {
      case 'check-register-report':
        this.generateCheckRegisterReport();
        break;
      case 'job-processing-summary':
        this.generateJobProcessingSummary();
        break;
      case 'user-summary-report':
        this.generateUserSummaryReport();
        break;
      default:
        this.loading = false;
        break;
    }
  }

  /**
   * Generates a check register report.
   */
  private generateCheckRegisterReport(): void {
    const reportFormValue = this.reportForm.value;
    const postData = {
      type: reportFormValue.type,
      start_date: reportFormValue.fromDate,
      end_date: reportFormValue.toDate
    };
    this.reportService
      .getCheckRegisterReport(postData)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          if (res?.data) {
            window.open(res.data);
            this.dialogRef.close();
          }
        }
      });
  }

  /**
   * Generates a job processing summary report.
   */
  private generateJobProcessingSummary(): void {
    const reportFormValue = this.reportForm.value;
    const postData = {
      type: reportFormValue.type,
      start_date: reportFormValue.fromDate,
      end_date: reportFormValue.toDate
    };
    this.reportService
      .getJobProcesingSummaryReport(postData)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          if (res?.data) {
            window.open(res.data);
            this.dialogRef.close();
          }
        }
      });
  }

  /**
   * Generates a user summary report.
   */
  private generateUserSummaryReport(): void {
    const reportFormValue = this.reportForm.value;
    const postData = {
      start_date: reportFormValue.fromDate,
      end_date: reportFormValue.toDate
    };
    this.reportService
      .getUserJobSummaryReport(postData)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          if (res?.data) {
            window.open(res.data);
            this.dialogRef.close();
          }
        }
      });
  }
}
