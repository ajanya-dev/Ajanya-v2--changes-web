import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ComponentType } from '@angular/cdk/portal';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { FileDownloadComponent } from '../../components/dt-components/dt-file-download';

@Component({
  selector: 'app-positive-pay-logs',
  templateUrl: './positive-pay-logs.component.html',
  styleUrls: ['./positive-pay-logs.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class PositivePayLogsComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  public activatedRoute = inject(ActivatedRoute);

  public tableId = DTTableId.positivePayLogs; // Data Table Id

  rowIndex: number;

  routingNumber: string | null;

  public headerElements: IV3DtHeaderElements = {};

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    SearchBoxComponent: DtSearchBoxComponent,
    fileDownloadComponent: FileDownloadComponent,
    dateRangeV35Component: DataRangeV35Component,
    SelectBoxComponent: V3DataTableSelectBoxComponent
  };

  // FILTER CUSTOM COMPONENTS
  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'Success', name: 'Success' },
          { value: 'Failed', name: 'Failed' }
        ]
      }
    ]
  };

  deselectedColumns: string[] = this.defaultDeselectedColumns();

  defaultDeselectedColumns() {
    if (window.innerWidth < 768) {
      return [
        'view',
        'status',
        'source_name',
        'source.source',
        'updated_at',
        'reference_no',
        'created_by',
        'description'
      ];
    }
    if (window.innerWidth < 1100) {
      return ['source_name', 'source.source', 'created_by', 'description'];
    }
    return [];
  }

  colDefId = {
    headerName: 'Date',
    field: 'run_date',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    sortable: false,
    headerClass: 'fixed-size-header',
    cellClass: 'pl-3',
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter'
  };

  colDefBankAccName = {
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBankAccNumber = {
    headerName: 'Bank Routing Number',
    field: 'routing_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefFile = {
    headerName: 'File',
    field: 'download_link',
    suppressFloatingFilterButton: true,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    cellRenderer: 'fileDownloadComponent',
    sortable: false
  };

  columnDefs = [
    this.colDefId,
    this.colDefBankAccName,
    this.colDefBankAccNumber,
    this.colDefStatus,
    this.colDefFile
  ];

  columnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'name',
      name: 'Bank Name',
      isDisabled: true,
      colDef: this.colDefBankAccName,
      isChecked: true
    },
    {
      id: 'account_number',
      name: 'Bank Routing Number',
      isDisabled: true,
      colDef: this.colDefBankAccNumber,
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
      id: 'file',
      name: 'File',
      isDisabled: true,
      colDef: this.colDefFile,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    this.setRoutingNumber();
    this.v3DataTableService.resetV3DataTablePayload();
    // PASS DATAS TO DATA TABLE SERVICE
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent
    );
    this.refreshDataTable();
  }

  setRoutingNumber(): void {
    this.routingNumber = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.routingNumber !== null) {
      this.v3DataTableService.setRoutingNumber({
        routingNumber: this.routingNumber
      });
    }
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  rowClicked(event: number) {
    this.rowIndex = event;
  }
}
