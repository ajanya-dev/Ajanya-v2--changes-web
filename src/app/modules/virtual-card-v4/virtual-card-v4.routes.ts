import { Routes } from '@angular/router';

export const virtualCardV4Routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./virtual-card-v4.component').then((m) => m.VirtualCardV4Component)
  }
];
