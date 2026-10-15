import { NgModule, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, Routes, UrlTree } from '@angular/router';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConfirmPermenantDeletionComponent } from '../company-management/modals/confirm-permenant-deletion/confirm-permenant-deletion.component';
import { CommonComponentsModule } from '../common-components/common-components.module';
import { CompanySwitchComponent } from './pages/company-switch/company-switch.component';
import { CompanySwitchV4Component } from './pages/v4/company-switch-v4.component';
import { DynamicPolicyComponent } from './components/dynamic-policy/dynamic-policy.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

import { faArrowRightFromBracket as farArrowRightFromBracket } from '@fortawesome/pro-regular-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';

/**
 * Redirects to the V4 company-switch page when the login response flag
 * `isV4LayoutEnabled` was stored as `1`; otherwise serves the existing page.
 */
const companySwitchV4Redirect = (): boolean | UrlTree => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);
  const isV4 = localStorageService.getItem('isV4LayoutEnabled') === 1;
  if (isV4) {
    return router.createUrlTree(['/manage/company_management/select']);
  }
  return true;
};

const routes: Routes = [
  { path: '', redirectTo: 'select_company_dashboard', pathMatch: 'full' },
  {
    path: 'select_company_dashboard',
    component: CompanySwitchComponent,
    canActivate: [companySwitchV4Redirect]
  },
  {
    path: 'select',
    component: CompanySwitchV4Component
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    AngularMaterialModule,
    CommonComponentsModule,
    FontAwesomeModule,
    CompanySwitchComponent,
    CompanySwitchV4Component,
    ConfirmPermenantDeletionComponent,
    DynamicPolicyComponent
  ]
})
export class CompanySwitchModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(farArrowRightFromBracket);
  }
}
