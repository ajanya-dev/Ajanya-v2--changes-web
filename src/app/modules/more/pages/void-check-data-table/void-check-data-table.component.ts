import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { DtDropDownBankComponent } from 'src/app/modules/data-table/components/dt-drop-down-bank/dt-drop-down-bank.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-void-check-data-table',
  standalone: true,
  imports: [V3DataTableComponent, DataTableModule],
  templateUrl: './void-check-data-table.component.html',
  styleUrl: './void-check-data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoidCheckDataTableComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private reportsService = inject(ReportsService);
  private alertService = inject(AlertService);

  destroy$ = new Subject();
  loading = signal(false);

  public tableId = DTTableId.voidCheck;
  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];

  frameworkComponents = {
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    bankAccountComponent: DtDropDownBankComponent,
    payeeListComponent: DtMultiDropdownPayeeComponent
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

  /**
   * @description Exports report data in the specified file format.
   * @param {string} fileFormat - The file format for the exported data (e.g., 'pdf', 'csv').
   */
  exportData(fileFormat: string): void {
    const payload = {
      method: fileFormat
    };
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
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'payeeListComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    }
  };

  colDefBank = {
    headerName: 'Bank Nick Name',
    field: 'bank_account_nick_name',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'bankAccountComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.bank_nick_name
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'cheque_amount',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.amount
  };

  colDefCheckNo = {
    headerName: 'Check No',
    field: 'cheque_serial_number',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.cheque_no
  };

  colDefDate = {
    headerName: 'Created At',
    field: 'cheques.created_at',
    minWidth: 120,
    suppressMenu: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: (params: ICellRendererParams) => {
      const createdDate = params?.data?.created_time;
      if (createdDate) {
        const timeStyle = 'font-size: 12px; color: #9F9F9F';
        const [date, time] = createdDate.toString().split(' ');
        return `${date} <span style="${timeStyle}">(${time})</span>`;
      }
      return '';
    }
  };

  colDefVoidedBy:ColDef = {
    headerName: 'Voided By',
    field: 'voided_by',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    sortable:false,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.voided_by
  };

  colDefVoidDate = {
    headerName: 'Voided At',
    field: 'cheques.void_created_at',
    minWidth: 120,
    suppressMenu: true,
    sortable:false,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    filterParams: { newRowsAction: 'keep' },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.void_created_at
  };

  colDefIp = {
    headerName: 'Ip Address',
    field: 'cheque_statements.ip_address',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.ip_address
  };

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
