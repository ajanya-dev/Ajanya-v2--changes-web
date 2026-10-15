import { Routes } from '@angular/router';
import { DocumentMailListV4Component } from './pages/document-mail-list-v4/document-mail-list-v4.component';

export const documentMailV4Routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: DocumentMailListV4Component
  },
  {
    path: 'add-attachment',
    loadComponent: () =>
      import('../components/attach-doc/attach-doc.component').then(
        (c) => c.AttachDocComponent
      ),
    data: { title: 'Add Attachment' }
  },
  {
    path: 'page-select',
    loadComponent: () =>
      import('../components/page-select/page-select.component').then(
        (c) => c.PageSelectComponent
      ),
    data: { title: 'Page Select' }
  },
  {
    path: 'mail-details',
    loadComponent: () =>
      import(
        '../components/document-send-mail-page/document-send-mail-page.component'
      ).then((c) => c.DocumentSendMailPageComponent),
    data: { title: 'Mail Details' }
  },
  {
    path: 'view/:id',
    loadComponent: () =>
      import(
        '../components/document-mail-view/document-mail-view.component'
      ).then((c) => c.DocumentMailViewComponent),
    data: { title: 'Mail Document' }
  }
];
