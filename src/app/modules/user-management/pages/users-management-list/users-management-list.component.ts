import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { IUsersList, StatusActions } from 'src/app/models/user';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Router } from '@angular/router';
import { NewUserModalLatestComponent } from 'src/app/shared/modal/user-modal/new-user-modal-latest/new-user-modal-latest.component';
import { UserWhitelistIpComponent } from '../../components/user-whitelist-ip/user-whitelist-ip.component';
import { ClonePermissionModalComponent } from '../../modals/clone-permission-modal/clone-permission-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { EditUserModalComponent } from 'src/app/shared/modal/user-modal/edit-user-modal/edit-user-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { UsersActivityComponent } from '../../components/users-activity/users-activity.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import {
  NgIf,
  NgFor,
  NgSwitch,
  NgSwitchCase,
  NgClass,
  NgSwitchDefault,
  TitleCasePipe
} from '@angular/common';

export enum clientType {
  'All' = 0,
  'User',
  'Accountant',
  'Client',
  'Clerk',
  'Approver'
}
/**
 * @description Component for managing users.
 */
@Component({
  selector: 'app-users-management-list',
  templateUrl: './users-management-list.component.html',
  styleUrls: ['./users-management-list.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    MatMenuTrigger,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgClass,
    NgSwitchDefault,
    MatTooltip,
    MatMenu,
    MatMenuItem,
    UsersActivityComponent,
    TitleCasePipe
  ]
})
export class UsersManagementListComponent implements OnInit, OnDestroy {
  userTypes = [
    { value: 0, name: 'All' },
    { value: 1, name: 'User' },
    { value: 2, name: 'Accountant' },
    { value: 3, name: 'Client' },
    { value: 4, name: 'Clerk' },
    { value: 5, name: 'Approver' }
  ];

  listMenu = [
    {
      title: 'Permissions',
      icon: 'fal fa-pencil-alt',
      id: 'RId_permission'
    },
    {
      title: 'Clone Permission',
      icon: 'fa-regular fa-clone',
      id: 'RId_clone'
    },
    {
      title: 'Edit',
      icon: 'fa-regular fa-pen-to-square',
      id: 'RId_edit'
    },
    {
      title: 'Delete',
      icon: 'fa fa-trash',
      id: 'RId_delete'
    },
    {
      title: 'Whitelist IP',
      icon: 'fa-regular fa-location-dot',
      id: 'RId_whitelist_ip'
    }
  ];

  subscriptions: Subscription[] = [];
  usersDetails: IUsersList[];
  clientType = clientType;
  timoutId: number;
  usersSearchTerm = '';
  userTypeFilter = 0;
  notFoundUser = '';
  isHamaspik = false;
  companyType: string;

  selectedUser: IUsersList;
  selectedIndex: number;

  loading = {
    default: false,
    buttonDisabling: false,
    accepting: undefined as undefined | number,
    sending: undefined as undefined | number,
    rejecting: undefined as undefined | number,
    deleting: undefined as undefined | number
  };

  constructor(
    private _userManagementService: UserManagementService,
    private _alertService: AlertService,
    private route: Router,
    private dialog: MatDialog,
    private _localStorageService: LocalStorageService,
    private headerService: HeaderService,
    private companyService: CompanyManagementService
  ) {}

  ngOnInit(): void {
    this.loadUserDetails();
    this.checkEnabledPlugins();
    this.companyType = this.companyService.getActiveCompanyType();
  }

  checkEnabledPlugins() {
    this.subscriptions.push(
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes('enterprise-hamaspik-check-import')) {
            this.isHamaspik = true;
          }
        }
      })
    );
  }

  /**
   * @description Gets and sets the details of user in 'userDetails' property.
   */
  loadUserDetails(): void {
    this.loading.default = true;
    this.subscriptions.push(
      this._userManagementService
        .getUsersList(this.userTypeFilter, this.usersSearchTerm)
        .pipe(
          finalize(() => {
            this.loading.default = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.usersDetails = res.data;
            setTimeout(() => {
              this.singleUserSelected();
            }, 200);
          }
        })
    );
  }

  /**
   * @description Method to set the initially selected user (first user in the list) and apply 'active' styles.
   */
  singleUserSelected(): void {
    const singleCard: NodeListOf<HTMLDivElement> =
      document.querySelectorAll('#singleCard');
    singleCard[0]?.classList.add('active');
    this.selectedUser = this.usersDetails[0];
    this.selectedIndex = 0;
  }

  /**
   * @description Method to set the selected the user and apply 'active' styles.
   * @param singleDiv - The selected HTML div element
   * @param item - The selected user
   * @param i - index or position of the user in the list
   */
  onSingleUser(singleDiv: HTMLDivElement, item: IUsersList, i: number): void {
    const singleCard: NodeListOf<HTMLDivElement> =
      document.querySelectorAll('#singleCard');
    singleCard?.forEach((s) => {
      if (s.classList.contains('active')) s.classList.remove('active');
    });
    singleDiv.classList.toggle('active');
    this.selectedUser = item;
    this.selectedIndex = i;
  }

  /**
   * @description Method to resend the invite to the user
   * @param item - The selected user
   * @param i - position of user in the list
   */
  onResend(item: IUsersList, i: number): void {
    const alert = this.openConfirmAlert('Are you sure you want to resend?');
    alert.afterClosed().subscribe((res) => {
      if (res) {
        onAction();
      }
    });

    const onAction = () => {
      this.loading.sending = i;
      this.subscriptions.push(
        this._userManagementService
          .resendInvite(item.client_id)
          .pipe(finalize(() => (this.loading.sending = undefined)))
          .subscribe((data) => {
            if (data?.success) {
              this._alertService.successAlert({ title: 'Successfully sent.' });
            }
          })
      );
    };
  }

  /**
   * @description Method to approve user
   * @param item - Selected user
   * @param i - position of user in list
   */
  onApprove(item: IUsersList, i: number): void {
    const alert = this.openConfirmAlert('Are you sure you want to approve?');
    alert.afterClosed().subscribe((res) => {
      if (res) {
        onApprove();
      }
    });

    const onApprove = () => {
      this.loading.accepting = i;
      this.subscriptions.push(
        this._userManagementService
          .approveUser(item.client_id)
          .pipe(finalize(() => (this.loading.accepting = undefined)))
          .subscribe((res) => {
            if (res?.success) {
              this._alertService.successAlert({
                title: 'Approved Successfully.'
              });
              this.route.navigate([
                `/manage/manage-users/add-permissions/${res.data.userId}`
              ]);
            }
          })
      );
    };
  }

  /**
   * @description Method to delete a user
   * @param item - Selected user
   * @param i - position of user in list
   */
  onDelete(item: IUsersList, i: number): void {
    const alert = this.openConfirmAlert(
      'Are you sure you want to delete this user?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        onAction();
      }
    });

    const onAction = () => {
      this.loading.deleting = i;
      this.subscriptions.push(
        this._userManagementService
          .deleteSingleUser(item.client_id)
          .pipe(finalize(() => (this.loading.deleting = undefined)))
          .subscribe((res) => {
            if (res.success) {
              this._alertService.successAlert({ title: 'User Deleted.' });
              this.route.navigate([`/manage/manage-users/index`]);
              this.usersDetails.splice(i, 1);
              this.loadUserDetails();
              this.notFoundUser = 'not_found';
            }
          })
      );
    };
  }

  /**
   * @description Method for searching user
   * @param time - timeout
   */
  onSearchUser(time = 450): void {
    if (this.timoutId) {
      window.clearTimeout(this.timoutId);
    }
    this.timoutId = window.setTimeout(() => {
      this.loadUserDetails();
      this.notFoundUser = 'not_found';
    }, time);
  }

  /**
   * @description Method to filter the search
   * @param item - Type of user
   */
  onFilterType(item: { name: string; value: number }): void {
    this.userTypeFilter = item.value;
    this.loadUserDetails();
  }

  goToApprovalPolicy() {
    this.route.navigate(['/manage/manage-users/approval-policies']);
  }

  /**
   * @description
   * @param item - Action among a list of various actions that can be performed on a user.
   * @param selectedUser - selected user
   * @param selectedIndex - position of selected action in the list of actions
   */
  onActionMenu(
    item: { title: string; icon: string; id: string },
    selectedUser: IUsersList,
    selectedIndex: number
  ): void {
    switch (item.id) {
      case 'RId_permission':
        this._localStorageService.setItem('userPermission', selectedUser);
        this.route.navigate([
          `/manage/manage-users/add-permissions/${selectedUser.client_id}`
        ]);
        break;
      case 'RId_delete':
        this.onDelete(selectedUser, selectedIndex);
        break;
      case 'RId_whitelist_ip':
        this.openIPAddressModal();
        break;
      case 'RId_clone':
        this.openClonePermissionModal(selectedUser);
        break;
      case 'RId_edit':
        this.onEdit(selectedUser);
        break;
    }
  }

  /**
   * To be called when editing user. opens a modal to edit the user.
   * if Edit succeed, we reloading call ```this.loadUserDetails()``` method again.
   * to get the latest details.
   * @param user
   */
  onEdit(user: IUsersList) {
    const dialogRef = this.dialog.open(EditUserModalComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false,
      data: user
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loadUserDetails();
      }
    });
  }

  /**
   * @description Approve, resend, or delete actions for the user activity section. Invoked when event 'statusAction' is emitted by child component 'user-activity-component'
   * @summary approve, resend or delete actions for user status.
   */
  activityStatusAction(event: StatusActions): void {
    switch (event) {
      case 'approve':
        this.onApprove(this.selectedUser, this.selectedIndex);
        break;
      case 'resend':
        this.onResend(this.selectedUser, this.selectedIndex);
        break;
      case 'delete':
        this.onDelete(this.selectedUser, this.selectedIndex);
        break;
    }
  }

  /**
   * @description Opens modal for adding a new user
   */
  openNewUserModal(): void {
    const dialogRef = this.dialog.open(NewUserModalLatestComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'success') {
        this.loadUserDetails();
      }
    });
  }

  /**
   * @description Opens modal for whitelisting ip address
   */
  openIPAddressModal(): void {
    this.dialog.open(UserWhitelistIpComponent, {
      maxWidth: '500px',
      width: '95%',
      autoFocus: false,
      data: { clientId: this.selectedUser.client_id }
    });
  }

  /**
   * @description Opens modal for cloning permissions from other users
   * @param item - user used to clone permissions from
   */
  openClonePermissionModal(item: IUsersList) {
    const dialogRef = this.dialog.open(ClonePermissionModalComponent, {
      maxWidth: '550px',
      width: '93%',
      data: { id: item.client_id, permission: item.has_permission }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loadUserDetails();
      }
    });
  }

  /**
   * @description Opens a modal for confirmation
   * @param content - Content to be displayed in the alert window.
   * @returns confirmAlert method from alert service
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content,
      cancelMsg: 'Cancel',
      doneMsg: 'Ok'
    };
    return this._alertService.confirmAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
