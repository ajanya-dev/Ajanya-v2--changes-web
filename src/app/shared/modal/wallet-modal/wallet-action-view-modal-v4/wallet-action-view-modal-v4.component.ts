import { Component, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IWalletTransactionStatements } from 'src/app/models/wallet';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, X } from 'lucide-angular';
import { NgFor } from '@angular/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * @description Modal component for wallet action view (v4).
 */
@Component({
  selector: 'app-wallet-action-view-modal-v4',
  standalone: true,
  imports: [
    MatDialogClose,
    NgFor,
    LucideAngularModule,
    CommonButtonV4Component
  ],
  templateUrl: './wallet-action-view-modal-v4.component.html',
  styleUrl: './wallet-action-view-modal-v4.component.scss'
})
export class WalletActionViewModalV4Component implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = inject<{ id: string }>(MAT_DIALOG_DATA);
  readonly XIcon = X;
  transactions = signal<IWalletTransactionStatements[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    if (this.data?.id) {
      this.isLoading.set(true);
      this.walletService
        .getTransactionStatements(this.data.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response?.success && response.data) {
              // Handle both array and single object responses
              const dataArray = Array.isArray(response.data)
                ? response.data
                : [response.data];
              this.transactions.set(dataArray);
            }
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
    }
  }
}
