import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./v4-pages/v4-sign-doc-list/v4-sign-doc-list.component').then(
        (c) => c.V4SignDocListComponent
      ),
    data: { title: 'Zil Sign' }
  },
  {
    path: 'request-sign',
    loadComponent: () =>
      import('./v4-pages/v4-request-sign/v4-request-sign.component').then(
        (c) => c.V4RequestSignComponent
      ),
    data: { title: 'Send for signatures' }
  },
  {
    path: 'sign-pdf-viewer/:id',
    loadComponent: () =>
      import('./v4-pages/v4-sign-pdf-viewer/v4-sign-pdf-viewer.component').then(
        (c) => c.V4SignPdfViewerComponent
      ),
    data: { title: 'Place fields' }
  },
  {
    path: 'sign-doc-view/:id',
    loadComponent: () =>
      import('./v4-pages/v4-sign-doc-view/v4-sign-doc-view.component').then(
        (c) => c.V4SignDocViewComponent
      ),
    data: { title: 'Document Details' }
  }
];
