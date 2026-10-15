import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'index',
    loadComponent: () =>
      import('./pages/mailing-dashboard/mailing-dashboard.component').then(
        (c) => c.MailingDashboardComponent
      )
  },
  {
    path: 'group-mailing',
    loadComponent: () =>
      import('./pages/group-mailing-list/group-mailing-list.component').then(
        (c) => c.GroupMailingListComponent
      )
  },
  {
    path: 'group-mailing/details/:id',
    loadComponent: () =>
      import(
        './pages/group-mailing-details/group-mailing-details.component'
      ).then((c) => c.GroupMailingDetailsComponent)
  },
  {
    path: 'report',
    loadComponent: () =>
      import(
        './components/mailing-dashboard-report/mailing-dashboard-report.component'
      ).then((c) => c.MailingDashboardReportComponent)
  },
  {
    path: 'multi-check-mail-table',
    loadComponent: () =>
      import(
        './components/multi-check-mail-table/multi-check-mail-table.component'
      ).then((c) => c.MultiCheckMailTableComponent)
  },
  {
    path: 'multi-check-mail1-step1',
    loadComponent: () =>
      import('./components/multi-check-mail1/multi-check-mail1.component').then(
        (c) => c.MultiCheckMail1Component
      )
  },
  {
    path: 'multi-check-mail2',
    loadComponent: () =>
      import('./components/multi-check-mail2/multi-check-mail2.component').then(
        (c) => c.MultiCheckMail2Component
      )
  },
  {
    path: 'multi-check-mail-table-details/:batchId',
    loadComponent: () =>
      import(
        './components/multi-check-mail-table-details/multi-check-mail-table-details.component'
      ).then((c) => c.MultiCheckMailTableDetailsComponent)
  },
  {
    path: 'single-mail',
    loadComponent: () =>
      import('./components/single-mail/single-mail.component').then(
        (c) => c.SingleMailComponent
      )
  },
  {
    path: 'single-mail/submit/:id',
    loadComponent: () =>
      import(
        './components/single-mail-submit/single-mail-submit.component'
      ).then((c) => c.SingleMailSubmitComponent)
  },
  {
    path: 'bulk-mail',
    loadComponent: () =>
      import('./components/bulk-mail/bulk-mail.component').then(
        (c) => c.BulkMailComponent
      )
  },
  {
    path: 'bulk-mail/submit',
    loadComponent: () =>
      import('./components/bulk-mail-submit/bulk-mail-submit.component').then(
        (c) => c.BulkMailSubmitComponent
      )
  },
  {
    path: 'single-mail-history',
    loadComponent: () =>
      import('./pages/single-mail-history/single-mail-history.component').then(
        (c) => c.SingleMailHistoryComponent
      )
  },
  {
    path: 'document-mail-history',
    loadComponent: () =>
      import(
        './pages/document-mail-history/document-mail-history.component'
      ).then((c) => c.DocumentMailHistoryComponent)
  }
];
