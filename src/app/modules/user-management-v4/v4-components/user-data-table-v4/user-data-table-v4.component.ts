import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RowNode } from '@ag-grid-community/core';
import { ActivatedRoute } from '@angular/router';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { IUsersList } from 'src/app/models/user';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserManagementDataV4Service } from '../../v4-services/user-management-data-v4.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { UserStatusCellV4Component } from './cell-renderers/user-status-cell-v4.component';
import { UserTypeCellV4Component } from './cell-renderers/user-type-cell-v4.component';
import { UserActionsCellV4Component } from './cell-renderers/user-actions-cell-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-user-data-table-v4',
  templateUrl: './user-data-table-v4.component.html',
  styleUrls: ['./user-data-table-v4.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, CommonButtonV4Component]
})
export class UserDataTableV4Component implements OnInit {
  private dataTableService = inject(DataTableService);
  public v3DataTableService = inject(V3DataTableService);
  private userDataV4Service = inject(UserManagementDataV4Service);
  private userManagementService = inject(UserManagementService);
  private route = inject(ActivatedRoute);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  tableId = DTTableId.users;
  selectedRows: RowNode<IUsersList>[] = [];

  headerElements: IV3DtHeaderElements = {
    buttons: [
      {
        id: 'id_delete',
        text: 'Remove Access',
        lucideIcon: 'trash-2',
        floatingBarVariant: 'filled-danger'
      }
    ]
  };

  colDefId: ICoulmnDefFields = {
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
    pinned: 'left',
    cellClass: 'flex flex-col justify-center !text-left pl-[6px]',
    headerClass: ' pl-[8px]'
  };

  colDefName = {
    headerName: 'Name',
    field: 'client_name',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colDefEmail = {
    headerName: 'Email',
    field: 'client_email',
    suppressFloatingFilterButton: true,
    minWidth: 200,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colDefType = {
    headerName: 'Type',
    field: 'client_type',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'userTypeCellComponent',
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: {
      table: 'user_management_data_table'
    },
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colDefCompany = {
    headerName: 'Company',
    field: 'company_name',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    sortable: false,
    cellRenderer: 'userStatusCellComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: {
      table: 'user_status_data_table'
    },
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colDefLastLogin = {
    headerName: 'Last Login',
    field: 'client_last_login',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colDefCreatedAt = {
    headerName: 'Created At',
    field: 'formatted_created_at',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colActionField: ICoulmnDefFields = {
    headerName: 'Action',
    field: 'action',
    minWidth: 100,
    maxWidth: 100,
    sortable: false,
    cellRenderer: 'userActionsCellComponent',
    suppressHeaderMenuButton: true
  };

  columnDefs = [
    this.colDefId,
    this.colDefName,
    this.colDefEmail,
    this.colDefType,
    this.colDefCompany,
    this.colDefStatus,
    this.colDefLastLogin,
    this.colDefCreatedAt,
    this.colActionField
  ];

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    userStatusCellComponent: UserStatusCellV4Component,
    userTypeCellComponent: UserTypeCellV4Component,
    userActionsCellComponent: UserActionsCellV4Component,
    SearchBoxComponent: V4TextFloatingFilterComponent
  };

  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'client_type',
        values: [
          { value: 1, name: 'User' },
          { value: 2, name: 'Accountant' },
          { value: 3, name: 'Client' },
          { value: 4, name: 'Clerk' },
          { value: 5, name: 'Approver' }
        ]
      },
      {
        id: 'status',
        values: [
          { value: 0, name: 'Pending' },
          { value: 1, name: 'Active' },
          { value: 2, name: 'Rejected' },
          { value: 3, name: 'Awaiting Approval' }
        ]
      }
    ]
  };

  paginationPageSize: number;
  endRow = 50;
  startRow = 0;

  ngOnInit() {
    this.initializeV3DataTable();
    this.dataTableService.setDataFromParent(
      undefined,
      this.FloatingFilterComponent
    );
    this.getRowSelectionData();
  }

  initializeV3DataTable() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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
      });
  }

  private getRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rows) => {
        this.selectedRows = rows;
      });
  }

  goToNew() {
    this.userDataV4Service.openInviteUserModal();
  }

  onHeaderButtonEvent(event: {
    id: string | number;
    selectedRows: IUsersList[];
    tableId: number;
  }) {
    switch (event.id) {
      case 'id_new':
        this.goToNew();
        break;
      case 'id_delete':
        this.onDeleteSelected();
        break;
    }
  }

  private onDeleteSelected() {
    const selectedRows = this.selectedRows.map((row) => row.data) as IUsersList[];

    if (selectedRows.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one user to remove access'
      });
      return;
    }

    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to remove access for the selected users?',
      cancelMsg: 'Cancel',
      doneMsg: 'Yes, Remove'
    });

    alert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          selectedRows.forEach((user) => {
            this.userManagementService
              .deleteSingleUser(user.client_id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res.success) {
                  this.v3DataTableService.refreshV3DataTable();
                  this.alertService.successAlert({ content: 'Access removed' });
                }
              });
          });
        }
      });
  }
}
