import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, Table } from 'lucide-angular';
import { IImportCheckData } from 'src/app/modules/check/model/check';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-excel-import-step3',
  templateUrl: './v4-excel-import-step3.component.html',
  styleUrls: ['./v4-excel-import-step3.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block h-full' },
  imports: [FormsModule, NgClass, LucideAngularModule, CommonButtonV4Component]
})
export class V4ExcelImportStep3Component implements OnInit {
  // Signal inputs
  source = input<string>('');

  // Signal outputs
  cancel = output<void>();
  submitSuccess = output<{ source: string }>();
  processNowSuccess = output<{ source: string; zilPaymentIds: string[] }>();

  // Lucide icons
  readonly TableIcon = Table;

  // Services
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  // State
  loading = true;
  submitting = false;
  processing = false;
  data: IImportCheckData[] = [];
  importData: IImportCheckData;

  ngOnInit(): void {
    this.getData();
  }

  getData() {
    this.loading = true;
    const apiSource =
      this.source() === 'wallet' ? 'wallet-checks' : 'checks-import';
    this.checkService
      .multiImportStep4(apiSource)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (data?.success) {
            this.data = data?.data;
            this.data.forEach((e) => {
              e.selected = true;
            });
            this.importData = this.data[0];
          }
        },
        error: () => {
          this.alertService.failedAlert({
            content: 'Failed to load imported checks.'
          });
        }
      });
  }

  toggleSelect(val: boolean) {
    this.data.forEach((e) => {
      e.selected = val;
    });
  }

  submit() {
    const entry = this.data.filter((e) => e.selected).map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    const apiSource =
      this.source() === 'wallet' ? 'wallet-checks' : 'checks-import';
    this.submitting = true;
    this.checkService
      .multiImportStep5(body, apiSource)
      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Checks imported.',
              close: true,
              timeout: 2000
            });
            this.submitSuccess.emit({ source: this.source() });
          }
        },
        error: () => {
          this.alertService.failedAlert({
            content: 'Failed to submit checks.'
          });
        }
      });
  }

  processNow() {
    const entry = this.data.filter((e) => e.selected).map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    const apiSource =
      this.source() === 'wallet' ? 'wallet-checks' : 'checks-import';
    this.processing = true;
    this.checkService
      .multiImportStep5(body, apiSource)
      .pipe(
        finalize(() => {
          this.processing = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content:
                'Your payment has been saved. Please check the status in your records.',
              close: true,
              timeout: 2000
            });
            this.processNowSuccess.emit({
              source: this.source(),
              zilPaymentIds: res?.zilPaymentIds
            });
          }
        },
        error: () => {
          this.alertService.failedAlert({
            content: 'Failed to process checks.'
          });
        }
      });
  }

}
