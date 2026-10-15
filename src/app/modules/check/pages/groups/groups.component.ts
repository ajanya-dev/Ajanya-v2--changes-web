import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { Subscription, finalize } from 'rxjs';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { Location, NgClass } from '@angular/common';
import { GroupPaymentsComponent } from 'src/app/modules/group-payments/components/group-payments/group-payments.component';
import { GroupPaymentsTableComponent } from 'src/app/modules/group-payments/pages/group-payments-table/group-payments-table.component';
import { IGroupCheckRowData } from '../../model/check';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    RouterLink,
    NgClass,
    GroupPaymentsComponent,
    GroupPaymentsTableComponent
  ]
})
export class GroupsComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private checkService = inject(CheckService);
  private router = inject(Router);
  private location = inject(Location);
  public alertService = inject(AlertService);

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public tableId = DTTableId.groupChecks; // Data Table Id
  subscriptions: Subscription[] = [];
  deleteLoading = signal(false);
  activeTab = 'group';

  // ACTION COMPONENT PROPERTIES
  actionComponentProp = {
    actionButton: true,
    eyeButton: false
  };

  FloatingFilterComponent = {
    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true }
    ]
  };

  cellRenderer = {
    action: [
      {
        name: 'Edit',
        id: 'id_editRow',
        icon: 'fa fa-edit'
      },
      {
        name: 'Delete',
        id: 'id_deleteRow',
        icon: 'fa fa-trash'
      },
      {
        name: 'Create Check',
        id: 'id_createCheck',
        icon: 'fa-regular fa-circle-plus'
      }
    ]
  };

  public frameworkComponents = {
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list'
      },
      {
        text: 'Create Check',
        id: 'id_create_check',
        isAddIcon: true,
        icon: ['far', 'circle-plus'],
        type: 'list'
      },
      {
        text: 'Delete',
        id: 'id_delete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        loading: this.deleteLoading()
      }
    ]
  }));

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefId,
      this.colDefDate,
      this.colDefName,
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
        id: 'date',
        name: 'Date',
        isDisabled: false,
        colDef: this.colDefDate,
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
        id: 'action',
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
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Handles the click event of the header buttons.
   * @param {string} [event.id] - The ID of the clicked button.
   * @param {IGroupCheckRowData[]} [event.selectedRows] - Selected row data.
   */
  headerButtonClick(event: {
    id?: string;
    selectedRows?: IGroupCheckRowData[];
  }) {
    const { selectedRows } = event;
    switch (event.id) {
      case 'id_new':
        this.createGroupCheck();
        break;
      case 'id_delete':
        this.deleteCheck(selectedRows as IGroupCheckRowData[]);
        break;
      case 'id_create_check':
        if (selectedRows?.length === 1) {
          this.createCheck(selectedRows[0].id);
        } else {
          this.alertService.warningAlert({ content: 'Please select a group' });
        }
        break;
      default:
        break;
    }
  }

  /**
   * @description Handles the click event of actions within a cell renderer in the component.
   * @param {string} event.id - The ID of the clicked action.
   * @param {IGroupCheckRowData} [event.selectedRows] - Selected row data.
   */
  cellRendererActionClick(event: {
    id: string;
    selectedRow: IGroupCheckRowData;
  }) {
    if (!event.id) {
      return;
    }
    const selectedItem = event.selectedRow;
    switch (event.id) {
      case 'id_editRow':
        this.editRow(selectedItem.id);
        break;
      case 'id_deleteRow':
        this.deleteCheck([selectedItem]);
        break;
      case 'id_createCheck':
        this.createCheck(selectedItem.id);
        break;
      default:
        break;
    }
  }

  /**
   * @description Navigates to the page for creating a new group check.
   */
  createGroupCheck() {
    this.router.navigate(['manage/cheque/group/create']);
  }

  /**
   * @description Deletes the selected group checks.
   * @param {IGroupCheckRowData[]} selectedRows - An array of selected group check data.
   */
  deleteCheck(selectedRows: IGroupCheckRowData[]) {
    const groupIds: string[] = selectedRows.map(
      (e: IGroupCheckRowData) => e.id
    );

    if (!groupIds?.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select a group to delete'
      });
      return;
    }
    const nGroup = groupIds.length > 1 ? 'groups' : 'group';
    const dRef = this.alertService.confirmAlert({
      content: `Are you sure you want to delete ${nGroup}?`
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.deleteLoading.set(true);
        this.subscriptions.push(
          this.checkService
            .deleteGroup(groupIds)
            .pipe(
              finalize(() => {
                this.deleteLoading.set(false);
              })
            )
            .subscribe((data) => {
              if (data?.success) {
                this.alertService.successAlert({
                  content: `${nGroup} deleted`,
                  close: true
                });
                this.v3DataTableService.refreshV3DataTable();
                this.v3DataTableService.v3RowSelectionData = [];
                this.v3DataTableService.gridApi?.deselectAll();
              }
            })
        );
      }
    });
  }

  /**
   * @description Navigates to the page for editing a group check.
   * @param {string} groupId - The ID of the group check to be edited.
   */
  editRow(groupId: string) {
    this.router.navigate(['manage/cheque/group/edit'], {
      queryParams: { id: groupId }
    });
  }

  /**
   * @description Navigates to the page for creating a new check associated with a group.
   * @param {string} groupId - The ID of the group for which the check is to be created.
   */
  createCheck(groupId: string) {
    this.router.navigate(['manage/cheque/multiplecheck/create'], {
      queryParams: { groupId }
    });
  }

  onBackButtonClick() {
    this.location.back();
    history.pushState(null, '/manage/home');
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
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    resizable: false,
    cellRenderer: () => ''
  };

  colDefDate = {
    headerName: 'Date',
    maxWidth: 300,
    minWidth: 120,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: { created_at1: string } }) =>
      params?.data.created_at1
  };

  colDefName = {
    headerName: 'Name',
    field: 'name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    maxWidth: 120,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  changeTab(tab: string) {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
