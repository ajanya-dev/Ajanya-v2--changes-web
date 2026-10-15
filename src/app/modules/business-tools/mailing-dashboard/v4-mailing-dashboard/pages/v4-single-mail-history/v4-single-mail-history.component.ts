import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ICheckListTableRowData, ICheckStatus } from 'src/app/modules/check/model/check';
import { ISelectedSingleRow } from 'src/app/modules/data-table/model/datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4CheckStatusComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-check-list/cell-renderers/v4-check-status/v4-check-status.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { LucideAngularModule } from 'lucide-angular';
// import { SingleMailDraftService } from '../v4-single-mail/single-mail-draft.service';

@Component({
  selector: 'app-v4-single-mail-history',
  templateUrl: './v4-single-mail-history.component.html',
  styleUrls: ['./v4-single-mail-history.component.scss'],
  standalone: true,
  imports: [CommonModule, V4DataTableComponent, LucideAngularModule]
})
export class V4SingleMailHistoryComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);
  private detailPanelService = inject(V4DetailPanelService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  // private draftService = inject(SingleMailDraftService);

  tableId = DTTableId.singleCheckMailHistory;
  deselectedColumns: string[] = [];

  cellRendererCheckStatus: Record<string, ICheckStatus> = {};

  actionComponentProp = {
    actionButton: false,
    eyeButton: true,
    cardButton: false
  };

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    payeeListDropDownFilterComponent: V4PayeeMultiSelectFloatingFilterComponent,
    v4CheckStatusComponent: V4CheckStatusComponent,
    V3DTCommonFilterComponent: V4DTCommonFilterComponent,
    actionComponent: V4DtActionComponent
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
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setCellRendererAction([]);
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined,
      this.actionComponentProp
    );
    this.getCheckStatus();
    this.dataTableService.destroyPayload = true;
  }

  private getCheckStatus(): void {
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
    const values = Object.entries(statusMap).map(([key, val]) => ({
      value: Number(key),
      name: val.statusShortDescription
    }));
    this.configs.selectBox[0].values = values;
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

  get backLabel(): string {
    return this.route.snapshot.queryParamMap.get('from') === 'single-mail'
      ? 'Back'
      : 'Back to Dashboard';
  }

  goBack(): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'single-mail') {
      this.router.navigate(['/v4/manage/business-tools/mail-dashboard/single-mail']);
      return;
    }
    this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
  }

  // ==================== COLUMN DEFINITIONS ====================

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'payeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'payee' }
  };

  colDefBank = {
    headerName: 'Bank',
    field: 'bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    minWidth: 120,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'bank' },
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => {
      if (params.value === null) return params?.data?.bank_account_account_name;
      return params?.value;
    }
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    minWidth: 100,
    maxWidth: 150,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { prefixOptionalField: 'cheque_amount_formated' }
  };

  colDefCheckNo = {
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    minWidth: 70,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefDate = {
    headerName: 'Issue Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    minWidth: 110,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' }
  };

  colDefCreatedAt = {
    headerName: 'Created On',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    minWidth: 130,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date',
      prefixOptionalField: 'created_at',
      isFormatDateWithHyphen: true
    }
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefInvoiceNo = {
    headerName: 'Invoice No',
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    minWidth: 90,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'cheques.cheque_status',
    floatingFilter: false,
    minWidth: 90,
    maxWidth: 170,
    suppressHeaderMenuButton: true,
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
    minWidth: 80,
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
