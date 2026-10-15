import { Routes } from '@angular/router';
import { VerificationCenterComponent } from './verification-center.component';
import { VerificationCardStepsComponent } from './components/verification-card-steps/verification-card-steps.component';

export const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: VerificationCenterComponent,
  },
  {
    path: 'steps',
    component: VerificationCardStepsComponent,
  },
];
