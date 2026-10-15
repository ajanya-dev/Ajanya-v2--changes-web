import { Routes } from '@angular/router';
import { V4BillsListComponent } from './pages/v4-bills-list/v4-bills-list.component';
import { V4BillsOverviewTabComponent } from './components/v4-bills-overview-tab/v4-bills-overview-tab.component';
import { V4BillsDetailedTabComponent } from './components/v4-bills-detailed-tab/v4-bills-detailed-tab.component';
import { V4BillInboxComponent } from './pages/v4-bill-inbox/v4-bill-inbox.component';

export const v4BillsRoutes: Routes = [
  {
    path: '',
    component: V4BillsListComponent,
    data: { title: 'Bills' },
    children: [
      { path: '', redirectTo: 'detailed', pathMatch: 'full' },
      { path: 'overview', component: V4BillsOverviewTabComponent },
      { path: 'detailed', component: V4BillsDetailedTabComponent }
    ]
  },
  {
    path: 'inbox',
    component: V4BillInboxComponent,
    data: { title: 'Bill Inbox' }
  }
];
