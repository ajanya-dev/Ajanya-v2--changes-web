import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import {
  ICheckListTableRowData,
  ICheckStatus
} from 'src/app/modules/check/model/check';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { DtEditFieldComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-edit-field/dt-edit-field.component';
import { V3DTCheckNumberComponent } from 'src/app/modules/check/pages/check-list/dt-check-no.component';
import { DtCellFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-cell-filter/dt-cell-filter.component';
import { V3DescriptionComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-description/v3-description.component';
import { take } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CheckAddAttachmentCommentComponent } from 'src/app/modules/check/pages/check-list/addAttachmentComment';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import { ISelectedSingleRow } from 'src/app/modules/data-table/model/datatable';
import { Router } from '@angular/router';

@Component({
  selector: 'app-single-mail-history',
  templateUrl: './single-mail-history.component.html',
  styleUrls: ['./single-mail-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    V3DataTableComponent,
    V3DataTableModule,
    DataTableModule
  ]
})
export class SingleMailHistoryComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);
  private router = inject(Router);

  tableId = DTTableId.singleCheckMailHistory;
  tableTitle = 'Single Mail History';
  deselectedColumns: string[] = []; // Ensure no columns are deselected
  backUrl: string = '/manage/business-tools/mail-dashboard/index';

  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    v3PayeeNameComponent: V3PayeeNameComponent,
    v3PayeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    V3DTCommonFilterComponent,
    dtEditFieldComponent: DtEditFieldComponent,
    V3DTCheckNumberComponent,
    dtCellFilterComponent: DtCellFilterComponent,
    v3DescriptionComponent: V3DescriptionComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent,
    actionComponent: DtActionComponent
  };

  cellRendererCheckStatus: Record<string, ICheckStatus> = {};
  actionComponentProp = {
    actionButton: false,
    eyeButton: true,
    cardButton: false
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      undefined,
      undefined,
      this.actionComponentProp
    );
    this.initializeV3DataTable();
    this.getCheckStatus();
  }

  initializeV3DataTable() {
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
    // Trigger data table refresh after setting the payload
    this.v3DataTableService.refreshV3DataTable();
  }

  getCheckStatus(): void {
    if (this.localStorageService.getItem('check_status')) {
      // get status from local storage
      const status = this.localStorageService.getItem('check_status');
      this.cellRendererCheckStatus = status;
      return;
    }

    this.checkService
      .getCheckStatus()
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatus = res.data;
        }
      });
  }

  onCellActionView(event: ISelectedSingleRow): void {
    const selectedItem = event.selectedRow;

    if (event.selectedRow?.action && selectedItem) {
      this.dataTableService.destroyPayload = false;
      this.router.navigate(['/manage/cheque/view/', selectedItem.action], {
        state: { backUrl: this.router.url }
      });
    }
  }

  colDefPayee: ICoulmnDefFields = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3PayeeNameComponent',
    cellRendererParams: {
      payeeField: 'payee_id'
    }
  };

  colDefBank = {
    minWidth: 120,
    headerName: 'Bank',
    field: 'bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => {
      // Only For when Export Table data
      if (params.value === null) return params?.data?.bank_account_account_name;
      return params?.value;
    }
  };

  colDefAmount = {
    minWidth: 100,
    maxWidth: 150,
    headerName: 'Amount',
    tooltipField: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'dtEditFieldComponent'
  };

  colDefCheckNo = {
    minWidth: 70,
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCheckNumberComponent',
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
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    }
  };

  colDefCreatedAt = {
    minWidth: 130,
    headerName: 'Created On',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'dtCellFilterComponent',
    cellRendererParams: { type: 'date' }
  };

  colDefMemo = {
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'v3DescriptionComponent'
  };

  colDefInvoiceNo = {
    minWidth: 90,
    headerName: 'Invoice No',
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 90,
    maxWidth: 170,
    field: 'cheques.cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'V3DataTableSelectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'addAttachmentComment',
    cellRendererParams: { showFilter: true },
    cellRendererForExport: (params: { data: { cheque_status: number } }) => {
      // Only For when Export Table data
      const value = params?.data?.cheque_status;
      return this.cellRendererCheckStatus[value]?.statusShortDescription;
    }
  };

  colDefAction = {
    minWidth: 80,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    floatingFilterComponentParams: {
      tableName: 'single_mail_history_table'
    }
  };

  defaultColumnFields = [
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
    },
    {
      id: 'action',
      name: 'Action',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefPayee,
    this.colDefBank,
    this.colDefAmount,
    this.colDefCheckNo,
    this.colDefDate,
    this.colDefCreatedAt,
    this.colDefMemo,
    this.colDefInvoiceNo,
    this.colDefStatus,
    this.colDefAction
  ];

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
