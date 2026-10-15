import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { Subscription } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IFilterModel } from 'src/app/models/v3-datatable';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { TransactionTypeComponent } from 'src/app/modules/wallet/wallet-v2/components/dt-components/transaction-type';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  standalone: true,
  imports: [
    V3DataTableModule,
    DataRangeV35Component,
    V3DataTableSelectBoxComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule
  ],
  selector: 'app-sent-recv-common-card-table-v35',
  templateUrl: './sent-recv-common-card-table-v35.component.html',
  styleUrls: ['./sent-recv-common-card-table-v35.component.css']
})
export class SentRecvCommonCardTableV35Component implements OnInit, OnDestroy {
  @Input() tableId!: number;

  private cardDataSerice = inject(CardsDataServiceService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.getCardChangeEvents();
    this.dataTableService.setDataFromParent(
      this.columnFilterFields,
      this.floatingFilterConfigurations
    );
  }

  frameWorkComponents = {
    searchBoxComponent: DtSearchBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    dateFilterComponent: DataRangeV35Component,
    v3UpdatedAtComponent: V3UpdatedAtComponent,
    v3StatusComponent: V3StatusComponent,
    TransactionTypesComponent: TransactionTypeComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'pending', name: 'PENDING' },
          { value: 'completed', name: 'COMPLETED' },
          { value: 'declined', name: 'DECLINED' }
        ]
      }
    ]
  };

  /**
   * Subscribing to account change events and changing the ag-grid filter to update the table.
   */

  getCardChangeEvents() {
    this.subscriptions.push(
      this.cardDataSerice.getSelectedCard().subscribe((res) => {
        let cardId = '';
        if (this.tableId === DTTableId.receivedVirtualCardTransactions) {
          cardId = res.receiveCard?.id as string;
        } else if (this.tableId === DTTableId.sendVirtualCardTransactions) {
          cardId = res.sentCard?.id as string;
        }
        if (cardId) {
          this.v3DataTableService.defaultPayload = {
            startRow: 0,
            endRow: 50,
            rowGroupCols: [],
            valueCols: [],
            pivotCols: [],
            pivotMode: false,
            groupKeys: [],
            sortModel: [],
            filterModel: {} as IFilterModel,
            card_id: cardId
          };
          this.v3DataTableService.refreshV3DataTable();
        }
      })
    );
  }

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    maxWidth: 200,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableId: 'cardSendRecv'
    },
    cellRenderer: 'TransactionTypesComponent',
    cellClass: 'flex flex-col justify-center items-end pr-3'
  };

  colDefDescription = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    cellRenderer: 'v3StatusComponent',
    cellClass: 'flex flex-start',
    cellRendererParams: {
      isStatementDisable: true,
    },
  };

  colDefTxnDate = {
    headerName: 'Transaction Date',
    field: 'txn_date',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'dateFilterComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent'
  };

  colDefUpdatedAt = {
    headerName: 'Updated At',
    field: 'updated_at',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'dateFilterComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent'
  };

  columnFilterFields = [
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
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
      id: 'status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'txnDate',
      name: 'Transaction Date',
      isDisabled: false,
      colDef: this.colDefTxnDate,
      isChecked: true
    },
    {
      id: 'updatedAt',
      name: 'Updated At',
      isDisabled: false,
      colDef: this.colDefUpdatedAt,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefAmount,
    this.colDefDescription,
    this.colDefStatus,
    this.colDefTxnDate,
    this.colDefUpdatedAt
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
