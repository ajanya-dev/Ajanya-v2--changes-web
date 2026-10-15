import { V3PaymentViewComponent } from './shared/components/v3-payment-view/v3-payment-view.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { V3PaymentsTableComponent } from './shared/components/v3-payments-table/v3-payments-table.component';
import { V3PaymentsTableSharedModule } from './shared/v3-payments-table-shared.module';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faA,
  faArrowDownToLine,
  faArrowLeft,
  faArrowTrendUp,
  faArrowUpToLine,
  faBuildingColumns,
  faCaretDown,
  faCaretUp,
  faCircle,
  faCircleCheck,
  faCircleInfo,
  faCreditCardFront,
  faEnvelope,
  faExternalLink,
  faHourglassEnd,
  faPrint,
  faR,
  faTrash,
  faUpToLine,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: V3PaymentsTableComponent,
    data: { title: 'Payments' }
  },
  {
    path: 'check',
    component: V3PaymentsTableComponent,
    data: { title: 'Payments' }
  },
  {
    path: 'recurring',
    component: V3PaymentsTableComponent,
    data: { title: 'Recurring' }
  },
  {
    path: 'payment-view/:id',
    component: V3PaymentViewComponent,
    data: { title: 'Payment View' }
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    V3PaymentsTableSharedModule,
    CommonBackButtonV35Component,
    FontAwesomeModule
  ]
})
export class V3PaymentsTableModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faUpToLine,
      faArrowTrendUp,
      faArrowUpToLine,
      faArrowDownToLine,
      faCreditCardFront,
      faBuildingColumns,
      faCircleInfo,
      faCaretDown,
      faCircleCheck,
      faCircle,
      faArrowLeft,
      faCircleCheck,
      faHourglassEnd,
      faExternalLink,
      faTrash,
      faCaretDown,
      faCaretUp,
      faPrint,
      faEnvelope,
      faA,
      faR
    );
  }
}
