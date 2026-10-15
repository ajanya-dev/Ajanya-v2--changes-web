import { ICellRendererParams, ValueGetterParams } from '@ag-grid-community/core';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
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
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4BankDropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-bank-dropdown-floating-filter/v4-bank-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';

import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ConfirmPasswordModalV4Component } from '../../../modals/reports/confirm-password-modal-v4/confirm-password-modal-v4.component';
import { OtpModalV4Component } from '../../../modals/reports/otp-modal-v4/otp-modal-v4.component';

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
  deleted_by: string;
}

@Component({
  selector: 'app-delete-check-data-table-v4',
  standalone: true,
  imports: [V4DataTableComponent, NgClass, V4PageHeaderComponent],
  templateUrl: './delete-check-data-table-v4.component.html',
  styleUrl: './delete-check-data-table-v4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteCheckDataTableV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private route = inject(Router);
  private reportsService = inject(ReportsService);

  destroy$ = new Subject();
  isSubmit = signal(false);
  isBlur = signal(true);
  selectedRow: IRowData[];
  loading = signal(false);

  public tableId = DTTableId.deleteCheck;
  public columnDefs: ICoulmnDefFields[];
  public columnFields: IDtColumnFields[];

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    topRightButtons: [
      {
        text: 'Permanent Delete',
        id: 'id_delete',
        type: { style: 'filled', name: 'main' },
        backGroundInput: 'var(--v4-badge-error-text-color)',
        textColorInput: '#ffffff',
        lucideIcon: 'trash-2',
        lucideIconSize: 16,
        customClasses: '!py-2.5 !px-5',
        textClasses: '!text-sm',
        disabled: this.isSubmit()
      }
    ]
  }));

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    bankAccountComponent: V4BankDropdownFloatingFilterComponent,
    payeeListComponent: V4PayeeMultiSelectFloatingFilterComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    V4DTCommonFilterComponent
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

  openPassWordModal(): void {
    this.dialog
      .open(ConfirmPasswordModalV4Component, {
        maxWidth: '470px',
        width: '93%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { type: 'report', enableBack: true }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isBlur.set(false);
        } else {
          this.route.navigateByUrl('/v4/manage/more/report');
        }
      });
  }

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

  exportData(fileFormat: string): void {
    const payload = { method: fileFormat };
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

  private handleSuccessfulDeletion() {
    this.alertService.successAlert({ content: 'Check deleted permanently.' });
    this.v3DataTableService.gridApi.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  private handleOtp(err: HttpErrorResponse) {
    if (err.error.errorCode === '112') {
      const dialog = this.dialog.open(OtpModalV4Component, {
        width: '470px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: err.error
      });

      dialog.afterClosed().subscribe((response) => {
        if (response) {
          this.deleteChecks();
        }
      });
    }
  }

  colDefId: ICoulmnDefFields = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    sortable: false,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    pinned: 'left',
    cellClass: 'flex justify-center',
    headerClass: 'pl-3.5',
  };

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee',
    minWidth: 175,
    flex: 2,
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
    flex: 1,
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
    minWidth: 120,
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
    cellRenderer: (params: ICellRendererParams) => {
      const raw = (params?.data?.created_time ?? '').toString();
      if (!raw) return '';
      const [date = '', time = ''] = raw.includes('_') ? raw.split('_') : raw.split(' ');
      return `<div style="display:flex;flex-direction:column;line-height:1.25">
        <span style="font-size:12px;color:var(--v4-main-text-color)">${date}</span>
        <span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>
      </div>`;
    }
  };

  colDefDeletedBy = {
    headerName: 'Deleted By',
    field: 'deleted_by',
    minWidth: 140,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    sortable: false,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    valueGetter: (params: ValueGetterParams) => params.data?.deleted_by
  };

  colDefDeleteDate = {
    headerName: 'Deleted At',
    field: 'cheques.deleted_at',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: (params: ICellRendererParams) => {
      const raw = (params?.data?.deleted_at ?? '').toString();
      if (!raw) return '';
      const [date = '', time = ''] = raw.includes('_') ? raw.split('_') : raw.split(' ');
      return `<div style="display:flex;flex-direction:column;line-height:1.25">
        <span style="font-size:12px;color:var(--v4-main-text-color)">${date}</span>
        <span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>
      </div>`;
    }
  };

  colDefIp = {
    headerName: 'Ip Address',
    field: 'cheque_statements.ip_address',
    minWidth: 130,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    sortable: false,
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
