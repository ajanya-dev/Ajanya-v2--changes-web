import { HttpClientModule } from '@angular/common/http';
import { NgModule, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
/** Modules */
import { Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { AngularMaterialModule } from './angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';
/** Guards */
import { authGuard } from '../core/guards/core/auth.guard';
import { companySwitchingGuard } from '../core/guards/core/company-switching.guard';
import { authChildGuard } from '../core/guards/core/auth-child.guard';
import { thirdPartyV4RedirectGuard } from '../core/guards/core/thirdparty-v4-redirect.guard';
/** Components */
import { RestoreAcccountComponent } from './outside/pages/restore-acccount/restore-acccount.component';
import { V4RestoreAccountPageComponent } from './outside/pages/v4-restore-account/v4-restore-account-page.component';
import { NotFoundComponent } from './common-components/components/not-found/not-found.component';
import { ComingSoonComponent } from './common-components/components/coming-soon/coming-soon.component';
import { ManualAchComponent } from './receive-payments/components/manual-ach/manual-ach.component';
import { SubscriptionRequiredComponent } from './common-components/components/subscription-required/subscription-required.component';
import { PermissionDeniedComponent } from '../shared/components/permission-denied/permission-denied.component';
import { PermissionDeniedV4Component } from '../shared/components/permission-denied-v4/permission-denied-v4.component';
import { ComingSoonPageV4Component } from '../shared/V4/coming-soon-page-v4/coming-soon-page-v4.component';
import { NotFoundV4Component } from '../shared/V4/not-found-v4/not-found-v4.component';
import { SubscriptionPlanGuard } from '../core/guards/subscription/subscription-plan.guard';
import { SubscriptionDashBoardComponent } from './subscription/components/subscription-dash-board/subscription-dash-board.component';
import { ScriptService } from '../core/services/script.service';
import * as fromMainState from './store';
import { PayeesEffects } from './store/payees/payees.effects';
import { BankAccountsEffects } from './store/bankAccounts/bank-accounts.effects';
import { CardsEffects } from './store/cards/cards.effects';
import { WalletsEffects } from './store/wallets/wallets.effects';
import { CategoriesEffects } from './store/categories/categories.effects';
import { dynamicPolicyGuard } from '../core/guards/core/dynamic-policy.guard';
import { ContentLayoutV35Component } from '../layout/v3-layout/content-layout-v35/content-layout-v35.component';
import { CompanyManagementService } from '../shared/service/company/company-management.service';
import { CloudBankEffects } from './store/cloud-bank/cloud-bank.effects';
import { UserManagementEffects } from './store/userManagement/userManagement.effects';
import { IAppState } from '../store/app-state.model';
import { canActivatePayeeOnboarding } from '../core/guards/core/payee-onboarding.guard';
import { guestGuard } from '../core/guards/core/guest.guard';
import { ContentLayoutV4Component } from '../layout/v4-layout/content-layout-v4/content-layout-v4.component';

const routes: Routes = [
  /** Modules without sidebar and header */
  {
    path: 'checkdesign',
    canActivate: [authGuard, companySwitchingGuard, dynamicPolicyGuard],
    loadChildren: () =>
      import('./check-design/check-design.module').then(
        (mod) => mod.CheckDesignModule
      )
  },
  { path: 'restoreAccount', component: RestoreAcccountComponent },
  { path: 'v4/restoreAccount', component: V4RestoreAccountPageComponent },
  {
    path: 'sign-pdf-viewer/:id',
    loadComponent: () =>
      import(
        './business-tools/zil-sign/pages/sign-pdf-viewer/sign-pdf-viewer.component'
      ).then((c) => c.SignPdfViewerComponent)
  },
  {
    path: 'manage',
    canActivate: [authGuard],
    children: [
      {
        path: 'company_management',
        loadChildren: () =>
          import('./company-switch/company-switch.module').then(
            (m) => m.CompanySwitchModule
          ),
        data: { title: 'Select a Company' }
      }
    ]
  },
  {
    path: 'manage',
    canActivate: [authGuard],
    children: [
      {
        path: 'onboarding',
        loadChildren: () =>
          import('./onboarding/onboarding.module').then(
            (m) => m.OnboardingModule
          )
      }
    ]
  },

  {
    path: 'manage',
    canActivate: [authGuard, companySwitchingGuard, dynamicPolicyGuard],
    children: [
      {
        path: 'subscription',
        loadChildren: () =>
          import('./subscription/subscription.module').then(
            (m) => m.SubscriptionModule
          )
      }
    ]
  },

  {
    path: 'v4/manage',
    canActivate: [authGuard, companySwitchingGuard, dynamicPolicyGuard],
    children: [
      {
        path: 'subscription/completed',
        loadComponent: () =>
          import(
            './user-v4/pages/v4-subscription-completed/v4-subscription-completed.component'
          ).then((m) => m.V4SubscriptionCompletedComponent),
        data: { title: 'Subscription' }
      },
      {
        path: 'subscription/update-card/completed',
        loadComponent: () =>
          import(
            './user-v4/pages/v4-subscription-completed/v4-subscription-completed.component'
          ).then((m) => m.V4SubscriptionCompletedComponent),
        data: { title: 'Subscription' }
      },
      {
        path: 'subscription',
        loadChildren: () =>
          import('./subscription/subscription.module').then(
            (m) => m.SubscriptionModule
          )
      },
      {
        path: 'onboarding',
        loadChildren: () =>
          import('./onboarding/onboarding.module').then(
            (m) => m.OnboardingModule
          )
      }
    ]
  },

  /** Modules having sidebar and header */
  {
    path: 'manage',
    component: ContentLayoutV35Component,
    canActivate: [authGuard, companySwitchingGuard, dynamicPolicyGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'subscription/dashboard',
        component: SubscriptionDashBoardComponent,
        canActivate: [SubscriptionPlanGuard],
        data: { title: 'Billing/Plan' }
      },
      {
        path: 'verification',
        loadChildren: () =>
          import('./verification-center/verification-center.routes').then(
            (m) => m.routes
          )
      },
      {
        path: 'cheque',
        loadChildren: () =>
          import('./check/check.module').then((m) => m.CheckModule),
        data: { preload: true, loadAfterSeconds: 5 }
      },
      {
        path: 'bill',
        loadChildren: () =>
          import('./bill/bill.module').then((m) => m.BillModule),
        data: { preload: true, loadAfterSeconds: 6 }
      },
      {
        path: 'receivedchecks',
        loadChildren: () =>
          import('./receive-payments/receive-payments.module').then(
            (m) => m.ReceivePaymentsModule
          )
      },
      {
        path: 'checkdraft',
        loadChildren: () =>
          import('./check-draft/check-draft.module').then(
            (m) => m.CheckDraftModule
          )
      },
      {
        path: 'invoice',
        loadChildren: () =>
          import('./invoices/invoices.module').then((m) => m.InvoicesModule)
      },
      {
        path: 'payment-links',
        loadChildren: () =>
          import('./payment-links/payment-links.routes').then((r) => r.routes)
      },
      {
        path: 'cashexp',
        loadChildren: () =>
          import('./Cash-Expense/cash-expense.module').then(
            (m) => m.CashExpenseModule
          )
      },
      {
        path: 'central_accounting',
        loadChildren: () =>
          import('./central-report/central-report.module').then(
            (m) => m.CentralReportModule
          )
      },
      {
        path: 'depositslips',
        loadChildren: () =>
          import('./deposit-slip/deposit-slip.module').then(
            (m) => m.DepositSlipModule
          )
      },
      {
        path: 'bankaccount',
        loadChildren: () =>
          import('./bank/bank-v2/bank.module').then((m) => m.BankModule),
        data: { preload: true, loadAfterSeconds: 5 }
      },
      {
        path: 'payee',
        loadChildren: () =>
          import('./payee/payee-v2/payee.module').then((m) => m.PayeeModule),
        data: { preload: true, loadAfterSeconds: 5 }
      },
      {
        path: 'checkcatagory',
        loadChildren: () =>
          import('./category/category.module').then((m) => m.CategoryModule)
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./account-closing/account-closing.module').then(
            (m) => m.AccountClosingModule
          )
      },

      {
        path: 'company_management/index',
        loadChildren: () =>
          import('./company-management/company-management.module').then(
            (m) => m.CompanyManagementModule
          )
      },
      {
        path: 'manage-users',
        loadChildren: () =>
          import('./user-management/user-management.module').then(
            (m) => m.UserManagementModule
          )
      },
      {
        path: 'user-profile',
        loadChildren: () =>
          import('./user/user-v2/user.module').then((m) => m.UserModule)
      },
      {
        path: 'vendor-credit',
        loadChildren: () =>
          import('./vendor-credit/vendor-credit.module').then(
            (m) => m.VendorCreditModule
          )
      },
      {
        path: 'financialstatement',
        loadChildren: () =>
          import('./financial-statement/financial-statement.module').then(
            (m) => m.FinancialStatementModule
          )
      },
      {
        path: 'fdicbankaccount',
        loadChildren: () =>
          import('./cloud-bank/cloud-bank-v2/cloud-bank.module').then(
            (m) => m.CloudBankModule
          ),
        data: { preload: true, loadAfterSeconds: 5 }
      },
      {
        path: 'design',
        loadChildren: () =>
          import('./bank-design/bank-design.module').then(
            (m) => m.BankDesignModule
          )
      },
      {
        path: 'thirdparty_app',
        canActivate: [thirdPartyV4RedirectGuard],
        loadChildren: () =>
          import('./integration/integration.module').then(
            (m) => m.IntegrationModule
          )
      },
      { path: 'manualach/index', component: ManualAchComponent },

      {
        path: 'search',
        loadChildren: () =>
          import('./searches/searches.module').then((m) => m.SearchesModule)
      },
      {
        path: 'user-support',
        loadChildren: () =>
          import('./user-support/user-support.module').then(
            (m) => m.UserSupportModule
          )
      },
      {
        path: 'allMessages',
        loadChildren: () =>
          import('./user-support/user-support.module').then(
            (m) => m.UserSupportModule
          )
      },
      {
        path: 'positivepay',
        loadChildren: () =>
          import('./positive-pay/positive-pay.module').then(
            (m) => m.PositivePayModule
          )
      },
      {
        path: 'v4-positivepay',
        loadChildren: () =>
          import('./v4-positive-pay/v4-positive-pay.module').then(
            (m) => m.V4PositivePayModule
          )
      },
      {
        path: 'bankingAch',
        loadChildren: () => import('./ach/ach.module').then((m) => m.AchModule)
      },
      {
        path: 'shop',
        loadChildren: () =>
          import('./shop/shop.module').then((m) => m.ShopModule)
      },
      {
        path: 'developer',
        loadChildren: () =>
          import('./developer-panel/developer-panel.module').then(
            (m) => m.DeveloperPanelModule
          )
      },
      {
        path: 'coupon',
        loadChildren: () =>
          import('./coupon/coupon.module').then((m) => m.CouponModule)
      },
      {
        path: 'checkmailing',
        loadChildren: () =>
          import('./check-recurring/check-recurring.module').then(
            (m) => m.CheckRecurringModule
          )
      },
      {
        path: 'more',
        loadChildren: () =>
          import('./more/more.module').then((m) => m.MoreModule)
      },
      {
        path: 'affiliate',
        loadChildren: () =>
          import('./more/more.module').then((m) => m.MoreModule)
      },
      { path: 'coming-soon', component: ComingSoonComponent },
      {
        path: 'marketplace',
        component: ComingSoonComponent,
        data: { title: 'Marketplace' }
      },
      { path: 'permission-denied', component: PermissionDeniedComponent },
      {
        path: 'subscription-required',
        component: SubscriptionRequiredComponent,
        data: { title: 'Subscription' }
      },
      {
        path: 'trial-period-over',
        loadChildren: () =>
          import('./trial-period-alert/trial-period-alert.module').then(
            (m) => m.TrialPeriodAlertModule
          )
      },
      {
        path: 'working-capital',
        loadChildren: () =>
          import('./business-tools/plexe/plexe.module').then(
            (m) => m.PlexeModule
          )
      },
      {
        path: 'refill-credit',
        loadChildren: () =>
          import('./refill-credit/refill-credit.module').then(
            (m) => m.RefillCreditModule
          )
      },

      // From v3

      {
        path: 'payees',
        loadChildren: () =>
          import('./payee/payee-v3/payee-ocw-v3.module').then(
            (m) => m.PayeeOcwV3Module
          )
      },
      {
        path: 'payments-table',
        loadChildren: () =>
          import('./v3-payments-table/v3-payments-table.module').then(
            (m) => m.V3PaymentsTableModule
          )
      },
      {
        path: 'bank-accounts',
        loadChildren: () =>
          import('./bank/bank-v3/bank-v3.module').then((m) => m.BankOcwV3Module)
      },
      {
        path: 'cards',
        loadChildren: () =>
          import('./cards/cards-ocw-v3.module').then((m) => m.CardsOcwV3Module)
      },
      {
        path: 'payee-onboarding',
        canActivate: [canActivatePayeeOnboarding],
        loadChildren: () =>
          import('./payee-onboarding/payee-onboarding.route').then(
            (m) => m.payeeOnboardingRoutes
          )
      },
      {
        path: 'business-tools',
        loadChildren: () =>
          import('./business-tools/business-tools.module').then(
            (m) => m.BusinessToolsModule
          )
      },
      {
        path: 'payroll-card',
        loadChildren: () =>
          import('./payroll-by-card/payroll-by-card.module').then(
            (m) => m.PayrollModule
          )
      },
      {
        path: 'virtual-card',
        loadChildren: () =>
          import('./virtual-card/virtual-card.routes').then((m) => m.routes)
      },
      {
        path: 'home',
        loadChildren: () =>
          import('./home/home.module').then((m) => m.HomeModule),
        data: { preload: true, loadAfterSeconds: 5 }
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./payments/payments.module').then((m) => m.PaymentsModule)
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./user/user-v3/user-ocw-v3.module').then(
            (m) => m.UserOcwV3Module
          )
      },
      {
        path: 'group-payments',
        loadChildren: () =>
          import('./group-payments/group-payments.module').then(
            (m) => m.GroupPaymentsModule
          )
      },
      {
        path: 'transfers',
        loadChildren: () =>
          import('./transfers/transfers-ocw-v3.module').then(
            (m) => m.TransfersOcwV3Module
          )
      },
      {
        path: 'cloud-bank',
        loadChildren: () =>
          import('./cloud-bank/cloud-bank-v3/cloud-bank-v3.module').then(
            (m) => m.CloudBankV3Module
          )
      },
      {
        path: 'bulk-payments',
        loadChildren: () =>
          import('./v3-bulk-payment/v3-bulk-payment.module').then(
            (m) => m.V3BulkPaymentModule
          )
      },
      {
        path: 'wallet',
        loadChildren: () =>
          import('./wallet/wallet-v3/wallet-ocw-v3.module').then(
            (m) => m.WalletOcwV3Module
          )
      },
      {
        path: 'virtual-card',
        loadChildren: () =>
          import('./virtual-card/virtual-card.route').then((m) => m.routes)
      },
      {
        path: 'international-payment',
        loadChildren: () =>
          import('./international-payment/international-payment.routes').then(
            (m) => m.internationalPaymentRoutes
          )
      },
      {
        path: 'application-error',
        loadChildren: () =>
          import('./application-errors/application-error.routes').then(
            (m) => m.applicationErrorRoutes
          )
      }
    ]
  },

  /** Modules having sidebar and header for V4 */
  {
    path: 'v4',
    children: [
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./auth/components/register-v4/register-v4.component').then(
            (c) => c.RegisterV4Component
          ),
        data: { title: 'Register' }
      },
      {
        path: 'manage',
        component: ContentLayoutV4Component,
        canActivate: [authGuard, companySwitchingGuard, dynamicPolicyGuard],
        canActivateChild: [authChildGuard],
        children: [
          {
            path: '',
            redirectTo: 'home',
            pathMatch: 'full'
          },
          {
            path: 'v4-theme',
            loadComponent: () =>
              import(
                '../layout/v4-layout/v4-theme-showcase/v4-theme-showcase.component'
              ).then((m) => m.V4ThemeShowcaseComponent)
          },
          {
            path: 'home',
            loadComponent: () =>
              import('./v4-pages/v4-dashboard/v4-dashboard.component').then(
                (m) => m.V4DashboardComponent
              ),
            data: { title: 'Dashboard' }
          },
          {
            path: 'payables',
            loadComponent: () =>
              import('./v4-main-pages/v4-payables/v4-payables.component').then(
                (m) => m.V4PayablesComponent
              ),
            data: { title: 'Payables' }
          },
          {
            path: 'receivables',
            loadComponent: () =>
              import(
                './v4-main-pages/v4-receivables/v4-receivables.component'
              ).then((m) => m.V4ReceivablesComponent),
            data: { title: 'Receivables' }
          },
          {
            path: 'business-tools-overview',
            loadComponent: () =>
              import(
                './v4-main-pages/v4-business-tools/v4-business-tools.component'
              ).then((m) => m.V4BusinessToolsComponent),
            data: { title: 'Business Tools' }
          },
          {
            path: 'accounts',
            loadComponent: () =>
              import('./v4-main-pages/v4-accounts/v4-accounts.component').then(
                (m) => m.V4AccountsComponent
              ),
            data: { title: 'Accounts' }
          },
          {
            path: 'services',
            loadComponent: () =>
              import('./v4-main-pages/v4-services/v4-services.component').then(
                (m) => m.V4ServicesComponent
              ),
            data: { title: 'Services' }
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./v4-main-pages/v4-settings/v4-settings.component').then(
                (m) => m.V4SettingsComponent
              ),
            data: { title: 'Settings' }
          },
          {
            path: 'payments-out',
            loadChildren: () =>
              import('./payments-v4/payments-out/payments-out.routes').then(
                (m) => m.paymentsOutRoutes
              )
          },
          {
            path: 'payments',
            loadChildren: () =>
              import(
                './payments-v4/send-receive-page/send-receive-page.routes'
              ).then((m) => m.sendReceivePageRoutes)
          },
          {
            path: 'recent-transaction',
            loadChildren: () =>
              import(
                './payments-v4/recent-transaction/recent-transaction.routes'
              ).then((m) => m.recentTransactionRoutes)
          },
          {
            path: 'transaction-history/:payeeId/:type',
            loadComponent: () =>
              import(
                './payments-v4/payments-out/components/v4-check-list/payee-summary/v4-payee-summary.component'
              ).then((m) => m.V4PayeeSummaryComponent)
          },
          {
            path: 'subscription/dashboard',
            component: SubscriptionDashBoardComponent,
            canActivate: [SubscriptionPlanGuard],
            data: { title: 'Billing/Plan' }
          },
          {
            path: 'verification',
            loadChildren: () =>
              import(
                './verification-center-v4/verification-center-v4.routes'
              ).then((m) => m.routes),
            data: { title: 'Verification Center' }
          },
          {
            path: 'cheque',
            loadChildren: () =>
              import('./check/check.module').then((m) => m.CheckModule),
            data: { preload: true, loadAfterSeconds: 5 }
          },
          {
            path: 'bill',
            loadChildren: () =>
              import('./bill/v4-bills/v4-bills.routes').then(
                (m) => m.v4BillsRoutes
              ),
            data: { preload: true, loadAfterSeconds: 6 }
          },
          {
            path: 'vendor-credits',
            loadChildren: () =>
              import('./v4-vendor-credits/v4-vendor-credits.routes').then(
                (m) => m.v4VendorCreditsRoutes
              )
          },
          {
            path: 'receivedchecks',
            loadChildren: () =>
              import('./receive-payments/receive-payments.module').then(
                (m) => m.ReceivePaymentsModule
              )
          },
          {
            path: 'checkdraft',
            loadChildren: () =>
              import('./v4-check-draft/v4-check-draft.module').then(
                (m) => m.V4CheckDraftModule
              )
          },
          {
            path: 'invoice',
            loadChildren: () =>
              import('./v4-invoices/v4-invoices.module').then(
                (m) => m.V4InvoicesModule
              )
          },
          {
            path: 'payment-links',
            loadChildren: () =>
              import(
                './v4-pages/v4-payment-links/v4-payment-links.routes'
              ).then((r) => r.v4PaymentLinksRoutes),
            data: { title: 'Payment Link' }
          },
          {
            path: 'cashexp',
            loadChildren: () =>
              import('./cash-expense-v4/cash-expense-v4.routes').then(
                (r) => r.cashExpenseV4Routes
              )
          },
          {
            path: 'central_accounting',
            loadChildren: () =>
              import('./central-report-v4/central-report-v4.routes').then(
                (r) => r.centralReportV4Routes
              )
          },
          {
            path: 'depositslips',
            loadChildren: () =>
              import(
                './deposit-slip/deposit-slip-v4/deposit-slip-v4.routes'
              ).then((m) => m.depositSlipV4Routes)
          },
          {
            path: 'bankaccount',
            loadChildren: () =>
              import('./bank/bank-v2/bank.module').then((m) => m.BankModule),
            data: { preload: true, loadAfterSeconds: 5 }
          },
          {
            path: 'payee',
            loadChildren: () =>
              import('./payee/payee-v2/payee.module').then(
                (m) => m.PayeeModule
              ),
            data: { preload: true, loadAfterSeconds: 5, title: 'Payees' }
          },
          {
            path: 'checkcatagory',
            loadChildren: () =>
              import('./category/v4-category/v4-category.routes').then(
                (m) => m.v4CategoryRoutes
              )
          },
          {
            path: 'settings',
            loadChildren: () =>
              import('./account-closing/account-closing.module').then(
                (m) => m.AccountClosingModule
              )
          },

          {
            path: 'company_management/index',
            loadChildren: () =>
              import(
                './company-management/company-management-v4/company-management-v4.routes'
              ).then((m) => m.COMPANY_MANAGEMENT_V4_ROUTES)
          },
          {
            path: 'manage-users',
            loadChildren: () =>
              import('./user-management-v4/user-management-v4.routes').then(
                (m) => m.userManagementV4Routes
              )
          },
          {
            path: 'user-profile',
            loadChildren: () =>
              import('./user-v4/v4-user.routes').then((m) => m.v4UserRoutes)
          },
          {
            path: 'financialstatement',
            loadChildren: () =>
              import(
                './financial-statement/v4-financial-statement/v4-financial-statement.module'
              ).then((m) => m.financialStatementV4Routes)
          },
          {
            path: 'fdicbankaccount',
            loadChildren: () =>
              import('./cloud-bank/cloud-bank-v2/cloud-bank.module').then(
                (m) => m.CloudBankModule
              ),
            data: { preload: true, loadAfterSeconds: 5 }
          },
          {
            path: 'design',
            loadChildren: () =>
              import('./bank-design/bank-design.module').then(
                (m) => m.BankDesignModule
              )
          },
          {
            path: 'thirdparty_app/index',
            loadComponent: () =>
              import(
                './v4-integrations/pages/v4-integration-main/v4-integration-main.component'
              ).then((m) => m.V4IntegrationMainComponent),
            data: { title: 'App Integrations' }
          },
          {
            path: 'thirdparty_app',
            loadChildren: () =>
              import('./integration/integration.module').then(
                (m) => m.IntegrationModule
              )
          },
          { path: 'manualach/index', component: ManualAchComponent },

          {
            path: 'search',
            loadChildren: () =>
              import('./searches/searches.module').then((m) => m.SearchesModule)
          },
          {
            path: 'user-support',
            loadChildren: () =>
              import('./user-support-v4/v4-user-support.module').then(
                (m) => m.v4UserSupportRoutes
              )
          },
          {
            path: 'positivepay',
            loadChildren: () =>
              import('./v4-positive-pay/v4-positive-pay.module').then(
                (m) => m.V4PositivePayModule
              )
          },
          {
            path: 'bankingAch',
            loadChildren: () =>
              import('./ach/ach.module').then((m) => m.AchModule)
          },
          {
            path: 'shop',
            loadChildren: () =>
              import('./shop/shop.module').then((m) => m.ShopModule)
          },
          {
            path: 'developer',
            loadChildren: () =>
              import(
                './developer-panel/v4-developer-panel/v4-developer-panel.routes'
              ).then((r) => r.v4DeveloperPanelRoutes)
          },
          {
            path: 'coupon',
            loadChildren: () =>
              import('./coupon/coupon.module').then((m) => m.CouponModule)
          },
          {
            path: 'checkmailing',
            loadChildren: () =>
              import('./check-recurring/check-recurring.module').then(
                (m) => m.CheckRecurringModule
              )
          },
          {
            path: 'more/notification/show',
            loadComponent: () =>
              import(
                './more/pages/notification-view-all-v4/notification-view-all-v4.component'
              ).then((m) => m.NotificationViewAllV4Component)
          },
          {
            path: 'more',
            loadChildren: () =>
              import('./more/v4-more/v4-more.module').then(
                (m) => m.moreV4Routes
              )
          },
          {
            path: 'affiliate',
            loadChildren: () =>
              import('./more/more.module').then((m) => m.MoreModule)
          },
          {
            path: 'coming-soon',
            component: ComingSoonPageV4Component,
            data: {
              subtitle:
                "We're building something exciting to help you grow your business. Stay tuned! you'll be able to experience exciting new features and enhancements soon."
            }
          },
          {
            path: 'marketplace',
            component: ComingSoonPageV4Component,
            data: {
              title: 'Marketplace',
              subtitle:
                "We're building something exciting to help you grow your business. Stay tuned! you'll be able to experience exciting new features and enhancements soon."
            }
          },
          { path: 'permission-denied', component: PermissionDeniedV4Component },
          { path: 'not-found', component: NotFoundV4Component },
          {
            path: 'subscription-required',
            component: SubscriptionRequiredComponent,
            data: { title: 'Subscription' }
          },
          {
            path: 'trial-period-over',
            loadChildren: () =>
              import('./trial-period-alert/trial-period-alert.module').then(
                (m) => m.TrialPeriodAlertModule
              )
          },
          {
            path: 'working-capital',
            loadChildren: () =>
              import('./business-tools/plexe/plexe.module').then(
                (m) => m.PlexeModule
              )
          },
          {
            path: 'refill-credit',
            loadChildren: () =>
              import('./v4-refill-credit/v4-refill-credit.routes').then(
                (m) => m.v4RefillCreditRoutes
              )
          },
          {
            path: 'cards',
            loadChildren: () =>
              import('./cards/components/v4/cards.routes').then(
                (m) => m.cardsV4Routes
              ),
            data: { title: 'My Cards' }
          },
          {
            path: 'bank-accounts',
            loadChildren: () =>
              import('./bank/bank-v4/bank-v4.routes').then(
                (m) => m.bankV4Routes
              ),
            data: { title: 'Bank Accounts' }
          },
          {
            path: 'payments-in',
            loadChildren: () =>
              import('./v4/payments-in/payments-in-v4.routes').then(
                (m) => m.paymentsInV4Routes
              ),
            data: { title: 'Payments In' }
          },
          {
            path: 'wallets',
            loadChildren: () =>
              import('./wallet/wallet-v4/wallet-v4.routes').then(
                (m) => m.walletV4Routes
              ),
            data: { title: 'Wallets' }
          },

          // From v3

          {
            path: 'payees',
            loadChildren: () =>
              import('./payee/payee-v4/payee-v4.routes').then(
                (m) => m.payeeV4Routes
              ),
            data: { title: 'Customers' }
          },
          {
            path: 'payments-table',
            loadChildren: () =>
              import('./v3-payments-table/v3-payments-table.module').then(
                (m) => m.V3PaymentsTableModule
              )
          },

          {
            path: 'payee-onboarding',
            canActivate: [canActivatePayeeOnboarding],
            loadChildren: () =>
              import('./payee-onboarding/payee-onboarding.route').then(
                (m) => m.payeeOnboardingRoutes
              )
          },
          {
            path: 'business-tools/mail-dashboard',
            loadChildren: () =>
              import(
                './business-tools/mailing-dashboard/v4-mailing-dashboard/mailing-dashboard-v4.routes'
              ).then((r) => r.mailingDashboardV4Routes),
            data: { title: 'Mailing Dashboard' }
          },
          {
            path: 'business-tools/document-mail',
            loadChildren: () =>
              import(
                './business-tools/document-mail/v4-document-mail/document-mail-v4.routes'
              ).then((r) => r.documentMailV4Routes),
            data: { title: 'Mail Document' }
          },
          {
            path: 'business-tools/shipping-label',
            loadChildren: () =>
              import(
                './v4-business-tools/v4-shipping-label/v4-shipping-label.routes'
              ).then((m) => m.routes),
            data: { title: 'Shipping Label' }
          },
          {
            path: 'business-tools',
            loadChildren: () =>
              import('./business-tools/business-tools.module').then(
                (m) => m.BusinessToolsModule
              )
          },
          {
            path: 'v4-business-tools',
            loadChildren: () =>
              import('./v4-business-tools/v4-business-tools.route').then(
                (m) => m.routes
              )
          },
          {
            path: 'payroll-card',
            loadChildren: () =>
              import('./payroll-by-card-4/payroll-by-card.module').then(
                (m) => m.PayrollModule
              )
          },
          {
            path: 'virtual-card',
            loadChildren: () =>
              import('./virtual-card-v4/virtual-card-v4.routes').then(
                (m) => m.virtualCardV4Routes
              ),
            data: { title: 'Issue Visa Card' }
          },
          {
            path: 'home',
            loadChildren: () =>
              import('./home/home.module').then((m) => m.HomeModule),
            data: { preload: true, loadAfterSeconds: 5 }
          },
          {
            path: 'payments',
            loadChildren: () =>
              import('./payments/payments.module').then((m) => m.PaymentsModule)
          },
          {
            path: 'users',
            loadChildren: () =>
              import('./user/user-v3/user-ocw-v3.module').then(
                (m) => m.UserOcwV3Module
              )
          },
          {
            path: 'group-payments',
            loadChildren: () =>
              import('./group-payments/group-payments.module').then(
                (m) => m.GroupPaymentsModule
              )
          },
          {
            path: 'transfers',
            loadChildren: () =>
              import('./transfers/transfers-ocw-v3.module').then(
                (m) => m.TransfersOcwV3Module
              )
          },
          {
            path: 'cloud-bank',
            component: ComingSoonPageV4Component,
            data: {
              title: 'Cloud Bank',
              subtitle:
                "We're building something exciting to help you grow your business. Stay tuned! you'll be able to experience exciting new features and enhancements soon."
            }
          },
          {
            path: 'bulk-payments',
            loadChildren: () =>
              import('./v4-bulk-payment/v4-bulk-payment.routes').then(
                (m) => m.routes
              ),
            data: { title: 'Bulk Payment Center' }
          },
          {
            path: 'wallet',
            loadChildren: () =>
              import('./wallet/wallet-v3/wallet-ocw-v3.module').then(
                (m) => m.WalletOcwV3Module
              )
          },
          {
            path: 'virtual-card',
            loadChildren: () =>
              import('./virtual-card/virtual-card.route').then((m) => m.routes)
          },
          {
            path: 'international-payment',
            loadChildren: () =>
              import(
                './international-payment/v4/international-payment-v4.routes'
              ).then((m) => m.internationalPaymentV4Routes)
          },
          {
            path: 'application-error',
            loadChildren: () =>
              import('./application-errors/application-error.routes').then(
                (m) => m.applicationErrorRoutes
              )
          }
        ]
      }
    ]
  },

  /** Outside pages */
  { path: 'everify', redirectTo: '/outside/everify', pathMatch: 'full' },
  {
    path: 'everify-details',
    redirectTo: '/outside/everify-details',
    pathMatch: 'full'
  },

  {
    path: 'outside',
    loadChildren: () =>
      import('./outside/outside.module').then((m) => m.OutsideModule)
  },

  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    StoreModule.forFeature(
      fromMainState.mainStateFeatureKey,
      fromMainState.reducers
    ),
    EffectsModule.forFeature([
      PayeesEffects,
      BankAccountsEffects,
      CardsEffects,
      WalletsEffects,
      CategoriesEffects,
      fromMainState.MainStateEffects,
      CloudBankEffects,
      UserManagementEffects
    ])
  ],
  providers: [DecimalPipe]
})
export class MainModule {
  private store = inject(Store<IAppState>);
  private scriptService = inject(ScriptService);
  private companyManagementService = inject(CompanyManagementService);

  constructor() {
    this.scriptService.blockClickjacking();
    this.statesResetOnCompanyChange();
  }

  /**
   * Resets states in the store when the company changes.
   * Subscribes to the company change observable and dispatches the reset action.
   */
  statesResetOnCompanyChange() {
    this.companyManagementService.getCompanyChange$.subscribe(() => {
      this.store.dispatch(
        fromMainState.mainStateActions.resetStatesOnCompanyChange()
      );
    });
  }
}
