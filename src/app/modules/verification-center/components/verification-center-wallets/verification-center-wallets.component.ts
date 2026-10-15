import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faClock
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { faWallet } from '@fortawesome/pro-regular-svg-icons';
import { Router } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonTablePaginationComponent } from '../common-table-pagination/common-table-pagination.component';

@Component({
  selector: 'app-verification-center-wallets',
  standalone: true,
  imports: [
    FontAwesomeModule,
    NgClass,
    CurrencyPipe,
    CommonTablePaginationComponent,
    MatTooltip
  ],
  templateUrl: './verification-center-wallets-new.component.html',
  styleUrl: './verification-center-wallets.component.scss'
})
export class VerificationCenterWalletsComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);

  subscriptions: Subscription[] = [];
  page = 1;
  perPage = 10;
  startIndex = 0;
  lastIndex = this.perPage;
  private router = inject(Router);

  isLoadingContent = true;
  wallets: IWalletData[] = [];
  walletsPaginatedData: IWalletData[] = [];
  faCheck = faCircleCheck;
  faClock = faClock;
  faExclamation = faCircleExclamation;
  faWallet = faWallet;

  ngOnInit(): void {
    this.getWallets();
  }

  /**
   * @description Fetches details of solid and other businesses.
   */
  getWallets(): void {
    this.isLoadingContent = true;
    this.subscriptions.push(
      this.walletService
        .getWalletInformation(this.page, '')
        .pipe(
          finalize(() => {
            this.isLoadingContent = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.wallets = res.data as IWalletData[];
            this.paginate();
          }
        })
    );
  }

  onClickEvent(clcikType: 'prev' | 'next'): void {
    if (this.isLoadingContent) {
      return;
    }
    if (clcikType === 'next') {
      this.page += 1;
      this.startIndex += 5;
      this.lastIndex += 5;
    } else {
      this.page -= 1;
      this.startIndex -= 5;
      this.lastIndex -= 5;
    }
    this.isLoadingContent = true;
    setTimeout(() => {
      this.paginate();
    }, 1000);
  }

  paginate(): void {
    this.isLoadingContent = false;
    this.walletsPaginatedData = [];
    this.walletsPaginatedData = this.wallets.slice(
      this.startIndex,
      this.lastIndex
    );
  }

  viewAll(): void {
    this.router.navigateByUrl('manage/wallet/transactions');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}
