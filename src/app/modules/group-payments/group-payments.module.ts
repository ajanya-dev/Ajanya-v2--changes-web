import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PaymentSourceTypeDropdownComponent } from 'src/app/shared/components/v3/drop-downs/payment-source-type-dropdown/payment-source-type-dropdown.component';
import { PaymentMethodDropdownComponent } from 'src/app/shared/components/v3/drop-downs/payment-method-dropdown/payment-method-dropdown.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentSourceDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payment-source-dropdown-v3/payment-source-dropdown-v3.component';
import { CategoryDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import {
  faArrowLeft,
  faCircle,
  faCircleCheck,
  faCircleExclamation,
  faInfoCircle,
  faMinus,
  faPenToSquare,
  faPlus,
  faSpinnerThird,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { GroupNameModalComponent } from './modals/group-name-modal/group-name-modal.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { GroupPaymentsTableComponent } from './pages/group-payments-table/group-payments-table.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import * as fromStore from './store/groupPayments.reducer';

import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { StoreEffects } from './store/groupPayments.effects';
import { GroupPaymentsComponent } from './components/group-payments/group-payments.component';
import { GroupPaymentPageComponent } from './pages/group-payment-page/group-payment-page.component';

const routes: Routes = [
  {
    path: 'main',
    component: GroupPaymentPageComponent,
    data: { title: 'Bulk Payment' }
  },
  {
    path: 'main/:id',
    component: GroupPaymentPageComponent,
    data: { title: 'Bulk Payment' }
  },
  {
    path: 'table',
    component: GroupPaymentsTableComponent,
    data: { title: 'Bulk Payment' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    AngularMaterialModule,
    PaymentSourceTypeDropdownComponent,
    PaymentMethodDropdownComponent,
    PayeeDropdownV3Component,
    PaymentSourceDropdownV3Component,
    CategoryDropdownV3Component,
    V3DataTableModule,
    StoreModule.forFeature(
      fromStore.storeFeatureKey,
      fromStore.groupPaymentsFeature.reducer
    ),
    EffectsModule.forFeature([StoreEffects]),
    CommonButtonV35Component,
    GroupPaymentPageComponent,
    GroupPaymentsComponent,
    GroupNameModalComponent,
    GroupPaymentsTableComponent
  ]
})
export class GroupPaymentsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCircleExclamation,
      faCircleCheck,
      faCircle,
      faTrash,
      faPlus,
      faMinus,
      faSpinnerThird,
      faInfoCircle,
      faArrowLeft,
      faPenToSquare
    );
  }
}
