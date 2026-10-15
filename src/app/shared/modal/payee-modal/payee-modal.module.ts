import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddPayeeModalComponent } from './add-payee-modal/add-payee-modal.component';
import { SharedModule } from '../../shared.module';
import { AddBankDetailModalComponent } from './modal/add-bank-detail-modal/add-bank-detail-modal.component';
import { AddPayeeModalPersonalDetailsCompComponent } from './components/add-payee-modal-personal-details-comp/add-payee-modal-personal-details-comp.component';
import { AddPayeeBankAccComponent } from './components/add-payee-bank-acc/add-payee-bank-acc.component';
import { RequestPayeeModalComponent } from './modal/request-payee-modal/request-payee-modal.component';
import { DefaultPaymentMethodComponent } from './default-payment-method/default-payment-method.component';
import { AddPayeeInternationalBankAccountComponent } from './modal/add-payee-international-bank-account/add-payee-international-bank-account.component';
import { NewPhoneInputComponent } from '../../components/new-phone-input/new-phone-input.component';
import { DropDownCategoryComponent } from '../../components/drop-downs/drop-down-category/drop-down-category.component';
import { BankModalModule } from '../../bank-modal/bank-modal.module';
import { CommonInputFieldComponent } from '../../v3/common-input-field/common-input-field.component';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { V35CommonDropDownSelectorComponent } from '../../v3/v35-dropdown/v35-common-dropdown-selector.component';
import {
  faAddressCard,
  faArrowLeft,
  faBuildingColumns,
  faCircleCheck,
  faCircleQuestion,
  faGear,
  faGlobe,
  faPenToSquare,
  faPlus,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonCountryDropDownComponent } from '../../v3/common-country-drop-down/common-country-drop-down.component';

@NgModule({
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    DropDownCategoryComponent,
    NewPhoneInputComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    NgSelectModule,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    V35CommonDropDownSelectorComponent,
    BankModalModule,
    FontAwesomeModule,
    CommonCountryDropDownComponent,
    NgOptimizedImage,
    AddPayeeModalComponent,
    AddBankDetailModalComponent,
    AddPayeeModalPersonalDetailsCompComponent,
    AddPayeeBankAccComponent,
    RequestPayeeModalComponent,
    DefaultPaymentMethodComponent,
    AddPayeeInternationalBankAccountComponent
  ]
})
export class PayeeModalModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faBuildingColumns,
      faGlobe,
      faGear,
      faAddressCard,
      faPenToSquare,
      faCircleQuestion,
      faArrowLeft,
      faCircleCheck,
      faTrash,
      faPlus
    );
  }
}
