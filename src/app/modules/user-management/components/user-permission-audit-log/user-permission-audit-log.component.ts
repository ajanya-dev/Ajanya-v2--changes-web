import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subject, takeUntil } from 'rxjs';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { PermissionCellRendererComponent } from '../../cellRenderer/permission-cell-renderer.component';

@Component({
  selector: 'app-user-permission-audit-log',
  standalone: true,
  imports: [V3DataTableComponent],
  templateUrl: './user-permission-audit-log.component.html',
  styleUrl: './user-permission-audit-log.component.scss'
})
export class UserPermissionAuditLogComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  public userManagementServiceV35 = inject(UserManagementV35Service);

  public tableId = DTTableId.userPermissionAuditLog;
  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  frameworkComponents = {
    permissionCellRendererComponent: PermissionCellRendererComponent,
    dateRangeV35Component: DataRangeV35Component,
    SearchBoxComponent: DtSearchBoxComponent
  };

  userId = signal('');
  destroy$ = new Subject();
  fieldsShownByDefault: string[] = ['created_at','enabled_permissions','disabled_permissions'];

  ngOnInit() {
    this.setColumnDefs();
    this.getUserId();
  }

  getUserId() {
    this.userManagementServiceV35.selectedUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.userId.set(res.client_id);
          setTimeout(() => {
            this.v3DataTableService.resetV3DataTablePayload();
            this.v3DataTableService.refreshV3DataTable();
          }, 10);
        }
      });
  }

  setColumnDefs() {
    this.columnDefs = [
      this.colDefCreate,
      this.colDefCreatedBy,
      this.colDefEnable,
      this.colDefDisable
    ];

    this.columnFields = [
      {
        id: 'colDefCreate',
        name: 'Created At',
        isDisabled: true,
        colDef: this.colDefCreate,
        isChecked: true
      },
      {
        id: 'created_by_name',
        name: 'Created By',
        isDisabled: false,
        colDef: this.colDefCreatedBy,
        isChecked: true
      },
      {
        id: 'enabled_permissions',
        name: 'Enabled Permission',
        isDisabled: false,
        colDef: this.colDefEnable,
        isChecked: true
      },
      {
        id: 'disabled_permissions',
        name: 'Disabled Permission',
        isDisabled: false,
        colDef: this.colDefDisable,
        isChecked: true
      }
    ];
    this.dataTableService.setDataFromParent(this.columnFields);
  }

  colDefCreate = {
    headerName: 'Created At',
    field: 'created_at',
    minWidth: 60,
    maxWidth: 150,
    suppressMenu: true,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    filter: 'agDateColumnFilter',
    floatingFilterComponentParams: {
      suppressFilterButton: true
    }
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'users.name',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    cellRenderer: (params: { data: { created_by_name: string } }) =>
      params?.data?.created_by_name
  };

  colDefEnable: ColDef = {
    headerName: 'Enabled Permission',
    field: 'enabled_permissions',
    minWidth: 600,
    suppressMenu: true,
    sortable: false,
    cellRenderer: 'permissionCellRendererComponent',
    cellRendererParams: {
      type: 'Enabled'
    }
  };

  colDefDisable: ColDef = {
    headerName: 'Disabled Permission',
    field: 'disabled_permissions',
    minWidth: 600,
    suppressMenu: true,
    sortable: false,
    cellRenderer: 'permissionCellRendererComponent',
    cellRendererParams: {
      type: 'Disabled'
    }
  };

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
