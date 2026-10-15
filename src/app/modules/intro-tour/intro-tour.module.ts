import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authChildGuard } from 'src/app/core/guards/core/auth-child.guard';
import { authGuard } from 'src/app/core/guards/core/auth.guard';
import { companySwitchingGuard } from 'src/app/core/guards/core/company-switching.guard';
import { dynamicPolicyGuard } from 'src/app/core/guards/core/dynamic-policy.guard';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faArrowRightLong,
  faBadge,
  faBadgeCheck,
  faBallotCheck,
  faCalendar,
  faCalendarDays,
  faCircleQuestion,
  faClone,
  faExchange,
  faEye,
  faPenToSquare,
  faPencil,
  faSquareList
} from '@fortawesome/pro-solid-svg-icons';
import { ReactiveFormsModule } from '@angular/forms';
import { IntroTourLayoutComponent } from './components/intro-tour-layout/intro-tour-layout.component';
import { IntroHomeComponent } from './pages/intro-home/intro-home.component';
import { IntroPaymentSuccessComponent } from './pages/intro-payment-success/intro-payment-success.component';
import { IntroPaymentTableComponent } from './pages/intro-payment-table/intro-payment-table.component';
import { IntroPayeesComponent } from './pages/intro-payees/intro-payees.component';
import { IntroBankAcountsComponent } from './pages/intro-bank-acounts/intro-bank-acounts.component';
import {IntroGuard} from '../../core/guards/core/intro-guards/introGuard';

const routes: Routes = [
  { path: '', redirectTo: 'manage', pathMatch: 'full' },
  {
    path: 'manage',
    component: IntroTourLayoutComponent,
    canActivate: [authGuard, companySwitchingGuard, dynamicPolicyGuard],
    canActivateChild: [authChildGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: IntroHomeComponent,
        canActivate: [IntroGuard],
        data: { title: 'Intro tour' }
      },
      {
        path: 'payment-success',
        component: IntroPaymentSuccessComponent,
        canActivate: [IntroGuard],
        data: { title: 'Intro tour' }
      },
      {
        path: 'payment-table',
        component: IntroPaymentTableComponent,
        canActivate: [IntroGuard],
        data: { title: 'Intro tour' }
      },
      {
        path: 'payees',
        component: IntroPayeesComponent,
        data: { title: 'Intro tour' }
      },
      {
        path: 'bank-accounts',
        component: IntroBankAcountsComponent,
        data: { title: 'Intro tour' }
      }
    ]
  }
];

ModuleRegistry.registerModules([ServerSideRowModelModule]);

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
    FontAwesomeModule,
    ReactiveFormsModule
  ]
})
export class IntroTourModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCalendar,
      faCalendarDays,
      faArrowRightLong,
      faSquareList,
      faPenToSquare,
      faCircleQuestion,
      faClone,
      faExchange,
      faBallotCheck,
      faEye,
      faBadge,
      faPencil,
      faBadgeCheck
    );
  }
}
