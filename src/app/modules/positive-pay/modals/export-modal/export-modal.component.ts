import { DatePipe, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject
} from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions,
  MatDialogRef
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { DateRangeSelectorV35Component } from 'src/app/shared/components/date-range-selector-v35/date-range-selector-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IExportModalData, IExportPayload } from '../../model/postive-pay';

@Component({
  selector: 'app-export-modal',
  templateUrl: './export-modal.component.html',
  styleUrls: ['./export-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatRadioGroup,
    MatRadioButton,
    MatDialogActions,
    NgIf,
    FontAwesomeModule,
    CommonButtonV35Component,
    DateRangeSelectorV35Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportModalComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private positivePayService = inject(PositivePayService);
  private datePipe = inject(DatePipe);
  private dialogRef = inject(MatDialogRef);
  private alertService = inject(AlertService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  public data: IExportModalData = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  loading = false;
  faXmark = faXmark;
  exportForm = this.fb.group({
    fromDate: [new Date()],
    toDate: [new Date()],
    fileType: ['txt', [Validators.required]]
  });

  /**
   * @description Sets the values of the `fromDate` and `toDate` form controls based on the provided date range.
   * @param {Object} dateEvent - The date range event object.
   */
  selectedRange(dateEvent: { end: Date | null; start: Date | null }): void {
    this.exportForm?.controls?.fromDate?.setValue(dateEvent?.start);
    this.exportForm?.controls?.toDate?.setValue(dateEvent?.end);
  }

  /**
   * @description Constructs an export payload object from the form data.
   * @returns {IExportPayload} An object containing the export payload with transformed dates, file type, and routing number.
   */
  fromBody(): IExportPayload {
    const formData = this.exportForm.value;
    const checkFromDate = this.datePipe.transform(formData.fromDate, 'MM/dd/Y');
    const checkToDate = this.datePipe.transform(formData.toDate, 'MM/dd/Y');
    return {
      checkIssueFromDate: checkFromDate,
      checkIssueToDate: checkToDate,
      fileType: formData.fileType,
      routingNumber: this.data.bank_routing_number
    };
  }

  /**
   * @description Handles the form submission process.
   */
  submit(): void {
    this.exportForm.markAllAsTouched();
    if (this.exportForm.invalid) {
      return;
    }
    this.loading = true;

    const processedData = this.fromBody();

    this.subscriptions.push(
      this.positivePayService
        .export(processedData)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.changeDetectorRef.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const link = document.createElement('a');
            link.setAttribute('href', res.url);
            link.click();
            link.setAttribute('target', '_self');
            link.setAttribute('download', `products.csv`);
            document.body.appendChild(link);
            link.remove();
            this.dialogRef.close();
            this.alertService.successAlert({
              content: 'Successfully downloaded.',
              close: true
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
