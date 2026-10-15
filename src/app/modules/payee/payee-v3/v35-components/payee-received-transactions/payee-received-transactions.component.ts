import { ICellRendererParams } from '@ag-grid-community/core';
import { ComponentType } from '@angular/cdk/portal';
import { DatePipe } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Params } from '@angular/router';
import { finalize, Subject } from 'rxjs';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { RCSelectBoxComponent } from 'src/app/modules/receive-payments/components/recieved-check-select-box/rc-select-box.component';
import { RecievedChecksAddAttachmentCommentComponent } from 'src/app/modules/receive-payments/pages/received-checks/addAttachmentComment';
import { EditableCellRendererComponent } from 'src/app/modules/receive-payments/pages/received-checks/editableCellRendererComponent';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';

@Component({
  selector: 'app-payee-received-transactions',
  standalone: true,
  imports: [V3DataTableComponent],
  templateUrl: './payee-received-transactions.component.html',
  styleUrl: './payee-received-transactions.component.scss'
})
export class PayeeReceivedTransactionsComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private datePipe = inject(DatePipe);
  private requestPaymentsService = inject(RequestPaymentsService);

  payeeEmail = input('');
  public tableId = DTTableId.payeeReceiveTransaction;
  cellRendererRePymntsStatus: Params = [];
  columnFields: IDtColumnFields[] = [];
  destroy$ = new Subject();
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Received Payments',
    ignoreColumns: ['uu_id', 'received_check_lists.is_editable', 'action']
  };

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    addAttachComment: RecievedChecksAddAttachmentCommentComponent,
    rCSelectBoxComponent: RCSelectBoxComponent,
    isEditableComponent: EditableCellRendererComponent,
    V3DTCommonFilterComponent
  };

  FloatingFilterComponent: Params = {
    selectBox: [
      {
        id: 'received_check_lists.status',
        values: [
          { value: 1, name: 'Email' },
          { value: 14, name: 'Requested' },
          { value: { type: 4, status: 1 }, name: 'GPBL Acpt/Rej' },
          { value: { type: 4, status: 2 }, name: 'GPBL Viewed' },
          { value: { type: 4, status: 3 }, name: 'GPBL Rejected' },
          { value: { type: 4, status: 4 }, name: 'GPBL Accepted' },
          { value: { type: 4, status: 5 }, name: 'GPBL TTP' },
          { value: { type: 4, status: 6 }, name: 'GPBL Printed' },
          {
            value: { type: 4, status: 7 },
            name: 'HTML-FORM-SENDER-FPRINTED'
          },
          { value: { type: 4, status: 30 }, name: 'GPBL DD' },
          { value: { type: 4, status: 32 }, name: 'DD Rejected' },
          { value: { type: 4, status: 50 }, name: 'DD Initiated' },
          { value: { type: 4, status: 51 }, name: 'DD Completed' },
          { value: { type: 4, status: 52 }, name: 'DD Failed' },
          { value: 5, name: 'ACH' },
          { value: 6, name: 'M-ACH' },
          { value: 10, name: 'Stripe' },
          { value: 11, name: 'Paypal' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'received_check_lists.created_at',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  constructor() {
    effect(() => {
      const payeeEmial = this.payeeEmail();
      if (payeeEmial) {
        this.getSelectedPayeeEmail(payeeEmial ?? '');
      }
    });
  }

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent
    );
    this.getStatus();
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.columnFields = this.getColumnFields();
  }

  getSelectedPayeeEmail(email: string) {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: [],
      payee_email: email
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  getStatus() {
    this.requestPaymentsService
      .getStatus()
      .pipe(finalize(() => this.destroy$.next(true)))
      .subscribe((res) => {
        if (res.success) {
          this.cellRendererRePymntsStatus = res.data;
          this.requestPaymentsService.setStatusArray(res.data);
        }
      });
  }

  colDefStatus = {
    headerName: 'Status',
    minWidth: 180,
    field: 'received_check_lists.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'rCSelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'addAttachComment',
    cellRendererForExport: (params: Params) => {
      const value =
        this.cellRendererRePymntsStatus[params.data?.received_type]?.[
          params.data?.status
        ];
      return value?.statusShortDescription;
    }
  };

  colDefCheckFromName = {
    headerName: 'Payment From',
    field: 's_bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 110,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      prefixOptionalField: 'check_from_name'
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      params.data?.check_from_name
        ? params.data?.check_from_name
        : params.data?.bank_account_account_name
  };

  colDefFromEmail = {
    headerName: 'From Email',
    field: 'sender_email',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefFromPhone = {
    headerName: 'From Phone',
    field: 'sender_phone',
    suppressFloatingFilterButton: true,
    minWidth: 129,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayableTo = {
    headerName: 'Payable To',
    field: 'bank_accounts.bank_account_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 110,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => data.data.bank_account_nick_name
  };

  colDefCheckNo = {
    headerName: 'Check No',
    field: 'cheques.cheque_serial_number',
    suppressFloatingFilterButton: true,
    minWidth: 73,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => data.data.cheque_serial_number
  };

  colDefUpdatedAt = {
    headerName: 'Updated At',
    minWidth: 130,
    field: 'received_check_lists.updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererParams: {
      type: 'date',
      isPipeDate: true
    },
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      this.datePipe.transform(params.data?.updated_at, 'MM/dd/yyyy')
  };

  colDefDate = {
    headerName: 'Created At',
    minWidth: 130,
    field: 'received_check_lists.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableId: 0 },
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    cellRendererForExport: (params: ICellRendererParams) =>
      params.data?.created_at
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'received_check_lists.memo',
    suppressFloatingFilterButton: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 250,
    maxWidth: 400,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => data.data.memo
  };

  colDefPrintedBy = {
    headerName: 'Printed By',
    field: 'users.nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 110,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date', filterField: 'print_by_name' },
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.print_by_name
  };

  colDefRefId = {
    headerName: 'Ref Id',
    field: 'get_paid_by_form_check_id',
    suppressFloatingFilterButton: true,
    minWidth: 110,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefEditable = {
    headerName: 'Editable',
    field: 'received_check_lists.is_editable',
    suppressFloatingFilterButton: true,
    minWidth: 65,
    cellRenderer: 'isEditableComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  columnDefs = [
    this.colDefStatus,
    this.colDefCheckFromName,
    this.colDefFromEmail,
    this.colDefFromPhone,
    this.colDefPayableTo,
    this.colDefCheckNo,
    this.colDefDate,
    this.colDefUpdatedAt,
    this.colDefAmount,
    this.colDefMemo,
    this.colDefPrintedBy,
    this.colDefRefId,
    this.colDefEditable
  ];

  getColumnFields() {
    const baseFields = [
      {
        id: 'id_status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'id_fromName',
        name: 'Check From Name',
        isDisabled: true,
        colDef: this.colDefCheckFromName,
        isChecked: true
      },
      {
        id: 'id_fromEmail',
        name: 'From Email',
        isDisabled: false,
        colDef: this.colDefFromEmail,
        isChecked: true
      },
      {
        id: 'id_fromPhone',
        name: 'From Phone',
        isDisabled: false,
        colDef: this.colDefFromPhone,
        isChecked: true
      },
      {
        id: 'id_payeeAcNo',
        name: 'Payable To',
        isDisabled: false,
        colDef: this.colDefPayableTo,
        isChecked: true
      },
      {
        id: 'id_checkNo',
        name: 'Check No',
        isDisabled: false,
        colDef: this.colDefCheckNo,
        isChecked: true
      },
      {
        id: 'id_date',
        name: 'Created At',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'id_updated_at',
        name: 'Updated At',
        isDisabled: false,
        colDef: this.colDefUpdatedAt,
        isChecked: true
      },
      {
        id: 'id_amount',
        name: 'Amount',
        isDisabled: true,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'id_memo',
        name: 'Memo',
        isDisabled: false,
        colDef: this.colDefMemo,
        isChecked: true
      },

      {
        id: 'id_printedBy',
        name: 'Printed By',
        isDisabled: false,
        colDef: this.colDefPrintedBy,
        isChecked: true
      },
      {
        id: 'id_refId',
        name: 'Ref Id',
        isDisabled: false,
        colDef: this.colDefRefId,
        isChecked: true
      },
      {
        id: 'id_editable',
        name: 'Editable',
        isDisabled: false,
        colDef: this.colDefEditable,
        isChecked: true
      }
    ] as IDtColumnFields[];
    return baseFields;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
