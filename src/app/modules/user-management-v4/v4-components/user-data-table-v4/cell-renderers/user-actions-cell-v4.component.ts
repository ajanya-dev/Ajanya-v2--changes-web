import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IUsersList } from 'src/app/models/user';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { UserManagementDataV4Service } from '../../../v4-services/user-management-data-v4.service';

@Component({
  selector: 'app-user-actions-cell-v4',
  standalone: true,
  imports: [MatMenuModule, LucideAngularModule, MatTooltip],
  styles: [
    `
      .v4-action-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        font-size: 13px;
        color: var(--v4-main-text-color);
        font-family: var(--font-peridot), sans-serif;
        width: 100%;
      }
      .v4-action-item:hover {
        background-color: var(--v4-list-hover-color);
      }
    `
  ],
  template: `
    <div class="flex items-center justify-center w-full h-full">
      <button
        class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-v4-secondary-background-color transition-colors"
        [matMenuTriggerFor]="actionsMenu"
        matTooltip="Actions"
      >
        <lucide-icon
          name="ellipsis-vertical"
          [size]="16"
          class="text-v4-secondary-text-color"
        ></lucide-icon>
      </button>
      <mat-menu #actionsMenu="matMenu">
        <button
          mat-menu-item
          class="v4-action-item"
          (click)="onAction('permissions')"
        >
          <lucide-icon name="shield-check" [size]="14"></lucide-icon>
          <span style="font-family: var(--font-peridot), sans-serif"
            >Permissions</span
          >
        </button>
        <button
          mat-menu-item
          class="v4-action-item"
          (click)="onAction('clone')"
        >
          <lucide-icon name="copy" [size]="14"></lucide-icon>
          <span style="font-family: var(--font-peridot), sans-serif"
            >Clone Permission</span
          >
        </button>
        <button mat-menu-item class="v4-action-item" (click)="onAction('edit')">
          <lucide-icon name="square-pen" [size]="14"></lucide-icon>
          <span style="font-family: var(--font-peridot), sans-serif">Edit</span>
        </button>
        <button
          mat-menu-item
          class="v4-action-item"
          (click)="onAction('whitelist')"
        >
          <lucide-icon name="globe" [size]="14"></lucide-icon>
          <span style="font-family: var(--font-peridot), sans-serif"
            >Whitelist IP</span
          >
        </button>
        <button
          mat-menu-item
          class="v4-action-item"
          (click)="onAction('delete')"
        >
          <lucide-icon name="trash-2" [size]="14"></lucide-icon>
          <span style="font-family: var(--font-peridot), sans-serif"
            >Remove Access</span
          >
        </button>
      </mat-menu>
    </div>
  `
})
export class UserActionsCellV4Component implements ICellRendererAngularComp {
  private userDataV4Service = inject(UserManagementDataV4Service);
  private userManagementService = inject(UserManagementV35Service);
  private user: IUsersList;

  agInit(params: ICellRendererParams): void {
    this.user = params.data;
  }

  refresh(): boolean {
    return false;
  }

  onAction(action: string): void {
    switch (action) {
      case 'permissions':
        this.userManagementService.onSingleUser(this.user, 0);
        this.userDataV4Service.showPermissions.set(true);
        break;
      case 'clone':
        this.userDataV4Service.openClonePermissionModal(this.user);
        break;
      case 'edit':
        this.userDataV4Service.openEditUserModal(this.user);
        break;
      case 'whitelist':
        this.userDataV4Service.openWhitelistIpModal(this.user);
        break;
      case 'delete':
        this.userDataV4Service.onDelete(this.user, 0);
        break;
      default:
        break;
    }
  }
}
