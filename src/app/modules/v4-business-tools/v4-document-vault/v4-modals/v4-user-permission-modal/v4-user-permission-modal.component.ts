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
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  X,
  Search,
  User,
  Circle,
  Plus
} from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { NewUserModalLatestV4Component } from 'src/app/shared/modal/v4-user-modal/v4-new-user-modal-latest/v4-new-user-modal-latest.component';
import { UserManagementV35Service } from '../../../../user-management/service/user-management-v35.service';
import { IUsersList } from '../../../../../models/user';
import { DocumentVaultService } from '../../v4-services/v4-document-vault.service';
import {
  IDocumentVaultSelectedPermissions,
  IDocumentVaultSetPermissions,
  IDocumentVaultUserPermission
} from '../../v4-models/v4-document-vault.models';
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
  selector: 'app-v4-user-permission-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommonListSkeltonComponent,
    MatDialogClose,
    NgClass,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component
  ],
  templateUrl: './v4-user-permission-modal.component.html',
  styleUrl: './v4-user-permission-modal.component.scss'
})
export class V4UserPermissionModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<V4UserPermissionModalComponent>);
  private dialog = inject(MatDialog);
  public userManagementServiceV35 = inject(UserManagementV35Service);
  private alertService = inject(V4AlertService);
  private documentVaultService = inject(DocumentVaultService);
  private data = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  // Icons
  readonly XIcon = X;
  readonly SearchIcon = Search;
  readonly UserIcon = User;
  readonly CircleIcon = Circle;
  readonly PlusIcon = Plus;

  // Component state
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
    this.userManagementServiceV35.listSubscriptions.push(
      this.userManagementServiceV35.usersDetails$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) {
            this.usersDetails = res;
            this.selectedUser = this.usersDetails[0];
            if (this.selectedUser) this.getPermissions();
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
    const hasSelectedUsers = this.selectedUsers().length > 0;

    if (!hasSelectedUsers) {
      this.setPermissionsLoading.update(() => false);
      this.alertService.warningAlert({
        content: 'Please select users and set their permissions'
      });
      return;
    }

    let selectedUsersPayload = this.userPermissionsPayload().filter((user) =>
      this.selectedUsers().includes(user.userId)
    );

    if (selectedUsersPayload.length === 0 && hasSelectedUsers) {
      selectedUsersPayload = this.selectedUsers().map((userId) => ({
        userId,
        actions: []
      }));
    }

    const payloadWithPermissions = selectedUsersPayload.filter(
      (user) => user.actions.length > 0
    );
    this.setPermissions(payloadWithPermissions);
  }

  onUserCheckboxToggle(item: IUsersList, _i: number, _event: Event): void {
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

        const usersWithPermissions = this.currentPermissions
          .filter((p) => p.actions.length > 0)
          .map((p) => p.userId);
        this.selectedUsers.update((currentSelection) => [
          ...new Set([...currentSelection, ...usersWithPermissions])
        ]);
        this.userPermissionsPayload.update(() =>
          this.currentPermissions.filter((p) =>
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
      this.resetPermissions();
    }
  }

  hasPermission(permissionId: string): boolean {
    return this.permissions().some((p) => p.id === permissionId && p.checked);
  }

  onRowClick(item: IUsersList): void {
    this.selectedUser = item;
    this.setUserPermissions();
  }

  openNewUserModal() {
    const dialogRef = this.dialog.open(NewUserModalLatestV4Component, {
      maxWidth: '450px',
      width: '95%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.userManagementServiceV35.loadUserDetails(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.userManagementServiceV35.listSubscriptions.forEach((e) =>
      e.unsubscribe()
    );
  }
}
