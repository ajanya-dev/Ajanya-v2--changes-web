import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { DtV4FileDownloadComponent } from 'src/app/modules/v4-positive-pay/components/dt-v4-positivepay-action/dt-v4-positivepay-action.component';
import { V4BankDropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-bank-dropdown-floating-filter/v4-bank-dropdown-floating-filter.component';

@Component({
  selector: 'app-v4-postive-pay-download-history',
  templateUrl: './v4-postive-pay-download-history.component.html',
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent]
})
export class V4PostivePayDownloadHistoryComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private activatedRoute = inject(ActivatedRoute);

  public tableId = DTTableId.postivePayDownloadHistory;

  routingNumber: string | null;

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    fileDownloadComponent: DtV4FileDownloadComponent,
    bankDropdownComponent: V4BankDropdownFloatingFilterComponent
  };

  colDefBank = {
    flex: 1,
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'bankDropdownComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefRouting = {
    headerName: 'Routing Number',
    field: 'routing_number',
    flex: 1,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefDate = {
    headerName: 'From Date',
    field: 'from_date',
    flex: 1,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefToDate = {
    headerName: 'To Date',
    field: 'to_date',
    flex: 1,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBy = {
    headerName: 'Created By',
    field: 'name',
    flex: 1,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefFileType = {
    headerName: 'File Type',
    field: 'file_type',
    flex: 1,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefFile = {
    headerName: 'File',
    field: 'download_link',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'fileDownloadComponent',
    sortable: false,
    flex: 1
  };

  columnDefs = [
    this.colDefBank,
    this.colDefRouting,
    this.colDefDate,
    this.colDefToDate,
    this.colDefBy,
    this.colDefFileType,
    this.colDefFile
  ];

  columnFields = [
    {
      id: 'bank_name',
      name: 'Bank Name',
      isDisabled: true,
      colDef: this.colDefBank,
      isChecked: true
    },
    {
      id: 'routing_number',
      name: 'Routing Number',
      isDisabled: true,
      colDef: this.colDefRouting,
      isChecked: true
    },
    {
      id: 'from_date',
      name: 'From Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'to_date',
      name: 'To Date',
      isDisabled: false,
      colDef: this.colDefToDate,
      isChecked: true
    },
    {
      id: 'name',
      name: 'Created By',
      isDisabled: false,
      colDef: this.colDefBy,
      isChecked: true
    },
    {
      id: 'file_type',
      name: 'File Type',
      isDisabled: false,
      colDef: this.colDefFileType,
      isChecked: true
    },
    {
      id: 'download_link',
      name: 'File',
      isDisabled: false,
      colDef: this.colDefFile,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    this.setRoutingNumber();
    this.dataTableService.setDataFromParent(this.columnFields);
    this.v3DataTableService.resetV3DataTablePayload();
  }

  setRoutingNumber(): void {
    this.routingNumber = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.routingNumber !== null) {
      this.v3DataTableService.setRoutingNumber({
        routingNumber: this.routingNumber
      });
    }
  }
}
