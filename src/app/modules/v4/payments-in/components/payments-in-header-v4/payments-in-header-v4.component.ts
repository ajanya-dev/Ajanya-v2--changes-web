import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { V4RunAchModalComponent } from 'src/app/shared/modal/v4-run-ach-modal/v4-run-ach-modal.component';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { finalize, take } from 'rxjs';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-payments-in-header-v4',
  imports: [V4PageHeaderComponent],
  templateUrl: './payments-in-header-v4.component.html',
  styleUrls: ['./payments-in-header-v4.component.scss']
})
export class PaymentsInHeaderV4Component {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private requestPaymentsService = inject(RequestPaymentsService);

  loading = signal(false);

  readonly headerActions = computed<IV4HeaderAction[]>(() => [
    {
      id: 'ach-debit',
      text: 'Run ACH Debit',
      style: 'navy',
      lucideIcon: 'file-text',
      toolTip: 'Manual ACH',
      disabled: this.loading()
    },
    {
      id: 'request-payment',
      text: 'Request Payment',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Request new Payment'
    }
  ]);

  onAction(id: string | number): void {
    if (id === 'ach-debit') this.runAchDebit();
    if (id === 'request-payment') this.requestPayment();
  }

  requestPayment(): void {
    this.router.navigate(['/v4/manage/payments/receive'], {
      state: { backUrl: this.router.url }
    });
  }

  runAchDebit(): void {
    this.loading.set(true);
    this.requestPaymentsService
      .achDebit()
      .pipe(
        take(1),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialog.open(V4RunAchModalComponent, {
            width: '700px',
            maxWidth: '95vw',
            panelClass: 'paddingless-modal-rounded',
            disableClose: true
          });
        }
      });
  }
}
