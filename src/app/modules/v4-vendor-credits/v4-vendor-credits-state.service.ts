import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class V4VendorCreditsStateService {
  selectedCreditId = signal<string>('');
  selectedCreditStatus = signal<number>(0);
  selectedPayeeEncryptedId = signal<string>('');
  isDetailPanelOpen = signal(false);
  refreshTrigger = signal(0);

  openDetail(id: string, status?: number, payeeEncryptedId?: string): void {
    this.selectedCreditId.set(id);
    this.selectedCreditStatus.set(status ?? 0);
    this.selectedPayeeEncryptedId.set(payeeEncryptedId ?? '');
    this.isDetailPanelOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailPanelOpen.set(false);
    this.selectedCreditId.set('');
    this.selectedCreditStatus.set(0);
    this.selectedPayeeEncryptedId.set('');
  }

  refreshList(): void {
    this.refreshTrigger.update((v) => v + 1);
  }
}
