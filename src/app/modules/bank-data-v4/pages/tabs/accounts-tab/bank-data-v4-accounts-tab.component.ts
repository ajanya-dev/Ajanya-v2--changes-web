import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import {
  IBankDataAccount,
  IBankDataProviderAccounts
} from 'src/app/modules/bank/bank-v3/model/bank-v35';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { BankDataV4EditProviderModalComponent } from '../../../modals/edit-provider-modal/bank-data-v4-edit-provider-modal.component';
import { BankDataV4EditAccountModalComponent } from '../../../modals/edit-account-modal/bank-data-v4-edit-account-modal.component';
import { BankDataV4ApiService } from '../../../services/bank-data-v4-api.service';
import { BankDataV4TransactionsStateService } from '../../../services/bank-data-v4-transactions-state.service';

@Component({
  selector: 'app-bank-data-v4-accounts-tab',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4DataTableEmptyStateComponent
  ],
  templateUrl: './bank-data-v4-accounts-tab.component.html'
})
export class BankDataV4AccountsTabComponent implements OnInit {
  state = inject(BankDataV4TransactionsStateService);
  private api = inject(BankDataV4ApiService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private plaidHelperService = inject(PlaidHelperService);

  expandedProviders = signal<Record<string, boolean>>({});
  syncingProviders = signal<Record<string, boolean>>({});
  activeMenuAccountId = signal<string | null>(null);

  ngOnInit(): void {
    this.state.loadIndex();
    this.state.loadCompanies();
    // Expand only the first provider by default
    setTimeout(() => {
      const providers = this.state.providerAccounts();
      if (providers.length > 0) {
        this.expandedProviders.set({ [providers[0].providerId]: true });
      }
    });
  }

  openConnectChooser(): void {
    this.plaidHelperService
      .openPlaidModal({
        isVerify: false,
        selectedBankId: '',
        sourceType: 1,
        isV4: true
      })
      .subscribe((result) => {
        if (result?.success) this.state.refreshIndex();
      });
  }

  // ---------- Provider expand/collapse ----------
  toggleProvider(providerId: string): void {
    this.expandedProviders.update((map) => ({
      ...map,
      [providerId]: !map[providerId]
    }));
  }

  isProviderExpanded(providerId: string): boolean {
    return this.expandedProviders()[providerId] ?? false;
  }

  // ---------- Provider actions ----------
  syncTransaction(provider: IBankDataProviderAccounts): void {
    if (this.syncingProviders()[provider.providerId]) return;

    const accountIds = (provider.accounts ?? [])
      .filter((a) => a.status === 1)
      .map((a) => a.id);

    if (accountIds.length === 0) {
      this.alertService.warningAlert({ content: 'No active accounts to sync' });
      return;
    }

    this.syncingProviders.update((map) => ({
      ...map,
      [provider.providerId]: true
    }));
    this.api
      .syncPlaidTransactions({ bankId: provider.providerId, accountIds })
      .pipe(
        finalize(() =>
          this.syncingProviders.update((map) => ({
            ...map,
            [provider.providerId]: false
          }))
        )
      )
      .subscribe(
        (res: {
          success?: boolean;
          message?: string;
          errorCode?: string;
          errorMsg?: string;
        }) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: res.message || 'Transactions synced'
            });
          } else if (res?.errorCode === 'plaid_401') {
            const alert = this.alertService.failedAlert({
              content: res.errorMsg || 'Authentication expired',
              doneMsg: 'Reconnect',
              isCancel: true
            });
            alert.afterClosed().subscribe((reconnect) => {
              if (reconnect) {
                this.openConnectChooser();
              }
            });
          }
        }
      );
  }

  deleteProvider(provider: IBankDataProviderAccounts): void {
    const dRef = this.alertService.confirmAlert({
      title: 'Are you sure',
      content:
        'You want to delete this financial institution and all its accounts permanently?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api
        .deleteProvider(provider.providerId)
        .subscribe((res: { success?: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Provider deleted' });
            this.state.refreshIndex();
          }
        });
    });
  }

  editProvider(provider: IBankDataProviderAccounts): void {
    const ref = this.dialog.open(BankDataV4EditProviderModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      data: { provider }
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) this.state.refreshIndex();
    });
  }

  // ---------- Account menu ----------
  toggleAccountMenu(accountId: string): void {
    this.activeMenuAccountId.update((current) =>
      current === accountId ? null : accountId
    );
  }

  closeAccountMenu(): void {
    this.activeMenuAccountId.set(null);
  }

  // ---------- Account actions ----------
  deleteAccount(account: IBankDataAccount): void {
    this.closeAccountMenu();
    const dRef = this.alertService.confirmAlert({
      title: 'Are you sure',
      content: 'You want to delete this bank account permanently?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api
        .deleteBank(account.id)
        .subscribe((res: { success?: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Bank account deleted' });
            this.state.refreshIndex();
          }
        });
    });
  }

  editAccount(
    account: IBankDataAccount,
    provider: IBankDataProviderAccounts
  ): void {
    this.closeAccountMenu();
    const ref = this.dialog.open(BankDataV4EditAccountModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      data: {
        account,
        providerName: provider.providerName,
        companies: this.state.companies()
      }
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) this.state.refreshIndex();
    });
  }

  activateAccount(account: IBankDataAccount): void {
    this.closeAccountMenu();
    const dRef = this.alertService.confirmAlert({
      title: 'Activate Account',
      content: "Let's bring transactions of this account for easy reporting",
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api
        .activateAccount(account.id)
        .subscribe((res: { success?: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Account activated' });
            this.state.refreshIndex();
          }
        });
    });
  }

  deactivateAccount(account: IBankDataAccount): void {
    this.closeAccountMenu();
    const dRef = this.alertService.confirmAlert({
      title: 'Deactivate Account',
      content: 'Are you sure NOT to bring transactions of this account?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api
        .deActivateAccount(account.id)
        .subscribe((res: { success?: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Account deactivated' });
            this.state.refreshIndex();
          }
        });
    });
  }

  // ---------- Helpers ----------
  resolveAccountName(acc: IBankDataAccount): string {
    return (acc.short_name || acc.nick_name || acc.name || 'Account').trim();
  }

  formatBalance(acc: IBankDataAccount): string {
    const val = parseFloat(
      (acc.current_balance || acc.available_balance_amount || '0') as string
    );
    return Number.isFinite(val) ? val.toFixed(2) : '0.00';
  }
}
