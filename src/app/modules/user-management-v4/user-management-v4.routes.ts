import { Routes } from '@angular/router';
import { UserManagementOcwV4Component } from './v4-pages/user-management-ocw-v4/user-management-ocw-v4.component';

export const userManagementV4Routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: UserManagementOcwV4Component,
    data: { title: 'User Management' }
  },
  {
    path: 'approval-policies',
    loadComponent: () =>
      import(
        './v4-pages/approval-policy-v4/approval-policy-v4.component'
      ).then((m) => m.ApprovalPolicyV4Component)
  },
  {
    path: 'add-permissions/:id',
    loadComponent: () =>
      import(
        './v4-pages/user-permissions-v4/user-permissions-v4.component'
      ).then((m) => m.UserPermissionsV4Component)
  }
];
