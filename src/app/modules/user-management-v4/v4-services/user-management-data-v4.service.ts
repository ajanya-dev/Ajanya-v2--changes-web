import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { IUsersList } from 'src/app/models/user';
import { InviteUserModalV4Component } from '../v4-modals/invite-user-modal-v4/invite-user-modal-v4.component';
import { EditUserModalV4Component } from '../v4-modals/edit-user-modal-v4/edit-user-modal-v4.component';
import { ClonePermissionModalV4Component } from '../v4-modals/clone-permission-modal-v4/clone-permission-modal-v4.component';
import { UserWhitelistIpV4Component } from '../v4-modals/user-whitelist-ip-v4/user-whitelist-ip-v4.component';
import { AuditLogModalV4Component } from '../v4-modals/audit-log-modal-v4/audit-log-modal-v4.component';

@Injectable({
  providedIn: 'root'
})
export class UserManagementDataV4Service {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private alertService = inject(V4AlertService);
  public userManagementV35Service = inject(UserManagementV35Service);
  private userManagementService = inject(UserManagementService);
  private destroyRef = inject(DestroyRef);

  selectedDetailsTab = signal<'activity' | 'audit-trail' | 'permissions'>(
    'activity'
  );

  showPermissions = signal(false);

  openInviteUserModal(): void {
    const dialogRef = this.dialog.open(InviteUserModalV4Component, {
      maxWidth: '480px',
      width: '95%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => result === 'success'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.userManagementV35Service.loadUserDetails(true);
      });
  }

  openEditUserModal(user: IUsersList): void {
    const dialogRef = this.dialog.open(EditUserModalV4Component, {
      maxWidth: '480px',
      width: '95%',
      autoFocus: false,
      disableClose: true,
      data: user,
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.userManagementV35Service.loadUserDetails();
      });
  }

  openClonePermissionModal(user: IUsersList): void {
    const dialogRef = this.dialog.open(ClonePermissionModalV4Component, {
      maxWidth: '550px',
      width: '93%',
      disableClose: true,
      data: {
        id: user.client_id,
        permission: user.has_permission
      },
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.userManagementV35Service.loadUserDetails();
      });
  }

  openWhitelistIpModal(user: IUsersList): void {
    this.dialog.open(UserWhitelistIpV4Component, {
      maxWidth: '500px',
      width: '95%',
      autoFocus: false,
      data: { clientId: user.client_id },
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  openAuditLogModal(userId: string, userName: string): void {
    this.dialog.open(AuditLogModalV4Component, {
      maxWidth: '1300px',
      width: '95%',
      maxHeight: '95vh',
      autoFocus: false,
      data: { userId, userName },
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  navigateToPermissions(clientId: string): void {
    this.router.navigate([
      `/v4/manage/manage-users/add-permissions/${clientId}`
    ]);
  }

  onApprove(user: IUsersList, index: number): void {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to approve?',
      cancelMsg: 'Cancel',
      doneMsg: 'Ok'
    });
    alert
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        tap(() => {
          this.userManagementV35Service.loading.accepting = index;
          this.userManagementV35Service.loading$.next({
            ...this.userManagementV35Service.loading,
            accepting: index
          });
        }),
        switchMap(() => this.userManagementService.approveUser(user.client_id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.userManagementV35Service.loading.accepting = undefined;
        this.userManagementV35Service.loading$.next({
          ...this.userManagementV35Service.loading,
          accepting: undefined
        });
        if (response?.success) {
          this.alertService.successAlert({
            content: 'Approved Successfully.'
          });
          this.navigateToPermissions(response.data.userId);
          this.userManagementV35Service.loadUserDetails();
        }
      });
  }

  onResend(user: IUsersList, index: number): void {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to resend?',
      cancelMsg: 'Cancel',
      doneMsg: 'Ok'
    });
    alert
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        tap(() => {
          this.userManagementV35Service.loading.sending = index;
          this.userManagementV35Service.loading$.next({
            ...this.userManagementV35Service.loading,
            sending: index
          });
        }),
        switchMap(() =>
          this.userManagementService.resendInvite(user.client_id)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.userManagementV35Service.loading.sending = undefined;
        this.userManagementV35Service.loading$.next({
          ...this.userManagementV35Service.loading,
          sending: undefined
        });
        if (response?.success) {
          this.alertService.successAlert({
            content: 'Successfully sent.'
          });
          this.userManagementV35Service.loadUserDetails();
        }
      });
  }

  onDelete(user: IUsersList, index: number): void {
    const alert = this.alertService.confirmAlert({
      content:
        "Are you sure you want to remove this user's access? This action will revoke all permissions and remove all access to your account for this user.",
      cancelMsg: 'Cancel',
      doneMsg: 'Ok'
    });
    alert
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        tap(() => {
          this.userManagementV35Service.loading.deleting = index;
          this.userManagementV35Service.loading$.next({
            ...this.userManagementV35Service.loading,
            deleting: index
          });
        }),
        switchMap(() =>
          this.userManagementService.deleteSingleUser(user.client_id)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.userManagementV35Service.loading.deleting = undefined;
        this.userManagementV35Service.loading$.next({
          ...this.userManagementV35Service.loading,
          deleting: undefined
        });
        if (response.success) {
          this.alertService.successAlert({
            content: 'Access removed successfully'
          });
          this.userManagementV35Service.loadUserDetails();
        }
      });
  }
}
