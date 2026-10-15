import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  ColDef,
  ICellRendererParams,
  IRowNode,
  IsRowSelectable,
  ValueGetterParams
} from '@ag-grid-community/core';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DocumentMailFilesTableActionComponent } from './document-mail-files-table-action.component';
import { IDocumentMailDataFilesTableRowData } from '../../models/document-mail.model';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-document-mail-files-table',
  templateUrl: './document-mail-files-table.component.html',
  styleUrls: ['./document-mail-files-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class DocumentMailFilesTableComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  tableId = DTTableId.businessToolsDocumentMailingDocument;

  isRowSelectable: IsRowSelectable = (_: IRowNode) => true;
  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 0, name: 'New' },
          { value: 1, name: 'Pending' },
          { value: 2, name: 'Printed' },
          { value: 3, name: 'Envelop Printed' },
          { value: 4, name: 'Mail Sent' },
          { value: 8, name: 'Refunded' }
        ]
      }
    ]
  };

  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    searchBoxComponent: DtSearchBoxComponent,
    actionComponent:DocumentMailFilesTableActionComponent
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
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

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: (_: ICellRendererParams) => true,
    showDisabledCheckboxes: false,
    pinned: 'left'
  };

  colDefTitle = {
    headerName: 'Document Title',
    minWidth: 80,
    field: 'document_title',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedAt: ColDef = {
    headerName: 'Created At',
    minWidth: 100,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 80,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (
      params: ValueGetterParams<IDocumentMailDataFilesTableRowData>
    ) => {
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
          return 'Mail Sent';
        case 8:
          return 'Refunded';
        default:
          return '';
      }
    }
  };

  colDefAction: ColDef = {
    headerName: 'Actions',
    maxWidth: 100,
    field: 'action',
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    sortable: false
  };

  columnDefs = [
    this.colDefId,
    this.colDefAction,
    this.colDefTitle,
    this.colDefStatus,
    this.colDefCreatedAt,
  ];

  defaultColumnFields = [
    {
      id: 'boxId',
      name: 'Check Box',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'something_else',
      name: 'Actions',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    },
    {
      id: 'document_title',
      name: 'Document Title',
      isDisabled: true,
      colDef: this.colDefTitle,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      isDisabled: true,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
  ];

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
