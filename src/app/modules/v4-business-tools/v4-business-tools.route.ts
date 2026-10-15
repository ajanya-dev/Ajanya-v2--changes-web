import { Routes } from '@angular/router';
import { V4DocumentVaultComponent } from './v4-document-vault/v4-document-vault.component';

export const routes: Routes = [
  {
    path: 'more',
    loadComponent: () =>
      import(
        './pages/v4-business-tools-more/v4-business-tools-more.component'
      ).then((m) => m.V4BusinessToolsMoreComponent),
    data: { title: 'Business Tools More' }
  },
  {
    path: 'document-storage',
    component: V4DocumentVaultComponent,
    data: { title: 'Document Storage ' }
  },
  {
    path: 'document-storage/folder/:folderId',
    component: V4DocumentVaultComponent,
    data: { title: 'Document Storage ' }
  },
  {
    path: 'article-writer',
    loadComponent: () =>
      import('./article-writer/article-writer-main-v4.component').then(
        (c) => c.ArticleWriterMainV4Component
      ),
    data: { title: 'Business Tools' }
  },
  {
    path: 'bank-data',
    loadChildren: () =>
      import('src/app/modules/bank-data-v4/bank-data-v4.routes').then(
        (m) => m.routes
      )
  },
  {
    path: 'zil-sign',
    loadChildren: () =>
      import('./v4-zil-sign/v4-zil-sign.routes').then((m) => m.routes)
  },
  {
    /** Shipping label lives under the business-tools path — keep this alias working. */
    path: 'shipping-label',
    redirectTo: '/v4/manage/business-tools/shipping-label',
    pathMatch: 'full'
  }
];
