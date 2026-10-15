import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuModule } from '@angular/material/menu';

import { IUsersList } from 'src/app/models/user';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { environment } from 'src/environments/environment';
import { UserManagementDataV4Service } from '../../v4-services/user-management-data-v4.service';
import { UserActivityV4Component } from '../user-activity-v4/user-activity-v4.component';
import { UserAuditLogV4Component } from '../user-audit-log-v4/user-audit-log-v4.component';
import { UserPermissionsV4Component } from '../../v4-pages/user-permissions-v4/user-permissions-v4.component';

export enum ClientType {
  'All' = 0,
  'User',
  'Accountant',
  'Client',
  'Clerk',
  'Approver'
}

@Component({
  standalone: true,
  selector: 'app-user-details-v4',
  templateUrl: './user-details-v4.component.html',
  styleUrls: ['./user-details-v4.component.scss'],
  imports: [
    NgClass,
    LucideAngularModule,
    MatMenuModule,
    CommonButtonV4Component,
    CommonTabV4Component,
    UserActivityV4Component,
    UserAuditLogV4Component,
    UserPermissionsV4Component
  ]
})
export class UserDetailsV4Component implements OnInit {
  public userService = inject(UserManagementV35Service);
  public userDataV4Service = inject(UserManagementDataV4Service);
  private destroyRef = inject(DestroyRef);

  selectedTab$ = toObservable(this.userDataV4Service.selectedDetailsTab);

  clientType = ClientType;
  selectedUser: IUsersList | undefined;
  selectedIndex = 0;
  usersDetails: IUsersList[] = [];
  env = environment;
  showMoreMenu = false;

  loading = {
    default: false,
    accepting: undefined as undefined | number,
    sending: undefined as undefined | number,
    deleting: undefined as undefined | number
  };

  selectedTab = 'activity';
  showPermissions = this.userService.showPermissions;

  tabs: ITabItem[] = [
    { label: 'Activity', value: 'activity' },
    { label: 'Audit Log', value: 'audit-trail' }
  ];

  /** Avatar bg colors — cycles based on first character code of name */
  private avatarColors = [
    'avatar-color-0', // primary brand
    'avatar-color-1', // sky
    'avatar-color-2', // success green
    'avatar-color-3', // brand navy
    'avatar-color-4' // sky alt
  ];

  ngOnInit() {
    this.userService.selectedUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          if (
            this.selectedUser &&
            this.selectedUser.client_id !== res.client_id
          ) {
            this.userDataV4Service.showPermissions.set(false);
          }
          this.selectedUser = res;
        } else if (!this.showPermissions()) {
          this.selectedUser = undefined;
        }
      });

    this.userService.selectedIndex$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (typeof res === 'number') {
          this.selectedIndex = res;
        }
      });

    this.userService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.loading = res;
        }
      });

    this.userService.usersDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.usersDetails = res;
        }
      });
    this.selectedTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.selectedTab = res;
        }
      });
  }

  onTabChange(tab: string) {
    this.selectedTab = tab;
    this.userDataV4Service.selectedDetailsTab.set(
      tab as 'activity' | 'audit-trail' | 'permissions'
    );
  }

  goToPermissions() {
    this.userDataV4Service.showPermissions.set(true);
  }

  onPermissionsBack() {
    this.userService.showPermissions.set(false);
  }

  openEditModal() {
    if (this.selectedUser) {
      this.userDataV4Service.openEditUserModal(this.selectedUser);
    }
  }

  openWhitelistIpModal() {
    if (this.selectedUser) {
      this.userDataV4Service.openWhitelistIpModal(this.selectedUser);
    }
  }

  openClonePermissionModal() {
    if (this.selectedUser) {
      this.userDataV4Service.openClonePermissionModal(this.selectedUser);
    }
  }

  onApprove() {
    if (this.selectedUser) {
      this.userDataV4Service.onApprove(this.selectedUser, this.selectedIndex);
    }
  }

  onDelete() {
    if (this.selectedUser) {
      this.userDataV4Service.onDelete(this.selectedUser, this.selectedIndex);
    }
  }

  onResend() {
    if (this.selectedUser) {
      this.userDataV4Service.onResend(this.selectedUser, this.selectedIndex);
    }
  }

  exportPermission(type: 'xlsx' | 'csv') {
    this.userService.exportPermission(type);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0][0] || '').toUpperCase();
  }

  /** Cycles avatar background color based on first character of name */
  getAvatarColorClass(name: string | undefined): string {
    if (!name) return this.avatarColors[0];
    const charCode = name.trim().charCodeAt(0) || 0;
    return this.avatarColors[charCode % this.avatarColors.length];
  }

  /** Role badge: maps client_type to v4 badge classes */
  getRoleBadgeClass(clientType: number): string {
    switch (clientType) {
      case 1: // User
        return 'bg-v4-badge-info-bg-color text-v4-badge-info-text-color';
      case 2: // Accountant
        return 'bg-v4-badge-success-bg-color text-v4-badge-success-text-color';
      case 3: // Client
        return 'bg-v4-badge-sky-bg-color text-v4-badge-sky-text-color';
      case 4: // Clerk
        return 'bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color';
      case 5: // Approver
        return 'bg-v4-badge-approver-bg-color text-v4-badge-approver-text-color';
      default:
        return 'bg-v4-badge-info-bg-color text-v4-badge-info-text-color';
    }
  }

  /** Status badge: maps status number to v4 badge classes */
  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 1: // Active
        return 'bg-v4-badge-success-bg-color text-v4-badge-success-text-color';
      case 0: // Pending
        return 'bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color';
      case 2: // Rejected
        return 'bg-v4-badge-error-bg-color text-v4-badge-error-text-color';
      default: // Awaiting Approval
        return 'bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color';
    }
  }

  /** Status dot color class */
  getStatusDotClass(status: number): string {
    switch (status) {
      case 1:
        return 'bg-v4-badge-success-text-color';
      case 0:
        return 'bg-v4-badge-warning-text-color';
      case 2:
        return 'bg-v4-badge-error-text-color';
      default:
        return 'bg-v4-badge-neutral-text-color';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1:
        return 'Active';
      case 0:
        return 'Pending';
      case 2:
        return 'Rejected';
      default:
        return 'Awaiting Approval';
    }
  }

  onResetPassword() {
    if (!this.selectedUser) return;
    this.userDataV4Service.onResend(this.selectedUser, this.selectedIndex);
  }

  onDeactivate() {
    if (!this.selectedUser) return;
    this.userDataV4Service.onDelete(this.selectedUser, this.selectedIndex);
  }
}
