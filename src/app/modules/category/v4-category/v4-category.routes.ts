import { Routes } from '@angular/router';
import { CategoryListV4Component } from './pages/category-list-v4/category-list-v4.component';

export const v4CategoryRoutes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: CategoryListV4Component
  }
];
