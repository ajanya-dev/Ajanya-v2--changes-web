import { Routes } from "@angular/router";

export const v4RefillCreditRoutes: Routes = [
    { path: '', redirectTo: 'show-refillform', pathMatch: 'full' },
    {
      path: 'show-refillform',
      loadComponent: () =>
        import('./components/v4-refill-credit/v4-refill-credit.component')
          .then(m => m.V4RefillCreditComponent),
      data: { title: 'Recharge My Credits' }
    },
    {
      path: 'update-card',
      loadComponent: () =>
        import("../refill-credit/pages/update-card/update-card.component")
          .then(m => m.UpdateCardComponent),
      data: { title: 'Update Card' }
    }
  ];