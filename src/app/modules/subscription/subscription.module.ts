import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { SubscriptionPlanGuard } from 'src/app/core/guards/subscription/subscription-plan.guard';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { DropDownBankProComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-pro/drop-down-bank-pro.component';
import {
  faArrowLeft,
  faCalendar,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faEdit,
  faEnvelope,
  faHeadset,
  faMessage,
  faPlus,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { CommonHelpButtonComponent } from 'src/app/layout/v3-layout/common-help-button/common-help-button.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { DataTableModule } from '../data-table/data-table.module';
import { SubscriptionDashBoardComponent } from './components/subscription-dash-board/subscription-dash-board.component';
import { InvoiceTableSubscriptionComponent } from './components/invoice-table-subscription/invoice-table-subscription.component';
import { SubscriptionCompletedComponent } from './pages/subscription-completed/subscription-completed.component';
import { SubscriptionMainComponent } from './pages/subscription-main/subscription-main.component';
import { SubPlanComparisonComponent } from './components/sub_components/sub-plan-comparison/sub-plan-comparison.component';
import { SubAddonComponent } from './components/sub-addon-list/sub-addon-list.component';
import { SubBillingAddressComponent } from './components/sub-billing-address/sub-billing-address.component';
import { SubscriptionPaymentComponent } from './components/subscription-payment/subscription-payment.component';
import { SubBiilingCalculationComponent } from './components/sub_components/sub-biiling-calculation/sub-biiling-calculation.component';
import { SubscriptionWarningModalComponent } from './modals/subscription-warning-modal/subscription-warning-modal.component';
import { SubscriptionKycRequiredWarningModalComponent } from './pages/subscription-kyc-required-warning-modal/subscription-kyc-required-warning-modal.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'plan',
    pathMatch: 'full'
  },
  {
    path: 'plan',
    component: SubscriptionMainComponent,
    canActivate: [SubscriptionPlanGuard],
    data: { title: 'Subscription' }
  },
  {
    path: 'plan/change',
    component: SubscriptionMainComponent,
    canActivate: [SubscriptionPlanGuard],
    data: { title: 'Subscription' }
  },
  {
    path: 'plan/change-addon',
    component: SubscriptionMainComponent,
    canActivate: [SubscriptionPlanGuard],
    data: { title: 'Subscription' }
  },
  {
    path: 'plan/change-payment',
    component: SubscriptionMainComponent,
    canActivate: [SubscriptionPlanGuard],
    data: { title: 'Subscription' }
  },
  {
    path: 'plan/change-payment/card',
    component: SubscriptionMainComponent,
    canActivate: [SubscriptionPlanGuard],
    data: { title: 'Subscription' }
  },
  {
    path: 'plan/change-payment/update-card',
    component: SubscriptionMainComponent,
    canActivate: [SubscriptionPlanGuard],
    data: { title: 'Subscription' }
  },
  {
    path: 'completed',
    component: SubscriptionCompletedComponent,
    data: { title: 'Subscription' }
  },
  {
    path: 'update-card/completed',
    component: SubscriptionCompletedComponent,
    data: { title: 'Subscription' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    AngularMaterialModule,
    SharedModule,
    DropDownBankProComponent,
    PipesModule,
    NgSelectModule,
    DataTableModule,
    V3DataTableModule,
    NgxMaskDirective,
    NgxMaskPipe,
    FontAwesomeModule,
    CommonHelpButtonComponent,
    CommonButtonV35Component,
    SubscriptionDashBoardComponent,
    InvoiceTableSubscriptionComponent,
    SubscriptionCompletedComponent,
    SubscriptionMainComponent,
    SubPlanComparisonComponent,
    SubAddonComponent,
    SubBillingAddressComponent,
    SubscriptionPaymentComponent,
    SubBiilingCalculationComponent,
    SubscriptionWarningModalComponent,
    SubscriptionKycRequiredWarningModalComponent
  ]
})
export class SubscriptionModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faChevronRight,
      faPlus,
      faChevronLeft,
      faXmark,
      faCalendar,
      faArrowLeft,
      faCircleExclamation,
      faMessage,
      faEnvelope,
      faHeadset,
      faEdit
    );
  }
}
