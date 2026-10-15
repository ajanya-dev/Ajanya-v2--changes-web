import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import {
  ICoulmnDefFields,
  ISelectBoxFilterArray
} from 'src/app/models/v3-datatable';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V4StatusComponent as V4PaymentsStatusComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-status/v4-status.component';
import { ICellRendererParams } from '@ag-grid-community/core';

@Component({
  selector: 'app-transaction-history-modal-v4',
  standalone: true,
  imports: [
    V4DataTableComponent,
    LucideAngularModule,
    MatDialogClose
  ],
  providers: [V3DataTableService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-history-modal-v4.component.html'
})
export class TransactionHistoryModalV4Component implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private payeeDataService = inject(PayeeDataV35Service);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);

  readonly xIcon = X;
  tableId = DTTableId.payeeTransactions;
  cellRendererCheckStatus?: Record<string, ICheckStatus>;
  subscriptions: Subscription[] = [];
  payeeId: string;

  colDefSource: ICoulmnDefFields = {
    headerName: 'Source',
    field: 'source_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefAmount: ICoulmnDefFields = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 100,
    maxWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5'
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
    minWidth: 150,
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
    minWidth: 150,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payee_transaction'
    },
    cellRenderer: 'v4StatusComponent',
    cellClass: 'flex items-center',
    cellRendererParams: (
      params: ICellRendererParams<ICommonTransactionTableData>
    ) => {
      const chequeStatus = params.data?.cheque_status;
      let checkStatus;
      let checkColor;
      if (chequeStatus !== undefined && chequeStatus !== null) {
        checkStatus =
          this.cellRendererCheckStatus?.[chequeStatus]?.statusShortDescription;
        checkColor = this.cellRendererCheckStatus?.[chequeStatus]?.color;
      }
      if (checkStatus === 'New') {
        checkStatus = 'Pending';
      }
      return {
        tableType: 'payments-table',
        checkStatus: { value: checkStatus, color: checkColor }
      };
    }
  };

  colDefDescription: ICoulmnDefFields = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 200,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCreatedTime: ICoulmnDefFields = {
    headerName: 'Updated At',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    valueGetter: (params: { data: ICommonTransactionTableData }) =>
      params.data.updated_at
  };

  columnDefs = [
    this.colDefSource,
    this.colDefAmount,
    this.colDefTransferMode,
    this.colDefStatus,
    this.colDefDescription,
    this.colDefCreatedTime,
    this.colDefReferenceId
  ];

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4StatusComponent: V4PaymentsStatusComponent,
    v3ModeOfTransferComponent: V3ModeOfTransferComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'PENDING' },
          { value: '1', name: 'PROCESSING' },
          { value: '2', name: 'COMPLETED' },
          { value: '3', name: 'CANCELED' },
          { value: '4', name: 'FAILED' },
          { value: '6', name: 'APPROVAL REQUIRED' },
          { value: '7', name: 'APPROVED' },
          { value: '8', name: 'REJECTED' }
        ]
      },
      {
        id: 'transfer_mode',
        values: [
          { value: '0', name: 'Check' },
          { value: '1', name: 'ACH' },
          { value: '2', name: 'Print' },
          { value: '3', name: 'Mail Check' },
          { value: '4', name: 'Email Check' },
          { value: '5', name: 'International Payment' },
          { value: '6', name: 'Wire' },
          { value: '7', name: 'Virtual Card' },
          { value: '8', name: 'Mail' }
        ]
      },
      {
        id: 'cheques.cheque_status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Printed' },
          { value: '2', name: 'Void' },
          { value: '4', name: 'Printing' },
          { value: '7', name: 'Mailed' },
          { value: '50', name: 'Scheduled' },
          { value: 'emailed', name: 'Emailed' },
          { value: 'eprinted', name: 'E-Printed' },
          { value: 'dd', name: 'DD' },
          { value: 'dd-funding', name: 'DD-FUNDING' },
          { value: 'dd-failed', name: 'DD-FAILED' },
          { value: 'ddw', name: 'DDW' },
          { value: 'dd-depositing', name: 'DD-DEPOSITING' },
          { value: 'dd-depositing-failed', name: 'DD-DEPOSIT-F' },
          { value: 'ddc', name: 'DDC' },
          { value: 'show_posted', name: 'Posted' },
          { value: 'show_un_posted', name: 'Un-Posted' },
          { value: 'unmapped-checks', name: 'Unmapped-Checks' },
          { value: 'export', name: 'Exported' },
          { value: 'not-exported', name: 'Not Exported' }
        ]
      }
    ]
  };

  constructor() {
    this.getSelectedPayee();
  }

  ngOnInit() {
    this.getCheckStatus();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
  }

  initializeV3DataTable(customFilterModel: ISelectBoxFilterArray) {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: customFilterModel,
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  getSelectedPayee() {
    effect(() => {
      const payeeDetails = this.payeeDataService.payeeDataSignal();
      this.payeeId = payeeDetails?.encryptedId || '';
      const customFilterModel = {
        payee_id: {
          filter: this.payeeId,
          filterType: 'text',
          type: 'equals'
        }
      };
      this.initializeV3DataTable(customFilterModel);
    });
  }

  getCheckStatus(): void {
    const checkStatus = this.localStorageService.getItem('check_status');
    if (checkStatus) {
      this.cellRendererCheckStatus = checkStatus;
      return;
    }
    this.subscriptions.push(
      this.checkService.getCheckStatus().subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatus = res.data;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
