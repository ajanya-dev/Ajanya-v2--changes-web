import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import {
  ColDef,
  IRowNode,
  IsRowSelectable,
  ValueGetterParams
} from '@ag-grid-community/core';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { GroupMailingDetailsStatus } from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';
import { Utils } from 'src/app/data/utils';
import { V4GroupMailingItemStatusBadgeComponent } from './v4-group-mailing-item-status-badge.component';

export interface IGroupMailingItemsModalData {
  groupId: string;
  groupName: string;
}

@Component({
  selector: 'app-v4-group-mailing-items-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatDialogClose,
    V4DataTableComponent
  ],
  template: `
    <div
      class="flex flex-col h-full w-full max-w-full overflow-hidden bg-v4-main-background-color"
    >
      <div
        class="flex justify-between items-center px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold text-v4-main-text-color font-funnel">
            Group Mailing Items
          </h1>
          @if (data.groupName) {
            <span class="text-xs text-v4-secondary-text-color font-peridot">
              {{ data.groupName }}
            </span>
          }
        </div>
        <div
          [mat-dialog-close]="false"
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon name="x" [size]="20" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <div
        class="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-v4-tertiary-background-color"
      >
        <div class="min-w-[960px]">
          <app-v4-data-table
            [columnDefs]="columnDefs"
            [tableId]="tableId"
            [frameworkComponents]="frameworkComponents"
            [freeColumnResize]="false"
            [isRowSelectable]="isRowSelectable"
            [defaultColumnFields]="defaultColumnFields"
            [deselectedColumns]="deselectedColumns"
            [additionalPayload]="additionalPayload"
          ></app-v4-data-table>
        </div>
      </div>
    </div>
  `
})
export class V4GroupMailingItemsModalComponent implements OnInit {
  data = inject<IGroupMailingItemsModalData>(MAT_DIALOG_DATA);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  tableId = DTTableId.businessToolsGroupMailingDetails;
  deselectedColumns: string[] = [];

  frameworkComponents = {
    searchBoxComponent: V4TextFloatingFilterComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    itemStatusBadgeComponent: V4GroupMailingItemStatusBadgeComponent
  };

  isRowSelectable: IsRowSelectable = (_: IRowNode) => false;

  additionalPayload = { group_id: this.data.groupId };

  private statusTypes = [
    { value: GroupMailingDetailsStatus.NEW, name: 'New' },
    { value: GroupMailingDetailsStatus.PRINTED, name: 'Printed' },
    { value: GroupMailingDetailsStatus.VOID, name: 'Void' },
    { value: GroupMailingDetailsStatus.ARCHIVED, name: 'Archived' },
    { value: GroupMailingDetailsStatus.PRINTING, name: 'Printing' },
    { value: GroupMailingDetailsStatus.MAILED, name: 'Mailed' },
    { value: GroupMailingDetailsStatus.SCHEDULE, name: 'Schedule' },
    { value: GroupMailingDetailsStatus.EMAILED, name: 'E-Printed' },
    { value: GroupMailingDetailsStatus.REQUESTED, name: 'Requested' },
    { value: GroupMailingDetailsStatus.DD, name: 'DD' },
    { value: GroupMailingDetailsStatus.DD_FUNDING, name: 'DD-Funding' },
    { value: GroupMailingDetailsStatus.DD_FAILED, name: 'DD-Failed' },
    { value: GroupMailingDetailsStatus.DDW, name: 'DDW' },
    { value: GroupMailingDetailsStatus.DD_DEPOSITING, name: 'DD-Depositing' },
    {
      value: GroupMailingDetailsStatus.DD_DEPOSIT_FAILED,
      name: 'DD-Deposit-F'
    },
    { value: GroupMailingDetailsStatus.DDC, name: 'DDC' },
    { value: GroupMailingDetailsStatus.POSTED, name: 'Posted' },
    { value: GroupMailingDetailsStatus.UN_POSTED, name: 'Un-Posted' },
    {
      value: GroupMailingDetailsStatus.APPROVAL_REQUIRED,
      name: 'Approval-Required'
    },
    {
      value: GroupMailingDetailsStatus.UNMAPPED_CHECKS,
      name: 'Unmapped-Checks'
    },
    { value: GroupMailingDetailsStatus.EXPORTED, name: 'Exported' },
    { value: GroupMailingDetailsStatus.NOT_EXPORTED, name: 'Not Exported' },
    { value: GroupMailingDetailsStatus.BLANK, name: 'Blank' }
  ];

  configs = {
    selectBox: [{ id: 'cheque_status', values: this.statusTypes }],
    selectDate: [{ id: 'cheques.created_at', initialRange: 'All Time' }]
  };

  // Widths mirror v4-group-mailing-details, which renders the same columns for
  // the same table id: the fixed-content columns (serial, amount, date, status)
  // are pinned to a width, and only the free-text columns take the surplus.
  colDefSerialNumber = {
    headerName: 'Serial Number',
    minWidth: 140,
    width: 145,
    maxWidth: 170,
    flex: 0,
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayeeName = {
    headerName: 'Payee',
    minWidth: 140,
    flex: 2,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBankAccountName = {
    headerName: 'AC Name',
    minWidth: 140,
    flex: 2,
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // Status is the only edge-anchoring column this grid has (no Actions column),
  // so it owns the right edge with the full lock set.
  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 150,
    width: 160,
    maxWidth: 160,
    flex: 0,
    field: 'cheque_status',
    pinned: 'right',
    lockPinned: true,
    lockPosition: 'right',
    suppressMovable: true,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'itemStatusBadgeComponent',
    valueGetter: (params: ValueGetterParams<{ cheque_status?: number }>) =>
      String(params.data?.cheque_status ?? '')
  };

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 125,
    width: 130,
    maxWidth: 160,
    flex: 0,
    field: 'cheque_amount',
    cellClass: 'flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<{ cheque_amount?: string }>) =>
      params.data?.cheque_amount ? `$${params.data.cheque_amount}` : ''
  };

  colDefMemo = {
    headerName: 'Memo',
    minWidth: 130,
    flex: 2,
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedDate = {
    headerName: 'Date',
    minWidth: 145,
    width: 150,
    maxWidth: 180,
    flex: 0,
    field: 'cheques.created_at',
    cellClass: 'flex flex-col justify-center',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'group_mailing_details',
      tableId: this.tableId
    },
    cellRenderer: (params: { data: { created_at?: string } }) => {
      const createdAt = params.data?.created_at;
      if (!createdAt) return '';
      const date = Utils.splitDate(createdAt) ?? '';
      const time = Utils.splitTime(createdAt) ?? '';
      // Date over time, matching the Updated/Created Date columns in Payments Out.
      return `
        <div style="display:flex;flex-direction:column;gap:1px;line-height:1.25;white-space:nowrap">
          <span>${date}</span>
          ${
            time
              ? `<span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>`
              : ''
          }
        </div>
      `;
    }
  };

  defaultColumnFields = [
    {
      id: 'cheque_serial_number',
      name: 'Serial',
      isDisabled: true,
      colDef: this.colDefSerialNumber,
      isChecked: true
    },
    {
      id: 'payee_name',
      name: 'Payee To',
      isDisabled: true,
      colDef: this.colDefPayeeName,
      isChecked: true
    },
    {
      id: 'bank_account_account_name',
      name: 'AC Name',
      isDisabled: false,
      colDef: this.colDefBankAccountName,
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
      id: 'cheque_memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Date',
      isDisabled: true,
      colDef: this.colDefCreatedDate,
      isChecked: true
    },
    {
      id: 'cheque_status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefSerialNumber,
    this.colDefPayeeName,
    this.colDefBankAccountName,
    this.colDefAmount,
    this.colDefMemo,
    this.colDefCreatedDate,
    this.colDefStatus
  ];

  ngOnInit(): void {
    this.v3DataTableService.rowData = [];
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined
    );
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
  }
}
