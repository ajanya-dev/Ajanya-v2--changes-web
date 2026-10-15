import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import {
  ICellRendererParams,
  RowSelectedEvent,
  ValueFormatterParams
} from '@ag-grid-community/core';
import { filter, finalize, firstValueFrom, mergeMap, Subscription, take } from 'rxjs';

import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { ICoulmnDefFieldsResponse } from 'src/app/models/v3-datatable';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4BankDropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-bank-dropdown-floating-filter/v4-bank-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { CashExpenseActionV4Component } from '../cash-expense-action-v4/cash-expense-action-v4.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { CashExpenseTextCellComponent } from './cell-renderers/cash-expense-text-cell.component';

import { CashExpenseV4StateService } from '../../services/cash-expense-v4-state.service';
import { CashExpenseCreateModalV4Component } from '../../modals/cash-expense-create-modal-v4/cash-expense-create-modal-v4.component';
import { ICashExpenseExport } from 'src/app/modules/v3-data-table/models/v3-data-table';

import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { CashExpenseActivityModalV4Component } from '../../modals/cash-expense-activity-modal-v4/cash-expense-activity-modal-v4.component';
import { CashExpenseGetReceiptModalV4Component } from '../../modals/cash-expense-get-receipt-modal-v4/cash-expense-get-receipt-modal-v4.component';
import { CashExpenseSendPaymentProofModalV4Component } from '../../modals/cash-expense-send-payment-proof-modal-v4/cash-expense-send-payment-proof-modal-v4.component';
import { CashExpenseTypeRendererV4Component } from '../cash-expense-type-renderer-v4/cash-expense-type-renderer-v4.component';

interface CashExpenseData {
  id: number;
  amount: number;
  bank_account_nick_name: string;
  payee_name: string;
  memo: string;
  transaction_date: string;
  serial_no: string;
  'users.name': string;
  catagory_name: string;
  transaction_type: string;
  account_no: string;
  invoice_no: string;
  'cash_expenses.created_at': string;
  order_for_bank: string;
  action: string;
  previous_balance: string;
  current_balance: string;
}

@Component({
  selector: 'app-cash-expense-list-v4',
  standalone: true,
  imports: [V4DataTableComponent],
  providers: [V3DataTableService, CurrencyPipe],
  templateUrl: './cash-expense-list-v4.component.html',
  styleUrl: './cash-expense-list-v4.component.scss'
})
export class CashExpenseListV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private cashExpenseService = inject(CashExpenseService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private stateService = inject(CashExpenseV4StateService);
  private destroyRef = inject(DestroyRef);
  private localStorageService = inject(LocalStorageService);
  private currencyPipe = inject(CurrencyPipe);

  subscriptions: Subscription[] = [];
  tableId = DTTableId.cashExpense;
  exportLoading = signal(false);
  isCashExpenseBalanceEnabled = signal(false);
  isReceiptLoading = signal(false);

  // Track selected rows to control floating bar button states
  private selectedRowsSignal = signal<any[]>([]);

  // Get Signed Receipt: enabled only when exactly 1 row is selected AND it's an Expense (transaction_type === 1)
  private isReceiptDisabled = computed(() => {
    if (this.isReceiptLoading()) return true;
    const rows = this.selectedRowsSignal();
    return rows.length !== 1 || rows[0]?.transaction_type !== 1;
  });

  // Send Payment Proof: enabled only when exactly 1 row is selected
  private isSendProofDisabled = computed(() => {
    return this.selectedRowsSignal().length !== 1;
  });

  cashExpenseType = [
    { value: '1', name: 'Expense' },
    { value: '2', name: 'Income' }
  ];

  headerElements = computed(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_btnNew',
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        isAddIcon: true,
        toolTip: 'New Cash Expense'
      },
      {
        text: this.isReceiptLoading() ? 'Loading...' : 'Get Signed Receipt',
        id: 'id_receipt',
        toolTip: 'Get Signed Receipt',
        isAddIcon: true,
        icon: ['fas', 'receipt'],
        type: { style: 'violet', name: 'money-action' },
        lucideIcon: this.isReceiptLoading() ? 'loader' : 'receipt',
        floatingBarVariant: 'filled-primary' as const,
        disabled: this.isReceiptDisabled()
      },
      {
        text: 'Send Payment Proof',
        id: 'id_paymentProof',
        icon: ['fas', 'paper-plane'],
        type: 'list',
        toolTip: 'Send Payment Proof',
        isAddIcon: true,
        lucideIcon: 'send',
        floatingBarVariant: 'filled-primary' as const,
        disabled: this.isSendProofDisabled()
      },
      {
        id: 'id_btnTrash',
        text: 'Delete',
        roundIcon: ['fas', 'trash'],
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Delete Your Cash Expense',
        lucideIcon: 'trash-2',
        floatingBarVariant: 'filled-danger' as const
      }
    ]
  }));

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'transaction_type',
        values: this.cashExpenseType
      }
    ],
    selectDate: [
      {
        id: 'cash_expenses.created_at',
        initialRange: 'All Time',
        isPrimary: true
      },
      { id: 'transaction_date', initialRange: 'All Time' }
    ]
  };

  cellRenderer = {
    action: [
      { name: 'Edit', id: 'RId_edit', icon: 'pencil' },
      { name: 'Clone', id: 'RId_clone', icon: 'copy' },
      { name: 'Delete', id: 'RId_delete', icon: 'trash-2', color: 'red' },
      { name: 'Audit Trail', id: 'RId_audit', icon: 'activity' },
      { name: 'Add Comments', id: 'RId_comments', icon: 'message-square' },
      { name: 'Add Attachment', id: 'RId_attachment', icon: 'paperclip' },
      { name: 'Send Payment Proof', id: 'RId_proof', icon: 'send' },
      { name: 'Get Signed Receipt', id: 'RId_receipt', icon: 'file-check' }
    ]
  };

  actionComponentProp = { actionButton: true, eyeButton: true };

  exportConfig = { heading: '', ignoreColumns: ['action', 'id'] };

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: DtActionComponent,
    cashExpenseActionV4: CashExpenseActionV4Component,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4BankDropdownFilter: V4BankDropdownFloatingFilterComponent,
    v4PayeeMultiSelectFilter: V4PayeeMultiSelectFloatingFilterComponent,
    v4DropdownFilter: V4DropdownFloatingFilterComponent,
    V3PayeeNameComponent: V4PayeeNameComponent,
    cashExpenseTextCell: CashExpenseTextCellComponent,
    cashExpenseTypeRendererV4: CashExpenseTypeRendererV4Component,
    v4CreatedAtComponent: V4CreatedAtComponent
  };

  // Column definitions
  colDefId = {
    width: 50,
    minWidth: 50,
    headerName: '',
    field: 'id',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    pinned: 'left' as const,
    lockPinned: true,
    suppressMovable: true,
    checkboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    sortable: false,
    cellRenderer: () => ''
  };

  colDefAmount = {
    minWidth: 150,
    maxWidth: 200,
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: 'cashExpenseTextCell',
    cellRendererParams: { isAmountField: true }
  };

  colDefAcc = {
    minWidth: 175,
    headerName: 'A/C',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4BankDropdownFilter',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { page: 'cashExpense' }
  };

  colDefPayee = {
    minWidth: 175,
    headerName: environment.env_id === 'compass' ? 'Vendor' : 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4PayeeMultiSelectFilter',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3PayeeNameComponent',
    cellRendererParams: { payeeField: 'encrypted_payee_id' }
  };

  colDefMemo = {
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTextCell'
  };

  colDefDate = {
    minWidth: 120,
    headerName: 'Date',
    field: 'transaction_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTextCell',
    cellRendererParams: { type: 'date' }
  };

  colDefSerialNo = {
    minWidth: 80,
    headerName: 'Serial No',
    field: 'serial_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTextCell'
  };

  colDefBy = {
    minWidth: 80,
    headerName: 'By',
    field: 'users.name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTextCell',
    cellRendererForExport: (params: ICellRendererParams) => params?.data?.name
  };

  colDefCategory = {
    minWidth: 70,
    headerName: 'Category',
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTextCell'
  };

  colDefCreatedAt = {
    minWidth: 200,
    headerName: 'Created Time',
    field: 'cash_expenses.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) => params?.data?.created_at
  };

  colDefType = {
    minWidth: 190,
    headerName: 'Type',
    field: 'transaction_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DropdownFilter',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTypeRendererV4',
    cellRendererForExport: (params: ICellRendererParams) => {
      const value = params?.data?.transaction_type;
      return value === 1 ? 'Expense' : value === 2 ? 'Income' : '';
    }
  };

  colDefAction = {
    minWidth: 90,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 110,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'cashExpenseActionV4',
    cellRendererParams: { tableVersion: 'v4' },
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPreviousBalance = {
    minWidth: 150,
    maxWidth: 200,
    headerName: 'Previous Balance',
    field: 'previous_balance',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    sortable: false,
    cellClass: 'v4-amount-col flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    valueFormatter: (params: ValueFormatterParams) => this.formatAmount(params.value)
  };

  colDefCurrentBalance = {
    minWidth: 150,
    maxWidth: 200,
    headerName: 'Current Balance',
    field: 'current_balance',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    sortable: false,
    cellClass: 'v4-amount-col flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    valueFormatter: (params: ValueFormatterParams) => this.formatAmount(params.value)
  };

  columnDefs = [
    this.colDefId,
    this.colDefAction,
    this.colDefAmount,
    this.colDefAcc,
    this.colDefPayee,
    this.colDefMemo,
    this.colDefDate,
    this.colDefSerialNo,
    this.colDefBy,
    this.colDefCategory,
    this.colDefCreatedAt,
    this.colDefType,
    this.colDefPreviousBalance,
    this.colDefCurrentBalance
  ];

  columnFields = [
    { id: 'id', name: '#', isDisabled: true, colDef: this.colDefId, isChecked: true },
    { id: 'id_action', name: 'Action', isDisabled: true, colDef: this.colDefAction, isChecked: true },
    { id: 'id_amount', name: 'Amount', isDisabled: true, colDef: this.colDefAmount, isChecked: true },
    { id: 'id_acc', name: 'A/C', isDisabled: false, colDef: this.colDefAcc, isChecked: true },
    { id: 'id_payee', name: 'Payee', isDisabled: true, colDef: this.colDefPayee, isChecked: true },
    { id: 'id_memo', name: 'Memo', isDisabled: false, colDef: this.colDefMemo, isChecked: true },
    { id: 'id_date', name: 'Date', isDisabled: false, colDef: this.colDefDate, isChecked: true },
    { id: 'id_serialNo', name: 'Serial No', isDisabled: false, colDef: this.colDefSerialNo, isChecked: true },
    { id: 'id_by', name: 'By', isDisabled: false, colDef: this.colDefBy, isChecked: true },
    { id: 'id_category', name: 'Category', isDisabled: false, colDef: this.colDefCategory, isChecked: true },
    { id: 'id_type', name: 'Type', isDisabled: false, colDef: this.colDefType, isChecked: true },
    { id: 'id_createdAt', name: 'Created Time', isDisabled: false, colDef: this.colDefCreatedAt, isChecked: true },
    { id: 'id_previous_balance', name: 'Previous Balance', isDisabled: false, colDef: this.colDefPreviousBalance, isChecked: true },
    { id: 'id_current_balance', name: 'Current Balance', isDisabled: false, colDef: this.colDefCurrentBalance, isChecked: true }
  ];

  constructor() {
    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.isCashExpenseBalanceEnabled.set(userPlugins?.includes('cash-expense-balance'));

    toObservable(this.stateService.refreshTrigger)
      .pipe(
        filter((v) => v > 0),
        takeUntilDestroyed()
      )
      .subscribe(() => this.refreshTable());
  }

  ngOnInit(): void {
    if (!this.isCashExpenseBalanceEnabled()) {
      this.columnFields = this.columnFields.filter(
        (col) => col.id !== 'id_previous_balance' && col.id !== 'id_current_balance'
      );
      this.columnDefs = this.columnDefs.filter(
        (col) => col.field !== 'previous_balance' && col.field !== 'current_balance'
      );
    }
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  // Header button clicks
  headerButtonClick(event: {
    id: string;
    selectedRows: ISelectedSingleRow['selectedRows'];
    tableId: number;
  }): void {
    const { selectedRows } = event;

    switch (event.id) {
      case 'id_btnNew':
        this.openCreateModal('create');
        break;
      case 'id_btnTrash':
        this.onDeleteMultiple(selectedRows);
        break;
      case 'id_paymentProof':
        if (selectedRows?.length) {
          this.openSendPaymentProof(selectedRows[0].action as string);
        } else {
          this.alertService.warningAlert({ content: 'Please select at least one entry' });
        }
        break;
      case 'id_receipt':
        if (selectedRows?.length) {
          this.openGetReceipt(selectedRows[0]);
        } else {
          this.alertService.warningAlert({ content: 'Please select at least one entry' });
        }
        break;
      default:
        break;
    }
  }

  // Cell action clicks
  cellRendererActionClick(event: ISelectedSingleRow): void {
    const selectedItem = event.selectedRow;
    if (!selectedItem) return;

    switch (event?.id) {
      case 'RId_edit':
        this.openCreateModal('edit', selectedItem.id as string);
        break;
      case 'RId_clone':
        this.openCreateModal('clone', selectedItem.id as string);
        break;
      case 'RId_delete':
        this.onSingleDelete(selectedItem);
        break;
      case 'RId_audit':
        this.dialog.open(CashExpenseActivityModalV4Component, {
          maxWidth: '1000px',
          width: '100%',
          panelClass: 'paddingless-modal-rounded',
          data: { id: selectedItem.action as string }
        });
        break;
      case 'RId_comments':
        this.openAddCommentModal(selectedItem);
        break;
      case 'RId_attachment':
        this.openAddAttachmentModal(selectedItem);
        break;
      case 'RId_proof':
        this.openSendPaymentProof(selectedItem.action as string);
        break;
      case 'RId_receipt':
        this.openGetReceipt(selectedItem);
        break;
      default:
        break;
    }
  }

  // View button click -> open detail panel
  cellRendererActionView(event: ISelectedSingleRow): void {
    const selectedItem = event.selectedRow;
    if (selectedItem?.action) {
      this.stateService.openDetail(selectedItem.action as string);
    }
  }

  onRowSelected(event: RowSelectedEvent): void {
    this.selectedRowsSignal.set(event.api.getSelectedRows());
  }

  onEmptyStateCreate(): void {
    this.openCreateModal('create');
  }

  private openCreateModal(mode: 'create' | 'edit' | 'clone', id?: string): void {
    const ref = this.dialog.open(CashExpenseCreateModalV4Component, {
      width: '100%',
      maxWidth: '680px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { mode, id }
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result?.success) {
        this.refreshTable();
        this.stateService.refreshList();
      }
    });
  }

  private onSingleDelete(selectedItem: ISelectedSingleRow['selectedRow']): void {
    const selectedId = selectedItem?.action;
    if (!selectedId) return;

    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete?',
        cancelMsg: 'No, Cancel!',
        doneMsg: 'Yes, Delete it!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.cashExpenseService
          .deleteCashexpense(selectedId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({ title: 'Success!', content: 'Cash expense deleted.', close: true });
              this.refreshTable();
              this.stateService.refreshList();
            }
          });
      });
  }

  private onDeleteMultiple(selectedItems: ISelectedSingleRow['selectedRows']): void {
    if (!selectedItems?.length) {
      this.alertService.warningAlert({ content: 'Please select at least one entry to delete.' });
      return;
    }

    const itemIds = { ids: selectedItems.map((val: any) => val.action) };

    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete?',
        cancelMsg: 'No, Cancel!',
        doneMsg: 'Yes'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.cashExpenseService
          .bulkDeleteCashexpense(itemIds)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({ title: 'Success!', content: 'Cash expense entries deleted.', close: true });
              this.refreshTable();
              this.stateService.refreshList();
            }
          });
      });
  }

  private openAddCommentModal(selectedItem: ISelectedSingleRow['selectedRow']): void {
    const ref = this.dialog.open(V4CheckAddCommentModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { id: selectedItem?.id, type: 'cash-expenses', enableDelete: true }
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshTable();
    });
  }

  private openAddAttachmentModal(selectedItem: ISelectedSingleRow['selectedRow']): void {
    const ref = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id: selectedItem?.id, type: 'cash-expenses' }
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshTable();
    });
  }

  private openSendPaymentProof(id: string): void {
    this.dialog.open(CashExpenseSendPaymentProofModalV4Component, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { id },
      disableClose: true
    });
  }

  private openGetReceipt(selectedItem: ISelectedSingleRow['selectedRow']): void {
    if (selectedItem?.transaction_type !== 1) {
      this.alertService.warningAlert({
        content: 'Income entries are currently unavailable at this facility.'
      });
      return;
    }

    // CashExpenseGetReceiptModalV4Component only needs the
    // cashExpenseId — it does its own getCashExpensesById +
    // payeeService.showPayee lookup internally to populate the SMS
    // and Email forms. No prefetch / payload building required here.
    const cashExpenseId = selectedItem?.action as string;
    this.dialog.open(CashExpenseGetReceiptModalV4Component, {
      maxWidth: '550px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { cashExpenseId }
    });
  }

  onCashExpenseExport(event: ICashExpenseExport): void {
    this.exportLoading.set(true);
    this.cashExpenseService
      .exportCashExpense(event)
      .pipe(
        finalize(() => this.exportLoading.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data.url, '_blank');
        }
      });
  }

  private formatAmount(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string' && value.includes('$')) return value;

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);

    return (
      this.currencyPipe.transform(numericValue, 'USD', 'symbol', '1.2-2', 'en-US') ?? ''
    );
  }

  private refreshTable(): void {
    this.dataTableService.setRefreshStatus(true);
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  mapper = mergeMap(async (val: ICoulmnDefFieldsResponse<CashExpenseData>) => {
    if (!val.rowData.length) return val;

    if (!this.isCashExpenseBalanceEnabled()) return val;

    const bankIds = val.rowData.map((item: CashExpenseData) => item.id.toString());
    const balancePromise = firstValueFrom(
      this.cashExpenseService.getCashExpenseBalance(bankIds, 1)
    );
    const [balancesResult] = await Promise.allSettled([balancePromise]);

    if (balancesResult.status === 'fulfilled' && balancesResult.value.success) {
      const balances = balancesResult.value.data.balances;
      const balanceData = Object.keys(balances);

      val.rowData.forEach((el: CashExpenseData) => {
        balanceData.forEach((item: string) => {
          if (el?.id.toString() === item) {
            el.previous_balance = balances[item].previous_balance || '0';
            el.current_balance = balances[item].current_balance || '0';
          }
        });
      });
    }
    return val;
  });

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
