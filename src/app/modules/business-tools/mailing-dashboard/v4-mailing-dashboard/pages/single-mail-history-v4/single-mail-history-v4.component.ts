import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import {
  IDtColumnFields,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4EditFieldComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-edit-field/v4-edit-field.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V4DescriptionComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-description/v4-description.component';
import { V4CheckStatusComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-check-list/cell-renderers/v4-check-status/v4-check-status.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import {
  ICheckListTableRowData,
  ICheckStatus
} from 'src/app/modules/check/model/check';

@Component({
  selector: 'app-single-mail-history-v4',
  templateUrl: './single-mail-history-v4.component.html',
  styleUrls: ['./single-mail-history-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, V4DataTableComponent, V4PageHeaderComponent]
})
export class SingleMailHistoryV4Component implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);
  private detailPanelService = inject(V4DetailPanelService);
  private router = inject(Router);

  tableId = DTTableId.singleCheckMailHistory;
  backUrl = '/v4/manage/business-tools/mail-dashboard/single-mail';

  frameworkComponents = {
    searchBoxComponent: V4TextFloatingFilterComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4PayeeNameComponent: V4PayeeNameComponent,
    v4PayeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    v4DTCommonFilterComponent: V4DTCommonFilterComponent,
    v4EditFieldComponent: V4EditFieldComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    v4DescriptionComponent: V4DescriptionComponent,
    v4CheckStatusComponent: V4CheckStatusComponent,
    actionComponent: V4DtActionComponent
  };

  cellRendererCheckStatus: Record<string, ICheckStatus> = {};
  actionComponentProp = {
    actionButton: false,
    eyeButton: true,
    cardButton: false
  };

  configs = {
    selectBox: [
      {
        id: 'cheques.cheque_status',
        values: [] as { value: number; name: string }[]
      }
    ],
    selectDate: [
      {
        id: 'cheque_issue_date',
        initialRange: 'All Time',
        isPrimary: true
      },
      {
        id: 'cheques.created_at',
        initialRange: 'All Time'
      }
    ]
  };

  ngOnInit(): void {
    this.getCheckStatus();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined,
      this.actionComponentProp
    );
    this.initializeV3DataTable();
  }

  initializeV3DataTable(): void {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  getCheckStatus(): void {
    if (this.localStorageService.getItem('check_status')) {
      const status = this.localStorageService.getItem('check_status');
      this.cellRendererCheckStatus = status;
      this.buildStatusDropdownValues(status);
      return;
    }

    this.checkService
      .getCheckStatus()
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatus = res.data;
          this.buildStatusDropdownValues(res.data);
        }
      });
  }

  private buildStatusDropdownValues(
    statusMap: Record<string, ICheckStatus>
  ): void {
    this.configs.selectBox[0].values = Object.entries(statusMap)
      .filter(([, val]) => !!val.statusShortDescription)
      .map(([key, val]) => ({
        value: Number(key),
        name: val.statusShortDescription
      }));
  }

  onCellActionView(event: ISelectedSingleRow): void {
    const selectedItem = event.selectedRow;

    if (selectedItem) {
      this.dataTableService.destroyPayload = false;
      this.detailPanelService.openCheck(
        selectedItem as ICheckListTableRowData,
        { hidePaymentProof: true }
      );
    }
  }

  onBack(): void {
    this.router.navigate([this.backUrl]);
  }

  colDefPayee: ICoulmnDefFields = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v4PayeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4PayeeNameComponent',
    cellRendererParams: {
      payeeField: 'payee_id'
    }
  };

  colDefBank = {
    minWidth: 120,
    headerName: 'Bank',
    field: 'bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => {
      if (params.value === null) return params?.data?.bank_account_account_name;
      return params?.value;
    }
  };

  colDefAmount = {
    minWidth: 150,
    maxWidth: 200,
    headerName: 'Amount',
    tooltipField: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'v4EditFieldComponent'
  };

  colDefCheckNo = {
    minWidth: 70,
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => params?.value
  };

  colDefDate = {
    minWidth: 110,
    headerName: 'Issue Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    }
  };

  colDefCreatedAt = {
    minWidth: 130,
    headerName: 'Created On',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefMemo = {
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4DescriptionComponent'
  };

  colDefInvoiceNo = {
    minWidth: 90,
    headerName: 'Invoice No',
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    field: 'cheques.cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'v4CheckStatusComponent',
    cellRendererParams: () => ({
      checkStatusMap: this.cellRendererCheckStatus,
      showFilter: true
    }),
    cellRendererForExport: (params: { data: { cheque_status: number } }) => {
      const value = params?.data?.cheque_status;
      return this.cellRendererCheckStatus[value]?.statusShortDescription;
    }
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 90,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true
  };

  defaultColumnFields: IDtColumnFields[] = [
    {
      id: 'action',
      name: 'Action',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    },
    {
      id: 'payee_name',
      name: 'Payee',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'bank_accounts.bank_account_account_name',
      name: 'Bank',
      isDisabled: true,
      colDef: this.colDefBank,
      isChecked: true
    },
    {
      id: 'cheque_amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'cheque_serial_number',
      name: 'Check #',
      isDisabled: false,
      colDef: this.colDefCheckNo,
      isChecked: true
    },
    {
      id: 'cheque_issue_date',
      name: 'Issue Date',
      isDisabled: true,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'cheques.created_at',
      name: 'Created On',
      isDisabled: true,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'cheque_memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'cheque_invoice_number',
      name: 'Invoice No',
      isDisabled: true,
      colDef: this.colDefInvoiceNo,
      isChecked: true
    },
    {
      id: 'cheques.cheque_status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefAction,
    this.colDefPayee,
    this.colDefBank,
    this.colDefAmount,
    this.colDefCheckNo,
    this.colDefDate,
    this.colDefCreatedAt,
    this.colDefMemo,
    this.colDefInvoiceNo,
    this.colDefStatus
  ];

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
