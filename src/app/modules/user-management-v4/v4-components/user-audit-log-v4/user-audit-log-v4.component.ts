import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { PermissionCellModalV4Component } from 'src/app/modules/user-management-v4/v4-modals/permission-cell-modal-v4.component';
import { UserManagementDataV4Service } from '../../v4-services/user-management-data-v4.service';

export interface AuditLogEntry {
  created_at: string;
  created_by_name: string;
  enabled_permissions: string[];
  disabled_permissions: string[];
}

@Component({
  selector: 'app-user-audit-log-v4',
  templateUrl: './user-audit-log-v4.component.html',
  styleUrls: ['./user-audit-log-v4.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    TitleCasePipe,
    CommonButtonV4Component,
    CommonListSkeltonComponent
  ]
})
export class UserAuditLogV4Component implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private userService = inject(UserManagementV35Service);
  private userDataV4Service = inject(UserManagementDataV4Service);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  tableId = DTTableId.userPermissionAuditLog;

  auditEntries = signal<AuditLogEntry[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  maxInlinePermissions = 2;
  private userId = '';
  private userName = '';

  ngOnInit() {
    this.subscribeToUser();
  }

  private subscribeToUser() {
    this.userService.selectedUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.userId = res.client_id;
          this.userName = res.client_name;
          this.fetchAuditLog();
        }
      });
  }

  private fetchAuditLog() {
    this.loading.set(true);
    const payload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: [{ colId: 'created_at', sort: 'desc' }],
      userId: this.userId
    };

    this.v3DataTableService
      .getTableListData<AuditLogEntry>(this.tableId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res?.rowData) {
          this.auditEntries.set(res.rowData);
          this.totalCount.set(res.rowCount ?? res.rowData.length);
        }
      });
  }

  getDisplayPermissions(permissions: string[]): {
    visible: string[];
    moreCount: number;
  } {
    if (!permissions?.length) return { visible: [], moreCount: 0 };
    return {
      visible: permissions.slice(0, this.maxInlinePermissions),
      moreCount: Math.max(0, permissions.length - this.maxInlinePermissions)
    };
  }

  onViewFullLog() {
    this.userDataV4Service.openAuditLogModal(this.userId, this.userName);
  }

  onShowMorePermissions(permissions: string[], type: 'Enabled' | 'Disabled') {
    this.dialog.open(PermissionCellModalV4Component, {
      width: '400px',
      autoFocus: false,
      data: { items: permissions, type },
      panelClass: 'paddingless-modal-rounded'
    });
  }
}
