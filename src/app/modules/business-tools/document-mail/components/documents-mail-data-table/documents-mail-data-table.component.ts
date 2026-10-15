import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  ColDef,
  IRowNode,
  IsRowSelectable,
  ValueGetterParams,
  ICellRendererParams
} from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSearchBoxComponent } from '../../../../data-table/components/dt-search-box/dt-search-box.component';
import { DocumentMailTableActionComponent } from '../document-mail-table-action/document-mail-table-action.component';
import { IDocumentMailDataTableRowData } from '../../models/document-mail.model';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-documents-mail-data-table',
  templateUrl: './documents-mail-data-table.component.html',
  styleUrls: ['./documents-mail-data-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class DocumentsMailDataTableComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  tableId = DTTableId.businessToolsDocumentMailing;

  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    actionComponent: DocumentMailTableActionComponent
  };

  isRowSelectable: IsRowSelectable = (_: IRowNode) => false;

  loading = false;
  shippingTypes = [
    { name: 'First Class 1.25', value: 1 },
    { name: 'First Class with Tracking 6.99', value: 3 },
    { name: 'Priority Mail USPS 11.99', value: 4 },
    { name: 'Express Mail USPS 34.99', value: 5 },
    { name: 'First Class Canada 2.99', value: 14 },
    { name: 'First Class WIth Tracking (international) 4.99', value: 17 }
  ];

  configs = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 0, name: 'New' },
          { value: 1, name: 'Pending' },
          { value: 2, name: 'Printed' },
          { value: 3, name: 'Envelop Printed' },
          { value: 4, name: 'Completed' },
          { value: 8, name: 'Refunded' }
        ]
      },
      {
        id: 'mail_type',
        values: this.shippingTypes
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(undefined, this.configs);
    this.initializeV3DataTable();
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
  }

  colDefTitle = {
    headerName: 'Document Title',
    minWidth: 80,
    field: 'document_title',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 80,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<IDocumentMailDataTableRowData>) => {
      switch (params.data?.status) {
        case 0:
          return 'New';
        case 1:
          return 'Pending';
        case 2:
          return 'Printed';
        case 3:
          return 'Envelop Printed';
        case 4:
          return 'Completed';
        case 8:
          return 'Refunded';
        default:
          return '';
      }
    }
  };

  colDefPayee = {
    headerName: 'To',
    minWidth: 80,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefMailType = {
    headerName: 'Mail Type',
    minWidth: 100,
    field: 'mail_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (
      params: ICellRendererParams<IDocumentMailDataTableRowData>
    ) => {
      if (this.loading) {
        return `<div> <span class="skelton">Loading ...</span> </div>`;
      }

      return (
        this.shippingTypes.find((val) => val.value === params.value)?.name ||
        params.value
      );
    }
  };

  colDefAction: ColDef = {
    headerName: 'Actions',
    maxWidth: 100,
    field: 'action',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    pinned: 'right',
    sortable: false
  };

  defaultColumnFields = [
    {
      id: 'document_title',
      name: 'Document Title',
      isDisabled: true,
      colDef: this.colDefTitle,
      isChecked: true
    },
    {
      id: 'status_name',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'payee_name',
      name: 'To',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'mail_type',
      name: 'Mail Type',
      isDisabled: true,
      colDef: this.colDefMailType,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Actions',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefTitle,
    this.colDefStatus,
    this.colDefPayee,
    this.colDefMailType,
    this.colDefAction
  ];

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
