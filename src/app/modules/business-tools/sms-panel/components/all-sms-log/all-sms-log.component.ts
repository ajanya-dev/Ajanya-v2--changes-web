import { Component, OnInit, inject } from '@angular/core';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { SMSPanelDtviewDetailsComponent } from '../sms-panel-dtview-details/sms-panel-dtview-details.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-all-sms-log',
  templateUrl: './all-sms-log.component.html',
  styleUrls: ['./all-sms-log.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class AllSmsLogComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public tableId = DTTableId.groupSmsInboxMessages;

  frameworkComponents = {
    dtviewDetailsComponent: SMSPanelDtviewDetailsComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'delivered',
        values: [
          { value: 1, name: 'Delivered' },
          { value: 0, name: 'Not Delivered' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.initialize();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      undefined,
      undefined,
      this.tableId
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Initialise column fiels and header elements.
   */
  initialize() {
    this.columnDefs = [
      this.colDefFromPhoneNumber,
      this.colDefToPhoneNumber,
      this.colDefStatus,
      this.colDefSMSCharge,
      this.colDefMoreDetails,
      this.colDefMessage
    ];
    this.columnFields = [
      {
        id: 'fromNumber',
        name: 'Phone Number',
        isDisabled: false,
        colDef: this.colDefFromPhoneNumber,
        isChecked: true
      },
      {
        id: 'toNumber',
        name: 'Phone Number',
        isDisabled: false,
        colDef: this.colDefToPhoneNumber,
        isChecked: true
      },
      {
        id: 'delivered',
        name: 'Date',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'groupName',
        name: 'SMS Charge',
        isDisabled: false,
        colDef: this.colDefSMSCharge,
        isChecked: true
      },
      {
        id: 'content',
        name: 'Message',
        isDisabled: false,
        colDef: this.colDefMessage,
        isChecked: true
      },
      {
        id: 'not_delivery_reason',
        name: 'More Details',
        isDisabled: false,
        colDef: this.colDefMoreDetails,
        isChecked: true
      }
    ];
  }

  colDefFromPhoneNumber = {
    headerName: 'From Phone Number',
    minWidth: 50,
    maxWidth: 200,
    field: 'fromNumber',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefToPhoneNumber = {
    headerName: 'To Phone Number',
    minWidth: 50,
    maxWidth: 200,
    field: 'toNumber',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 50,
    maxWidth: 200,
    field: 'delivered',
    suppressFloatingFilterButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'SelectBoxComponent',
    cellRenderer: 'dtviewDetailsComponent',
    suppressHeaderMenuButton: true,

    floatingFilter: true
  };

  colDefSMSCharge = {
    headerName: 'SMS Charge',
    minWidth: 50,
    maxWidth: 200,
    field: 'sms_charge',
    floatingFilter: true
  };

  colDefMoreDetails = {
    headerName: 'More Details',
    field: 'not_delivered_reason',
    minWidth: 100,
    floatingFilter: true
  };

  colDefMessage = {
    headerName: 'Message',
    minWidth: 200,
    field: 'content',
    cellStyle: () => ({ width: '100%' })
  };
}
