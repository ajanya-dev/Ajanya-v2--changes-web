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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  IConnectedCompanyList,
  IGustoContractPayments,
  IGustoPaymentsList
} from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-gusto-contractor-payments-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-gusto-contractor-payments-modal.component.html',
  styleUrls: ['./v4-gusto-contractor-payments-modal.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4GustoContractorPaymentsModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  readonly data: { company: IConnectedCompanyList } = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  creating = signal<string | null>(null);
  payments = signal<IGustoContractPayments[]>([]);

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.integrationService
      .getPaymentsForGusto(this.data.company.companyId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const data = res?.data as IGustoPaymentsList | undefined;
        this.payments.set(data?.contractor_payments || []);
        this.cdr.markForCheck();
      });
  }

  createCheck(payment: IGustoContractPayments): void {
    if (!payment?.contractor_uuid) return;
    this.creating.set(payment.contractor_uuid);
    this.cdr.markForCheck();
    this.integrationService
      .importGustoContractorPayment({
        companyId: this.data.company.companyId,
        contractorId: payment.contractor_uuid
      })
      .pipe(
        finalize(() => {
          this.creating.set(null);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Created Successfully',
            close: true
          });
        }
      });
  }
}
