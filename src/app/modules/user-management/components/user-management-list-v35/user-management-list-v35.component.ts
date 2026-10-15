import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { IUsersList } from 'src/app/models/user';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import {
  NgIf,
  NgFor,
  NgClass,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  TitleCasePipe
} from '@angular/common';
import {
  faClone,
  faLocationDot,
  faPenToSquare,
  faPencilAlt,
  faShareFromSquare,
  faTrash
} from '@fortawesome/pro-regular-svg-icons';
import { faCircle, faUpToLine } from '@fortawesome/pro-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { CommonListSkeltonComponent } from '../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { EllipsisActiveDirective } from '../../../../directive/ellipsis-active.directive';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ListHeaderV35Component } from '../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';
import { ClonePermissionModalComponent } from '../../modals/clone-permission-modal/clone-permission-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V35CommonDropDownSelectorComponent } from '../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { FormsModule } from '@angular/forms';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';

export enum ClientType {
  'All' = 0,
  'User',
  'Accountant',
  'Client',
  'Clerk',
  'Approver'
}

@Component({
  selector: 'app-user-management-list-v35',
  templateUrl: './user-management-list-v35.component.html',
  styleUrls: ['./user-management-list-v35.component.scss'],
  standalone: true,
  imports: [
    ListHeaderV35Component,
    NgIf,
    CommonButtonV35Component,
    NgFor,
    NgClass,
    FaIconComponent,
    EllipsisActiveDirective,
    MatTooltip,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    CommonListSkeltonComponent,
    TitleCasePipe,
    V35CommonDropDownSelectorComponent,
    FormsModule,
    TruncatePipe
  ]
})
export class UserManagementListV35Component implements OnInit, OnDestroy {
  public userManagementServiceV35 = inject(UserManagementV35Service);
  private companyService = inject(CompanyManagementService);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);

  clientType = ClientType;
  companyType: string;
  isHamaspik: boolean;
  isMultiLevelPluginEnabled: boolean;
  isApprovapprovalPolicyEnabled: boolean;
  usersDetails: IUsersList[];
  selectedUser: IUsersList;
  userTypeFilter = 0;
  env = environment;
  loading = {
    default: false,
    buttonDisabling: false,
    accepting: undefined as undefined | number,
    sending: undefined as undefined | number,
    rejecting: undefined as undefined | number,
    deleting: undefined as undefined | number
  };

  faPencilAlt = faPencilAlt;
  faClone = faClone;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faLocationDot = faLocationDot;
  faShareSquare = faShareFromSquare;
  faCircle = faCircle;
  faUpToLine = faUpToLine;

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
      icon: faPencilAlt,
      id: 'RId_permission'
    },
    {
      title: 'Clone Permission',
      icon: faClone,
      id: 'RId_clone'
    },
    {
      title: 'Edit',
      icon: faPenToSquare,
      id: 'RId_edit'
    },
    {
      title: 'Remove Access',
      icon: faTrash,
      id: 'RId_delete'
    },
    {
      title: 'Whitelist IP',
      icon: faLocationDot,
      id: 'RId_whitelist_ip'
    }
  ];

  set selectedValue(item: string) {
    const selectedUser = JSON.parse(item);
    if (selectedUser) {
      this.selectUser(selectedUser);
    }
  }

  get selectedValue(): string {
    return JSON.stringify(this.selectedUser);
  }

  ngOnInit(): void {
    this.userManagementServiceV35.listSubscriptions.push(
      this.userManagementServiceV35.isHamaspik$.subscribe((res) => {
        this.isHamaspik = res;
      }),
      this.userManagementServiceV35.isMultiLevelPluginEnabled$.subscribe((res) => {
        this.isMultiLevelPluginEnabled = res;
      }),
      this.userManagementServiceV35.isApprovapprovalPolicyEnabled$.subscribe((res) => {
        this.isApprovapprovalPolicyEnabled = res;
      })
    );
    this.userManagementServiceV35.listSubscriptions.push(
      this.userManagementServiceV35.usersDetails$.subscribe((res) => {
        if (res) {
          this.usersDetails = res;
        }
      }),
      this.userManagementServiceV35.selectedUser$.subscribe((res) => {
        if (res) {
          this.selectedUser = res;
        }
      }),
      this.userManagementServiceV35.loading$.subscribe((res) => {
        if (res) {
          this.loading = res;
        }
      }),
      this.userManagementServiceV35.userTypeFilter$.subscribe((res) => {
        if (res) {
          this.userTypeFilter = res;
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
    this.userManagementServiceV35.checkEnabledPlugins();
    this.companyType = this.companyService.getActiveCompanyType();
  }

  openNewUserModal() {
    this.userManagementServiceV35.openNewUserModal();
  }

  onFilterType(item: { name: string; value: number }) {
    this.userManagementServiceV35.onFilterType(item);
  }

  onActionMenu(
    item: { title: string; icon: string; id: string },
    selectedUser: IUsersList,
    selectedIndex: number
  ) {
    if (item.id === 'RId_clone') {
      this.openClonePermissionModal(selectedUser);
    } else if(item.id === 'RId_permission') {
      this.onSingleUser(selectedUser,selectedIndex);
      this.userManagementServiceV35.showPermissions.set(true);
    }else{
      this.userManagementServiceV35.onActionMenu(
        item,
        selectedUser,
        selectedIndex
      );
    }
  }

  openClonePermissionModal(item: IUsersList) {
    const dialogRef = this.dialog.open(ClonePermissionModalComponent, {
      maxWidth: '550px',
      width: '93%',
      data: {
        id: item.client_id,
        permission: item.has_permission
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.userManagementServiceV35.loadUserDetails();
      }
    });
  }

  onDelete(item: IUsersList, i: number) {
    this.userManagementServiceV35.onDelete(item, i);
  }

  onApprove(item: IUsersList, i: number) {
    this.userManagementServiceV35.onApprove(item, i);
  }

  onResend(item: IUsersList, i: number) {
    this.userManagementServiceV35.onResend(item, i);
  }

  onSingleUser(item: IUsersList, i: number) {
    this.userManagementServiceV35.onSingleUser(item, i);
  }

  goToApprovalPolicy() {
    this.userManagementServiceV35.goToApprovalPolicy();
  }

  onSearchUser(searchTerm: string) {
    this.userManagementServiceV35.onSearchUser(searchTerm);
  }

  openAddUser() {
    this.openNewUserModal();
  }

  selectUser(user: IUsersList) {
    this.userManagementServiceV35.onSingleUser(user, 0);
  }

  exportPermission(type: 'xlsx' | 'csv') {
    this.userManagementServiceV35.exportPermission(type,true);
  }

  ngOnDestroy(): void {
    this.userManagementServiceV35.listSubscriptions.forEach((e) =>
      e.unsubscribe()
    );
    this.userManagementServiceV35.userTypeFilter = 0;
    this.localStorageService.removeItem('clientPermissionId'); 
  }
}
