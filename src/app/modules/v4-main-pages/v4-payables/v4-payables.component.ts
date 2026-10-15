import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { V4MainPageLayoutComponent } from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-layout.component';
import {
  IFeatureCard,
  IMainPageConfig,
  PAYABLES_CONFIG
} from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-data';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';

@Component({
  selector: 'app-v4-payables',
  standalone: true,
  imports: [V4MainPageLayoutComponent],
  templateUrl: './v4-payables.component.html',
  styleUrls: ['./v4-payables.component.scss']
})
export class V4PayablesComponent implements OnInit {
  private router = inject(Router);
  private paymentsV4Service = inject(PaymentsV4Service);
  private destroyRef = inject(DestroyRef);

  config: IMainPageConfig = {
    ...structuredClone(PAYABLES_CONFIG),
    isLoading: true
  };

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.paymentsV4Service
      .getPayablesStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success && res.data) {
          this.config.apiCards[0].value = `$${Number(res.data.total_sent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          this.config.apiCards[1].value = String(res.data.active_vendors);
          this.config.apiCards[2].value = String(res.data.pending_bills);
          this.config.apiCards[3].value = String(res.data.scheduled_payments);
        }
        this.config.isLoading = false;
      });
  }

  onCtaClick(): void {
    this.router.navigate(['/v4/manage/payments/pay/bankaccount/check'], {
      state: { backUrl: this.router.url }
    });
  }

  onCardClick(card: IFeatureCard): void {
    if (card.action === 'send-payment') {
      this.router.navigate(['/v4/manage/payments/pay/bankaccount/check'], {
        state: { backUrl: this.router.url }
      });
      return;
    }
    if (card.routerLink) {
      this.router.navigate([`/v4/manage/${card.routerLink}`], {
        queryParams: card.queryParams || {}
      });
    }
  }
}
