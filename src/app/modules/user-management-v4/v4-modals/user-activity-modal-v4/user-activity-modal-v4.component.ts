import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { Subject , Subscription, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  IActivityExportPayload,
  IActivityTypeDetails,
  IActivityTypeResponse,
  IUserActivity,
  IUserActivityPaginationPayload,
  UserActivityTypes
} from 'src/app/models/user';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { IInvoiceRowData } from 'src/app/modules/invoices/model/invoice';
import { IDepositSlip } from 'src/app/modules/deposit-slip/model/depositslips';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { WalletActionViewModalV4Component } from 'src/app/shared/modal/wallet-modal/wallet-action-view-modal-v4/wallet-action-view-modal-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { CashExpenseDetailPanelV4Component } from 'src/app/modules/cash-expense-v4/components/cash-expense-detail-panel-v4/cash-expense-detail-panel-v4.component';
import { V4BillsDetailsPanelComponent } from 'src/app/modules/bill/v4-bills/components/v4-bills-details-panel/v4-bills-details-panel.component';
import { PaymentsOutDetailPanelComponent } from 'src/app/modules/payments-v4/payments-out/components/payments-out-detail-panel/payments-out-detail-panel.component';
import { V4InvoiceDetailPanelComponent } from 'src/app/modules/v4-invoices/pages/v4-invoice-list/v4-invoice-detail-panel/v4-invoice-detail-panel.component';
import { DetailSidePanelComponent } from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { DepositSlipDetailPanelV4Component } from 'src/app/modules/deposit-slip/deposit-slip-v4/v4-components/deposit-slip-detail-panel-v4/deposit-slip-detail-panel-v4.component';
import { InvoiceActionsService } from 'src/app/modules/v4-invoices/services/invoice-actions.service';
import { DepositSlipActionsService } from 'src/app/modules/deposit-slip/deposit-slip-v4/services/deposit-slip-actions.service';

export interface IActivityRow extends IActivityTypeDetails {
  type: UserActivityTypes;
  invoice_status?: number;
  is_mailed?: number;
}

export interface IActivityModalData {
  activityDetails: IUserActivity;
  userName: string;
  clientId: string;
  selectedCategory?: UserActivityTypes;
}

@Component({
  selector: 'app-user-activity-modal-v4',
  templateUrl: './user-activity-modal-v4.component.html',
  styleUrls: ['./user-activity-modal-v4.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatDialogClose,
    MatMenuModule,
    MatTooltip,
    CommonTabV4Component,
    CommonButtonV4Component,
    TitleCasePipe,
    DateRangeComponent,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    CashExpenseDetailPanelV4Component,
    V4BillsDetailsPanelComponent,
    PaymentsOutDetailPanelComponent,
    V4InvoiceDetailPanelComponent,
    DetailSidePanelComponent,
    DepositSlipDetailPanelV4Component
  ]
})
export class UserActivityModalV4Component implements OnInit {
  private data = inject<IActivityModalData>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<UserActivityModalV4Component>);
  private alertService = inject(V4AlertService);
  private userService = inject(UserManagementService);
  private depositSlipsService = inject(DepositSlipsService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);
  private invoiceActions = inject(InvoiceActionsService);
  private depositSlipActions = inject(DepositSlipActionsService);
  private router = inject(Router);

  exportLoading = signal(false);
  fromDate = '';
  toDate = '';

  // Search
  searchInput = '';
  private searchSubject = new Subject<string>();

  private pageRequestSub: Subscription | null = null;

  // Detail panel state
  detailPanelType = signal<
    'cashExpense' | 'bill' | 'payment' | 'invoice' | 'depositSlip' | null
  >(null);

  isDetailPanelOpen = signal(false);

  // Panel-specific data
  cashExpenseId = signal('');
  billId = signal('');
  paymentUuid = signal('');
  paymentRow = signal<Partial<ICommonTransactionTableData> | null>(null);
  invoiceRow = signal<Partial<IInvoiceRowData> | null>(null);
  depositSlipId = signal('');
  depositSlipData = signal<IDepositSlip | undefined>(undefined);
  depositSlipLoading = signal(false);

  userName = '';
  allRows: IActivityRow[] = [];
  filteredRows: IActivityRow[] = [];
  paginatedRows: IActivityRow[] = [];

  // Snapshot of the aggregate first-page data from the initial audit-trail payload.
  // Used to restore the "All" tab view after switching away to a specific category.
  private initialAllRows: IActivityRow[] = [];

  // Server total for the currently active specific category (drives pagination).
  // Unused when activeTab === 'All' (client-side pagination on allRows instead).
  activeTabTotal = 0;

  isLoadingPage = signal(false);

  // View filter: 'list' = tabbed per-category (default), 'date' = chronological
  // flat list across all categories (from the `/audit-trail?filter=date` endpoint).
  // Matches the v3 `users-activity-new` toggle behavior.
  selectedFilter: 'list' | 'date' = 'list';

  // Date-mode state: flattened rows returned by userDatewiseActivities + summed
  // server total across all categories. Populated lazily when the user switches
  // to the "Date" filter; drives pagination while `selectedFilter === 'date'`.
  datewiseRows: IActivityRow[] = [];
  datewiseTotal = 0;

  // Tabs
  tabs: ITabItem[] = [];
  activeTab = 'All';

  // Column filters
  filters = {
    action: '',
    refNo: '',
    date: '',
    source: '',
    amount: '',
    memo: '',
    status: 'All'
  };

  // Status options for dropdown
  statusOptions: string[] = ['All'];

  // Pagination
  currentPage = 1;
  pageSize = 25;

  private tabConfigs: {
    type: UserActivityTypes;
    icon: string;
    label: string;
  }[] = [
    { type: 'Check', icon: 'file-text', label: 'Check' },
    { type: 'ACH', icon: 'building-2', label: 'ACH' },
    { type: 'Wire', icon: 'repeat', label: 'Wire' },
    { type: 'Virtual Card', icon: 'credit-card', label: 'Card' },
    { type: 'Check Mail', icon: 'mail', label: 'Check Mail' },
    {
      type: 'Direct deposit',
      icon: 'arrow-down-to-line',
      label: 'Direct Deposit'
    },
    { type: 'Bill', icon: 'receipt', label: 'Bill' },
    { type: 'Cash Expense', icon: 'banknote', label: 'Cash Expense' },
    { type: 'Deposit Slip', icon: 'file-check', label: 'Deposit Slip' },
    { type: 'Received Checklist', icon: 'shield', label: 'Received Checklist' },
    { type: 'Invoice', icon: 'file-text', label: 'Invoice' },
    { type: 'Wallet', icon: 'wallet', label: 'Wallet' },
    { type: 'Bank Account', icon: 'landmark', label: 'Bank Account' }
  ];

  exportTabs: {id:string,name:string}[] = [
    {id:'All',name:'All'},
    {id:'Cheque',name:'Check'},
    {id:'ACH',name:'ACH'},
    {id:'Wire',name:'Wire'},
    {id:'Virtual Card',name:'Virtual Card'},
    {id:'Check Mail',name:'Check Mail'},
    {id:'DirectDeposit',name:'Direct deposit'},
    {id:'Bill',name:'Bill'},
    {id:'CashExpense',name:'Cash Expense'},
    {id:'Depositslip',name:'Deposit Slip'},
    {id:'ReceivedCheckList',name:'Received Checklist'},
    {id:'OcwInvoice',name:'Invoice'},
    {id:'Wallet',name:'Wallet'},
    {id:'BankAccount',name:'Bank Account'}
  ];

  // Maps the in-modal activeTab key (UserActivityTypes) to the export API's
  // export_type id used by `exportTabs`. Lets the export dropdown preselect
  // the category that matches whatever tab the user is currently viewing.
  private activeTabToExportId: Record<string, string> = {
    All: 'All',
    Check: 'Cheque',
    ACH: 'ACH',
    Wire: 'Wire',
    'Virtual Card': 'Virtual Card',
    'Check Mail': 'Check Mail',
    'Direct deposit': 'DirectDeposit',
    Bill: 'Bill',
    'Cash Expense': 'CashExpense',
    'Deposit Slip': 'Depositslip',
    'Received Checklist': 'ReceivedCheckList',
    Invoice: 'OcwInvoice',
    Wallet: 'Wallet',
    'Bank Account': 'BankAccount'
  };

  selectedExportType = 'All';

  exportTypeConfig: Iv4ngSelectConfig = {
    placeholder: 'Select category',
    displayField: 'name',
    outputField: 'id',
    style: { size: 1 }
  };

  /** Export categories shown in the dropdown — restricted to the categories
   *  the user can actually see as tabs (i.e. those with non-zero counts), plus
   *  the aggregate "All" option which is always valid. Recomputed after
   *  `buildTabs()` runs so empty categories never appear in export.
   */
  availableExportTabs: { id: string; name: string }[] = [];

  private buildAvailableExportTabs(): void {
    const allowedTabValues = new Set(this.tabs.map((t) => t.value));
    this.availableExportTabs = this.exportTabs.filter((et) => {
      if (et.id === 'All') return true;
      const tabKey = Object.entries(this.activeTabToExportId).find(
        ([, exportId]) => exportId === et.id
      )?.[0];
      return tabKey ? allowedTabValues.has(tabKey) : false;
    });
  }

  ngOnInit(): void {
    this.userName = this.data.userName;
    this.flattenData();
    this.initialAllRows = [...this.allRows];
    this.buildTabs();
    this.buildAvailableExportTabs();
    this.collectStatusOptions();

    if (this.data.selectedCategory) {
      this.activeTab = this.data.selectedCategory;
      // Category-specific tab opens server-paginated — fetch page 1 fresh so
      // the user sees all items for that category, not just the preloaded
      // first 10 aggregated into the initial audit-trail payload.
      this.fetchCategoryPage(1);
    } else {
      this.applyFilters();
    }

    this.selectedExportType = this.activeTabToExportId[this.activeTab] ?? 'All';

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((searchTerm) => {
        this.currentPage = 1;
        this.searchAndFetch(searchTerm);
      });
  }

  onSearchInputChange(): void {
    this.searchSubject.next(this.searchInput);
  }

  onClearSearch(): void {
    this.searchInput = '';
    this.searchSubject.next('');
  }

  private searchAndFetch(searchTerm: string): void {
    if (this.selectedFilter === 'date') {
      this.fetchDatewisePage(1);
    } else if (this.activeTab === 'All') {
      this.fetchAllWithSearch(searchTerm);
    } else {
      this.fetchCategoryPage(1);
    }
  }

  private fetchAllWithSearch(searchTerm: string): void {
    if (!searchTerm) {
      this.allRows = [...this.initialAllRows];
      this.activeTabTotal = 0;
      this.applyFilters();
      return;
    }

    const pagination: Record<string, { page: number; per_page: number }> = {};
    this.tabConfigs.forEach((config) => {
      pagination[config.type] = { page: 1, per_page: this.pageSize };
    });
    const payload = {
      pagination,
      search: searchTerm
    } as unknown as IUserActivityPaginationPayload;

    this.pageRequestSub?.unsubscribe();
    this.isLoadingPage.set(true);
    this.pageRequestSub = this.userService
      .getAuditTrail(this.data.clientId, payload)
      .pipe(
        finalize(() => this.isLoadingPage.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res?.success) return;
        const activities = res.data?.activities;
        if (!activities) {
          this.allRows = [];
          this.applyFilters();
          return;
        }
        const flattened: IActivityRow[] = [];
        Object.entries(activities).forEach(([type, entry]) => {
          const items: IActivityTypeDetails[] = Array.isArray(entry)
            ? entry
            : (entry as IActivityTypeResponse).data || [];
          items.forEach((item) => {
            flattened.push({ ...item, type: type as UserActivityTypes });
          });
        });
        this.allRows = flattened;
        this.applyFilters();
      });
  }

  private flattenData(): void {
    const activities = this.data.activityDetails?.activities;
    if (!activities) return;

    Object.entries(activities).forEach(([type, entry]) => {
      const items: IActivityTypeDetails[] = Array.isArray(entry)
        ? entry
        : (entry as IActivityTypeResponse).data || [];

      items.forEach((item) => {
        this.allRows.push({ ...item, type: type as UserActivityTypes });
      });
    });
  }

  private buildTabs(): void {
    const counts =
      this.data.activityDetails?.created_counts ||
      ({} as Record<string, number>);
    // const total =
    //   this.data.activityDetails?.total_created || this.allRows.length;

    // this.tabs = [
    //   {
    //     label: `All Activities (${total})`,
    //     value: 'All',
    //     lucideIcon: 'activity'
    //   }
    // ];

    this.tabConfigs.forEach((config) => {
      const count = (counts as Record<string, number>)[config.type] || 0;
      if (count > 0) {
        this.tabs.push({
          label: `${config.label} (${count})`,
          value: config.type,
          lucideIcon: config.icon
        });
      }
    });
  }

  private collectStatusOptions(): void {
    const statuses = new Set<string>();
    this.allRows.forEach((row) => {
      if (row.status) statuses.add(row.status);
    });
    this.statusOptions = ['All', ...Array.from(statuses)];
  }

  onTabChange(tab: string): void {
    this.pageRequestSub?.unsubscribe();
    this.activeTab = tab;
    this.selectedExportType = this.activeTabToExportId[tab] ?? 'All';
    this.currentPage = 1;
    this.filters = {
      action: '',
      refNo: '',
      date: '',
      source: '',
      amount: '',
      memo: '',
      status: 'All'
    };

    if (tab === 'All') {
      // Restore the aggregate preloaded data and client-paginate as before.
      this.allRows = [...this.initialAllRows];
      this.activeTabTotal = 0;
      this.applyFilters();
    } else {
      // Specific category — fetch page 1 server-side with per_page = pageSize.
      this.fetchCategoryPage(1);
    }
  }

  /** Switch between list view (category tabs) and date view (flat chronological
   *  list). In date mode, tabs and Export CSV are hidden; the table gains a
   *  TYPE column so each row's category is visible.
   */
  showActivity(id: 'list' | 'date'): void {
    if (this.selectedFilter === id) return;
    this.pageRequestSub?.unsubscribe();
    this.selectedFilter = id;
    this.currentPage = 1;
    this.filters = {
      action: '',
      refNo: '',
      date: '',
      source: '',
      amount: '',
      memo: '',
      status: 'All'
    };

    if (id === 'date') {
      this.fetchDatewisePage(1);
    } else if (this.activeTab === 'All') {
      this.allRows = [...this.initialAllRows];
      this.activeTabTotal = 0;
      this.applyFilters();
    } else {
      this.fetchCategoryPage(1);
    }
  }

  /** Fetch one server page for the date-wise (chronological) view. Sends the
   *  same page number for every category in the pagination payload; the server
   *  returns a per-category map of that page's items which we flatten into
   *  `datewiseRows`. Total = sum of each category's `pagination.total`.
   */
  private fetchDatewisePage(page: number): void {
    const pagination: Record<string, { page: number; per_page: number }> = {};
    this.tabConfigs.forEach((config) => {
      pagination[config.type] = { page, per_page: this.pageSize };
    });
    const payload = {
      pagination,
      ...(this.searchInput ? { search: this.searchInput } : {})
    } as unknown as IUserActivityPaginationPayload;

    this.pageRequestSub?.unsubscribe();
    this.isLoadingPage.set(true);
    this.pageRequestSub = this.userService
      .userDatewiseActivities(this.data.clientId, payload)
      .pipe(
        finalize(() => this.isLoadingPage.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res?.success) return;
        const activities = res.data?.activities as IUserActivity;
        if (!activities) {
          this.datewiseRows = [];
          this.datewiseTotal = 0;
          this.applyFilters();
          return;
        }

        const flattened: IActivityRow[] = [];
        let total = 0;
        Object.entries(activities).forEach(([type, entry]) => {
          if (Array.isArray(entry)) {
            entry.forEach((d) =>
              flattened.push({ ...d, type: type as UserActivityTypes })
            );
            total += entry.length;
          } else if (entry) {
            (entry.data || []).forEach((d: IActivityTypeDetails) =>
              flattened.push({ ...d, type: type as UserActivityTypes })
            );
            total += entry.pagination?.total ?? (entry.data?.length || 0);
          }
        });

        this.datewiseRows = flattened;
        this.datewiseTotal = total;
        this.applyFilters();
      });
  }

  /** Fetch one server page for the active category tab. Updates `allRows`
   *  with the fetched page's rows and `activeTabTotal` with the server total
   *  so pagination controls drive the API cursor. No-op for the "All" tab.
   */
  private fetchCategoryPage(page: number): void {
    if (this.activeTab === 'All') return;
    const tab = this.activeTab as Exclude<UserActivityTypes, 'All'>;
    const payload = {
      pagination: {
        [tab]: { page, per_page: this.pageSize }
      },
      ...(this.searchInput ? { search: this.searchInput } : {})
    } as unknown as IUserActivityPaginationPayload;
    this.pageRequestSub?.unsubscribe();
    this.isLoadingPage.set(true);
    this.pageRequestSub = this.userService
      .getAuditTrail(this.data.clientId, payload)
      .pipe(
        finalize(() => this.isLoadingPage.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res?.success) return;
        const entry = res.data?.activities?.[tab];
        if (!entry) {
          this.allRows = [];
          this.activeTabTotal = 0;
        } else if (Array.isArray(entry)) {
          this.allRows = entry.map((d) => ({ ...d, type: tab }));
          this.activeTabTotal = entry.length;
        } else {
          this.allRows = (entry.data || []).map((d) => ({ ...d, type: tab }));
          this.activeTabTotal = entry.pagination?.total ?? this.allRows.length;
        }
        this.applyFilters();
      });
  }

  applyFilters(): void {
    let rows: IActivityRow[];
    if (this.selectedFilter === 'date') {
      rows = [...this.datewiseRows];
    } else if (this.activeTab === 'All') {
      rows = [...this.allRows];
    } else {
      rows = this.allRows.filter((r) => r.type === this.activeTab);
    }

    const f = this.filters;
    if (f.action) {
      rows = rows.filter((r) =>
        r.status?.toLowerCase().includes(f.action.toLowerCase())
      );
    }
    if (f.refNo) {
      rows = rows.filter((r) =>
        r.referenceNumber?.toLowerCase().includes(f.refNo.toLowerCase())
      );
    }
    if (f.date) {
      rows = rows.filter((r) =>
        r.date?.toLowerCase().includes(f.date.toLowerCase())
      );
    }
    if (f.source) {
      rows = rows.filter((r) =>
        (r.bank_name || r.source_name || '')
          .toLowerCase()
          .includes(f.source.toLowerCase())
      );
    }
    if (f.amount) {
      rows = rows.filter((r) => String(r.amount).includes(f.amount));
    }
    if (f.memo) {
      rows = rows.filter((r) =>
        r.memo?.toLowerCase().includes(f.memo.toLowerCase())
      );
    }
    if (f.status !== 'All') {
      rows = rows.filter(
        (r) => r.status?.toLowerCase() === f.status.toLowerCase()
      );
    }

    this.filteredRows = rows;
    // Only reset to page 1 for the client-paginated list "All" tab. Specific
    // tabs and date mode are server-paginated — `currentPage` holds the server
    // page and filters apply within it.
    if (this.selectedFilter === 'list' && this.activeTab === 'All') {
      this.currentPage = 1;
    }
    this.updatePagination();
  }

  updatePagination(): void {
    if (this.selectedFilter === 'date') {
      // Date mode is server-paginated: `filteredRows` is already this server
      // page's flattened subset — render it directly, no client slice.
      this.paginatedRows = this.filteredRows;
    } else if (this.activeTab === 'All') {
      const start = (this.currentPage - 1) * this.pageSize;
      this.paginatedRows = this.filteredRows.slice(
        start,
        start + this.pageSize
      );
    } else {
      // Specific tab: `filteredRows` is already the current server page's
      // filtered subset — render it directly, no client slice.
      this.paginatedRows = this.filteredRows;
    }
  }

  /** Number of items driving pagination for the current view. Date mode uses
   *  the summed server total across all categories; list mode uses the filtered
   *  client count for the "All" tab and the server total for specific tabs.
   */
  get displayTotal(): number {
    if (this.selectedFilter === 'date') return this.datewiseTotal;
    return this.activeTab === 'All'
      ? this.filteredRows.length
      : this.activeTabTotal;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayTotal / this.pageSize));
  }

  get showingFrom(): number {
    return this.displayTotal === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.displayTotal);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;

    if (this.selectedFilter === 'date') {
      this.fetchDatewisePage(page);
    } else if (this.activeTab === 'All') {
      this.updatePagination();
    } else {
      this.fetchCategoryPage(page);
    }
  }

  getStatusBadgeClasses(status: string): { bg: string; text: string } {
    switch (status?.toLowerCase()) {
      case 'created':
      case 'completed':
      case 'printed':
      case 'imported':
        return {
          bg: 'bg-v4-badge-success-bg-color',
          text: 'text-v4-badge-success-text-color'
        };
      case 'pending':
        return {
          bg: 'bg-v4-badge-warning-bg-color',
          text: 'text-v4-badge-warning-text-color'
        };
      case 'deleted':
      case 'failed':
        return {
          bg: 'bg-v4-badge-error-bg-color',
          text: 'text-v4-badge-error-text-color'
        };
      default:
        return {
          bg: 'bg-v4-badge-info-bg-color',
          text: 'text-v4-badge-info-text-color'
        };
    }
  }

  formatAmount(amount: number): string {
    if (amount == null) return '';
    return Math.abs(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  onViewRow(row: IActivityRow): void {
    const { type } = row;

    if (row.currentStatus === 'deleted' && row.status !== 'deleted') {
      this.alertService.warningAlert({
        content: `This ${type} is Already Deleted`
      });
      return;
    }
    if (
      (type === 'Received Checklist' && row.status === 'created') ||
      row.status === 'deleted'
    ) {
      return;
    }

    if (type === 'Cash Expense') {
      this.cashExpenseId.set(row.referenceId);
      this.openDetailPanel('cashExpense');
    } else if (type === 'Bill') {
      this.billId.set(row.referenceId);
      this.openDetailPanel('bill');
    } else if (type === 'Invoice') {
      this.invoiceRow.set({
        action: row.referenceId,
        status: row.invoice_status,
        is_mailed: row.is_mailed
      } as Partial<IInvoiceRowData> as IInvoiceRowData);
      this.openDetailPanel('invoice');
    } else if (type === 'Deposit Slip') {
      this.depositSlipId.set(row.referenceId);
      this.depositSlipLoading.set(true);
      this.depositSlipData.set(undefined);
      this.openDetailPanel('depositSlip');
      this.depositSlipsService
        .getEditBody(row.referenceId)
        .pipe(
          finalize(() => this.depositSlipLoading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.depositSlipData.set(res.data);
          }
        });
    } else if (type === 'Wallet') {
      this.dialog.open(WalletActionViewModalV4Component, {
        maxWidth: '900px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: { id: row.referenceNumber }
      });
    } else if (type === 'Bank Account') {
      this.dialogRef.close();
      this.router.navigate(['/v4/manage/bank-accounts/index'], {
        queryParams: { id: row.referenceId }
      });
    } else if (
      [
        'Check',
        'ACH',
        'Wire',
        'Virtual Card',
        'Check Mail',
        'Direct deposit',
        'Received Checklist'
      ].includes(type)
    ) {
      
      const uuid = row.uu_id || row.referenceId;
      this.paymentUuid.set(uuid);
      this.paymentRow.set({
        uu_id: uuid,
        transfer_type: type === 'Check' ? 'CHECK' : type.toUpperCase(),
        transfer_id: row.referenceId,
        amount: String(row.amount),
        status: row.status,
        payee_name: '',
        source_name: row.source_name || row.bank_name || undefined,
        description: row.memo || undefined,
        created_by: this.userName
          ? ({ name: this.userName } as ICommonTransactionTableData['created_by'])
          : undefined
      } as Partial<ICommonTransactionTableData> as ICommonTransactionTableData);
      this.openDetailPanel('payment');
    }
  }

  private openDetailPanel(
    type: 'cashExpense' | 'bill' | 'payment' | 'invoice' | 'depositSlip'
  ): void {
    this.detailPanelType.set(type);
    this.isDetailPanelOpen.set(true);
  }

  closeDetailPanel(): void {
    this.isDetailPanelOpen.set(false);
    this.detailPanelType.set(null);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage;
    const last = this.totalPages;
    let start = Math.max(1, current - 2);
    const end = Math.min(last, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }

  filterAndExportDateChange(event: { start: string; end: string }): void {
    this.fromDate = event.start;
    this.toDate = event.end;
  }

  exportFile(fileType: string): void {
    this.exportLoading.set(true);
    const formattedFromDate = this.datePipe.transform(
      this.fromDate,
      'yyyy-MM-dd'
    );
    const formattedToDate = this.datePipe.transform(this.toDate, 'yyyy-MM-dd');
    const payload: IActivityExportPayload = {
      type: fileType,
      export_type: this.selectedExportType,
      fromDate: formattedFromDate as string,
      toDate: formattedToDate as string
    };

    this.userService
      .exportUserActivity(this.data.clientId, payload)
      .pipe(
        finalize(() => this.exportLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data.url, '_blank');
        }
      });
  }

  onInvoicePanelAction(key: string): void {
    const row = this.invoiceRow();
    if (!row) return;
    this.invoiceActions.handleInvoiceAction(row as IInvoiceRowData, key, {
      onStatusPatched: (status) =>
        this.invoiceRow.update((current) =>
          current ? { ...current, status } : current
        )
    });
  }

  onDepositSlipPanelAction(key: string): void {
    const id = this.depositSlipId();
    switch (key) {
      case 'edit':
      case 'clone':
        this.closeDetailPanel();
        this.dialogRef.close();
        break;
      case 'delete':
        this.depositSlipActions.delete(id, {
          onSuccess: () => this.closeDetailPanel()
        });
        break;
      default:
        break;
    }
  }

  /** Cash-expense clone/edit emit `closed` then open a child modal whose result
   *  drives `actionSuccess`. Nulling detailPanelType here would unmount the panel
   *  and unsubscribe that child modal's handler before it fires, so only hide the
   *  panel — it's torn down when another panel opens or the modal closes. */
  closeCashExpensePanel(): void {
    this.isDetailPanelOpen.set(false);
  }

  onCashExpenseActionSuccess(): void {
    this.closeDetailPanel();
    this.dialogRef.close();
    this.router.navigateByUrl('/v4/manage/cashexp/index');
  }
}
