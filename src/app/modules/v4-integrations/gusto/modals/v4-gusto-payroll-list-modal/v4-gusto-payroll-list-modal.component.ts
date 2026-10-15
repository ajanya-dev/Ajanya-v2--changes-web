import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IConnectedCompanyList } from 'src/app/modules/integration/model/integration';

interface IPayrollRow {
  payroll_uuid: string;
  payroll_id?: string;
  pay_period?: { start_date?: string; end_date?: string };
  processed_date?: string;
  check_date?: string;
  off_cycle?: boolean;
}

@Component({
  selector: 'app-v4-gusto-payroll-list-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-gusto-payroll-list-modal.component.html',
  styleUrls: ['./v4-gusto-payroll-list-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatRadioModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4GustoPayrollListModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  readonly providerCode = 'gusto' as const;
  readonly data: { company: IConnectedCompanyList; offCycleOnly: boolean } =
    inject(MAT_DIALOG_DATA);

  importType = new FormControl<'all' | 'check' | 'direct'>('all');

  loading = signal(false);
  importing = signal<string | null>(null);
  payrolls = signal<IPayrollRow[]>([]);

  ngOnInit(): void {
    this.loadPayrolls();
  }

  loadPayrolls(): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.integrationService
      .getPayroll(
        this.providerCode,
        this.data.company.companyId,
        this.data.offCycleOnly
      )
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const data = res?.data;
        if (Array.isArray(data)) {
          this.payrolls.set(data as IPayrollRow[]);
        } else if (Array.isArray(data?.payrolls)) {
          this.payrolls.set(data.payrolls as IPayrollRow[]);
        } else {
          this.payrolls.set([]);
        }
        this.cdr.markForCheck();
      });
  }

  importPayroll(payroll: IPayrollRow): void {
    if (!payroll?.payroll_uuid) return;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    this.importing.set(payroll.payroll_uuid);
    this.cdr.markForCheck();

    this.integrationService
      .importGustoPayrollTransactions(
        this.data.company.companyId,
        payroll.payroll_uuid,
        this.importType.value || 'all',
        headers
      )
      .pipe(
        finalize(() => {
          this.importing.set(null);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Checks have been imported from Gusto.',
              close: true
            });
          }
        },
        error: (err) => {
          if (
            err?.error?.errorMsg ===
            'Please map bank account for company before import check !'
          ) {
            this.alertService.warningAlert({
              content:
                'Please map your bank account with the company imported from Gusto before importing checks. Open "View Bank Account Mapping" to map a bank.'
            });
          }
        }
      });
  }
}
