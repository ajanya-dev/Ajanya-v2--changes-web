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
import { Subscription } from 'rxjs';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { AmountRendererComponent } from '../payee-transaction-history/amountRenderer';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-check-list-table',
  templateUrl: './check-list-table.component.html',
  styleUrls: ['./check-list-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class CheckListTableComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataTableService = inject(DataTableService);
  private payeeService = inject(PayeeService);
  private v3DataTableService = inject(V3DataTableService);

  name = 'Checks';
  payeeId: string;
  type: number | string = 1;
  public tableId = DTTableId.checkTransactionHistory;
  subscriptions: Subscription[] = [];

  public columnDefs: (ColDef | ColGroupDef)[];
  columnFields: IDtColumnFields[];
  exportConfig: { heading: string; name: string; ignoreColumns: string[] };
  selectedPanelButton = signal('1');

  public frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    amountRenderer: AmountRendererComponent
  };

  FloatingFilterComponent = {
    selectDate: [
      { id: 'cheque_issue_date', initialRange: 'All Time', isPrimary: true }
    ]
  };

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

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefDate,
      this.colDefMemo,
      this.colDefAmount,
      this.colDefAccountName,
      this.colDefCheckNo,
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
        colDef: this.colDefCheckNo,
        id: 'checkNo',
        name: 'Check #',
        isDisabled: false,
        isChecked: true
      },
      {
        colDef: this.colDefCreatedBy,
        id: 'createdby',
        name: 'Initiated by',
        isDisabled: false,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();

    this.showPayeeName();
  }

  showPayeeName() {
    this.route.parent?.params.subscribe((param) => {
      this.payeeId = param.payeeId;
    });

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

  headerButtonClick(event: { id: string | number }) {
    if (event?.id && this.type !== event.id) {
      this.router.navigate([`../${event.id}`], { relativeTo: this.route });
    }
  }

  colDefDate = {
    headerName: 'Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefCheckNo = {
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter'
  };

  colDefCreatedBy = {
    headerName: 'Initiated By',
    field: 'cheque_created_by_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,

    cellRenderer: (params: { data: { cheque_created_by_name_name: string } }) =>
      params?.data?.cheque_created_by_name_name
  };

  colDefAmount = {
    minWidth: 100,
    maxWidth: 150,
    headerName: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableId: 37 },
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: 'amountRenderer'
  };

  colDefAccountName = {
    headerName: 'Account Name',
    field: 'bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,

    cellRenderer: (params: { data: { bank_account_account_name: string } }) =>
      params?.data?.bank_account_account_name
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}
