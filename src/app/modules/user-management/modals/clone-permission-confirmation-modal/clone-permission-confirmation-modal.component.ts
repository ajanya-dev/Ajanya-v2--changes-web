import { OnDestroy, Component, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ICloneConfirmPermision, IUsersList } from 'src/app/models/user';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { Subscription, finalize } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-clone-permission-confirmation-modal',
  templateUrl: './clone-permission-confirmation-modal.component.html',
  styleUrls: ['./clone-permission-confirmation-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatDialogActions,
    CommonButtonV35Component,
    FaIconComponent,
    NgOptimizedImage
  ]
})
export class ClonePermissionConfirmationModalComponent
  implements OnInit, OnDestroy
{
  public clonePermissionUserData: ICloneConfirmPermision =
    inject(MAT_DIALOG_DATA);

  private alertService: AlertService = inject(AlertService);
  public userManagementService: UserManagementService = inject(
    UserManagementService
  );

  public dialogRef: MatDialogRef<ClonePermissionConfirmationModalComponent> =
    inject(MatDialogRef);

  subscriptions: Subscription[] = [];
  permissionCloneFromData: IUsersList;
  permisFromIds: string[] = [];
  cloneIds: string[] = [];
  userTotalCount: number;
  checkUserGotPermission: number;
  toUserId: string;
  selectedUserData: string;
  saveButtonLoading: boolean = false;
  faXmark = faXmark;

  constructor() {
    this.permissionCloneFromData = this.clonePermissionUserData.from;
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
      const clonePermissionsPayload = {
        cloneToIds: this.permisFromIds
      };
      this.subscriptions.push(
        this.userManagementService
          .cloneUserIfZeroPermissions(this.toUserId, clonePermissionsPayload)
          .pipe(
            finalize(() => {
              this.saveButtonLoading = false;
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                const successMessage = {
                  content: res.message,
                  close: true,
                  timeout: 1500
                };
                this.alertService.successAlert(successMessage);
                this.dialogRef.close();
              }
            },
            error: () => {
              this.saveButtonLoading = false;
            }
          })
      );
    } else {
      const clonePermissionsPayload = {
        cloneToIds: this.cloneIds
      };

      this.subscriptions.push(
        this.userManagementService
          .cloneUserPermissions(this.selectedUserData, clonePermissionsPayload)
          .pipe(
            finalize(() => {
              this.saveButtonLoading = false;
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                const successMessage = {
                  content: res.message,
                  close: true,
                  timeout: 1500
                };
                this.alertService.successAlert(successMessage);
                this.dialogRef.close();
              }
            },
            error: () => {
              this.saveButtonLoading = false;
            }
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}
