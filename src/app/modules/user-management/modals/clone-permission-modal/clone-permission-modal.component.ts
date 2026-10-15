import { OnDestroy, inject, Component, OnInit, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IUsersList } from 'src/app/models/user';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  Subject,
  Subscription
} from 'rxjs';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewUserModalLatestComponent } from 'src/app/shared/modal/user-modal/new-user-modal-latest/new-user-modal-latest.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons';
import { UserManagementService } from '../../../../shared/service/user/user-management.service';
import { ClonePermissionConfirmationModalComponent } from '../clone-permission-confirmation-modal/clone-permission-confirmation-modal.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';

@Component({
  selector: 'app-clone-permission-modal',
  templateUrl: './clone-permission-modal.component.html',
  styleUrls: ['./clone-permission-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    NgClass,
    MatCheckbox,
    MatDialogActions,
    CommonButtonV35Component,
    FaIconComponent,
    NgOptimizedImage
  ]
})
export class ClonePermissionModalComponent implements OnInit, OnDestroy {
  private userManagementServiceV35 = inject(UserManagementV35Service);
  public userManagementService = inject(UserManagementService);
  private dialog: MatDialog = inject(MatDialog);
  private alertService: AlertService = inject(AlertService);
  private parentDialogRef: MatDialogRef<ClonePermissionModalComponent> =
    inject(MatDialogRef);

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
  faXmark = faXmark;
  faSearch = faMagnifyingGlass;

  ngOnInit() {
    this.clientId = this.userDetails.id;
    this.checkUserPermission = this.userDetails.permission;
    this.getUsersList();
    this.debounceSearch();
  }

  getUsersList(serachTrem = '') {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.userManagementService
        .getUsersList(0, serachTrem)
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
        // If the selected checkbox is clicked again, deselect it
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        !this.selectedId;
        this.toUserArray = [];
      } else {
        // If a different checkbox is clicked, select it and deselect the previously selected checkbox
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

  /**
   * @description- To make use the click event wont propagate to parent div and fire again
   *
   */
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
    this.dialog.open(ClonePermissionConfirmationModalComponent, {
      maxWidth: '550px',
      width: '93%',
      disableClose: true,
      data: {
        from: this.selectedUser,
        to: this.toUserArray,
        permission: this.checkUserPermission
      }
    });
  }

  openNewUserModal() {
    this.userManagementServiceV35.createUserWithoutPermission.next(true);

    /**
     * @description Opens modal for adding a new user
     */

    const dialogRef = this.dialog.open(NewUserModalLatestComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false,
      disableClose: true
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
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}
