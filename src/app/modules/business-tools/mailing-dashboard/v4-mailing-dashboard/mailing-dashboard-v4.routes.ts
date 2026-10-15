import { Routes } from '@angular/router';

export const mailingDashboardV4Routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    loadComponent: () =>
      import(
        './pages/mailing-dashboard-v4/mailing-dashboard-v4.component'
      ).then((c) => c.MailingDashboardV4Component)
  },
  {
    path: 'single-mail',
    loadComponent: () =>
      import(
        './pages/v4-single-mail/v4-single-mail.component'
      ).then((c) => c.V4SingleMailComponent)
  },
  {
    path: 'bulk-mail',
    loadComponent: () =>
      import('./pages/v4-bulk-mail/v4-bulk-mail.component').then(
        (c) => c.V4BulkMailComponent
      )
  },
  {
    path: 'bulk-mail/submit',
    loadComponent: () =>
      import(
        './pages/v4-bulk-mail-submit/v4-bulk-mail-submit.component'
      ).then((c) => c.V4BulkMailSubmitComponent)
  },
  {
    path: 'multi-check-mail-table',
    loadComponent: () =>
      import(
        './pages/v4-multi-check-mail-table/v4-multi-check-mail-table.component'
      ).then((c) => c.V4MultiCheckMailTableComponent)
  },
  {
    path: 'multi-check-mail1-step1',
    loadComponent: () =>
      import(
        './pages/v4-multi-check-mail-upload/v4-multi-check-mail-upload.component'
      ).then((c) => c.V4MultiCheckMailUploadComponent)
  },
  {
    path: 'multi-check-mail2',
    loadComponent: () =>
      import(
        './pages/v4-multi-check-mail-wizard/v4-multi-check-mail-wizard.component'
      ).then((c) => c.V4MultiCheckMailWizardComponent)
  },
  {
    path: 'multi-check-mail-table-details/:batchId',
    loadComponent: () =>
      import(
        './pages/v4-multi-check-mail-table-details/v4-multi-check-mail-table-details.component'
      ).then((c) => c.V4MultiCheckMailTableDetailsComponent)
  },
  {
    path: 'single-mail-history',
    loadComponent: () =>
      import(
        './pages/single-mail-history-v4/single-mail-history-v4.component'
      ).then((c) => c.SingleMailHistoryV4Component)
  },
  {
    path: 'group-mailing',
    loadComponent: () =>
      import(
        'src/app/modules/payments-v4/payments-out/components/v4-group-mailing-list/v4-group-mailing-list.component'
      ).then((c) => c.V4GroupMailingListComponent)
  },
  {
    path: 'group-mailing/details/:id',
    loadComponent: () =>
      import(
        'src/app/modules/payments-v4/payments-out/components/v4-group-mailing-details/v4-group-mailing-details.component'
      ).then((c) => c.V4GroupMailingDetailsComponent)
  },
  {
    path: 'document-mail-history',
    loadComponent: () =>
      import(
        './pages/v4-document-mail-history/v4-document-mail-history.component'
      ).then((c) => c.V4DocumentMailHistoryComponent)
  },
  {
    path: 'report',
    loadComponent: () =>
      import(
        './pages/v4-mailing-dashboard-report/v4-mailing-dashboard-report.component'
      ).then((c) => c.V4MailingDashboardReportComponent)
  }
];
