import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
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
  selector: 'app-v4-payee-summary-check-list-table',
  templateUrl: './v4-check-list-table.component.html',
  standalone: true,
  imports: [V4DataTableComponent]
})
export class V4PayeeSummaryCheckListTableComponent
  implements OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  private payeeService = inject(PayeeService);
  private v3DataTableService = inject(V3DataTableService);

  name = 'Checks';
  @Input() payeeId: string;
  type: number | string = 1;
  public tableId = DTTableId.checkTransactionHistory;
  subscriptions: Subscription[] = [];

  public columnDefs: (ColDef | ColGroupDef)[];
  columnFields: IDtColumnFields[];
  exportConfig: { heading: string; name: string; ignoreColumns: string[] };

  public frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    amountRenderer: V4AmountRendererComponent,
    summaryActionComponent: V4PayeeSummaryActionCellComponent,
    summaryTextComponent: V4PayeeSummaryTextCellComponent
  };

  FloatingFilterComponent = {
    selectDate: [
      { id: 'cheque_issue_date', initialRange: 'All Time', isPrimary: true }
    ]
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
      this.colDefMemo,
      this.colDefAmount,
      this.colDefAccountName,
      this.colDefCheckNo,
      this.colDefCreatedBy
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
        id: 'memo',
        name: 'Memo',
        isDisabled: false,
        colDef: this.colDefMemo,
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
        colDef: this.colDefAccountName,
        id: 'accountname',
        name: 'Account Name',
        isDisabled: false,
        isChecked: true
      },
      {
        colDef: this.colDefCheckNo,
        id: 'checkNo',
        name: 'Check #',
        isDisabled: false,
        isChecked: true
      },
      {
        colDef: this.colDefCreatedBy,
        id: 'createdby',
        name: 'Initiated By',
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
            name: `${res.data.name}- Check Transactions`,
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
      tableId: PAYEE_SUMMARY_TABLE_ID.check,
      viewTooltip: 'View Check'
    }
  };

  colDefDate: ColDef = {
    headerName: 'Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true
  };

  colDefMemo: ColDef = {
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    flex: 1,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: 'summaryTextComponent'
  };

  colDefCheckNo: ColDef = {
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'summaryTextComponent'
  };

  colDefCreatedBy: ColDef = {
    headerName: 'Initiated By',
    field: 'cheque_created_by_name',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: 'summaryTextComponent',
    cellRendererParams: { valueField: 'cheque_created_by_name_name' }
  };

  colDefAmount: ColDef = {
    headerName: 'Amount',
    field: 'cheque_amount',
    minWidth: 150,
    maxWidth: 200,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableId: PAYEE_SUMMARY_TABLE_ID.check },
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: 'amountRenderer'
  };

  colDefAccountName: ColDef = {
    headerName: 'Account Name',
    field: 'bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 170,
    flex: 1,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: 'summaryTextComponent',
    cellRendererParams: { valueField: 'bank_account_account_name' }
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}
