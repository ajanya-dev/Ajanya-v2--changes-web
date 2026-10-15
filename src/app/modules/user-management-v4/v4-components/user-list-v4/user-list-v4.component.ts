import {
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  inject,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { IUsersList } from 'src/app/models/user';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { UserManagementDataV4Service } from '../../v4-services/user-management-data-v4.service';

export enum ClientType {
  'All' = 0,
  'User',
  'Accountant',
  'Client',
  'Clerk',
  'Approver'
}

@Component({
  selector: 'app-user-list-v4',
  templateUrl: './user-list-v4.component.html',
  styleUrls: ['./user-list-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    LucideAngularModule,
    MatTooltip,
    OverlayModule,
    CommonListSkeltonComponent,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ]
})
export class UserListV4Component implements OnInit {
  @HostBinding('class')
  hostClass =
    'flex flex-col h-full overflow-hidden bg-v4-secondary-background-color';

  public userService = inject(UserManagementV35Service);
  private userDataV4Service = inject(UserManagementDataV4Service);
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private localStorageService = inject(LocalStorageService);
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  clientType = ClientType;
  usersDetails: IUsersList[] = [];
  allUsersFromApi: IUsersList[] = [];
  selectedUser: IUsersList | undefined;
  searchInput = '';
  subjectKeyUp = new Subject<string>();
  resize = false;
  openPopoverItemId: number | null = null;
  showFilters = false;

  userTypes = [
    { value: 0, name: 'All Roles' },
    { value: 1, name: 'User' },
    { value: 2, name: 'Accountant' },
    { value: 3, name: 'Client' },
    { value: 4, name: 'Clerk' },
    { value: 5, name: 'Approver' }
  ];

  statusTypes = [
    { value: -1, name: 'All Status' },
    { value: 0, name: 'Pending' },
    { value: 1, name: 'Active' },
    { value: 2, name: 'Rejected' }
  ];

  // Dropdown list data (string values for ng-select compatibility)
  roleListData = [
    { name: 'User', value: '1' },
    { name: 'Accountant', value: '2' },
    { name: 'Client', value: '3' },
    { name: 'Clerk', value: '4' },
    { name: 'Approver', value: '5' }
  ];

  statusListData = [
    { name: 'Pending', value: '0' },
    { name: 'Active', value: '1' },
    { name: 'Rejected', value: '2' }
  ];

  roleFilterConfig: Iv4ngSelectConfig = {
    placeholder: 'All Roles',
    displayField: 'name',
    outputField: 'value',
    style: { size: 1 }
  };

  statusFilterConfig: Iv4ngSelectConfig = {
    placeholder: 'All Status',
    displayField: 'name',
    outputField: 'value',
    style: { size: 1 }
  };

  selectedRoleValue: string | undefined;
  selectedStatusValue: string | undefined;

  selectedTypeFilter = 0;
  selectedStatusFilter = -1;

  settings: { name: string; id: string; lucideIcon: string }[] = [
    { name: 'Permissions', id: 'RId_permission', lucideIcon: 'shield-check' },
    { name: 'Clone Permission', id: 'RId_clone', lucideIcon: 'copy' },
    { name: 'Edit', id: 'RId_edit', lucideIcon: 'square-pen' },
    { name: 'Whitelist IP', id: 'RId_whitelist_ip', lucideIcon: 'globe' },
    { name: 'Remove Access', id: 'RId_delete', lucideIcon: 'trash-2' }
  ];

  popoverPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4
    }
  ];

  loading = {
    default: false,
    accepting: undefined as undefined | number,
    sending: undefined as undefined | number,
    deleting: undefined as undefined | number
  };

  ngOnInit() {
    this.subscribeToData();
    this.debounceSearch();
    this.checkResize();
  }

  private subscribeToData() {
    this.userService.usersDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.allUsersFromApi = res;
          this.applyStatusFilter();
        }
      });

    this.userService.selectedUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.selectedUser = res;
        }
      });

    this.userService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.loading = res;
        }
      });
  }

  checkResize(): void {
    this.commonLayoutToggleV4Service.toggleChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.resize = res;
        this.updateCollapsedWidth(res);
      });
  }

  private updateCollapsedWidth(isCollapsed: boolean): void {
    const layoutPanel =
      this.elementRef.nativeElement?.parentElement?.parentElement;
    if (!layoutPanel) return;
    if (isCollapsed) {
      layoutPanel.style.setProperty('min-width', '60px', 'important');
      layoutPanel.style.setProperty('width', '60px', 'important');
    } else {
      layoutPanel.style.removeProperty('min-width');
      layoutPanel.style.removeProperty('width');
    }
  }

  filterData(searchItem: string) {
    this.searchInput = searchItem;
    this.subjectKeyUp.next(this.searchInput);
  }

  debounceSearch() {
    this.subjectKeyUp
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.userService.onSearchUser(this.searchInput);
      });
  }

  onNew() {
    this.userDataV4Service.openInviteUserModal();
  }

  onFilterType(type: { value: number; name: string }) {
    this.selectedTypeFilter = type.value;
    this.userService.onFilterType(type);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  get activeFiltersCount(): number {
    return (
      (this.selectedRoleValue ? 1 : 0) + (this.selectedStatusValue ? 1 : 0)
    );
  }

  onRoleFilterChange() {
    const typeValue = this.selectedRoleValue
      ? parseInt(this.selectedRoleValue, 10)
      : 0;
    this.selectedTypeFilter = typeValue;
    const type =
      this.userTypes.find((t) => t.value === typeValue) ?? this.userTypes[0];
    this.onFilterType(type);
  }

  onStatusFilterChange() {
    this.selectedStatusFilter = this.selectedStatusValue
      ? parseInt(this.selectedStatusValue, 10)
      : -1;
    this.applyStatusFilter();
  }

  clearFilters() {
    this.selectedRoleValue = undefined;
    this.selectedStatusValue = undefined;
    this.selectedTypeFilter = 0;
    this.selectedStatusFilter = -1;
    this.userService.onFilterType(this.userTypes[0]);
    this.applyStatusFilter();
  }

  clearSearch() {
    this.searchInput = '';
    this.subjectKeyUp.next('');
  }

  onSearchInputChange() {
    this.subjectKeyUp.next(this.searchInput);
  }

  private applyStatusFilter() {
    this.usersDetails =
      this.selectedStatusFilter === -1
        ? [...this.allUsersFromApi]
        : this.allUsersFromApi.filter(
            (user) => user.status === this.selectedStatusFilter
          );
  }

  selectUser(item: IUsersList, i: number) {
    this.userService.onSingleUser(item, i);
    this.localStorageService.setItem('clientPermissionId', item.client_id);
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  onSettingClick(action: string, item: IUsersList, index: number) {
    this.closePopover();
    setTimeout(() => {
      switch (action) {
        case 'RId_permission':
          this.userService.onSingleUser(item, index);
          this.userService.showPermissions.set(true);
          this.commonLayoutToggleV4Service.navigateToDetail();
          break;
        case 'RId_clone':
          this.userDataV4Service.openClonePermissionModal(item);
          break;
        case 'RId_edit':
          this.userDataV4Service.openEditUserModal(item);
          break;
        case 'RId_whitelist_ip':
          this.userDataV4Service.openWhitelistIpModal(item);
          break;
        case 'RId_delete':
          this.userDataV4Service.onDelete(item, index);
          break;
        default:
          break;
      }
    }, 100);
  }

  onApprove(item: IUsersList, i: number) {
    this.userDataV4Service.onApprove(item, i);
  }

  onDelete(item: IUsersList, i: number) {
    this.userDataV4Service.onDelete(item, i);
  }

  onResend(item: IUsersList, i: number) {
    this.userDataV4Service.onResend(item, i);
  }

  getRoleBadgeClass(clientType: number): string {
    switch (clientType) {
      case 1: // User
        return 'bg-v4-insight-card-background-blue text-v4-insight-card-label-text-blue';
      case 2: // Accountant
        return 'bg-v4-surface-success-bold text-v4-text-success';
      case 3: // Client
        return 'bg-v4-badge-sky-bg-color text-v4-badge-sky-text-color';
      case 4: // Clerk
        return 'bg-v4-insight-card-background-orange text-v4-insight-card-sub-number-orange';
      case 5: // Approver
        return 'bg-v4-badge-approver-bg-color text-v4-badge-approver-text-color';
      default:
        return 'bg-v4-insight-card-background-blue text-v4-insight-card-label-text-blue';
    }
  }

  togglePopover(event: MouseEvent, itemId: number): void {
    event.stopPropagation();
    this.openPopoverItemId = this.openPopoverItemId === itemId ? null : itemId;
  }

  closePopover(): void {
    this.openPopoverItemId = null;
  }
}
