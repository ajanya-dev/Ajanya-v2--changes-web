import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Subscription, finalize, take } from 'rxjs';
import { IPayeeLimit, IUsersList, StatusActions } from 'src/app/models/user';
import { EditUserModalComponent } from 'src/app/shared/modal/user-modal/edit-user-modal/edit-user-modal.component';
import { NewUserModalLatestComponent } from 'src/app/shared/modal/user-modal/new-user-modal-latest/new-user-modal-latest.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { UserWhitelistIpComponent } from '../components/user-whitelist-ip/user-whitelist-ip.component';

@Injectable({
  providedIn: 'root'
})
export class UserManagementV35Service implements OnDestroy {
  private headerService = inject(HeaderService);
  private userManagementService = inject(UserManagementService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  createUserWithoutPermission = new BehaviorSubject(false);

  listSubscriptions: Subscription[] = [];
  isHamaspik$ = new BehaviorSubject(false);
  usersSearchTerm = '';
  userTypeFilter = 0;
  userTypeFilter$ = new BehaviorSubject(0);
  usersDetails: IUsersList[];
  usersDetails$ = new BehaviorSubject<IUsersList[] | false>(false);
  selectedUser: IUsersList;
  selectedUser$ = new BehaviorSubject<IUsersList | false>(false);
  selectedIndex: number;
  selectedIndex$ = new BehaviorSubject<number | false>(false);
  notFoundUser = '';
  notFoundUser$ = new BehaviorSubject<string | false>('');
  timoutId: number;
  isActivityLoaded = true;
  isActivityLoaded$ = new BehaviorSubject(true);
  isDateWiseActivityLoaded = true;
  isDateWiseActivityLoaded$ = new BehaviorSubject(true);
  isHamaspik: boolean;
  isMultiLevelPluginEnabled: boolean;
  isMultiLevelPluginEnabled$ = new BehaviorSubject(false);
  isApprovapprovalPolicyEnabled: boolean;
  isApprovapprovalPolicyEnabled$ = new BehaviorSubject(false);
  singleCard:HTMLDivElement;
  userIndex: number = 0;
  showPermissions = signal(false);

  loading = {
    default: false,
    buttonDisabling: false,
    accepting: undefined as undefined | number,
    sending: undefined as undefined | number,
    rejecting: undefined as undefined | number,
    deleting: undefined as undefined | number
  };

  isExportPermissionLoading = signal({
    allUsers: false,
    singleUser: false
  });

  loading$ = new BehaviorSubject(this.loading);

  permissionBankId = signal<{ [key: string]: { [key: string]: boolean |undefined } }>({});
  permissionPayeeId = signal<{ [key: string]: { [key: string]: boolean } }>({});
  selectAllPermission = signal<{ [key: string]: boolean|undefined } | undefined>(undefined);
  indexPermission = signal<undefined | {[key: string]:boolean}>(undefined);
  allWalletsSelected = signal<{ [key: string]: boolean }>({});
  public refreshV3DataTableSubject$ = new Subject<{[key: string]:boolean}>();
  selectedUserId = signal<{name:string,userId:string}|undefined>(undefined);
  permissionPayeeLimit = signal<IPayeeLimit[]>([]);
  isV4LayoutEnabled = signal(this.localStorageService.getItem('isV4LayoutEnabled') === 1);

  private get alert() {
    return this.isV4LayoutEnabled() ? this.v4AlertService : this.alertService;
  }

  refreshV3DataTable(permissionName:string) {
    this.refreshV3DataTableSubject$.next({[permissionName]:true});
  }

  /**
   * Reset payee permission state to avoid conflicts when switching users
   */
  resetPayeePermissionState() {
    // Reset payee permission IDs
    this.permissionPayeeId.set({});
    
    // Reset payee limits
    this.permissionPayeeLimit.set([]);

    this.permissionBankId.set({});
    
    // Reset select all permission state
    this.selectAllPermission.set(undefined);
  }

  checkEnabledPlugins() {
    // eslint-disable-next-line no-underscore-dangle
    this.listSubscriptions.push(
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes('enterprise-hamaspik-check-import')) {
            if (!this.isHamaspik) {
              this.isHamaspik = true;
              this.isHamaspik$.next(true);
            }
          }
          if (res.enabledPlugins.includes('enterprise-steno-agency')) {
            if (!this.isMultiLevelPluginEnabled) {
              this.isMultiLevelPluginEnabled = true;
              this.isMultiLevelPluginEnabled$.next(true);
            }
          }
          if (res.managedPartner?.approvalPolicy === 1) {
            if (!this.isApprovapprovalPolicyEnabled) {
              this.isApprovapprovalPolicyEnabled = true;
              this.isApprovapprovalPolicyEnabled$.next(true);
            }
          }
        }
      })
    );
  }

  /**
   * @description Gets and sets the details of user in 'userDetails' property.
   */
  loadUserDetails(isNewUser: boolean = false): void {
    this.loading.default = true;
    this.loading$.next({ ...this.loading, ...{ default: true } });
    this.usersDetails = [];
    this.usersDetails$.next([]);
    this.listSubscriptions.push(
      this.userManagementService
        .getUsersList(this.userTypeFilter, this.usersSearchTerm)
        .pipe(
          finalize(() => {
            this.loading.default = false;
            this.loading$.next({ ...this.loading, ...{ default: false } });
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.usersDetails = res.data;
            this.usersDetails$.next(res.data);
            if(isNewUser){
              this.newUserOnboard(this.usersDetails[0]);
            }
            setTimeout(() => {
              this.singleUserSelected();
            }, 200);
          }
        })
    );
  }

  newUserOnboard(newUser: IUsersList){
    this.onSingleUser(newUser, 0);
    this.showPermissions.set(true);
    this.router.navigate([], { fragment: 'new' });
  }

  /**
   * @description Method to set the initially selected user (first user in the list) and apply 'active' styles.
   */
  singleUserSelected(): void {
    const singleCard: NodeListOf<HTMLDivElement> =
      document.querySelectorAll('#singleCard');
    singleCard[0]?.classList.add('active');
    if(this.localStorageService.getItem('clientPermissionId')){
      const clientId = this.localStorageService.getItem('clientPermissionId');
      this.selectedUser = this.usersDetails.find(user => user.client_id === clientId)!;
      this.selectedUser$.next(this.selectedUser);
    } else {
      this.selectedUser = this.usersDetails[0];
      this.selectedUser$.next(this.usersDetails[0]);
    }
    this.selectedIndex = 0;
    this.selectedIndex$.next(0);
    this.selectedUserId.set({name:this.usersDetails[0]?.client_name,userId:this.usersDetails[0]?.client_id});
    
    // Reset payee permission state to avoid conflicts
    this.resetPayeePermissionState();
  }

  /**
   * @description Method to set the selected the user and apply 'active' styles.
   * @param item - The selected user
   * @param i - index or position of the user in the list
   */
  onSingleUser( item: IUsersList, i: number): void {
    this.selectedUser = item;
    this.selectedUser$.next(item);
    this.selectedIndex = i;
    this.selectedIndex$.next(i);
    this.selectedUserId.set({name:item?.client_name,userId:item?.client_id});
    
    // Reset payee permission state to avoid conflicts with previous user's data
    this.resetPayeePermissionState();
  }

  /**
   * @description Method to resend the invite to the user
   * @param item - The selected user
   * @param i - position of user in the list
   */
  onResend(item: IUsersList, i: number): void {
    const alert = this.openConfirmAlert('Are you sure you want to resend?');
    const onAction = () => {
      this.loading.sending = i;
      this.loading$.next({ ...this.loading, ...{ sending: i } });
      this.listSubscriptions.push(
        this.userManagementService
          .resendInvite(item.client_id)
          .pipe(
            finalize(() => {
              this.loading.sending = undefined;
              this.loading$.next({
                ...this.loading,
                ...{ sending: undefined }
              });
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alert.successAlert({ title: 'Successfully sent.' });
              this.usersDetails = this.usersDetails.map((user) => {
                if (user.id === item.id) {
                  return { ...user, status: 0 };
                }
                return user;
              });
              this.usersDetails$.next(this.usersDetails);
            }
          })
      );
    };
    alert.afterClosed().subscribe((res) => {
      if (res) {
        onAction();
      }
    });
  }

  /**
   * @description Method to approve user
   * @param item - Selected user
   * @param i - position of user in list
   */
  onApprove(item: IUsersList, i: number): void {
    const alert = this.openConfirmAlert('Are you sure you want to approve?');
    const onApprove = () => {
      this.loading.accepting = i;
      this.loading$.next({ ...this.loading, ...{ accepting: i } });
      this.listSubscriptions.push(
        this.userManagementService
          .approveUser(item.client_id)
          .pipe(
            finalize(() => {
              this.loading.accepting = undefined;
              this.loading$.next({
                ...this.loading,
                ...{ accepting: undefined }
              });
            })
          )
          .subscribe((res) => {
            if (res?.success) {
              this.alert.successAlert({
                title: 'Approved Successfully.'
              });
              this.usersDetails = this.usersDetails.map((user) => {
                if (user.id === item.id) {
                  user.status = 1;
                }
                return user;
              });
              this.usersDetails$.next(this.usersDetails);
              this.router.navigate([
                `/manage/manage-users/add-permissions/${res.data.userId}`
              ]);
            }
          })
      );
    };
    alert.afterClosed().subscribe((res) => {
      if (res) {
        onApprove();
      }
    });
  }

  /**
   * @description Method to delete a user
   * @param item - Selected user
   * @param i - position of user in list
   */
  onDelete(item: IUsersList, i: number): void {
    const alert = this.openConfirmAlert(
      'Are you sure you want to remove this user’s access? This action will revoke all permissions and remove all access to your account for this user.'
    );
    const onAction = () => {
      this.loading.deleting = i;
      this.loading$.next({ ...this.loading, ...{ deleting: i } });
      this.listSubscriptions.push(
        this.userManagementService
          .deleteSingleUser(item.client_id)
          .pipe(
            finalize(() => {
              this.loading.deleting = undefined;
              this.loading$.next({
                ...this.loading,
                ...{ deleting: undefined }
              });
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.alert.successAlert({ content: 'Access removed successfully' });
              this.router.navigate([`/manage/manage-users/index`]);
              this.usersDetails.splice(i, 1);
              this.usersDetails$.next(this.usersDetails);
              this.loadUserDetails();
              this.notFoundUser = 'not_found';
              this.notFoundUser$.next('not_found');
            }
          })
      );
    };
    alert.afterClosed().subscribe((result) => {
      if (result) {
        onAction();
      }
    });
  }

  /**
   * @description Method for searching user
   * @param time - timeout
   */
  onSearchUser(searchTerm: string): void {
    this.usersSearchTerm = searchTerm;
    if (this.timoutId) {
      window.clearTimeout(this.timoutId);
    }
    this.timoutId = window.setTimeout(() => {
      this.loadUserDetails();
      this.notFoundUser = 'not_found';
      this.notFoundUser$.next('not_found');
    }, 500);
  }

  /**
   * @description Method to filter the search
   * @param item - Type of user
   */
  onFilterType(item: { name: string; value: number }): void {
    this.userTypeFilter = item.value;
    this.userTypeFilter$.next(item.value);
    this.loadUserDetails();
  }

  goToApprovalPolicy() {
    this.router.navigate(['/manage/manage-users/approval-policies']);
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
      case 'RId_delete':
        this.onDelete(selectedUser, selectedIndex);
        break;
      case 'RId_whitelist_ip':
        this.openIPAddressModal(selectedUser);
        break;
      case 'RId_edit':
        this.onEdit(selectedUser);
        break;
      case 'RId_resend':
        this.onResend(selectedUser, selectedIndex);
        break;
      default:
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
    this.selectedUser = user;
    const dialogRef = this.dialog.open(EditUserModalComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false,
      data: user
    });

    dialogRef.afterClosed().subscribe(() => {
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
      default:
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
      if (result === 'success') {
        this.loadUserDetails(true);
      }
    });
  }

  /**
   * @description Opens modal for whitelisting ip address
   */
  openIPAddressModal(item: IUsersList): void {
    this.dialog.open(UserWhitelistIpComponent, {
      maxWidth: '500px',
      width: '95%',
      autoFocus: false,
      data: { clientId: item.client_id }
    });
  }

  /**
   * @description Opens a modal for confirmation
   * @param content - Content to be displayed in the alert window.
   * @returns confirmAlert method from alert service
   */
  openConfirmAlert(content: string) {
    const data = {
      content,
      cancelMsg: 'Cancel',
      doneMsg: 'Ok'
    };
    return this.alert.confirmAlert(data);
  }

  /**
   * @description Used to export permission of all users or single user.Its Specifically created for Compass enterprise.
   * @param type - Type of file to be exported.
   * @param all_user - If true, export permission of all users will be exported, if false, export permission of single user will be exported.
   */
  exportPermission(type: 'xlsx' | 'csv', all_user: boolean = false) {
    if (all_user) {
      this.isExportPermissionLoading.set({
        allUsers: true,
        singleUser: false,
      });
    } else {
      this.isExportPermissionLoading.set({
        allUsers: false,
        singleUser: true,
      });
    }

    const payload = {
      client_ids: all_user ? null : [this.selectedUser?.client_id],
      type,
    };
    this.userManagementService
      .exportPermission(payload)
      .pipe(
        finalize(() =>
          this.isExportPermissionLoading.set({
            allUsers: false,
            singleUser: false,
          })
        ),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data.url, '_blank');
        }
    });
  }

  ngOnDestroy() {
    this.selectedUser$.next(false);
    this.listSubscriptions.forEach((s) => s.unsubscribe());
  }
}
