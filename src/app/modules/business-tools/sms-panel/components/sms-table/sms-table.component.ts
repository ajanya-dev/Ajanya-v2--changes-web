import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import {
  IDtActionCompProp,
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { ISMSPanelRowData, ISMSPanelSelectedRow } from '../../model/sms-panel';
import { CampaignDetailsComponent } from '../campaign-details/campaign-details.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-sms-table',
  templateUrl: './sms-table.component.html',
  styleUrls: ['./sms-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class SmsTableComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private matDialogue = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public tableId = DTTableId.smsGroupCompaignList;
  FloatingFilterComponent: IDtFloatingFilterProp | undefined;
  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent
  };

  @Output() tableChange = new EventEmitter<number>();
  actionComponentProp: IDtActionCompProp | undefined;

  selectedTab = 52;

  cellRenderer = {
    action: [
      {
        name: 'Edit',
        id: 'RId_view',
        icon: 'fa-solid fa-pen-to-square'
      }
    ]
  };

  ngOnInit(): void {
    this.actionComponentProp = {
      eyeButton: true
    };

    this.columnDefs = [
      this.colDefCampaignName,
      this.colDefDate,
      this.colDefGroupName,
      this.colDefContacts,
      this.colDefApprovalStatus,
      this.colDefDelivered,
      this.colDefNotDelivered,
      this.colDefMessage,
      this.colDeffromNumber,
      this.colDefAction
    ];

    this.FloatingFilterComponent = {
      selectBox: [
        {
          id: 'approval_status',
          values: [
            { value: 0, name: 'Delivered' },
            { value: 1, name: 'Pending' },
            { value: 2, name: 'Not Delivered' }
          ]
        }
      ]
    };

    this.columnFields = [
      {
        id: 'campaignName',
        name: 'Title',
        isDisabled: false,
        colDef: this.colDefCampaignName,
        isChecked: true
      },
      {
        id: 'created_at',
        name: 'Date',
        isDisabled: true,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'groupName',
        name: 'SMS Group',
        isDisabled: true,
        colDef: this.colDefGroupName,
        isChecked: true
      },
      {
        id: 'message',
        name: 'Message',
        isDisabled: false,
        colDef: this.colDefMessage,
        isChecked: true
      },
      {
        id: 'id_delivered_count',
        name: 'Delivered',
        isDisabled: true,
        colDef: this.colDefDelivered,
        isChecked: true
      },
      {
        id: 'id_not_delivered_count',
        name: 'Not Delivered',
        isDisabled: true,
        colDef: this.colDefNotDelivered,
        isChecked: true
      },
      {
        id: 'id_total_contacts',
        name: 'Contacts',
        isDisabled: true,
        colDef: this.colDefContacts,
        isChecked: true
      },
      {
        id: 'id_approval_status',
        name: 'Approval Status',
        isDisabled: true,
        colDef: this.colDefApprovalStatus,
        isChecked: true
      },
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp,
      this.tableId
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Click View action button.
   */
  onCellviewDetailsActionbtn(event: ISMSPanelSelectedRow<ISMSPanelRowData>) {
    if (event.selectedRow) {
      const campaignDetails = {
        isShow: true,
        details: event.selectedRow,
        mode: 'details'
      };
      const dialogueRef = this.matDialogue.open(CampaignDetailsComponent, {
        maxWidth: '1300px',
        width: '93%',
        minHeight: '200px',
        data: { campaignDetails },
        disableClose: true
      });
      dialogueRef.afterClosed().subscribe((res) => {
        if (res) {
          this.dataTableService.setRefreshStatus(true, this.tableId);
        }
      });
    }
  }

  colDefAction = {
    maxWidth: 100,
    minWidth: 100,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
  };

  colDefCampaignName = {
    headerName: 'Title',
    minWidth: 50,
    field: 'campaignName',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDeffromNumber = {
    headerName: 'Phone Number',
    minWidth: 50,
    field: 'fromNumber',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefMessage = {
    headerName: 'Message',
    minWidth: 100,
    field: 'message',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefDate = {
    headerName: 'Date',
    minWidth: 70,
    field: 'created_at',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefDelivered = {
    headerName: 'Delivered Count',
    minWidth: 70,
    field: 'delivered_count',
    filter: 'agTextColumnFilter',
    floatingFilter: false
  };

  colDefNotDelivered = {
    headerName: 'Not Delivered Count',
    minWidth: 70,
    field: 'not_delivered_count',
    filter: 'agTextColumnFilter',
    floatingFilter: false
  };

  colDefContacts = {
    headerName: 'Total Contacts',
    minWidth: 70,
    field: 'total_contacts',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefApprovalStatus = {
    headerName: 'Approval Status',
    field: 'approval_status',
    suppressFloatingFilterButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    headerClass: 'fixed-size-header'
  };

  colDefGroupName = {
    headerName: 'SMS Group',
    minWidth: 50,
    field: 'name',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: (params: { data: { groupName: string } }) =>
      params?.data.groupName
  };
}
