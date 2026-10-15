import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import {
  faCalendar,
  faCircle,
  faCircleCheck,
  faPlus,
  faQuestionCircle,
  faTags,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { CommonCountryDropDownComponent } from 'src/app/shared/v3/common-country-drop-down/common-country-drop-down.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { CreateShippingLabelIndexComponent } from './pages/create-shipping-label-index/create-shipping-index.component';
import { DeliveryAddressLabelComponent } from './components/delivery-address-label/delivery-address-label.component';
import { ExistingShippingAddressComponent } from './components/existing-shipping-address/existing-shipping-address.component';
import { FromAddressLabelComponent } from './components/from-address-label/from-address-label.component';
import { PackageShippingLabelComponent } from './components/package-shipping-label/package-shipping-label.component';
import { ShippingLabelServicesComponent } from './components/shipping-label-services/shipping-label-services.component';
import { AddAddressModalComponent } from './modals/add-address-modal/add-address-modal.component';
import { ShippingLabelListComponent } from './pages/shipping-label-list/shipping-label-list.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { ViewShippingLabelComponent } from './modals/view-shipping-label/view-shipping-label.component';
import { CreateQuickLabelComponent } from './pages/create-quick-label/create-quick-label.component';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';

const routes: Routes = [
  {
    path: '',
    component: ShippingLabelListComponent
  },
  {
    path: 'create',
    component: CreateShippingLabelIndexComponent
  },
  {
    path: 'quick-label',
    component: CreateQuickLabelComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    DropDownPayeeComponent,
    OcwBackButtonComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    ReactiveFormsModule,
    FormsModule,
    AngularMaterialModule,
    DataTableModule,
    NgSelectModule,
    CommonCountryDropDownComponent,
    V3DataTableModule,
    ShippingLabelListComponent,
    CreateShippingLabelIndexComponent,
    DeliveryAddressLabelComponent,
    FromAddressLabelComponent,
    PackageShippingLabelComponent,
    ExistingShippingAddressComponent,
    ShippingLabelServicesComponent,
    CreateQuickLabelComponent,
    AddAddressModalComponent,
    ViewShippingLabelComponent
  ]
})
export class ShippingLabelModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCircleCheck,
      faCircle,
      faQuestionCircle,
      faTrash,
      faPlus,
      faCalendar,
      faTags
    );
  }
}
