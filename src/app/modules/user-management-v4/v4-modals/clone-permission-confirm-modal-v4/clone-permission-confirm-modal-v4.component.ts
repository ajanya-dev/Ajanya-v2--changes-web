import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { NgOptimizedImage } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, finalize } from 'rxjs';
import { ICloneConfirmPermision, IUsersList } from 'src/app/models/user';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-clone-permission-confirm-modal-v4',
  templateUrl: './clone-permission-confirm-modal-v4.component.html',
  styleUrls: ['./clone-permission-confirm-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    NgOptimizedImage
  ]
})
export class ClonePermissionConfirmModalV4Component implements OnInit, OnDestroy {
  public clonePermissionUserData: ICloneConfirmPermision = inject(MAT_DIALOG_DATA);
  private alertService = inject(V4AlertService);
  public userManagementService = inject(UserManagementService);
  public dialogRef = inject(MatDialogRef<ClonePermissionConfirmModalV4Component>);

  subscriptions: Subscription[] = [];
  permissionCloneFromData: IUsersList;
  permisFromIds: string[] = [];
  cloneIds: string[] = [];
  userTotalCount: number;
  checkUserGotPermission: number;
  toUserId: string;
  selectedUserData: string;
  saveButtonLoading = false;

  constructor() {
    this.permissionCloneFromData = this.clonePermissionUserData.from as unknown as IUsersList;
    this.permisFromIds.push(this.permissionCloneFromData.client_id);
    this.checkUserGotPermission = this.clonePermissionUserData.permission;
  }

  ngOnInit(): void {
    this.userTotalCount = this.clonePermissionUserData.to.length - 3;
    this.clonePermissionUserData.to.forEach((cloneUserValues: IUsersList) => {
      this.toUserId = cloneUserValues.client_id;
      this.cloneIds.push(cloneUserValues.client_id);
    });
    this.selectedUserData = this.clonePermissionUserData.from.client_id;
  }

  cloneUserPermissions() {
    this.saveButtonLoading = true;
    if (this.checkUserGotPermission === 0) {
      const payload = { cloneToIds: this.permisFromIds };
      this.subscriptions.push(
        this.userManagementService
          .cloneUserIfZeroPermissions(this.toUserId, payload)
          .pipe(finalize(() => { this.saveButtonLoading = false; }))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.successAlert({ content: res.message });
                this.dialogRef.close(true);
              }
            },
            error: () => { this.saveButtonLoading = false; }
          })
      );
    } else {
      const payload = { cloneToIds: this.cloneIds };
      this.subscriptions.push(
        this.userManagementService
          .cloneUserPermissions(this.selectedUserData, payload)
          .pipe(finalize(() => { this.saveButtonLoading = false; }))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.successAlert({ content: res.message });
                this.dialogRef.close(true);
              }
            },
            error: () => { this.saveButtonLoading = false; }
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
