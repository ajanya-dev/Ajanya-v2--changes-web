import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { CommonTabV4Component, ITabItem } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4PaymentsTableComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/v4-payments-table.component';
import { DetailedTabV4Component } from 'src/app/modules/v4/payments-in/components/detailed-tab-v4/detailed-tab-v4.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-recent-transaction',
  standalone: true,
  imports: [CommonTabV4Component, V4PaymentsTableComponent, DetailedTabV4Component, LucideAngularModule],
  template: `
    <!-- Removed min-h-[calc(100vh-10vh)]: taller than the v4 page area, it forced a page scroll. -->
    <div class="flex flex-col h-full w-full">
      <div class="main-container flex flex-col h-full w-full rounded mt-7">
        <div class="flex items-center gap-3 mb-6">
          <button type="button" (click)="goBack()" class="flex items-center justify-center w-8 h-8 rounded-full hover:bg-v4-tertiary-background-color transition-colors">
            <lucide-icon name="arrow-left" [size]="18"></lucide-icon>
          </button>
          <h1 class="text-xl font-bold text-v4-main-text-color">Recent Transactions</h1>
        </div>
        <div class="mb-6">
          <app-common-tab-v4
            [tabs]="tabs"
            [activeTab]="activeTab()"
            (tabChange)="onTabChange($event)"
            variant="toggle"
          />
        </div>
        <div class="flex flex-1 flex-col min-h-0">
          @if (activeTab() === 'send') {
            <app-v4-payments-table
              [isPaymentsButtonShown]="false"
              [isNewPaymenttButtonShown]="false"
              [dynamicHeaderText]="'Send Payments'"
            />
          } @else {
            <app-detailed-tab-v4 [isReceiveChecksReport]="true" />
          }
        </div>
      </div>
    </div>
  `
})
export class RecentTransactionComponent {
  private location = inject(Location);

  tabs: ITabItem[] = [
    { label: 'Send', value: 'send' },
    { label: 'Receive', value: 'receive' }
  ];

  activeTab = signal('send');

  onTabChange(value: string): void {
    this.activeTab.set(value);
  }

  goBack(): void {
    this.location.back();
  }
}
