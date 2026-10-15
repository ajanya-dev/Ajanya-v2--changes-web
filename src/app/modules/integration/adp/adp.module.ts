import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { YodleeModule } from 'src/app/shared/yodlee/yodlee.module';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faAngleRight,
  faBuildingColumns,
  faCircle,
  faCircleCheck,
  faCircleInfo,
  faEye,
  faEyeSlash,
  faGear,
  faInfoCircle,
  faMobile,
  faPenToSquare,
  faPlus,
  faTimes,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AdpViewComponent } from './pages/adp-view/adp-view.component';
import { AdpPayrollComponent } from './pages/adp-payroll/adp-payroll.component';
import { AdpCompanySetupComponent } from './pages/adp-company-setup/adp-company-setup.component';
import { OnboardingForIntegratedUsersComponent } from './pages/onboarding-for-integrated-users/onboarding-for-integrated-users.component';
import { PayrollTransactionsAdpComponent } from './pages/payroll-transactions-adp/payroll-transactions-adp.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { UserSupportModule } from '../../user-support/user-support.module';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { AdpPayrollRefillMethodComponent } from './components/adp-payroll-refill-method/adp-payroll-refill-method.component';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';

const routes: Routes = [
  {
    path: 'setup/:id/:name',
    component: AdpCompanySetupComponent
  },
  {
    path: 'adp-view/:userStatus',
    component: AdpViewComponent
  },
  {
    path: 'adp-view',
    component: AdpViewComponent
  },
  {
    path: 'adp-payroll/:id/:name',
    component: AdpPayrollComponent
  },
  {
    path: 'payroll-transactions',
    component: PayrollTransactionsAdpComponent
  },
  {
    path: 'onboard',
    component: OnboardingForIntegratedUsersComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    DropDownBankComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    FormsModule,
    FontAwesomeModule,
    YodleeModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    MatTooltipModule,
    DataTableModule,
    V3DataTableModule,
    CommonButtonV35Component,
    UserSupportModule,
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    AdpViewComponent,
    AdpPayrollComponent,
    AdpCompanySetupComponent,
    OnboardingForIntegratedUsersComponent,
    PayrollTransactionsAdpComponent,
    AdpPayrollRefillMethodComponent
  ]
})
export class AdpModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faEye,
      faEyeSlash,
      faGear,
      faCircleInfo,
      faCircleCheck,
      faCircle,
      faTrash,
      faPlus,
      faTimes,
      faPenToSquare,
      faInfoCircle,
      faAngleRight,
      faMobile,
      faBuildingColumns
    );
  }
}
