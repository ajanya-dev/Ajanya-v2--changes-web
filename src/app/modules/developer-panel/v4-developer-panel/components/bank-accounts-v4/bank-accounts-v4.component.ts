import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DeveloperPanelService } from 'src/app/shared/service/developer-panel/developer-panel.service';
import { IBankAccounts } from 'src/app/models/developer';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-bank-accounts-v4',
  templateUrl: './bank-accounts-v4.component.html',
  styleUrls: ['./bank-accounts-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BankAccountsV4Component implements OnInit {
  private developerPanelService = inject(DeveloperPanelService);
  private v4AlertService = inject(V4AlertService);

  loading = signal<boolean>(false);

  private allAccounts: IBankAccounts[] = [];
  filteredAccounts: IBankAccounts[] = [];

  searchName = '';
  searchNickName = '';
  searchId = '';
  searchAccount = '';
  searchRouting = '';

  ngOnInit(): void {
    this.loadAccounts();
  }

  private loadAccounts(): void {
    this.loading.set(true);
    this.developerPanelService
      .apiActivity()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.allAccounts = res.data.bankaccounts ?? [];
            this.filteredAccounts = [...this.allAccounts];
          }
        },
        error: (err) => {
          this.v4AlertService.failedAlert({
            content: err.error?.errorMsg ?? 'Failed to load bank accounts. Please try again.'
          });
        }
      });
  }

  filterTable(): void {
    const name = this.searchName.toLowerCase();
    const nick = this.searchNickName.toLowerCase();

    this.filteredAccounts = this.allAccounts.filter(
      (item) =>
        (item.bankAccountName?.toLowerCase().includes(name)) &&
        (item.bankAccountNickName?.toLowerCase().includes(nick)) &&
        (item.id?.toString().includes(this.searchId)) &&
        (item.bankAccountNumber?.toString().includes(this.searchAccount)) &&
        (item.bankRoutingNumber?.toString().includes(this.searchRouting))
    );
  }
}
