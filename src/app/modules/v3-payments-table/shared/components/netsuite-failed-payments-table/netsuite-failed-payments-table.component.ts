import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CellClickedEvent } from '@ag-grid-community/core';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { CustomCheckExportErrorAlertComponent } from 'src/app/modules/check/components/custom-check-export-error-alert/custom-check-export-error-alert.component';

const EXPORT_TYPE = {
  check: 1,
  zilPayment: 2
} as const;

const ICON = {
  view: 'assets/images/icons/eye.svg',
  edit: 'assets/images/icons/pen-to-square.svg',
  export: 'assets/images/icons/file-export.svg'
} as const;

function actionIcon(
  action: string,
  title: string,
  iconUrl: string,
  size = 16
): string {
  return (
    `<span data-action="${action}" title="${title}" ` +
    `style="display:inline-block;width:${size}px;height:${size}px;margin:0 6px;` +
    `cursor:pointer;background-color:var(--eye-button-color);` +
    `-webkit-mask:url('${iconUrl}') center/contain no-repeat;` +
    `mask:url('${iconUrl}') center/contain no-repeat"></span>`
  );
}

export interface INetsuiteFailedPaymentRow {
  id: string;
  cheque_id: string;
  uu_id: string;
  payee_id: string;
  source_id: string;
  transfer_id: string;
  export_type: number;
  payee_name: string;
  amount: string;
  reference_no: string;
  description: string;
  source_name: string;
  transfer_mode: string;
  transfer_type: string;
  transfer_type_code: string;
  status: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-netsuite-failed-payments-table',
  templateUrl: './netsuite-failed-payments-table.component.html',
  standalone: true,
  imports: [CommonModule, V3DataTableComponent],
  providers: [CurrencyPipe]
})
export class NetsuiteFailedPaymentsTableComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private alertService = inject(AlertService);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  tableId = DTTableId.netsuiteExportFailedPayments;
  extendPagination = false;
  isExportLoading = signal(false);

  /**
   * The NetSuite export button, rendered in the table's own header row — the
   * same slot and green styling as the recurring tab's Resume button.
   */
  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'NetSuite',
        id: 'id_netsuite_export',
        isAddIcon: true,
        icon: ['fas', 'arrow-up-to-line'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Export payments to NetSuite',
        loading: this.isExportLoading(),
        disabled: this.isExportLoading()
      }
    ]
  }));

  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    v3PayeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent
  };

  private selectedRows = signal<INetsuiteFailedPaymentRow[]>([]);

  floatingFilterComponent = {
    selectBox: []
  };

  colDefId: ICoulmnDefFields = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  colDefView: ICoulmnDefFields = {
    headerName: 'View',
    field: 'view',
    minWidth: 90,
    maxWidth: 110,
    lockPosition: true,
    sortable: false,
    filter: false,
    floatingFilter: false,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: () =>
      actionIcon('view', 'View', ICON.view, 16) +
      actionIcon('edit', 'Edit', ICON.edit, 15),
    onCellClicked: (event: CellClickedEvent) => {
      const row = event.data as INetsuiteFailedPaymentRow;
      switch (this.clickedAction(event)) {
        case 'view':
          this.onViewPayment(row);
          break;
        case 'edit':
          this.onEditPayment(row);
          break;
        default:
          break;
      }
    }
  };

  colDefPayeeName: ICoulmnDefFields = {
    headerName: 'Payee Name',
    field: 'payee_name',
    minWidth: 180,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefAmount: ICoulmnDefFields = {
    headerName: 'Amount',
    field: 'amount',
    minWidth: 110,
    maxWidth: 140,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefReferenceNo: ICoulmnDefFields = {
    headerName: 'Reference No',
    field: 'reference_no',
    minWidth: 130,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefSourceName: ICoulmnDefFields = {
    headerName: 'Source',
    field: 'source_name',
    minWidth: 160,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefTransferType: ICoulmnDefFields = {
    headerName: 'Payment Type',
    field: 'transfer_type',
    minWidth: 130,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center capitalize'
  };

  colDefDescription: ICoulmnDefFields = {
    headerName: 'Description',
    field: 'description',
    minWidth: 200,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCreatedAt: ICoulmnDefFields = {
    headerName: 'Created Date',
    field: 'created_at',
    minWidth: 140,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefAction: ICoulmnDefFields = {
    headerName: 'Action',
    field: 'action',
    minWidth: 90,
    maxWidth: 110,
    pinned: 'right',
    sortable: false,
    filter: false,
    floatingFilter: false,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center justify-center cursor-pointer',
    cellRenderer: () =>
      actionIcon(
        'export',
        'Re-export this payment to NetSuite',
        ICON.export,
        15
      ),
    onCellClicked: (event: CellClickedEvent) =>
      this.onReExport(event.data as INetsuiteFailedPaymentRow)
  };

  defaultColumnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'view',
      name: 'View',
      isDisabled: true,
      colDef: this.colDefView,
      isChecked: true
    },
    {
      id: 'payee_name',
      name: 'Payee Name',
      isDisabled: true,
      colDef: this.colDefPayeeName,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'reference_no',
      name: 'Reference No',
      isDisabled: false,
      colDef: this.colDefReferenceNo,
      isChecked: true
    },
    {
      id: 'source_name',
      name: 'Source',
      isDisabled: false,
      colDef: this.colDefSourceName,
      isChecked: true
    },
    {
      id: 'transfer_type',
      name: 'Payment Type',
      isDisabled: false,
      colDef: this.colDefTransferType,
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
      id: 'created_at',
      name: 'Created Date',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
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

  fieldsShownByDefault = [
    'id',
    'view',
    'payee_name',
    'amount',
    'reference_no',
    'source_name',
    'transfer_type',
    'description',
    'created_at',
    'action'
  ];

  columnDefs: ICoulmnDefFields[] = [
    this.colDefId,
    this.colDefView,
    this.colDefPayeeName,
    this.colDefAmount,
    this.colDefReferenceNo,
    this.colDefSourceName,
    this.colDefTransferType,
    this.colDefDescription,
    this.colDefCreatedAt,
    this.colDefAction
  ];

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
    this.checkForPaginationExtend();
    this.trackRowSelection();
    this.v3DataTableService.refreshV3DataTable();
  }

  private trackRowSelection(): void {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nodes) => {
        this.selectedRows.set(
          (nodes ?? [])
            .map((node) => node?.data as INetsuiteFailedPaymentRow)
            .filter(Boolean)
        );
      });
  }

  private checkForPaginationExtend(): void {
    this.dataTableService.paginationChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isPaginationExtended) => {
        this.extendPagination = isPaginationExtended;
      });
  }

  /**
   * Routes the table header button clicks.
   * @param event - The clicked button's id, plus the table's selection.
   */
  headerButtonClick(event: { id: string }): void {
    if (event.id === 'id_netsuite_export') {
      this.onExportToNetsuite();
    }
  }

  onExportToNetsuite(): void {
    const rows = this.selectedRows();

    if (!rows.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select at least one payment to proceed'
      });
      return;
    }

    this.exportToNetsuite(rows);
  }

  private clickedAction(event: CellClickedEvent): string | null {
    const target = event.event?.target as HTMLElement | null;
    return (
      target?.closest('[data-action]')?.getAttribute('data-action') ?? null
    );
  }

  private onViewPayment(row: INetsuiteFailedPaymentRow): void {
    if (!row) return;

    if (row.export_type === EXPORT_TYPE.check && row.cheque_id) {
      this.router.navigate(['/manage/cheque/view', row.cheque_id], {
        state: { backUrl: this.router.url }
      });
      return;
    }

    if (row.uu_id) {
      this.router.navigate(['/manage/payments-table/payment-view', row.uu_id], {
        state: { backUrl: this.router.url }
      });
    }
  }

  private onEditPayment(row: INetsuiteFailedPaymentRow): void {
    if (!row?.uu_id) return;

    this.router.navigate([`/manage/payments/main/edit/${row.uu_id}`], {
      state: { backUrl: this.router.url }
    });
  }

  private onReExport(row: INetsuiteFailedPaymentRow): void {
    if (!row || this.isExportLoading()) return;

    this.exportToNetsuite([row]);
  }

  private exportToNetsuite(rows: INetsuiteFailedPaymentRow[]): void {
    const checkIds = rows
      .filter((row) => row.export_type === EXPORT_TYPE.check)
      .map((row) => row.cheque_id)
      .filter(Boolean);

    const zilPaymentIds = rows
      .filter((row) => row.export_type === EXPORT_TYPE.zilPayment)
      .map((row) => row.cheque_id)
      .filter(Boolean);

    const totalSubmitted = checkIds.length + zilPaymentIds.length;

    if (!checkIds.length && !zilPaymentIds.length) {
      this.alertService.failedAlert({
        content: 'The selected payments cannot be exported to NetSuite.'
      });
      return;
    }

    this.isExportLoading.set(true);
    this.netsuiteIntegrationService
      .exportChecksToNetSuite(checkIds, zilPaymentIds)
      .pipe(
        finalize(() => this.isExportLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({
              title: 'Success!',
              content:
                'Payments Exported Successfully. They will appear on your NetSuite account after one minute of importing.',
              close: false
            });

            this.refreshAfterExport();
          }
        },
        error: (err) => {
          if (err.error?.permissionRequired) {
            this.alertService.warningAlert({
              content: "You don't have permission to do this action."
            });
            return;
          }

          if (err.error?.errorCode === 500 && err.error?.errorMsg) {
            const failedCount = Object.keys(err.error.errorMsg).length;
            if (failedCount < totalSubmitted) {
              this.refreshAfterExport();
            }
            this.openCustomCheckExportErrorAlert(
              Object.entries(err.error.errorMsg).map(([key, value]) => ({
                [key]: value
              }))
            );
            return;
          }

          this.alertService.failedAlert({
            content: err.error?.message || 'Failed to export to NetSuite'
          });
        }
      });
  }

  /**
   * Clear the selection and reload the grid after an export that changed the
   * failed list — used for both full and partial success so exported rows
   * drop out even when other rows in the batch failed.
   */
  private refreshAfterExport(): void {
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  private openCustomCheckExportErrorAlert(
    errorCheckList: { [key: string]: unknown }[]
  ) {
    return this.dialog.open(CustomCheckExportErrorAlertComponent, {
      maxWidth: '500px',
      minWidth: '500px',
      width: '95%',
      disableClose: true,
      data: errorCheckList,
      panelClass: 'ocw_alert_wrapper'
    });
  }
}
