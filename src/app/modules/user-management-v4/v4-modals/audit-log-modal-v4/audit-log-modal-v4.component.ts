import {
  ColDef,
  ColGroupDef,
  ICellRendererParams
} from '@ag-grid-community/core';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PermissionCellRendererComponent } from 'src/app/modules/user-management/cellRenderer/permission-cell-renderer.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';

@Component({
  selector: 'app-audit-log-modal-v4',
  templateUrl: './audit-log-modal-v4.component.html',
  styleUrls: ['./audit-log-modal-v4.component.scss'],
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, V4DataTableComponent]
})
export class AuditLogModalV4Component implements OnInit {
  private dataTableService = inject(DataTableService);
  public v3DataTableService = inject(V3DataTableService);
  private data = inject<{ userId: string; userName: string }>(MAT_DIALOG_DATA);

  tableId = DTTableId.userPermissionAuditLog;
  userId = signal('');
  userName = '';
  columnDefs: (ColDef | ColGroupDef)[];
  columnFields: IDtColumnFields[];
  fieldsShownByDefault: string[] = [
    'created_at',
    'enabled_permissions',
    'disabled_permissions'
  ];

  frameworkComponents = {
    permissionCellRendererComponent: PermissionCellRendererComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    dateFilterComponent: V4DateFloatingFilterComponent
  };

  colDefCreate: ColDef = {
    headerName: 'Created At',
    field: 'created_at',
    minWidth: 160,
    width: 180,
    maxWidth: 190,
    flex: 0,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateFilterComponent',
    floatingFilter: true,
    filter: 'agDateColumnFilter',
    cellRenderer: (params: ICellRendererParams) => {
      const createdAt = params.value?.toString();
      if (!createdAt) {
        return '';
      }
      // Date over time, matching the Updated/Created Date columns in Payments
      // Out. This endpoint joins the two with ' - '.
      const [, date, time] =
        createdAt.match(/^(.*?)\s*-\s*(.*)$/) ?? [null, createdAt, ''];
      return `
        <div style="display:flex;flex-direction:column;gap:1px;line-height:1.25;white-space:nowrap">
          <span>${date}</span>
          ${
            time
              ? `<span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>`
              : ''
          }
        </div>
      `;
    }
  };

  colDefCreatedBy: ColDef = {
    headerName: 'Changed By',
    field: 'users.name',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    width: 160,
    maxWidth: 190,
    flex: 0,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    cellRenderer: (params: { data: { created_by_name: string } }) =>
      params?.data?.created_by_name
  };

  // The two permission columns carry the same kind of content, so they share the
  // leftover width evenly instead of the last one absorbing all of it.
  colDefEnable: ColDef = {
    headerName: 'Enabled Permissions',
    field: 'enabled_permissions',
    minWidth: 260,
    flex: 1,
    suppressHeaderMenuButton: true,
    sortable: false,
    cellRenderer: 'permissionCellRendererComponent',
    cellRendererParams: { type: 'Enabled', isV4: true }
  };

  colDefDisable: ColDef = {
    headerName: 'Disabled Permissions',
    field: 'disabled_permissions',
    minWidth: 260,
    flex: 1,
    suppressHeaderMenuButton: true,
    sortable: false,
    resizable: false,
    cellRenderer: 'permissionCellRendererComponent',
    cellRendererParams: { type: 'Disabled', isV4: true }
  };

  ngOnInit() {
    this.userName = this.data.userName;
    this.userId.set(this.data.userId);
    this.setColumnDefs();
    this.refreshTable();
  }

  private setColumnDefs() {
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
        name: 'Changed By',
        isDisabled: false,
        colDef: this.colDefCreatedBy,
        isChecked: true
      },
      {
        id: 'enabled_permissions',
        name: 'Enabled Permissions',
        isDisabled: false,
        colDef: this.colDefEnable,
        isChecked: true
      },
      {
        id: 'disabled_permissions',
        name: 'Disabled Permissions',
        isDisabled: false,
        colDef: this.colDefDisable,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(this.columnFields);
  }

  private refreshTable() {
    setTimeout(() => {
      this.v3DataTableService.resetV3DataTablePayload();
      this.v3DataTableService.refreshV3DataTable();
    }, 10);
  }
}
