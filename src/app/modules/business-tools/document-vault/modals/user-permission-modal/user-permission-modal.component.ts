import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { 
  faXmark, 
  faMagnifyingGlass,
  faCheckCircle,
  faExclamationCircle,
  faCircle 
} from '@fortawesome/pro-solid-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UserManagementV35Service } from '../../../../user-management/service/user-management-v35.service';
import { IUsersList } from '../../../../../models/user';
import { DocumentVaultService } from '../../services/document-vault.service';
import { IDocumentVaultSelectedPermissions, IDocumentVaultSetPermissions, IDocumentVaultUserPermission } from '../../models/document-vault.models';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';

interface Permission {
  id: string;
  name: string;
  description: string;
  checked: boolean;
}

export enum ClientType {
  'All' = 0,
  'User',
  'Accountant',
  'Client',
  'Clerk',
  'Approver'
}

@Component({
  selector: 'app-user-permission-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommonListSkeltonComponent,
    MatDialogClose,
    NgClass,
    MatTooltip,
    FaIconComponent,
    CommonButtonV35Component
  ],
  templateUrl: './user-permission-modal.component.html',
  styleUrl: './user-permission-modal.component.scss'
})
export class UserPermissionModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<UserPermissionModalComponent>);
  public userManagementServiceV35 = inject(UserManagementV35Service);
  private alertService = inject(AlertService);
  private documentVaultService = inject(DocumentVaultService);
  private data = inject(MAT_DIALOG_DATA);

  // Icons
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faCheckCircle = faCheckCircle;
  faExclamationCircle = faExclamationCircle;
  faCircle = faCircle;

  // Component state from UserManagementListV35Component
  clientType = ClientType;
  usersDetails: IUsersList[];
  selectedUser: IUsersList;
  searchTerm = signal('');
  selectedUsers = signal<string[]>([]);
  userPermissions = signal<IDocumentVaultUserPermission[]>([]);
  currentPermissions: IDocumentVaultSetPermissions[] = [];
  userPermissionsPayload = signal<IDocumentVaultSetPermissions[]>([]);
  loadingPermissions = signal(false);
  setPermissionsLoading = signal(false);

  loading = {
    default: false,
    buttonDisabling: false,
    accepting: undefined as undefined | number,
    sending: undefined as undefined | number,
    rejecting: undefined as undefined | number,
    deleting: undefined as undefined | number
  };

  private destroyRef = inject(DestroyRef);

  permissions = signal<Permission[]>([
    {
      id: 'create',
      name: 'Add Documents',
      description: 'Enable file uploads and folder creation',
      checked: false
    },
    {
      id: 'update',
      name: 'Edit Files & Folders',
      description: 'Allow renaming files and folders',
      checked: false
    },
    {
      id: 'read',
      name: 'View Documents',
      description: 'Allow viewing files and folder contents',
      checked: false
    },
    {
      id: 'delete',
      name: 'Delete Documents',
      description: 'Allow files and folder deletion',
      checked: false
    }
  ]);

  ngOnInit(): void {
    // Subscribe to user management service data like UserManagementListV35Component
    this.userManagementServiceV35.listSubscriptions.push(
      this.userManagementServiceV35.usersDetails$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) {
            this.usersDetails = res;
            this.selectedUser = this.usersDetails[0];
            if(this.selectedUser) this.getPermissions();
          }
        }),
      this.userManagementServiceV35.selectedUser$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) {
            this.selectedUser = res;
          }
        }),
      this.userManagementServiceV35.loading$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) {
            this.loading = res;
          }
        })
    );

    // Load user details if not already loaded
    if (
      !this.userManagementServiceV35.selectedUser$.value ||
      this.userManagementServiceV35.usersSearchTerm
    ) {
      this.userManagementServiceV35.usersSearchTerm = '';
      this.userManagementServiceV35.loadUserDetails();
    }
  }

  filteredUsers() {
    const searchValue = this.searchTerm().toLowerCase();
    if (!searchValue || !this.usersDetails) return this.usersDetails || [];

    return this.usersDetails.filter(
      (user) =>
        user.client_name.toLowerCase().includes(searchValue) ||
        user.client_email.toLowerCase().includes(searchValue)
    );
  }

  onSingleUser(item: IUsersList, i: number): void {
    this.userManagementServiceV35.onSingleUser(item, i);
  }

  onSearchUser(searchTerm: string): void {
    this.userManagementServiceV35.onSearchUser(searchTerm);
  }

  onResend(item: IUsersList, i: number): void {
    this.userManagementServiceV35.onResend(item, i);
  }

  onApprove(item: IUsersList, i: number): void {
    this.userManagementServiceV35.onApprove(item, i);
  }

  onDelete(item: IUsersList, i: number): void {
    this.userManagementServiceV35.onDelete(item, i);
  }

  onPermissionChange(permissionId: string, event: Event): void {
    if (!this.selectedUser) return;

    // Check if current user is selected
    if (!this.isSelected(this.selectedUser)) {
      const checkedElement = event.target as HTMLInputElement;
      const { checked } = checkedElement;
      checkedElement.checked = !checked;
      this.alertService.warningAlert({
        content: 'Please select the user before changing permissions'
      });
      return;
    }

    this.permissions.update((perms) =>
      perms.map((p) =>
        p.id === permissionId ? { ...p, checked: !p.checked } : p
      )
    );

    const actions = [
      ...new Set(
        this.permissions()
          .filter((p) => p.checked)
          .map((p) => p.id)
      )
    ];
    const updatedPayload = {
      userId: this.selectedUser.client_id.toString(),
      actions: [...actions]
    };
  
      this.userPermissionsPayload.update((current) => {
        const isExisting = current.findIndex(
          (up) => up.userId === this.selectedUser.client_id.toString()
        );
        if (isExisting > -1) {
          const updated = [...current];
          updated[isExisting] = updatedPayload;
          return updated;
        }
        return [...current, updatedPayload];
      });
  }

  resetPermissions(): void {
    this.permissions.update((permissions) =>
      permissions.map((p) => ({ ...p, checked: false }))
    );
  }

  saveChanges(): void {
    this.setPermissionsLoading.update(() => true);

    // Check if users are selected
    const hasSelectedUsers =
    this.selectedUsers().length > 0;

    if (!hasSelectedUsers) {
      this.setPermissionsLoading.update(() => false);
      this.alertService.warningAlert({
        content: 'Please select users and set their permissions'
      });
      return;
    }

    // Filter payload to only selected users with permissions
    let selectedUsersPayload = this.userPermissionsPayload().filter(
      (user) =>
        this.selectedUsers().includes(user.userId)
    );

    // If no payload entries exist, create them with empty actions for all selected users
    if (selectedUsersPayload.length === 0 && hasSelectedUsers) {
      const allUserIds = this.selectedUsers();

      selectedUsersPayload = allUserIds.map((userId) => ({
        userId,
        actions: []
      }));
    }

    // Filter out entries with empty actions arrays (backend requirement)
    const payloadWithPermissions = selectedUsersPayload.filter(
      (user) => user.actions.length > 0 // Only include users with at least one permission
    );

    this.setPermissions(payloadWithPermissions); // Pass filtered payload
  }

  onUserCheckboxToggle(item: IUsersList, i: number, event: Event): void {
    // Handle user selection
    const userId = item.client_id.toString();
    const currentSelection = this.selectedUsers();

    if (currentSelection.includes(userId)) {
      this.selectedUsers.update((users) => users.filter((id) => id !== userId));
    } else {
      this.selectedUsers.update((users) => [...users, userId]);
    }
  }

  getPermissions(): void {
    this.loadingPermissions.update(() => true);
    this.documentVaultService
      .getPermissions(this.data.folderId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingPermissions.update(() => false))
      )
      .subscribe((res) => {
        this.userPermissions.update(() => res.data);
        this.currentPermissions = res.data.map((p) => ({
          userId: p.userId.toString(),
          actions: Object.keys(p.selectedPermissions).filter(
            (key) =>
              p.selectedPermissions[
                key as keyof IDocumentVaultSelectedPermissions
              ]
          )
        }));

        // Auto-select users who have existing permissions
        const usersWithPermissions = this.currentPermissions
          .filter((p) => p.actions.length > 0) // Only users with at least one permission
          .map((p) => p.userId);

        // Update selectedUsers to include users with existing permissions
        this.selectedUsers.update((currentSelection) => {
          // Merge existing selection with users who have permissions
          const merged = [
            ...new Set([...currentSelection, ...usersWithPermissions])
          ];
          return merged;
        });

        // Initialize payload with current permissions for selected users only
        this.userPermissionsPayload.update(() =>
          this.currentPermissions.filter(
            (p) =>
              this.selectedUsers().includes(p.userId)
          )
        );

        if (this.selectedUser) {
          this.setUserPermissions();
        }
      });
  }

  setPermissions(payload?: IDocumentVaultSetPermissions[]): void {
    const permissionsToSend = payload || this.userPermissionsPayload();
    this.documentVaultService
      .setPermissions(this.data.folderId, permissionsToSend)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setPermissionsLoading.update(() => false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close();
          this.alertService.successAlert({
            title: 'Success',
            content: 'Permissions set successfully'
          });
        }
      });
  }

  isSelected(item: IUsersList): boolean {
    return this.selectedUsers().includes(item.client_id.toString());
  }

  setUserPermissions(): void {
    if (!this.selectedUser) return;

    // Priority 1: Check local unsaved changes first
    const localPermissions = this.userPermissionsPayload().find(
      (p) => p.userId === this.selectedUser.client_id.toString()
    );
    if (localPermissions !== undefined) {
      this.permissions.update((permissions) =>
        permissions.map((p) => ({
          ...p,
          checked: localPermissions.actions.includes(
            p.id as keyof IDocumentVaultSelectedPermissions
          )
        }))
      );
      return;
    }

    // Priority 2: Check saved permissions from API
    const currentUser = this.currentPermissions.find(
      (p) => p.userId === this.selectedUser.client_id.toString()
    );

    if (currentUser) {
      this.permissions.update((permissions) =>
        permissions.map((p) => ({
          ...p,
          checked: !!currentUser.actions.includes(
            p.id as keyof IDocumentVaultSelectedPermissions
          )
        }))
      );
    } else {
      // Only reset if truly no permissions exist
      this.resetPermissions();
    }
  }

  hasPermission(permissionId: string): boolean {
    return this.permissions().some((p) => p.id === permissionId && p.checked);
  }

  onRowClick(item: IUsersList): void {
    // ONLY handle user selection for permission display
    this.selectedUser = item;

    // Display permissions for this user (no modification)
    this.setUserPermissions();
  }

  openNewUserModal() {
    this.userManagementServiceV35.openNewUserModal();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.userManagementServiceV35.listSubscriptions.forEach((e) =>
      e.unsubscribe()
    );
  }
}