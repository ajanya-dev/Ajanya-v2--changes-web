import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomPreloadingStrategyService } from './core/services/custom-preloading-strategy.service';
import { authGuard } from './core/guards/core/auth.guard';
import { companySwitchingGuard } from './core/guards/core/company-switching.guard';
import { neverLeave } from './core/guards/never-leave.guard';
import { ComplianceFreezeComponent } from './modules/compliance-freeze/compliance-freeze.component';
import { SwitchAppComponent } from './modules/common-components/components/switch-app/switch-app.component';
import { V4_EXTERNAL_PATH } from './shared/utils/v4-external.util';

const routes: Routes = [
  {
    path: 'compliance-freeze',
    component: ComplianceFreezeComponent,
    canDeactivate: [neverLeave]
  },
  {
    path: 'switch-app',
    component: SwitchAppComponent
  },
  {
    path: V4_EXTERNAL_PATH,
    loadChildren: () =>
      import('./modules/external/v4-external.module').then(
        (m) => m.V4ExternalModule
      )
  },
  /**
   * @description external module used to include pages provided externally as services which should not be redirected to main page. external module has some scripts disabled
   */
  {
    path: 'external',
    loadChildren: () =>
      import('./modules/external/external.module').then(
        (mod) => mod.ExternalModule
      )
  },
  {
    path: 'emailTemplate',
    canActivate: [authGuard, companySwitchingGuard],
    loadChildren: () =>
      import(
        './modules/email-template-design/email-template-design.module'
      ).then((m) => m.EmailTemplateDesignModule)
  },
  {
    path: 'v4/emailTemplate',
    canActivate: [authGuard, companySwitchingGuard],
    loadChildren: () =>
      import(
        './modules/email-template-design/email-template-design.module'
      ).then((m) => m.EmailTemplateDesignModule)
  },
  {
    path: 'intro-tour',
    canActivate: [authGuard, companySwitchingGuard],
    loadChildren: () =>
      import('./modules/intro-tour/intro-tour.module').then(
        (mod) => mod.IntroTourModule
      )
  },
  /**
   * @description Page Shopify loads inside its admin iframe (the app's App URL).
   * No guards: the merchant has no OCW session there, and storage is partitioned.
   */
  {
    path: 'shopify',
    loadComponent: () =>
      import('./modules/shopify-embedded/shopify-embedded.component').then(
        (m) => m.ShopifyEmbeddedComponent
      )
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((mod) => mod.AuthModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: CustomPreloadingStrategyService
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
