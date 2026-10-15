import {
  OnDestroy,
  inject,
  OnInit,
  Component,
  Input,
  input
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ICoulmnDefFields, IFilterModel } from 'src/app/models/v3-datatable';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { Subscription, distinctUntilChanged, map } from 'rxjs';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { ActivatedRoute } from '@angular/router';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { environment } from 'src/environments/environment';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { ICellRendererParams } from '@ag-grid-community/core';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { V3DataTableSelectBoxComponent } from '../../../../shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3ModeOfTransferComponent } from '../../../../shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3PayeeNameComponent } from '../../../../shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3StatusComponent } from '../../../../shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from '../../../../shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from '../../../../shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { V3DataTableService } from '../../../v3-data-table/services/v3-data-table.service';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';


@Component({
  selector: 'app-v3-common-transaction-table',
  templateUrl: './v3-common-transaction-table.component.html',
  styleUrls: ['./v3-common-transaction-table.component.scss'],
  providers: [V3DataTableService],
  standalone: true,
  imports: [V3DataTableComponent, V4DataTableComponent, NgClass]
})
export class V3CommonTransactionTableComponent implements OnInit, OnDestroy {
  /* Injectors */
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private bankDataService = inject(BankDataV35Service);
  private cardsDataService = inject(CardsDataServiceService);
  private activatedRoute = inject(ActivatedRoute);
  private detailPanelService = inject(V4DetailPanelService);

  /* Variables */
  @Input() public commonTransactionTableType: string | undefined = undefined;
  subscriptions: Subscription[] = [];
  sourceId: string;
  filterModel: IFilterModel;
  versionType = input<string>('v3');
  selectedBankAccount$ = toObservable(
    this.bankDataService.selectedBankAccountSignal
  );

  /* AG Grid Table Number */
  tableId: TTableIdValues = DTTableId.bankAccountTransactions;
  env = environment;

  get frameworkComponents() {
    return {
      headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
      selectBoxComponent:
        this.versionType() === 'v3'
          ? V3DataTableSelectBoxComponent
          : V4DropdownFloatingFilterComponent,
      actionComponent: DtActionComponent,
      searchBoxComponent:
        this.versionType() === 'v3'
          ? DtSearchBoxComponent
          : V4TextFloatingFilterComponent,
      dateRangeV35Component:
        this.versionType() === 'v3'
          ? DataRangeV35Component
          : V4DateFloatingFilterComponent,
      v3StatusComponent: V3StatusComponent,
      v3PayeeNameComponent: V3PayeeNameComponent,
      v3ModeOfTransferComponent: V3ModeOfTransferComponent,
      v3UpdatedAtComponent: V3UpdatedAtComponent,
      v3ViewButtonComponent:
        this.versionType() === 'v3'
          ? V3ViewButtonComponent
          : V4ViewButtonComponent,
      v3PayeeListDropDownFilterComponent:
        this.versionType() === 'v3'
          ? DtMultiDropdownPayeeComponent
          : V4PayeeMultiSelectFloatingFilterComponent,
      V3DTCommonFilterComponent
    };
  }

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'PENDING' },
          { value: '1', name: 'PROCESSING' },
          { value: '2', name: 'COMPLETED' },
          { value: '3', name: 'CANCELED' },
          { value: '4', name: 'FAILED' }
        ]
      },
      {
        id: 'transfer_mode',
        values: [
          { value: '1', name: 'ACH' },
          { value: '2', name: 'Print' },
          { value: '3', name: 'Mail Check' },
          { value: '4', name: 'Email Check' },
          { value: '5', name: 'International Payment' },
          { value: '6', name: 'Wire' },
          { value: '7', name: 'Virtual Card' },
          { value: '8', name: 'Mail' },
          { value: '0', name: 'Check' }
        ]
      }
    ]
  };

  ngOnInit() {
    const isV4 = this.versionType() === 'v4';
    this.columnDefs = isV4
      ? [
          this.colDefViewButton,
          this.colDefPayee,
          this.colDefSource,
          this.colDefAmount,
          this.colDefTransferMode,
          this.colDefStatus,
          this.colDefDescription,
          this.colDefCreatedTime,
          this.colDefReferenceId
        ]
      : [
          this.colDefPayee,
          this.colDefSource,
          this.colDefAmount,
          this.colDefTransferMode,
          this.colDefStatus,
          this.colDefDescription,
          this.colDefCreatedTime,
          this.colDefReferenceId,
          this.colDefViewButton
        ];
    this.setData();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
  }

  /**
   * @description With this function we are setting the default payload that needs to be
   * called when accessing the common transaction table.
   */
  initializeV3DataTable() {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: this.filterModel,
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  setData() {
    if (this.commonTransactionTableType === 'BANK') {
      this.subscriptions.push(
        this.selectedBankAccount$.subscribe((res) => {
          if (this.activatedRoute.snapshot.queryParams.id && !res) return;

          this.filterModel = {
            source_type: {
              filter: this.commonTransactionTableType,
              filterType: 'text',
              type: 'equals'
            },
            source_id: {
              filter: res?.encrypted_bankacc_id ?? '',
              filterType: 'text',
              type: 'equals'
            }
          };
          this.initializeV3DataTable();
        })
      );
    } else if (this.commonTransactionTableType === 'CARD') {
      this.tableId = DTTableId.myCardsTransactions;
      this.subscriptions.push(
        this.cardsDataService
          .getSelectedCard()
          .pipe(
            map((res) => res.creditCard),
            distinctUntilChanged((val1, val2) => val1?.cardId === val2?.cardId)
          )
          .subscribe((res) => {
            this.filterModel = {
              source_type: {
                filter: this.commonTransactionTableType,
                filterType: 'text',
                type: 'equals'
              },
              source_id: {
                filter: res?.cardId ?? '',
                filterType: 'text',
                type: 'equals'
              }
            };
            this.initializeV3DataTable();
          })
      );
    }
  }

  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  /* Induvidual Column Definitions */

  colDefSource: ICoulmnDefFields = {
    headerName: 'Source',
    field: 'source_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefAmount: ICoulmnDefFields = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 100,
    maxWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-end pr-3',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
  };

  colDefPayee: ICoulmnDefFields = {
    headerName: this.env.env_id === 'compass' ? 'Vendor' : 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3PayeeNameComponent',
    cellClass: 'pl-2.5 cursor-pointer',
    headerClass: 'pl-3'
  };

  colDefTransferMode = {
    headerName: 'Mode of Transfer',
    field: 'transfer_mode',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    cellRenderer: 'v3ModeOfTransferComponent',
    valueGetter: (params: { data: ICommonTransactionTableData }) =>
      params.data.transfer_type
  };

  colDefReferenceId: ICoulmnDefFields = {
    headerName: 'Reference Id',
    field: 'reference_no',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefStatus: ICoulmnDefFields = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    cellRenderer: 'v3StatusComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefDescription: ICoulmnDefFields = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCreatedTime = {
    headerName: 'Updated At',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.updated_at
  };

  get colDefViewButton(): ICoulmnDefFields {
    const isV4 = this.versionType() === 'v4';
    return {
    headerName: 'View',
    field: 'view',
    sortable: false,
    cellRenderer: 'v3ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 0,
      ...(isV4 && {
        onViewClick: (row: ICommonTransactionTableData) => {
          this.detailPanelService.open(row);
        }
      })
    },
    suppressHeaderMenuButton: true
  };
  }

  /* Set Column Definitions */
  columnDefs: ICoulmnDefFields[] = [];
  
}
