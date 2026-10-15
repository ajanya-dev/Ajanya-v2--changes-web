import { Routes } from "@angular/router";
import { VirtualCardLandingPageComponent } from "./virtual-card-landing-page/virtual-card-landing-page.component";

export const routes : Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: VirtualCardLandingPageComponent
  }
];