import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ContactService } from 'src/app/shared/service/contact/contact.service';
import { TodoService } from 'src/app/shared/service/todo/todo.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';

import {
  IPayeeDropdown,
  IPayeeBank,
  IPayeeInterBank,
  IPayeeAuditTrialItem,
  IPayeeDetails,
  IPayeeViewMoreInfo
} from 'src/app/modules/payee/payee-v2/model/payee';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import {
  ICheckStatus,
  IOtherDetails,
  ICashExpenseSummary
} from 'src/app/modules/check/model/check';
import { IGetContact } from 'src/app/shared/modal/add-contact/model/contact';
import { IGetTodo } from 'src/app/shared/modal/todo/model/todo';
import { IGetComment, IGetAttachment } from 'src/app/models/common';
import { IApiResSuccessOnly } from 'src/app/models/api';

interface ReceivedStatusResponse {
  success: boolean;
  data?: Record<
    string,
    Record<
      string,
      {
        statusShortDescription: string;
        color: string;
        statusFullDescription: string;
      }
    >
  >;
}

const AG_GRID_DEFAULTS = {
  startRow: 0,
  endRow: 50,
  sortModel: [],
  filterModel: {},
  groupKeys: [],
  pivotCols: [],
  pivotMode: false,
  rowGroupCols: [],
  valueCols: []
};

@Injectable({ providedIn: 'root' })
export class PayeeDetailsV4Service {
  private destroyRef = inject(DestroyRef);
  private v3DataTableService = inject(V3DataTableService);
  private payeeService = inject(PayeeService);
  private checkService = inject(CheckService);
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private contactService = inject(ContactService);
  private todoService = inject(TodoService);
  private sharedService = inject(SharedService);
  private requestPaymentsService = inject(RequestPaymentsService);

  // Loading states
  summaryLoading = signal(false);
  bankLoading = signal(false);
  intlBankLoading = signal(false);
  txnLoading = signal(false);
  profileLoading = signal(false);
  auditLoading = signal(false);
  contactsLoading = signal(false);
  todosLoading = signal(false);
  commentsLoading = signal(false);
  attachmentsLoading = signal(false);

  // Data
  payeeSummary = signal<{
    bank: IOtherDetails | null;
    cash: ICashExpenseSummary | null;
  }>({ bank: null, cash: null });

  bankAccounts = signal<IPayeeBank[]>([]);
  internationalAccounts = signal<IPayeeInterBank[]>([]);
  sendTransactions = signal<ICommonTransactionTableData[]>([]);
  receivedTransactions = signal<ICommonTransactionTableData[]>([]);
  payeeProfile = signal<IPayeeDetails | null>(null);
  auditTrailItems = signal<IPayeeAuditTrialItem[]>([]);
  checkStatusMap = signal<Record<string, ICheckStatus>>({});
  receivedStatusMap = signal<
    Record<
      string,
      Record<
        string,
        {
          statusShortDescription: string;
          color: string;
          statusFullDescription: string;
        }
      >
    >
  >({});

  contacts = signal<IGetContact[]>([]);
  todos = signal<IGetTodo[]>([]);
  comments = signal<IGetComment[]>([]);
  attachments = signal<IGetAttachment[]>([]);
  viewMoreInfo = signal<IPayeeViewMoreInfo | null>(null);

  private checkStatusCached = false;
  private receivedStatusCached = false;
  private activePayeeEncryptedId = '';

  private normalizeTransactions(
    rows: ICommonTransactionTableData[]
  ): ICommonTransactionTableData[] {
    const byTransfer = (rows ?? []).reduce((acc, row) => {
      const key = row.transfer_id || row.uu_id || row.id || '';
      if (!key) return acc;
      const prev = acc.get(key);
      if (!prev) {
        acc.set(key, row);
        return acc;
      }
      const prevTime = Date.parse(prev.updated_at || prev.created_at || '');
      const nextTime = Date.parse(row.updated_at || row.created_at || '');
      if (
        !Number.isNaN(nextTime) &&
        (Number.isNaN(prevTime) || nextTime >= prevTime)
      ) {
        acc.set(key, row);
      }
      return acc;
    }, new Map<string, ICommonTransactionTableData>());
    return Array.from(byTransfer.values()).sort((a, b) => {
      const aTime = Date.parse(a.updated_at || a.created_at || '');
      const bTime = Date.parse(b.updated_at || b.created_at || '');
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return bTime - aTime;
    });
  }

  loadAllData(payee: IPayeeDropdown): void {
    const encryptedId = payee.encryptedId || '';
    if (!encryptedId) return;
    this.activePayeeEncryptedId = encryptedId;

    this.loadSummary(encryptedId);
    this.loadDomesticBanks(encryptedId);
    this.loadInternationalBanks(encryptedId);
    this.loadSendTransactions(payee, encryptedId);
    this.loadReceivedTransactions(payee, encryptedId);
    this.loadProfile(encryptedId);
    this.loadAuditTrail(encryptedId);
    this.loadCheckStatus();
    this.loadReceivedStatus();
    this.loadContacts(encryptedId);
    this.loadTodos(encryptedId);
    this.loadComments(encryptedId);
    this.loadAttachments(encryptedId);
    this.loadViewMoreInfo(encryptedId);
  }

  private loadSummary(encryptedId: string): void {
    this.summaryLoading.set(true);
    this.checkService
      .getPayeeSummary(encryptedId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.summaryLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.payeeSummary.set({
            bank: res.other ?? null,
            cash: res.cash_expenses ?? null
          });
        }
      });
  }

  loadBankAccounts(encryptedId: string): void {
    this.loadDomesticBanks(encryptedId);
    this.loadInternationalBanks(encryptedId);
  }

  private loadDomesticBanks(encryptedId: string): void {
    this.bankLoading.set(true);
    this.v3DataTableService
      .getTableListData<IPayeeBank>(43, {
        ...AG_GRID_DEFAULTS,
        payeeId: encryptedId
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.bankLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.bankAccounts.set(res.rowData ?? []);
        }
      });
  }

  private loadInternationalBanks(encryptedId: string): void {
    this.intlBankLoading.set(true);
    this.v3DataTableService
      .getTableListData<IPayeeInterBank>(64, {
        ...AG_GRID_DEFAULTS,
        payeeId: encryptedId
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.intlBankLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.internationalAccounts.set(res.rowData ?? []);
        }
      });
  }

  private loadSendTransactions(
    payee: IPayeeDropdown,
    encryptedId: string
  ): void {
    const payeeFilterId = payee.encryptedId || payee.id;
    this.txnLoading.set(true);
    this.v3DataTableService
      .getTableListData<ICommonTransactionTableData>(79, {
        ...AG_GRID_DEFAULTS,
        filterModel: {
          payee_id: {
            filterType: 'text',
            type: 'equals',
            filter: payeeFilterId
          }
        }
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.sendTransactions.set(
            this.normalizeTransactions(res.rowData ?? [])
          );
        }
      });
  }

  private loadReceivedTransactions(
    payee: IPayeeDropdown,
    encryptedId: string
  ): void {
    this.v3DataTableService
      .getTableListData<ICommonTransactionTableData>(97, {
        ...AG_GRID_DEFAULTS,
        payee_email: payee.email
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.txnLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.receivedTransactions.set(
            this.normalizeTransactions(res.rowData ?? [])
          );
        }
      });
  }

  private loadProfile(encryptedId: string): void {
    this.profileLoading.set(true);
    this.payeeService
      .getPayeeEditData(encryptedId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.profileLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.payeeProfile.set(res.data ?? null);
        }
      });
  }

  private loadAuditTrail(encryptedId: string): void {
    this.auditLoading.set(true);
    this.payeeService
      .getPayeeAuditTrail(encryptedId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.auditLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.auditTrailItems.set(res.data ?? []);
        }
      });
  }

  private loadCheckStatus(): void {
    if (this.checkStatusCached) return;
    this.checkService
      .getCheckStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.checkStatusMap.set(res.data ?? {});
          this.checkStatusCached = true;
        }
      });
  }

  private loadReceivedStatus(): void {
    if (this.receivedStatusCached) return;
    this.requestPaymentsService
      .getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: ReceivedStatusResponse) => {
          if (res.success) {
            this.receivedStatusMap.set(res.data ?? {});
            this.receivedStatusCached = true;
          }
        }
      });
  }

  // Actions
  setDefaultDomesticBank(payeeId: string, bankId: string): void {
    this.payeeService
      .setDefaultDDBankAcc({ bankId, payeeId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Default bank account updated successfully'
            });
            this.loadDomesticBanks(payeeId);
          }
        }
      });
  }

  deleteDomesticBank(payeeId: string, bankId: string): void {
    this.payeeService
      .deletePayeeBank(payeeId, bankId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: IApiResSuccessOnly) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Bank account deleted successfully'
            });
            this.loadDomesticBanks(payeeId);
          }
        }
      });
  }

  setDefaultInternationalBank(
    accountId: string,
    payeeId: string,
    accountType: string
  ): void {
    this.walletService
      .setDefaultBank({ accountId, payeeId, type: accountType })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Default international account updated successfully'
            });
            this.loadInternationalBanks(payeeId);
          }
        }
      });
  }

  private loadViewMoreInfo(encryptedId: string): void {
    this.payeeService
      .viewPayee(encryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.viewMoreInfo.set(res.data?.payee_more_information ?? null);
        }
      });
  }

  // Contacts
  loadContacts(encryptedId: string): void {
    this.contactsLoading.set(true);
    this.contactService
      .getAllContact('payees', encryptedId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.contactsLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.contacts.set(res.data ?? []);
        }
      });
  }

  deleteContact(encryptedPayeeId: string, contactEncryptedId: string): void {
    this.contactService
      .deleteContact('payees', encryptedPayeeId, contactEncryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res) {
            this.alertService.successAlert({
              content: 'Contact deleted successfully'
            });
            this.loadContacts(encryptedPayeeId);
          }
        }
      });
  }

  // Todos
  loadTodos(encryptedId: string): void {
    this.todosLoading.set(true);
    this.todoService
      .getAllTodo('payees', encryptedId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.todosLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.todos.set(res.data ?? []);
        }
      });
  }

  deleteTodo(encryptedPayeeId: string, todoEncryptedId: string): void {
    this.todoService
      .deleteTodo('payees', encryptedPayeeId, todoEncryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res) {
            this.alertService.successAlert({
              content: 'To-Do deleted successfully'
            });
            this.loadTodos(encryptedPayeeId);
          }
        }
      });
  }

  completeTodo(
    encryptedPayeeId: string,
    todoEncryptedId: string,
    currentStatus: string
  ): void {
    const newStatus = currentStatus === 'done' ? 'active' : 'done';
    this.todos.update((items) =>
      items.map((t) =>
        t.encrypted_id === todoEncryptedId
          ? { ...t, todo_status: newStatus }
          : t
      )
    );
    this.todoService
      .getTodoStatus('payees', encryptedPayeeId, todoEncryptedId, {
        status: newStatus
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.todos.update((items) =>
            items.map((t) =>
              t.encrypted_id === todoEncryptedId
                ? { ...t, todo_status: currentStatus }
                : t
            )
          );
        }
      });
  }

  // Comments
  loadComments(encryptedId: string): void {
    this.commentsLoading.set(true);
    this.sharedService
      .getAllComments('payees', encryptedId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.commentsLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.comments.set((res.data as IGetComment[]) ?? []);
        }
      });
  }

  deleteComment(encryptedPayeeId: string, commentEncryptedId: string): void {
    this.sharedService
      .deleteComment('payees', encryptedPayeeId, commentEncryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Comment deleted successfully'
            });
            this.loadComments(encryptedPayeeId);
          }
        }
      });
  }

  // Attachments
  loadAttachments(encryptedId: string): void {
    this.attachmentsLoading.set(true);
    this.sharedService
      .getAttachment('payees', encryptedId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.attachmentsLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (this.activePayeeEncryptedId !== encryptedId) return;
          this.attachments.set(res.data ?? []);
        }
      });
  }

  deleteAttachment(
    encryptedPayeeId: string,
    attachmentEncryptedId: string
  ): void {
    this.sharedService
      .deleteAttachment('payees', encryptedPayeeId, attachmentEncryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Attachment deleted successfully'
            });
            this.loadAttachments(encryptedPayeeId);
          }
        }
      });
  }

  deleteInternationalBank(bankId: string, encryptedPayeeId: string): void {
    this.payeeService
      .DeletePayeeIPBank(bankId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: IApiResSuccessOnly) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'International bank account deleted successfully'
            });
            this.loadInternationalBanks(encryptedPayeeId);
          }
        }
      });
  }

  resetAll(): void {
    this.activePayeeEncryptedId = '';
    this.payeeSummary.set({ bank: null, cash: null });
    this.bankAccounts.set([]);
    this.internationalAccounts.set([]);
    this.sendTransactions.set([]);
    this.receivedTransactions.set([]);
    this.payeeProfile.set(null);
    this.auditTrailItems.set([]);
    this.contacts.set([]);
    this.todos.set([]);
    this.comments.set([]);
    this.attachments.set([]);
    this.viewMoreInfo.set(null);
    this.summaryLoading.set(false);
    this.bankLoading.set(false);
    this.intlBankLoading.set(false);
    this.txnLoading.set(false);
    this.profileLoading.set(false);
    this.auditLoading.set(false);
    this.contactsLoading.set(false);
    this.todosLoading.set(false);
    this.commentsLoading.set(false);
    this.attachmentsLoading.set(false);
  }
}
