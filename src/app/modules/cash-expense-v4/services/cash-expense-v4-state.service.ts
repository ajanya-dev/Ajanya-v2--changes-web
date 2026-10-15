import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CashExpenseV4StateService {
  selectedExpenseId = signal<string>('');
  isDetailPanelOpen = signal(false);
  refreshTrigger = signal(0);
  activeTab = signal<string>('transactions');

  openDetail(id: string): void {
    this.selectedExpenseId.set(id);
    this.isDetailPanelOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailPanelOpen.set(false);
    this.selectedExpenseId.set('');
  }

  refreshList(): void {
    this.refreshTrigger.update((v) => v + 1);
  }
}
