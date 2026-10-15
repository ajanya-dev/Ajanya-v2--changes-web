import { ValueGetterParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4BankDropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-bank-dropdown-floating-filter/v4-bank-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-void-check-data-table-v4',
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent],
  templateUrl: './void-check-data-table-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoidCheckDataTableV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private reportsService = inject(ReportsService);
  private alertService = inject(V4AlertService);

  destroy$ = new Subject();
  loading = signal(false);

  public tableId = DTTableId.voidCheck;
  public columnDefs: ICoulmnDefFields[];
  public columnFields: IDtColumnFields[];

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    bankAccountComponent: V4BankDropdownFloatingFilterComponent,
    payeeListComponent: V4PayeeMultiSelectFloatingFilterComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    V4DTCommonFilterComponent
  };

  ngOnInit() {
    this.columnDefs = [
      this.colDefPayee,
      this.colDefBank,
      this.colDefAmount,
      this.colDefCheckNo,
      this.colDefDate,
      this.colDefVoidedBy,
      this.colDefVoidDate,
      this.colDefIp
    ];

    this.columnFields = [
      {
        id: 'payee',
        name: 'Payee',
        isDisabled: true,
        colDef: this.colDefPayee,
        isChecked: true
      },
      {
        id: 'bank_nick_name',
        name: 'Bank Nick Name',
        isDisabled: true,
        colDef: this.colDefBank,
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
        id: 'cheque_no',
        name: 'Check No',
        isDisabled: true,
        colDef: this.colDefCheckNo,
        isChecked: true
      },
      {
        id: 'created_time',
        name: 'Created At',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'voided_by',
        name: 'Voided By',
        isDisabled: false,
        colDef: this.colDefVoidedBy,
        isChecked: true
      },
      {
        id: 'void_created_at',
        name: 'Voided At',
        isDisabled: false,
        colDef: this.colDefVoidDate,
        isChecked: true
      },
      {
        id: 'ip_address',
        name: 'Ip Address',
        isDisabled: true,
        colDef: this.colDefIp,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(
      this.columnFields,
      undefined,
      undefined
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  exportData(fileFormat: string): void {
    const payload = { method: fileFormat };
    this.loading.set(true);
    this.reportsService
      .checkReport('void', payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          if (res?.url) {
            window.open(res?.url);
          } else {
            this.alertService.successAlert({ content: res.message });
          }
        }
      });
  }

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee',
    minWidth: 175,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'payeeListComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefBank = {
    headerName: 'Bank Nick Name',
    field: 'bank_account_nick_name',
    minWidth: 160,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'bankAccountComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { filterField: 'bank_nick_name' },
    valueGetter: (params: ValueGetterParams) => params.data?.bank_nick_name
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'cheque_amount',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { isAmountField: true, filterField: 'amount' },
    valueGetter: (params: ValueGetterParams) => params.data?.amount
  };

  colDefCheckNo = {
    headerName: 'Check No',
    field: 'cheque_serial_number',
    minWidth: 130,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { filterField: 'cheque_no' },
    valueGetter: (params: ValueGetterParams) => params.data?.cheque_no
  };

  colDefDate = {
    headerName: 'Created At',
    field: 'cheques.created_at',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'v4UpdatedAtComponent'
  };

  colDefVoidedBy: ICoulmnDefFields = {
    headerName: 'Voided By',
    field: 'voided_by',
    minWidth: 140,
    suppressFloatingFilterButton: true,
    sortable: false,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    valueGetter: (params: ValueGetterParams) => params.data?.voided_by
  };

  colDefVoidDate = {
    headerName: 'Voided At',
    field: 'cheques.void_created_at',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    sortable: false,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'v4UpdatedAtComponent'
  };

  colDefIp = {
    headerName: 'Ip Address',
    field: 'cheque_statements.ip_address',
    minWidth: 140,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    valueGetter: (params: ValueGetterParams) => params.data?.ip_address
  };

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
