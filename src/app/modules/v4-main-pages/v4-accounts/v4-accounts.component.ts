import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { V4MainPageLayoutComponent } from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-layout.component';
import {
  IFeatureCard,
  IMainPageConfig,
  ACCOUNTS_CONFIG
} from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-data';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ZmWalletIntroV4Component } from 'src/app/shared/components/v4/zm-wallet-intro-v4/zm-wallet-intro-v4.component';

@Component({
  selector: 'app-v4-accounts',
  standalone: true,
  imports: [V4MainPageLayoutComponent, ZmWalletIntroV4Component],
  templateUrl: './v4-accounts.component.html',
  styleUrls: ['./v4-accounts.component.scss']
})
export class V4AccountsComponent implements OnInit {
  private router = inject(Router);
  private bankAccountsService = inject(BankAccountsService);
  private destroyRef = inject(DestroyRef);

  config: IMainPageConfig = {
    ...structuredClone(ACCOUNTS_CONFIG),
    isLoading: true
  };

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.bankAccountsService
      .getBankAccountsStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.config.isLoading = false))
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.config.apiCards[0].value = String(res.data.connectedAccountCount);
          this.config.apiCards[1].value = `$${Number(res.data.walletBalance.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          this.config.apiCards[2].value = String(res.data.activeCardCount);
        }
      });
  }

  onCardClick(card: IFeatureCard): void {
    if (card.comingSoon) return;
    if (card.routerLink) {
      this.router.navigate([`/v4/manage/${card.routerLink}`]);
    }
  }
}
