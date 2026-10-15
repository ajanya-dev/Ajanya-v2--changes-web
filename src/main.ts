import {
  enableProdMode,
  ErrorHandler,
  importProvidersFrom,
  APP_INITIALIZER
} from '@angular/core';
import { Router } from '@angular/router';
import * as Sentry from '@sentry/angular';

import { environment } from './environments/environment';

//--------------Ag-grid Enterprice key----------------------------
import { LicenseManager } from '@ag-grid-enterprise/core';
import { AppComponent } from './app/app.component';
import { StripeModule } from 'stripe-angular';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { reducers } from './app/store';
import { StoreModule } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BankModalModule } from './app/shared/bank-modal/bank-modal.module';
import { YodleeModule } from './app/shared/yodlee/yodlee.module';
import { AlertModule } from './app/shared/alert/alert.module';
import { V3LayoutModule } from './app/layout/v3-layout/v3-layout.module';
import { NpsModule } from './app/modules/nps/nps.module';
import { PayeeModalModule } from './app/shared/modal/payee-modal/payee-modal.module';
import { CommonComponentsModule } from './app/modules/common-components/common-components.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AngularMaterialModule } from './app/modules/angular-material/angular-material.module';
import { SharedModule } from './app/shared/shared.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import {
  Title,
  BrowserModule,
  bootstrapApplication
} from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { ErrorHandlingInterceptor } from './app/core/interceptor/error-handling.interceptor';
import { V4ErrorHandlingInterceptor } from './app/core/interceptor/v4-error-handling.interceptor';
import { InterceptorService } from './app/core/interceptor/interceptor.service';
import {
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
  provideHttpClient
} from '@angular/common/http';
import {
  provideEnvironmentNgxMask,
  IConfig,
  NgxMaskDirective,
  NgxMaskPipe
} from 'ngx-mask';
import SentryErrorHandler from './app/sentry.handler';
import { AttributionService } from './app/core/services/attribution.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS_V4 } from './app/shared/V4/lucide-icons';

const maskConfigFunction: () => Partial<IConfig> = () => ({
  validation: false
});

LicenseManager.setLicenseKey(
  'Using_this_AG_Grid_Enterprise_key_( AG-044893 )_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_( legal@ag-grid.com )___For_help_with_changing_this_key_please_contact_( info@ag-grid.com )___( OnlineCheckWriter.com )_is_granted_a_( Single Application )_Developer_License_for_the_application_( OnlineCheckWriter )_only_for_( 1 )_Front-End_JavaScript_developer___All_Front-End_JavaScript_developers_working_on_( OnlineCheckWriter )_need_to_be_licensed___( OnlineCheckWriter )_has_been_granted_a_Deployment_License_Add-on_for_( 1 )_Production_Environment___This_key_works_with_AG_Grid_Enterprise_versions_released_before_( 6 August 2024 )____[v2]_MTcyMjg5ODgwMDAwMA==d637f61f0026507af4fb1351a0ced4a5'
);
//----------------------------------------------------------------

// import {Workbox} from 'workbox-window';

if (environment.production) {
  enableProdMode();
}

// Initialize Sentry as early as possible, before bootstrapping Angular.
// Reporting is gated to production (non-dev) builds, mirroring the previous
// Atatus behavior.
if (environment.production && !environment.isItDev) {
  Sentry.init({
    dsn: 'https://901e2021f61081078b822a6a4fa77bb9@sentry.zilmoney.com/7',
    // Send default PII data (e.g. automatic IP address collection on events).
    sendDefaultPii: true,
    environment: environment.env_id,
    release: environment.version,
    integrations: [Sentry.browserTracingIntegration()],
    // Capture performance traces for all transactions.
    tracesSampleRate: 1.0
  });
}

if (environment.version) {
  document.appendChild(
    document.createComment('Version ' + environment.version)
  );
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      FormsModule,
      ReactiveFormsModule,
      NgxMaskDirective,
      NgxMaskPipe,
      SharedModule,
      AngularMaterialModule,
      DragDropModule,
      CommonComponentsModule,
      PayeeModalModule,
      NpsModule,
      RecaptchaV3Module,
      V3LayoutModule,
      AlertModule,
      YodleeModule,
      BankModalModule,
      FontAwesomeModule,
      LucideAngularModule.pick(LUCIDE_ICONS_V4),
      StoreModule.forRoot(reducers),
      StoreDevtoolsModule.instrument({
        maxAge: 10,
        logOnly: environment.production,
        connectInZone: true
      }),
      EffectsModule.forRoot([]),
      StripeModule.forRoot(''),
      ServiceWorkerModule.register('serviceworker.js', {
        enabled: environment.production,
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
      })
    ),
    provideEnvironmentNgxMask(maskConfigFunction),
    { provide: ErrorHandler, useClass: SentryErrorHandler },
    { provide: Sentry.TraceService, deps: [Router] },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true
    },
    {
      // Freezes the landing attribution before the router's first navigation
      // strips the query string. An app initializer is the last moment the
      // original URL — gclid, utm_source, utm_campaign, site_identifier — is
      // still readable, and register_success is built from what it stores.
      provide: APP_INITIALIZER,
      useFactory: (attributionService: AttributionService) => () =>
        attributionService.captureLandingAttribution(),
      deps: [AttributionService],
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlingInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: V4ErrorHandlingInterceptor,
      multi: true
    },
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment?.recaptcha?.siteKey
    },
    {
      provide: 'googleTagManagerId',
      useValue:
        environment?.ocw_trackers?.googleTagManager?.data?.key || 'GTM-STAGING'
    },
    DatePipe,
    Title,
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi())
  ]
}).catch((err) => {});