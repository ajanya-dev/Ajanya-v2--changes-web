import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription } from 'rxjs';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4AmountRendererComponent } from '../v4-amountRenderer';
import { V4PayeeSummaryActionCellComponent } from '../v4-summary-action-cell.component';
import { V4PayeeSummaryTextCellComponent } from '../v4-summary-text-cell.component';
import { PAYEE_SUMMARY_TABLE_ID } from '../v4-payee-summary-detail.service';

@Component({
  selector: 'app-v4-payee-summary-wallet-table',
  templateUrl: './v4-wallet-table.component.html',
  standalone: true,
  imports: [V4DataTableComponent]
})
export class V4PayeeSummaryWalletTableComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private payeeService = inject(PayeeService);
  private v3DataTableService = inject(V3DataTableService);

  name = 'Wallet';
  @Input() payeeId: string;
  type: number | string = 5;
  public tableId = DTTableId.walletTransactionHistory;
  subscriptions: Subscription[] = [];

  public columnDefs: (ColDef | ColGroupDef)[];
  columnFields: IDtColumnFields[];
  exportConfig: { heading: string; name: string; ignoreColumns: string[] };

  FloatingFilterComponent = {
    selectDate: [
      {
        id: 'zil_payments.created_at',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    amountRenderer: V4AmountRendererComponent,
    summaryActionComponent: V4PayeeSummaryActionCellComponent,
    summaryTextComponent: V4PayeeSummaryTextCellComponent
  };

  ngOnInit(): void {
    this.columnDefs = this.getColumnDefs();
    this.setDefaulColumns();

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.showPayeeName();
  }

  getColumnDefs(): (ColDef | ColGroupDef)[] {
    return [
      this.colDefAction,
      this.colDefDate,
      this.colDefDescription,
      this.colDefAmount,
      this.colDefWallet
    ];
  }

  setDefaulColumns(): void {
    this.columnFields = [
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      },
      {
        id: 'date',
        name: 'Date',
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'description',
        name: 'Description',
        isDisabled: false,
        colDef: this.colDefDescription,
        isChecked: true
      },
      {
        id: 'amount',
        name: 'Amount',
        isDisabled: false,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        colDef: this.colDefWallet,
        id: 'wallet',
        name: 'Wallet',
        isDisabled: false,
        isChecked: true
      }
    ];
  }

  showPayeeName() {
    this.subscriptions.push(
      this.payeeService.showPayee(this.payeeId).subscribe((res) => {
        if (res) {
          this.exportConfig = {
            heading: '',
            name: `${res.data.name}- Wallet Transactions`,
            ignoreColumns: ['action', 'id']
          };
        }
      })
    );
  }

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    minWidth: 90,
    maxWidth: 110,
    sortable: false,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    lockPosition: true,
    pinned: 'left',
    cellClass: 'pl-1',
    cellRenderer: 'summaryActionComponent',
    cellRendererParams: {
      tableId: PAYEE_SUMMARY_TABLE_ID.wallet,
      viewTooltip: 'View Statement'
    }
  };

  colDefDate: ColDef = {
    headerName: 'Date',
    field: 'zil_payments.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    floatingFilterComponent: 'v4DateRangeComponent',
    minWidth: 130,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: { created_at: string } }) =>
      params?.data?.created_at
  };

  colDefDescription: ColDef = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    flex: 1,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'summaryTextComponent'
  };

  colDefAmount: ColDef = {
    headerName: 'Amount',
    field: 'amount',
    minWidth: 150,
    maxWidth: 200,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableId: PAYEE_SUMMARY_TABLE_ID.wallet },
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: 'amountRenderer'
  };

  colDefWallet: ColDef = {
    headerName: 'Wallet',
    field: 'source_name',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    flex: 1,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'summaryTextComponent'
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}
