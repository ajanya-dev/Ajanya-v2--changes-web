import { Routes } from '@angular/router';
import { PayeeOnboardingRedirectV4Component } from './components/payee-onboarding-redirect-v4/payee-onboarding-redirect-v4.component';
import { MicroDepositVerificationComponent } from './components/micro-deposit-verification/micro-deposit-verification.component';
import { ManualBankAddedComponent } from './components/manual-bank-added/manual-bank-added.component';

export const payeeOnboardingRoutes: Routes = [
  { path: 'set-password', component: PayeeOnboardingRedirectV4Component },
  { path: 'index', component: PayeeOnboardingRedirectV4Component },
  {
    path: 'micro-deposit-verification',
    component: MicroDepositVerificationComponent
  },
  { path: 'manual-bank-added', component: ManualBankAddedComponent }
];
