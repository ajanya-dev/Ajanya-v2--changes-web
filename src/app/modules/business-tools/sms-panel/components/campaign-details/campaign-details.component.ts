import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { SMSPanelDtviewDetailsComponent } from '../sms-panel-dtview-details/sms-panel-dtview-details.component';
import { ICampaignRowData, ISMSPanelRowData } from '../../model/sms-panel';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-campaign-details',
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.scss'],
  standalone: true,
  imports: [FaIconComponent, V3DataTableComponent]
})
export class CampaignDetailsComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private businessToolsService = inject(BusinessToolsService);
  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private dialogueRef = inject(MatDialogRef<CampaignDetailsComponent>);
  private data: {
    campaignDetails: {
      isShow: boolean;
      details: ISMSPanelRowData;
      mode: string;
    };
  } = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  isLoading: boolean;

  files: File[];
  fileName: string;
  isGroupCreated: boolean;
  logsArray = [];
  campaignDetails: ISMSPanelRowData;
  faXmark = faXmark;

  public tableId = DTTableId.smsGroupCampaignLogList;
  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Delete Contacts',
        id: 'id_contactDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        toolTip: 'Delete Contacts From Group'
      }
    ]
  }));

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
  }

  /**
   * @description Initialise column fiels and header elements.
   */
  initialize() {
    this.campaignDetails = this.data?.campaignDetails?.details;
    this.columnDefs = [
      this.colDefId,
      this.colDefPhoneNumber,
      this.colDefStatus,
      this.colDefSMSCharge,
      this.colDefMoreDetails
    ];
    this.columnFields = [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
      {
        id: 'phone',
        name: 'Phone Number',
        isDisabled: false,
        colDef: this.colDefPhoneNumber,
        isChecked: true
      },
      {
        id: 'delivered',
        name: 'Date',
        isDisabled: true,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'groupName',
        name: 'SMS Charge',
        isDisabled: true,
        colDef: this.colDefSMSCharge,
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
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      undefined,
      undefined,
      this.tableId
    );
  }

  /**
   * @description Click on header button.
   */
  onHeaderBtn(event: { id: string; selectedRows: ICampaignRowData[] }): void {
    const { selectedRows } = event;

    if (event?.id === 'id_contactDelete') {
      this.deleteContacts(selectedRows);
    }
  }

  /**
   * @description Delete contacts.
   */
  deleteContacts(selectedRows: ICampaignRowData[]) {
    const contactIds: string[] = [];
    selectedRows.forEach((ele) => {
      contactIds.push(ele.contact_id);
    });
    const sendingData = {
      ids: contactIds
    };
    this.subscriptions.push(
      this.businessToolsService.deleteContacts(sendingData).subscribe((res) => {
        if (res.success) {
          const data = {
            close: true,
            timeout: 2000,
            title: 'Success!',
            content: 'Contacts deleted successfully'
          };
          this.alertService.successAlert(data);
        }
      })
    );
  }

  /**
   * @description Close page.
   */
  close() {
    this.dialogueRef.close();
  }

  colDefPhoneNumber = {
    headerName: 'Phone Number',
    minWidth: 50,
    maxWidth: 200,
    field: 'phone',
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
    field: 'not_delivery_reason',
    minWidth: 100,
    floatingFilter: true,
    cellStyle: () => ({ width: '100%' })
  };

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
