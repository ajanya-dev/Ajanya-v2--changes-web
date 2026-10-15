import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';

import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DateRangeSelectorComponent } from 'src/app/shared/V4/v4-date-range-selector/v4-date-range-selector.component';
import {
  IExportModalData,
  IExportPayload
} from '../../../positive-pay/model/postive-pay';

@Component({
  selector: 'app-v4-export-modal',
  templateUrl: './v4-export-modal.component.html',
  styleUrls: ['./v4-export-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatRadioGroup,
    MatRadioButton,
    LucideAngularModule,
    CommonButtonV4Component,
    V4DateRangeSelectorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4ExportModalComponent {
  private fb = inject(FormBuilder);
  private positivePayService = inject(PositivePayService);
  private datePipe = inject(DatePipe);
  private dialogRef = inject(MatDialogRef<V4ExportModalComponent>);
  private alertService = inject(V4AlertService);

  private destroyRef = inject(DestroyRef);
  public data: IExportModalData = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  isSubmitting = signal(false);

  exportForm = this.fb.group({
    fromDate: [new Date()],
    toDate: [new Date()],
    fileType: ['txt', [Validators.required]]
  });

  selectedRange(dateEvent: { end: Date | null; start: Date | null }): void {
    this.exportForm.controls.fromDate.setValue(dateEvent?.start);
    this.exportForm.controls.toDate.setValue(dateEvent?.end);
  }

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

  submit(): void {
    this.exportForm.markAllAsTouched();
    if (this.exportForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const processedData = this.fromBody();

    this.positivePayService
      .export(processedData)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
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
        }
      });
  }
}
