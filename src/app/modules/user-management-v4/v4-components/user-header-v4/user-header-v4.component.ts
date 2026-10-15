import {
  Component,
  DestroyRef,
  HostBinding,
  inject,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { environment } from 'src/environments/environment';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { UserManagementDataV4Service } from '../../v4-services/user-management-data-v4.service';

@Component({
  standalone: true,
  selector: 'app-user-header-v4',
  imports: [V4PageHeaderComponent],
  templateUrl: './user-header-v4.component.html'
})
export class UserHeaderV4Component implements OnInit {
  @HostBinding('class') class = 'block';

  public userManagementService = inject(UserManagementV35Service);
  private userDataV4Service = inject(UserManagementDataV4Service);
  private companyService = inject(CompanyManagementService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);

  env = environment;
  isHamaspik = false;
  isMultiLevelPluginEnabled = false;
  companyType = '';
  hasUsers = false;
  isApprovapprovalPolicyEnabled: boolean;
  isExportPermissionLoading =
    this.userManagementService.isExportPermissionLoading;

  ngOnInit(): void {
    this.companyType = this.companyService.getActiveCompanyType();
    this.userManagementService.usersDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.hasUsers = !!res && res.length > 0;
      });
    this.userManagementService.isHamaspik$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isHamaspik = res;
      });
    this.userManagementService.isMultiLevelPluginEnabled$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isMultiLevelPluginEnabled = res;
      });
      this.userManagementService.isApprovapprovalPolicyEnabled$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isApprovapprovalPolicyEnabled = res;
      });
  }

  get headerActions(): IV4HeaderAction[] {
    const actions: IV4HeaderAction[] = [];
    if (this.env.env_id === 'compass') {
      actions.push({
        id: 'exportPermission',
        text: 'Permission',
        style: 'navy',
        lucideIcon: 'arrow-up-to-line',
        loading: this.isExportPermissionLoading().allUsers,
        disabled: this.isExportPermissionLoading().allUsers,
        menu: [
          { id: 'xlsx', name: 'Excel' },
          { id: 'csv', name: 'CSV' }
        ]
      });
    }
    if (
      (this.isHamaspik && this.companyType === 'owncmp') ||
      this.isMultiLevelPluginEnabled ||
      this.isApprovapprovalPolicyEnabled
    ) {
      actions.push({
        id: 'setPolicies',
        text: 'Set Policies',
        style: 'navy',
        lucideIcon: 'clipboard-check',
        toolTip: 'Configure approval policies for your team'
      });
    }
    if (this.hasUsers) {
      actions.push({
        id: 'permissions',
        text: 'Permissions',
        style: 'navy',
        lucideIcon: 'shield-check',
        toolTip: 'View and manage user roles and permissions'
      });
    }
    actions.push({
      id: 'addUser',
      text: 'Add User',
      style: 'primary',
      lucideIcon: 'plus'
    });
    return actions;
  }

  onAction(id: string | number): void {
    if (id === 'xlsx') this.exportPermission('xlsx');
    if (id === 'csv') this.exportPermission('csv');
    if (id === 'setPolicies') this.goToApprovalPolicy();
    if (id === 'permissions') this.onPermissions();
    if (id === 'addUser') this.onAddUser();
  }

  onRefresh(): void {
    this.userManagementService.loadUserDetails();
  }

  onPermissions(): void {
    this.userManagementService.showPermissions.set(true);
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  onAddUser(): void {
    this.userDataV4Service.openInviteUserModal();
  }

  goToApprovalPolicy(): void {
    this.router.navigate(['/v4/manage/manage-users/approval-policies']);
  }

  exportPermission(type: 'xlsx' | 'csv'): void {
    this.userManagementService.exportPermission(type, true);
  }
}
