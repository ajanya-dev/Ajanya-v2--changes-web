import { Routes } from '@angular/router';
import { V4VendorCreditsPageComponent } from './components/v4-vendor-credits-page/v4-vendor-credits-page.component';

export const v4VendorCreditsRoutes: Routes = [
  {
    path: '',
    component: V4VendorCreditsPageComponent,
    data: { title: 'V4 Vendor Credits' }
  }
];
