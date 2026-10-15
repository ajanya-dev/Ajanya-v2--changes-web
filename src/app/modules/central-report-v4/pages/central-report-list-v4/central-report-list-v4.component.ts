import { Component, computed, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import {
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';

import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { IDepositSlip } from 'src/app/modules/deposit-slip/model/depositslips';
import {
  DetailSidePanelComponent,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { DepositSlipDetailPanelV4Component } from 'src/app/modules/deposit-slip/deposit-slip-v4/v4-components/deposit-slip-detail-panel-v4/deposit-slip-detail-panel-v4.component';
import { CashExpenseDetailPanelV4Component } from 'src/app/modules/cash-expense-v4/components/cash-expense-detail-panel-v4/cash-expense-detail-panel-v4.component';

import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';

interface IRowData {
  id: number;
  created_at: string;
  issue_date: string;
  reference_no?: string;
  expense_type: number;
  bank_account_account_name: string;
  bank_account_nick_name: string;
  balance: string;
  amount: string;
  cheque_serial_number?: string;
  operation_id: string;
  operation: number;
  payee_id: number;
  memo?: string;
  payee_nick_name?: string;
  payee_name?: string;
  name: string;
  nick_name: string;
  clients: string;
  action: string;
}

@Component({
  selector: 'app-central-report-list-v4',
  standalone: true,
  imports: [
    V4DataTableComponent,
    V4PageHeaderComponent,
    DetailSidePanelComponent,
    DepositSlipDetailPanelV4Component,
    CashExpenseDetailPanelV4Component
  ],
  providers: [V3DataTableService, TitleCasePipe, CurrencyPipe],
  templateUrl: './central-report-list-v4.component.html',
  styleUrl: './central-report-list-v4.component.scss'
})
export class CentralReportListV4Component implements OnInit {
  private dataTableService = inject(DataTableService);
  private titlecase = inject(TitleCasePipe);
  private currencyPipe = inject(CurrencyPipe);
  private router = inject(Router);
  private depositService = inject(DepositSlipsService);
  private destroyRef = inject(DestroyRef);
  private detailPanelService = inject(V4DetailPanelService);

  public v3DataTableService = inject(V3DataTableService);

  tableId = DTTableId.centralReport;

  // Deposit slip side panel
  isDepositPanelOpen = signal(false);
  depositSlipId = signal('');
  depositSlipData = signal<IDepositSlip | undefined>(undefined);
  depositSlipLoading = signal(false);

  // Cash expense side panel
  isCashExpensePanelOpen = signal(false);
  cashExpenseId = signal('');

  depositSlipRefId = computed(() => this.depositSlipData()?.refId ?? '');

  depositSlipStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const data = this.depositSlipData();
    if (!data) return undefined;
    if (data.verified === 1) return { text: 'Verified', color: 'var(--v4-common-green-color)' };
    if (data.verified === 2) return { text: 'Voided', color: 'var(--v4-common-red-color)' };
    return { text: 'Not Verified', color: 'var(--v4-common-yellow-color)' };
  });

  headerElements: IV3DtHeaderElements = {
    buttons: []
  };

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'operation',
        values: [
          { value: 1, name: 'Check' },
          { value: 2, name: 'Deposit Slip' },
          { value: 3, name: 'Cash Expense' }
        ]
      }
    ],
    selectDate: [
      { id: 'issue_date', initialRange: 'All Time', isPrimary: true },
      { id: 'centralaccountings.created_at', initialRange: 'Last 3 Months' }
    ]
  };

  frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    V3DTCommonFilterComponent: V4DTCommonFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    v4ViewButtonComponent: V4ViewButtonComponent
  };

  // Column definitions
  colDefDummy = {
    headerName: 'None',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    cellStyle: () => ({ display: 'none' }),
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    minWidth: 1,
    maxWidth: 1
  };

  // View column (icon cluster) - pinned left, second. It is not an Actions
  // column, so the right-edge rule does not apply to it.
  colDefView = {
    headerName: 'View',
    field: 'view',
    sortable: false,
    cellRenderer: 'v4ViewButtonComponent',
    cellRendererParams: {
      // 0 routes viewButtonAction() straight to onViewClick; the menu is
      // hidden because this report has no per-row actions.
      viewButtonType: 0,
      hideMenuOption: true,
      onViewClick: (row: unknown) => this.onViewRow(row as IRowData)
    },
    floatingFilter: false,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'pl-1',
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    width: 50,
    minWidth: 50,
    maxWidth: 50
  };

  colDefDate = {
    headerName: 'Date',
    field: 'issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 170,
    width: 170,
    enableSorting: true,
    sort: 'desc' as const,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' }
  };

  colDefBankAcc = {
    headerName: 'Bank A/C',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    cellRenderer: (params: {
      data: {
        bank_account_nick_name: string | null;
        bank_account_account_name: string;
      };
    }) => {
      if (
        params.data.bank_account_nick_name === null ||
        params.data.bank_account_nick_name === ''
      ) {
        return this.titlecase.transform(params.data.bank_account_account_name);
      }
      return this.titlecase.transform(params.data.bank_account_nick_name);
    }
  };

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    cellRenderer: (params: {
      data: { operation: number; payee_name: string };
    }) => {
      if (params.data.operation === 2) {
        return 'Deposit';
      }
      return params.data.payee_name;
    },
    cellStyle: (params: { data: { operation: string } }) => {
      if (params.data.operation === '2')
        return { color: 'var(--v4-common-green-color)' };
      return null;
    }
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: { value: number }) =>
      this.formatAmount(params.value)
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'centralaccountings.balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: { data: { balance: number } }) =>
      this.formatAmount(params.data.balance)
  };

  colDefType = {
    headerName: 'Type',
    field: 'operation',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',
    suppressHeaderMenuButton: true,
    minWidth: 120,
    cellRenderer: (params: { value: number }) => {
      if (params.value === 1) return 'Check';
      if (params.value === 2) return 'Deposit Slip';
      return 'Cash';
    },
    cellStyle: (params: { value: number }) => {
      if (params.value === 1)
        return { color: 'var(--v4-common-red-color)' };
      if (params.value === 2)
        return { color: 'var(--v4-common-green-color)' };
      if (params.value === 3)
        return { color: 'var(--v4-common-blue-color)' };
      return null;
    }
  };

  colDefBy = {
    headerName: 'By',
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 140,
    width: 140,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefReferenceNo = {
    headerName: 'Reference No',
    field: 'reference_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 170,
    cellRenderer: (params: {
      data: {
        reference_no: string | number | null;
        cheque_serial_number: string;
        operation: number;
      };
    }) => {
      let refno: string;
      if (
        params.data.reference_no !== null &&
        params.data.reference_no !== 0 &&
        params.data.reference_no !== ''
      ) {
        refno = String(params.data.reference_no);
      } else {
        refno = params.data.cheque_serial_number;
      }
      if (refno === null) {
        if (params.data.operation === 2) {
          if (params.data.reference_no === 0) {
            return `Deposit Slip Ref No:${params.data.reference_no}`;
          }
        }
        return '';
      }
      if (params.data.operation === 1) {
        return `Check No:${refno}`;
      }
      if (params.data.operation === 2) {
        return `Deposit Slip Ref No:${refno}`;
      }
      return `Cash Expense Serial No:${refno}`;
    }
  };

  colDefCreatedTime = {
    headerName: 'Created Time',
    field: 'centralaccountings.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 180,
    cellRenderer: 'v4CreatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.created_at
  };

  columnDefs = [
    this.colDefDummy,
    this.colDefView,
    this.colDefDate,
    this.colDefBankAcc,
    this.colDefPayee,
    this.colDefAmount,
    this.colDefBalance,
    this.colDefType,
    this.colDefBy,
    this.colDefMemo,
    this.colDefReferenceNo,
    this.colDefCreatedTime
  ];

  columnFields: IDtColumnFields[] = [
    {
      id: 'id_dummy',
      name: 'None',
      isDisabled: true,
      colDef: this.colDefDummy,
      isChecked: true
    },
    {
      id: 'id_view',
      name: 'View',
      isDisabled: true,
      colDef: this.colDefView,
      isChecked: true
    },
    {
      id: 'id_date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'id_bankAcc',
      name: 'Bank A/C',
      isDisabled: false,
      colDef: this.colDefBankAcc,
      isChecked: true
    },
    {
      id: 'id_payee',
      name: 'Payee',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_balance',
      name: 'Balance',
      isDisabled: false,
      colDef: this.colDefBalance,
      isChecked: true
    },
    {
      id: 'id_type',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'id_by',
      name: 'By',
      isDisabled: false,
      colDef: this.colDefBy,
      isChecked: true
    },
    {
      id: 'id_memo',
      name: 'Memo',
      isDisabled: true,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'id_referenceNo',
      name: 'Reference No',
      isDisabled: false,
      colDef: this.colDefReferenceNo,
      isChecked: true
    },
    {
      id: 'id_createdTime',
      name: 'Created Time',
      isDisabled: false,
      colDef: this.colDefCreatedTime,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent
    );
    this.dataTableService.postcolumnVisible(this.tableId, { visibility: true });
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  private formatAmount(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const amount = Number(value);
    if (Number.isNaN(amount)) return String(value);
    return this.currencyPipe.transform(amount, 'USD', 'symbol', '1.2-2', 'en-US') ?? '';
  }

  goBack(): void {
    this.router.navigateByUrl('/v4/manage/more/report');
  }

  /** Opens the side panel that matches the row's transaction type. */
  private onViewRow(row: IRowData | undefined): void {
    if (row == null) return;

    if (row.operation === 1) {
      this.openCheckPanel(row);
    } else if (row.operation === 2) {
      this.openDepositSlipPanel(row.operation_id);
    } else if (row.operation === 3) {
      this.openCashExpensePanel(row.operation_id);
    }
  }

  private openCheckPanel(item: IRowData): void {
    this.detailPanelService.open({
      transfer_type: 'CHECK',
      transfer_type_code: 'check',
      transfer_id: item.operation_id,
      uu_id: item.operation_id,
      amount: item.amount,
      payee_name: item.payee_name ?? item.name ?? '',
      payee_id: String(item.payee_id),
      source_name: item.bank_account_nick_name || item.bank_account_account_name,
      created_at: item.created_at,
      reference_no: item.reference_no ? Number(item.reference_no) : 0,
      action: item.action
    } as ICommonTransactionTableData, { hideActionButtons: true });
  }

  private openCashExpensePanel(id: string): void {
    this.cashExpenseId.set(id);
    this.isCashExpensePanelOpen.set(true);
  }

  private openDepositSlipPanel(id: string): void {
    this.depositSlipId.set(id);
    this.depositSlipData.set(undefined);
    this.depositSlipLoading.set(true);
    this.isDepositPanelOpen.set(true);

    this.depositService
      .getEditBody(id)
      .pipe(
        finalize(() => this.depositSlipLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.depositSlipData.set(res.data);
        }
      });
  }
}
