import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { faCircleCheck, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { V3PaymentsTableSharedModule } from '../v3-payments-table/shared/v3-payments-table-shared.module';
import { ShortcutsModaleV3Component } from './components/shortcuts-modale-v3/shortcuts-modale-v3.component';
import { PaymentSharedModule } from '../payments/shared/payment-shared.module';
import { WhiteLabelPipe } from '../../pipes/white-label.pipe';
import { HomeV35Component } from './pages/home-v35/home-v35.component';

const routes: Routes = [
  { path: '', component: HomeV35Component, data: { title: 'Home Page' } }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    PaymentSharedModule,
    V3PaymentsTableSharedModule,
    WhiteLabelPipe,
    WhiteLabelDirective,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    HomeV35Component,
    ShortcutsModaleV3Component
  ]
})
export class HomeModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faCircleCheck, faXmark);
  }
}
