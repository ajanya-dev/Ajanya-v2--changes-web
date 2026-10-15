import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IConnectedCompanyList } from 'src/app/modules/integration/model/integration';

interface IPayPeriodRow {
  pay_date: string;
  pay_period_start_date: string;
  pay_period_end_date: string;
  processing_period: string;
  payroll_run_id: string;
}

@Component({
  selector: 'app-v4-zoho-payroll-pay-period-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-zoho-payroll-pay-period-modal.component.html',
  imports: [
    MatDialogModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4ZohoPayrollPayPeriodModalComponent implements OnInit {
  private dialogRef = inject(
    MatDialogRef<V4ZohoPayrollPayPeriodModalComponent>
  );

  private destroyRef = inject(DestroyRef);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private changeDetector = inject(ChangeDetectorRef);

  readonly data: { company: IConnectedCompanyList } = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  importingIndex = signal<number | undefined>(undefined);
  payPeriods = signal<IPayPeriodRow[]>([]);
  alreadyImported = signal<string[]>([]);

  ngOnInit(): void {
    this.loadPayPeriods();
  }

  private loadPayPeriods(): void {
    this.loading.set(true);
    this.changeDetector.markForCheck();
    this.integrationService
      .importPayrollPayPeriod(this.data.company.companyId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          const payload = (
            res as unknown as {
              data?: { data?: IPayPeriodRow[]; dbPayrun?: string[] };
            }
          ).data;
          this.payPeriods.set(payload?.data ?? []);
          this.alreadyImported.set(payload?.dbPayrun ?? []);
          this.changeDetector.markForCheck();
        }
      });
  }

  importTransactions(row: IPayPeriodRow, index: number): void {
    this.importingIndex.set(index);
    this.changeDetector.markForCheck();
    this.integrationService
      .importPayrollTransactions(
        this.data.company.companyId,
        row.payroll_run_id
      )
      .pipe(
        finalize(() => {
          this.importingIndex.set(undefined);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Successfully imported.',
            close: true
          });
          this.alreadyImported.update((list) => [...list, row.payroll_run_id]);
          this.changeDetector.markForCheck();
        }
      });
  }

  isImported(row: IPayPeriodRow): boolean {
    return this.alreadyImported().includes(row.payroll_run_id);
  }

  close(): void {
    this.dialogRef.close();
  }
}
