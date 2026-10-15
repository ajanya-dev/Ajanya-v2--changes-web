import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { LucideAngularModule, Table } from 'lucide-angular';
import { IImportCheckData } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  standalone: true,
  selector: 'app-youngwilliams-import-step2-v4',
  templateUrl: './youngwilliams-import-step2-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  imports: [FormsModule, LucideAngularModule, CommonButtonV4Component]
})
export class YoungwilliamsImportStep2V4Component implements OnInit {
  readonly TableIcon = Table;

  cancel = output<void>();
  submitSuccess = output<void>();

  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  loading = true;
  submitting = false;
  data: IImportCheckData[] = [];
  rowCount = 0;
  totalAmount = 0;

  get firstRow(): IImportCheckData | undefined {
    return this.data[0];
  }

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    this.loading = true;
    this.checkService
      .multiImportTxtToCheckGetLatest()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.data = res.data.rows ?? [];
            this.rowCount = res.data.rowCount ?? 0;
            this.totalAmount = res.data.totalAmount ?? 0;
            this.data.forEach((e) => (e.selected = true));
          }
        },
        error: () => {
          this.alertService.failedAlert({ content: 'Failed to load imported checks.' });
        }
      });
  }

  toggleSelectAll(checked: boolean): void {
    this.data.forEach((e) => (e.selected = checked));
  }

  get allSelected(): boolean {
    return this.data.length > 0 && this.data.every((e) => e.selected);
  }

  submit(): void {
    const entry = this.data.filter((e) => e.selected).map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Please select at least one check to import.' });
      return;
    }
    this.submitting = true;
    this.checkService
      .multiImportTxtToCheckLastStep({ entry })
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Checks imported successfully.',
              close: true,
              timeout: 2000
            });
            this.submitSuccess.emit();
          }
        },
        error: () => {
          this.alertService.failedAlert({ content: 'Failed to import checks.' });
        }
      });
  }
}
