import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  X,
  CircleCheck,
  CircleX,
  RefreshCw,
  FileCheck
} from 'lucide-angular';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IPaymentSummaryData } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';

interface IDialogData {
  summary: IPaymentSummaryData[];
}

@Component({
  selector: 'app-v4-payment-summary-modal',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    LucideAngularModule,
    CommonButtonV4Component,
    MatTooltipModule
  ],
  templateUrl: './v4-payment-summary-modal.component.html',
  styleUrl: './v4-payment-summary-modal.component.scss'
})
export class V4PaymentSummaryModalComponent {
  private dialogRef = inject(MatDialogRef<V4PaymentSummaryModalComponent>);
  private data: IDialogData = inject(MAT_DIALOG_DATA);
  private router = inject(Router);

  readonly XIcon = X;
  readonly CircleCheckIcon = CircleCheck;
  readonly CircleXIcon = CircleX;
  readonly RefreshCwIcon = RefreshCw;
  readonly FileCheckIcon = FileCheck;

  summary: IPaymentSummaryData[] = [];
  successCount = 0;
  failedCount = 0;
  successAmount = 0;
  failedAmount = 0;
  totalAmount = 0;

  /** Active row filter. */
  filter = signal<'all' | 'success' | 'failed'>('all');
  copied = signal(false);

  filterTabs = computed(() => [
    { key: 'all' as const, label: 'All', count: this.summary.length },
    { key: 'success' as const, label: 'Succeeded', count: this.successCount },
    { key: 'failed' as const, label: 'Failed', count: this.failedCount }
  ]);

  filteredSummary = computed(() => {
    const active = this.filter();
    if (active === 'success') return this.summary.filter((s) => this.isSuccess(s));
    if (active === 'failed') return this.summary.filter((s) => this.isFailed(s));
    return this.summary;
  });

  constructor() {
    this.summary = this.data?.summary || [];
    const successItems = this.summary.filter((s) => this.isSuccess(s));
    const failedItems = this.summary.filter((s) => this.isFailed(s));
    this.successCount = successItems.length;
    this.failedCount = failedItems.length;
    this.successAmount = this.sumAmount(successItems);
    this.failedAmount = this.sumAmount(failedItems);
    this.totalAmount = this.sumAmount(this.summary);
    if (this.failedCount > 0) this.filter.set('failed');
  }

  private sumAmount(items: IPaymentSummaryData[]): number {
    return items.reduce((total, item) => total + (Number(item.amount) || 0), 0);
  }

  /** Groups the failed rows by error message for the "what went wrong" list. */
  failureReasons = computed(() => {
    const counts = new Map<string, number>();
    this.summary
      .filter((item) => this.isFailed(item))
      .forEach((item) => {
        const message = this.getErrorMessage(item);
        counts.set(message, (counts.get(message) || 0) + 1);
      });
    return [...counts.entries()]
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count);
  });

  isFailed(item: IPaymentSummaryData): boolean {
    if (!item.success) return false;
    const success = item.success as Record<string, any>;
    // Check v3-style error pattern
    if (success?.error?.errorMsg) return true;
    if (typeof success === 'object' && success.success === false) return true;
    return false;
  }

  isSuccess(item: IPaymentSummaryData): boolean {
    if (!item.success) return false;
    if (this.isFailed(item)) return false;
    const success = item.success as Record<string, any>;
    if (typeof success === 'object' && success.success === true) return true;
    return !!item.success;
  }

  getErrorMessage(item: IPaymentSummaryData): string {
    const success = item.success as Record<string, any>;
    if (success?.error?.errorCode === 125) {
      return 'This check cannot be printed. Administrator approval is required before proceeding';
    }
    if(success?.error?.permissionType) {
      return `You don't have permission to do this action.`;
    }
    if (success?.error?.errorMsg) {
      return success.error.errorMsg;
    }
    if (success?.message) {
      return success.message;
    }
    return 'Processing failed';
  }

  /**
   * @description Returns type-specific status label and color matching v3 behavior.
   */
  getStatusInfo(item: IPaymentSummaryData): { label: string; color: string; icon: any } {
    const type = item.type;
    if (type === 'Check Print' || type === 'Wallet Print') {
      return { label: 'Printed', color: 'text-v4-common-green-color', icon: this.CircleCheckIcon };
    }
    if (type === 'Check Mail from Bank') {
      return { label: 'Printing', color: 'text-v4-primary-brand-color', icon: this.FileCheckIcon };
    }
    if (type === 'Check Email' || type === 'Wallet Email') {
      return { label: 'Emailed', color: 'text-v4-common-green-color', icon: this.CircleCheckIcon };
    }
    // "Let vendor decide" has no rail to process yet; a successful save is
    // a completed payment, matching the Payments Out table.
    if (type === 'Let vendor decide') {
      return { label: 'Completed', color: 'text-v4-common-green-color', icon: this.CircleCheckIcon };
    }
    // Default for ACH, Wire, Card, Check Mail, Check DD
    return { label: 'Processing', color: 'text-v4-common-blue-color', icon: this.RefreshCwIcon };
  }

  getTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      check: 'Check',
      ach: 'ACH',
      wire: 'Wire',
      virtualCard: 'Virtual Card',
      checkMail: 'Check Mail',
      checkMail2: 'Check Mail',
      CHECK: 'Check',
      MAIL: 'Mail',
      ACH: 'ACH',
      WIRE: 'Wire',
      'Check Mail from Bank': 'Check Mail from Bank',
      'Check Email': 'Check Email',
      'Check DD': 'Check DD',
      'Check Print': 'Check Print',
      'Check Mail': 'Check Mail',
      'Wallet Print': 'Wallet Print',
      'Wallet Email': 'Wallet Email',
      Card: 'Virtual Card'
    };
    return typeMap[type] || type;
  }

  close(): void {
    this.dialogRef.close(true);
  }

  done(): void {
    this.dialogRef.close(true);
    this.router.navigate(['/v4/manage/payments-out/detailed/all']);
  }
}
