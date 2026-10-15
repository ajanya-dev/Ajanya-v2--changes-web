import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { DtDropDownBankComponent } from 'src/app/modules/data-table/components/dt-drop-down-bank/dt-drop-down-bank.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ActivatedRoute } from '@angular/router';
import { FileDownloadComponent } from '../../components/dt-components/dt-file-download';

@Component({
  selector: 'app-postive-pay-download-history',
  standalone: true,
  imports: [V3DataTableComponent],
  templateUrl: './postive-pay-download-history.component.html',
  styleUrl: './postive-pay-download-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostivePayDownloadHistoryComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  public activatedRoute = inject(ActivatedRoute);

  public tableId = DTTableId.postivePayDownloadHistory;
  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];

  frameworkComponents = {
    bankAccountComponent: DtDropDownBankComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    fileDownloadComponent: FileDownloadComponent
  };

  routingNumber: string | null;

  ngOnInit() {
    this.setRoutingNumber();
    this.setColumnDefs();
  }

  setColumnDefs(): void{
    this.columnDefs = [
      this.colDefBank,
      this.colDefRouting,
      this.colDefDate,
      this.colDefToDate,
      this.colDefBy,
      this.colDefFileType,
      this.colDefFile
    ];

    this.columnFields = [
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

  colDefBank = {
    minWidth: 120,
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'bankAccountComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    }
  };

  colDefRouting = {
    headerName: 'Routing Number',
    field: 'routing_number',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    }
  };

  colDefDate = {
    headerName: 'From Date',
    field: 'from_date',
    minWidth: 120,
    suppressMenu: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: {
      suppressFilterButton: true
    }
  };

  colDefToDate = {
    headerName: 'To Date',
    field: 'to_date',
    minWidth: 120,
    suppressMenu: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: {
      suppressFilterButton: true
    }
  };

  colDefBy = {
    headerName: 'Created By',
    field: 'name',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    }
  };

  colDefFileType = {
    headerName: 'File Type',
    field: 'file_type',
    minWidth: 60,
    width: 100,
    suppressMenu: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    }
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
}
