import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { V4MainPageLayoutComponent } from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-layout.component';
import {
  IFeatureCard,
  IMainPageConfig,
  RECEIVABLES_CONFIG
} from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-data';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';

@Component({
  selector: 'app-v4-receivables',
  standalone: true,
  imports: [V4MainPageLayoutComponent],
  templateUrl: './v4-receivables.component.html',
  styleUrls: ['./v4-receivables.component.scss']
})
export class V4ReceivablesComponent implements OnInit {
  private router = inject(Router);
  private paymentsV4Service = inject(PaymentsV4Service);
  private destroyRef = inject(DestroyRef);

  config: IMainPageConfig = {
    ...structuredClone(RECEIVABLES_CONFIG),
    isLoading: true
  };

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.paymentsV4Service
      .getReceivablesStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success && res.data) {
          this.config.apiCards[0].value = `$${Number(res.data.total_received).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          this.config.apiCards[1].value = String(res.data.active_customers);
          this.config.apiCards[2].value = String(res.data.outstanding_invoices);
          this.config.apiCards[3].value = String(res.data.payment_links);
        }
        this.config.isLoading = false;
      });
  }

  onCtaClick(): void {
    this.router.navigate(['/v4/manage/payments/receive'], {
      state: { backUrl: this.router.url }
    });
  }

  onCardClick(card: IFeatureCard): void {
    if (card.action === 'receive-payment') {
    this.router.navigate(['/v4/manage/payments/receive'], {
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
