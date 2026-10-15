import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { Subscription } from 'rxjs';
import {
  IDtActionCompProp,
  IDtColumnFields
} from 'src/app/modules/data-table/model/datatable';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IContactRowData, ISMSPanelSelectedRow } from '../../model/sms-panel';
import { AddContactModalComponent } from '../../modals/add-contact-modal/add-contact-modal.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class ContactsComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private businessToolsService = inject(BusinessToolsService);
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(AlertService);
  private matDialogue = inject(MatDialog);

  public tableId = DTTableId.smsGroupContactList;
  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Add Contact',
        id: 'id_btnNew',
        isAddIcon: true,
        icon: ['fas', 'user-plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'New Message'
      }
    ]
  }));

  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent
  };

  subscriptions: Subscription[] = [];
  @Output() tableChange = new EventEmitter<number>();
  actionComponentProp: IDtActionCompProp | undefined;

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
      editButton: true,
      deleteButton: true
    };

    this.columnDefs = [
      this.colDefName,
      this.colDefPhoneNumber,
      this.colDefEmail,
      this.colDefCompany,
      this.colDefAddress1,
      this.colDefAddress2,
      this.colDefCity,
      this.colDefState,
      this.colDefZip,
      this.colDefAction
    ];

    this.columnFields = [
      {
        id: 'name',
        name: 'Name',
        isDisabled: true,
        colDef: this.colDefName,
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
        id: 'email',
        name: 'E-mail',
        isDisabled: true,
        colDef: this.colDefEmail,
        isChecked: true
      },
      {
        id: 'company',
        name: 'company',
        isDisabled: false,
        colDef: this.colDefCompany,
        isChecked: true
      },
      {
        id: 'address1',
        name: 'address1',
        isDisabled: false,
        colDef: this.colDefAddress1,
        isChecked: true
      },
      {
        id: 'address2',
        name: 'address2',
        isDisabled: false,
        colDef: this.colDefAddress2,
        isChecked: false
      },
      {
        id: 'city',
        name: 'city',
        isDisabled: false,
        colDef: this.colDefCity,
        isChecked: true
      },
      {
        id: 'state',
        name: 'state',
        isDisabled: false,
        colDef: this.colDefState,
        isChecked: true
      },
      {
        id: 'zip',
        name: 'zip',
        isDisabled: false,
        colDef: this.colDefZip,
        isChecked: false
      },
      {
        id: 'other',
        name: 'other',
        isDisabled: false,
        colDef: this.colDefOthers,
        isChecked: false
      },
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: false,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];
    this.dataTableService.setDataFromParent(
      this.columnFields,
      undefined,
      this.cellRenderer,
      this.actionComponentProp,
      this.tableId
    );
    this.v3DataTableService.resetV3DataTablePayload();
  }

  /**
   * @description Creates contact.
   */
  createContact() {
    const dialogueData = {
      mode: 'create'
    };
    const dialogref = this.matDialogue.open(AddContactModalComponent, {
      maxWidth: '550px',
      width: '93%',
      minHeight: '200px',
      data: dialogueData
    });
    dialogref.afterClosed().subscribe((res) => {
      if (res) {
        this.dataTableService.setRefreshStatus(true, this.tableId);
      }
    });
  }

  /**
   * @description Click on delete action button.
   */
  onCellDeleteActionbtn(event: ISMSPanelSelectedRow<IContactRowData>) {

    if (event.id === 'id_delete_button') {
      this.contactDelete(event.selectedRow);
    } else if (event.id === 'id_edit_button') {
      this.contactEdit(event.selectedRow);
    }
  }

  /**
   * @description Delete contact.
   */
  contactDelete(contact: IContactRowData) {
    const alertData = {
      content: 'Are you sure you want to delete this contact?'
    };
    const alert = this.alertService.confirmAlert(alertData);
    alert.afterClosed().subscribe((result) => {
      if (result)
        this.subscriptions.push(
          this.businessToolsService
            .deleteContact(contact.id)
            .subscribe((res) => {
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Deleted Successfully'
                };
                this.alertService.successAlert(data);
                this.dataTableService.setRefreshStatus(true, this.tableId);
              }
            })
        );
    });
  }

  /**
   * @description Edit contact.
   */
  contactEdit(contact: IContactRowData) {
    const dialogueData = {
      mode: 'edit',
      details: contact
    };
    const dialogref = this.matDialogue.open(AddContactModalComponent, {
      maxWidth: '650px',
      width: '93%',
      minHeight: '200px',
      data: dialogueData
    });
    dialogref.afterClosed().subscribe((res) => {
      if (res) {
        this.dataTableService.setRefreshStatus(true, this.tableId);
      }
    });
  }

  colDefName = {
    headerName: 'Name',
    minWidth: 200,
    maxWidth: 200,
    field: 'name',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefPhoneNumber = {
    headerName: 'Phone Number',
    minWidth: 200,
    maxWidth: 200,
    field: 'phone',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefEmail = {
    headerName: 'E-Mail',
    minWidth: 200,
    maxWidth: 200,
    field: 'email',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefCompany = {
    headerName: 'Company',
    minWidth: 200,
    maxWidth: 200,
    field: 'company',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefAddress1 = {
    headerName: 'Address 1',
    minWidth: 200,
    maxWidth: 200,
    field: 'address1',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefAddress2 = {
    headerName: 'Address 2',
    minWidth: 200,
    maxWidth: 200,
    field: 'address2',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefCity = {
    headerName: 'City',
    minWidth: 200,
    maxWidth: 200,
    field: 'city',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefState = {
    headerName: 'State',
    minWidth: 200,
    maxWidth: 200,
    field: 'state',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefZip = {
    headerName: 'Zip',
    minWidth: 200,
    maxWidth: 200,
    field: 'zip',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefOthers = {
    headerName: 'Other Info',
    minWidth: 200,
    maxWidth: 200,
    field: 'other',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  pinnedright: boolean | 'left' | 'right' | null | undefined = 'right';

  colDefAction = {
    maxWidth: 100,
    minWidth: 100,
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    pinned: this.pinnedright,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    tableId: this.tableId
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
