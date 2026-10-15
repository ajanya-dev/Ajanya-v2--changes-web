import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./virtual-card.component').then((c) => c.VirtualCardComponent)
  }
];
