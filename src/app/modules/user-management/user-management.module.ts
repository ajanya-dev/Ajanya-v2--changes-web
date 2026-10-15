import { NgSelectModule } from '@ng-select/ng-select';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faAngleDown,
  faArrowLeft,
  faBriefcase,
  faCalendarDays,
  faEllipsis,
  faEllipsisVertical,
  faEye,
  faFilter,
  faMagnifyingGlass,
  faPenToSquare,
  faPlus,
  faTimes,
  faTrash,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';
import { MatTabsModule } from '@angular/material/tabs';
import { UsersActivityComponent } from './components/users-activity/users-activity.component';
import { UsersManagementListComponent } from './pages/users-management-list/users-management-list.component';
import { UserPermissionsComponent } from './pages/user-permissions/user-permissions.component';
import { UserWhitelistIpComponent } from './components/user-whitelist-ip/user-whitelist-ip.component';
import { ClonePermissionModalComponent } from './modals/clone-permission-modal/clone-permission-modal.component';
import { ClonePermissionConfirmationModalComponent } from './modals/clone-permission-confirmation-modal/clone-permission-confirmation-modal.component';
import { UserApprovalPolicyComponent } from './components/user-approval-policy/user-approval-policy.component';
import { AddNewRuleComponent } from './modals/add-new-rule/add-new-rule.component';
import { PendingCheckApprovalsComponent } from './modals/pending-check-approvals/pending-check-approvals.component';
import { UserManagementV35Component } from './pages/user-management-v35/user-management-v35.component';
import { UserManagementListV35Component } from './components/user-management-list-v35/user-management-list-v35.component';
import { DataTableModule } from '../data-table/data-table.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: UserManagementV35Component,
    data: { title: 'Users' }
  },
  {
    path: 'approval-policies',
    component: UserApprovalPolicyComponent,
    data: { title: 'Users' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTabsModule,
    NgxMaskDirective,
    NgSelectModule,
    NgxMaskPipe,
    SharedModule,
    OcwBackButtonComponent,
    RouterModule.forChild(routes),
    NgSelectModule,
    PipesModule,
    CommonLayoutV35Component,
    ListHeaderV35Component,
    CommonButtonV35Component,
    FontAwesomeModule,
    CommonListSkeltonComponent,
    EllipsisActiveDirective,
    NgOptimizedImage,
    UsersManagementListComponent,
    UsersActivityComponent,
    UserPermissionsComponent,
    UserWhitelistIpComponent,
    ClonePermissionModalComponent,
    ClonePermissionConfirmationModalComponent,
    UserApprovalPolicyComponent,
    AddNewRuleComponent,
    PendingCheckApprovalsComponent,
    UserManagementV35Component,
    UserManagementListV35Component,
    DataTableModule,
    V3DataTableModule
  ]
})
export class UserManagementModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faEllipsisVertical,
      faMagnifyingGlass,
      faPlus,
      faXmark,
      faPenToSquare,
      faTrash,
      faTimes,
      faEllipsis,
      faEye,
      faCalendarDays,
      faArrowLeft,
      faAngleDown,
      faFilter,
      faBriefcase
    );
  }
}
