import { Routes } from '@angular/router';

/**
 * Which half of the page shows is `data.mode`, not a string match on the URL. The path
 * keeps v3.5's scheme: :type2 = pay-from source id, :type3 = payment-method id.
 */
const loadPage = () =>
  import('./send-receive-page.component').then(
    (m) => m.SendReceivePageComponent
  );

export const sendReceivePageRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pay'
  },
  {
    path: 'pay',
    loadComponent: loadPage,
    data: { title: 'Send Payment', mode: 'pay' }
  },
  {
    path: 'receive',
    loadComponent: loadPage,
    data: { title: 'Receive Payment', mode: 'receive' }
  },
  {
    // Deep link into a specific rail: /send/bankaccount/check
    path: 'pay/:type2/:type3',
    loadComponent: loadPage,
    data: { title: 'Send Payment', mode: 'pay' }
  },
  {
    // Edit or clone an existing payment: /edit/<uuid>, /clone/<uuid>
    path: ':mode/:id',
    loadComponent: loadPage,
    data: { title: 'Send Payment', mode: 'pay' }
  }
];
