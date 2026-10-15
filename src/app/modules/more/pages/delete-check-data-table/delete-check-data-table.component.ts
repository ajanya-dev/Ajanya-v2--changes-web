import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from '@ag-grid-community/core';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, finalize, map, takeUntil } from 'rxjs';
import { DeleteModalComponent } from 'src/app/modules/account-closing/modals/delete-modal/delete-modal.component';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtDropDownBankComponent } from 'src/app/modules/data-table/components/dt-drop-down-bank/dt-drop-down-bank.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';

interface IRowData {
  task_by: string;
  ip_address: string;
  void_created_at: string;
  bank_nick_name: string;
  bank_account_account_name: string;
  bank_account_account_number: string;
  cheque_status: number;
  bank: string;
  bank_routing_number: string;
  id: string;
  qb_transaction_id: string;
  by: string;
  payee: string;
  amount: string;
  cheque_no: string;
  date: string;
  memo?: string;
  cheque_notes?: string;
  payee_ac_no?: string;
  invoice_no?: string;
  category?: string;
  created_time: string;
  device_address?: string;
  status: string;
  catagory_id?: number;
  account_name: unknown;
  clients: unknown;
  bank_account: unknown;
  action: string;
  deleted_at: string;
  payee_id: string;
  cheque_created_by_user_name: string;
  created_at: string;
  cheque_issue_date: string;
  payee_name: string;
  bank_accounts_id: string;
  deleted_by:string;
}

@Component({
  selector: 'app-delete-check-data-table',
  standalone: true,
  imports: [V3DataTableComponent, DataTableModule, NgClass],
  templateUrl: './delete-check-data-table.component.html',
  styleUrl: './delete-check-data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteCheckDataTableComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private route = inject(Router);
  private reportsService = inject(ReportsService);

  destroy$ = new Subject();
  isSubmit = signal(false);
  isBlur = signal(true);
  selectedRow: IRowData[];
  loading = signal(false);

  public tableId = DTTableId.deleteCheck;
  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Permanent Delete',
        id: 'id_delete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        disabled: this.isSubmit()
      }
    ]
  }));

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
      this.colDefId,
      this.colDefPayee,
      this.colDefBank,
      this.colDefAmount,
      this.colDefCheckNo,
      this.colDefDate,
      this.colDefDeletedBy,
      this.colDefDeleteDate,
      this.colDefIp
    ];

    this.columnFields = [
      {
        id: 'boxId',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
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
        id: 'deleted_by',
        name: 'Deleted By',
        isDisabled: false,
        colDef: this.colDefDeletedBy,
        isChecked: true
      },
      {
        id: 'deleted_at',
        name: 'Deleted At',
        isDisabled: false,
        colDef: this.colDefDeleteDate,
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
    this.openPassWordModal();
    this.getSelectedRows();
  }

  /**
   *  @description Opens a password modal dialog and navigates based on the user's response.
   */
  openPassWordModal(): void {
    this.dialog
      .open(DeleteModalComponent, {
        maxWidth: '470px',
        width: '93%',
        autoFocus: false,
        disableClose: true,
        data: { type: 'report', enableBack: true }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isBlur.set(false);
        } else {
          this.route.navigateByUrl('/manage/more/report');
        }
      });
  }

  /**
   * @description Retrieves the selected rows from the v3DataTableService and stores them in the selectedRow property.
   */
  getSelectedRows() {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(
        map((val) => val.map((el) => el.data)),
        takeUntil(this.destroy$)
      )
      .subscribe((val) => {
        this.selectedRow = val;
      });
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
      .checkReport('delete', payload)
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

  headerButtonClick(event: { id: string }) {
    if (event.id === 'id_delete') {
      this.delete();
    }
  }

  /**
   * @description Displays a confirmation dialog and initiates the deletion process if confirmed.
   */
  delete() {
    const confirmationData = {
      content: 'Are you sure you want to delete this checks permanently?',
      doneMsg: 'Yes, Delete!',
      cancelMsg: 'No, Cancel!'
    };
    const confirmationAlert = this.alertService.confirmAlert(confirmationData);

    confirmationAlert.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteChecks();
      }
    });
  }

  /**
   *  @description Sends a request to delete the checks permanently and handles the response.
   */
  private deleteChecks() {
    const selectedCheckIds = this.selectedRow.map((element) => element.id);
    const payload = { ids: selectedCheckIds };
    this.isSubmit.set(true);

    this.checkService
      .deleteCheckPermanently(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmit.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.handleSuccessfulDeletion();
          }
        },
        error: (err) => {
          this.handleOtp(err);
        }
      });
  }

  /**
   * @description Handles the successful deletion of checks by displaying a success alert and refreshing the data table.
   */
  private handleSuccessfulDeletion() {
    this.alertService.successAlert({ content: 'Check deleted permanently.' });
    this.v3DataTableService.gridApi.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Handles Otp that occur during the deletion process.
   * @param {HttpErrorResponse} err - The error object received from the deletion request.
   */
  private handleOtp(err: HttpErrorResponse) {
    if (err.error.errorCode === '112') {
      const dialog = this.dialog.open(OtpModalComponent, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false,
        data: err.error
      });

      dialog.afterClosed().subscribe((response) => {
        if (response) {
          this.deleteChecks();
        }
      });
    }
  }

  colDefId: ColDef = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    floatingFilter: false,
    sortable: false,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'fixed-size-header',
    pinned: 'left'
  };

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

  colDefDeletedBy = {
    headerName: 'Deleted By',
    field: 'deleted_by',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    sortable:false,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.deleted_by
  };

  colDefDeleteDate = {
    headerName: 'Deleted At',
    field: 'cheques.deleted_at',
    minWidth: 120,
    suppressMenu: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: {
      suppressFilterButton: true
    },
    filterParams: { newRowsAction: 'keep' },
    valueGetter: (params: ValueGetterParams) =>
      params.data?.deleted_at
  };

  colDefIp = {
    headerName: 'Ip Address',
    field: 'cheque_statements.ip_address',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    sortable:false,
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
