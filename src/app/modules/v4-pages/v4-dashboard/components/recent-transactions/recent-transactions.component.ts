import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuModule } from '@angular/material/menu';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { SendPaymentMode } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { V4DashboardService } from '../../services/v4-dashboard.service';
import { IRecentTransaction } from '../../models/v4-dashboard.models';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { PaymentsInDetailPanelV4Component } from 'src/app/modules/v4/payments-in/components/payments-in-detail-panel-v4/payments-in-detail-panel-v4.component';
import { ICommonTransactionTableData, ISource } from 'src/app/models/v3-common';
import { IRecieveCheckRow, IReceiveCheckDetails } from 'src/app/modules/receive-payments/model/ReceivePayment';
import {
  getInvoiceStatusBadge,
  getCheckDraftStatusBadge,
  getCheckStatusBadgeFromApi,
  getPaymentStatusBadge,
  getSourceBadge,
  isSentPayment,
  formatStatusText,
  InvoiceData,
  StatusBadge
} from '../../utils/transaction-status.utils';

interface DashboardTransaction {
  id: string;
  uu_id: string;
  type: 'sent' | 'received';
  title: string;
  amount: number;
  created_at: string;
  updated_at: string;
  time: string;
  transaction_type: string;
  status: number;
  receivedType: number;
  statusDescription: string;
  checkStatus?: number;
  method: string;
  reference: string;
  paymentType: string;
  sourceType: string;
  sourceObj?: IRecentTransaction['source'];
  payeeName: string;
  transferType: string;
  invoiceData?: InvoiceData;
  checkFromName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddressLine1: string;
  senderCity: string;
  senderState: string;
  senderZip: string;
}

interface TransactionDateGroup {
  dateKey: string;
  label: string;
  transactions: DashboardTransaction[];
}

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [
    CurrencyPipe,
    LucideAngularModule,
    CommonButtonV4Component,
    TitleCasePipe,
    MatMenuModule,
    PaymentsInDetailPanelV4Component
  ],
  styles: [`.rail-dot::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: .85; flex-shrink: 0; display: inline-block; }`],
  template: `

    <!-- ── NEW DESIGN ── -->
    <div class="overflow-hidden rounded-2xl bg-v4-secondary-background-color shadow-sm">

      <!-- Header -->
      <div class="flex items-center justify-between px-7 pt-6 pb-[18px]">
        <h3 class="m-0 text-[19px] font-bold text-v4-main-text-color">Recent Transactions</h3>
        @if (groupedTransactions().length > 0) {
        <div class="flex items-center gap-3">
          <button type="button"
            class="inline-flex items-center gap-1.5 px-[11px] py-1.5 rounded-[7px] border border-v4-border-color bg-v4-secondary-background-color text-v4-secondary-text-color font-semibold text-xs cursor-pointer"
            [matMenuTriggerFor]="filterMenu"
            aria-label="Filter transactions">
            <span class="relative inline-flex">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></svg>
              @if (activeFilter() !== 'all') {
                <span aria-hidden="true" class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-v4-primary-brand-bold-color"></span>
              }
            </span>
            Filter
          </button>
          <mat-menu #filterMenu="matMenu" class="v4-action-menu" xPosition="before">
            <button mat-menu-item type="button" role="menuitemradio"
              [attr.aria-checked]="activeFilter() === 'all'"
              (click)="setFilter('all')">
              <div class="flex items-center justify-between gap-3 min-w-[180px]">
                <span class="inline-flex items-center gap-2">
                  <lucide-icon name="list" [size]="14"></lucide-icon>
                  <span class="text-sm">All transactions</span>
                </span>
                @if (activeFilter() === 'all') {
                  <lucide-icon name="check" [size]="14" class="text-v4-primary-brand-bold-color"></lucide-icon>
                }
              </div>
            </button>
            <button mat-menu-item type="button" role="menuitemradio"
              [attr.aria-checked]="activeFilter() === 'sent'"
              (click)="setFilter('sent')">
              <div class="flex items-center justify-between gap-3 min-w-[180px]">
                <span class="inline-flex items-center gap-2">
                  <lucide-icon name="send" [size]="14"></lucide-icon>
                  <span class="text-sm">Sent</span>
                </span>
                @if (activeFilter() === 'sent') {
                  <lucide-icon name="check" [size]="14" class="text-v4-primary-brand-bold-color"></lucide-icon>
                }
              </div>
            </button>
            <button mat-menu-item type="button" role="menuitemradio"
              [attr.aria-checked]="activeFilter() === 'received'"
              (click)="setFilter('received')">
              <div class="flex items-center justify-between gap-3 min-w-[180px]">
                <span class="inline-flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="matrix(-1,0,0,-1,0,0)"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>
                  <span class="text-sm">Received</span>
                </span>
                @if (activeFilter() === 'received') {
                  <lucide-icon name="check" [size]="14" class="text-v4-primary-brand-bold-color"></lucide-icon>
                }
              </div>
            </button>
          </mat-menu>
          <a class="text-[12.5px] text-v4-primary-brand-bold-color font-semibold cursor-pointer" role="button" tabindex="0" (click)="navigateToTransactions()" (keyup.enter)="navigateToTransactions()">View All <span class="text-sm ml-0.5">›</span></a>
        </div>
        }
      </div>

      @if (isLoading()) {
        <!-- Loading Shimmer Skeleton -->
        <div class="px-7 pt-2.5 pb-2 bg-v4-tertiary-background-color">
          <div class="h-3.5 w-32 rounded animate-shimmer"
            style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
        </div>
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <div class="grid grid-cols-[40px_1fr_auto] gap-x-3.5 gap-y-1 items-center px-7 py-3.5 border-t border-v4-border-color">
            <div class="row-span-2 self-center w-10 h-10 rounded-full animate-shimmer flex-shrink-0"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
            <div class="row-span-2 self-center min-w-0">
              <div class="h-3.5 w-40 rounded mb-2 animate-shimmer"
                style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
              <div class="h-3 w-24 rounded animate-shimmer"
                style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
            </div>
            <div class="col-start-3 row-start-1 justify-self-end h-4 w-20 rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
            <div class="col-start-3 row-start-2 justify-self-end h-3 w-16 rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
          </div>
        }
      } @else if (error()) {
        <div class="flex items-center justify-center py-12 px-7 border-t border-v4-border-color">
          <p class="text-sm text-destructive">{{ error() }}</p>
        </div>
      } @else if (groupedTransactions().length === 0 && activeFilter() !== 'all') {
        <div class="py-12 px-6 text-center border-t border-v4-border-color">
          <p class="text-sm text-v4-secondary-text-color mb-3">
            No {{ activeFilter() }} transactions found
          </p>
          <button type="button"
            class="text-sm font-semibold text-v4-primary-brand-bold-color underline-offset-2 hover:underline cursor-pointer"
            (click)="setFilter('all')">
            Clear filter
          </button>
        </div>
      } @else if (groupedTransactions().length === 0) {
        <div class="px-6 pb-6 pt-1">
          <div class="rounded-xl border border-v4-border-color bg-v4-tertiary-background-color py-10 px-6 text-center">
            <div class="flex justify-center mb-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-v4-secondary-background-color border border-v4-border-color">
                <lucide-icon name="send" [size]="22" class="text-v4-primary-brand-bold-color"></lucide-icon>
              </div>
            </div>
            <h3 class="text-base font-bold text-v4-main-text-color mb-1.5">No transactions yet</h3>
            <p class="text-sm text-v4-secondary-text-color mb-5 max-w-xs mx-auto">
              Transactions will appear here after your first payment.
            </p>
            <div class="flex justify-center">
              <app-common-button-v4
                [type]="{ style: 'primary', name: 'main' }"
                [text]="'Send Payment'"
                [lucideIcon]="'send'"
                [lucideIconSize]="16"
                (clickEvent)="navigateToSendPayment()"
              />
            </div>
          </div>
        </div>
      } @else {
        @for (group of groupedTransactions(); track group.dateKey) {
          <div class="px-7 pt-2.5 pb-2 text-[12px] font-semibold text-v4-tertiary-text-color tracking-[.6px] uppercase bg-v4-tertiary-background-color">{{ group.label }}</div>
          @for (txn of group.transactions; track txn.id) {
            <div class="group flex items-center gap-3.5 px-7 py-3.5 border-t border-v4-border-subtle-color transition-colors duration-[120ms] hover:bg-v4-list-hover-color">
              <!-- Type Icon -->
              <div class="w-10 h-10 rounded-full grid place-items-center flex-shrink-0"
                [class.bg-v4-insight-card-background-blue]="txn.type === 'sent'"
                [class.text-v4-primary-brand-bold-color]="txn.type === 'sent'"
                [class.bg-v4-insight-card-background-green]="txn.type === 'received'"
                [class.text-v4-insight-card-icon-green]="txn.type === 'received'">
                @if (txn.type === 'received') {
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="matrix(-1,0,0,-1,0,0)"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>
                } @else {
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                }
              </div>

              <!-- Title + meta -->
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-v4-main-text-color leading-tight truncate">{{ txn.title }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-v4-tertiary-text-color">{{ txn.time }}</span>
                  @if (txn.method && txn.method !== 'None') {
                    <span class="rail-dot text-[12px] font-bold px-2 py-0.5 rounded tracking-[.3px] inline-flex items-center gap-[5px]"
                      [style.backgroundColor]="getTransferBadge(txn.method).bg"
                      [style.color]="getTransferBadge(txn.method).textColor">
                      {{ getTransferBadge(txn.method).label }}
                    </span>
                  }
                </div>
              </div>

              <!-- Hover/touch-revealed actions (md+) — sit to the LEFT of amount/status. -->
              <div class="hidden md:group-hover:flex items-center gap-2 shrink-0">
                @if (isOutgoing(txn)) {
                  <button
                    type="button"
                    class="h-8 px-2.5 inline-flex items-center gap-1 text-xs font-medium rounded-md bg-v4-secondary-background-color border border-v4-border-color text-v4-secondary-text-color hover:bg-v4-tertiary-background-color shadow-sm cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    [disabled]="loadingDetailsId() === txn.uu_id"
                    (click)="onRepeat(txn, $event)"
                  >
                    <lucide-icon name="send" [size]="13"></lucide-icon>
                    Repeat Payment
                  </button>
                }
                <button
                  type="button"
                  class="h-8 px-2.5 inline-flex items-center gap-1 text-xs font-medium rounded-md bg-v4-secondary-background-color border border-v4-border-color text-v4-secondary-text-color hover:bg-v4-tertiary-background-color shadow-sm cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="loadingDetailsId() === txn.uu_id"
                  (click)="onDetails(txn, $event)"
                >
                  @if (loadingDetailsId() === txn.uu_id) {
                    <lucide-icon name="loader-circle" [size]="13" class="animate-spin"></lucide-icon>
                  } @else {
                    <lucide-icon name="file-text" [size]="13"></lucide-icon>
                  }
                  Details
                </button>
              </div>

              <!-- Amount + Status (always visible, right-aligned) -->
              <div class="flex flex-col items-end gap-1 shrink-0">
                <div class="text-right text-[15.5px] font-bold text-v4-main-text-color tabular-nums tracking-[-0.2px] leading-[1.2] whitespace-nowrap">{{ formatAmount(txn.amount) }}</div>
                <div class="inline-flex items-center gap-[5px] text-[12px] font-medium tracking-[.1px] whitespace-nowrap"
                  [style.color]="getStatusBadgeForTransaction(txn).textColor">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    [style.backgroundColor]="getStatusBadgeForTransaction(txn).textColor"
                    [style.boxShadow]="isProcessingStatus(txn) ? '0 0 0 3px color-mix(in srgb, ' + getStatusBadgeForTransaction(txn).textColor + ' 20%, transparent)' : 'none'"></span>
                  {{ getStatusBadgeForTransaction(txn).label }}
                </div>
              </div>
            </div>
          }
        }
      }

    </div>

    @if (selectedRow(); as row) {
      <app-payments-in-detail-panel-v4
        [uuid]="row.uu_id"
        [encryptedId]="row.encrypted_id"
        [row]="row"
        [isOpen]="isPanelOpen()"
        [backdropZIndex]="10002"
        [statusBadgeOverride]="selectedStatusBadge()"
        (closed)="closePanelAndReset()"
      />
    }
  `
})

export class RecentTransactionsComponent implements OnInit {
  private dashboardService = inject(V4DashboardService);
  private companyService = inject(CompanyManagementService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private checkService = inject(CheckService);
  private localStorageService = inject(LocalStorageService);
  private paymentsService = inject(PaymentsService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private detailPanelService = inject(V4DetailPanelService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  transactions = signal<DashboardTransaction[]>([]);
  groupedTransactions = signal<TransactionDateGroup[]>([]);
  activeFilter = signal<'all' | 'sent' | 'received'>('all');
  isLoading = signal(true);
  error = signal<string | null>(null);
  loadingDetailsId = signal<string | null>(null);
  selectedRow = signal<IRecieveCheckRow | null>(null);
  selectedStatusBadge = signal<{ text: string; color: string; bgColor?: string } | undefined>(undefined);
  isPanelOpen = signal(false);
  private checkStatusMap = signal<Record<string, ICheckStatus> | null>(null);

  private readonly MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  ngOnInit(): void {
    this.loadCheckStatus();
    this.loadReceivedPaymentsStatus();
    this.fetchTransactions();

    this.companyService
      .getCompanyChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.activeFilter.set('all');
        this.fetchTransactions();
      });

    this.paymentsV4Service.paymentCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchTransactions());
  }

  private loadReceivedPaymentsStatus(): void {
    this.requestPaymentsService
      .getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res?.data) {
          this.requestPaymentsService.setStatusArray(res.data);
        }
      });
  }

  private loadCheckStatus(): void {
    const cached = this.localStorageService.getItem('check_status');
    if (cached) {
      this.checkStatusMap.set(cached);
      return;
    }
    this.checkService
      .getCheckStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.checkStatusMap.set(res.data);
        }
      });
  }

  navigateToTransactions(): void {
    this.router.navigate(['/v4/manage/recent-transaction']);
  }

  setFilter(filter: 'all' | 'sent' | 'received'): void {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
    this.fetchTransactions();
  }

  navigateToSendPayment(): void {
    this.paymentsV4Service.openSendModal();
  }

  private fetchTransactions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filter = this.activeFilter();
    const typeParam =
      filter === 'sent' ? 'send-payment'
      : filter === 'received' ? 'received-payment'
      : undefined;

    this.dashboardService
      .getRecentTransactions(typeParam)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const groups = this.mapGroupedTransactions(res.data);
            this.groupedTransactions.set(groups);
            this.transactions.set(groups.flatMap((g) => g.transactions));
          }
        },
        error: (err) => {
          if (err?.status === 404) {
            this.groupedTransactions.set([]);
            this.transactions.set([]);
          } else {
            this.error.set('Failed to load transactions');
          }
        }
      });
  }

  private mapGroupedTransactions(
    raw: Record<string, IRecentTransaction[]>
  ): TransactionDateGroup[] {
    return Object.entries(raw)
      .map(([dateKey, txns]) => ({
        dateKey,
        sortDate: this.parseDateKey(dateKey).getTime(),
        label: this.formatGroupLabel(dateKey),
        transactions: (txns ?? []).map((t) => this.mapTransaction(t))
      }))
      .sort((a, b) => b.sortDate - a.sortDate)
      .map(({ dateKey, label, transactions }) => ({ dateKey, label, transactions }));
  }

  private mapTransaction(txn: IRecentTransaction): DashboardTransaction {
    const isSent = isSentPayment(txn.type);
    const sentName = txn.payee_nick_name || txn.payee_name;
    const receivedName = txn.check_from_name || txn.payee_nick_name || txn.payee_name;
    const displayName = isSent ? sentName : receivedName;
    return {
      id: txn.id,
      uu_id: txn.uu_id || '',
      type: isSent ? 'sent' as const : 'received' as const,
      title: displayName
        ? `Payment ${isSent ? 'to' : 'from'} ${displayName}`
        : 'Payment',
      amount: isSent
        ? -Math.abs(parseFloat(txn.amount) || 0)
        : Math.abs(parseFloat(txn.amount) || 0),
      created_at: formatStatusText(txn.created_at),
      updated_at: formatStatusText(txn.updated_at || ''),
      time: this.extractTime(txn.created_at),
      transaction_type: formatStatusText(txn.transaction_type),
      status: txn.status,
      receivedType: txn.received_type ?? 0,
      statusDescription: txn.status_description || '',
      checkStatus: txn.check_status,
      method: txn.transfer_type
        ? txn.transfer_type === 'CHECK'
          ? txn.transfer_mode_name || txn.transfer_type
          : txn.transfer_type
        : 'None',
      reference: txn.reference_no || txn.uu_id,
      paymentType: txn.type || '',
      sourceType: txn.source?.source || '',
      sourceObj: txn.source,
      payeeName: displayName || '',
      transferType: txn.transfer_type || '',
      invoiceData: txn.invoice_data,
      checkFromName: txn.check_from_name || '',
      senderEmail: txn.sender_email || '',
      senderPhone: txn.sender_phone || '',
      senderAddressLine1: txn.sender_address_line_1 || '',
      senderCity: txn.sender_city || '',
      senderState: txn.sender_state || '',
      senderZip: txn.sender_zip || ''
    };
  }

  private parseDateKey(dateKey: string): Date {
    const [month, day, year] = dateKey.split('/').map((n) => parseInt(n, 10));
    return new Date(year, (month || 1) - 1, day || 1);
  }

  private formatGroupLabel(dateKey: string): string {
    const date = this.parseDateKey(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const monthLabel = this.MONTH_ABBR[date.getMonth()];

    if (dateOnly.getTime() === today.getTime()) {
      return `TODAY · ${monthLabel} ${date.getDate()}, ${date.getFullYear()}`;
    }
    if (date.getFullYear() === today.getFullYear()) {
      return `${monthLabel} ${date.getDate()}`;
    }
    return `${monthLabel} ${date.getDate()}, ${date.getFullYear()}`;
  }

  private extractTime(createdAt: string): string {
    if (!createdAt) return '';
    const parts = createdAt.split('_');
    return parts.length > 1 ? parts[parts.length - 1].trim() : createdAt;
  }

  getTransferBadge(method: string): { label: string; bg: string; textColor: string } {
    const m = (method || '').toUpperCase().trim();
    if (m === 'ACH')
      return { label: 'ACH', bg: 'var(--v4-surface-success-bold)', textColor: 'var(--v4-text-success)' };
    if (m === 'WIRE')
      return { label: 'Wire', bg: 'var(--v4-insight-card-background-blue)', textColor: 'var((--v4-insight-card-label-text-blue)' };
    if (m.includes('MAIL'))
      return { label: 'Mail', bg: 'var(--v4-surface-warning-bold)', textColor: 'var(--v4-text-warning)' };
    if (m.includes('EMAIL'))
      return { label: 'Email', bg: 'var(--v4-badge-info-bg-color)', textColor: 'var(--v4-badge-info-text-color)' };
    if (m.includes('PRINT'))
      return { label: 'Print', bg: 'var(--v4-badge-approver-bg-color)', textColor: 'var(--v4-badge-approver-text-color)' };
    if (m === 'CHECK')
      return { label: 'Check', bg: 'var(--v4-badge-approver-bg-color)', textColor: 'var(--v4-badge-approver-text-color)' };
    return { label: this.formatMethod(method), bg: 'var(--v4-border-color)', textColor: 'var(--v4-secondary-text-color)' };
  }

  formatAmount(amount: number): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
    return amount < 0 ? `−${formatted}` : `+${formatted}`;
  }

  isProcessingStatus(txn: DashboardTransaction): boolean {
    return this.getStatusBadgeForTransaction(txn).label === 'Processing';
  }

  isOutgoing(txn: DashboardTransaction): boolean {
    return txn.type === 'sent';
  }

  onRepeat(txn: DashboardTransaction, event: Event): void {
    event.stopPropagation();
    if (!this.isOutgoing(txn)) return;
    if (!txn.uu_id) return;
    this.paymentsV4Service.openSendModal({
      mode: SendPaymentMode.Clone,
      paymentId: txn.uu_id
    });
  }

  onDetails(txn: DashboardTransaction, event: Event): void {
    event.stopPropagation();
    if (!txn.uu_id) return;
    if (this.loadingDetailsId() === txn.uu_id) return;
    if (this.isOutgoing(txn)) {
      this.openSentDetails(txn);
    } else {
      this.openReceivedDetails(txn);
    }
  }

  private openSentDetails(txn: DashboardTransaction): void {
    this.loadingDetailsId.set(txn.uu_id);
    this.paymentsService
      .getPaymentDetails(txn.uu_id)
      .pipe(
        finalize(() => this.loadingDetailsId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const d = res?.data;
          const transferType =
            d?.transferType || txn.transferType || '';
          const row: ICommonTransactionTableData = {
            uu_id: txn.uu_id,
            transfer_id: d?.transferId ?? '',
            transfer_type: transferType,
            transfer_type_code:
              d?.transferTypeCode || (transferType || '').toLowerCase(),
            transfer_mode: d?.transferMode ?? txn.method ?? '',
            amount: d?.amount ?? String(Math.abs(txn.amount)),
            payee_name: d?.payee?.name ?? d?.payee_name ?? txn.payeeName ?? '',
            payee_id: d?.payeeId ?? '',
            status: d?.status ?? txn.statusDescription ?? '',
            created_at: d?.createdAt ?? txn.created_at ?? '',
            updated_at: d?.updatedAt ?? '',
            source: (txn.sourceObj as unknown as ISource) ?? ({} as ISource),
            source_id: txn.sourceObj?.source_id ?? d?.sourceId ?? '',
            source_name: txn.sourceObj?.name ?? '',
            reference_no: Number(d?.referenceNo) || 0,
            description: d?.description ?? '',
            cheque_status: d?.transfer?.status ?? txn.checkStatus ?? 0,
            payee_deleted: d?.payee_deleted ?? 0,
            source_deleted: d?.source_deleted ?? 0,
            zilpayment_id: d?.zilpaymentId ?? '',
            action: '',
            third_party_name: ''
          } as unknown as ICommonTransactionTableData;
          this.detailPanelService.open(row);
        },
        error: () => {
          const row: ICommonTransactionTableData = {
            uu_id: txn.uu_id,
            transfer_id: '',
            transfer_type: txn.transferType || '',
            transfer_type_code: (txn.transferType || '').toLowerCase(),
            transfer_mode: txn.method || '',
            amount: String(Math.abs(txn.amount)),
            payee_name: txn.payeeName,
            payee_id: '',
            status: txn.statusDescription,
            created_at: txn.created_at,
            updated_at: '',
            source: (txn.sourceObj as unknown as ISource) ?? ({} as ISource),
            source_id: txn.sourceObj?.source_id ?? '',
            source_name: txn.sourceObj?.name ?? '',
            reference_no: Number(txn.reference) || 0,
            description: '',
            cheque_status: txn.checkStatus ?? 0,
            payee_deleted: 0,
            source_deleted: 0,
            action: '',
            third_party_name: ''
          } as unknown as ICommonTransactionTableData;
          this.detailPanelService.open(row);
        }
      });
  }

  private openReceivedDetails(txn: DashboardTransaction): void {
    if (!txn.uu_id) return;
    this.openReceivedPanel(txn, null);
  }

  private openReceivedPanel(
    txn: DashboardTransaction,
    d: IReceiveCheckDetails | null
  ): void {
    const uuid = txn.uu_id;
    const row: IRecieveCheckRow = {
      uu_id: uuid,
      encrypted_id: d?.chequeId ?? this.selectedRow()?.encrypted_id ?? '',
      id: uuid,
      status: d?.status ?? txn.status ?? 0,
      amount: d?.chequeAmount ?? String(Math.abs(txn.amount)),
      received_type: d?.receivedType ?? txn.receivedType ?? 0,
      receiver_for_user_id: 0,
      receiver_payee_id: '',
      receiver_phone: '',
      sender_email: txn.senderEmail ?? '',
      sender_phone: txn.senderPhone ?? '',
      sender_address_line_1: txn.senderAddressLine1 ?? '',
      sender_city: txn.senderCity ?? '',
      sender_state: txn.senderState ?? '',
      sender_zip: txn.senderZip ?? '',
      created_at: txn.created_at ?? '',
      updated_at: txn.updated_at ?? '',
      deleted_at: '',
      encrypted_bankaccount_id: '',
      action: uuid,
      pod_status: 0,
      cheque_serial_number: d?.chequeSerialNumber,
      memo: d?.chequeMemo,
      check_from_name: txn.checkFromName || d?.payeeName || txn.payeeName || ''
    };
    const badge = this.getStatusBadgeForTransaction(txn);
    const text = txn.statusDescription || badge?.label || '';
    this.selectedStatusBadge.set(
      text ? { text, color: badge?.textColor || '', bgColor: badge?.bg } : undefined
    );
    this.selectedRow.set(row);
    this.isPanelOpen.set(true);
  }

  closePanelAndReset(): void {
    this.isPanelOpen.set(false);
    this.selectedRow.set(null);
    this.selectedStatusBadge.set(undefined);
  }

  getSourceBadge = getSourceBadge;

  formatMethod(method: string): string {
    return method
      .split(/\s+/)
      .map(word => {
        if (word.length <= 3) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  getSourceLabel(sourceType: string): string {
    switch (sourceType.toUpperCase()) {
      case 'BANK':
        return 'Bank Account';
      case 'CARD':
        return 'Credit Card';
      default:
        return sourceType.charAt(0).toUpperCase() + sourceType.slice(1).toLowerCase();
    }
  }
  getInvoiceStatusBadge = getInvoiceStatusBadge;
  getCheckDraftStatusBadge = getCheckDraftStatusBadge;
  getPaymentStatusBadge = getPaymentStatusBadge;

  getStatusBadgeForTransaction(txn: DashboardTransaction): StatusBadge {
    const checkMap = this.checkStatusMap();
    const checkStatusCode = txn.checkStatus;
    if (checkMap && checkStatusCode != null && checkMap[checkStatusCode]) {
      return getCheckStatusBadgeFromApi(checkMap, checkStatusCode, txn.statusDescription);
    }
    return getPaymentStatusBadge(txn.statusDescription);
  }

}
