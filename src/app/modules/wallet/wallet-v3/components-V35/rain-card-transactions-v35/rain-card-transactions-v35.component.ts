import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { Observable, Subscription, switchMap, of, take } from 'rxjs';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICardList } from 'src/app/models/wallet';
import { toObservable } from '@angular/core/rxjs-interop';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-rain-card-transactions-v35',
  templateUrl: './rain-card-transactions-v35.component.html',
  styleUrl: './rain-card-transactions-v35.component.scss',
  providers: [V3DataTableService, CurrencyPipe],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class RainCardTransactionsV35Component implements OnInit, OnDestroy {
  /* Injectors */
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private walletDataService = inject(WalletDataV35Service);

  /** DATA TABLE VARIABLES */
  public tableId = DTTableId.rainCardTransaction; // You'll need to add this to your DTTableId enum
  subscription: Subscription[] = [];
  reloadTable = false;

  frameworkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    v3StatusComponent: V3StatusComponent,
    v3UpdatedAtComponent: V3UpdatedAtComponent,
    V3DTCommonFilterComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Success' },
          { value: '3', name: 'Failed' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'txn_date',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  selectedCardData?: ICardList;
  selectedCardData$: Observable<ICardList | undefined> = toObservable(
    this.walletDataService.selectedCardSignal
  );

  ngOnInit(): void {
    this.initializeV3DataTable();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
  }

  initializeV3DataTable() {
    this.subscription.push(
      this.selectedCardData$
        .pipe(switchMap((data) => of(data).pipe(take(1))))
        .subscribe((res) => {
          if (res?.id === this.selectedCardData?.id && !this.reloadTable)
            return;
          this.selectedCardData = res;
          if (!this.selectedCardData?.id && !this.reloadTable) {
            return;
          }
          this.selectedCardData = res;
          this.v3DataTableService.defaultPayload = {
            startRow: 0,
            endRow: 50,
            rowGroupCols: [],
            valueCols: [],
            pivotCols: [],
            pivotMode: false,
            groupKeys: [],
            filterModel: {},
            sortModel: [],
            card_id: this.selectedCardData?.id
          };
          this.v3DataTableService.refreshV3DataTable();
        })
    );
  }

  /** Table columns */
  colDefAmount = {
    headerName: 'Amount',
    minWidth: 120,
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefDescription = {
    headerName: 'Description',
    minWidth: 200,
    field: 'description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefTransactionDate = {
    headerName: 'Transaction Date',
    minWidth: 150,
    field: 'txn_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.txn_date
  };

  colDefLast4 = {
    headerName: 'Last 4 Digits',
    minWidth: 120,
    field: 'last4',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefMerchantName = {
    headerName: 'Merchant',
    minWidth: 150,
    field: 'merchant_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 115,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3StatusComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: {
      isStatementDisable: true,
      isApplyTitleCase: true
    },
    valueGetter: (params: { data: { status: string } }): string => {
      const value = params?.data?.status;
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
    }
  };

  /** Set column fields */
  columnDefs = [
    this.colDefAmount,
    this.colDefDescription,
    this.colDefTransactionDate,
    this.colDefLast4,
    this.colDefMerchantName,
    this.colDefStatus
  ];

  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
