import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription, take } from 'rxjs';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { ICashExpenseExport, IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { AmountRendererComponent } from '../payee-transaction-history/amountRenderer';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-cash-expense-table',
  templateUrl: './cash-expense-table.component.html',
  styleUrls: ['./cash-expense-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class CashExpenseTableComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataTableService = inject(DataTableService);
  private payeeService = inject(PayeeService);
  private v3DataTableService = inject(V3DataTableService);
  private cashexpService = inject(CashExpenseService);

  name = 'Cash Expenses';
  payeeId: string;
  type: number | string = 2;
  public tableId = DTTableId.cashExpenseTransactionHistory;
  selectedPanelButton = signal('2');
  exportLoading = signal<boolean>(false);

  public columnDefs: (ColDef | ColGroupDef)[];
  columnFields: IDtColumnFields[];
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [
      {
        name: 'Checks',
        id: '1'
      },
      {
        name: 'Cash Expenses',
        id: '2'
      },
      {
        name: 'Billing',
        id: '3'
      },
      {
        name: 'Invoice',
        id: '4'
      },
      {
        name: 'Wallet',
        id: '5'
      }
    ]
  }));

  public frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    amountRenderer: AmountRendererComponent
  };

  FloatingFilterComponent = {
    selectDate: [
      { id: 'transaction_date', initialRange: 'All Time', isPrimary: true }
    ]
  };

  exportConfig: { heading: string; name: string; ignoreColumns: string[] };
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefDate,
      this.colDefMemo,
      this.colDefAmount,
      this.colDefAccountName,
      this.colDefSerialNo,
      this.colDefCreatedBy
    ];

    this.columnFields = [
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
        colDef: this.colDefSerialNo,
        id: 'serialNo',
        name: 'Serial No',
        isDisabled: false,
        isChecked: true
      },
      {
        colDef: this.colDefCreatedBy,
        id: 'createdby',
        name: 'Created by',
        isDisabled: false,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      undefined
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.showPayeeName();
  }

  /**
   * @description Retrieves the name of the selected payee.
   * This name is displayed in exported files.
   */
  showPayeeName() {
    this.route.parent?.params.subscribe((param) => {
      this.payeeId = param.payeeId;
    });
    this.subscriptions.push(
      this.payeeService.showPayee(this.payeeId).subscribe((res) => {
        if (res) {
          this.exportConfig = {
            heading: '',
            name: `${res.data.name}- Cash Expense Transactions`,
            ignoreColumns: ['action', 'id']
          };
        }
      })
    );
  }

  /**
   * @description Navigates to the next table.
   * @param {string | number} event.id - The ID of the next table.
   */
  headerButtonClick(event: { id: string | number }) {
    if (event?.id && this.type !== event.id) {
      this.router.navigate([`../${event.id}`], { relativeTo: this.route });
    }
  }

  onCashExpenseExport(event: ICashExpenseExport) {
    this.exportLoading.set(true);
    this.cashexpService.exportCashExpense(event,this.payeeId)
    .pipe(finalize(() => this.exportLoading.set(false)),take(1))
    .subscribe((res) => {
      if(res.success){
        window.open(res.data.url, '_blank');
      }
    });
  }

  colDefDate = {
    headerName: 'Date',
    field: 'transaction_date',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    floatingFilterComponent: 'selectDateComponent',
    minWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter'
  };

  colDefSerialNo = {
    headerName: 'Serial No',
    field: 'serial_no',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter'
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter'
  };

  colDefAmount = {
    minWidth: 100,
    maxWidth: 150,
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableId: 38 },
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: 'amountRenderer'
  };

  colDefAccountName = {
    headerName: 'Account Name',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter'
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}
