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
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  IGroupTableRowData,
  ISMSPanelSelectedRow
} from '../../model/sms-panel';
import { GroupDetailsComponent } from '../group-details/group-details.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-group-table',
  templateUrl: './group-table.component.html',
  styleUrls: ['./group-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class GroupTableComponent implements OnInit, OnDestroy {
  private matDialogue = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private businessToolsService = inject(BusinessToolsService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New Group',
        id: 'id_btnNew',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'New Message'
      }
    ]
  }));

  public tableId = DTTableId.smsGroupList;
  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent
  };

  subscriptions: Subscription[] = [];
  @Output() tableChange = new EventEmitter<number>();
  cellRenderer = {
    action: [
      {
        name: 'Edit',
        id: 'RId_view',
        icon: 'fa-solid fa-pen-to-square'
      },
      {
        name: 'Delete',
        id: 'RId_delete',
        icon: 'fa-solid fa-trash'
      }
    ]
  };

  actionComponentProp = {
    editButton: true,
    deleteButton: true
  };

  selectedTab = 51;

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefId,
      this.colDefName,
      this.colDefNickName,
      this.colDefContacts,
      this.colDefDate,
      this.colDefAction
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
        id: 'name',
        name: 'Name',
        isDisabled: false,
        colDef: this.colDefName,
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
        id: 'nick_name',
        name: 'Nick Name',
        isDisabled: true,
        colDef: this.colDefNickName,
        isChecked: true
      },
      {
        id: 'contacts',
        name: 'Contacts Count',
        isDisabled: false,
        colDef: this.colDefContacts,
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
      undefined,
      this.cellRenderer,
      this.actionComponentProp,
      this.tableId
    );
    this.v3DataTableService.resetV3DataTablePayload();
  }

  // ------COL Defenisions -------
  colDefId = {
    minWidth: 100,
    headerName: '#',
    sortable: false,
    field: 'index',
    suppressFloatingFilterButton: true,
    maxWidth: 48,
    filter: 'agTextColumnFilter',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'fixed-size-header'
  };

  colDefName = {
    headerName: 'Name',
    minWidth: 50,
    field: 'name',
    filter: 'agTextColumnFilter',
    floatingFilter: false
  };

  colDefContacts = {
    headerName: 'Contacts Count',
    minWidth: 500,
    field: 'contacts',
    filter: 'agTextColumnFilter',
    floatingFilter: false
  };

  colDefDate = {
    headerName: 'Date',
    minWidth: 70,
    maxWidth: 200,
    field: 'created_at',
    filter: 'agTextColumnFilter',
    floatingFilter: false
  };

  colDefNickName = {
    headerName: 'Nick name',
    minWidth: 200,
    field: 'nick_name',
    filter: 'agTextColumnFilter',
    floatingFilter: false
  };

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
    tableId: this.tableId
  };

  /**
   * @description Create group.
   */
  createGroup() {
    const dialogueRef = this.matDialogue.open(GroupDetailsComponent, {
      maxWidth: '900px',
      width: '93%',
      minHeight: '200px',
      data: { mode: 'create' }
    });
    dialogueRef.afterClosed().subscribe(() => {
      this.dataTableService.setRefreshStatus(true, this.tableId);
    });
  }

  /**
   * @description Confirm alert.
   */
  openConfirmAlert(
    content: string,
    cancelMsg?: string,
    doneMsg?: string,
    title = 'Confirm'
  ) {
    const data = {
      title,
      content,
      cancelMsg: cancelMsg || 'cancel',
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * @description Click delete action button.
   */
  onCellDeleteActionbtn(event: ISMSPanelSelectedRow<IGroupTableRowData>) {
    if (event.id === 'id_delete_button') {
      const alert = this.openConfirmAlert(
        `Are you sure you want to delete this group?`
      );
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.subscriptions.push(
            this.businessToolsService
              .deleteSMSGroup(event.selectedRow.id)
              .subscribe((res) => {
                if (res.success) {
                  const data = {
                    close: true,
                    timeout: 2000,
                    title: 'Success!',
                    content: 'Group Deleted Successfully'
                  };
                  this.alertService.successAlert(data);
                  this.dataTableService.setRefreshStatus(true, this.tableId);
                }
              })
          );
        }
      });
    } else if (event.id === 'id_edit_button') {
      if (event.selectedRow) {
        const dialogueRef = this.matDialogue.open(GroupDetailsComponent, {
          maxWidth: '900px',
          width: '93%',
          minHeight: '200px',
          data: { mode: 'details', groupData: event.selectedRow },
          disableClose: true
        });
        dialogueRef.afterClosed().subscribe(() => {
          this.dataTableService.setRefreshStatus(true, this.tableId);
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
