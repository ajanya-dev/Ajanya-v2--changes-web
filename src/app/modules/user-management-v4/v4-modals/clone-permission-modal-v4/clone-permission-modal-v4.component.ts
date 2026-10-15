import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  Subject,
  Subscription
} from 'rxjs';
import { IUsersList } from 'src/app/models/user';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { ClonePermissionConfirmModalV4Component } from '../clone-permission-confirm-modal-v4/clone-permission-confirm-modal-v4.component';
import { InviteUserModalV4Component } from '../invite-user-modal-v4/invite-user-modal-v4.component';

@Component({
  selector: 'app-clone-permission-modal-v4',
  templateUrl: './clone-permission-modal-v4.component.html',
  styleUrls: ['./clone-permission-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    NgOptimizedImage
  ]
})
export class ClonePermissionModalV4Component implements OnInit, OnDestroy {
  private userManagementServiceV35 = inject(UserManagementV35Service);
  public userManagementService = inject(UserManagementService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private parentDialogRef = inject(
    MatDialogRef<ClonePermissionModalV4Component>
  );

  public userDetails: { id: string; permission: number } =
    inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  searchInput = '';
  usersList: IUsersList[] = [];
  selectedUser: IUsersList;
  checkboxArray: boolean[] = [];
  toUserArray: IUsersList[] = [];
  clientId: string;
  checkUserPermission: number;
  selectedId: IUsersList;
  autoSelection = false;
  subjectKeyUp = new Subject();
  isLoading = signal(false);

  ngOnInit() {
    this.clientId = this.userDetails.id;
    this.checkUserPermission = this.userDetails.permission;
    this.getUsersList();
    this.debounceSearch();
  }

  getUsersList(searchTerm = '') {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.userManagementService
        .getUsersList(0, searchTerm)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          const usersList = res.data;
          for (let i = 0; i < usersList.length; i += 1) {
            if (usersList[i].client_id === this.clientId) {
              this.selectedUser = usersList.splice(i, 1)[0];
              if (this.autoSelection) {
                this.selectUser(usersList[0], 0);
                this.autoSelection = false;
              }
              this.usersList = usersList;
            } else {
              this.usersList = usersList;
            }
          }
        })
    );
  }

  selectUser(selectedUserList: IUsersList, i: number, event?: MouseEvent) {
    const selectedUsers = this.toUserArray.indexOf(selectedUserList);
    if (this.checkUserPermission === 0) {
      if (this.selectedId === selectedUserList) {
        this.toUserArray = [];
      } else {
        this.selectedId = selectedUserList;
        this.toUserArray = [this.selectedId];
        for (let j = 0; j < this.checkboxArray.length; j += 1) {
          if (j !== i) {
            this.checkboxArray[j] = false;
          }
        }
      }
    } else if (selectedUsers > -1) {
      this.toUserArray.splice(selectedUsers, 1);
    } else {
      this.toUserArray.push(selectedUserList);
    }
    if (!event) this.checkboxArray[i] = !this.checkboxArray[i];
  }

  selectUserFromCheckBox(
    selectedUserList: IUsersList,
    i: number,
    event: MouseEvent
  ) {
    event.stopPropagation();
    this.selectUser(selectedUserList, i, event);
  }

  openClonePermissionsConfirmationModal() {
    if (this.toUserArray.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one user for permissions'
      });
      return;
    }
    this.parentDialogRef.close();
    this.dialog.open(ClonePermissionConfirmModalV4Component, {
      maxWidth: '550px',
      width: '93%',
      disableClose: true,
      data: {
        from: this.selectedUser,
        to: this.toUserArray,
        permission: this.checkUserPermission
      },
      panelClass: 'paddingless-modal-rounded'
    });
  }

  openNewUserModal() {
    this.userManagementServiceV35.createUserWithoutPermission.next(true);
    const dialogRef = this.dialog.open(InviteUserModalV4Component, {
      maxWidth: '480px',
      width: '95%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.autoSelection = true;
        this.getUsersList();
        this.userManagementServiceV35.loadUserDetails();
      }
    });
  }

  fetchSearchData() {
    this.subjectKeyUp.next(this.searchInput);
  }

  debounceSearch() {
    this.subscriptions.push(
      this.subjectKeyUp
        .pipe(debounceTime(1000), distinctUntilChanged())
        .subscribe(() => {
          this.usersList = [];
          this.getUsersList(this.searchInput);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
