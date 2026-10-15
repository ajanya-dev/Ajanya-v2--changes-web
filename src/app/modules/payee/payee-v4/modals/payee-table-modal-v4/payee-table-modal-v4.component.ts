import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { BankAccountTableV4Component } from '../../dt-tables/bank-account-table-v4/bank-account-table-v4.component';
import { InternationalAccountTableV4Component } from '../../dt-tables/international-account-table-v4/international-account-table-v4.component';
import { PayeeSendTransactionsV4Component } from '../../dt-tables/payee-send-transactions-v4/payee-send-transactions-v4.component';
import { PayeeReceivedTransactionsV4Component } from '../../dt-tables/payee-received-transactions-v4/payee-received-transactions-v4.component';

export type PayeeTableModalType =
  | 'domestic-bank'
  | 'international-bank'
  | 'send-transactions'
  | 'received-transactions';

export interface PayeeTableModalData {
  type: PayeeTableModalType;
  payeeId: string;
  payeeEmail?: string;
  title: string;
}

@Component({
  selector: 'app-payee-table-modal-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatDialogClose,
    BankAccountTableV4Component,
    InternationalAccountTableV4Component,
    PayeeSendTransactionsV4Component,
    PayeeReceivedTransactionsV4Component
  ],
  template: `
    <div class="flex flex-col h-full">
      <!-- modal header -->
      <div
        class="flex justify-between items-center px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold text-v4-main-text-color font-funnel">
            {{ data.title }}
          </h1>
        </div>
        <div
          [mat-dialog-close]="false"
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon [img]="XIcon" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <!-- modal body -->
      <div class="flex-1 overflow-auto p-6 bg-v4-tertiary-background-color">
        @switch (data.type) {
          @case ('domestic-bank') {
            <app-bank-account-table-v4 [payeeId]="data.payeeId" />
          }
          @case ('international-bank') {
            <app-international-account-table-v4 [payeeId]="data.payeeId" />
          }
          @case ('send-transactions') {
            <app-payee-send-transactions-v4 [payeeId]="data.payeeId" />
          }
          @case ('received-transactions') {
            <app-payee-received-transactions-v4
              [payeeEmail]="data.payeeEmail ?? ''"
            />
          }
        }
      </div>
    </div>
  `
})
export class PayeeTableModalV4Component {
  readonly XIcon = X;
  data = inject<PayeeTableModalData>(MAT_DIALOG_DATA);
}
