import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import {
  ColDef,
  IRowNode,
  IsRowSelectable,
  ValueGetterParams
} from '@ag-grid-community/core';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { Router } from '@angular/router';
import { DocumentMailFilesTableActionComponent } from '../../../document-mail/components/document-mail-files-table/document-mail-files-table-action.component';

interface IDocumentMailHistoryRowData {
  id?: string;
  boxId?: number;
  document_title?: string;
  created_at?: string;
  status?: number;
  action?: string;
}

@Component({
  selector: 'app-document-mail-history',
  templateUrl: './document-mail-history.component.html',
  styleUrls: ['./document-mail-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    V3DataTableComponent,
    V3DataTableModule,
    DataTableModule,
    CommonButtonV35Component
  ]
})
export class DocumentMailHistoryComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);

  tableId = DTTableId.businessToolsDocumentMailingDocument;
  tableTitle = 'Document Mail History';
  deselectedColumns: string[] = [];
  backUrl: string = '/manage/business-tools/mail-dashboard/index';

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
    actionComponent: DocumentMailFilesTableActionComponent
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
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
    // Trigger data table refresh after setting the payload
    this.v3DataTableService.refreshV3DataTable();
  }


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
    valueGetter: (params: ValueGetterParams<IDocumentMailHistoryRowData>) => {
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
    minWidth: 200,
    field: 'action',
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    sortable: false,
  };

  defaultColumnFields = [
    {
      id: 'action',
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
    }
  ];

  columnDefs = [
    this.colDefAction,
    this.colDefTitle,
    this.colDefStatus,
    this.colDefCreatedAt
  ];

  onSendMail(){
    this.router.navigate(['/manage/business-tools/document-mail/add-attachment']);
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
